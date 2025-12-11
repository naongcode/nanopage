import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const results = {
      tables: false,
      columns: false,
      storage: false,
      policies: false,
      errors: [] as string[],
    };

    // 1. Projects 테이블 생성
    const { error: projectsTableError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `,
    });

    if (projectsTableError) {
      results.errors.push(`Projects 테이블: ${projectsTableError.message}`);
    } else {
      results.tables = true;
    }

    // 2. Scenarios 테이블 생성
    const { error: scenariosTableError } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
        CREATE INDEX IF NOT EXISTS idx_scenarios_scenario_no ON scenarios(scenario_no);
      `,
    });

    if (scenariosTableError) {
      results.errors.push(`Scenarios 테이블: ${scenariosTableError.message}`);
    }

    // 3. Updated_at 트리거 함수 및 트리거 생성
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

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
      `,
    });

    if (triggerError) {
      results.errors.push(`트리거: ${triggerError.message}`);
    }

    // 4. differentiation_concept 컬럼이 없으면 추가 (기존 테이블 마이그레이션)
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'projects' AND column_name = 'differentiation_concept'
          ) THEN
            ALTER TABLE projects ADD COLUMN differentiation_concept TEXT;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'projects' AND column_name = 'competitor_concept'
          ) THEN
            ALTER TABLE projects RENAME COLUMN competitor_concept TO differentiation_concept;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'projects' AND column_name = 'product_images'
          ) THEN
            ALTER TABLE projects ADD COLUMN product_images JSONB DEFAULT '[]'::jsonb;
          END IF;
        END $$;
      `,
    });

    if (columnError) {
      results.errors.push(`컬럼 업데이트: ${columnError.message}`);
    } else {
      results.columns = true;
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message:
        results.errors.length === 0
          ? '✅ Supabase 설정이 완료되었습니다!'
          : '⚠️ 일부 설정에 실패했습니다. Supabase SQL Editor에서 수동으로 실행해주세요.',
      results,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message:
          '❌ 자동 설정에 실패했습니다. Supabase에서 RPC 함수 exec_sql을 먼저 생성해주세요.',
      },
      { status: 500 }
    );
  }
}
