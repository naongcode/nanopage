-- Supabase Storage 버킷 생성 및 설정

-- 1. product-images 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 모든 사용자가 이미지를 업로드할 수 있도록 정책 설정
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 3. 모든 사용자가 이미지를 조회할 수 있도록 정책 설정
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 4. projects 테이블에 product_images 컬럼 추가 (JSON 배열로 여러 이미지 URL 저장)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]'::jsonb;
