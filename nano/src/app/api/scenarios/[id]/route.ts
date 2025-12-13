import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { UpdateScenarioRequest } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateScenarioRequest = await request.json();

    // 업데이트할 필드만 포함
    const updateData: Record<string, any> = {};
    if (body.image_type !== undefined) updateData.image_type = body.image_type;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.user_edited_prompt_text !== undefined) {
      updateData.user_edited_prompt_text = body.user_edited_prompt_text;
    }
    if (body.user_edited_description_text !== undefined) {
      updateData.user_edited_description_text = body.user_edited_description_text;
    }
    if (body.layout_preset !== undefined) updateData.layout_preset = body.layout_preset;
    if (body.text_position_x !== undefined) updateData.text_position_x = body.text_position_x;
    if (body.text_position_y !== undefined) updateData.text_position_y = body.text_position_y;
    if (body.text_width !== undefined) updateData.text_width = body.text_width;
    if (body.text_height !== undefined) updateData.text_height = body.text_height;
    if (body.block_style !== undefined) updateData.block_style = body.block_style;
    if (body.image_crop !== undefined) updateData.image_crop = body.image_crop;

    // Supabase에서 시나리오 업데이트
    const { data, error } = await supabase
      .from('scenarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`시나리오 업데이트 실패: ${error?.message}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '시나리오 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 소프트 삭제: deleted_at 필드를 현재 시간으로 설정
    const { data, error } = await supabase
      .from('scenarios')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`시나리오 삭제 실패: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: '삭제되었습니다.', data });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '시나리오 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
