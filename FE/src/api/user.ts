import apiClient from './client';
import type { User } from '@/types/user';

interface MeApiData {
  id: string | number;
  email: string;
  name: string;
  role: 'LEADER' | 'MEMBER';
  jobTitle?: string | null;
  bio?: string | null;
  teamId?: string | number | null;
  teamName?: string | null;
  inviteCode?: string | null;
}

interface MeApiResponse {
  success: boolean;
  data: MeApiData;
}

// bio를 생략하면 서버는 기존 한 줄 소개를 유지한다. 빈 문자열을 보내면 지운다.
export async function updateProfile(name: string, jobTitle: string | null, bio?: string): Promise<User> {
  const { data } = await apiClient.put<MeApiResponse>('/api/v1/users/me', { name, jobTitle, bio });
  const u = data.data;
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role === 'LEADER' ? 'leader' : 'member',
    jobTitle: u.jobTitle ?? undefined,
    bio: u.bio ?? undefined,
    teamId: u.teamId == null ? '' : String(u.teamId),
    teamName: u.teamName ?? undefined,
    inviteCode: u.inviteCode ?? undefined,
  };
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<MeApiResponse>('/api/v1/users/me');
  const u = data.data;
  return {
    id: String(u.id),
    email: u.email,
    name: u.name,
    role: u.role === 'LEADER' ? 'leader' : 'member',
    jobTitle: u.jobTitle ?? undefined,
    bio: u.bio ?? undefined,
    teamId: u.teamId == null ? '' : String(u.teamId),
    teamName: u.teamName ?? undefined,
    inviteCode: u.inviteCode ?? undefined,
  };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.patch('/api/v1/users/me/password', { currentPassword, newPassword });
}
