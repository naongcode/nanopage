import { supabase } from './supabase';

export async function uploadImages(files: File[], projectId?: string): Promise<string[]> {
  const folder = projectId || crypto.randomUUID();
  const urls: string[] = [];

  for (const file of files) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const filePath = `${folder}/uploads/${timestamp}-${randomString}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    urls.push(publicUrlData.publicUrl);
  }

  return urls;
}
