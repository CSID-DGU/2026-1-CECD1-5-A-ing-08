import type { TalkRatioEvent } from '@/types/talkRatio';
import type { CalibrationState } from '@/features/meeting/useChunkedRecorder';

interface Props {
  ratio: TalkRatioEvent | null;
  calibrationState: CalibrationState;
  error: string | null;
  connected: boolean;
  onStartCalibration: () => void;
}

export default function TalkRatioBadge({ ratio, calibrationState, error, connected, onStartCalibration }: Props) {
  if (calibrationState === 'error') {
    return <div className="text-sm text-red-600">{error ?? '실시간 측정에 실패했습니다.'}</div>;
  }
  if (calibrationState.startsWith('leader') || calibrationState.startsWith('member')) {
    const role = calibrationState.startsWith('leader') ? '리더' : '멤버';
    const recording = calibrationState.endsWith('-recording');
    const uploading = calibrationState.endsWith('-uploading');
    return (
      <div className="flex w-full max-w-[640px] flex-col items-center gap-2 text-sm text-gray-700">
        <span>
          {uploading ? `${role} 기준 발화를 등록하는 중입니다...`
            : recording ? `${role}님이 5초 동안 말씀해 주세요. 자동으로 등록됩니다.`
              : `${role}님이 말씀할 준비가 되면 기준 발화 녹음을 시작해 주세요.`}
        </span>
        {!uploading && !recording && (
          <button
            type="button"
            onClick={onStartCalibration}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-100"
          >
            {`${role} 발화 녹음 시작`}
          </button>
        )}
        {error && <span role="alert" className="text-red-600">{error}</span>}
      </div>
    );
  }
  if (calibrationState !== 'done') return null;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!connected) return <div className="text-sm text-amber-600">발화 비율 연결 중...</div>;
  if (!ratio?.hasData) return <div className="text-sm text-slate-500">발화 비율 측정 중...</div>;

  const isHigh = ratio.recentClassifiedMs >= 30_000 && ratio.recentLeaderRatio >= 70;
  const cumulativeLeader = Math.max(0, Math.min(100, ratio.leaderRatio));
  const recentLeader = Math.max(0, Math.min(100, ratio.recentLeaderRatio));
  return (
    <div className="w-full max-w-[640px] text-sm text-gray-800" aria-label="실시간 발화 비율">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">발화 비율</span>
        {isHigh && <span className="font-medium text-red-600">최근 리더 발화가 많습니다</span>}
      </div>
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span>누적 · 리더 {ratio.leaderRatio}%</span>
            <span>멤버 {ratio.memberRatio}%</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`누적 리더 ${ratio.leaderRatio}퍼센트, 멤버 ${ratio.memberRatio}퍼센트`}>
            <div className={`h-full rounded-full transition-[width] duration-500 ${ratio.leaderRatio >= 70 ? 'bg-red-400' : 'bg-teal-400'}`} style={{ width: `${cumulativeLeader}%` }} />
          </div>
        </div>
        {ratio.recentClassifiedMs > 0 ? (
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>최근 2분 · 리더 {ratio.recentLeaderRatio}%</span>
              <span>멤버 {Math.round((100 - ratio.recentLeaderRatio) * 10) / 10}%</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100" role="img" aria-label={`최근 2분 리더 ${ratio.recentLeaderRatio}퍼센트`}>
              <div className={`h-full rounded-full transition-[width] duration-500 ${isHigh ? 'bg-red-400' : 'bg-teal-400'}`} style={{ width: `${recentLeader}%` }} />
            </div>
          </div>
        ) : <span className="text-xs text-gray-500">최근 2분 비율 측정 중...</span>}
      </div>
    </div>
  );
}
