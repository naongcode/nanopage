import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          project_name: body.project_name,
          category: body.category,
          differentiation_concept: body.differentiation_concept || null,
          target_customer: body.target_customer,
          shooting_concept: body.shooting_concept || null,
          product_images: [],
        },
      ])
      .select()
      .single();

    if (error || !project) {
      throw new Error(`프로젝트 생성 실패: ${error?.message}`);
    }

    return NextResponse.json({ id: project.id });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '프로젝트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
