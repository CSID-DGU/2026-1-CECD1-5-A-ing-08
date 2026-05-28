# ReadB API 명세서 v2

> **Base URL**: `https://api.readb.io` (개발: `http://localhost:8080`)  
> **버전**: `v1`  
> **인증**: JWT Bearer Token (`Authorization: Bearer <token>`)  
> **응답 형식**: 모든 응답은 `ApiResponse<T>` 래퍼 사용

---

## 공통 규약

### 공통 응답 형식
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... }
}
```

### 에러 응답
```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다.",
  "data": null
}
```

### HTTP 상태 코드
| 코드 | 의미 |
|------|------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (비동기 작업 시작) |
| 400 | Bad Request (입력 오류) |
| 401 | Unauthorized (토큰 없음/만료) |
| 403 | Forbidden (권한 없음) |
| 404 | Not Found |
| 409 | Conflict (중복) |
| 413 | Payload Too Large (파일 크기 초과) |
| 500 | Internal Server Error |

---

## 1. AUTH

### 1.1 회원가입
```
POST /api/v1/auth/signup
```
**인증 필요**: X

**Request Body**
```json
{
  "email": "kang@company.com",
  "password": "password123!",
  "name": "강다은",
  "role": "MEMBER",
  "jobTitle": "시니어 FE 엔지니어"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| email | string | O | 이메일 형식, 중복 불가 |
| password | string | O | 8자 이상, 영문+숫자+특수문자 포함 |
| name | string | O | 2~20자 |
| role | string | O | `LEADER` 또는 `MEMBER` |
| jobTitle | string | X | 최대 50자 |

**Response** `201`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": 1,
      "email": "kang@company.com",
      "name": "강다은",
      "role": "MEMBER",
      "jobTitle": "시니어 FE 엔지니어",
      "teamId": null
    }
  }
}
```

> 회원가입 즉시 토큰을 발급하여 로그인 없이 바로 서비스 진입 가능

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| EMAIL_ALREADY_EXISTS | 409 | 이미 가입된 이메일 |
| INVALID_INPUT | 400 | 필수 필드 누락 또는 형식 오류 |

---

### 1.2 로그인
```
POST /api/v1/auth/login
```
**인증 필요**: X

**Request Body**
```json
{
  "email": "lee@company.com",
  "password": "password123!"
}
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "로그인 성공",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": 2,
      "email": "lee@company.com",
      "name": "이준혁",
      "role": "LEADER",
      "jobTitle": "팀장",
      "teamId": 1
    }
  }
}
```

| 토큰 | 만료 |
|------|------|
| accessToken | 1시간 |
| refreshToken | 14일 |

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| INVALID_CREDENTIALS | 401 | 이메일 또는 비밀번호 불일치 |

---

### 1.3 토큰 갱신
```
POST /api/v1/auth/refresh
```
**인증 필요**: X

**Request Body**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "토큰이 갱신되었습니다.",
  "data": {
    "accessToken": "eyJhbGci...(새 토큰)",
    "refreshToken": "eyJhbGci...(새 토큰)"
  }
}
```

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| EXPIRED_TOKEN | 401 | refreshToken 만료 |
| INVALID_TOKEN | 401 | 유효하지 않은 토큰 |

---

## 2. USER

### 2.1 내 정보 조회
```
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "id": 1,
    "email": "kang@company.com",
    "name": "강다은",
    "role": "MEMBER",
    "jobTitle": "시니어 FE 엔지니어",
    "teamId": 1,
    "teamName": "Product A팀"
  }
}
```

---

## 3. TEAM

### 3.1 팀 생성 (리더 전용)
```
POST /api/v1/teams
Authorization: Bearer <token> (LEADER)
```

**Request Body**
```json
{
  "name": "Product A팀"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| name | string | O | 2~30자 |

**Response** `201`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "팀이 생성되었습니다.",
  "data": {
    "id": 1,
    "name": "Product A팀",
    "leaderId": 2,
    "leaderName": "이준혁",
    "inviteCode": "READB-A1B2C3"
  }
}
```

---

### 3.2 팀 초대 코드로 참여 (멤버)
```
POST /api/v1/teams/join
Authorization: Bearer <token> (MEMBER)
```

**Request Body**
```json
{
  "inviteCode": "READB-A1B2C3"
}
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "팀에 참여했습니다.",
  "data": {
    "teamId": 1,
    "teamName": "Product A팀"
  }
}
```

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| TEAM_NOT_FOUND | 404 | 유효하지 않은 초대 코드 |
| ALREADY_IN_TEAM | 409 | 이미 팀에 소속된 멤버 |

---

### 3.3 팀 멤버 목록 조회
```
GET /api/v1/teams/{teamId}/members
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "id": 1,
      "name": "강다은",
      "jobTitle": "시니어 FE 엔지니어",
      "role": "MEMBER"
    },
    {
      "id": 3,
      "name": "김민준",
      "jobTitle": "FE 엔지니어",
      "role": "MEMBER"
    }
  ]
}
```

---

## 4. TEAM DASHBOARD (리더 전용)

### 4.1 팀 대시보드 조회 (팀 헬스 스코어)
```
GET /api/v1/teams/{teamId}/dashboard
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "teamId": 1,
    "teamHealthScore": 74.0,
    "trend": "IMPROVING",
    "alerts": [
      "강다은 — Initiative 최근 3회 평균 대비 100% 감소",
      "윤재원 — Safety Score 기준 이하 (Silent Risk)"
    ]
  }
}
```

> **팀 헬스 스코어 산출**: `safetyScore 평균 × 0.6 + surveyScore 평균 × 0.4`  
> **trend**: `IMPROVING` (전월 대비 +5 이상) / `STABLE` (±5 이내) / `DECLINING` (-5 이하)  
> **alerts**: 30% 이상 하락한 멤버 알림 (Fact-Based 문구, AI 해석 라벨 없음)

---

### 4.2 블로커 피라미드 조회
```
GET /api/v1/teams/{teamId}/blocker-pyramid
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "blockerKeywords": [
      { "keyword": "QA 리소스 부족", "count": 5, "mentionedBy": 3 },
      { "keyword": "프론트엔드 소통 지연", "count": 4, "mentionedBy": 2 },
      { "keyword": "코드 리뷰 병목", "count": 4, "mentionedBy": 3 },
      { "keyword": "기획 변경 잦음", "count": 3, "mentionedBy": 2 },
      { "keyword": "API 스펙 불명확", "count": 3, "mentionedBy": 1 }
    ],
    "actionPrescriptions": [
      {
        "severity": "ERROR",
        "title": "QA 리소스 부족 반복 언급",
        "dataSummary": "3명의 멤버가 최근 3회 미팅에서 총 5회 언급",
        "actionGuide": "이번 주 주간 회의에서 배포 일정 조정 또는 QA 인력 충원 안건을 상정하세요."
      },
      {
        "severity": "WARNING",
        "title": "Speech Act 급감 멤버 감지",
        "dataSummary": "강다은, 윤재원 — Initiative 최근 3회 평균 대비 60% 이상 감소",
        "actionGuide": "이번 주 안에 비공식 1on1을 먼저 배정하세요."
      },
      {
        "severity": "INFO",
        "title": "Alignment Gap 개선 가능",
        "dataSummary": "팀 평균 Alignment Gap 35점 (논의했으나 결론 없음 수준)",
        "actionGuide": "스프린트 킥오프 전 30분 내 의제 사전 공유를 도입하세요."
      }
    ]
  }
}
```

> **Fact-Based 원칙 적용**: `aiDiagnosis`(AI 종합 진단) 제거 → 대신 각 처방전에 `dataSummary`(수치 근거) + `actionGuide`(행동 처방) 분리

---

### 4.3 팀 사분면 레이더 조회
```
GET /api/v1/teams/{teamId}/quadrant
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "memberId": 1,
      "memberName": "강다은",
      "surveyScore": 87.0,
      "safetyScore": 31.0,
      "honestyGap": 56.0,
      "direction": "OVERREPORT",
      "riskLevel": "DANGER"
    },
    {
      "memberId": 3,
      "memberName": "김민준",
      "surveyScore": 80.0,
      "safetyScore": 82.0,
      "honestyGap": -2.0,
      "direction": "UNDERREPORT",
      "riskLevel": "SAFE"
    }
  ]
}
```

> 응답은 `List<RadarDataPoint>` (배열). quadrant 문자열 대신 `direction` + `riskLevel`로 분리.  
> FE에서 사분면 판별: `surveyScore ≥ 50 && safetyScore ≥ 50` → STABLE 등 (PRD 3.3 참조).

> **사분면 기준** (X축: surveyScore, Y축: safetyScore)
> | 사분면 | 조건 | 의미 |
> |--------|------|------|
> | STABLE | survey ≥ 50 && safety ≥ 50 | 안정 (표면+행동 모두 양호) |
> | SILENT_RISK | survey ≥ 50 && safety < 50 | 조용한 위험 (괜찮다고 하지만 행동 지표 낮음) |
> | EXPLICIT_RISK | survey < 50 && safety < 50 | 명시적 위험 (표면+행동 모두 부정) |
> | CONSERVATIVE | survey < 50 && safety ≥ 50 | 보수적 응답 (서베이는 부정이지만 행동은 활발) |

---

## 5. MEETING

### 5.1 1on1 미팅 생성 (리더)
```
POST /api/v1/meetings
Authorization: Bearer <token> (LEADER)
```

**Request Body**
```json
{
  "memberId": 1,
  "scheduledAt": "2026-05-08T14:00:00"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| memberId | number | O | 1on1 대상 멤버 ID |
| scheduledAt | string | X | 예정 일시 (ISO-8601). 생략 시 현재 시각 |

**Response** `201`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "미팅이 생성되었습니다.",
  "data": {
    "meetingId": 10,
    "round": 12,
    "memberId": 1,
    "memberName": "강다은",
    "scheduledAt": "2026-05-08T14:00:00",
    "status": "PENDING",
    "overduePromises": [
      {
        "promiseId": 2,
        "content": "AWS 프로덕션 접근 권한 부여",
        "dueDate": "2026-04-20"
      }
    ]
  }
}
```

> `round`: 해당 리더-멤버 페어의 누적 회차 (서버 자동 산출)  
> `overduePromises`: 미이행 약속 자동 포함 (F-63 요구사항)

---

### 5.2 미팅 목록 조회
```
GET /api/v1/meetings?memberId={memberId}
Authorization: Bearer <token>
```

**Query Params**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| memberId | X | 특정 멤버 필터 (리더 전용). 생략 시 요청자가 리더 또는 멤버로 참여한 전체 1on1 목록 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "meetingId": 10,
      "round": 12,
      "partnerName": "강다은",
      "scheduledAt": "2026-05-08T14:00:00",
      "durationSec": 2400,
      "status": "COMPLETED"
    },
    {
      "meetingId": 11,
      "round": 1,
      "partnerName": "김민준",
      "scheduledAt": "2026-05-09T10:00:00",
      "durationSec": null,
      "status": "CREATED"
    }
  ]
}
```

---

### 5.3 단일 미팅 조회
```
GET /api/v1/meetings/{meetingId}
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "meetingId": 10,
    "round": 12,
    "scheduledAt": "2026-05-08T14:00:00",
    "durationSec": 2400,
    "status": "CREATED",
    "leaderName": "이준혁",
    "memberName": "강다은",
    "surveySubmitted": true
  }
}
```

> `surveySubmitted`: 멤버의 사전 서베이 제출 여부. 리더가 미팅 시작 전 확인용.

---

## 6. SURVEY (사전 서베이)

### 6.1 사전 서베이 제출 (멤버)
```
POST /api/v1/surveys
Authorization: Bearer <token> (MEMBER)
```

**Request Body**
```json
{
  "meetingId": 10,
  "issues": ["업무 블로커", "커리어 성장"],
  "energyLevel": 3,
  "desiredRoles": ["방향성 코칭"]
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| meetingId | number | O | 존재하는 미팅, 본인이 참여하는 미팅 |
| issues | string[] | O | 1개 이상 선택 |
| energyLevel | number | O | 1~5 정수 |
| desiredRoles | string[] | O | 1개 이상 선택 |

**이슈 선택지** (FE 체크박스 렌더링)
| 값 | 표시 텍스트 | 점수 영향 |
|----|-------------|-----------|
| `업무 블로커` | 업무 진행을 막는 이슈가 있어요 | -10 |
| `리소스 요청` | 인력/도구 등 리소스가 부족해요 | -5 |
| `커리어 성장` | 커리어 방향에 대해 이야기하고 싶어요 | 0 |
| `팀 분위기` | 팀 분위기/협업에 대해 이야기하고 싶어요 | -3 |
| `프로세스 개선` | 프로세스 개선이 필요해요 | -3 |
| `인정/피드백` | 인정이나 피드백을 받고 싶어요 | 0 |
| `기타` | 기타 주제 | 0 |

**기대 역할 선택지**
| 값 | 표시 텍스트 |
|----|-------------|
| `방향성 코칭` | 방향성을 잡아주세요 |
| `의사결정 도움` | 의사결정을 도와주세요 |
| `리소스 지원` | 리소스를 확보해 주세요 |
| `경청/공감` | 들어주시고 공감해 주세요 |
| `기술적 멘토링` | 기술적 조언이 필요해요 |

**Response** `201`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "서베이가 제출되었습니다.",
  "data": {
    "surveyId": 5,
    "surveyScore": 50.0,
    "submittedAt": "2026-05-08T13:30:00"
  }
}
```

> **surveyScore 산출 로직** (서버 자동 계산)  
> 기본점 = `energyLevel × 20` (20~100)  
> 이슈 가감점 적용 → 0~100 클램핑

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| SURVEY_ALREADY_SUBMITTED | 409 | 이미 서베이를 제출한 미팅 |
| FORBIDDEN | 403 | 본인이 참여하지 않는 미팅 |
| MEETING_NOT_FOUND | 404 | 존재하지 않는 미팅 |

---

### 6.2 서베이 조회
```
GET /api/v1/surveys/{meetingId}
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "surveyId": 5,
    "issues": ["업무 블로커", "커리어 성장"],
    "energyLevel": 3,
    "desiredRoles": ["방향성 코칭"],
    "surveyScore": 50.0,
    "submittedAt": "2026-05-08T13:30:00"
  }
}
```

---

### 6.3 서베이 이력 조회 (멤버)
```
GET /api/v1/surveys/history
Authorization: Bearer <token> (MEMBER)
```

**Query Params** (Spring Pageable)
| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| page | X | 0 | 페이지 번호 (0-indexed) |
| size | X | 20 | 페이지 크기 |
| sort | X | submittedAt,desc | 정렬 기준 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "content": [
      {
        "meetingId": 10,
        "submittedAt": "2026-05-08T13:30:00",
        "scores": {
          "energyLevel": 3,
          "issues": ["업무 블로커", "커리어 성장"],
          "desiredRoles": ["방향성 코칭"],
          "surveyScore": 50.0
        }
      }
    ],
    "totalElements": 12,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

> 본인의 과거 서베이 응답 이력을 최신순으로 조회. `scores` 필드는 JSONB 그대로 반환.

---

## 7. RECORDING & ANALYSIS

### 7.1 녹음 파일 업로드
```
POST /api/v1/meetings/{meetingId}/recording
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | File | O | WebM 파일 (최대 25MB) |
| durationSec | number | X | 녹음 길이(초). FE에서 MediaRecorder로 측정하여 전송 |

**FE 구현 예시**
```typescript
// features/meeting/useUploadRecording.ts
const uploadRecording = async (meetingId: number, blob: Blob, durationSec: number) => {
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');
  formData.append('durationSec', String(durationSec));

  const response = await client.post(
    `/meetings/${meetingId}/recording`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};
```

**Response** `202` (즉시 반환, 비동기 분석 시작)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "분석이 시작되었습니다.",
  "data": {
    "meetingId": 10,
    "status": "ANALYZING",
    "message": "/api/v1/analysis/{meetingId}/status 에서 진행률을 확인하세요."
  }
}
```

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| INVALID_FILE_FORMAT | 400 | WebM이 아닌 파일 |
| FILE_TOO_LARGE | 413 | 25MB 초과 |
| MEETING_NOT_FOUND | 404 | 존재하지 않는 미팅 |
| ANALYSIS_IN_PROGRESS | 409 | 이미 분석이 진행 중인 미팅 |

---

### 7.2 분석 진행 상태 폴링
```
GET /api/v1/meetings/{meetingId}/status
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "meetingId": 10,
    "step": "NLP",
    "stepNumber": 2,
    "totalSteps": 4,
    "progress": 45,
    "stepLabel": "행간의 의미를 읽는 중...",
    "wittyMessage": {
      "leader": "행간의 한숨까지 읽는 중...",
      "member": "대화 속 나의 패턴을 분석 중..."
    }
  }
}
```

**step 값 목록**
| step | stepNumber | progress 범위 | stepLabel |
|------|------------|---------------|-----------|
| PENDING | 0 | 0 | 분석 준비 중... |
| STT | 1 | 1~25 | 대화를 텍스트로 바꾸는 중... |
| NLP | 2 | 26~50 | 행간의 의미를 읽는 중... |
| SCORING | 3 | 51~75 | 3대 Gap을 계산하는 중... |
| FEEDBACK | 4 | 76~99 | 피드백을 다듬는 중... |
| COMPLETED | 4 | 100 | 분석 완료 |
| FAILED | - | - | 분석 실패 |

**위트 카피 (step별)**
| Step | 리더용 | 멤버용 |
|------|--------|--------|
| STT | "팀원이 '괜찮다'고 했을 때, 진짜 괜찮은 건지 확인 중..." | "오늘 내가 얼마나 솔직했는지 들여다보는 중..." |
| NLP | "행간의 한숨까지 읽는 중..." | "대화 속 나의 패턴을 분석 중..." |
| SCORING | "점수로 환산 불가한 감정을 억지로 환산 중..." | "오늘 대화의 진짜 무게를 재는 중..." |
| FEEDBACK | "어떻게 말해야 덜 아플지 고민 중..." | "다음엔 어떻게 말하면 좋을지 정리 중..." |

**FE 폴링 구현 규칙**
| 항목 | 값 |
|------|------|
| 폴링 간격 | 3초 (`setInterval 3000ms`) |
| 타임아웃 | 3분 (초과 시 에러 화면 + 재업로드 유도) |
| 종료 조건 | `step === "COMPLETED"` → 분석 결과 페이지 이동 |
| 실패 처리 | `step === "FAILED"` → 에러 메시지 표시 |

---

## 8. 1ON1 REPORT

### 8.1 리더 리포트 조회
```
GET /api/v1/meetings/{meetingId}/leader-report
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "meetingId": 10,
    "round": 12,
    "memberName": "강다은",
    "memberJobTitle": "시니어 FE 엔지니어",
    "meetingDate": "2026-05-08",
    "durationSec": 2400,

    "gaps": {
      "alignmentGap": {
        "score": 35,
        "detail": "서베이에서 선택한 '커리어 성장' 주제 — 언급은 되었으나 구체적 결론 없음"
      },
      "honestyGap": {
        "surveyScore": 87,
        "safetyScore": 31,
        "gap": 56,
        "direction": "OVERREPORT",
        "riskLevel": "DANGER"
      },
      "executionGap": {
        "score": 40,
        "totalPromises": 3,
        "fulfilled": 1,
        "missed": 2
      }
    },

    "safetyScore": 31,

    "speechActs": {
      "vulnerability": {
        "count": 1,
        "baselineAvg": 2.3,
        "changeRate": -57,
        "instances": [
          { "text": "사실 그 부분은 잘 모르겠습니다", "timestamp": "02:15" }
        ]
      },
      "constructiveDissent": {
        "count": 1,
        "baselineAvg": 1.0,
        "changeRate": 0,
        "instances": [
          { "text": "이번 스프린트도 QA가 부족해서 배포를 또 미뤘어요", "timestamp": "08:42" }
        ]
      },
      "initiative": {
        "count": 0,
        "baselineAvg": 2.8,
        "changeRate": -100,
        "instances": []
      }
    },

    "talkRatio": {
      "leaderRatio": 70,
      "memberRatio": 30,
      "recommendedLeaderRatio": 40
    },

    "feedbacks": [
      {
        "feedbackId": 1,
        "severity": "ERROR",
        "title": "Initiative 0회 — 베이스라인 대비 100% 하락",
        "evidenceQuote": "\"제가 한번 맡아볼게요\" 류의 발화 없음 (최근 3회 평균 2.8회)",
        "dataSummary": "Vulnerability 1회(-57%) / Dissent 1회(변동없음) / Initiative 0회(-100%). Safety Score 31점.",
        "actionGuide": "다음 미팅에서 \"요즘 새로 시도해보고 싶은 거 있어?\" 같은 개방형 질문으로 시작해 보세요."
      },
      {
        "feedbackId": 2,
        "severity": "WARNING",
        "title": "멤버 발언 비율 30% — 권장(60%) 미달",
        "evidenceQuote": "리더 연속 발화 구간 7턴 × 2회 감지",
        "dataSummary": "리더 발화 70%, 멤버 30%. 권장 비율 40/60 대비 리더 과다 발화.",
        "actionGuide": "다음 1on1 시작 5분은 질문만 하세요. \"3초 pause\" 기법을 연습해 보세요."
      },
      {
        "feedbackId": 3,
        "severity": "SUCCESS",
        "title": "QA 리소스 이슈를 명확하게 제기했습니다",
        "evidenceQuote": "\"이번 스프린트도 QA가 부족해서 배포를 또 미뤘어요\" (08:42)",
        "dataSummary": "Constructive Dissent 1회. 구체적 상황+의견 제시 — 고품질 발화.",
        "actionGuide": "\"그 외에 팀 차원에서 바꿨으면 하는 게 있어?\" 로 더 꺼내도록 유도하세요."
      }
    ],

    "nextActionPlans": [
      { "planId": 1, "content": "다음 1on1 시작 5분은 질문만 합니다.", "isCompleted": false },
      { "planId": 2, "content": "QA 리소스 이슈에 대해 이번 주 목요일까지 구체적 답변을 전달합니다.", "isCompleted": false },
      { "planId": 3, "content": "발화 비율을 40% 이하로 줄이기 위해 '3초 pause' 기법을 연습합니다.", "isCompleted": true },
      { "planId": 4, "content": "강다은 님의 MSA 전환 성과를 5월 올핸즈 미팅에서 공개 발표합니다.", "isCompleted": false }
    ],

    "promises": {
      "previous": [
        { "promiseId": 1, "content": "기술 블로그 주제 함께 정하기", "status": "DONE" },
        { "promiseId": 2, "content": "AWS 프로덕션 접근 권한 부여", "status": "MISSED" },
        { "promiseId": 3, "content": "QA 리소스 이슈 에스컬레이션", "status": "MISSED" }
      ],
      "new": [
        { "promiseId": 4, "content": "AWS 프로덕션 접근 권한 부여", "category": "RESOURCE", "dueDate": "2026-05-15", "status": "PENDING" },
        { "promiseId": 5, "content": "QA 충원 안건 전사 회의 상정", "category": "TEAM_BUILDING", "dueDate": "2026-05-12", "status": "PENDING" },
        { "promiseId": 6, "content": "강다은 성과 올핸즈 발표", "category": "RECOGNITION", "dueDate": "2026-05-20", "status": "PENDING" }
      ]
    }
  }
}
```

> **핵심 변경점 (피봇 반영)**
> - `aiScore` → `safetyScore` (Speech Act 카운팅 기반)
> - `behaviorCounts` (5개) → `speechActs` (3개: vulnerability, constructiveDissent, initiative)
> - `aiPatterns` (AI 해석 라벨) 제거 → `speechActs.instances` (원문 인용+타임스탬프)만 제공
> - 각 speechAct에 `baselineAvg` + `changeRate` 포함 (Fact-Based Output 원칙)

**Honesty Gap 산출 (방향성 기반)**

```
gap = surveyScore − safetyScore (부호 있는 값)
```

| gap 값 | direction | riskLevel | 의미 |
|---------|-----------|-----------|------|
| gap ≤ 0 | UNDERREPORT | SAFE | 보수적 응답 (행동이 서베이보다 양호) — 위험 아님 |
| 1 ~ 20 | OVERREPORT | SAFE | 표면과 행동이 대체로 일치 |
| 21 ~ 40 | OVERREPORT | CAUTION | 약간의 과장 보고 가능성 |
| 41 ~ 60 | OVERREPORT | WARNING | 상당한 괴리 — "괜찮다"고 하지만 행동이 안 따라감 |
| 61+ | OVERREPORT | DANGER | 심각한 괴리 — 즉시 관심 필요 |

> **설계 근거**: 현업 종사자들은 에너지 레벨을 보수적으로 응답하는 경향이 있음 (2~3 선택 빈도 높음).  
> 절대값 기반 Gap은 "겸손한 응답"도 위험으로 오분류하므로, 부호 있는 방향성 기반으로 설계.  
> **OVERREPORT 방향만 리스크 알림 대상** — UNDERREPORT는 CONSERVATIVE 사분면 표시만 하고 알림 없음.

---

### 8.2 멤버 리포트 조회
```
GET /api/v1/meetings/{meetingId}/member-report
Authorization: Bearer <token> (MEMBER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "meetingId": 10,
    "round": 12,
    "leaderName": "이준혁 팀장",
    "meetingDate": "2026-05-08",
    "durationSec": 2400,

    "confirmedAchievements": [
      {
        "careerEventId": 15,
        "type": "ACHIEVEMENT",
        "title": "스프린트 3 FE 리드 완주",
        "description": "API 지연 상황에서 목 서버를 직접 구축해 팀 전체 개발을 무중단으로 유지했습니다.",
        "impactMetric": "출시 지연 0일",
        "leaderQuote": "위기 상황에서의 문제해결 능력과 팀 전체를 이끄는 자세가 탁월했습니다.",
        "leaderName": "이준혁 팀장"
      },
      {
        "careerEventId": 16,
        "type": "PROPOSAL_ADOPTED",
        "title": "공통 컴포넌트 라이브러리 기여",
        "description": "DatePicker 공통화로 3개 팀 총 60시간 절감.",
        "impactMetric": "공수 -60h",
        "leaderQuote": "혼자 해결하지 않고 팀 전체를 끌어올리는 기여였습니다.",
        "leaderName": "이준혁 팀장"
      }
    ],

    "leaderPromises": [
      { "promiseId": 4, "content": "AWS 프로덕션 접근 권한 부여", "category": "RESOURCE", "dueDate": "2026-05-15", "status": "PENDING" },
      { "promiseId": 5, "content": "QA 충원 안건 전사 회의 상정", "category": "TEAM_BUILDING", "dueDate": "2026-05-12", "status": "PENDING" },
      { "promiseId": 6, "content": "MSA 전환 성과 5월 올핸즈 발표", "category": "RECOGNITION", "dueDate": "2026-05-20", "status": "PENDING" },
      { "promiseId": 7, "content": "FE 코드 리뷰 SLA 기준 문서화", "category": "PROCESS", "dueDate": "2026-04-30", "status": "DONE" }
    ]
  }
}
```

> 멤버 리포트에는 Gap 점수, Speech Act 상세가 노출되지 않습니다.  
> 멤버에게는 **자산화된 성과**와 **리더의 약속 이행 현황**만 보여줍니다.

---

## 9. PROMISE (약속 장부)

### 9.1 약속 생성 (리더)
```
POST /api/v1/promises
Authorization: Bearer <token> (LEADER)
```

**Request Body**
```json
{
  "meetingId": 10,
  "content": "AWS 프로덕션 접근 권한 부여",
  "category": "RESOURCE",
  "dueDate": "2026-05-15"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| meetingId | number | O | 존재하는 미팅 |
| content | string | O | 최대 200자 |
| category | string | O | RESOURCE / TEAM_BUILDING / RECOGNITION / PROCESS |
| dueDate | string | O | ISO date (미래 날짜) |

**Response** `201`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "약속이 등록되었습니다.",
  "data": {
    "promiseId": 4,
    "content": "AWS 프로덕션 접근 권한 부여",
    "category": "RESOURCE",
    "dueDate": "2026-05-15",
    "status": "PENDING"
  }
}
```

---

### 9.2 약속 상태 업데이트
```
PATCH /api/v1/promises/{promiseId}/status
Authorization: Bearer <token> (LEADER)
```

**Request Body**
```json
{
  "status": "DONE"
}
```

| status 값 | 설명 |
|-----------|------|
| DONE | 이행 완료 |
| MISSED | 미이행 (기한 초과 시 자동 전환 가능) |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "약속 상태가 업데이트되었습니다.",
  "data": {
    "promiseId": 4,
    "status": "DONE"
  }
}
```

---

### 9.3 미이행 약속 목록 조회
```
GET /api/v1/promises/overdue?memberId={memberId}
Authorization: Bearer <token> (LEADER)
```

**Query Params**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| memberId | X | 특정 멤버 필터. 생략 시 팀 전체 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "promiseId": 2,
      "content": "AWS 프로덕션 접근 권한 부여",
      "category": "RESOURCE",
      "dueDate": "2026-04-20",
      "status": "MISSED",
      "fromMeetingRound": 11,
      "memberName": "강다은"
    }
  ]
}
```

---

### 9.4 약속 이행률 조회 (리더)
```
GET /api/v1/promises/fulfillment-rate
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "total": 10,
    "doneCount": 6,
    "missedCount": 2,
    "pendingCount": 2,
    "doneRate": 0.6,
    "missedRate": 0.2,
    "pendingRate": 0.2
  }
}
```

> 요청자(리더)가 등록한 전체 약속에 대한 이행률 통계. 리더 대시보드 Promise Ledger 수치에 활용.

---

## 10. NEXT ACTION PLAN

### 10.1 액션 플랜 완료 체크
```
PATCH /api/v1/action-plans/{planId}/complete
Authorization: Bearer <token> (LEADER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "액션 플랜이 완료 처리되었습니다.",
  "data": {
    "planId": 3,
    "isCompleted": true
  }
}
```

---

## 11. CAREER MEMORY (멤버용)

### 11.1 커리어 통계 조회
```
GET /api/v1/members/{memberId}/career-stats
Authorization: Bearer <token>
```

> 본인 또는 리더가 조회 가능

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "memberId": 1,
    "name": "강다은",
    "jobTitle": "시니어 프론트엔드 엔지니어",
    "teamName": "Product A팀",
    "totalMeetings": 12,
    "achievementCount": 6,
    "leaderEndorsementCount": 12,
    "contributionPercentile": 15,
    "aiSummary": "결제 MSA 전환, 검색 성능 개선, 팀 DX 리드 — 기술적 역량과 팀 임팩트를 동시에 만드는 엔지니어입니다."
  }
}
```

> `contributionPercentile`: 상위 N% (낮을수록 좋음). 같은 팀 내 Career Event 수 기준.

---

### 11.2 커리어 이벤트 타임라인 조회
```
GET /api/v1/members/{memberId}/career-timeline?type={type}
Authorization: Bearer <token>
```

**Query Params**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| type | X | `ACHIEVEMENT` / `LEARNING` / `BLOCKER` / `PROPOSAL_ADOPTED`. 생략 시 전체 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "careerEventId": 15,
      "type": "ACHIEVEMENT",
      "title": "결제 시스템 MSA 전환 완료",
      "description": "모놀리스 결제를 3개 마이크로서비스로 분리. 다운타임 0분, 배포 주기 3배 단축.",
      "impactMetric": "다운타임 0분",
      "eventDate": "2026-04-25",
      "meetingRound": 12
    },
    {
      "careerEventId": 14,
      "type": "PROPOSAL_ADOPTED",
      "title": "공통 DatePicker 컴포넌트 제안 → 팀 도입",
      "description": "3개 팀이 중복 개발 중인 DatePicker를 공통화하여 약 60h 절감.",
      "impactMetric": "공수 -60h",
      "eventDate": "2026-04-10",
      "meetingRound": 11
    }
  ]
}
```

---

### 11.3 핵심 성과 쇼케이스 조회 (상위 5건)
```
GET /api/v1/members/{memberId}/career-showcase
Authorization: Bearer <token>
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "careerEventId": 15,
      "type": "ACHIEVEMENT",
      "title": "결제 시스템 MSA 전환 완료",
      "description": "모놀리스 결제를 3개 마이크로서비스로 분리. 다운타임 0분, 배포 주기 3배 단축.",
      "impactMetric": "다운타임 0분",
      "eventDate": "2026-04-25",
      "meetingRound": 12
    }
  ]
}
```

> 상위 5건은 `impactMetric`이 있는 이벤트를 최신순으로 정렬

---

## 12. MEMBER ANALYTICS (멤버용 분석)

### 12.1 Speech Act 트렌드 조회
```
GET /api/v1/members/me/speech-trend
Authorization: Bearer <token> (MEMBER)
```

**Query Params** (Spring Pageable)
| 파라미터 | 필수 | 기본값 | 설명 |
|---------|------|--------|------|
| page | X | 0 | 페이지 번호 |
| size | X | 20 | 페이지 크기 |
| sort | X | createdAt,desc | 정렬 기준 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "content": [
      {
        "meetingId": 10,
        "scheduledAt": "2026-05-08T14:00:00",
        "vulnerabilityCount": 1,
        "dissentCount": 1,
        "initiativeCount": 0
      },
      {
        "meetingId": 9,
        "scheduledAt": "2026-04-24T14:00:00",
        "vulnerabilityCount": 3,
        "dissentCount": 2,
        "initiativeCount": 2
      }
    ],
    "totalElements": 12,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
}
```

> 멤버 본인의 미팅별 Speech Act 발화 횟수 시계열. Career Memory 화면의 행동 변화 그래프에 활용.

---

### 12.2 멤버 포트폴리오 조회
```
GET /api/v1/members/me/portfolio
Authorization: Bearer <token> (MEMBER)
```

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "meetingHistory": [
      {
        "meetingId": 10,
        "scheduledAt": "2026-05-08T14:00:00",
        "title": "1on1 #12 — 이준혁 팀장"
      }
    ],
    "scoreTrend": [
      {
        "meetingId": 10,
        "scheduledAt": "2026-05-08T14:00:00",
        "safetyScore": 31.0
      },
      {
        "meetingId": 9,
        "scheduledAt": "2026-04-24T14:00:00",
        "safetyScore": 72.0
      }
    ],
    "topCareerTags": ["MSA 전환", "팀 DX 리드", "결제 시스템"],
    "feedbackSummaries": [
      "QA 리소스 이슈를 명확하게 제기했습니다.",
      "Initiative 0회 — 베이스라인 대비 100% 하락"
    ]
  }
}
```

> `meetingHistory`: 참여한 미팅 목록  
> `scoreTrend`: 미팅별 Safety Score 추이 (선 그래프용)  
> `topCareerTags`: AI가 추출한 커리어 태그 상위 목록  
> `feedbackSummaries`: 최근 피드백 제목 요약 목록

---

## 에러 코드 전체 목록

| 코드 | HTTP | 설명 |
|------|------|------|
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 사용 중인 이메일 |
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |
| `EXPIRED_TOKEN` | 401 | 액세스/리프레시 토큰 만료 |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `UNAUTHORIZED` | 401 | 인증이 필요합니다 |
| `FORBIDDEN` | 403 | 접근 권한 없음 (역할 불일치) |
| `ALREADY_IN_TEAM` | 409 | 이미 팀에 소속 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `TEAM_NOT_FOUND` | 404 | 팀 없음 (초대코드 무효 포함) |
| `MEETING_NOT_FOUND` | 404 | 미팅 없음 |
| `SURVEY_NOT_FOUND` | 404 | 서베이 없음 |
| `SURVEY_ALREADY_SUBMITTED` | 409 | 이미 제출된 서베이 |
| `ANALYSIS_NOT_FOUND` | 404 | 분석 결과 없음 |
| `ANALYSIS_IN_PROGRESS` | 409 | 이미 분석 진행 중 |
| `ANALYSIS_FAILED` | 500 | 분석 처리 중 오류 |
| `FILE_TOO_LARGE` | 413 | 파일 25MB 초과 |
| `INVALID_FILE_FORMAT` | 400 | 지원하지 않는 파일 형식 |
| `LLM_PARSE_FAILED` | 500 | AI 응답 파싱 실패 |
| `INVALID_INPUT` | 400 | 잘못된 입력값 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

---

## FE 개발 참고: Axios 인터셉터 예시

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

// 요청 인터셉터: accessToken 자동 부착
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 토큰 갱신 시도
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${client.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );
          const { accessToken, refreshToken: newRefresh } = data.data;
          useAuthStore.getState().setTokens(accessToken, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## FE 개발 참고: 녹음 + 업로드 훅

```typescript
// features/meeting/useRecorder.ts
import { useRef, useState, useCallback } from 'react';
import client from '@/api/client';

export function useRecorder(meetingId: number) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    startTimeRef.current = Date.now();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stop = useCallback(async () => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = async () => {
        const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
        setDuration(durationSec);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        formData.append('durationSec', String(durationSec));
        await client.post(`/meetings/${meetingId}/recording`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setIsRecording(false);
        resolve();
      };
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
  }, [meetingId]);

  return { isRecording, duration, start, stop };
}
```

---

## FE 개발 참고: 폴링 훅

```typescript
// features/meeting/useMeetingStatus.ts
import { useState, useEffect, useRef } from 'react';
import client from '@/api/client';

interface StatusData {
  meetingId: number;
  step: string;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  stepLabel: string;
  wittyMessage: { leader: string; member: string };
}

export function useMeetingStatus(meetingId: number, enabled: boolean) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;
    startRef.current = Date.now();

    const poll = async () => {
      // 3분 타임아웃
      if (Date.now() - startRef.current > 180_000) {
        setError('분석 시간이 초과되었습니다. 다시 시도해 주세요.');
        clearInterval(intervalRef.current);
        return;
      }
      try {
        const { data } = await client.get(`/meetings/${meetingId}/status`);
        setStatus(data.data);
        if (data.data.step === 'COMPLETED' || data.data.step === 'FAILED') {
          clearInterval(intervalRef.current);
          if (data.data.step === 'FAILED') {
            setError('분석에 실패했습니다. 녹음을 다시 업로드해 주세요.');
          }
        }
      } catch {
        setError('상태 조회에 실패했습니다.');
        clearInterval(intervalRef.current);
      }
    };

    poll(); // 즉시 1회 실행
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current);
  }, [meetingId, enabled]);

  return { status, error };
}
```

---

## APPENDIX: Scoring 공식

> 이 섹션은 BE 구현 및 FE 시각화의 기준 문서입니다. 모든 점수 산출은 이 공식에 따릅니다.

### A.1 Safety Score (Y축) — Speech Act 기반

```
safetyScore = V_score + D_score + I_score
```

**30분 기준 발화 횟수 → 점수 변환표**

| 횟수 | Vulnerability (max 40) | Constructive Dissent (max 35) | Initiative (max 25) |
|------|------------------------|-------------------------------|---------------------|
| 0회 | 0 | 0 | 0 |
| 1회 | 20 | 18 | 13 |
| 2회 | 32 | 28 | 20 |
| 3회 | 38 | 33 | 24 |
| 4회+ | 40 | 35 | 25 |

**미팅 시간 정규화**
```
adjusted_count = round(raw_count × 30 ÷ actual_duration_minutes)
```

**가중치 근거**
- **V 40%**: 가장 어려운 행위. 심리적 안전감 연구에서 "실수를 인정할 수 있는가"가 1순위 지표
- **D 35%**: 건설적 반대는 의사결정 품질 지표. 반대 없는 팀은 groupthink 위험
- **I 25%**: 자발적 제안은 engagement 지표. V/D보다 표현 진입 장벽이 낮음

**체감 체계**: 0→1회 첫 발화가 점수의 ~50%를 차지 (첫 신뢰 신호가 가장 중요). 4회+ 이후는 만점 수렴.

**Cold Start**: 1~2회차 미팅은 베이스라인 미형성. safetyScore 절대값만 사용, changeRate 미표시.

---

### A.2 Survey Score (X축) — 사전 서베이 기반

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

---

### A.3 Honesty Gap — 방향성 기반 산출

```
gap = surveyScore − safetyScore  // 부호 있는 값
direction = gap > 0 ? "OVERREPORT" : "UNDERREPORT"
```

| gap 값 | direction | riskLevel | 의미 |
|--------|-----------|-----------|------|
| ≤ 0 | UNDERREPORT | SAFE | 보수적 응답 — 알림 없음 |
| 1 ~ 20 | OVERREPORT | SAFE | 표면과 행동 대체로 일치 |
| 21 ~ 40 | OVERREPORT | CAUTION | 약간의 과장 보고 가능성 |
| 41 ~ 60 | OVERREPORT | WARNING | "괜찮다"고 하지만 행동이 안 따라감 |
| 61+ | OVERREPORT | DANGER | 심각한 괴리 — 즉시 관심 |

> **OVERREPORT 방향만 리스크 알림 대상.** 현업 종사자들의 보수적 에너지 레벨 응답 패턴(2~3 빈도 높음)을 고려하여, UNDERREPORT 방향은 CONSERVATIVE 사분면 표시만 하고 알림하지 않음.

---

### A.4 사분면 정의

| 사분면 | 조건 | 의미 |
|--------|------|------|
| STABLE | survey ≥ 50 && safety ≥ 50 | 표면+행동 모두 양호 |
| SILENT_RISK | survey ≥ 50 && safety < 50 | "괜찮다"고 하지만 행동 지표 낮음 |
| EXPLICIT_RISK | survey < 50 && safety < 50 | 표면+행동 모두 부정 |
| CONSERVATIVE | survey < 50 && safety ≥ 50 | 보수적 응답 (위험 아님) |

> **임계값 50 고정 (MVP)**: 데이터 축적 후 팀 중앙값 기반 동적 조정 가능하나, MVP에서는 투명성을 위해 고정값 사용.

---

### A.5 팀 헬스 스코어

```
teamHealthScore = safetyScore_avg × 0.6 + surveyScore_avg × 0.4
trend = 전월 대비 +5 이상 → IMPROVING / ±5 이내 → STABLE / -5 이하 → DECLINING
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-05-03 | v1.0 | 준영 초안 작성 |
| 2026-05-06 | v2.0 | 피봇 반영 (aiScore→safetyScore, aiPatterns 제거, speechActs 3종 전환, Fact-Based Output 적용), FE 구현 가이드 추가, 검증 규칙 보강, 서베이 선택지 상세화 |
| 2026-05-12 | v2.1 | Scoring 공식 확정 (Safety Score 변환표, Survey Score 산출, Honesty Gap 방향성 기반 전환, 사분면 정의), APPENDIX 추가 |
| 2026-05-15 | v2.2 | 블로커 보드 → 블로커 피라미드 명칭 변경 (blocker-board → blocker-pyramid), 5/15 회의 결정사항 반영 |
| 2026-05-28 | v2.3 | 실코드 기준 동기화 — URL 불일치 수정 (health-score→dashboard, analysis/{id}/status→meetings/{id}/status), quadrant 응답 구조 변경 (honestyGap/direction/riskLevel 추가), 신규 API 추가 (6.3 surveys/history, 9.4 promises/fulfillment-rate, 12. Member Analytics) |
