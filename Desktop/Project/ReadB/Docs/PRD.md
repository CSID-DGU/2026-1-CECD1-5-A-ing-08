# ReadB PRD (Product Requirements Document)

> **버전**: v2.2 | **최종 업데이트**: 2026-05-15 | **작성**: PM 이승규

---

## 1. 제품 개요

**ReadB(리드비)** — 1on1 미팅의 Honesty Gap을 관찰 가능한 행동 데이터로 수치화하는 B2B HR SaaS

### 핵심 가치

리더와 멤버 사이의 "괜찮습니다"라는 말 뒤에 숨겨진 진짜 상태를, AI 감정 추론이 아닌 **관찰 가능한 발화 행위(Speech Act)**로 드러낸다. AI는 백엔드에서 분석을 수행하되, 사용자 화면에서는 보이지 않는다.

### 포지셔닝

**리더십 역량 강화 도구** — HR 예산의 대부분이 리더십 교육에 투입되는 시장에서, 1on1 미팅을 데이터 기반으로 개선하는 도구로 포지셔닝한다. 코드/아키텍처 변경 없이 프레이밍만 전환.

### 타겟 사용자

| 사용자 | 역할 | 핵심 가치 |
|--------|------|-----------|
| **리더** | 1on1 진행자 | 팀원의 실제 상태 파악 + 코칭 피드백 + 약속 이행 추적 |
| **멤버** | 1on1 참여자 | Career Memory(성장 기록 축적) + 나의 기여 가시화 |
| **HR 관리자** | (MVP 이후) | 팀 단위 심리적 안전감 트렌드 모니터링 |

---

## 2. 핵심 분석 프레임워크: 3-Gap Model

ReadB의 분석은 세 가지 Gap을 측정하여 리더에게 제공한다.

### Gap ① Alignment Gap (기대 vs 실제 의제)

사전 서베이에서 리더/멤버가 선택한 "논의할 주제"와 실제 미팅에서 다뤄진 주제를 비교한다.

| 점수 | 의미 |
|------|------|
| 0 | 서베이 선택 주제가 미팅에서 전혀 언급되지 않음 |
| 25 | 멤버가 제기했으나 리더가 묵살 |
| 40 | 10% 미만 언급 |
| 60 | 논의했으나 구체적 결론 없음 |
| 85~100 | 충분히 논의 + 액션아이템 도출 |

### Gap ② Honesty Gap (서베이 응답 vs 관찰된 행동)

멤버가 서베이에서 "좋음"이라 답했는데 실제 미팅에서 Initiative 0회, Vulnerability 0회라면 → Gap 감지.

**방향성 기반 산출 (v2.1 확정)**:
```
gap = surveyScore − safetyScore  (부호 있는 값)
```

| gap 값 | direction | riskLevel | 의미 |
|--------|-----------|-----------|------|
| ≤ 0 | UNDERREPORT | SAFE | 보수적 응답 — 알림 없음 |
| 1 ~ 20 | OVERREPORT | SAFE | 표면과 행동 대체로 일치 |
| 21 ~ 40 | OVERREPORT | CAUTION | 약간의 과장 보고 가능성 |
| 41 ~ 60 | OVERREPORT | WARNING | "괜찮다"고 하지만 행동이 안 따라감 |
| 61+ | OVERREPORT | DANGER | 심각한 괴리 — 즉시 관심 |

**설계 근거**: 현업 종사자들은 에너지 레벨을 보수적(2~3)으로 응답하는 경향이 있어, 절대값 기반 Gap은 겸손한 사람도 위험으로 오분류한다. OVERREPORT 방향만 리스크 대상으로 함.

### Gap ③ Execution Gap (과거 약속 vs 이행)

이전 미팅에서 합의된 약속(Promise)이 이번 미팅에서 언급/이행되었는지 추적한다.

| 점수 | 의미 |
|------|------|
| 0 | 약속이 전혀 언급되지 않음 |
| 20 | 미이행, 사유 없음 |
| 50 | 미이행, 합리적 사유 제시 |
| 70 | 진행 중 |
| 100 | 완료 |

전체 점수 = 개별 약속 점수의 평균.

---

## 3. Scoring 공식

### 3.1 Safety Score (Y축, 0~100)

AI 감정 추론이 아닌 **관찰 가능한 발화 행위(Speech Act)** 카운팅으로 산출.

**3가지 행동 지표**:

| 지표 | 설명 | 배점 | 포함 예시 | 제외 예시 |
|------|------|------|-----------|-----------|
| **Vulnerability** | 취약성 표현 | max 40 | "잘 모르겠습니다", "실수했습니다", "도움이 필요합니다" | 사교적 겸손, 관용표현 |
| **Constructive Dissent** | 건설적 반대 | max 35 | "다른 의견인데요", "그 방법보다는..." | 단순 불만, 인신공격 |
| **Initiative** | 자발적 제안 | max 25 | "제가 해볼게요", "이런 아이디어가 있는데" | 지시에 대한 단순 수락 |

**변환표 (30분 기준 정규화 후)**:

| 횟수 | V (40) | D (35) | I (25) |
|------|--------|--------|--------|
| 0회 | 0 | 0 | 0 |
| 1회 | 20 | 18 | 13 |
| 2회 | 32 | 28 | 20 |
| 3회 | 38 | 33 | 24 |
| 4회+ | 40 | 35 | 25 |

```
safetyScore = V_score + D_score + I_score
adjusted_count = round(raw_count × 30 ÷ actual_duration_minutes)
```

**가중치 근거**:
- V 40%: 가장 어려운 행위. 심리적 안전감의 1순위 지표 (Edmondson 연구)
- D 35%: 의사결정 품질 지표. 반대 없는 팀은 groupthink 위험
- I 25%: engagement 지표. V/D보다 표현 진입 장벽이 낮음

**체감 체계**: 0→1회 첫 발화가 점수의 ~50% 차지. "한 번이라도 했느냐"가 가장 강력한 신호.

**경계 규칙**: 애매하면 카운팅하지 않는다 (보수적 접근). 각 Speech Act는 원문 인용 + 타임스탬프와 함께 저장.

### 3.2 Survey Score (X축, 0~100)

미팅 전 멤버의 사전 서베이에서 산출.

```
surveyScore = clamp(0, 100, energyLevel × 20 + Σ issue_adjustments)
```

| energyLevel | 기본점 |
|-------------|--------|
| 1 (매우 낮음) | 20 |
| 2 (낮음) | 40 |
| 3 (보통) | 60 |
| 4 (높음) | 80 |
| 5 (매우 높음) | 100 |

| 이슈 선택 | 가감점 |
|-----------|--------|
| 업무 블로커 | −10 |
| 리소스 요청 | −5 |
| 팀 분위기 | −3 |
| 프로세스 개선 | −3 |
| 커리어 성장 / 인정·피드백 / 기타 | 0 |

### 3.3 사분면 (Quadrant)

X축: surveyScore, Y축: safetyScore, 임계값: 50 고정 (MVP)

| 사분면 | 조건 | 의미 |
|--------|------|------|
| **STABLE** | survey ≥ 50 && safety ≥ 50 | 표면+행동 모두 양호 |
| **SILENT_RISK** | survey ≥ 50 && safety < 50 | "괜찮다"고 하지만 행동 지표 낮음 (가장 위험) |
| **EXPLICIT_RISK** | survey < 50 && safety < 50 | 표면+행동 모두 부정 |
| **CONSERVATIVE** | survey < 50 && safety ≥ 50 | 보수적 응답 (위험 아님) |

### 3.4 팀 헬스 스코어

```
teamHealthScore = safetyScore_avg × 0.6 + surveyScore_avg × 0.4
trend = 전월 대비 +5 이상 → IMPROVING / ±5 이내 → STABLE / -5 이하 → DECLINING
```

### 3.5 Rolling Baseline + 이상 탐지

- 개인별 최근 3회 미팅 평균 = 베이스라인
- 30% 이상 하락 → Silent Risk 알림 (리더 대시보드)
- Cold Start: 1~2회차는 절대값 스코어링만 (베이스라인 미형성)
- 알림 문구: "최근 3회 평균 대비 Initiative 42% 감소" (AI 해석 아님)

---

## 4. 워크플로우

```
① PRE-MEETING
   멤버 사전 서베이 → Survey Score 산출 → 리더 미팅 생성 → 이전 약속 로드

② DURING MEETING
   Ambient 녹음 (별도 조작 없음) → 미팅 종료 후 통짜 업로드

③ AI PIPELINE (LLM Cascading)
   Step 1: Whisper STT (음성 → Transcript + 화자 분리 + 타임스탬프)
   Step 2: GPT-4o-mini (Speech Act 분류 + 주제 매핑 + 약속 추출)
   Step 3: Claude Sonnet (3-Gap 스코어링 + 코칭 피드백 + Career 태그)

④ 3-GAP SCORING
   Safety Score (V+D+I) + Alignment Gap + Honesty Gap + Execution Gap

⑤ OUTPUT
   리더: 리포트 + 레이더 사분면 + 블로커 피라미드 + Promise Ledger
   멤버: Career Memory 타임라인
```

---

## 5. 주요 화면 구성

### 리더 화면

| 화면 | 핵심 데이터 | 설명 |
|------|-------------|------|
| **팀 대시보드** | 팀 헬스 스코어, trend, 알림 | 팀 전체 건강 상태 개요 |
| **레이더 사분면** | X:survey Y:safety 산점도 | 멤버별 포지션 시각화 (STABLE/SILENT_RISK/EXPLICIT_RISK/CONSERVATIVE) |
| **블로커 피라미드** | 키워드 + 멤버별 발화 횟수 | 팀 전체에서 반복 언급되는 이슈 파악 |
| **1on1 리포트** | 3-Gap + Speech Act + 피드백 | 미팅별 상세 분석 결과 |
| **Promise Ledger** | 약속 이행률 추적 | 리더/멤버 약속 현황 |

### 멤버 화면

| 화면 | 핵심 데이터 | 설명 |
|------|-------------|------|
| **Career Memory** | 성장 태그 타임라인 | 미팅별 기여/성장 기록 축적 |
| **나의 리포트** | Speech Act + 피드백 카드 | AI 해석 없이 사실만 표시 |

---

## 6. Fact-Based Output 원칙

BE API 응답 설계부터 FE 화면 표시까지 관통하는 핵심 원칙.

**금지**: AI가 해석/판단한 라벨
- "수동 공격적", "소극적 참여", "번아웃 징후", "팀 분위기 위험"

**허용**: 관찰 가능한 사실만
- 원문 인용 + 타임스탬프
- 카운트 수치 (Vulnerability 3회, Initiative 0회)
- 베이스라인 대비 변화율 ("최근 3회 평균 대비 -43%")
- 서베이 응답 원문 ("좋음" 선택)

| Before (금지) | After (허용) |
|---|---|
| "수동 공격적 표현 1회" | "김OO, 23:15 — '네 뭐 그렇게 하시죠'" (원문+타임스탬프) |
| "서베이 87 vs AI 추론 31" | "서베이 '좋음' + Initiative 0회, Vulnerability 0회" |
| "AI 팀 상황 진단" | "이번 주 팀 상황 — '리소스 부족' 5명 언급, 3주 연속" |
| "번아웃 징후 감지" | "Initiative 5→2→0 (3회 연속 감소)" |

### AI 비가시성

- AI 아이콘(로봇 등) 사용 금지
- "AI 분석", "AI 진단" 같은 라벨 금지
- 분석 결과는 마치 "시스템이 자동 집계한 통계"처럼 보여야 함

---

## 7. 기술 아키텍처

### 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Java 17 + Spring Boot 3.2 + JPA + PostgreSQL(Supabase) + JWT(jjwt 0.12+) |
| **Frontend** | React 18 + TypeScript 5 + Vite + Tailwind + shadcn/ui + Recharts + Zustand |
| **AI** | OpenAI Whisper(STT) + GPT-4o-mini(구조화) + Claude Sonnet(판단) + OpenAI Embedding + pgvector(RAG) |
| **배포** | Railway(BE) + Vercel(FE) + Supabase(DB + Storage) |
| **IoT** | Raspberry Pi + LED 램프 (리더 발화 타이밍 안내) |

### LLM Cascading

```
Step 1: Whisper API → Transcript (화자 분리 + 타임스탬프)
Step 2: GPT-4o-mini (저비용) → Speech Act 분류, 주제 매핑, Promise 추출
Step 3: Claude Sonnet (고품질) → 3-Gap 스코어링, 코칭 피드백, Career Memory 태그
```

비용이 낮은 모델로 전처리, 고품질 모델로 판단하는 구조.

### Adapter Pattern

모든 외부 연동은 인터페이스 → 구현체 분리. @Profile로 교체 가능.

- SttAdapter → WhisperAdapter / MockSttAdapter
- LlmAdapter → ClaudeAdapter / GptMiniAdapter / MockLlmAdapter
- RagAdapter → PgVectorAdapter

### RAG (검색 증강 생성)

코칭 피드백 생성 시 3가지 지식 소스를 참조:
1. 코칭 프레임워크 지식베이스 (SBI, GROW 모델 등)
2. 해당 멤버 과거 미팅 요약 (최근 3~5회)
3. 팀 컨텍스트 (팀 평균 지표, 자주 등장하는 blocker 키워드)

기술: pgvector on Supabase (별도 벡터 DB 불필요)

---

## 8. DB 스키마

```sql
-- 인증/유저 (BE2)
users       (id, email, password_hash, name, role, team_id, churned_at NULL, created_at)
teams       (id, name, leader_id, created_at)
surveys     (id, meeting_id, member_id, scores JSONB, submitted_at)

-- 분석 도메인 (BE1)
meetings    (id, team_id, leader_id, member_id, status, created_at)
recordings  (id, meeting_id, file_url, duration_sec, transcript TEXT, created_at)
analyses    (id, meeting_id,
            alignment_gap FLOAT, honesty_gap FLOAT, execution_gap FLOAT,
            safety_score FLOAT,
            speech_acts JSONB,       -- {vulnerability: [{text, timestamp}], dissent: [...], initiative: [...]}
            blocker_keywords JSONB,
            leader_feedback JSONB, member_feedback JSONB,
            career_tags JSONB,
            baseline_data JSONB,     -- {prev_avg_vulnerability, prev_avg_dissent, prev_avg_initiative}
            created_at)
promises    (id, meeting_id, owner_id, content, deadline, status, created_at)

-- RAG (BE1)
coaching_knowledge  (id, content TEXT, embedding VECTOR(1536), source, chunk_index, created_at)
meeting_summaries   (id, meeting_id, member_id, summary TEXT, embedding VECTOR(1536), created_at)
```

---

## 9. API 엔드포인트

Base URL: `/api/v1/` | 공통 응답: `{success, code, message, data}`

```
# 인증
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

# 유저
GET    /api/v1/users/me
PUT    /api/v1/users/me

# 팀
POST   /api/v1/teams
POST   /api/v1/teams/join
GET    /api/v1/teams/{teamId}/members
GET    /api/v1/teams/{teamId}/dashboard
GET    /api/v1/teams/{teamId}/quadrant
GET    /api/v1/teams/{teamId}/blocker-pyramid

# 미팅
POST   /api/v1/meetings
GET    /api/v1/meetings
GET    /api/v1/meetings/{id}
POST   /api/v1/meetings/{id}/recording
GET    /api/v1/meetings/{id}/status
GET    /api/v1/meetings/{id}/leader-report
GET    /api/v1/meetings/{id}/member-report

# 서베이
POST   /api/v1/surveys
GET    /api/v1/surveys/{meetingId}
GET    /api/v1/surveys/history               ← 멤버 서베이 이력 (페이지네이션)

# 약속
GET    /api/v1/promises?teamId=
GET    /api/v1/promises/fulfillment-rate     ← 리더 약속 이행률 통계

# 멤버
GET    /api/v1/career-memory
GET    /api/v1/members/me/speech-trend       ← 멤버 Speech Act 트렌드 (페이지네이션)
GET    /api/v1/members/me/portfolio          ← 멤버 포트폴리오 (미팅 이력 + 점수 트렌드 + 커리어 태그)
```

상세 요청/응답 스펙: **API_SPEC.md** 참조

---

## 10. IoT 연동 (WithUs)

### 기능

LED 램프를 통한 리더 발화 타이밍 실시간 안내.

리더 발화 비율이 권장치(40%)를 초과하면 램프 색상이 서서히 변화하여, 미팅 흐름을 깨지 않으면서 리더에게 Ambient 피드백을 제공한다.

### 당위성

1. **실시간 코칭 루프**: 소프트웨어만으로는 미팅 중 비침습적 개입 불가. 램프 색상 변화는 리더만 인지하는 Ambient 신호.
2. **시간축 완성**: 램프(실시간 피드백) + 소프트웨어(사후 심층 분석)로 피드백 빈틈 해소.
3. **데이터 해자**: 하드웨어+소프트웨어 결합은 복제 어려움. 음성 타이밍 데이터는 고유 데이터셋.
4. **B2B 웰니스 트렌드**: 미팅룸의 코칭 램프는 "리더십 품질 투자"의 가시적 상징물.

---

## 11. 디자인 원칙

- **올 라이트 모드**: background #F8F9FB, cards #FFFFFF, border #E5E7EB
- 리더 화면: 높은 데이터 밀도 (대시보드)
- 멤버 화면: 저널 느낌, 더 많은 여백 (Career Memory)
- AI 아이콘/라벨 완전 제거 → "시스템이 자동 집계한 통계" 느낌

---

## 12. 팀 구성 + 역할

| 역할 | 이름 | 담당 |
|------|------|------|
| PM / BE1 | 이승규 | AI 파이프라인, 분석 도메인, Scoring 설계, 프로젝트 총괄 |
| BE2 | 준영 | 인증(Auth), CRUD, 인프라, DB 초기 세팅 |
| FE1 | - | 페이지 구현, 비즈니스 로직, API 연동 |
| FE2 | - | 디자인 시스템, 데이터 시각화 (레이더, 블로커 피라미드) |

---

## 13. 일정

| 기간 | 테마 | 핵심 목표 |
|------|------|-----------|
| Sprint 0 (5/2~5/7) | 프로토타입 | 5/8 멘토 회의용 데모 ✅ |
| Week 2 (5/8~5/16) | 핵심 API + 기획 확정 | BE 머지 ✅, Scoring 공식 ✅, Honesty Gap 방향성 전환 ✅ |
| Week 3 (5/17~5/23) | 집중 개발 (해커톤) | 5/18 회원가입~STT 실연동, 5/20 AI 파이프라인 교체, 5/21 교수님 미팅 |
| Week 4 (5/24~5/30) | 통합 + 배포 | E2E 테스트, Railway/Vercel 배포, 데모 준비 |

---

## 14. 미해결 / 향후 과제

- [ ] 리더 코칭 스코어 (경청지수 + 촉진지수 + 이행지수) — MVP 이후 레이어
- [ ] 구글 OAuth 로그인 연동 — 자체 인증 완성 후
- [ ] IoT 램프 실물 연동 — WithUs 대회용
- [ ] 퇴사 예측 모델 학습 — 6개월+ 데이터 축적 후
- [ ] 멀티테넌트 / 조직 관리 기능
- [ ] 녹음 동의 프로세스 / 개인정보 처리 법적 검토

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-05-03 | v1.0 | 초안 작성 |
| 2026-05-08 | v1.1 | 멘토 피드백 반영 (리더십 포지셔닝, IoT 확정, 블로커 맵 UI) |
| 2026-05-12 | v2.0 | 피봇 반영 (aiScore→safetyScore, speechActs 3종, Fact-Based Output) |
| 2026-05-15 | v2.2 | Scoring 공식 확정, Honesty Gap 방향성 전환, 블로커 피라미드 명칭, 해커톤 마일스톤 |
| 2026-05-28 | v2.3 | API 엔드포인트 목록 실코드 기준 갱신 — 신규 엔드포인트 추가 (surveys/history, promises/fulfillment-rate, members/me/speech-trend, members/me/portfolio), 미팅 목록/단건 조회·팀 생성·참여 엔드포인트 누락분 보완 |
