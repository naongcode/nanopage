-- scenarios 테이블에 설명글 필드 추가
-- 상세페이지에 표시될 각 이미지의 설명글

-- 1. AI 생성 원본 설명글
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS description_text TEXT;

-- 2. 사용자가 수정한 설명글 (nullable)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS user_edited_description_text TEXT;

-- 3. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_scenarios_description
ON scenarios(description_text)
WHERE description_text IS NOT NULL;
