import { useEffect, useState } from 'react';
import { fetchTeamDashboard } from '@/api/teamDashboard';
import { MOCK_TEAM_HEALTH_SCORE } from '@/data/mockTeamHealthScore';
import type { TeamHealthScoreData } from '@/types/teamHealth';

export function useTeamHealthScore(teamId?: string) {
  const [data, setData] = useState<TeamHealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      setData(MOCK_TEAM_HEALTH_SCORE);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;
    const resolvedTeamId = teamId;

    async function loadTeamDashboard() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTeamDashboard(resolvedTeamId);
        if (!ignore) setData(result);
      } catch {
        if (!ignore) {
          setData(null);
          setError('팀 헬스 스코어를 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadTeamDashboard();

    return () => {
      ignore = true;
    };
  }, [teamId]);

  return { data, loading, error };
}
