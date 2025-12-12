-- Projects 테이블: 공통 블록 설정 추가
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS common_block_settings JSONB DEFAULT '{
  "blockWidth": 700,
  "blockBackgroundColor": "#ffffff",
  "textFontFamily": "sans-serif",
  "textFontSize": 16,
  "textColor": "#000000",
  "textFontWeight": "normal",
  "textAlign": "left"
}'::jsonb;

COMMENT ON COLUMN projects.common_block_settings IS '모든 블록에 기본 적용되는 공통 설정 (JSON)';

-- Scenarios 테이블: 개별 블록 스타일 + 이미지 crop 추가
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS block_style JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_crop JSONB DEFAULT NULL;

COMMENT ON COLUMN scenarios.block_style IS '개별 블록 스타일 override (NULL이면 공통 설정 사용)';
COMMENT ON COLUMN scenarios.image_crop IS '이미지 자르기 정보 {x, y, width, height, zoom}';

-- JSONB 검색 최적화를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_scenarios_block_style ON scenarios USING GIN (block_style);
CREATE INDEX IF NOT EXISTS idx_scenarios_image_crop ON scenarios USING GIN (image_crop);
