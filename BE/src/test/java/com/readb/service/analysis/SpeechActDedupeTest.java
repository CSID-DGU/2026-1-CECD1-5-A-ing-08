package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SpeechActDedupeTest {

    @Test
    @SuppressWarnings("unchecked")
    void target이_없으면_유형별로_같은_turn은_한_번만_센다() {
        Map<String, Object> acts = new HashMap<>();
        acts.put("vulnerability", List.of(
                Map.of("text", "잘 몰라서 막막해요", "timestamp", 12),
                Map.of("text", "감도 안 와요", "timestamp", 12.0),
                Map.of("text", "몸이 무거워요", "timestamp", 40),
                Map.of("text", "타임스탬프 없음")));
        acts.put("initiative", List.of(Map.of("text", "스테이징에 먼저 띄워볼게요", "timestamp", 12)));
        Map<String, Object> step2 = new HashMap<>(Map.of("speechActs", acts));

        AnalysisService.dedupeSpeechActsByTarget(step2);

        List<Map<String, Object>> v = (List<Map<String, Object>>) acts.get("vulnerability");
        assertThat(v).extracting(m -> m.get("text"))
                .containsExactly("잘 몰라서 막막해요", "몸이 무거워요", "타임스탬프 없음");
        assertThat((List<?>) acts.get("initiative")).hasSize(1);
    }

    @Test
    @SuppressWarnings("unchecked")
    void 같은_turn에서_사안이_다르면_각각_세고_같으면_한_번만_센다() {
        Map<String, Object> acts = new HashMap<>();
        acts.put("constructiveDissent", List.of(
                Map.of("text", "비용이 계속 나갈 것 같아요", "timestamp", 586, "target", "외부 라이브러리 도입"),
                Map.of("text", "이번 주 안에는 무리예요", "timestamp", 586, "target", "이번 주 일정"),
                Map.of("text", "예시를 안 주는 게 나아요", "timestamp", 586, "target", "외부라이브러리 도입")));
        Map<String, Object> step2 = new HashMap<>(Map.of("speechActs", acts));

        AnalysisService.dedupeSpeechActsByTarget(step2);

        List<Map<String, Object>> d = (List<Map<String, Object>>) acts.get("constructiveDissent");
        assertThat(d).extracting(m -> m.get("text"))
                .containsExactly("비용이 계속 나갈 것 같아요", "이번 주 안에는 무리예요");
    }

    @Test
    void speechActs가_없으면_그대로_둔다() {
        Map<String, Object> step2 = new HashMap<>();
        AnalysisService.dedupeSpeechActsByTarget(step2);
        assertThat(step2).isEmpty();
    }
}
