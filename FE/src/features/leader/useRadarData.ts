import { useState, useEffect } from 'react';
import { fetchTeamQuadrant } from '@/api/teamDashboard';
import type { RadarDataPoint } from '@/types/analysis';
import { MOCK_RADAR } from '@/data/mockRadarData';

export function useRadarData(teamId?: string) {
  const [data, setData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (import.meta.env.VITE_USE_MOCK === 'true') {
      setData(MOCK_RADAR);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;
    const resolvedTeamId = teamId;

    async function loadRadarData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTeamQuadrant(resolvedTeamId);
        if (!ignore) setData(result);
      } catch {
        if (!ignore) {
          setData([]);
          setError('사분면 레이더를 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRadarData();

    return () => {
      ignore = true;
    };
  }, [teamId]);

  return { data, loading, error };
}
