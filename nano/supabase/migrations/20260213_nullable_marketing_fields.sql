-- 프로젝트 생성 시점 변경: 마케팅 컨셉 필드를 nullable로 변경
-- 프로젝트를 먼저 생성(기본 정보만)하고, AI 처리 후 마케팅 컨셉을 UPDATE하기 위함

ALTER TABLE projects ALTER COLUMN selling_point_1 DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN selling_point_2 DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN selling_point_3 DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN visual_concept DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN tone_and_manner DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN required_scene_1 DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN required_scene_2 DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN forbidden_element DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN differentiation_concept DROP NOT NULL;
