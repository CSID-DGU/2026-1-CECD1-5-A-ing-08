// 사전 설문 Q1~Q3 (문항 버전 v2). id·역문항 여부 등 메타데이터는 BE SurveyItems와 일치해야 한다.
export const SURVEY_QUESTIONS = [
  { id: 'q1', template: 'Q1. {period}, 타이밍이 맞지 않아 아직 리더에게 꺼내지 않은 업무 고민이 있다' },
  { id: 'q2', template: 'Q2. {period}, 업무 방식이나 우선순위에 대해 다르게 생각했지만 말하지 않고 넘어간 부분이 있다' },
  { id: 'q3', template: "Q3. 이번 미팅에서 '이렇게 바꾸면 좋겠다' 싶은 것을 직접 꺼내볼 생각이다" },
] as const;

export type SurveyQuestionId = (typeof SURVEY_QUESTIONS)[number]['id'];

// 해당 멤버-리더 쌍의 첫 미팅이면 "지난 미팅"이 없으므로 기간 표현을 바꾼다
export function renderQuestion(template: string, isFirstMeeting: boolean): string {
  return template.replace('{period}', isFirstMeeting ? '최근 2주간' : '지난 미팅 이후');
}
