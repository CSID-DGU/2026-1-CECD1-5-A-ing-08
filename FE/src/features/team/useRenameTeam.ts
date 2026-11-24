import { useState, useCallback } from 'react';
import axios from 'axios';
import { renameTeam } from '@/api/teams';
import { useAuthStore } from '@/stores/authStore';

export function useRenameTeam() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const rename = useCallback(async (teamId: string, name: string) => {
    setIsSaving(true);
    setError('');
    try {
      const result = await renameTeam(teamId, name);
      const { user, token, setAuth } = useAuthStore.getState();
      if (user) setAuth({ ...user, teamName: result.teamName }, token ?? '');
      return true;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(msg || '팀 이름을 바꾸지 못했습니다.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { rename, isSaving, error, resetError: () => setError('') };
}
