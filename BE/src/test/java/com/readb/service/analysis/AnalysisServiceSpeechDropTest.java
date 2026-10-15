package com.readb.service.analysis;

import com.readb.domain.analysis.Analysis;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AnalysisServiceSpeechDropTest {

    @Test
    void selectsLargestQualifyingDrop() {
        List<Long> meetings = List.of(3L, 2L, 1L);
        List<Analysis> analyses = List.of(
                analysis(3L, acts(1, 2, 0)),
                analysis(2L, acts(5, 5, 2)),
                analysis(1L, acts(5, 5, 2)));

        assertThat(AnalysisService.detectSpeechDropSignal(meetings, analyses)).isEqualTo("V");
    }

    @Test
    void doesNotTreatSmallChangeOrMissingLatestAsDrop() {
        List<Long> meetings = List.of(3L, 2L);
        assertThat(AnalysisService.detectSpeechDropSignal(meetings,
                List.of(analysis(3L, acts(1, 0, 0)), analysis(2L, acts(2, 0, 0)))))
                .isNull();
        assertThat(AnalysisService.detectSpeechDropSignal(meetings,
                List.of(analysis(3L, acts(3, 0, 0)), analysis(2L, acts(5, 0, 0)))))
                .isNull();
        assertThat(AnalysisService.detectSpeechDropSignal(meetings,
                List.of(analysis(2L, acts(5, 0, 0)))))
                .isNull();
    }

    @Test
    void selectsInitiativeWhenItHasTheLargestDrop() {
        List<Long> meetings = List.of(3L, 2L);
        assertThat(AnalysisService.detectSpeechDropSignal(meetings,
                List.of(analysis(3L, acts(1, 3, 0)), analysis(2L, acts(3, 5, 6)))))
                .isEqualTo("I");
    }

    @Test
    void ignoresMissingSpeechActFieldInsteadOfTreatingItAsZero() {
        List<Long> meetings = List.of(3L, 2L);
        List<Analysis> analyses = List.of(
                analysis(3L, Map.of("initiative", List.of())),
                analysis(2L, Map.of("vulnerability", List.of(1, 2, 3, 4))));

        assertThat(AnalysisService.detectSpeechDropSignal(meetings, analyses)).isNull();
    }

    private Analysis analysis(Long meetingId, Map<String, Object> speechActs) {
        return Analysis.builder().meetingId(meetingId).speechActs(speechActs).build();
    }

    private Map<String, Object> acts(int v, int d, int i) {
        return Map.of(
                "vulnerability", java.util.Collections.nCopies(v, "발화"),
                "constructiveDissent", java.util.Collections.nCopies(d, "발화"),
                "initiative", java.util.Collections.nCopies(i, "발화"));
    }
}
