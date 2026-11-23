import type React from 'react';
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '@/components/ui/Card';
import type { TeamHealthScoreData, TeamHealthTrend } from '@/types/teamHealth';

export interface TeamHealthScoreCardProps {
  data: TeamHealthScoreData;
  coachingSlot?: React.ReactNode;
}

const trendMessageStyles: Record<TeamHealthTrend, string> = {
  IMPROVING: 'text-emerald-600',
  STABLE: 'text-gray-500',
  DECLINING: 'text-red-500',
};

const trendLabels: Record<TeamHealthTrend, string> = {
  IMPROVING: '개선',
  STABLE: '안정',
  DECLINING: '감소',
};

const TEAM_HEALTH_BAR_COLOR = '#2dd4bf';

export default function TeamHealthScoreCard({ data, coachingSlot }: TeamHealthScoreCardProps) {
  const score = Math.round(data.teamHealthScore);
  const delta = data.trendDelta;
  const hasDelta = typeof delta === 'number';
  const deltaStyle =
    !hasDelta || delta === 0
      ? 'bg-gray-100 text-gray-500'
      : delta > 0
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-red-50 text-red-500';
  const deltaText = !hasDelta
    ? ''
    : delta > 0
      ? `▲${delta}`
      : delta < 0
        ? `▼${Math.abs(delta)}`
        : '≈';
  // BE trendDelta = 이번 달 평균 - 직전 3개월 평균. 이번 달 평균은 monthlyTrend 마지막 값이므로 역산
  const thisMonthScore = data.monthlyTrend?.[data.monthlyTrend.length - 1]?.score;
  const threeMonthAvg = hasDelta && thisMonthScore !== undefined ? thisMonthScore - delta : null;
  const monthly = (data.monthlyTrend ?? []).map((m) => ({
    label: `${Number(m.month.slice(5))}월`,
    score: m.score,
  }));

  return (
    <Card className="mb-6 border-b border-line pb-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-700">Team Health Score</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <span className="text-5xl font-bold leading-none text-gray-950">
                {score}
              </span>
              <span className="pb-1 text-base font-medium text-gray-400">/100</span>
              {hasDelta && (
                <span className={`mb-1 rounded-full px-2 py-0.5 text-xs font-semibold ${deltaStyle}`}>
                  {deltaText} <span className="font-normal">최근 3개월 평균 대비</span>
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 w-full max-w-[33%] min-w-[180px] overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, score))}%`,
                  backgroundColor: TEAM_HEALTH_BAR_COLOR,
                }}
              />
            </div>
            {data.statusNote ? (
              <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600">{data.statusNote}</p>
            ) : (
              <p className={`mt-3 text-sm font-semibold ${trendMessageStyles[data.trend]}`}>
                현재 추세는 {trendLabels[data.trend]} 상태입니다.
              </p>
            )}
          </div>

          {/* 한 달치뿐이면 추이가 없으므로 숨김 */}
          {monthly.length >= 2 && (
            <div className="h-36 w-full sm:w-2/5 sm:shrink-0" aria-label="월별 팀 헬스 스코어 추이">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <XAxis
                    dataKey="label"
                    interval={0}
                    padding={{ left: 16, right: 16 }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    ticks={[Math.min(...monthly.map((m) => m.score)), Math.max(...monthly.map((m) => m.score))]}
                    tickFormatter={(v: number) => String(Math.round(v))}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  {threeMonthAvg !== null && (
                    <ReferenceLine
                      y={threeMonthAvg}
                      stroke="#9ca3af"
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                      label={{ value: '3개월 평균', position: 'insideTopRight', fill: '#9ca3af', fontSize: 11 }}
                    />
                  )}
                  <Tooltip
                    formatter={(v: number) => [Math.round(v), '평균']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Line
                    type="linear"
                    dataKey="score"
                    stroke={TEAM_HEALTH_BAR_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3, fill: TEAM_HEALTH_BAR_COLOR }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {coachingSlot && (
          <div className="border-t border-line pt-5">
            {coachingSlot}
          </div>
        )}
      </div>
    </Card>
  );
}
