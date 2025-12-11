import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 프로젝트 정보 가져오기
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 시나리오 정보 가져오기
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('project_id', id)
      .order('scenario_no', { ascending: true });

    if (scenariosError) {
      return NextResponse.json(
        { error: '시나리오를 불러오는 데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      project,
      scenarios: scenarios || [],
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: '프로젝트를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 업데이트할 필드만 포함
    const updateData: Record<string, any> = {};

    // 모든 프로젝트 필드를 선택적으로 업데이트
    if (body.project_name !== undefined) updateData.project_name = body.project_name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.differentiation_concept !== undefined) updateData.differentiation_concept = body.differentiation_concept;
    if (body.target_customer !== undefined) updateData.target_customer = body.target_customer;
    if (body.selling_point_1 !== undefined) updateData.selling_point_1 = body.selling_point_1;
    if (body.selling_point_2 !== undefined) updateData.selling_point_2 = body.selling_point_2;
    if (body.selling_point_3 !== undefined) updateData.selling_point_3 = body.selling_point_3;
    if (body.visual_concept !== undefined) updateData.visual_concept = body.visual_concept;
    if (body.tone_and_manner !== undefined) updateData.tone_and_manner = body.tone_and_manner;
    if (body.required_scene_1 !== undefined) updateData.required_scene_1 = body.required_scene_1;
    if (body.required_scene_2 !== undefined) updateData.required_scene_2 = body.required_scene_2;
    if (body.forbidden_element !== undefined) updateData.forbidden_element = body.forbidden_element;
    if (body.product_images !== undefined) updateData.product_images = body.product_images;

    // 수정 시간 자동 업데이트
    updateData.updated_at = new Date().toISOString();

    // Supabase에서 프로젝트 업데이트
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`프로젝트 업데이트 실패: ${error?.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '프로젝트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
