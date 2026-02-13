-- 나노바나나 프로젝트 Supabase 스키마

-- Projects 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  category TEXT NOT NULL,
  differentiation_concept TEXT,
  target_customer TEXT NOT NULL,
  selling_point_1 TEXT,
  selling_point_2 TEXT,
  selling_point_3 TEXT,
  visual_concept TEXT,
  tone_and_manner TEXT,
  required_scene_1 TEXT,
  required_scene_2 TEXT,
  forbidden_element TEXT,
  product_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenarios 테이블
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scenario_no INTEGER NOT NULL,
  image_type TEXT NOT NULL,
  role TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  user_edited_prompt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_project_scenario UNIQUE (project_id, scenario_no)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_scenario_no ON scenarios(scenario_no);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects 테이블 트리거
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Scenarios 테이블 트리거
CREATE TRIGGER update_scenarios_updated_at
BEFORE UPDATE ON scenarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
