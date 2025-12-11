import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { imageData, mimeType } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    const prompt = `
당신은 전문 제품 사진 분석가입니다.
이 제품 이미지를 분석하여 다음 정보를 JSON 형식으로 추출해주세요:

{
  "colors": ["주요 색상 1", "주요 색상 2", "주요 색상 3"],
  "material": "제품의 재질 (예: 금속, 플라스틱, 천, 가죽, 나무 등)",
  "texture": "표면 질감 (예: 매끄러운, 거친, 광택, 무광 등)",
  "style": "디자인 스타일 (예: 미니멀, 모던, 클래식, 빈티지 등)",
  "shape": "형태 및 실루엣 설명",
  "key_features": ["특징 1", "특징 2", "특징 3"],
  "suggested_mood": "추천 촬영 분위기 (예: 고급스러운, 캐주얼한, 역동적인 등)",
  "lighting_suggestion": "추천 조명 (예: 자연광, 스튜디오 조명, 황금빛 등)"
}

구체적이고 상세하게 분석해주세요.
`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageData,
          },
        },
      ],
    });

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('분석 결과를 받지 못했습니다.');
    }

    const text = result.candidates[0].content.parts?.find((part: any) => part.text)?.text;

    if (!text) {
      throw new Error('분석 결과를 받지 못했습니다.');
    }

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('분석 결과를 파싱할 수 없습니다.');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '이미지 분석 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
