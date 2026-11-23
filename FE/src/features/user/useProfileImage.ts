import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { fetchProfileImage } from '@/api/user';

// 사용자별 이미지 버전. 내가 이미지를 바꾸면 버전을 올려 화면의 모든 아바타가 다시 불러오게 한다.
// 다른 사람이 바꾼 이미지는 새로고침 후에 반영된다.
const useProfileImageVersion = create<{ versions: Record<string, number>; bump: (userId: string) => void }>(
  (set) => ({
    versions: {},
    bump: (userId) => set((s) => ({ versions: { ...s.versions, [userId]: (s.versions[userId] ?? 0) + 1 } })),
  }),
);

export const bumpProfileImage = (userId: string) => useProfileImageVersion.getState().bump(userId);

// 같은 사용자의 이미지는 한 번만 요청한다 (사이드바·목록 등 여러 곳에서 동시에 써도 요청 1회).
const cache = new Map<string, Promise<string | null>>();

function load(userId: string, version: number): Promise<string | null> {
  const key = `${userId}:${version}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchProfileImage(userId)
      .then((blob) => (blob ? URL.createObjectURL(blob) : null))
      .catch(() => {
        cache.delete(key); // 실패는 저장하지 않고 다음에 다시 시도
        return null;
      });
    cache.set(key, p);
  }
  return p;
}

export function useProfileImage(userId?: string | number | null): string | null {
  const id = userId == null || userId === '' ? null : String(userId);
  const version = useProfileImageVersion((s) => (id ? s.versions[id] ?? 0 : 0));
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }
    let active = true;
    load(id, version).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [id, version]);

  return url;
}
