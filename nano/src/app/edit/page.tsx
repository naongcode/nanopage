'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project } from '@/types';
import { FIELD_OPTIONS } from '@/lib/field-options';
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

function EditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [selectedConceptCategory, setSelectedConceptCategory] = useState<ConceptCategory>('food');
  const [formData, setFormData] = useState<Partial<Project> & { shooting_concept?: string }>({
    project_name: '',
    category: '',
    differentiation_concept: '',
    target_customer: '',
    shooting_concept: '',
    selling_point_1: '',
    selling_point_2: '',
    selling_point_3: '',
    visual_concept: '',
    tone_and_manner: '',
    required_scene_1: '',
    required_scene_2: '',
    forbidden_element: '',
  });

  useEffect(() => {
    if (!projectId) {
      setError('프로젝트 ID가 없습니다.');
      setIsFetching(false);
      return;
    }

    fetchProject(projectId);
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`);

      if (!response.ok) {
        throw new Error('프로젝트를 불러올 수 없습니다.');
      }

      const data = await response.json();
      const project = data.project;

      setFormData({
        project_name: project.project_name || '',
        category: project.category || '',
        differentiation_concept: project.differentiation_concept || '',
        target_customer: project.target_customer || '',
        shooting_concept: project.shooting_concept || '',
        selling_point_1: project.selling_point_1 || '',
        selling_point_2: project.selling_point_2 || '',
        selling_point_3: project.selling_point_3 || '',
        visual_concept: project.visual_concept || '',
        tone_and_manner: project.tone_and_manner || '',
        required_scene_1: project.required_scene_1 || '',
        required_scene_2: project.required_scene_2 || '',
        forbidden_element: project.forbidden_element || '',
      });

      if (project.product_images && Array.isArray(project.product_images)) {
        setExistingImageUrls(project.product_images);
      }

      setIsFetching(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : '프로젝트를 불러오는 중 오류가 발생했습니다.');
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImageUrls.length + productImages.length + files.length;

    if (totalImages > 3) {
      alert('최대 3장까지 업로드할 수 있습니다.');
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

  const removeNewImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const appendToField = (field: string, value: string) => {
    setFormData((prev) => {
      const current = (prev as Record<string, string>)[field] || '';
      if (current.includes(value)) return prev;
      const newValue = current ? `${current}, ${value}` : value;
      return { ...prev, [field]: newValue };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let newImageUrls: string[] = [];
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
        newImageUrls = uploadData.urls;
      }

      const allImageUrls = [...existingImageUrls, ...newImageUrls];

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          product_images: allImageUrls,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로젝트 수정에 실패했습니다.');
      }

      alert('프로젝트가 수정되었습니다!');
      router.push(`/result?id=${projectId}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg"
          >
            프로젝트 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            프로젝트 수정 ✏️
          </h1>
          <p className="text-lg text-gray-600">
            프로젝트 정보를 수정하세요
          </p>

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition-colors"
            >
              📁 프로젝트 목록
            </button>
            <button
              onClick={() => router.push(`/result?id=${projectId}`)}
              className="inline-block bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition-colors"
            >
              👁️ 결과 보기
            </button>
          </div>
        </header>

        {/* 2컬럼 레이아웃 */}
        <div className="flex gap-6">
          {/* 좌측: 입력 폼 */}
          <div className="flex-1">
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
                      {existingImageUrls.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">기존 이미지:</p>
                          <div className="flex gap-3 flex-wrap mb-3">
                            {existingImageUrls.map((url, index) => (
                              <div key={`existing-${index}`} className="relative">
                                <img
                                  src={url}
                                  alt={`Existing ${index + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {existingImageUrls.length + productImages.length < 3 && (
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
                      )}

                      {imagePreviewUrls.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2">새로 추가할 이미지:</p>
                          <div className="flex gap-3 flex-wrap">
                            {imagePreviewUrls.map((url, index) => (
                              <div key={`new-${index}`} className="relative">
                                <img
                                  src={url}
                                  alt={`New ${index + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-green-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

              {/* AI가 생성한 마케팅 컨셉 (수정 가능) */}
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-green-400">
                  🤖 AI 생성 마케팅 컨셉 (수정 가능)
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      핵심 셀링 포인트 1
                    </label>
                    <input
                      type="text"
                      name="selling_point_1"
                      value={formData.selling_point_1}
                      onChange={handleChange}
                      placeholder="예: 탁월한 소음 차단 기능"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      핵심 셀링 포인트 2
                    </label>
                    <input
                      type="text"
                      name="selling_point_2"
                      value={formData.selling_point_2}
                      onChange={handleChange}
                      placeholder="예: 하루 종일 사용 가능한 배터리"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      핵심 셀링 포인트 3
                    </label>
                    <input
                      type="text"
                      name="selling_point_3"
                      value={formData.selling_point_3}
                      onChange={handleChange}
                      placeholder="예: 착용감이 편안한 인체공학적 디자인"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      주요 시각적 컨셉
                    </label>
                    <textarea
                      name="visual_concept"
                      value={formData.visual_concept}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 고급스러운 사무 공간 / 자연광 홈카페"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      톤앤매너/색상
                    </label>
                    <textarea
                      name="tone_and_manner"
                      value={formData.tone_and_manner}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 차분한 뉴트럴 톤 (화이트, 베이지, 라이트 그레이)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      필수 연출 상황 1
                    </label>
                    <textarea
                      name="required_scene_1"
                      value={formData.required_scene_1}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 카페에서 노트북 작업을 하며 이어폰을 착용한 모습"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      필수 연출 상황 2
                    </label>
                    <textarea
                      name="required_scene_2"
                      value={formData.required_scene_2}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 출퇴근 지하철에서 편안하게 음악을 듣는 모습"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      금지 요소
                    </label>
                    <textarea
                      name="forbidden_element"
                      value={formData.forbidden_element}
                      onChange={handleChange}
                      rows={2}
                      placeholder="예: 밝은 네온 색상, 파티 분위기"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/result?id=${projectId}`)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  {isLoading ? '수정 중...' : '프로젝트 수정 완료 ✅'}
                </button>
              </div>
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

                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">성별</p>
                  <div className="flex flex-wrap gap-2">
                    {['남성', '여성', '혼성'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => {
                          const currentText = formData.target_customer || '';
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
                          (formData.target_customer || '').includes(gender)
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
                  onSelect={(value) => appendToField('target_customer', value)}
                  currentValue={formData.target_customer || ''}
                />
              </div>

              {/* 촬영 컨셉 프리셋 */}
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-yellow-400">
                  🎬 촬영 컨셉
                </h3>

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

                <div className="flex flex-wrap gap-2">
                  {FIELD_OPTIONS.shooting_concept[selectedConceptCategory].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => appendToField('shooting_concept', option.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        (formData.shooting_concept || '').includes(option.value)
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
                  onSelect={(value) => appendToField('differentiation_concept', value)}
                  currentValue={formData.differentiation_concept || ''}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">로딩 중...</p>
          </div>
        </div>
      }
    >
      <EditContent />
    </Suspense>
  );
}
