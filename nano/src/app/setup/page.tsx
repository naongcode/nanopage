'use client';

import { useState } from 'react';

const SQL_SETUP = `-- 나노바나나 Supabase 자동 설정 SQL
-- 이 SQL을 Supabase SQL Editor에 복사해서 실행하세요

-- 1. Projects 테이블 생성
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  category TEXT NOT NULL,
  differentiation_concept TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  selling_point_1 TEXT NOT NULL,
  selling_point_2 TEXT NOT NULL,
  selling_point_3 TEXT NOT NULL,
  visual_concept TEXT NOT NULL,
  tone_and_manner TEXT NOT NULL,
  required_scene_1 TEXT NOT NULL,
  required_scene_2 TEXT NOT NULL,
  forbidden_element TEXT NOT NULL,
  product_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Scenarios 테이블 생성
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

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_scenario_no ON scenarios(scenario_no);

-- 4. Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at
BEFORE UPDATE ON scenarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage 정책 설정 (이미 존재하면 건너뜀)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Anyone can upload product images'
  ) THEN
    CREATE POLICY "Anyone can upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'Anyone can view product images'
  ) THEN
    CREATE POLICY "Anyone can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 8. 기존 테이블 마이그레이션 (있는 경우)
DO $$
BEGIN
  -- competitor_concept를 differentiation_concept로 변경
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'competitor_concept'
  ) THEN
    ALTER TABLE projects RENAME COLUMN competitor_concept TO differentiation_concept;
  END IF;

  -- product_images 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'product_images'
  ) THEN
    ALTER TABLE projects ADD COLUMN product_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 완료!
SELECT '✅ Supabase 설정이 완료되었습니다!' as status;`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SETUP).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ⚙️ Supabase 설정
          </h1>
          <p className="text-lg text-gray-600">
            3단계로 간단하게 데이터베이스를 설정하세요
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 단계 안내 */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">SQL 복사</h3>
                <p className="text-sm text-gray-600">
                  아래 "SQL 복사" 버튼을 눌러 설정 코드를 복사하세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  Supabase SQL Editor 열기
                </h3>
                <p className="text-sm text-gray-600">
                  "Supabase 열기" 버튼을 눌러 SQL Editor로 이동하세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">SQL 실행</h3>
                <p className="text-sm text-gray-600">
                  복사한 SQL을 붙여넣고 Run 버튼을 클릭하세요
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex-1 min-w-[200px] bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors"
            >
              {copied ? '✓ 복사됨!' : '📋 SQL 복사'}
            </button>
            <button
              onClick={openSupabase}
              className="flex-1 min-w-[200px] bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              🚀 Supabase 열기
            </button>
          </div>

          {/* SQL 미리보기 */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">SQL 미리보기</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
              {SQL_SETUP}
            </pre>
          </div>

          {/* 설명 */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-3">이 설정이 하는 일</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Projects 테이블 생성 (제품 정보 저장)</li>
              <li>✅ Scenarios 테이블 생성 (15개 시나리오 저장)</li>
              <li>✅ 자동 타임스탬프 업데이트</li>
              <li>✅ Storage 버킷 생성 (이미지 업로드용)</li>
              <li>✅ 기존 테이블이 있으면 마이그레이션</li>
            </ul>
          </div>

          {/* 홈으로 */}
          <div className="text-center pt-4">
            <a
              href="/"
              className="inline-block text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← 프로젝트 목록으로
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
