-- users 테이블에 bio 컬럼 추가 (개인 설정의 "한 줄 소개")
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio VARCHAR(100) NULL;
