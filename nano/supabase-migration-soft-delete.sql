-- 시나리오 테이블에 소프트 삭제 컬럼 추가

-- deleted_at 컬럼 추가 (NULL이면 삭제되지 않음, 값이 있으면 삭제된 시간)
ALTER TABLE scenarios
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 인덱스 추가 (삭제되지 않은 시나리오 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_scenarios_deleted_at ON scenarios(deleted_at);

-- 완료!
SELECT '✅ 소프트 삭제 마이그레이션이 완료되었습니다!' as status;
