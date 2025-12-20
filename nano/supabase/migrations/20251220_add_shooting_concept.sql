-- shooting_concept 컬럼 추가 (촬영 컨셉 - 보여주고 싶은 장면)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS shooting_concept TEXT;
