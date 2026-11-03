import { useCallback, useEffect, useState } from 'react';
import { fetchPreBriefing, fetchPreBriefingGuide, fetchPreBriefingTopicQuestions } from '@/api/meetings';
import { MOCK_PRE_BRIEFING } from '@/data/mockPreBriefing';
import type { PreBriefingData } from '@/types/meeting';

export function usePreBriefing(meetingId: string | undefined) {
  const [data, setData] = useState<PreBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicError, setTopicError] = useState(false);

  useEffect(() => {
    if (!meetingId) {
      setLoading(false);
      return;
    }

    if (import.meta.env.VITE_USE_MOCK === 'true' && meetingId.startsWith('mock-')) {
      setData(MOCK_PRE_BRIEFING);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPreBriefing(meetingId)
      .then((briefing) => {
        if (cancelled) return;
        setData(briefing);
        fetchPreBriefingGuide(meetingId)
          .then((guide) => { if (!cancelled) setData((current) => current && { ...current, coachingGuide: guide ?? undefined }); })
          .catch(() => {});
        if (briefing.survey.submitted && briefing.survey.topic?.trim()) {
          setTopicLoading(true);
          setTopicError(false);
          fetchPreBriefingTopicQuestions(meetingId)
            .then((questions) => {
              if (!questions) throw new Error('Question generation failed');
              if (!cancelled) setData((current) => current && { ...current, surveyTopicQuestion: questions });
            })
            .catch(() => { if (!cancelled) setTopicError(true); })
            .finally(() => { if (!cancelled) setTopicLoading(false); });
        }
      })
      .catch(() => {
        if (!cancelled) setError('미팅 전 브리핑을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, retryCount]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  const retryTopic = useCallback(() => {
    if (!meetingId) return;
    setTopicLoading(true);
    setTopicError(false);
    fetchPreBriefingTopicQuestions(meetingId)
      .then((questions) => {
        if (!questions) throw new Error('Question generation failed');
        setData((current) => current && { ...current, surveyTopicQuestion: questions });
      })
      .catch(() => setTopicError(true))
      .finally(() => setTopicLoading(false));
  }, [meetingId]);

  return { data, loading, error, retry, topicLoading, topicError, retryTopic };
}
