package com.readb.domain.talk;

import java.util.Arrays;

/** A voice reference made from speech only; loudness is deliberately excluded. */
public record SpeakerProfile(double[] spectralShape, double logPitch, long speechMs) {
    public SpeakerProfile {
        spectralShape = Arrays.copyOf(spectralShape, spectralShape.length);
    }

    @Override
    public double[] spectralShape() {
        return Arrays.copyOf(spectralShape, spectralShape.length);
    }
}
