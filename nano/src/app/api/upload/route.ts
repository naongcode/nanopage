import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    if (images.length === 0) {
      return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
    }

    if (images.length > 5) {
      return NextResponse.json({ error: '최대 5장까지 업로드할 수 있습니다.' }, { status: 400 });
    }

    const folder = formData.get('projectId') as string || crypto.randomUUID();
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 고유한 파일명 생성
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = image.name.split('.').pop();
      const filePath = `${folder}/uploads/${timestamp}-${randomString}.${fileExtension}`;

      // Supabase Storage에 업로드
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`이미지 업로드 실패: ${error.message}`);
      }

      // 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return NextResponse.json({
      urls: uploadedUrls,
      message: `${uploadedUrls.length}개의 이미지가 업로드되었습니다.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
