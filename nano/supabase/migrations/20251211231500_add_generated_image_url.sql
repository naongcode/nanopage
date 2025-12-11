-- scenarios 테이블에 generated_image_url 필드 추가
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS generated_image_url TEXT;

-- 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_scenarios_generated_image
ON scenarios(generated_image_url)
WHERE generated_image_url IS NOT NULL;
