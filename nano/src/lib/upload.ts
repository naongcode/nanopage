import { supabase } from './supabase';

export async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    urls.push(publicUrlData.publicUrl);
  }

  return urls;
}
