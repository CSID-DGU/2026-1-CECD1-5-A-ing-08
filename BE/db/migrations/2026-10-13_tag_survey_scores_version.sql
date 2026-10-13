-- 사전 설문 문항 교체(v2): 기존 응답은 삭제하지 않고 문항 버전 v1으로 표시해 보존
-- v2 응답은 SurveyService가 scores.version = 'v2'로 저장한다
UPDATE public.surveys
SET scores = scores || '{"version": "v1"}'::jsonb
WHERE scores IS NOT NULL AND NOT (scores ? 'version');
