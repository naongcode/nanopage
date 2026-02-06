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

// 배치별 시나리오 생성 프롬프트
function buildBatchPrompt(
  batch: typeof SCENARIO_STRUCTURE,
  body: any,
  marketingConcept: any,
  shootingConceptGuide: string
) {
  return `당신은 전문 이커머스 상세페이지 제작 전문가입니다.
다음 제품 정보와 마케팅 컨셉을 기반으로, ${batch.length}장의 이미지 촬영 시나리오(프롬프트)를 생성해주세요.

## 제품 기본 정보
- 제품명: ${body.project_name}
- 카테고리: ${body.category}
- 차별화 컨셉 (피하고 싶은 이미지): ${body.differentiation_concept}
- 타겟 고객: ${body.target_customer}
${shootingConceptGuide}

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
5. ⭐ 모든 시나리오에서 "${body.project_name}"을 직접 언급하고 구체적으로 묘사하세요. 일반적인 배경 묘사가 아닌, 제품이 주인공인 장면을 만드세요.
6. ⭐ 모델이 필요한 시나리오에서는 반드시 "한국인" 모델을 기본으로 사용하세요. (예: "20대 후반 한국인 여성", "30대 한국인 남성")

다음 ${batch.length}개 시나리오에 대해 구체적인 촬영 프롬프트와 상세페이지 설명글을 작성해주세요:

${batch.map((s) => `${s.no}. [${s.type}] ${s.role}`).join('\n')}

각 시나리오는 JSON 배열로 반환하되, 각 객체는 다음 형식을 따라주세요:
{
  "scenario_no": 번호,
  "image_type": "이미지 유형",
  "role": "역할 설명",
  "prompt_text": "구체적인 촬영 시나리오를 다음 형식으로 작성:\\n톤: (색상/분위기를 상세히 2-3문장)\\n조명: (조명 방향, 종류, 강도를 구체적으로)\\n배경: (배경 공간과 소품 배치를 상세히 2-3문장)\\n구도: (카메라 각도, 거리, 프레이밍을 구체적으로)\\n모델: (한국인 모델 기본, 성별/연령/외형/표정/포즈 상세 명시, 없으면 '없음')\\n소품: (필요한 소품들을 구체적으로 나열)\\n감성: (전달하고자 하는 감성을 2문장으로)\\n\\n⭐ ${body.project_name}이(가) 어떻게 보이는지, 어디에 위치하는지 구체적으로 묘사",
  "description_text": "이 이미지 하단에 표시될 설명글 (2-3문장, 각 문장마다 줄바꿈(\\n) 포함, 타겟 고객에게 어필하는 마케팅 카피)"
}

중요:
1. prompt_text는 반드시 위의 형식(톤:/조명:/배경:/구도: 등)을 따라 작성하세요. 각 항목은 줄바꿈으로 구분하세요.
2. ⭐⭐ 각 항목(톤/조명/배경/구도/모델/소품/감성)을 2-3문장 이상으로 상세하게 작성하세요. 간략한 한 줄 설명이 아닌, 촬영 감독이 바로 이해할 수 있는 디테일한 지시사항이어야 합니다.
3. description_text는 쿠팡 상세페이지처럼 이미지 아래 들어갈 설명글입니다. 고객의 구매 욕구를 자극하는 카피로 작성하세요.
4. ⭐ "${body.project_name}"을 모든 prompt_text에서 구체적으로 묘사하세요. "농장 풍경"이 아닌 "복숭아가 주렁주렁 열린 과수원"처럼요.`;
}

// 배치 시나리오 생성 (OpenAI 호출)
async function generateScenarioBatch(
  batch: typeof SCENARIO_STRUCTURE,
  body: any,
  marketingConcept: any,
  shootingConceptGuide: string
): Promise<Scenario[]> {
  const batchPrompt = buildBatchPrompt(batch, body, marketingConcept, shootingConceptGuide);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 이커머스 상세페이지 제작 전문가입니다. 촬영 시나리오를 구체적이고 실용적으로 작성합니다. 각 항목(톤/조명/배경/구도/모델/소품/감성)을 상세하게 작성하세요.',
      },
      {
        role: 'user',
        content: batchPrompt,
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

  if (parsedResponse.scenarios) {
    return parsedResponse.scenarios;
  } else if (Array.isArray(parsedResponse)) {
    return parsedResponse;
  } else {
    return Object.values(parsedResponse).filter(
      (item): item is Scenario => typeof item === 'object' && item !== null && 'scenario_no' in item
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const hasImages = body.product_images && body.product_images.length > 0;
        const totalSteps = hasImages ? 4 : 3; // 이미지 분석 / 마케팅 컨셉 / 시나리오 생성 / 저장
        let currentStep = 0;

        const sendProgress = (step: string) => {
          currentStep++;
          sendEvent({ type: 'progress', step: `[${currentStep}/${totalSteps}] ${step}` });
        };

        // Step: 이미지가 있으면 Gemini로 분석 (최대 3회 재시도)
        let imageAnalysis = null;
        if (hasImages) {
          const MAX_RETRIES = 3;
          const RETRY_DELAY = 3000;

          try {
            sendProgress(`이미지 ${body.product_images.length}장 분석 중...`);
            const imagePromises = body.product_images.map(async (imageUrl: string) => {
              const imageResponse = await fetch(imageUrl);
              const imageBuffer = await imageResponse.arrayBuffer();
              return {
                data: Buffer.from(imageBuffer).toString('base64'),
                mimeType: 'image/jpeg',
              };
            });
            const images = await Promise.all(imagePromises);

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images }),
              });

              if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                imageAnalysis = analysisData.analysis;
                break;
              }

              if (attempt < MAX_RETRIES) {
                sendEvent({ type: 'progress', step: `[${currentStep}/${totalSteps}] API 한도 초과 - ${RETRY_DELAY / 1000}초 후 재시도... (${attempt}/${MAX_RETRIES})` });
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              } else {
                throw new Error('이미지 분석에 실패했습니다. 잠시 후 다시 시도해주세요. (API 호출 한도 초과)');
              }
            }
          } catch (error) {
            throw error instanceof Error ? error : new Error('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
          }
        }

        // Step: AI로 마케팅 컨셉 자동 생성
        sendProgress('마케팅 컨셉 생성 중...');

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

        const shootingConceptInstruction = body.shooting_concept
          ? `
## ⭐ 촬영 컨셉 (반드시 반영해야 할 핵심 장면들) ⭐
사용자가 선택한 촬영 컨셉: ${body.shooting_concept}

중요: 위 촬영 컨셉은 반드시 required_scene에 구체적으로 반영되어야 합니다.
- "농장 수확" → "${body.project_name}"이 실제로 수확되는 장면 (예: 나무에 주렁주렁 열린 모습, 농부가 수확하는 모습)
- "포장 공정" → "${body.project_name}"이 위생적으로 포장되는 공정 장면
- "재료 클로즈업" → "${body.project_name}"의 신선한 단면이나 질감이 보이는 클로즈업
- "요리 장면" → "${body.project_name}"을 활용한 요리 조리 장면
일반적인 "농장 풍경"이 아니라, 제품인 "${body.project_name}"이 직접 등장하는 구체적인 장면이어야 합니다.
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
${shootingConceptInstruction}
${imageAnalysisText}

다음 항목들을 JSON 형식으로 생성해주세요:

{
  "selling_point_1": "가장 중요한 핵심 셀링 포인트 (5-10단어)",
  "selling_point_2": "두 번째 중요한 셀링 포인트 (5-10단어)",
  "selling_point_3": "세 번째 셀링 포인트 (5-10단어)",
  "visual_concept": "주요 시각적 컨셉 (촬영 장소와 분위기, 예: 고급스러운 사무 공간 / 자연광 홈카페)",
  "tone_and_manner": "톤앤매너/색상 (예: 차분한 뉴트럴 톤 (화이트, 베이지, 라이트 그레이))",
  "required_scene_1": "필수 연출 상황 1 (촬영 컨셉에서 선택한 장면을 ${body.project_name}와 함께 구체적으로 묘사)",
  "required_scene_2": "필수 연출 상황 2 (촬영 컨셉에서 선택한 다른 장면을 ${body.project_name}와 함께 구체적으로 묘사)",
  "forbidden_element": "금지 요소 (차별화 컨셉과 연결되어 피해야 할 시각적 요소)"
}

원칙:
1. 타겟 고객의 라이프스타일과 니즈를 반영하세요
2. 제품 카테고리의 특성을 살리세요
3. 차별화 컨셉에서 언급된 이미지는 완전히 배제하세요
4. 구체적이고 실용적으로 작성하세요
5. ⭐ 촬영 컨셉이 있다면, required_scene에 제품명 "${body.project_name}"을 직접 언급하며 구체적으로 반영하세요 ⭐
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

        // Step 2: 시나리오를 5개씩 3배치로 생성
        const shootingConceptGuide = body.shooting_concept
          ? `
## ⭐⭐⭐ 촬영 컨셉 (반드시 시나리오에 반영) ⭐⭐⭐
사용자가 선택한 촬영 컨셉: ${body.shooting_concept}

이 촬영 컨셉은 시나리오에 직접적으로 반영되어야 합니다.
"${body.project_name}"이 실제로 등장하는 구체적인 장면으로 작성하세요:

예시 (식품 - 복숭아의 경우):
- "농장 수확" → 햇살 가득한 복숭아 과수원에서 탐스러운 복숭아가 나무에 주렁주렁 매달려 있는 장면 / 농부의 손이 복숭아를 조심스럽게 수확하는 장면
- "포장 공정" → 깨끗한 공장에서 복숭아가 선별되고 고급스럽게 박스에 포장되는 장면
- "재료 클로즈업" → 갓 수확한 복숭아의 탐스러운 표면, 과즙이 촉촉하게 맺힌 단면 클로즈업

⚠️ 주의: "농장 풍경", "자연 배경" 같은 모호한 표현 금지!
반드시 "${body.project_name}"이 화면의 주인공으로 구체적으로 묘사되어야 합니다.
`
          : '';

        const batches = [
          SCENARIO_STRUCTURE.slice(0, 5),
          SCENARIO_STRUCTURE.slice(5, 10),
          SCENARIO_STRUCTURE.slice(10, 15),
        ];

        // 3개 배치를 병렬로 동시 생성
        sendProgress('시나리오 15개 생성 중...');

        const batchResults = await Promise.all(
          batches.map((batch) =>
            generateScenarioBatch(batch, body, marketingConcept, shootingConceptGuide)
          )
        );

        const allScenarios: Scenario[] = batchResults.flat();

        // Step: Supabase에 저장
        sendProgress('저장 중...');

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert([
            {
              project_name: body.project_name,
              category: body.category,
              differentiation_concept: body.differentiation_concept,
              target_customer: body.target_customer,
              shooting_concept: body.shooting_concept || null,
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

        // scenario_no 중복 방지: 순서대로 1부터 재할당
        const scenariosToInsert = allScenarios.map((scenario, index) => ({
          project_id: project.id,
          scenario_no: index + 1,
          image_type: scenario.image_type,
          role: scenario.role,
          prompt_text: scenario.prompt_text,
          description_text: scenario.description_text,
        }));

        const { data: savedScenarios, error: scenariosError } = await supabase
          .from('scenarios')
          .insert(scenariosToInsert)
          .select();

        if (scenariosError || !savedScenarios) {
          throw new Error(`시나리오 저장 실패: ${scenariosError?.message}`);
        }

        sendEvent({
          type: 'complete',
          data: { project_id: project.id, scenarios: savedScenarios },
        });
        controller.close();
      } catch (error) {
        console.error('Error generating scenarios:', error);
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : '시나리오 생성 중 오류가 발생했습니다.',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
