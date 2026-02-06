import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API 시작] /api/generate-image');

    const {
      scenarioId,
      projectId,
      promptText,
      productImageUrl,
      productImageUrls,
      imageType,
      role,
    } = await request.json();

    // 여러 이미지 배열 또는 단일 이미지 지원 (하위 호환)
    const allProductImageUrls: string[] = productImageUrls?.length
      ? productImageUrls
      : productImageUrl
        ? [productImageUrl]
        : [];

    console.log('📋 [요청 데이터]:', {
      scenarioId,
      projectId,
      promptText: promptText?.substring(0, 100) + '...',
      productImageCount: allProductImageUrls.length,
      imageType,
      role,
    });

    if (!promptText) {
      console.error('❌ [검증 실패] 프롬프트 텍스트 없음');
      return NextResponse.json(
        { error: '프롬프트 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 제품 이미지가 있으면 함께 전달
    const contents: any[] = [];

    // 먼저 프롬프트 추가
    const hasImages = allProductImageUrls.length > 0;
    const imageRefText = allProductImageUrls.length > 1
      ? `You are provided with ${allProductImageUrls.length} product reference images showing the product from different angles/states.`
      : 'You are provided with a product reference image.';

    const fullPrompt = hasImages
      ? `${imageRefText} Create a professional product photography image using this EXACT product in the scenario described below.

🚨 CRITICAL REQUIREMENT: You MUST use the provided product reference images to understand the product's appearance. Do not create a different product - use the EXACT product shown in the reference images and stage it according to the scenario.

Image Type: ${imageType}
Role: ${role}
Scenario: ${promptText}

Requirements:
- Use the EXACT product shown in the reference images
- Reference ALL provided images to understand the product's full appearance (shape, color, texture, packaging)
- Stage and style the product according to the scenario description
- Create a photorealistic, high-quality e-commerce product photography
- Follow the exact scenario description for composition, props, and styling
- Use professional lighting that matches the scenario mood
- Make it suitable for an e-commerce product detail page
- The product should be clearly visible and be the main focus`
      : `Create a professional product photography image based on this scenario:

Image Type: ${imageType}
Role: ${role}
Scenario: ${promptText}

Important:
- Create a photorealistic, high-quality e-commerce product image
- Follow the exact scenario description
- Use professional lighting and composition
- Make it suitable for an e-commerce product detail page`;

    console.log('📝 [프롬프트 생성]:', fullPrompt.substring(0, 200) + '...');

    // 제품 이미지가 있으면 먼저 추가 (AI가 이미지를 먼저 보도록)
    if (hasImages) {
      console.log(`🖼️ [제품 이미지] ${allProductImageUrls.length}장 로드 중...`);
      for (const imageUrl of allProductImageUrls) {
        try {
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');

          contents.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          });
          console.log(`✅ [이미지 추가] ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}`);
        } catch (error) {
          console.error(`❌ [이미지 로드 실패] ${imageUrl}:`, error);
        }
      }
      console.log(`📌 [이미지 ${contents.length}장 추가 완료]`);
    } else {
      console.log('⚠️ [제품 이미지 없음]');
    }

    // 프롬프트를 나중에 추가
    contents.push({
      text: fullPrompt,
    });

    // Gemini Nano Banana로 이미지 생성
    console.log('🤖 [Gemini 호출 시작] Contents 개수:', contents.length);
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    console.log('✅ [Gemini 응답 수신]');

    // 응답 구조 확인
    console.log('Response structure:', JSON.stringify({
      hasCandidates: !!result.candidates,
      candidatesLength: result.candidates?.length,
      firstCandidate: result.candidates?.[0] ? 'exists' : 'none',
    }));

    // 생성된 이미지 추출
    let generatedImageBase64 = null;

    // Gemini 응답 구조 체크
    if (result.candidates && result.candidates[0]) {
      const parts = result.candidates[0].content?.parts || [];
      console.log('📦 [Parts 개수]:', parts.length);

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`📄 [Part ${i}] 타입:`, Object.keys(part));

        if (part.inlineData && part.inlineData.data) {
          generatedImageBase64 = part.inlineData.data;
          console.log('✅ [이미지 발견] Base64 길이:', generatedImageBase64.length);
          break;
        }
      }
    } else {
      console.error('❌ [Candidates 없음]');
    }

    if (!generatedImageBase64) {
      console.error('❌ [이미지 추출 실패] 전체 응답:', JSON.stringify(result, null, 2));
      throw new Error('이미지 생성에 실패했습니다. Gemini 응답에 이미지가 없습니다.');
    }

    // Supabase Storage에 이미지 업로드
    const fileName = `generated/${projectId}/${scenarioId}_${Date.now()}.png`;
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');

    console.log('💾 [Storage 업로드 시작]');
    console.log('파일명:', fileName);
    console.log('파일 크기:', imageBuffer.length, 'bytes');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [업로드 실패]:', uploadError);
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
    }

    console.log('✅ [업로드 성공]:', uploadData);

    // Public URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(fileName);

    console.log('🔗 [Public URL]:', publicUrl);

    // 기존 이미지 배열 가져오기
    const { data: scenarioData } = await supabase
      .from('scenarios')
      .select('generated_image_urls')
      .eq('id', scenarioId)
      .single();

    const existingImages = scenarioData?.generated_image_urls || [];

    // scenarios 테이블에 이미지 URL 추가
    console.log('💾 [DB 업데이트 시작] Scenario ID:', scenarioId);
    console.log('📸 [기존 이미지 개수]:', existingImages.length);

    const { error: updateError } = await supabase
      .from('scenarios')
      .update({
        generated_image_urls: [...existingImages, publicUrl],
        selected_image_url: publicUrl,  // 새로 생성된 이미지를 선택된 이미지로 설정
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId);

    if (updateError) {
      console.error('❌ [DB 업데이트 실패]:', updateError);
    } else {
      console.log('✅ [DB 업데이트 성공]');
      console.log('📸 [총 이미지 개수]:', existingImages.length + 1);
    }

    console.log('🎉 [API 완료] 성공!');

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      allImages: [...existingImages, publicUrl],
      message: '이미지가 성공적으로 생성되었습니다.',
    });
  } catch (error) {
    console.error('💥 [API 에러 발생]');
    console.error('에러 타입:', error instanceof Error ? 'Error' : typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('에러 스택:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '이미지 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
