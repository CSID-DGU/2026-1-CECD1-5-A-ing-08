import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';

// 로그인 상태면 역할별 첫 화면(로그인 직후와 같은 곳), 아니면 로그인 화면
export function useHomePath() {
  const user = useAuthStore((s) => s.user);
  if (!user) return '/login';
  return user.role === 'leader' ? ROUTES.LEADER_MEETINGS : ROUTES.MEMBER_MEETINGS;
}

interface ErrorScreenProps {
  code?: string;
  title: string;
  description: string;
  showReload?: boolean;
  detail?: string;
}

// 사이드바(PageLayout) 없이 단독으로 그린다. 레이아웃 자체에서 난 오류도 이 화면으로 보여야 하기 때문.
export default function ErrorScreen({ code, title, description, showReload, detail }: ErrorScreenProps) {
  const navigate = useNavigate();
  const homePath = useHomePath();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <section className="w-full max-w-sm text-center">
        <p className="text-sm font-semibold tracking-widest text-gray-400">{code ?? 'READB'}</p>
        <h1 className="mt-3 text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        <div className="mt-8 flex justify-center gap-2">
          {showReload && (
            <Button variant="secondary" onClick={() => window.location.reload()}>
              새로고침
            </Button>
          )}
          {/* 오류 화면에서는 라우터 상태를 믿을 수 없으므로 홈 이동은 전체 새로 불러오기로 한다 */}
          <Button onClick={() => (showReload ? window.location.assign(homePath) : navigate(homePath))}>
            홈으로
          </Button>
        </div>
        {detail && (
          <pre className="mt-8 max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-left text-[11px] text-gray-500">
            {detail}
          </pre>
        )}
      </section>
    </main>
  );
}
