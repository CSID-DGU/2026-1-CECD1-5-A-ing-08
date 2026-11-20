package com.readb.service.analysis;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SpeechActDedupeTest {

    @Test
    @SuppressWarnings("unchecked")
    void 유형별로_같은_segment는_한_번만_센다() {
        Map<String, Object> acts = new HashMap<>();
        acts.put("vulnerability", List.of(
                Map.of("text", "잘 몰라서 막막해요", "timestamp", 12),
                Map.of("text", "감도 안 와요", "timestamp", 12.0),
                Map.of("text", "몸이 무거워요", "timestamp", 40),
                Map.of("text", "타임스탬프 없음")));
        acts.put("initiative", List.of(Map.of("text", "스테이징에 먼저 띄워볼게요", "timestamp", 12)));
        Map<String, Object> step2 = new HashMap<>(Map.of("speechActs", acts));

        AnalysisService.dedupeSpeechActsBySegment(step2);

        List<Map<String, Object>> v = (List<Map<String, Object>>) acts.get("vulnerability");
        assertThat(v).extracting(m -> m.get("text"))
                .containsExactly("잘 몰라서 막막해요", "몸이 무거워요", "타임스탬프 없음");
        assertThat((List<?>) acts.get("initiative")).hasSize(1);
    }

    @Test
    void speechActs가_없으면_그대로_둔다() {
        Map<String, Object> step2 = new HashMap<>();
        AnalysisService.dedupeSpeechActsBySegment(step2);
        assertThat(step2).isEmpty();
    }
}
