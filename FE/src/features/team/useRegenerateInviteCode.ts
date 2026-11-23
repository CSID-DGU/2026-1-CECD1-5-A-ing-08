import { useState, useCallback } from 'react';
import { regenerateInviteCode } from '@/api/teams';
import { useAuthStore } from '@/stores/authStore';

export function useRegenerateInviteCode() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');

  const regenerate = useCallback(async (teamId: string) => {
    setIsRegenerating(true);
    setError('');
    try {
      const inviteCode = await regenerateInviteCode(teamId);
      const { user, token, setAuth } = useAuthStore.getState();
      if (user) setAuth({ ...user, inviteCode }, token ?? '');
      return true;
    } catch {
      setError('새 초대 코드를 만들지 못했습니다.');
      return false;
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  return { regenerate, isRegenerating, error, resetError: () => setError('') };
}
