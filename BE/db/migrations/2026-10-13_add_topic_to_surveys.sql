-- surveys 테이블에 topic 컬럼 추가 (사전 설문의 선택 입력 "이야기하고 싶은 주제")
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS topic VARCHAR(200) NULL;
