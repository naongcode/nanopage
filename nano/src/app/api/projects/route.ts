import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CreateProjectRequest, Scenario } from '@/types';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 15개 시나리오 구조 템플릿
const SCENARIO_STRUCTURE = [
  { no: 1, type: '메인', role: '대표 이미지: 제품의 전체 디자인과 컨셉을 한 번에 보여줌' },
  { no: 2, type: '메인', role: '타겟 고객 공감: 제품의 특징 중 하나를 활용하여 고객의 니즈를 보여줌' },
  { no: 3, type: '메인', role: '감성 연출: 판매 페이지의 분위기를 고조시키는 감성적인 배경 컷' },
  { no: 4, type: '모델', role: '착용컷 1: 필수 연출 상황 1을 구현하는 여성/남성 모델의 착용컷' },
  { no: 5, type: '모델', role: '착용컷 2: 필수 연출 상황 2를 구현하는 다른 성별/인종 모델의 착용컷' },
  { no: 6, type: '모델', role: '디자인 강조: 제품의 전체 디자인을 강조하는 전신 착용 모델 컷' },
  { no: 7, type: '디테일', role: '특징 1 강조: 가장 중요한 특징 1을 클로즈업' },
  { no: 8, type: '디테일', role: '특징 2 강조: 두 번째 중요한 특징 2를 클로즈업' },
  { no: 9, type: '디테일', role: '특징 3 강조: 세 번째 특징 3의 사용 장면을 클로즈업' },
  { no: 10, type: '라이프스타일', role: '휴식/릴렉스: 편안한 환경에서 제품이 자연스럽게 놓여있는 컷' },
  { no: 11, type: '라이프스타일', role: '활동적인 장면: 제품이 활발한 활동 중에도 사용됨을 보여주는 컷' },
  { no: 12, type: '라이프스타일', role: '제품 단독 컷: 배경이 없는 흰색 배경 위에 그림자만 있는 순수한 제품 컷' },
  { no: 13, type: '보조', role: '다양한 각도: 제품의 다른 각도나 뒷모습 등을 보여주는 모델 컷' },
  { no: 14, type: '보조', role: '사용 전후 대비 (암시): 제품 사용으로 얻는 이점을 암시하는 비포/애프터식 연출' },
  { no: 15, type: '보조', role: '패키징 또는 구성품: 제품 패키징이나 함께 제공되는 구성품을 보여주는 컷' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Step 0: 이미지가 있으면 Gemini로 분석
    let imageAnalysis = null;
    if (body.product_images && body.product_images.length > 0) {
      try {
        // 첫 번째 이미지 URL을 가져와서 분석
        const imageUrl = body.product_images[0];
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyze-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64Image,
            mimeType: 'image/jpeg',
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          imageAnalysis = analysisData.analysis;
        }
      } catch (error) {
        console.error('Image analysis failed:', error);
        // 이미지 분석 실패해도 계속 진행
      }
    }

    // Step 1: AI로 마케팅 컨셉 자동 생성
    const imageAnalysisText = imageAnalysis
      ? `
## 제품 이미지 분석 결과 (AI 분석)
- 주요 색상: ${imageAnalysis.colors?.join(', ')}
- 재질: ${imageAnalysis.material}
- 질감: ${imageAnalysis.texture}
- 스타일: ${imageAnalysis.style}
- 형태: ${imageAnalysis.shape}
- 주요 특징: ${imageAnalysis.key_features?.join(', ')}
- 추천 분위기: ${imageAnalysis.suggested_mood}
- 추천 조명: ${imageAnalysis.lighting_suggestion}
`
      : '';

    const conceptPrompt = `
당신은 전문 이커머스 마케팅 전략가입니다.
다음 제품 기본 정보를 바탕으로, 효과적인 마케팅 컨셉을 생성해주세요.

## 제품 기본 정보
- 제품명: ${body.project_name}
- 카테고리: ${body.category}
- 차별화 컨셉 (피하고 싶은 이미지): ${body.differentiation_concept}
- 타겟 고객: ${body.target_customer}
${imageAnalysisText}

다음 항목들을 JSON 형식으로 생성해주세요:

{
  "selling_point_1": "가장 중요한 핵심 셀링 포인트 (5-10단어)",
  "selling_point_2": "두 번째 중요한 셀링 포인트 (5-10단어)",
  "selling_point_3": "세 번째 셀링 포인트 (5-10단어)",
  "visual_concept": "주요 시각적 컨셉 (촬영 장소와 분위기, 예: 고급스러운 사무 공간 / 자연광 홈카페)",
  "tone_and_manner": "톤앤매너/색상 (예: 차분한 뉴트럴 톤 (화이트, 베이지, 라이트 그레이))",
  "required_scene_1": "필수 연출 상황 1 (타겟 고객이 공감할 구체적인 사용 상황)",
  "required_scene_2": "필수 연출 상황 2 (다른 각도의 사용 상황)",
  "forbidden_element": "금지 요소 (차별화 컨셉과 연결되어 피해야 할 시각적 요소)"
}

원칙:
1. 타겟 고객의 라이프스타일과 니즈를 반영하세요
2. 제품 카테고리의 특성을 살리세요
3. 차별화 컨셉에서 언급된 이미지는 완전히 배제하세요
4. 구체적이고 실용적으로 작성하세요
`;

    const conceptCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 이커머스 마케팅 전략 전문가입니다. 제품의 핵심 가치를 파악하고 효과적인 마케팅 컨셉을 제안합니다.',
        },
        {
          role: 'user',
          content: conceptPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const conceptText = conceptCompletion.choices[0].message.content;
    if (!conceptText) {
      throw new Error('마케팅 컨셉 생성 실패');
    }

    const marketingConcept = JSON.parse(conceptText);

    // Step 2: 생성된 마케팅 컨셉을 사용하여 15개 시나리오 생성
    const prompt = `
당신은 전문 이커머스 상세페이지 제작 전문가입니다.
다음 제품 정보와 마케팅 컨셉을 기반으로, 15장의 이미지 촬영 시나리오(프롬프트)를 생성해주세요.

## 제품 기본 정보
- 제품명: ${body.project_name}
- 카테고리: ${body.category}
- 차별화 컨셉 (피하고 싶은 이미지): ${body.differentiation_concept}
- 타겟 고객: ${body.target_customer}

## 마케팅 컨셉 (AI 생성)
- 핵심 셀링 포인트 1: ${marketingConcept.selling_point_1}
- 핵심 셀링 포인트 2: ${marketingConcept.selling_point_2}
- 핵심 셀링 포인트 3: ${marketingConcept.selling_point_3}
- 주요 시각적 컨셉: ${marketingConcept.visual_concept}
- 톤앤매너/색상: ${marketingConcept.tone_and_manner}
- 필수 연출 상황 1: ${marketingConcept.required_scene_1}
- 필수 연출 상황 2: ${marketingConcept.required_scene_2}
- 금지 요소: ${marketingConcept.forbidden_element}

## 시나리오 생성 원칙
1. 각 시나리오는 촬영 현장에서 바로 사용할 수 있을 정도로 구체적이어야 합니다.
2. 배경/분위기, 조명, 구도, 감성적 표현을 모두 포함해야 합니다.
3. 시각적 컨셉과 톤앤매너를 반영하되, 금지 요소는 절대 포함하지 마세요.
4. 셀링 포인트 3가지가 명확히 드러나도록 구성하세요.
5. 각 프롬프트는 2-4문장으로 작성하세요.

다음 15개 시나리오에 대해 구체적인 촬영 프롬프트를 작성해주세요:

${SCENARIO_STRUCTURE.map((s, i) => `
${i + 1}. [${s.type}] ${s.role}
`).join('\n')}

각 시나리오는 JSON 배열로 반환하되, 각 객체는 다음 형식을 따라주세요:
{
  "scenario_no": 번호,
  "image_type": "이미지 유형",
  "role": "역할 설명",
  "prompt_text": "구체적인 촬영 시나리오를 다음 형식으로 작성:\n톤: (색상/분위기)\n조명: (조명 방향과 종류)\n배경: (배경 설명)\n구도: (카메라 각도와 구도)\n모델: (모델이 필요한 경우 성별/연령/특징)\n소품: (필요한 소품들)\n감성: (전달하고자 하는 감성)"
}

중요: prompt_text는 반드시 위의 형식(톤:/조명:/배경:/구도: 등)을 따라 작성하세요. 각 항목은 줄바꿈으로 구분하세요.
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
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    const parsedResponse = JSON.parse(responseText);

    // scenarios 배열 추출 (응답 구조에 따라 조정 필요)
    let scenarios: Scenario[] = [];
    if (parsedResponse.scenarios) {
      scenarios = parsedResponse.scenarios;
    } else if (Array.isArray(parsedResponse)) {
      scenarios = parsedResponse;
    } else {
      // 응답이 다른 구조일 경우 처리
      scenarios = Object.values(parsedResponse).filter(
        (item): item is Scenario => typeof item === 'object' && item !== null && 'scenario_no' in item
      );
    }

    // Supabase에 프로젝트 저장 (Step 1 사용자 입력 + Step 2 AI 생성 데이터)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          project_name: body.project_name,
          category: body.category,
          differentiation_concept: body.differentiation_concept,
          target_customer: body.target_customer,
          selling_point_1: marketingConcept.selling_point_1,
          selling_point_2: marketingConcept.selling_point_2,
          selling_point_3: marketingConcept.selling_point_3,
          visual_concept: marketingConcept.visual_concept,
          tone_and_manner: marketingConcept.tone_and_manner,
          required_scene_1: marketingConcept.required_scene_1,
          required_scene_2: marketingConcept.required_scene_2,
          forbidden_element: marketingConcept.forbidden_element,
          product_images: body.product_images || [],
        },
      ])
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`프로젝트 저장 실패: ${projectError?.message}`);
    }

    // Supabase에 시나리오 저장
    const scenariosToInsert = scenarios.map((scenario) => ({
      project_id: project.id,
      scenario_no: scenario.scenario_no,
      image_type: scenario.image_type,
      role: scenario.role,
      prompt_text: scenario.prompt_text,
    }));

    const { data: savedScenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .insert(scenariosToInsert)
      .select();

    if (scenariosError || !savedScenarios) {
      throw new Error(`시나리오 저장 실패: ${scenariosError?.message}`);
    }

    return NextResponse.json({
      project_id: project.id,
      scenarios: savedScenarios,
    });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '시나리오 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
