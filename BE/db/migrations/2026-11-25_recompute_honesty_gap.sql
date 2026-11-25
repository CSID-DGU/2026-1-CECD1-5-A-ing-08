-- analyses.honesty_gap을 Gemini가 추정한 값 대신 서버 기준(surveyScore − safety_score)으로 재계산.
-- surveyScore는 AnalysisService.computeSurveyScore와 같은 식: 리커트 1~5 → (level-1)/4 → ^1.3, V40/D35/I25, 0~100 정수.
-- 미팅 멤버 본인의 서베이가 없거나 V/D/I 중 하나라도 없으면 NULL (새 코드와 동일).
UPDATE public.analyses a
SET honesty_gap = (
    SELECT ROUND((
               ROUND(LEAST(100, GREATEST(0,
                     POWER(LEAST(1, GREATEST(0, ((s.scores->>'vulnerabilityLevel')::float8 - 1) / 4)), 1.3) * 40
                   + POWER(LEAST(1, GREATEST(0, ((s.scores->>'dissentLevel')::float8      - 1) / 4)), 1.3) * 35
                   + POWER(LEAST(1, GREATEST(0, ((s.scores->>'initiativeLevel')::float8   - 1) / 4)), 1.3) * 25
               ))::numeric)
               - a.safety_score::numeric) * 10) / 10
    FROM public.surveys s
    JOIN public.meetings m ON m.id = s.meeting_id AND m.member_id = s.member_id
    WHERE s.meeting_id = a.meeting_id
);
