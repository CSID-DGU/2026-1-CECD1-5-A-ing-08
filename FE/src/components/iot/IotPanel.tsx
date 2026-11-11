import { useEffect } from 'react';
import { useArduinoSerial } from '@/features/meeting/useArduinoSerial';
import type { TalkRatioEvent } from '@/types/talkRatio';

interface Props {
  ratio: TalkRatioEvent | null;
  isRecording?: boolean;
}

export default function IotPanel({ ratio, isRecording }: Props) {
  const { connected, connect, send, disconnect } = useArduinoSerial();

  const leaderRatio = ratio?.hasData ? ratio.leaderRatio : 0;
  const recentReady = !!ratio && ratio.recentClassifiedMs >= 30_000;

  useEffect(() => {
    if (!ratio || !isRecording || !recentReady) return;
    send(ratio.recentLeaderRatio >= 70 ? 'R' : 'G');
  }, [ratio, isRecording, recentReady, send]);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">발화 비율</p>

      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isRecording
              ? leaderRatio >= 70 ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              : 'bg-gray-300'
          }`}
        />
        <span className="text-sm text-gray-700">
          리더 <span className="font-semibold">{ratio?.hasData ? `${leaderRatio}%` : '측정 중'}</span>
          {' / '}
          멤버 <span className="font-semibold">{ratio?.hasData ? `${ratio.memberRatio}%` : '측정 중'}</span>
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            leaderRatio >= 70 ? 'bg-red-400' : 'bg-teal-400'
          }`}
          style={{ width: `${leaderRatio}%` }}
        />
      </div>

      {recentReady && ratio!.recentLeaderRatio >= 70 && isRecording && (
        <p className="text-xs text-red-500">최근 2분간 리더 발화 비율이 70% 이상입니다.</p>
      )}
      {ratio?.hasData && ratio.unclassifiedRatio > 0 && (
        <p className="text-xs text-gray-400">짧거나 불확실한 발화 {ratio.unclassifiedRatio}%는 비율에서 제외했습니다.</p>
      )}

      <button
        onClick={connected ? disconnect : connect}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        {connected ? 'LED 연결 해제' : 'LED 연결'}
      </button>
    </div>
  );
}
