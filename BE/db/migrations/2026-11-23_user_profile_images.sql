-- 프로필 이미지 저장 테이블 (256×256으로 줄인 이미지, 최대 100KB)
CREATE TABLE IF NOT EXISTS public.user_profile_images (
    user_id         BIGINT PRIMARY KEY,
    content_type    VARCHAR(20) NOT NULL,
    data            BYTEA NOT NULL,
    updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profile_images_user FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);
ALTER TABLE public.user_profile_images ENABLE ROW LEVEL SECURITY;
