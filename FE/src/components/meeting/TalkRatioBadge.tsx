import type { TalkRatioEvent } from '@/types/talkRatio';

interface Props {
  ratio: TalkRatioEvent | null;
  calibrationState: 'idle' | 'leader' | 'member' | 'done' | 'error';
  error: string | null;
  connected: boolean;
}

export default function TalkRatioBadge({ ratio, calibrationState, error, connected }: Props) {
  if (error || calibrationState === 'error') {
    return <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error ?? '실시간 측정에 실패했습니다.'}</div>;
  }
  if (calibrationState === 'leader') {
    return (
      <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
        리더님 먼저 인사해 주세요...
      </div>
    );
  }
  if (calibrationState === 'member') {
    return (
      <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
        멤버님 이어서 인사해 주세요...
      </div>
    );
  }
  if (calibrationState !== 'done') return null;
  if (!connected) return <div className="text-sm text-amber-600">발화 비율 연결 중...</div>;
  if (!ratio?.hasData) return <div className="text-sm text-slate-500">발화 비율 측정 중...</div>;

  const isHigh = ratio.recentClassifiedMs >= 30_000 && ratio.recentLeaderRatio >= 70;
  return (
    <div className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${isHigh ? 'bg-red-500' : 'bg-green-500'}`}>
      리더 누적 {ratio.leaderRatio}% · 최근 2분 {ratio.recentLeaderRatio}%
      {ratio.unclassifiedRatio > 0 && <span className="ml-2 font-normal">(미분류 {ratio.unclassifiedRatio}%)</span>}
    </div>
  );
}
