'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FIELD_OPTIONS } from '@/lib/field-options';
import { uploadImages } from '@/lib/upload';
import FieldOptions from '@/components/FieldOptions';

type ConceptCategory = 'food' | 'beauty' | 'lifestyle' | 'tech' | 'fashion' | 'health' | 'baby' | 'pet' | 'home' | 'travel';

const CONCEPT_CATEGORIES: { id: ConceptCategory; label: string; emoji: string }[] = [
  { id: 'food', label: '식품', emoji: '🥗' },
  { id: 'beauty', label: '뷰티', emoji: '💄' },
  { id: 'fashion', label: '패션', emoji: '👗' },
  { id: 'lifestyle', label: '라이프', emoji: '🌿' },
  { id: 'tech', label: '테크', emoji: '💻' },
  { id: 'health', label: '건강', emoji: '💪' },
  { id: 'baby', label: '육아', emoji: '👶' },
  { id: 'pet', label: '반려동물', emoji: '🐶' },
  { id: 'home', label: '홈', emoji: '🏠' },
  { id: 'travel', label: '여행', emoji: '✈️' },
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedConceptCategory, setSelectedConceptCategory] = useState<ConceptCategory>('food');
  const [formData, setFormData] = useState({
    project_name: '',
    category: '',
    differentiation_concept: '',
    target_customer: '',
    shooting_concept: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + productImages.length > 5) {
      alert('최대 5장까지 업로드할 수 있습니다.');
      return;
    }

    setProductImages((prev) => [...prev, ...files]);

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

  const appendToField = (field: string, value: string) => {
    setFormData((prev) => {
      const current = prev[field as keyof typeof prev];
      const values = current.split(',').map(v => v.trim()).filter(v => v.length > 0);
      const index = values.indexOf(value);
      if (index !== -1) {
        values.splice(index, 1);
      } else {
        values.push(value);
      }
      return { ...prev, [field]: values.join(', ') };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep('프로젝트 생성 중...');
    setWarnings([]);

    try {
      // 1. 프로젝트 먼저 생성 (기본 정보만)
      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.error || '프로젝트 생성 실패');
      }

      const { id: projectId } = await createResponse.json();

      // 2. 이미지 업로드 (프로젝트 ID로 바로 올바른 경로에 저장 + DB 반영)
      if (productImages.length > 0) {
        setLoadingStep('이미지 업로드 중...');
        const imageUrls = await uploadImages(productImages, projectId);

        await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_images: imageUrls }),
        });
      }

      // 3. AI 시나리오 생성 (스트리밍)
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
      });

      if (!response.body) {
        throw new Error('스트리밍 응답을 받지 못했습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'progress') {
                setLoadingStep(data.step);
              } else if (data.type === 'warning') {
                setWarnings(prev => [...prev, data.message]);
              } else if (data.type === 'complete') {
                result = data.data;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }

      if (result) {
        localStorage.setItem(`project_${result.project_id}`, JSON.stringify(result));
        router.push(`/result?id=${result.project_id}`);
      } else {
        throw new Error('시나리오 생성 결과를 받지 못했습니다.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            나노바나나 🍌
          </h1>
          <p className="text-lg text-gray-600">
            제품 기본 정보만 입력하면 AI가 마케팅 컨셉과 촬영 시나리오를 자동 생성
          </p>

          <div className="flex gap-3 justify-center mt-6">
            <a
              href="/"
              className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition-colors"
            >
              📁 프로젝트 목록
            </a>
          </div>
        </header>

        {/* 2컬럼 레이아웃 */}
        <div className="flex gap-6">
          {/* 좌측: 입력 폼 */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-yellow-400">
                  🛍️ 제품 기본 정보
                </h2>
                <div className="space-y-5">
                  {/* 이미지 업로드 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      제품 이미지 (선택사항, 최대 5장)
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
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      촬영 컨셉 (보여주고 싶은 장면)
                    </label>
                    <textarea
                      name="shooting_concept"
                      value={formData.shooting_concept}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 농장 수확, 포장 공정, 가족 식사 장면"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      💡 우측 프리셋에서 장면을 클릭하면 자동으로 추가됩니다
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      피하고 싶은 이미지
                    </label>
                    <textarea
                      name="differentiation_concept"
                      value={formData.differentiation_concept}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 화려한 색상, 과격한 스포츠 활동 강조"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              {isLoading && warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.map((warning, i) => (
                    <div key={i} className="bg-orange-50 border border-orange-300 text-orange-800 text-sm px-4 py-2 rounded-lg">
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {isLoading ? (loadingStep || '준비 중...') : '마케팅 컨셉 자동 생성 + 15개 시나리오 생성 🚀'}
              </button>
            </form>
          </div>

          {/* 우측: 프리셋 패널 (sticky) */}
          <div className="flex-1">
            <div className="sticky top-8 space-y-4">
              {/* 타겟 고객 프리셋 */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
                  👥 타겟 고객
                </h3>

                {/* 성별 선택 */}
                <div className="mb-3">
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

              {/* 촬영 컨셉 프리셋 */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
                  🎬 촬영 컨셉
                </h3>

                {/* 카테고리 탭 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {CONCEPT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedConceptCategory(cat.id)}
                      className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                        selectedConceptCategory === cat.id
                          ? 'bg-yellow-400 text-gray-900 font-semibold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* 선택된 카테고리 옵션 */}
                <div className="flex flex-wrap gap-2">
                  {FIELD_OPTIONS.shooting_concept[selectedConceptCategory].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => appendToField('shooting_concept', option.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        formData.shooting_concept.includes(option.value)
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 피하고 싶은 이미지 프리셋 */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
                  🚫 피하고 싶은 이미지
                </h3>
                <FieldOptions
                  options={FIELD_OPTIONS.differentiation_concept}
                  onSelect={(value) => setFormData(prev => ({ ...prev, differentiation_concept: value }))}
                  currentValue={formData.differentiation_concept}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
