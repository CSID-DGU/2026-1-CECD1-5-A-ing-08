package com.readb.service.talk;

import com.readb.domain.talk.ClassifiedSpeech;
import com.readb.domain.talk.SpeakerProfile;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class AudioAnalyzerTest {
    private final AudioAnalyzer analyzer = new AudioAnalyzer();

    private byte[] tone(double amplitude, double hz, int durationMs) {
        int count = 16000 * durationMs / 1000;
        byte[] pcm = new byte[count * 2];
        for (int i = 0; i < count; i++) {
            short value = (short) (amplitude * Short.MAX_VALUE * Math.sin(2 * Math.PI * hz * i / 16000));
            pcm[i * 2] = (byte) value;
            pcm[i * 2 + 1] = (byte) (value >>> 8);
        }
        return pcm;
    }

    @Test
    void referenceNeedsAtLeastOneSecondOfSpeech() {
        assertThatThrownBy(() -> analyzer.extractProfile(new byte[16000 * 5 * 2]))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void spectralAndPitchFeaturesIgnoreLoudnessDifference() {
        SpeakerProfile leader = analyzer.extractProfile(tone(0.4, 180, 5000));
        SpeakerProfile member = analyzer.extractProfile(tone(0.4, 320, 5000));

        ClassifiedSpeech result = analyzer.classifyChunk(tone(0.08, 180, 3000), leader, member);

        assertThat(result.leaderMs()).isGreaterThan(2500);
        assertThat(result.memberMs()).isZero();
    }

    @Test
    void shortReplyIsUnclassifiedRatherThanAssignedToLeader() {
        SpeakerProfile leader = analyzer.extractProfile(tone(0.4, 180, 5000));
        SpeakerProfile member = analyzer.extractProfile(tone(0.4, 320, 5000));

        ClassifiedSpeech result = analyzer.classifyChunk(tone(0.4, 320, 300), leader, member);

        assertThat(result.leaderMs()).isZero();
        assertThat(result.memberMs()).isZero();
        assertThat(result.unclassifiedMs()).isGreaterThan(0);
    }
}
