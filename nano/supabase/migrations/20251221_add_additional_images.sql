-- 멀티 이미지 레이아웃을 위한 추가 이미지 URL 배열 컬럼 추가
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS additional_image_urls TEXT[] DEFAULT '{}';
