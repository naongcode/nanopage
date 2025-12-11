import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 복원: deleted_at을 NULL로 설정
    const { data, error } = await supabase
      .from('scenarios')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`시나리오 복원 실패: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: '복원되었습니다.', data });
  } catch (error) {
    console.error('Error restoring scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '시나리오 복원 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
