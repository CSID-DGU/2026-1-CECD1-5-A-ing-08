package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RadarXTest {

    // 저장 형식(변환 후 점수). 모든 차원이 level → 3: 41점, 5: 100점, 1: 0점
    private static Map<String, Object> scores(int level) {
        return Map.of("vulnerabilityLevel", level, "dissentLevel", level, "initiativeLevel", level);
    }

    @Test
    void rawModeBelowFourResponses() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(scores(5), List.of(scores(3), scores(1)));

        assertThat(x.mode()).isEqualTo("raw");
        assertThat(x.value()).isEqualTo(100.0);
    }

    @Test
    void centeredModeFromFourResponses() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(scores(5), List.of(scores(3), scores(3), scores(1)));

        assertThat(x.mode()).isEqualTo("centered");
        // 100 - mean(41, 41, 0) = 100 - 27.33
        assertThat(x.value()).isEqualTo(72.7);
    }

    @Test
    void noSurveyGivesNullRaw() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(null, List.of());

        assertThat(x.value()).isNull();
        assertThat(x.mode()).isEqualTo("raw");
    }
}
