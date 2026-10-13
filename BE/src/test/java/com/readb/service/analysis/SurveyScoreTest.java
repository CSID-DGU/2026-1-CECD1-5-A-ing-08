package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SurveyScoreTest {

    // v2 저장 형식(raw 응답). 인자는 변환 후 점수가 모두 level이 되도록 역문항 Q1·Q2를 뒤집어 넣는다
    private static Map<String, Object> v2(int level) {
        return Map.of("version", "v2", "q1", 6 - level, "q2", 6 - level, "q3", level);
    }

    private static Map<String, Object> v1(int level) {
        return Map.of("version", "v1", "vulnerabilityLevel", level, "dissentLevel", level, "initiativeLevel", level);
    }

    @Test
    void reversesQ1Q2() {
        // raw q1=1, q2=1 → 변환 5,5 / q3=5 → 모두 5점
        assertThat(AnalysisService.computeSurveyScore(Map.of("version", "v2", "q1", 1, "q2", 1, "q3", 5)))
                .isEqualTo(100.0);
        assertThat(AnalysisService.computeSurveyScore(Map.of("version", "v2", "q1", 5, "q2", 5, "q3", 1)))
                .isEqualTo(0.0);
    }

    @Test
    void v2ScoreUsesSameScaleAsV1() {
        assertThat(AnalysisService.computeSurveyScore(v2(3))).isEqualTo(41.0);   // 모두 3점
        assertThat(AnalysisService.computeSurveyScore(v1(3))).isEqualTo(41.0);
    }

    @Test
    void incompleteV2GivesNull() {
        assertThat(AnalysisService.computeSurveyScore(Map.of("version", "v2", "q1", 3))).isNull();
    }
}
