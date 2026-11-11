import { useEffect, useState } from 'react';
import type { TalkRatioEvent } from '@/types/talkRatio';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export function useTalkRatioStream(meetingId: number | null) {
  const [ratio, setRatio] = useState<TalkRatioEvent | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setRatio(null); // meetingId 변경 시 이전 데이터 초기화
    setConnected(false);
    if (!meetingId) return;
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/api/v1/meetings/${meetingId}/talk-ratio/stream`;
    const es = new EventSource(token ? `${url}?token=${token}` : url);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener('talkRatio', (e) => {
      try {
        setRatio(JSON.parse(e.data));
      } catch { /* ignore */ }
    });

    // onerror 강제 close 제거 — 브라우저 자체 auto-reconnect 활용
    return () => es.close();
  }, [meetingId]);

  return { ratio, connected };
}
