-- 레이아웃 프리셋 컬럼 추가
-- layout_preset: 이미지와 텍스트 배치 프리셋 설정

-- 1. scenarios 테이블에 layout_preset 컬럼 추가
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS layout_preset TEXT;

-- 2. layout_preset에 대한 코멘트 추가
COMMENT ON COLUMN scenarios.layout_preset IS '레이아웃 프리셋 (vertical, horizontal-left, horizontal-right, overlay-center, overlay-bottom, overlay-top, text-first, image-dominant, magazine, card)';

-- 3. 기존 데이터에 대해 기본값 설정 (NULL이면 vertical로 간주)
-- 프리셋을 명시적으로 저장하지 않고, NULL일 때는 기본값 vertical로 처리
