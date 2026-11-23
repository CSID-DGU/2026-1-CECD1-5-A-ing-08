import type { TeamHealthScoreData } from '@/types/teamHealth';

export const MOCK_TEAM_HEALTH_SCORE: TeamHealthScoreData = {
  teamId: 1,
  teamHealthScore: 74,
  trend: 'IMPROVING',
  alerts: [
    '강다은 님 Initiative 최근 3회 평균 대비 100% 감소',
    '오재민 님 Safety Score 기준 이하 (Silent Risk)',
  ],
  monthlyTrend: [
    { month: '2026-07', score: 61 },
    { month: '2026-08', score: 66 },
    { month: '2026-09', score: 64 },
    { month: '2026-10', score: 70 },
    { month: '2026-11', score: 74 },
  ],
};
