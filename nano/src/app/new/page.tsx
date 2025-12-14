'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateProjectRequest } from '@/types';
import { FIELD_OPTIONS } from '@/lib/field-options';
import FieldOptions from '@/components/FieldOptions';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isPresetPanelOpen, setIsPresetPanelOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    category: '',
    differentiation_concept: '',
    target_customer: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + productImages.length > 3) {
      alert('최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    setProductImages((prev) => [...prev, ...files]);

    // 이미지 미리보기 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. 이미지가 있으면 먼저 업로드
      let imageUrls: string[] = [];
      if (productImages.length > 0) {
        const uploadFormData = new FormData();
        productImages.forEach((file) => {
          uploadFormData.append('images', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const uploadData = await uploadResponse.json();
        imageUrls = uploadData.urls;
      }

      // 2. 프로젝트 데이터와 이미지 URL 함께 전송
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          product_images: imageUrls,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '시나리오 생성에 실패했습니다.');
      }

      const data = await response.json();
      // 임시로 로컬 스토리지에 저장
      localStorage.setItem(`project_${data.project_id}`, JSON.stringify(data));
      router.push(`/result?id=${data.project_id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-12 px-4 relative">
      {/* 좌측 프리셋 버튼 */}
      <button
        onClick={() => setIsPresetPanelOpen(!isPresetPanelOpen)}
        className="fixed left-4 top-1/2 -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-r-lg shadow-lg transition-all z-40 flex items-center gap-2"
      >
        <span className="text-xl">📋</span>
        <span className="text-sm">프리셋</span>
      </button>

      {/* 프리셋 사이드 패널 */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transition-transform duration-300 overflow-y-auto ${
          isPresetPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📋 프리셋</h2>
            <button
              onClick={() => setIsPresetPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 차별화 컨셉 프리셋 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
              차별화 컨셉 (피하고 싶은 이미지)
            </h3>
            <FieldOptions
              options={FIELD_OPTIONS.differentiation_concept}
              onSelect={(value) => setFormData(prev => ({ ...prev, differentiation_concept: value }))}
              currentValue={formData.differentiation_concept}
            />
          </div>

          {/* 타겟 고객 프리셋 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
              타겟 고객
            </h3>
            {/* 성별 선택 */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">성별</p>
              <div className="flex flex-wrap gap-2">
                {['남성', '여성', '혼성'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => {
                      const currentText = formData.target_customer;
                      const genderText = `${gender} 타겟`;
                      const hasGender = currentText.includes('남성') || currentText.includes('여성') || currentText.includes('혼성');
                      if (hasGender) {
                        const newText = currentText.replace(/남성 타겟|여성 타겟|혼성 타겟/g, genderText);
                        setFormData(prev => ({ ...prev, target_customer: newText }));
                      } else {
                        const newText = currentText ? `${genderText}, ${currentText}` : genderText;
                        setFormData(prev => ({ ...prev, target_customer: newText }));
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all ${
                      formData.target_customer.includes(gender)
                        ? 'bg-yellow-400 border-yellow-500 text-gray-900 font-semibold'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
            <FieldOptions
              options={FIELD_OPTIONS.target_customer}
              onSelect={(value) => setFormData(prev => ({ ...prev, target_customer: value }))}
              currentValue={formData.target_customer}
            />
          </div>
        </div>
      </div>

      {/* 오버레이 */}
      {isPresetPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsPresetPanelOpen(false)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            나노바나나 🍌
          </h1>
          <p className="text-lg text-gray-600">
            제품 기본 정보만 입력하면 AI가 마케팅 컨셉과 촬영 시나리오를 자동 생성
          </p>

          {/* 네비게이션 */}
          <div className="flex gap-3 justify-center mt-6">
            <a
              href="/"
              className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition-colors"
            >
              📁 프로젝트 목록
            </a>
            <a
              href="/setup"
              className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition-colors"
            >
              ⚙️ 설정
            </a>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">

          {/* 제품 기본 정보 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-yellow-400">
              🛍️ 제품 기본 정보
            </h2>
            <div className="space-y-5">
              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제품 이미지 (선택사항, 최대 3장)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-yellow-50 file:text-yellow-700
                      hover:file:bg-yellow-100"
                  />
                  {imagePreviewUrls.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    💡 제품 이미지를 업로드하면 나중에 AI 분석에 활용됩니다
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제품명 *
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  required
                  placeholder="예: 프리미엄 무선 소음 차단 이어폰"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리 *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="예: 전자제품/음향기기"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  차별화 컨셉 (피하고 싶은 이미지) *
                </label>
                <textarea
                  name="differentiation_concept"
                  value={formData.differentiation_concept}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="예: 화려한 색상, 과격한 스포츠 활동 강조"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 경쟁사가 사용하는 이미지나 컨셉을 입력하면, 차별화된 시나리오를 생성합니다 (좌측 프리셋 버튼 활용)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  타겟 고객 *
                </label>
                <textarea
                  name="target_customer"
                  value={formData.target_customer}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="예: 조용한 환경에서 집중을 원하는 20~30대 직장인/학생"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 좌측 프리셋 버튼을 눌러 빠르게 입력하세요
                </p>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
          >
            {isLoading ? 'AI가 마케팅 컨셉과 시나리오를 생성하는 중...' : '마케팅 컨셉 자동 생성 + 15개 시나리오 생성 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
