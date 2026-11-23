# ReadB Server — Backend CLAUDE.md

## 프로젝트 정의
ReadB(리드비)는 1on1 미팅의 Honesty Gap을 AI로 수치화하는 B2B HR SaaS의 백엔드 서버.

## 핵심 분석 프레임워크: 3-Gap Model

### Gap ① Alignment Gap (기대 vs 실제 의제)
- 사전 서베이에서 리더/멤버가 각각 선택한 "논의할 주제"와 실제 미팅에서 다뤄진 주제를 비교
- 스코어링: 0(언급 없음) → 25(멤버 제기했으나 리더 묵살) → 40(10% 미만 언급) → 60(논의했으나 결론 없음) → 85(논의 + 결론) → 100(논의 + 액션아이템)
- 구현: 별도 Gemini 호출로 주제별 status·근거 원문만 추출, 점수는 서버가 계산(주제 최대 3개 평균). 25(묵살)는 화자 라벨이 있는 전사에서만 인정하고 아니면 40으로 처리. 서베이 주제가 없으면 null

### Gap ② Honesty Gap (서베이 응답 vs 관찰된 행동)
- 서베이에서 "좋음"이라 답했는데, 실제 미팅에서 Initiative 0회 + Vulnerability 0회 → Gap 감지
- **핵심 원칙**: LLM의 감정 추론이 아닌, Speech Act 카운팅(관찰 가능한 사실)과 서베이 응답을 비교
- Safety Score = Speech Act 기반 행동 지표 (아래 참조)

#### 방향성 있는 Gap (signed gap)
- 공식: `gap = surveyScore − safetyScore`
- `gap > 0` → **OVERREPORT** (서베이는 좋다는데 행동은 위축): 알림 대상
- `gap ≤ 0` → **UNDERREPORT** (서베이는 낮은데 행동은 활발): 무조건 SAFE, 알림 없음
- API 응답에 `direction` 필드 추가 (`OVERREPORT` | `UNDERREPORT`)

#### riskLevel (OVERREPORT 일 때만 적용)
| gap 값  | riskLevel  |
|---------|------------|
| 1~20    | SAFE       |
| 21~40   | CAUTION    |
| 41~60   | WARNING    |
| 61+     | DANGER     |

**변경 이유 (2026-05-08 이후 확정)**: 현업 종사자들이 에너지 레벨을 보수적(2~3)으로 응답하는 경향 때문에 절대값 기반이면 겸손한 응답자도 위험으로 오분류됨. UNDERREPORT는 자기 평가가 행동보다 박한 것이므로 위험 신호가 아니라 오히려 건강한 상태로 간주.

### Gap ③ Execution Gap (과거 약속 vs 이행)
- 이전 미팅에서 합의된 약속(Promise)이 이번 미팅에서 언급/이행되었는지 추적
- 스코어링(약속별): 0(언급 없음) → 20(미이행, 사유 없음) → 50(미이행, 합리적 사유) → 70(진행 중) → 100(완료)
- 전체 점수 = 개별 약속 점수의 평균

## Safety Score: Speech Act 카운팅

AI 감정 추론 대신 **관찰 가능한 발화 행위(Speech Act)**를 카운팅하여 팀 심리적 안전감을 수치화.

### 3가지 행동 지표
1. **Vulnerability** (취약성 표현): "잘 모르겠습니다", "실수했습니다", "도움이 필요합니다" 등
   - 포함: 불확실성 인정, 실수 고백, 도움 요청
   - 제외: 사교적 겸손("에이 뭐 저야 별로..."), 맥락 없는 관용표현
2. **Constructive Dissent** (건설적 반대): "다른 의견인데요", "그 방법보다는...", "한 가지 우려가..."
   - 포함: 대안 제시 동반 반대, 근거 있는 우려 표명
   - 제외: 단순 불만("그건 안 될 거 같은데"), 인신공격
3. **Initiative** (자발적 제안): "제가 해볼게요", "이런 아이디어가 있는데", "제안드리자면"
   - 포함: 자발적 업무 인수, 새 아이디어 제안, 프로세스 개선 제안
   - 제외: 지시에 대한 단순 수락("네 알겠습니다")

### 경계 규칙
- **애매하면 카운팅하지 않는다** (보수적 접근)
- 각 Speech Act는 원문 인용 + 타임스탬프와 함께 저장

### 산출 공식 (2026-05-08 이후 확정)

```
safetyScore = V_score + D_score + I_score   (0 ~ 100)
```

**1) 정규화 (미팅 길이 보정 — 30분 기준)**
```
adjusted_count = round(raw_count × 30 ÷ actual_duration_minutes)
```

**2) 카운트 → 점수 변환표 (체감 체계: 첫 발화가 점수의 ~50% 차지)**

| adjusted_count | V_score (max 40) | D_score (max 35) | I_score (max 25) |
|:--------------:|:----------------:|:----------------:|:----------------:|
| 0              | 0                | 0                | 0                |
| 1              | 20               | 18               | 13               |
| 2              | 32               | 28               | 20               |
| 3              | 38               | 33               | 24               |
| 4+             | 40 (max)         | 35 (max)         | 25 (max)         |

체계 설계 의도: 0회 → 1회로 넘어가는 첫 발화 가중치를 높여, 침묵하던 멤버가 한 번이라도 말하기 시작하면 즉시 시그널로 잡히도록.

## Survey Score: 사전 서베이 점수 (2026-05-08 이후 확정)

멤버가 미팅 전 제출하는 서베이로부터 산출하는 자기 보고 점수.

```
surveyScore = clamp(0, 100, energyLevel × 20 + Σ issue_adjustments)
```

- `energyLevel`: 1~5 척도 (기본 20점 단위 스케일)
- `issue_adjustments`: 멤버가 체크한 이슈 항목별 가감점

**이슈 가감점**

| 이슈 항목         | 가감점 |
|------------------|--------|
| 업무 블로커       | −10    |
| 리소스 요청       | −5     |
| 팀 분위기         | −3     |
| 프로세스 개선     | −3     |
| 그 외             | 0      |

## 4사분면 정의 (2026-05-08 이후 확정)

대시보드 산점도: **X축 = surveyScore, Y축 = safetyScore, 임계값 50 고정**.

| 사분면            | 조건                                | 의미                                        |
|------------------|-------------------------------------|--------------------------------------------|
| **STABLE**       | survey ≥ 50, safety ≥ 50            | 건강한 상태                                |
| **SILENT_RISK**  | survey ≥ 50, safety < 50            | 서베이는 좋다는데 행동은 위축 → 핵심 알림 대상 |
| **EXPLICIT_RISK**| survey < 50, safety < 50            | 본인도 인지하고 행동도 위축 → 명시적 위험   |
| **CONSERVATIVE** | survey < 50, safety ≥ 50            | 자기 평가만 박함 (UNDERREPORT) → 안전      |

## Rolling Baseline + 이상 탐지

- 개인별 최근 3회 미팅 평균을 베이스라인으로 사용
- 30% 이상 하락 시 Silent Risk 알림 (리더 대시보드)
- **Cold Start 규칙**: 1~2회차 미팅은 절대값 스코어링만 사용 (베이스라인 미형성)
- 알림 문구는 AI 해석이 아닌 사실 기반: "최근 3회 평균 대비 Initiative 42% 감소" 형태

## Fact-Based Output 원칙 (BE→FE 응답 설계)

- **금지**: AI가 해석/판단한 라벨 ("수동 공격적", "소극적 참여", "번아웃 징후")
- **허용**: 원문 인용 + 타임스탬프 + 카운트 수치 + 베이스라인 대비 변화율
- 예시: "Vulnerability 발화 3회 (이전 3회 평균: 5.3회, -43%)" + 해당 발화 원문 목록
- FE가 사용자에게 보여주는 화면에서 해석은 사용자 스스로 하도록 설계

## ML-Ready 데이터 파이프라인

미팅별 구조화된 데이터 오브젝트를 축적하여 향후 예측 모델(퇴사 예측, 번아웃 예측) 학습 데이터로 활용.

```
[T-1] 사전 서베이 → surveys 테이블 (scores JSONB)
[T-0] 미팅 정량 데이터 → analyses 테이블 (speech_acts JSONB, gap scores)
[T+1] 스코어링 결과 → analyses 테이블 (safety_score, alignment_gap, honesty_gap, execution_gap)
[T+2] 행동 데이터 → promises 테이블 (이행률 추적)
```

## 기술 스택
- Java 17 + Spring Boot 3.2
- Spring Data JPA + PostgreSQL (Supabase)
- Spring Security + JWT (jjwt 0.12+)
- Supabase Storage (녹음 파일 임시 저장)
- Groq Whisper API (whisper-large-v3, OpenAI 호환 엔드포인트) — STT
- Gemini (gemini-3.8-flash, OpenAI 호환 엔드포인트) — 분석 LLM
- OpenAI Embedding API + pgvector (RAG)
- Gradle (빌드)
- Railway (배포)

## 아키텍처 원칙
- **Adapter Pattern**: STT, LLM 등 외부 연동은 반드시 인터페이스 → 구현체 분리. @Profile로 구현체 교체.
- **통짜 녹음**: 미팅 종료 후 전체 WebM 파일을 한 번에 수신. 15초 청킹 아님.
- **비동기 분석**: @Async + 상태 폴링. 녹음 업로드 → 즉시 202 응답 → 클라이언트가 /status 폴링.
- **JSON 응답 파싱**: LLM 응답은 항상 구조화된 JSON. 파싱 실패 시 재시도 1회.

## 인증 순서 (2026-05-08 이후 확정)
- **1단계**: 자체 회원가입/로그인 (이메일 + 비밀번호 + JWT) 우선 구현
- **2단계**: 구글 OAuth는 추후 연동 (해커톤 이후)
- 이유: 데모 일정 압박 + OAuth 콜백 URL/도메인 셋업 비용. 자체 인증으로 먼저 플로우 폐쇄 회로 완성한 뒤 OAuth는 별 PR.

## 해커톤 Mock 전략 (2026-05-18 데모)

5/18 데모는 **회원가입 ~ STT 변환까지는 실데이터**, 대시보드/분석 결과는 **Mock**으로 진행.

**구현 방식 — Spring `@Profile` 분기**
- `MockAdapter` 구현체를 `@Profile("mock")` 으로 제공
  - `MockLlmAdapter`, `MockRagAdapter` 등이 미리 정의된 Speech Act/스코어 응답을 즉시 반환
- 5/20에 `@Profile("prod")` 로 실 AI 파이프라인 구현체로 교체
  - `ClaudeAdapter`, `GeminiAdapter`, `PgVectorAdapter` 활성화
- `application.yml` 의 `spring.profiles.active` 만 바꾸면 전환

**왜 이렇게 가는가**
- 5/18 데모는 플로우(회원가입→녹음→STT→대시보드 조회) 완결성이 핵심. 실 LLM 비용/지연을 떠안을 필요 없음.
- Adapter Pattern 원칙(인터페이스 분리)을 이미 채택했기 때문에 Mock↔Prod 교체 비용이 거의 0.
- 5/20 전환은 Profile 한 줄 변경 + 환경변수(API 키) 주입만으로 완료.

## 디렉토리 구조

```
src/main/java/com/readb/
│
├── config/                    # [공유] 둘 다 수정 가능하나 사전 공유 필수
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── AsyncConfig.java
│   └── SwaggerConfig.java
│
├── domain/                    # [공유] 엔티티 추가/수정 시 반드시 상대방에게 알린 후 작업
│   ├── user/
│   │   └── User.java
│   ├── team/
│   │   └── Team.java
│   ├── meeting/
│   │   └── Meeting.java
│   ├── recording/
│   │   └── Recording.java
│   ├── survey/
│   │   └── Survey.java
│   ├── analysis/
│   │   └── Analysis.java
│   └── promise/
│       └── Promise.java
│
├── repository/
│   ├── UserRepository.java
│   ├── TeamRepository.java
│   ├── MeetingRepository.java
│   ├── RecordingRepository.java
│   ├── SurveyRepository.java
│   ├── AnalysisRepository.java
│   └── PromiseRepository.java
│
├── service/                   # [핵심 분리 영역 — 절대 상대 파일 건드리지 않기]
│   ├── auth/
│   │   └── AuthService.java
│   ├── user/
│   │   └── UserService.java
│   ├── team/
│   │   └── TeamService.java
│   ├── meeting/
│   │   └── MeetingService.java
│   ├── survey/
│   │   └── SurveyService.java
│   ├── analysis/
│   │   ├── AnalysisOrchestrator.java  ← 핵심 파이프라인
│   │   ├── AnalysisService.java
│   │   └── PromiseService.java
│   └── storage/
│       └── FileStorageService.java  ← Supabase Storage 업/다운
│
├── adapter/
│   ├── stt/
│   │   ├── SttAdapter.java            (인터페이스)
│   │   └── GroqWhisperAdapter.java        (구현체)
│   ├── llm/
│   │   ├── LlmAdapter.java            (인터페이스)
│   │   ├── ClaudeAdapter.java         (구현체)
│   │   └── GeminiAdapter.java         (구현체)
│   └── rag/
│       ├── RagAdapter.java            (인터페이스)
│       └── PgVectorAdapter.java       (구현체 — pgvector on Supabase)
│
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── TeamController.java
│   ├── SurveyController.java
│   ├── MeetingController.java
│   ├── AnalysisController.java
│   ├── LeaderController.java  ← radar, blockers, promises
│   └── MemberController.java  ← career-memory
│
├── dto/
│   ├── auth/
│   ├── user/
│   ├── team/
│   ├── survey/
│   ├── meeting/
│   └── analysis/
│
└── common/                    # [공유] 수정 전 반드시 상대방에게 알릴 것
    ├── exception/
    │   ├── GlobalExceptionHandler.java
    │   └── ErrorCode.java               ← enum 값 추가는 자유, 기존 값 변경은 PR에 명시
    ├── response/
    │   └── ApiResponse.java             ← 구조 변경은 PR에 명시
    └── util/
        └── JwtUtil.java
```

## 작업 방식

팀원 모두 BE·FE 구분 없이 풀스택으로 개발한다. 파일·도메인·API를 BE1/BE2처럼 역할로 나누지 않는다.

0. **상대 파일 수정 금지 (이니셜 기준)**: 담당은 BE/FE가 아니라 브랜치에 적힌 이니셜(`feat/<이니셜>/...`)로 구분한다. 다른 이니셜의 브랜치와 그 브랜치에서 작업 중인 파일은 수정하지 않는다. 수정이 필요하면 슬랙/디코로 해당 팀원에게 먼저 공유한다.
1. **domain/ 엔티티 변경**: 컬럼 추가·삭제 시 `db/schema.sql`과 `db/migrations/YYYY-MM-DD_*.sql`을 함께 갱신하고 PR 본문에 명시한다. `ddl-auto: validate`라 운영 DB에 마이그레이션을 먼저 적용해야 서버가 뜬다.
2. **common/ 변경**: ErrorCode enum에 값 추가는 자유. 기존 값 변경·삭제나 ApiResponse 구조 변경은 FE 파싱에 영향을 주므로 PR에 명시한다.
3. **application.yml 분리**: 공통 설정은 application.yml, 개인 설정은 application-local.yml (.gitignore). API 키는 환경변수로.
4. **API 변경**: 요청·응답 형식이 바뀌면 같은 PR에서 `Docs/API_SPEC.md`와 FE 호출부를 함께 고친다.
5. **브랜치 네이밍**: `feat/<이니셜>/<주제>`, `fix/<이니셜>/<주제>` (예: `feat/js/team-health-trend-chart`).
6. **PR 머지 순서**: domain/ 또는 common/ 변경이 포함된 PR은 먼저 머지하고, 다른 브랜치는 main을 받아 rebase 후 작업을 계속한다.

## API 엔드포인트 (2026-05-08 기준, 최신 목록은 Docs/API_SPEC.md)

**전 경로 `/api/v1/` 접두사 적용.** 공통 응답 래퍼:
```json
{ "success": true, "code": "OK", "message": "...", "data": { ... } }
```

```
# 인증·유저·팀·서베이
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/teams/{teamId}/members
POST   /api/v1/surveys                          (사전 서베이 제출)
GET    /api/v1/surveys?meetingId=               (서베이 조회)

# 미팅·분석·리더/멤버
POST   /api/v1/meetings                         (미팅 생성)
POST   /api/v1/meetings/{id}/recording          (녹음 업로드 → 비동기 분석)
GET    /api/v1/meetings/{id}/status             (분석 진행 상태)
GET    /api/v1/meetings/{id}/analysis           (분석 결과)
GET    /api/v1/leader/radar?teamId=             (Silent Risk 산점도 데이터)
GET    /api/v1/teams/{teamId}/blocker-pyramid   (Blocker Pyramid — 구 /api/leader/blockers)
GET    /api/v1/leader/promises                  (Promise Ledger)
GET    /api/v1/member/career-memory             (Career Memory 타임라인)
GET    /api/v1/member/feedback?meetingId=       (코칭 피드백 카드)
```

**변경 사항**
- 모든 경로 `/api/v1/` 접두사 적용 (버저닝)
- `GET /api/leader/blockers` → `GET /api/v1/teams/{teamId}/blocker-pyramid` 명칭/경로 변경
- 응답은 위 공통 래퍼로 통일 (FE 파싱 일관성)

## DB 스키마 (최신 정의는 BE/db/schema.sql)

```sql
users       (id, email, password_hash, name, role, team_id, created_at)
teams       (id, name, leader_id, created_at)
surveys     (id, meeting_id, member_id, scores JSONB, submitted_at)

-- users 테이블에 churned_at TIMESTAMP NULL 컬럼 추가 (향후 퇴사 예측 모델용)

meetings    (id, team_id, leader_id, member_id, status, created_at)
recordings  (id, meeting_id, file_url, duration_sec, transcript TEXT, created_at)
analyses    (id, meeting_id,
            alignment_gap FLOAT, honesty_gap FLOAT, execution_gap FLOAT,
            safety_score FLOAT,
            speech_acts JSONB,          -- {vulnerability: [{text, timestamp}], constructiveDissent: [...], initiative: [...]}
            blocker_keywords JSONB,
            leader_feedback JSONB, member_feedback JSONB,
            career_tags JSONB,
            baseline_data JSONB,        -- {prev_avg_vulnerability, prev_avg_constructiveDissent, prev_avg_initiative}
            created_at)
promises    (id, meeting_id, owner_id, content, deadline, status, created_at)
```

## 개발 명령어
```bash
./gradlew bootRun                    # 로컬 실행
./gradlew test                       # 테스트
./gradlew build -x test              # 빠른 빌드 (테스트 스킵)
```

## LLM Cascading 전략

```
Step 1: Whisper API → 전체 Transcript 생성
Step 2: Gemini (저비용) → 구조화 작업
        - Speech Act 분류 (Vulnerability / Constructive Dissent / Initiative)
        - 주제별 발화 매핑
        - Promise 추출
Step 3: Claude Sonnet (고품질) → 판단 작업
        - 3-Gap 스코어링 (Alignment / Honesty / Execution)
        - 리더 코칭 피드백 생성
        - 멤버 Career Memory 태그 생성
```

## 주의사항
- Whisper API 25MB 제한: 초과 시 ffmpeg로 서버에서 분할 → 순차 호출 → 병합
- 오디오 원본은 분석 완료 즉시 Supabase Storage에서 영구 삭제
- LLM 응답 JSON 파싱 실패 시 1회 재시도, 그래도 실패 시 status를 FAILED로 마킹
- application-local.yml은 절대 커밋 금지 (.gitignore 확인)
- **Fact-Based 출력 원칙 준수**: API 응답에 AI 해석 라벨 포함 금지. 원문+수치+변화율만 반환
