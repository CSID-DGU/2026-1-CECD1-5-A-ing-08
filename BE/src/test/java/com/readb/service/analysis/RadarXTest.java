package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RadarXTest {

    // 변환 후 점수가 모두 level이 되도록 역문항 Q1·Q2를 뒤집어 넣는다 (3 → 41점, 5 → 100점, 1 → 0점)
    private static Map<String, Object> v2(int level) {
        return Map.of("version", "v2", "q1", 6 - level, "q2", 6 - level, "q3", level);
    }

    private static Map<String, Object> v1(int level) {
        return Map.of("version", "v1", "vulnerabilityLevel", level, "dissentLevel", level, "initiativeLevel", level);
    }

    @Test
    void rawModeBelowFourResponses() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(v2(5), List.of(v2(3), v2(1)));

        assertThat(x.mode()).isEqualTo("raw");
        assertThat(x.value()).isEqualTo(100.0);
    }

    @Test
    void centeredModeFromFourResponses() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(v2(5), List.of(v2(3), v2(3), v2(1)));

        assertThat(x.mode()).isEqualTo("centered");
        // 100 - mean(41, 41, 0) = 100 - 27.33
        assertThat(x.value()).isEqualTo(72.7);
    }

    @Test
    void doesNotMixV1IntoV2PersonalMean() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(v2(5), List.of(v1(3), v1(3), v1(3), v2(1)));

        assertThat(x.mode()).isEqualTo("raw");
        assertThat(x.value()).isEqualTo(100.0);
    }

    @Test
    void noSurveyGivesNullRaw() {
        AnalysisService.RadarX x = AnalysisService.computeRadarX(null, List.of());

        assertThat(x.value()).isNull();
        assertThat(x.mode()).isEqualTo("raw");
    }
}
