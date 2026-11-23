# ReadB Client — Frontend CLAUDE.md

## 프로젝트 정의
ReadB(리드비)는 1on1 미팅의 Honesty Gap을 AI로 수치화하는 B2B HR SaaS의 프론트엔드 클라이언트.

## 기술 스택
- React 18 + TypeScript 5
- Vite (빌드)
- Tailwind CSS + shadcn/ui (UI)
- Recharts (차트: Silent Risk Radar)
- react-wordcloud (Blocker Cloud)
- React Router v6 (라우팅)
- Axios (API 호출)
- Zustand (전역 상태: 인증 토큰, 유저 정보)
- Vercel (배포)

## 디렉토리 구조

```
src/
│
├── app/                         # [공유] 앱 진입점
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx                ← Theme, QueryClient 등
│
├── components/                  # 공용 컴포넌트 (Props로 데이터를 받아 렌더링만)
│   ├── ui/  ← shadcn/ui 커스텀
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Accordion.tsx
│   │   ├── Skeleton.tsx
│   │   └── Input.tsx
│   ├── charts/
│   │   ├── ScatterRadar.tsx             (Silent Risk Radar)
│   │   ├── BlockerCloud.tsx             (Blocker Cloud 워드클라우드)
│   │   └── GapScoreGauge.tsx            (Gap Score 시각화)
│   ├── feedback/
│   │   ├── FeedbackCard.tsx             (피드백 카드 아코디언)
│   │   └── FeedbackCardList.tsx
│   ├── loading/
│   │   ├── AnalysisLoading.tsx          (위트 있는 로딩 UX)
│   │   └── loadingCopies.ts             (리더/멤버별 카피라이팅 데이터)
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── PageLayout.tsx
│
├── pages/                       # 페이지 단위 화면
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── leader/
│   │   ├── LeaderDashboard.tsx          (Radar + Cloud + 요약)
│   │   ├── MeetingDetailPage.tsx        (녹음 + 분석 결과)
│   │   └── PromiseLedgerPage.tsx        (약속 장부)
│   └── member/
│       ├── MemberDashboard.tsx          (Career Memory 타임라인)
│       ├── MeetingFeedbackPage.tsx      (코칭 피드백 카드)
│       └── SurveyPage.tsx               (사전 서베이 폼)
│
├── features/                    # [페이지 안에서 쓰는 도메인별 로직]
│   ├── auth/
│   │   ├── useLogin.ts
│   │   └── useSignup.ts
│   ├── meeting/
│   │   ├── useRecorder.ts               (MediaRecorder 훅)
│   │   ├── useUploadRecording.ts
│   │   ├── useMeetingStatus.ts          (폴링 훅)
│   │   └── useAnalysisResult.ts
│   ├── leader/
│   │   ├── useRadarData.ts
│   │   ├── useBlockerData.ts
│   │   └── usePromises.ts
│   ├── member/
│   │   ├── useCareerMemory.ts
│   │   ├── useFeedbackCards.ts
│   │   └── useSurvey.ts
│   └── common/
│       └── useAuth.ts
│
├── api/                         # [공유 — 규칙 엄수]
│   ├── client.ts                    ← Axios 인스턴스 + 인터셉터
│   ├── auth.api.ts
│   ├── meeting.api.ts
│   ├── survey.api.ts
│   ├── analysis.api.ts
│   └── types.ts                     ← 공유 (API 응답 타입, 추가만 허용)
│
├── stores/                      # 전역 상태 (Zustand)
│   └── authStore.ts
│
├── styles/                      # 전역 스타일
│   └── globals.css
│
├── constants/                   # 추가는 자유, 기존 변경은 PR에 명시
│   └── routes.ts                    (라우트 경로 상수)
│
└── types/                       # 추가는 자유, 기존 변경은 PR에 명시
    ├── user.ts
    ├── meeting.ts
    ├── analysis.ts
    └── promise.ts
```

## 작업 방식

팀원 모두 BE·FE 구분 없이 풀스택으로 개발한다. pages/와 components/를 FE1/FE2처럼 역할로 나누지 않는다.

0. **상대 파일 수정 금지 (이니셜 기준)**: 담당은 BE/FE가 아니라 브랜치에 적힌 이니셜(`feat/<이니셜>/...`)로 구분한다. 다른 이니셜의 브랜치와 그 브랜치에서 작업 중인 파일은 수정하지 않는다. 수정이 필요하면 슬랙/디코로 해당 팀원에게 먼저 공유한다.

1. **컴포넌트 ↔ 페이지 소통은 Props로만**: components/의 컴포넌트는 Props 인터페이스를 export하고, 데이터는 페이지(또는 features/ 훅)가 주입한다. 컴포넌트 내부에서 API를 직접 호출하지 않는다.

   ```typescript
   // components/charts/ScatterRadar.tsx
   interface ScatterRadarProps {
     data: { memberId: string; name: string; surfaceScore: number; inferredScore: number }[];
     onMemberClick?: (memberId: string) => void;
   }
   export default function ScatterRadar({ data, onMemberClick }: ScatterRadarProps) { ... }

   // pages/leader/LeaderDashboard.tsx
   const { data } = useRadarData(teamId);
   return <ScatterRadar data={data} onMemberClick={handleClick} />;
   ```

2. **types/ 와 constants/**: 새 타입·상수 추가는 자유. 기존 필드 이름 변경·삭제는 사용처를 모두 고치고 PR에 명시한다.

3. **API 변경**: BE API 스펙이 바뀌면 같은 PR에서 `api/` 함수·타입과 `Docs/API_SPEC.md`를 함께 고친다.

4. **브랜치 네이밍**: `feat/<이니셜>/<주제>`, `fix/<이니셜>/<주제>` (예: `feat/js/team-health-trend-chart`).

5. **공용 파일 수정 시**: App.tsx, api/client.ts, stores/authStore.ts처럼 여러 화면이 의존하는 파일을 바꾸면 PR 본문에 명시하고 먼저 머지한다.

## 라우팅 구조

```typescript
// app/router.tsx
const routes = [
  { path: '/login',                    element: <LoginPage /> },
  { path: '/signup',                   element: <SignupPage /> },
  { path: '/leader/dashboard',         element: <LeaderDashboard /> },
  { path: '/leader/meeting/:meetingId', element: <MeetingDetailPage /> },
  { path: '/leader/promises',          element: <PromiseLedgerPage /> },
  { path: '/member/dashboard',         element: <MemberDashboard /> },
  { path: '/member/meeting/:meetingId', element: <MeetingFeedbackPage /> },
  { path: '/member/survey/:meetingId', element: <SurveyPage /> },
];
```

## 컴포넌트 개발 순서 (초기 계획)

```
Week 1: Button, Card, Badge, Input, Modal, Skeleton, PageLayout, Sidebar, Header
         → 페이지 뼈대 잡을 때 바로 쓸 수 있도록

Week 2: Accordion (피드백 카드용), AnalysisLoading (위트 로딩 UX)
         ScatterRadar, BlockerCloud, GapScoreGauge
         → 결과 화면 만들 때 꽂아 쓸 수 있도록

Week 3~4: 폴리싱, 반응형, 애니메이션, 엣지 케이스 처리
```

## 로딩 UX 카피 구조

```typescript
// components/loading/loadingCopies.ts
export const loadingSteps = [
  { step: 1, label: '대화를 텍스트로 바꾸는 중', icon: '🎧' },
  { step: 2, label: '행간의 의미를 읽는 중', icon: '🔍' },
  { step: 3, label: '숫자로 정리하는 중', icon: '📊' },
  { step: 4, label: '피드백을 다듬는 중', icon: '💡' },
];

export const witCopies = {
  leader: [
    '팀원이 "괜찮다"고 했을 때, 진짜 괜찮은 건지 확인 중...',
    '숨은 블로커를 워드클라우드에 올리는 중...',
    '리더십 점수를 깎지 않게 조심하는 중...',
  ],
  member: [
    '리더가 놓친 당신의 강점을 찾고 있어요...',
    '커리어 메모리에 오늘의 성장을 기록하는 중...',
    '다음 미팅에서 쓸 한마디를 고르는 중...',
  ],
};
```

## 개발 명령어
```bash
npm run dev          # 로컬 개발 서버 (Vite, http://localhost:5173)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 로컬 미리보기
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

## 주의사항
- MediaRecorder mimeType: `audio/webm;codecs=opus` 사용 (압축률 우수, 브라우저 호환성 좋음)
- 녹음 Blob은 FormData로 전송: `Content-Type: multipart/form-data`
- 분석 폴링 간격: 3초 (`useMeetingStatus` 훅에서 setInterval 3000ms)
- 폴링 타임아웃: 3분 초과 시 에러 화면 표시
- shadcn/ui 컴포넌트 수정 시 원본 유지하고 래퍼로 감쌀 것 (업데이트 대비)
