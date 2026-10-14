// 실행: npm test (Node 22.18+ 타입 스트리핑 사용, 추가 의존성 없음)
import assert from 'node:assert/strict';
import test from 'node:test';
import { SURVEY_QUESTIONS, renderQuestion } from '../src/constants/surveyQuestions.ts';

const [q1, q2, q3] = SURVEY_QUESTIONS;

test('첫 미팅이면 Q1, Q2의 기간을 "최근 2주간"으로 렌더링', () => {
  assert.equal(renderQuestion(q1.template, true), 'Q1. 최근 2주간, 타이밍이 맞지 않아 아직 리더에게 꺼내지 않은 업무 고민이 있다');
  assert.ok(renderQuestion(q2.template, true).startsWith('Q2. 최근 2주간,'));
});

test('이전 미팅이 있으면 "지난 미팅 이후"로 렌더링', () => {
  assert.ok(renderQuestion(q1.template, false).startsWith('Q1. 지난 미팅 이후,'));
  assert.ok(renderQuestion(q2.template, false).startsWith('Q2. 지난 미팅 이후,'));
});

test('Q3는 기간 변수가 없어 그대로', () => {
  assert.equal(renderQuestion(q3.template, true), q3.template);
  assert.ok(SURVEY_QUESTIONS.every((q) => !renderQuestion(q.template, true).includes('{period}')));
});
