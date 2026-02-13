-- Storage product-images 버킷에 대한 DELETE 권한 추가
CREATE POLICY "Allow public delete" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'product-images');
