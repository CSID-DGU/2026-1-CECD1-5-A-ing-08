import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import PageLayout from '@/components/layout/PageLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useMe } from '@/features/auth/useMe';
import { useAuthStore } from '@/stores/authStore';
import { changePassword, updateProfile } from '@/api/user';

// 회원가입(SignupRequest)과 같은 규칙
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

function serverMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
  }
  return fallback;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function ProfileSection() {
  const user = useMe();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setJobTitle(user.jobTitle ?? '');
    setBio(user.bio ?? '');
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setError('이름은 2~20자로 입력해주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // 빈 값은 그대로 보내 서버에서 지우도록 한다.
      const updated = await updateProfile(trimmedName, jobTitle.trim(), bio.trim());
      setAuth(updated, token ?? '');
      setSaved(true);
    } catch (err) {
      setError(serverMessage(err, '저장에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900">프로필</h2>
      <p className="mt-0.5 text-xs text-gray-400">팀원에게 보이는 내 정보입니다.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <Field label="이메일">
          <Input value={user?.email ?? ''} disabled className="bg-gray-50 text-gray-500" />
        </Field>
        <Field label="이름">
          <Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} maxLength={20} />
        </Field>
        <Field label="직책" hint="예) 백엔드 개발자, 프로덕트 디자이너">
          <Input value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); setSaved(false); }} maxLength={50} />
        </Field>
        <Field label="한 줄 소개" hint={`${bio.length}/100`}>
          <Input
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSaved(false); }}
            maxLength={100}
            placeholder="나를 한 줄로 소개해주세요"
          />
        </Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {saved && <p className="text-xs text-green-600">저장했습니다.</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !user}>{saving ? '저장 중...' : '저장'}</Button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    if (!current) { setError('현재 비밀번호를 입력해주세요.'); return; }
    if (!PASSWORD_RULE.test(next)) { setError('비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.'); return; }
    if (next !== confirm) { setError('새 비밀번호가 서로 일치하지 않습니다.'); return; }
    setSaving(true);
    setError(null);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(true);
    } catch (err) {
      setError(serverMessage(err, '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <Field label="현재 비밀번호">
          <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="새 비밀번호" hint="8자 이상, 영문·숫자·특수문자(@$!%*#?&) 포함">
          <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="새 비밀번호 확인">
          <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {done && <p className="text-xs text-green-600">비밀번호를 변경했습니다.</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? '변경 중...' : '비밀번호 변경'}</Button>
        </div>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-[640px] p-6">
        <h1 className="text-xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-500">내 프로필과 계정 정보를 관리합니다.</p>
        <div className="mt-5 flex flex-col gap-4">
          <ProfileSection />
          <PasswordSection />
        </div>
      </div>
    </PageLayout>
  );
}
