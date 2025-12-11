-- 여러 이미지 저장을 위한 마이그레이션

-- 1. 새 컬럼 추가
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS generated_image_urls TEXT[] DEFAULT '{}';

ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS selected_image_url TEXT;

-- 2. 기존 generated_image_url 데이터가 있다면 마이그레이션
-- (기존 컬럼이 있다면 배열로 옮기고 삭제)
DO $$
BEGIN
  -- generated_image_url 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'scenarios'
    AND column_name = 'generated_image_url'
  ) THEN
    -- 기존 데이터를 배열로 마이그레이션
    UPDATE scenarios
    SET
      generated_image_urls = ARRAY[generated_image_url],
      selected_image_url = generated_image_url
    WHERE generated_image_url IS NOT NULL;

    -- 기존 컬럼 삭제
    ALTER TABLE scenarios DROP COLUMN generated_image_url;
  END IF;
END $$;

-- 3. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_scenarios_selected_image ON scenarios(selected_image_url);
