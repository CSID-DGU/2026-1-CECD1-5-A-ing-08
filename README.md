# 2026-1-CECD1-5-A-ing-08

2026년 1학기, 종합설계1, A-ing팀

> **행간의 의미를 파악하다 (Read between the lines)**  
> 1on1 미팅의 Honesty Gap을 AI로 수치화하는 B2B HR SaaS

---

# 👋 팀원 소개

| 이름 | 전공 | 학번 | GitHub | Email |
| ---- | ---- | ---- | ------ | ----- |
| [김지수](https://github.com/OoChe) | 컴퓨터공학전공 | 22학번 | @OoChe | jisukim924@gmail.com |
| [김해솔](https://github.com/ilwhs31) | 컴퓨터공학전공 | 22학번 | @ilwhs31 | ilwhs31@gmail.com |

---

# 🛠️ Tech

## Frontend
<div>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white"/>
</div>

## Backend
<div>
  <img src="https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white"/>
  <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=Spring-Security&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white"/>
</div>

## AI
<div>
  <img src="https://img.shields.io/badge/Groq_Whisper-F55036?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white"/>
</div>

## Infrastructure
<div>
  <img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
</div>

---

## 1. 프로젝트 명

ReadB — 1on1 미팅 Honesty Gap AI 분석 서비스

## 2. 프로젝트 소개

> 리더와 멤버 사이의 1on1 미팅에서 발생하는 **표면적 답변(서베이)** 과 **대화에서 관찰된 발화 행위(Speech Act)** 사이의 간극을 분석해 조직 리스크를 조기에 감지합니다.

- 미팅 녹음 → Groq Whisper(whisper-large-v3) STT → Gemini 2단계 분석 파이프라인
- **리더 대시보드**: 레이더 차트, 블로커 분석, 약속 이행률 등 팀 건강 지표 시각화
- **멤버 대시보드**: 개인 피드백, 성장 기록, 코칭 약속 추적
- 사전 서베이 + Speech Act(취약성·건설적 반대·자발적 제안) 카운팅을 결합해 Honesty Gap 수치화
- **IoT 램프**: ESP32 장치로 미팅 중 리더 발화 비율을 실시간 표시

## 3. 서비스 구조

| 구분 | 내용 |
| ---- | ---- |
| Frontend | React 18 + TypeScript + Vite → Vercel 배포 |
| Backend | Spring Boot 3.2 + Java 17 → Railway 배포 |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage (녹음 원본 — 분석 완료 후 즉시 삭제) |
| AI Pipeline | Groq Whisper STT → Gemini 3.5 Flash Lite (분석) / Gemini 3.1 Flash Lite (사전 브리핑) |
| IoT | ESP32 + LED (`BE/arduino/`) — 실시간 발화 비율 SSE 수신 |

## 4. 레포지토리 구조

```
2026-1-CECD1-5-A-ing-08/
├── BE/     # Spring Boot 백엔드 서버
├── FE/     # React 프론트엔드
└── Docs/   # API 명세, PRD, ERD
```

---

## 🎯 Commit Convention

```
<type>(<scope>): <subject>
```

| type | 사용 시점 |
| ---- | --------- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `chore` | 빌드·설정·의존성 변경 |
| `docs` | 문서 수정 |
| `test` | 테스트 코드 추가/수정 |
| `style` | 코드 포맷팅, 세미콜론 누락 등 |

---
