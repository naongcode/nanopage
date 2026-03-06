'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Scenario, Project } from '@/types';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('id');

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [editedImageType, setEditedImageType] = useState<string>('');
  const [editedRole, setEditedRole] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [regeneratingScenarioId, setRegeneratingScenarioId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });

  useEffect(() => {
    if (!projectId) {
      setError('프로젝트 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    // 임시로 로컬 스토리지에서 시나리오를 가져오거나
    // 실제로는 GET /api/projects/{id} API를 호출해야 함
    fetchScenarios(projectId);
  }, [projectId]);

  const fetchScenarios = async (id: string) => {
    try {
      // Supabase에서 데이터 가져오기
      const response = await fetch(`/api/projects/${id}`);

      if (!response.ok) {
        // localStorage fallback 시도
        const cachedData = localStorage.getItem(`project_${id}`);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setScenarios(data.scenarios);
          return;
        }
        throw new Error('프로젝트를 찾을 수 없습니다.');
      }

      const data = await response.json();
      setScenarios(data.scenarios || []);
      setProject(data.project);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : '시나리오를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateScenario = async (scenarioId: string, scenarioNo: number) => {
    if (!confirm(`${scenarioNo}번 시나리오를 재생성하시겠습니까?`)) {
      return;
    }

    setRegeneratingScenarioId(scenarioId);

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('시나리오 재생성에 실패했습니다.');
      }

      const result = await response.json();

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                prompt_text: result.scenario.prompt_text,
                user_edited_prompt_text: null,
              }
            : s
        )
      );

      alert('시나리오가 재생성되었습니다!');
    } catch (error) {
      alert(error instanceof Error ? error.message : '재생성 중 오류가 발생했습니다.');
    } finally {
      setRegeneratingScenarioId(null);
    }
  };

  const handleRegenerateImage = async (scenario: Scenario) => {
    if (!scenario.id) return;

    if (!confirm(`${scenario.scenario_no}번 시나리오의 새 이미지를 생성하시겠습니까? (기존 이미지는 유지됩니다)`)) {
      return;
    }

    setGeneratingImageId(scenario.id);
    const success = await generateSingleImage(scenario);
    setGeneratingImageId(null);

    if (!success) {
      alert(`${scenario.scenario_no}번 이미지 생성에 실패했습니다.`);
    }
  };

  const handleSelectImage = async (scenarioId: string, imageUrl: string) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/select-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('이미지 선택에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, selected_image_url: imageUrl }
            : s
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  const generateSingleImage = async (scenario: Scenario): Promise<boolean> => {
    if (!scenario.id) return false;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          projectId: projectId,
          promptText: scenario.user_edited_prompt_text || scenario.prompt_text,
          productImageUrls: project?.product_images || [],
          imageType: scenario.image_type,
          role: scenario.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이미지 생성 실패');
      }

      const result = await response.json();

      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenario.id
            ? {
                ...s,
                generated_image_urls: result.allImages || [result.imageUrl],
                selected_image_url: result.imageUrl,
              }
            : s
        )
      );

      return true;
    } catch (error) {
      console.error(`❌ [${scenario.scenario_no}번 이미지 생성 오류]:`, error);
      return false;
    }
  };

  const handleGenerateImage = async (scenario: Scenario) => {
    if (!scenario.id) return;

    if (!confirm(`${scenario.scenario_no}번 시나리오의 이미지를 생성하시겠습니까? (약 10-30초 소요)`)) {
      return;
    }

    setGeneratingImageId(scenario.id);
    const success = await generateSingleImage(scenario);
    setGeneratingImageId(null);

    if (!success) {
      alert(`${scenario.scenario_no}번 이미지 생성에 실패했습니다.`);
    }
  };

  const handleGenerateAllImages = async () => {
    const activeScenarios = scenarios.filter((s) => !s.deleted_at && !s.generated_image_urls?.length);

    if (activeScenarios.length === 0) {
      alert('생성할 이미지가 없습니다. (이미 모두 생성되었거나 삭제된 시나리오입니다)');
      return;
    }

    if (!confirm(`이미지가 없는 ${activeScenarios.length}개 시나리오의 이미지를 일괄 생성하시겠습니까?`)) {
      return;
    }

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: activeScenarios.length, success: 0, fail: 0 });

    let success = 0;
    let fail = 0;

    for (const scenario of activeScenarios) {
      setGeneratingImageId(scenario.id!);
      const result = await generateSingleImage(scenario);

      if (result) {
        success++;
      } else {
        fail++;
      }

      setBatchProgress({ current: success + fail, total: activeScenarios.length, success, fail });
    }

    setGeneratingImageId(null);
    setBatchGenerating(false);
    alert(`일괄 생성 완료!\n성공: ${success}개 / 실패: ${fail}개`);
  };


  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id || null);
    // user_edited_prompt_text가 있으면 그것을 사용, 없으면 원본 prompt_text 사용
    setEditedText(scenario.user_edited_prompt_text || scenario.prompt_text);
    setEditedImageType(scenario.image_type);
    setEditedRole(scenario.role);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedText('');
    setEditedImageType('');
    setEditedRole('');
  };

  const handleSaveEdit = async (scenarioId: string) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_type: editedImageType,
          role: editedRole,
          user_edited_prompt_text: editedText,
        }),
      });

      if (!response.ok) {
        throw new Error('수정 저장에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                image_type: editedImageType,
                role: editedRole,
                prompt_text: editedText,
                user_edited_prompt_text: editedText,
              }
            : s
        )
      );

      setEditingId(null);
      setEditedText('');
      setEditedImageType('');
      setEditedRole('');
      alert('수정이 저장되었습니다!');
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (scenarioId: string, scenarioNo: number) => {
    if (!confirm(`${scenarioNo}번 시나리오를 삭제하시겠습니까? (되돌릴 수 있습니다)`)) {
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      const result = await response.json();

      // 로컬 상태 업데이트 (deleted_at 설정)
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId ? { ...s, deleted_at: result.data.deleted_at } : s
        )
      );
      alert('삭제되었습니다! (삭제된 항목 보기로 되돌릴 수 있습니다)');
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRestore = async (scenarioId: string, scenarioNo: number) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('복원에 실패했습니다.');
      }

      // 로컬 상태 업데이트 (deleted_at을 null로)
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, deleted_at: null } : s))
      );
      alert(`${scenarioNo}번 시나리오가 복원되었습니다!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">시나리오를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-yellow-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 with 홈 버튼 */}
        <header className="mb-8">
          <div className="relative mb-3">
            <button
              onClick={() => router.push('/')}
              className="absolute left-0 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🏠 홈
            </button>
            <h1 className="text-4xl font-bold text-gray-900 text-center">
              생성 완료! 🎉
            </h1>
          </div>
          <p className="text-lg text-gray-600 text-center">
            15개의 촬영 시나리오가 준비되었습니다
          </p>
        </header>

        {/* 네비게이션 버튼들 */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/edit?id=${projectId}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ← 기본정보수정
          </button>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`font-semibold py-3 px-6 rounded-lg transition-colors ${
              showDeleted
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {showDeleted ? '🗑️ 삭제된 항목 숨기기' : '🗑️ 삭제된 항목 보기'}
          </button>
          <button
            onClick={handleGenerateAllImages}
            disabled={batchGenerating}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {batchGenerating
              ? `이미지 생성 중... (${batchProgress.current}/${batchProgress.total})`
              : '🎨 이미지 일괄 생성'}
          </button>
          {batchGenerating && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-48 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-green-600 font-medium">성공 {batchProgress.success}</span>
              {batchProgress.fail > 0 && (
                <span className="text-red-600 font-medium">실패 {batchProgress.fail}</span>
              )}
            </div>
          )}
          <button
            onClick={() => router.push(`/editor/${projectId}`)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>상세 편집하러가기</span>
            <span>→</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-16">No.</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-32">유형/역할</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-96">구체적 시나리오</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-64">생성된 이미지</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 w-24">작업</th>
                </tr>
              </thead>
              <tbody>
                {scenarios
                  .filter((s) => (showDeleted ? true : !s.deleted_at))
                  .map((scenario, index) => {
                    const isEditing = editingId === scenario.id;
                    const isDeleted = !!scenario.deleted_at;
                    return (
                      <tr
                        key={scenario.id || index}
                        className={`${
                          isDeleted
                            ? 'bg-red-50 opacity-60'
                            : index % 2 === 0
                            ? 'bg-gray-50'
                            : 'bg-white'
                        }`}
                      >
                      <td className="px-4 py-4 text-sm text-gray-900 font-semibold text-center">
                        {scenario.scenario_no}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        {isEditing && !isDeleted ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editedImageType}
                              onChange={(e) => setEditedImageType(e.target.value)}
                              placeholder="이미지 유형"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-xs"
                            />
                            <input
                              type="text"
                              value={editedRole}
                              onChange={(e) => setEditedRole(e.target.value)}
                              placeholder="역할"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div>
                              <span className={`inline-block px-3 py-1 rounded-full font-medium text-sm ${
                                isDeleted ? 'bg-gray-200 text-gray-500 line-through' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {scenario.image_type}
                              </span>
                            </div>
                            <div className={`text-sm text-gray-700 font-medium ${isDeleted ? 'line-through text-gray-500' : ''}`}>
                              {scenario.role}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {isEditing && !isDeleted ? (
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            rows={8}
                          />
                        ) : (
                          <div className={isDeleted ? 'line-through text-gray-500' : 'space-y-1'}>
                            {(scenario.user_edited_prompt_text || scenario.prompt_text).split('\n').map((line, i) => {
                              const trimmedLine = line.trim();
                              if (!trimmedLine) return null;

                              if (trimmedLine.includes(':')) {
                                const colonIndex = trimmedLine.indexOf(':');
                                const label = trimmedLine.substring(0, colonIndex);
                                const value = trimmedLine.substring(colonIndex + 1).trim();

                                return (
                                  <div key={i} className="flex">
                                    <span className="font-semibold text-gray-800 min-w-15">{label}:</span>
                                    <span className="ml-1 text-gray-700">{value}</span>
                                  </div>
                                );
                              }

                              return (
                                <div key={i} className="text-gray-700">
                                  {trimmedLine}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        {scenario.selected_image_url || (scenario.generated_image_urls && scenario.generated_image_urls.length > 0) ? (
                          <div className="space-y-2">
                            {/* 선택된 메인 이미지 */}
                            <a
                              href={scenario.selected_image_url || scenario.generated_image_urls?.[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={scenario.selected_image_url || scenario.generated_image_urls?.[0]}
                                alt={`Selected for scenario ${scenario.scenario_no}`}
                                className="w-48 h-48 object-cover rounded-lg border-2 border-green-300 hover:border-green-500 transition-colors shadow-md mx-auto"
                              />
                            </a>

                            {/* 이미지 갤러리 (여러 개 있을 때) */}
                            {scenario.generated_image_urls && scenario.generated_image_urls.length > 1 && (
                              <div className="flex gap-2 justify-center flex-wrap">
                                {scenario.generated_image_urls.map((imgUrl, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectImage(scenario.id!, imgUrl)}
                                    className={`relative ${
                                      imgUrl === scenario.selected_image_url
                                        ? 'ring-4 ring-blue-500'
                                        : 'ring-1 ring-gray-300 hover:ring-2 hover:ring-blue-300'
                                    } rounded-lg transition-all`}
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`Option ${idx + 1}`}
                                      className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    {imgUrl === scenario.selected_image_url && (
                                      <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                        ✓
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateImage(scenario)}
                            disabled={generatingImageId === scenario.id || isDeleted}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-xs font-semibold transition-colors"
                          >
                            {generatingImageId === scenario.id ? '생성 중...' : '🎨 이미지 생성'}
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-4 text-sm text-center">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(scenario.id!, scenario.scenario_no)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                          >
                            ↩️ 복원
                          </button>
                        ) : isEditing ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleSaveEdit(scenario.id!)}
                              className="w-full bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              💾 저장
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              ✕ 취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleEdit(scenario)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              ✏️<br/>시나리오 수정
                            </button>
                            <button
                              onClick={() => handleRegenerateScenario(scenario.id!, scenario.scenario_no)}
                              disabled={regeneratingScenarioId === scenario.id}
                              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              {regeneratingScenarioId === scenario.id ? '⏳...' : <span>🔄<br/>시나리오 재생성</span>}
                            </button>
                            <button
                              onClick={() => handleRegenerateImage(scenario)}
                              disabled={generatingImageId === scenario.id}
                              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              {generatingImageId === scenario.id ? '⏳...' : <span>🖼️<br/>이미지 재생성</span>}
                            </button>
                            <button
                              onClick={() => handleDelete(scenario.id!, scenario.scenario_no)}
                              className="w-full bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              🗑️<br/>블록삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">로딩 중...</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
