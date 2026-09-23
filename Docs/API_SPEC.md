# ReadB API 명세서 v2.9

> **Base URL**: `https://api.readb.io` (개발: `http://localhost:8080`)  
> **버전**: `v1` | **문서 버전**: v2.9 (2026-06-15)  
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

### 2.2 내 프로필 수정
```
PUT /api/v1/users/me
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "name": "강다은",
  "jobTitle": "시니어 FE 엔지니어"
}
```

| 필드 | 타입 | 필수 | 검증 규칙 |
|------|------|------|-----------|
| name | string | O | 2~20자 (공백 불가) |
| jobTitle | string | X | 최대 50자. `null` 또는 빈 문자열 전송 시 직함 제거 |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "프로필이 수정되었습니다.",
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

> 회원가입 시 입력한 이름/직함을 멤버가 직접 수정할 수 있는 엔드포인트.  
> 변경 후 FE는 `authStore`와 `localStorage` 토큰을 즉시 갱신하여 화면에 반영.

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| INVALID_INPUT | 400 | name 빈 값 |
| UNAUTHORIZED | 401 | 토큰 없음/만료 |

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
    "trendDelta": 5.2,
    "statusNote": "이번 달 팀 소통 참여도가 지난 3개월 평균보다 높아졌습니다.",
    "alerts": [
      "강다은 — Initiative 최근 3회 평균 대비 100% 감소",
      "윤재원 — Safety Score 기준 이하 (Silent Risk)"
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `teamHealthScore` | number | `safetyScore_avg × 0.6 + surveyScore_avg × 0.4` |
| `trendDelta` | number \| null | 이번 달 평균 − 직전 3개월 월별 평균의 평균. 양수: 개선, 음수: 하락. 데이터 부족 시 `null` |
| `statusNote` | string \| null | 규칙 기반 평문 요약. 내부 지표 용어 미포함. 데이터 부족 시 `null` |
| `alerts` | string[] | 30% 이상 하락한 멤버 알림. Fact-Based 문구, AI 해석 라벨 없음 |

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

### 4.4 팀 발화 비율 랭킹 조회
```
GET /api/v1/teams/{teamId}/talk-ratio-ranking
Authorization: Bearer <token> (LEADER)
```

> 팀 대시보드 '1on1 소통 균형' 패널에 사용. 각 멤버의 최신 1on1 발화 비율을 leaderRatio 내림차순으로 반환.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    { "memberId": 3, "name": "김민준", "leaderRatio": 72, "memberRatio": 28, "status": "위험" },
    { "memberId": 1, "name": "강다은", "leaderRatio": 55, "memberRatio": 45, "status": "관찰" },
    { "memberId": 2, "name": "박지호", "leaderRatio": 38, "memberRatio": 62, "status": "적정" }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `leaderRatio` | GPT 분석 기준 리더 발화 비율 (%) |
| `memberRatio` | GPT 분석 기준 멤버 발화 비율 (%) |
| `status` | `위험` (leaderRatio ≥ 70) / `관찰` (50–69) / `적정` (< 50) |

> 분석 완료(COMPLETED) 미팅이 없는 멤버는 결과에서 제외됩니다. data가 빈 배열이면 팀 내 완료 미팅 없음.

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
> FE에서 사분면 판별: `surveyScore ≥ 45 && safetyScore ≥ 45` → STABLE 등 (PRD 3.3 참조).

> **사분면 기준** (X축: surveyScore, Y축: safetyScore, **임계값 45**)
> | 사분면 | 조건 | 색상 | 의미 |
> |--------|------|------|------|
> | STABLE | survey ≥ 45 && safety ≥ 45 | green | 안정 (표면+행동 모두 양호) |
> | SILENT_RISK | survey ≥ 45 && safety < 45 | amber | 조용한 위험 (괜찮다고 하지만 행동 지표 낮음) |
> | EXPLICIT_RISK | survey < 45 && safety < 45 | red | 명시적 위험 (표면+행동 모두 부정) |
> | CONSERVATIVE | survey < 45 && safety ≥ 45 | indigo | 보수적 응답 (서베이는 부정이지만 행동은 활발) |
>
> **임계값 변경 이유**: Safety Score 기준선 40 도입 후 모든 멤버가 45+ 구간으로 이동하여 50 기준은 의미 없음. 45로 하향하여 판별력 회복.

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
| memberId | X | 특정 멤버 필터 (리더 전용). 생략 시 역할에 따라: **리더**는 본인이 진행한 1on1 전체, **멤버**는 본인이 멤버로 참여한 리더와의 1on1만 (leaderId == memberId인 셀프 미팅 제외) |

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
    "memberId": 1,
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
> `memberId`: 해당 미팅 멤버 ID. 리더 미팅 진행 화면이 이 값으로 멤버의 액션 플랜·약속 체크리스트(`/members/{memberId}/insight`)를 로드한다.

---

### 5.4 미팅 취소 (리더)
```
DELETE /api/v1/meetings/{meetingId}
Authorization: Bearer <token>
```
**인증 필요**: O (리더 전용)

예정 시각에 진행되지 않은 미팅을 취소(삭제)한다. 회차는 저장값이 아니라 동적으로 계산되므로, 취소 시 이후 미팅들의 회차 번호가 자동으로 1씩 감소한다. 멤버가 미리 제출한 서베이가 있으면 함께 삭제된다.

**제약**
- 미팅의 리더 본인만 호출 가능 (아니면 `403 FORBIDDEN`)
- **`CREATED`(진행 전) 상태만** 취소 가능. 진행 중/완료된 미팅은 `409 MEETING_NOT_CANCELABLE`

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": null
}
```

| 에러 코드 | 상태 | 의미 |
|-----------|------|------|
| MEETING_NOT_FOUND | 404 | 미팅 없음 |
| FORBIDDEN | 403 | 리더 본인 미팅 아님 |
| MEETING_NOT_CANCELABLE | 409 | 이미 진행되었거나 완료된 미팅 |

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
| meetingId | number | O | 존재하는 미팅 + **요청자가 해당 미팅의 멤버 본인**이어야 함 (리더 등 타인이 제출하면 403). 같은 미팅에 서베이 1건만 허용 |
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
| FORBIDDEN | 403 | 해당 미팅의 멤버 본인이 아님 (리더 포함 타인 제출 차단) |
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

## 8. PRE-MEETING BRIEFING

### 8.0 미팅 전 브리핑 카드 조회 (리더)
```
GET /api/v1/meetings/{meetingId}/pre-briefing
Authorization: Bearer <token> (LEADER)
```

> 미팅 시작 전 리더에게 멤버 상태를 요약 제공. 미팅 pending 상태에서만 의미 있음.

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
    "scheduledAt": "2026-06-05T14:00:00",

    "survey": {
      "submitted": true,
      "energyLevel": 3,
      "issues": ["업무 블로커", "커리어 성장"],
      "desiredRoles": ["방향성 코칭"],
      "surveyScore": 50.0
    },

    "lastMeeting": {
      "safetyScore": 31.0,
      "safetyScoreChange": -15.0,
      "quadrant": "SILENT_RISK",
      "honestyGap": {
        "direction": "OVERREPORT",
        "riskLevel": "DANGER"
      },
      "speechActAlerts": [
        "Initiative 0회 (이전 평균 2.8회)",
        "Vulnerability 0회 (이전 평균 2.3회)"
      ],
      "blockerKeywords": ["QA 리소스 부족", "코드 리뷰 병목"]
    },

    "pendingPromises": [
      {
        "promiseId": 2,
        "content": "AWS 프로덕션 접근 권한 부여",
        "dueDate": "2026-04-20",
        "overdue": true
      }
    ],

    "recommendedTopics": [
      "약속 팔로업: AWS 프로덕션 접근 권한 부여",
      "멤버 발화가 줄었습니다 — 편하게 이야기할 수 있는지 확인해보세요",
      "서베이 이슈 확인: 업무 블로커"
    ]
  }
}
```

| 필드 | 설명 |
|------|------|
| `survey.submitted` | 이번 미팅 사전 서베이 제출 여부 |
| `lastMeeting.safetyScoreChange` | 직전 미팅 Safety Score - 이전 3회 평균 (양수 = 개선) |
| `lastMeeting.quadrant` | 직전 미팅 기준 사분면 (STABLE/SILENT_RISK/EXPLICIT_RISK/CONSERVATIVE) |
| `lastMeeting.speechActAlerts` | Fact-Based 관찰 사실만 — AI 해석 라벨 없음 |
| `pendingPromises.overdue` | deadline이 오늘 이전이면 true |
| `recommendedTopics` | 미이행 약속 팔로업 항상 최우선, 이후 상태 기반 제안 |

> **FE 구현 참고**: survey.submitted가 false이면 "서베이 미제출" 상태 표시.  
> lastMeeting이 null이면 첫 미팅(이전 데이터 없음).

---

## 9. 1ON1 REPORT (미팅 후 분석 리포트)

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

## 10. PROMISE (약속 장부)

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

### 9.3 약속 완료 체크 (낙관적 업데이트)
```
PATCH /api/v1/promises/{promiseId}/complete
Authorization: Bearer <token>
```
**인증/권한**: 해당 약속이 속한 1on1의 **참여자(리더 또는 멤버)** 모두 호출 가능 (아니면 `403 FORBIDDEN`). 리더는 팀 약속 요약 패널·미팅 진행 체크리스트에서, 멤버는 Career Memory 회차별 약속에서 사용.

> 체크박스 클릭 시 호출. 상태를 `DONE`으로 변경하고 `completedAt` 기록.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": null
}
```

| 에러 코드 | 상태 | 의미 |
|-----------|------|------|
| PROMISE_NOT_FOUND | 404 | 약속 없음 |
| MEETING_NOT_FOUND | 404 | 약속이 속한 미팅 없음 |
| FORBIDDEN | 403 | 해당 1on1 참여자(리더/멤버)가 아님 |

---

### 9.3b 약속 완료 해제 (체크박스 off)
```
PATCH /api/v1/promises/{promiseId}/incomplete
Authorization: Bearer <token>
```
**인증/권한**: 9.3과 동일 (1on1 참여자만).

체크 해제 시 호출. 상태를 `PENDING`으로 되돌리고 `completedAt`을 null로 초기화한다. 체크박스 on/off 토글을 지원하기 위한 짝 엔드포인트.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": null
}
```

---

### 9.4 미이행 약속 목록 조회
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

### 9.5 약속 이행률 조회 (리더)
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

### 9.6 팀 약속 요약 조회 (Promise Ledger 패널용)
```
GET /api/v1/teams/{teamId}/promises/summary
Authorization: Bearer <token> (LEADER)
```

> 팀 대시보드의 "미이행 약속" 패널 데이터 소스. 리더 약속이 최상단에 종합 표시되고, 멤버 약속은 멤버별로 섹션 구성.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "leaderPromises": {
      "memberId": null,
      "memberName": "리더 (나)",
      "promises": [
        {
          "promiseId": "4",
          "content": "AWS 프로덕션 접근 권한 부여",
          "context": "강다은님과의 5회차 미팅",
          "status": "OVERDUE",
          "createdAt": "2026-05-08",
          "round": 5,
          "isCompleted": false,
          "partnerName": "강다은"
        }
      ],
      "stats": {
        "total": 3,
        "completed": 1,
        "pending": 1,
        "overdue": 1
      }
    },
    "memberPromises": [
      {
        "memberId": "1",
        "memberName": "강다은",
        "promises": [
          {
            "promiseId": "3",
            "content": "다음 스프린트까지 MSA 전환 완료",
            "context": "4월 1on1",
            "status": "OVERDUE",
            "createdAt": "2026-04-20",
            "round": 4,
            "isCompleted": false,
            "partnerName": null
          }
        ],
        "stats": {
          "total": 2,
          "completed": 1,
          "pending": 0,
          "overdue": 1
        }
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `leaderPromises` | object \| null | 리더가 멤버들과의 미팅에서 한 약속 종합. 없으면 null |
| `leaderPromises.promises[].partnerName` | string | 어느 멤버와의 미팅에서 한 약속인지 (리더 약속 전용 필드) |
| `memberPromises` | array | 멤버별 약속 배열. 미이행(PENDING/OVERDUE) 약속만 포함 |
| `status` | string | `PENDING` (기한 이내) / `OVERDUE` (기한 초과) |

> **FE 렌더링 규칙**: leaderPromises가 null이 아니면 최상단에 "리더" 태그로 표시. memberPromises는 "멤버" 태그로 하단에 표시. 체크박스 체크 시 `PATCH /promises/{id}/complete` 낙관적 업데이트.

---

### 9.7 약속 리마인더 (기한 도래 약속)
```
GET /api/v1/promises/reminders
Authorization: Bearer <token> (LEADER)
```

> 팀 대시보드 상단 리마인더 배너에 사용. 기한 초과 약속과 7일 이내 도래 약속을 분리 반환.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "overdue": [
      {
        "promiseId": 2,
        "content": "AWS 프로덕션 접근 권한 부여",
        "dueDate": "2026-04-20",
        "daysLeft": -53,
        "memberName": "강다은",
        "meetingTitle": "4월 1on1"
      }
    ],
    "dueSoon": [
      {
        "promiseId": 7,
        "content": "코드 리뷰 SLA 기준 문서화",
        "dueDate": "2026-06-15",
        "daysLeft": 3,
        "memberName": "김민준",
        "meetingTitle": "6월 1on1"
      }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `overdue` | array | 기한 초과 약속. `daysLeft` 음수 |
| `dueSoon` | array | 7일 이내 기한 도래 약속. `daysLeft` 0~7 |
| `daysLeft` | number | 오늘 기준 남은 일수 (음수: 초과) |

---

## 11. NEXT ACTION PLAN

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

## 12. CAREER MEMORY (멤버용)

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
    "promiseFulfillmentRate": 75.0,
    "completedActionCount": 8,
    "aiSummary": "결제 MSA 전환, 검색 성능 개선, 팀 DX 리드 — 기술적 역량과 팀 임팩트를 동시에 만드는 엔지니어입니다."
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `achievementCount` | int | Career Event 중 ACHIEVEMENT 타입 건수 |
| `promiseFulfillmentRate` | double | 멤버 약속(MEMBER ownerType) 이행률 — `DONE건수 / 전체건수 × 100`, 소수점 1자리. 약속 없으면 `0.0` |
| `completedActionCount` | int | 해당 멤버의 모든 미팅 액션 플랜 중 `isCompleted = true` 건수 |

> **제거된 필드**: `leaderEndorsementCount` (LEADER_ENDORSEMENT 이벤트 수 — 추출률이 낮아 의미 없음), `contributionPercentile` (팀 내 상대 순위 — 소규모 팀에서 의미 없음)

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

## 13. MEMBER INSIGHT (리더용 멤버 인사이트)

### 13.1 멤버 인사이트 조회
```
GET /api/v1/members/{memberId}/insight
Authorization: Bearer <token> (LEADER)
```

> 리더가 특정 멤버의 전체 히스토리(약속, 소통 추세, 액션플랜)를 조회하는 전용 엔드포인트.  
> 멤버 상세 페이지(아코디언 UI)의 데이터 소스.

**Path Params**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| memberId | number | 조회 대상 멤버 ID |

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "memberId": 1,
    "memberName": "강다은",
    "jobTitle": "시니어 FE 엔지니어",

    "promises": [
      {
        "promiseId": 4,
        "content": "AWS 프로덕션 접근 권한 부여",
        "status": "PENDING",
        "date": "2026-05-08",
        "round": 12,
        "meetingTitle": "5월 2차 1on1",
        "ownerType": "LEADER"
      },
      {
        "promiseId": 3,
        "content": "다음 스프린트까지 MSA 전환 완료",
        "status": "DONE",
        "date": "2026-04-20",
        "round": 11,
        "meetingTitle": "4월 1on1",
        "ownerType": "MEMBER"
      }
    ],

    "statusTrend": [
      {
        "round": 12,
        "date": "2026-05-08",
        "healthScore": 62.0,
        "level": "보통",
        "meetingTitle": "5월 2차 1on1"
      },
      {
        "round": 11,
        "date": "2026-04-20",
        "healthScore": 74.0,
        "level": "좋음",
        "meetingTitle": "4월 1on1"
      }
    ],

    "actionPlans": [
      {
        "planId": 1,
        "content": "다음 1on1 시작 5분은 질문만 합니다.",
        "isCompleted": false,
        "date": "2026-05-08",
        "round": 12,
        "meetingTitle": "5월 2차 1on1"
      }
    ]
  }
}
```

**응답 필드 상세**

`promises[]`
| 필드 | 타입 | 설명 |
|------|------|------|
| `promiseId` | number | 약속 ID |
| `content` | string | 약속 내용 |
| `status` | string | `DONE` / `PENDING` / `OVERDUE` |
| `date` | string \| null | 약속이 생성된 미팅 일자 (ISO date) |
| `round` | int | 해당 리더-멤버 미팅 회차 |
| `meetingTitle` | string | 미팅 제목. 제목 없으면 `"1:1 미팅"` |
| `ownerType` | string | `MEMBER` (멤버의 약속) / `LEADER` (리더의 약속) |

`statusTrend[]`
| 필드 | 타입 | 설명 |
|------|------|------|
| `round` | int | 미팅 회차 |
| `date` | string \| null | 미팅 일자 |
| `healthScore` | number | 해당 회차 팀 헬스 스코어 (`safetyScore × 0.6 + surveyScore × 0.4`) |
| `level` | string | `좋음` (≥65) / `보통` (≥45) / `낮음` (<45) |
| `meetingTitle` | string | 미팅 제목 |

`actionPlans[]`
| 필드 | 타입 | 설명 |
|------|------|------|
| `planId` | number | 액션 플랜 ID |
| `content` | string | 액션 플랜 내용 |
| `isCompleted` | boolean | 완료 여부 |
| `date` | string \| null | 미팅 일자 |
| `round` | int | 미팅 회차 |
| `meetingTitle` | string | 미팅 제목 |

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| MEMBER_NOT_FOUND | 404 | 존재하지 않는 멤버 |
| FORBIDDEN | 403 | 해당 팀의 리더가 아닌 경우 |

---

## 14. LEADER GROWTH (리더 성장 대시보드)

### 14.1 리더 성장 지표 조회
```
GET /api/v1/leaders/me/growth
Authorization: Bearer <token> (LEADER)
```

> 리더 본인의 최근 6개월 1on1 행동 변화 지표. HR 관점의 규칙성(cadence), 코칭 실행률, 행동-결과 상관 인사이트를 제공.

**Response** `200`
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "keyInsight": "발화 비율을 낮춘 달에 팀 안전감 신호가 평균 8.3점 상승했습니다.",
    "talkRatioTrend": [
      { "month": "2026-01", "value": 68.0, "meetingCount": 4 },
      { "month": "2026-02", "value": 62.0, "meetingCount": 3 },
      { "month": "2026-03", "value": 55.0, "meetingCount": 5 }
    ],
    "teamSafetyTrend": [
      { "month": "2026-01", "value": 54.2, "meetingCount": 4 },
      { "month": "2026-02", "value": 58.7, "meetingCount": 3 },
      { "month": "2026-03", "value": 64.1, "meetingCount": 5 }
    ],
    "monthlyMeetings": [
      { "month": "2026-01", "value": 4, "meetingCount": 4 },
      { "month": "2026-02", "value": 3, "meetingCount": 3 },
      { "month": "2026-03", "value": 5, "meetingCount": 5 }
    ],
    "promiseStats": {
      "total": 12,
      "done": 8,
      "missed": 2,
      "pending": 2,
      "doneRate": 66.7
    },
    "coachingExecution": {
      "total": 15,
      "completed": 11,
      "executionRate": 73.3
    },
    "memberCadence": [
      { "memberId": 1, "memberName": "강다은", "lastMeetingDate": "2026-06-05", "daysSinceLastMeeting": 7 },
      { "memberId": 2, "memberName": "김민준", "lastMeetingDate": null, "daysSinceLastMeeting": null }
    ],
    "highlights": [
      "가장 많은 1on1을 진행한 달: 2026-03 (5회)",
      "코칭 실행률 73% — 제안된 액션 플랜 15건 중 11건 완료"
    ]
  }
}
```

**응답 필드 상세**

| 필드 | 타입 | 설명 |
|------|------|------|
| `keyInsight` | string \| null | 발화비율-안전감 상관 인사이트 문장. talkRatioTrend와 teamSafetyTrend 모두 2개월 이상 데이터가 있을 때만 생성. 없으면 null |
| `talkRatioTrend` | array | 월별 평균 리더 발화 비율(%). value = 평균 leaderRatio |
| `teamSafetyTrend` | array | 리더가 진행한 1on1의 월별 평균 Safety Score |
| `monthlyMeetings` | array | 월별 진행한 1on1 건수. value = meetingCount (두 필드가 동일) |
| `promiseStats.doneRate` | number | DONE건수 / (DONE+MISSED) × 100, 소수점 1자리. PENDING 제외 |
| `coachingExecution.executionRate` | number | completed / total × 100, 소수점 1자리 |
| `memberCadence` | array | 팀 멤버별 마지막 1on1 날짜. daysSinceLastMeeting 내림차순 (오래된 순), null은 최상단 |
| `memberCadence[].daysSinceLastMeeting` | number \| null | 오늘 기준 경과 일수. 1on1 미진행 시 null |

`MonthlyTrendPoint` 구조:
| 필드 | 타입 | 설명 |
|------|------|------|
| `month` | string | `YYYY-MM` 형식 |
| `value` | number | 해당 월의 지표값 |
| `meetingCount` | number | 해당 월의 미팅 건수 |

**FE 시각화 참고**
- `talkRatioTrend`: 권장 40% 이하 → 초과 시 빨간색, 50~69% 주황색, 40% 미만 초록색
- `teamSafetyTrend`: 고정 인디고 색상
- `monthlyMeetings`: max값 기준으로 바 너비 스케일 조정
- `memberCadence`: daysSinceLastMeeting ≥ 30 → 빨간색, ≥ 14 → 주황색, < 14 → 회색

**에러**
| 코드 | HTTP | 상황 |
|------|------|------|
| FORBIDDEN | 403 | LEADER 권한 없음 |

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
| `MEETING_NOT_CANCELABLE` | 409 | 이미 진행/완료된 미팅은 취소 불가 (CREATED 상태만 취소 가능) |
| `PROMISE_NOT_FOUND` | 404 | 약속 없음 |
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

### A.0 AI 분석 파이프라인

**파이프라인 구성 (v2.6 기준)**

```
Whisper STT
  → GPT-mini (Step 2) — Speech Act 분류 + 주제/블로커/약속 추출 + 발화 비율
  → GPT-mini (Step 3) — 3-Gap 스코어링 + 코칭 피드백 + Career 태그
```

**Step 2 프롬프트 설계 원칙**

| 항목 | 내용 |
|------|------|
| 이론 근거 | Searle(1969) Speech Act Theory, Edmondson(1999) Psychological Safety |
| 추론 방식 | CoT (Chain-of-Thought): Step A 화자 판별 → B 멤버 필터링 → C 의도 판단 → D 발화 비율 → E 기타 추출 |
| 분류 원칙 | recall-first (애매하면 포함). 기준선 40 도입으로 과분류 시 점수 왜곡이 작음. 원문 그대로 인용 |
| Few-shot | 포함 예시 3개 + 제외 예시 2개 (사교적 겸손, 단순 수락 경계 사례) |
| 발화 비율 | 문자수 기준 정수 산출, leaderRatio + memberRatio = 100 보장 |

**Step 3 프롬프트 — Meeting RAG (이전 미팅 컨텍스트 주입)**

분석 시 최근 3회 미팅의 Rolling Baseline을 step3 프롬프트에 자동 주입:
```
[이전 미팅 컨텍스트 — Rolling Baseline]
최근 N회 미팅 평균:
- Safety Score 평균: X.X
- Vulnerability 평균: X.X회
- Constructive Dissent 평균: X.X회
- Initiative 평균: X.X회
- 이전 블로커: 키워드1, 키워드2
```

→ 피드백에 변화량 자동 포함: "Vulnerability 발화가 이전 3회 평균 2.3건에서 0건으로 감소했습니다"

> 첫 미팅이거나 이전 분석 데이터가 없는 경우 컨텍스트 주입 없이 절대값 기반 분석.

---

### A.1 Safety Score (Y축) — Speech Act 기반

```
safetyScore = 40 + V_score + D_score + I_score
// 최솟값 40 (발화 없어도 침묵 ≠ 위험), 최댓값 100
```

**중립 기준선 40**: Speech Act 발화가 전혀 없어도 40점 시작. 이전 버전(0에서 시작)은 완전한 침묵도 극단적 위험으로 과분류하는 문제가 있었음.

**30분 기준 발화 횟수 → 보너스 변환표**

| 횟수 | Vulnerability (+24) | Constructive Dissent (+21) | Initiative (+15) |
|------|---------------------|----------------------------|------------------|
| 0회 | 0 | 0 | 0 |
| 1회 | +12 | +11 | +8 |
| 2회 | +18 | +17 | +12 |
| 3회 | +22 | +20 | +14 |
| 4회+ | +24 | +21 | +15 |

**미팅 시간 정규화**
```
adjusted_count = round(raw_count × 30 ÷ actual_duration_minutes)
```

**가중치 근거**
- **V 40% (24/60)**: 가장 어려운 행위. 심리적 안전감 연구에서 "실수를 인정할 수 있는가"가 1순위 지표
- **D 35% (21/60)**: 건설적 반대는 의사결정 품질 지표. 반대 없는 팀은 groupthink 위험
- **I 25% (15/60)**: 자발적 제안은 engagement 지표. V/D보다 표현 진입 장벽이 낮음

**체감 체계**: 0→1회 첫 발화가 보너스의 ~50%를 차지 (첫 신뢰 신호가 가장 중요). 4회+ 이후는 만점 수렴.

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

임계값: **45** (v2.7 재보정 — Safety Score 기준선 40 도입으로 50 기준은 의미 없음)

| 사분면 | 조건 | 색상 | 의미 |
|--------|------|------|------|
| STABLE | survey ≥ 45 && safety ≥ 45 | green | 표면+행동 모두 양호 |
| SILENT_RISK | survey ≥ 45 && safety < 45 | amber | "괜찮다"고 하지만 행동 지표 낮음 |
| EXPLICIT_RISK | survey < 45 && safety < 45 | red | 표면+행동 모두 부정 |
| CONSERVATIVE | survey < 45 && safety ≥ 45 | indigo | 보수적 응답 (위험 아님) |

> 데이터 축적 후 팀 중앙값 기반 동적 임계값 조정 가능하나 현재는 45 고정.

---

### A.5 팀 헬스 스코어

```
teamHealthScore = safetyScore_avg × 0.6 + surveyScore_avg × 0.4
trendDelta = thisMonth.avg - avg(prior3MonthMeans)
```

| 필드 | 공식 | 설명 |
|------|------|------|
| `teamHealthScore` | `safetyAvg × 0.6 + surveyAvg × 0.4` | 해당 월 팀 헬스 평균 |
| `trendDelta` | `thisMonth.avg − avg(prior3MonthMeans)` | 이번 달 vs 직전 3개월 월별 평균의 평균. 양수: 개선, 음수: 하락 |
| `statusNote` | 규칙 기반 평문 | trendDelta 구간에 따라 자동 생성. 내부 지표명 미노출 |

`statusNote` 생성 규칙 예시:
| trendDelta 구간 | statusNote 예시 |
|-----------------|-----------------|
| ≥ 5 | "이번 달 팀 소통 참여도가 지난 3개월 평균보다 높아졌습니다." |
| −5 ~ 5 | "이번 달 팀 소통 흐름이 안정적으로 유지되고 있습니다." |
| ≤ −5 | "최근 몇몇 멤버의 대화 참여가 줄어들었습니다. 개별 체크인을 고려해보세요." |
| null | "아직 비교할 이전 달 데이터가 부족합니다." |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-05-03 | v1.0 | 준영 초안 작성 |
| 2026-05-06 | v2.0 | 피봇 반영 (aiScore→safetyScore, aiPatterns 제거, speechActs 3종 전환, Fact-Based Output 적용), FE 구현 가이드 추가, 검증 규칙 보강, 서베이 선택지 상세화 |
| 2026-05-12 | v2.1 | Scoring 공식 확정 (Safety Score 변환표, Survey Score 산출, Honesty Gap 방향성 기반 전환, 사분면 정의), APPENDIX 추가 |
| 2026-05-15 | v2.2 | 블로커 보드 → 블로커 피라미드 명칭 변경 (blocker-board → blocker-pyramid), 5/15 회의 결정사항 반영 |
| 2026-05-28 | v2.3 | 실코드 기준 동기화 — URL 불일치 수정 (health-score→dashboard, analysis/{id}/status→meetings/{id}/status), quadrant 응답 구조 변경 (honestyGap/direction/riskLevel 추가), 신규 API 추가 (6.3 surveys/history, 9.4 promises/fulfillment-rate, 12. Member Analytics) |
| 2026-05-29 | v2.4 | 12절(MEMBER ANALYTICS) 제거 — speech-trend/portfolio/career-memory는 MVP 범위 외 또는 11절로 커버. PRD 멤버 화면 기준 정렬 |
| 2026-06-02 | v2.5 | 8절 Pre-Meeting Briefing 추가 (GET /meetings/{id}/pre-briefing) — 브리핑 카드: survey, lastMeeting 요약, pendingPromises, recommendedTopics. 기존 8~11절 번호 순서 변경 |
| 2026-06-03 | v2.6 | 4.4절 팀 발화 비율 랭킹 추가 (GET /teams/{id}/talk-ratio-ranking). GPT 발화 비율 항상 40 고정 버그 수정. A.0절 AI 파이프라인 문서화 (CoT + Few-shot + Meeting RAG) |
| 2026-06-11 | v2.7 | Safety Score 재보정 (A.1: 기준선 40, 보너스 변환표 V+24/D+21/I+15, recall-first 분류), 사분면 임계값 50→45 (A.4, 4.3절), 팀 헬스 trendDelta+statusNote 추가 (4.1, A.5), PUT /users/me jobTitle 추가 (2.2절 신규), Career Stats 필드 교체 leaderEndorsementCount+contributionPercentile → promiseFulfillmentRate+completedActionCount (11.1절), 13절 신규: GET /members/{memberId}/insight — promises(ownerType+meetingTitle), statusTrend(meetingTitle), actionPlans(meetingTitle) |
| 2026-06-12 | v2.8 | 14절 신규: GET /leaders/me/growth — keyInsight, talkRatioTrend, teamSafetyTrend, monthlyMeetings, promiseStats, coachingExecution, memberCadence, highlights. 9절 약속 엔드포인트 추가: PATCH /promises/{id}/complete (9.3), GET /promises/reminders (9.7), GET /teams/{teamId}/promises/summary (9.6 — leaderPromises+memberPromises 분리 구조, partnerName 필드). Safety Score 결정론적 계산 전환 (LLM 숫자 미사용, 서버가 speech act 카운트로 직접 산출) 명시. |
| 2026-06-15 | v2.9 | **5.4절 신규**: `DELETE /meetings/{id}` 미팅 취소 (CREATED 상태만, 리더 전용, 회차 자동 재계산, MEETING_NOT_CANCELABLE 409). **5.3절**: 단일 미팅 응답에 `memberId` 추가 (미팅 진행 체크리스트 로드용). **5.2절**: 미팅 목록 역할별 스코프 명시 — 멤버는 리더와의 1on1만(셀프 미팅 제외). **6.1절**: 서베이 제출을 해당 미팅의 멤버 본인으로 제한(타인 제출 403 명시). **9.3절**: 약속 완료 권한을 1on1 참여자(리더 또는 멤버)로 확대. **9.3b절 신규**: `PATCH /promises/{id}/incomplete` 완료 해제(체크박스 off). 에러 코드 목록에 MEETING_NOT_CANCELABLE, PROMISE_NOT_FOUND 추가. |
