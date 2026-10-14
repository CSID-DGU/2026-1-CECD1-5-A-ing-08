package com.readb.domain.survey;

import java.util.List;

// 사전 설문 Q1~Q3 문항 메타데이터. 문항 교체 시 이 파일만 수정.
// id: FE 요청 키(문항 텍스트는 FE constants/surveyQuestions.ts), key: DB 저장 키(변환 후 점수)
public final class SurveyItems {

    public static final int MIN_SCALE = 1;
    public static final int MAX_SCALE = 5;

    public record Item(String id, String key, String construct, boolean reversed) {
        // 역문항: reversed = (MIN+MAX) - raw → 5점 척도에서 6 - raw
        public int score(int raw) {
            return reversed ? (MIN_SCALE + MAX_SCALE) - raw : raw;
        }
    }

    public static final List<Item> ITEMS = List.of(
            new Item("q1", "vulnerabilityLevel", "disclosure", true),
            new Item("q2", "dissentLevel", "prohibitive_voice", true),
            new Item("q3", "initiativeLevel", "promotive_voice", false)
    );

    private SurveyItems() {}
}
