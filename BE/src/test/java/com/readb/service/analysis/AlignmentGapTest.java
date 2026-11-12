package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AlignmentGapTest {

    private static final String TRANSCRIPT = """
            요즘 커리어 방향이 고민이에요
            그럼 다음 주까지 제가 사내 교육 목록을 정리해서 공유할게요
            """;

    @Test
    void 주제별_점수를_평균내고_원문_인용과_타임스탬프를_붙인다() {
        Map<String, Object> parsed = Map.of("topics", List.of(
                topic("커리어 방향", "ACTION_ITEM", evidence("요즘 커리어 방향이 고민이에요", 754)),
                topic("배포 일정", "NOT_MENTIONED", null)));

        AnalysisService.AlignmentResult result = AnalysisService.computeAlignment(parsed, TRANSCRIPT, false);

        assertThat(result.score()).isEqualTo(50.0);
        assertThat(result.detail()).isEqualTo(
                "'커리어 방향' — 논의 후 다음 할 일까지 정함 (12:34 \"요즘 커리어 방향이 고민이에요\")\n"
                        + "'배포 일정' — 미팅에서 언급되지 않음");
    }

    @Test
    void 전사에_없는_인용은_싣지_않는다() {
        Map<String, Object> parsed = Map.of("topics", List.of(
                topic("커리어 방향", "BRIEF", evidence("커리어 고민이 많습니다", 10))));

        AnalysisService.AlignmentResult result = AnalysisService.computeAlignment(parsed, TRANSCRIPT, false);

        assertThat(result.score()).isEqualTo(40.0);
        assertThat(result.detail()).isEqualTo("'커리어 방향' — 짧게 언급만 됨");
    }

    @Test
    void 화자_라벨이_없으면_묵살_판정을_짧은_언급으로_낮춘다() {
        Map<String, Object> parsed = Map.of("topics", List.of(topic("커리어 방향", "RAISED_NO_RESPONSE", null)));

        assertThat(AnalysisService.computeAlignment(parsed, TRANSCRIPT, false).score()).isEqualTo(40.0);
        assertThat(AnalysisService.computeAlignment(parsed, TRANSCRIPT, true).score()).isEqualTo(25.0);
    }

    @Test
    void 알_수_없는_status나_빈_응답은_측정_불가로_처리한다() {
        assertThat(AnalysisService.computeAlignment(
                Map.of("topics", List.of(topic("커리어", "MAYBE", null))), TRANSCRIPT, false).score()).isNull();
        assertThat(AnalysisService.computeAlignment(Map.of("topics", List.of()), TRANSCRIPT, false).score()).isNull();
        assertThat(AnalysisService.computeAlignment(Map.of(), TRANSCRIPT, false).score()).isNull();
    }

    @Test
    void 주제는_최대_3개까지만_반영한다() {
        Map<String, Object> parsed = Map.of("topics", List.of(
                topic("A", "ACTION_ITEM", null), topic("B", "ACTION_ITEM", null),
                topic("C", "ACTION_ITEM", null), topic("D", "NOT_MENTIONED", null)));

        assertThat(AnalysisService.computeAlignment(parsed, TRANSCRIPT, false).score()).isEqualTo(100.0);
    }

    private Map<String, Object> topic(String topic, String status, Map<String, Object> evidence) {
        Map<String, Object> t = new HashMap<>();
        t.put("topic", topic);
        t.put("status", status);
        t.put("evidence", evidence);
        return t;
    }

    private Map<String, Object> evidence(String text, int timestamp) {
        return Map.of("text", text, "timestamp", timestamp);
    }
}
