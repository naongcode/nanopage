import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const scenarioId = params.id;

    // 시나리오 정보 가져오기
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*, projects(*)')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      return NextResponse.json(
        { error: '시나리오를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const project = scenario.projects;

    // OpenAI로 시나리오 재생성
    const prompt = `
당신은 전문 이커머스 상세페이지 제작 전문가입니다.
다음 제품 정보와 마케팅 컨셉을 기반으로, 특정 이미지 촬영 시나리오를 생성해주세요.

## 제품 기본 정보
- 제품명: ${project.project_name}
- 카테고리: ${project.category}
- 타겟 고객: ${project.target_customer}

## 마케팅 컨셉
- 핵심 셀링 포인트 1: ${project.selling_point_1}
- 핵심 셀링 포인트 2: ${project.selling_point_2}
- 핵심 셀링 포인트 3: ${project.selling_point_3}
- 주요 시각적 컨셉: ${project.visual_concept}
- 톤앤매너/색상: ${project.tone_and_manner}
- 금지 요소: ${project.forbidden_element}

## 생성할 시나리오
- 이미지 유형: ${scenario.image_type}
- 역할: ${scenario.role}

다음 형식으로 구체적인 촬영 시나리오를 작성해주세요:

톤: (색상/분위기)
조명: (조명 방향과 종류)
배경: (배경 설명)
구도: (카메라 각도와 구도)
모델: (모델이 필요한 경우 성별/연령/특징, 없으면 "없음")
소품: (필요한 소품들)
감성: (전달하고자 하는 감성)

중요:
1. 각 항목은 줄바꿈으로 구분하세요
2. 반드시 위의 형식(톤:/조명:/배경: 등)을 따라 작성하세요
3. 금지 요소는 절대 포함하지 마세요
4. 촬영 현장에서 바로 사용할 수 있을 정도로 구체적이어야 합니다
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 이커머스 상세페이지 제작 전문가입니다. 촬영 시나리오를 구체적이고 실용적으로 작성합니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const newPromptText = completion.choices[0].message.content;

    if (!newPromptText) {
      throw new Error('시나리오 생성 실패');
    }

    // DB 업데이트
    const { data: updatedScenario, error: updateError } = await supabase
      .from('scenarios')
      .update({
        prompt_text: newPromptText,
        user_edited_prompt_text: null, // 재생성하면 수정 이력 초기화
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`업데이트 실패: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      scenario: updatedScenario,
    });
  } catch (error) {
    console.error('Error regenerating scenario:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '시나리오 재생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
