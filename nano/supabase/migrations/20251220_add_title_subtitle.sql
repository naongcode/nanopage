-- 제목과 부제목 필드 추가
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS title_text TEXT;
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS subtitle_text TEXT;
