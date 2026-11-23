import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => Promise<void>;
}

export default function StartMeetingModal({ isOpen, onClose, onStart }: Props) {
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      await onStart();
      onClose();
    } catch {
      setError('마이크 또는 실시간 측정을 시작하지 못했습니다. 브라우저 권한을 확인해 주세요.');
    } finally {
      setStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">미팅을 시작하시겠습니까?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          미팅이 끝나면 회의록과 내용 요약을 자동으로 생성해드려요.
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            <span className="font-medium text-sm">녹음 기능</span>
          </div>
          <div className="bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">
            ON
          </div>
        </div>
        
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="accent-brand w-4 h-4"
          />
          <span className="text-sm text-gray-600">상대방의 녹음 동의를 구했어요.</span>
        </label>
        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleStart}
            disabled={!consent || starting}
            className={`px-6 py-2.5 rounded-lg text-sm text-white transition-colors ${
              consent ? "bg-brand hover:bg-brand-hover" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {starting ? '시작 중...' : '미팅 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
