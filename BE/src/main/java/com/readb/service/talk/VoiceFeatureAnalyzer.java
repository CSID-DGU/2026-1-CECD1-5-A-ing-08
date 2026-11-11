package com.readb.service.talk;

import com.readb.domain.talk.ClassifiedSpeech;
import com.readb.domain.talk.SpeakerProfile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Compares utterances by spectral shape and pitch, never by absolute loudness. */
final class VoiceFeatureAnalyzer {
    private static final int SAMPLE_RATE = 16000;
    private static final int ACTIVITY_SAMPLES = 800; // 50 ms
    private static final int FEATURE_SAMPLES = 400;  // 25 ms
    private static final int FEATURE_STEP = 160;     // 10 ms
    private static final int FFT_SIZE = 512;
    private static final int BANDS = 20;
    private static final double VAD_THRESHOLD = 0.01;
    private static final double[] MEL_CENTERS = melCenters();

    SpeakerProfile extractProfile(byte[] pcm) {
        short[] samples = decode(pcm);
        SpeakerProfile profile = features(samples, 0, samples.length);
        if (profile.speechMs() < 1000) {
            throw new IllegalArgumentException("기준 발화에 음성이 충분하지 않습니다.");
        }
        return profile;
    }

    ClassifiedSpeech classifyChunk(byte[] pcm, SpeakerProfile leader, SpeakerProfile member) {
        short[] samples = decode(pcm);
        boolean[] active = activity(samples);
        long leaderMs = 0, memberMs = 0, unclassifiedMs = 0;
        int start = -1, lastActive = -1;
        for (int frame = 0; frame <= active.length; frame++) {
            if (frame < active.length && active[frame]) {
                if (start < 0) start = frame;
                lastActive = frame;
            }
            if (start >= 0 && (frame == active.length || frame - lastActive > 3)) {
                long speechMs = activeDuration(active, start, lastActive + 1);
                if (speechMs < 600) {
                    unclassifiedMs += speechMs;
                } else {
                    SpeakerProfile candidate = features(samples, start * ACTIVITY_SAMPLES,
                            Math.min(samples.length, (lastActive + 1) * ACTIVITY_SAMPLES));
                    double leaderDistance = distance(candidate, leader, member);
                    double memberDistance = distance(candidate, member, leader);
                    double confidence = Math.abs(leaderDistance - memberDistance)
                            / Math.max(0.01, leaderDistance + memberDistance);
                    if (confidence < 0.12) unclassifiedMs += speechMs;
                    else if (leaderDistance < memberDistance) leaderMs += speechMs;
                    else memberMs += speechMs;
                }
                start = -1;
            }
        }
        return new ClassifiedSpeech(leaderMs, memberMs, unclassifiedMs);
    }

    private static short[] decode(byte[] pcm) {
        short[] samples = new short[pcm.length / 2];
        for (int i = 0; i < samples.length; i++) {
            samples[i] = (short) (((pcm[i * 2 + 1] & 0xff) << 8) | (pcm[i * 2] & 0xff));
        }
        return samples;
    }

    private static boolean[] activity(short[] samples) {
        boolean[] result = new boolean[samples.length / ACTIVITY_SAMPLES];
        for (int frame = 0; frame < result.length; frame++) {
            double sum = 0;
            int start = frame * ACTIVITY_SAMPLES;
            for (int i = 0; i < ACTIVITY_SAMPLES; i++) {
                double value = samples[start + i] / 32768.0;
                sum += value * value;
            }
            result[frame] = Math.sqrt(sum / ACTIVITY_SAMPLES) >= VAD_THRESHOLD;
        }
        return result;
    }

    private static long activeDuration(boolean[] active, int start, int end) {
        long ms = 0;
        for (int i = start; i < end; i++) if (active[i]) ms += 50;
        return ms;
    }

    private static SpeakerProfile features(short[] samples, int start, int end) {
        double[] spectral = new double[BANDS];
        List<Double> pitches = new ArrayList<>();
        int count = 0;
        for (int offset = start; offset + FEATURE_SAMPLES <= end; offset += FEATURE_STEP) {
            double[] signal = new double[FFT_SIZE];
            double energy = 0;
            for (int i = 0; i < FEATURE_SAMPLES; i++) {
                double value = samples[offset + i] / 32768.0;
                energy += value * value;
                signal[i] = value * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FEATURE_SAMPLES - 1)));
            }
            if (Math.sqrt(energy / FEATURE_SAMPLES) < VAD_THRESHOLD) continue;
            double[] power = powerSpectrum(signal);
            double total = Arrays.stream(power).sum() + 1e-12;
            for (int band = 0; band < BANDS; band++) {
                double value = 0;
                for (int bin = 1; bin < power.length; bin++) {
                    double hz = bin * (double) SAMPLE_RATE / FFT_SIZE;
                    value += power[bin] * triangle(hz, MEL_CENTERS[band],
                            MEL_CENTERS[band + 1], MEL_CENTERS[band + 2]);
                }
                spectral[band] += Math.log((value + 1e-9) / total);
            }
            double pitch = pitch(signal);
            if (pitch > 0) pitches.add(Math.log(pitch));
            count++;
        }
        if (count == 0) return new SpeakerProfile(spectral, Double.NaN, 0);
        for (int i = 0; i < spectral.length; i++) spectral[i] /= count;
        pitches.sort(Double::compareTo);
        double logPitch = pitches.isEmpty() ? Double.NaN : pitches.get(pitches.size() / 2);
        boolean[] active = activity(Arrays.copyOfRange(samples, start, end));
        return new SpeakerProfile(spectral, logPitch, activeDuration(active, 0, active.length));
    }

    private static double distance(SpeakerProfile candidate, SpeakerProfile reference, SpeakerProfile other) {
        double[] c = candidate.spectralShape();
        double[] r = reference.spectralShape();
        double[] o = other.spectralShape();
        double difference = 0, separation = 0;
        for (int i = 0; i < c.length; i++) {
            difference += Math.pow(c[i] - r[i], 2);
            separation += Math.pow(r[i] - o[i], 2);
        }
        double spectral = Math.sqrt(difference / c.length)
                / Math.max(0.6, Math.sqrt(separation / c.length));
        if (Double.isNaN(candidate.logPitch()) || Double.isNaN(reference.logPitch())
                || Double.isNaN(other.logPitch())) return spectral;
        double pitchSeparation = Math.abs(reference.logPitch() - other.logPitch());
        double pitch = Math.abs(candidate.logPitch() - reference.logPitch())
                / Math.max(0.12, pitchSeparation);
        double pitchWeight = pitchSeparation >= 0.08 ? 0.45 : 0.15;
        return (1 - pitchWeight) * spectral + pitchWeight * pitch;
    }

    private static double[] powerSpectrum(double[] signal) {
        double[] real = Arrays.copyOf(signal, FFT_SIZE);
        double[] imag = new double[FFT_SIZE];
        for (int i = 1, j = 0; i < FFT_SIZE; i++) {
            int bit = FFT_SIZE >> 1;
            for (; (j & bit) != 0; bit >>= 1) j ^= bit;
            if (i < j) {
                double temp = real[i]; real[i] = real[j]; real[j] = temp;
            }
        }
        for (int length = 2; length <= FFT_SIZE; length <<= 1) {
            double angle = -2 * Math.PI / length;
            for (int offset = 0; offset < FFT_SIZE; offset += length) {
                for (int j = 0; j < length / 2; j++) {
                    double cos = Math.cos(angle * j), sin = Math.sin(angle * j);
                    int left = offset + j, right = left + length / 2;
                    double tr = real[right] * cos - imag[right] * sin;
                    double ti = real[right] * sin + imag[right] * cos;
                    real[right] = real[left] - tr;
                    imag[right] = imag[left] - ti;
                    real[left] += tr;
                    imag[left] += ti;
                }
            }
        }
        double[] power = new double[FFT_SIZE / 2 + 1];
        for (int i = 0; i < power.length; i++) power[i] = real[i] * real[i] + imag[i] * imag[i];
        return power;
    }

    private static double pitch(double[] signal) {
        double best = 0;
        int bestLag = 0;
        for (int lag = 40; lag <= 320; lag++) {
            double dot = 0, left = 0, right = 0;
            for (int i = 0; i < FEATURE_SAMPLES - lag; i++) {
                dot += signal[i] * signal[i + lag];
                left += signal[i] * signal[i];
                right += signal[i + lag] * signal[i + lag];
            }
            double correlation = dot / Math.sqrt(left * right + 1e-12);
            if (correlation > best) { best = correlation; bestLag = lag; }
        }
        return best >= 0.68 ? (double) SAMPLE_RATE / bestLag : 0;
    }

    private static double[] melCenters() {
        double[] centers = new double[BANDS + 2];
        double maxMel = 2595 * Math.log10(1 + 4000.0 / 700);
        for (int i = 0; i < centers.length; i++) {
            double mel = maxMel * i / (centers.length - 1);
            centers[i] = 700 * (Math.pow(10, mel / 2595) - 1);
        }
        return centers;
    }

    private static double triangle(double hz, double left, double center, double right) {
        if (hz <= left || hz >= right) return 0;
        return hz < center ? (hz - left) / (center - left) : (right - hz) / (right - center);
    }
}
