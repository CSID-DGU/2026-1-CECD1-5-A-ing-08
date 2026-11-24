# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReadB is a B2B HR SaaS frontend that quantifies the "Honesty Gap" in 1-on-1 meetings using AI. It serves two user roles: **leader** (리더) and **member** (멤버).

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc + vite build
npm run lint         # ESLint on src/**/*.{ts,tsx}
npm run type-check   # tsc --noEmit
```

Environment variable required: `VITE_API_BASE_URL` (defaults to `http://localhost:8080`).

## Architecture

### Working Model

The team develops full-stack with no BE/FE or FE1/FE2 role split — `pages/`, `features/`, `components/`, `api/`, and routing are not divided by role.

Ownership is by the initials in the branch name (`feat/<initials>/...`): never modify another person's branch or the files they are working on in it. If a change there is needed, tell that teammate first (Slack/Discord).

Structural rule (not ownership): pages and `features/` hooks fetch data; components in `components/` are pure renderers that export a Props interface and receive all data from outside — no API calls inside components.

### State Management

Two Zustand stores:
- `stores/authStore.ts` — `user`, `token`, `setAuth`, `setToken`, `clearAuth`. User and tokens are persisted via `api/authStorage.ts` in `sessionStorage` (closing the tab/window logs out). Never store auth data in `localStorage`.
- `stores/meetingStore.ts` — client-side meeting list, `createMeeting`, `updateMeetingStatus`, `setRecordingDuration`, modal open state. Meetings are created in-memory (no persistence).

### API Client

`api/client.ts` is an Axios instance that reads the access token from `authStorage` for Authorization headers. On a 401 it refreshes the access token once via `/api/v1/auth/refresh` (concurrent 401s share one refresh) and retries; if refresh fails it clears auth and redirects to `/login`. Base URL from `VITE_API_BASE_URL`.

### Meeting Recording Flow

`MeetingDetailPage` orchestrates the full recording lifecycle:
1. `useRecorder` — wraps `MediaRecorder` + Web Audio API for waveform level. Records as `audio/webm`. Blob is held in a ref until `stop()`.
2. `useUploadRecording` — posts blob as `FormData` to `/meetings/upload`. **Currently a stub** (API call is commented out).
3. `useMeetingStatus` — polls BE for `analyzing → completed` transition every 3s. **Currently a stub** (20s demo timer, polling logic commented out).

Meeting status progression: `pending → recording → analyzing → completed`.

### Path Aliases

`@/` maps to `src/` (configured in Vite). Always use `@/` imports, never relative `../` across directories.

## Key Structural Decisions

- **`components/blocker/`** — Three sub-components (`BlockerActionList`, `BlockerDetailCard`, `BlockerSummaryNote`) that compose into the blocker analysis view. Distinct from `components/charts/BlockerCloud`.
- **`components/ui/`** wraps shadcn/ui primitives. When customizing, wrap the original rather than modifying it in place.
- **`data/mockRadarData.ts`** — Dummy data used for the radar chart until the real API is wired. Remove when `useRadarData` connects to BE.
- **`types/meeting.ts`** has two overlapping shapes: `Meeting` (API shape) and `MeetingData` (client store shape). `MeetingData` is what the store and pages use.

## Routes

```
/                         → redirect to /leader/dashboard
/login, /signup
/leader/dashboard         LeaderDashboard
/leader/meetings          MeetingsPage
/leader/meeting/:id       MeetingDetailPage
/leader/promises          PromiseLedgerPage
/member/dashboard         MemberDashboard
/member/meeting/:id       MeetingFeedbackPage
/member/survey/:id        SurveyPage
/meeting                  MeetingDetailPage (no :id)
/settings                 SettingsPage (개인 설정: 이름·직책·한 줄 소개, 비밀번호 변경)
/leader/reports, /leader/9box, /leader/overview, /invite → all stub to LeaderDashboard
*                         NotFoundPage (unknown paths)
```

All routes are children of one pathless root route whose `errorElement` is `RouteErrorPage`: any error thrown while rendering a page shows a "문제가 생겼어요" screen (reload / home) instead of a blank page. Error screens live in `pages/error/` and render without `PageLayout`.

## API URL Convention

- Omit the `/api` prefix when writing API endpoint paths. The base URL already includes it via `VITE_API_BASE_URL`. Write `/meetings/upload`, not `/api/meetings/upload`.

## Workflow

- All output produced by Claude must be reviewed by another AI agent before being considered final.

## Shared File Rules

- `types/` and `constants/` — additions are free; renames/deletes must update every usage and be called out in the PR.
- `api/types.ts` — BE response shapes go here; `ApiResponse<T>` is the standard wrapper. When an API changes, update `api/`, its types, and `Docs/API_SPEC.md` in the same PR.
- `App.tsx`, `api/client.ts`, `stores/authStore.ts` — many screens depend on these; call out changes in the PR and merge it first.
- Branch naming: `feat/<initials>/<topic>` or `fix/<initials>/<topic>` (e.g. `feat/js/team-health-trend-chart`).
