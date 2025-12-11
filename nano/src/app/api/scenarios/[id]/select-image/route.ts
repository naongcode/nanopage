import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const scenarioId = params.id;
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: '이미지 URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // 선택된 이미지 URL 업데이트
    const { data, error } = await supabase
      .from('scenarios')
      .update({
        selected_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId)
      .select()
      .single();

    if (error) {
      throw new Error(`이미지 선택 실패: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      scenario: data,
    });
  } catch (error) {
    console.error('Error selecting image:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '이미지 선택 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
