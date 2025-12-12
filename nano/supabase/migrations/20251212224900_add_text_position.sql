-- scenarios 테이블에 텍스트 위치 필드 추가
-- 각 이미지 블록에서 설명글의 위치와 크기를 자유롭게 배치

-- 1. 텍스트 X 좌표 (px)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS text_position_x INTEGER DEFAULT 0;

-- 2. 텍스트 Y 좌표 (px)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS text_position_y INTEGER DEFAULT NULL;

-- 3. 텍스트 너비 (px)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS text_width INTEGER DEFAULT NULL;

-- 4. 텍스트 높이 (px, NULL이면 auto)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS text_height INTEGER DEFAULT NULL;

-- 참고:
-- text_position_y가 NULL이면 기본 레이아웃 (이미지 아래)
-- 값이 있으면 absolute position으로 배치
