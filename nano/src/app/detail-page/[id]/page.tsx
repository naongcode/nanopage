'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scenario, Project, CommonBlockSettings, ImageCrop } from '@/types';
import { DEFAULT_COMMON_SETTINGS } from '@/lib/block-settings-defaults';
import { CommonSettingsPanel } from '@/components/CommonSettingsPanel';
import { BlockStyleOverridePanel } from '@/components/BlockStyleOverridePanel';
import { ImageWithCrop } from '@/components/ImageWithCrop';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Rnd } from 'react-rnd';

// 왼쪽 네비게이션 - 드래그 가능한 섬네일
function SortableThumbnail({
  scenario,
  index,
  onToggleDragMode,
}: {
  scenario: Scenario;
  index: number;
  onToggleDragMode: (scenarioId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scenario.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasDragMode = scenario.text_position_y !== null && scenario.text_position_y !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 p-2 cursor-grab active:cursor-grabbing"
      >
        {/* 순서 번호 */}
        <div className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>

        {/* 섬네일 이미지 */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
          <img
            src={scenario.selected_image_url || ''}
            alt={`시나리오 ${scenario.scenario_no}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 드래그 아이콘 */}
        <div className="ml-auto flex-shrink-0 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      {/* 드래그 모드 토글 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDragMode(scenario.id!);
        }}
        className={`w-full px-2 py-1 text-xs border-t ${
          hasDragMode
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-gray-50 text-gray-600 border-gray-200'
        } hover:bg-opacity-80 transition`}
      >
        {hasDragMode ? '✓ 드래그 모드' : '드래그 모드'}
      </button>
    </div>
  );
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<'coupang' | 'naver' | 'minimal'>('coupang');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [commonSettings, setCommonSettings] = useState<CommonBlockSettings>(DEFAULT_COMMON_SETTINGS);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const detailPageRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  // 프로젝트 로드 시 공통 설정도 로드
  useEffect(() => {
    if (project?.common_block_settings) {
      setCommonSettings(project.common_block_settings);
    }
  }, [project]);

  // 스타일 병합 헬퍼 (공통 설정 + 개별 override)
  const getEffectiveStyle = (scenario: Scenario): CommonBlockSettings => {
    return { ...commonSettings, ...(scenario.block_style || {}) };
  };

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('프로젝트를 불러올 수 없습니다.');

      const data = await response.json();
      setProject(data.project);

      // 이미지가 있는 시나리오만 필터링 (생성된 이미지가 있는 것만)
      const scenariosWithImages = data.scenarios
        .filter((s: Scenario) => s.selected_image_url)
        .sort((a: Scenario, b: Scenario) => a.scenario_no - b.scenario_no);

      setScenarios(scenariosWithImages);
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('프로젝트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setScenarios((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDescriptionEdit = async (scenarioId: string, newDescription: string) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_description_text: newDescription,
        }),
      });

      if (!response.ok) throw new Error('설명글 저장 실패');

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, user_edited_description_text: newDescription }
            : s
        )
      );

      setEditingScenarioId(null);
    } catch (error) {
      console.error('Error saving description:', error);
      alert('설명글 저장에 실패했습니다.');
    }
  };

  const downloadAsImage = async (format: 'png' | 'jpg') => {
    try {
      // html-to-image 동적 import
      const { toPng, toJpeg } = await import('html-to-image');

      // 모든 download-content 요소를 찾아서 하나의 컨테이너로 합치기
      const contentElements = document.querySelectorAll('.download-content');
      if (contentElements.length === 0) {
        alert('다운로드할 콘텐츠가 없습니다.');
        return;
      }

      // 임시 컨테이너 생성
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);

      // 모든 콘텐츠를 복사해서 임시 컨테이너에 추가
      contentElements.forEach((element) => {
        const clone = element.cloneNode(true) as HTMLElement;
        tempContainer.appendChild(clone);
      });

      const dataUrl = format === 'png'
        ? await toPng(tempContainer, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            filter: (node) => {
              // no-download 클래스를 가진 요소 제외
              if (node.classList && node.classList.contains('no-download')) {
                return false;
              }
              return true;
            },
          })
        : await toJpeg(tempContainer, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            quality: 0.95,
            filter: (node) => {
              if (node.classList && node.classList.contains('no-download')) {
                return false;
              }
              return true;
            },
          });

      // 임시 컨테이너 제거
      document.body.removeChild(tempContainer);

      // 다운로드
      const link = document.createElement('a');
      link.download = `${project?.project_name || 'detail-page'}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  const getDisplayDescription = (scenario: Scenario) => {
    return scenario.user_edited_description_text || scenario.description_text || '';
  };

  const handleToggleDragMode = async (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const hasDragMode = scenario.text_position_y !== null && scenario.text_position_y !== undefined;

    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_position_x: hasDragMode ? 0 : 0,
          text_position_y: hasDragMode ? null : 100,
          text_width: hasDragMode ? null : 400,
          text_height: hasDragMode ? null : 150,
        }),
      });

      if (!response.ok) throw new Error('드래그 모드 전환 실패');

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                text_position_x: hasDragMode ? 0 : 0,
                text_position_y: hasDragMode ? null : 100,
                text_width: hasDragMode ? null : 400,
                text_height: hasDragMode ? null : 150,
              }
            : s
        )
      );
    } catch (error) {
      console.error('Error toggling drag mode:', error);
      alert('드래그 모드 전환에 실패했습니다.');
    }
  };

  const handleTextPositionChange = async (
    scenarioId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text_position_x: Math.round(x),
          text_position_y: Math.round(y),
          text_width: Math.round(width),
          text_height: Math.round(height),
        }),
      });

      if (!response.ok) throw new Error('위치 저장 실패');

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                text_position_x: Math.round(x),
                text_position_y: Math.round(y),
                text_width: Math.round(width),
                text_height: Math.round(height),
              }
            : s
        )
      );
    } catch (error) {
      console.error('Error saving text position:', error);
    }
  };

  const handleCropSave = async (scenarioId: string, crop: ImageCrop) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_crop: crop }),
      });

      if (!response.ok) throw new Error('이미지 자르기 저장 실패');

      // 로컬 상태 업데이트
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, image_crop: crop } : s))
      );
    } catch (error) {
      console.error('Error saving image crop:', error);
      alert('이미지 자르기 저장에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!project || scenarios.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">생성된 이미지가 없습니다.</div>
        <button
          onClick={() => router.push(`/result?id=${projectId}`)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          결과 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* 헤더 & 컨트롤 */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{project.project_name} - 상세페이지</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← 뒤로
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* 템플릿 선택 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">템플릿:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="coupang">쿠팡 스타일</option>
                <option value="naver">네이버 스마트스토어</option>
                <option value="minimal">미니멀</option>
              </select>
            </div>

            {/* 다운로드 버튼 */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => downloadAsImage('png')}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
              >
                PNG 다운로드
              </button>
              <button
                onClick={() => downloadAsImage('jpg')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                JPG 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 공통 설정 패널 */}
      <div className="max-w-4xl mx-auto px-4">
        <CommonSettingsPanel
          projectId={projectId}
          settings={commonSettings}
          onSettingsChange={setCommonSettings}
        />
      </div>

      {/* 상세페이지 편집 영역 */}
      <div className="max-w-7xl mx-auto px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6">
            {/* 왼쪽: 네비게이션 (드래그 가능한 섬네일) */}
            <div className="w-40 flex-shrink-0 sticky top-4 h-fit">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">순서 편집</h3>
                <div className="space-y-2">
                  <SortableContext
                    items={scenarios.map((s) => s.id!)}
                    strategy={verticalListSortingStrategy}
                  >
                    {scenarios.map((scenario, index) => (
                      <SortableThumbnail
                        key={scenario.id}
                        scenario={scenario}
                        index={index}
                        onToggleDragMode={handleToggleDragMode}
                      />
                    ))}
                  </SortableContext>
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  💡 블록을 드래그해서 순서를 변경하세요
                </div>
              </div>
            </div>

            {/* 가운데: 간단한 아이콘 컨트롤 */}
            <div className="w-16 flex-shrink-0 space-y-8">
              {scenarios.map((scenario, index) => {
                const isEditingCrop = editingCropId === scenario.id;
                const isEditingStyle = editingStyleId === scenario.id;

                return (
                  <div key={`control-${scenario.id}`} className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-2 sticky top-4">
                    <div className="text-xs font-bold text-gray-500 text-center">{index + 1}</div>

                    {/* 이미지 자르기 버튼 */}
                    <button
                      onClick={() => setEditingCropId(isEditingCrop ? null : scenario.id!)}
                      className={`w-full p-2 text-xl rounded transition ${
                        isEditingCrop
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                      }`}
                      title="이미지 자르기"
                    >
                      ✂️
                    </button>

                    {/* 스타일 편집 버튼 */}
                    <button
                      onClick={() => setEditingStyleId(isEditingStyle ? null : scenario.id!)}
                      className={`w-full p-2 text-xl rounded transition ${
                        isEditingStyle
                          ? 'bg-purple-50 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                      title="스타일 편집"
                    >
                      ✏️
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 오른쪽: 상세페이지 미리보기 + 편집 패널 */}
            <div className="flex-1 min-w-0">
              <div className="space-y-8">
                {scenarios.map((scenario, index) => {
                  const hasCustomPosition = scenario.text_position_y !== null && scenario.text_position_y !== undefined;
                  const effectiveStyle = getEffectiveStyle(scenario);
                  const isEditingCrop = editingCropId === scenario.id;
                  const isEditingStyle = editingStyleId === scenario.id;

                  return (
                    <div key={scenario.id} className="flex gap-4 items-start">
                      {/* 블록 콘텐츠 (다운로드될 영역) */}
                      <div
                        className={`flex-1 download-content ${
                          selectedTemplate === 'coupang'
                            ? 'shadow-lg'
                            : selectedTemplate === 'naver'
                            ? 'border-2 border-gray-200'
                            : 'shadow-sm'
                        }`}
                      >
                        <div
                          className="relative mx-auto bg-white"
                          style={{
                            minHeight: hasCustomPosition ? '600px' : 'auto',
                            width: effectiveStyle.blockWidth,
                            backgroundColor: effectiveStyle.blockBackgroundColor,
                            padding: '20px',
                          }}
                        >
                      {/* 이미지 + Crop 기능 */}
                      <div className="w-full flex justify-center mb-4">
                        <div className="w-full">
                          {isEditingCrop ? (
                            <ImageWithCrop
                              imageUrl={scenario.selected_image_url || ''}
                              crop={scenario.image_crop || null}
                              isEditing={true}
                              onCropChange={(crop) => handleCropSave(scenario.id!, crop)}
                              onEditComplete={() => setEditingCropId(null)}
                            />
                          ) : (
                            <ImageWithCrop
                              imageUrl={scenario.selected_image_url || ''}
                              crop={scenario.image_crop || null}
                              isEditing={false}
                              onCropChange={() => {}}
                              onEditComplete={() => {}}
                            />
                          )}
                        </div>
                      </div>

                      {/* 설명글 - 드래그 가능 */}
                      {hasCustomPosition ? (
                        <Rnd
                          position={{
                            x: scenario.text_position_x || 0,
                            y: scenario.text_position_y || 0,
                          }}
                          size={{
                            width: scenario.text_width || 400,
                            height: scenario.text_height || 'auto',
                          }}
                          onDragStop={(e, d) => {
                            if (scenario.id) {
                              handleTextPositionChange(
                                scenario.id,
                                d.x,
                                d.y,
                                scenario.text_width || 400,
                                scenario.text_height || 100
                              );
                            }
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            if (scenario.id) {
                              handleTextPositionChange(
                                scenario.id,
                                position.x,
                                position.y,
                                parseInt(ref.style.width),
                                parseInt(ref.style.height)
                              );
                            }
                          }}
                          bounds="parent"
                          className="border-2 border-dashed border-blue-400"
                        >
                          <div
                            className="h-full p-4 bg-white/90 backdrop-blur-sm"
                            style={{
                              fontFamily: effectiveStyle.textFontFamily,
                              fontSize: `${effectiveStyle.textFontSize}px`,
                              color: effectiveStyle.textColor,
                              fontWeight: effectiveStyle.textFontWeight,
                              textAlign: effectiveStyle.textAlign,
                            }}
                          >
                            {editingScenarioId === scenario.id ? (
                              <textarea
                                defaultValue={getDisplayDescription(scenario)}
                                className="w-full h-full p-2 border rounded resize-none"
                                style={{
                                  fontFamily: effectiveStyle.textFontFamily,
                                  fontSize: `${effectiveStyle.textFontSize}px`,
                                  color: effectiveStyle.textColor,
                                  fontWeight: effectiveStyle.textFontWeight,
                                }}
                                onBlur={(e) => {
                                  if (scenario.id) {
                                    handleDescriptionEdit(scenario.id, e.target.value);
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <p
                                onClick={() => setEditingScenarioId(scenario.id || null)}
                                className="cursor-pointer whitespace-pre-line"
                              >
                                {getDisplayDescription(scenario) || '설명글을 입력하려면 클릭하세요'}
                              </p>
                            )}
                          </div>
                        </Rnd>
                      ) : (
                        <div className="p-4">
                          {editingScenarioId === scenario.id ? (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={getDisplayDescription(scenario)}
                                className="w-full p-3 border rounded-lg resize-none"
                                rows={3}
                                style={{
                                  fontFamily: effectiveStyle.textFontFamily,
                                  fontSize: `${effectiveStyle.textFontSize}px`,
                                  color: effectiveStyle.textColor,
                                  fontWeight: effectiveStyle.textFontWeight,
                                }}
                                onBlur={(e) => {
                                  if (scenario.id) {
                                    handleDescriptionEdit(scenario.id, e.target.value);
                                  }
                                }}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingScenarioId(null)}
                                  className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              onClick={() => setEditingScenarioId(scenario.id || null)}
                              className="cursor-pointer hover:bg-gray-100 p-2 rounded transition whitespace-pre-line"
                              style={{
                                fontFamily: effectiveStyle.textFontFamily,
                                fontSize: `${effectiveStyle.textFontSize}px`,
                                color: effectiveStyle.textColor,
                                fontWeight: effectiveStyle.textFontWeight,
                                textAlign: effectiveStyle.textAlign,
                              }}
                            >
                              {getDisplayDescription(scenario) || '설명글을 입력하려면 클릭하세요'}
                            </p>
                          )}
                        </div>
                      )}
                        </div>
                      </div>

                      {/* 편집 패널 (해당 블록 옆에 표시) */}
                      {isEditingStyle && (
                        <div className="w-80 flex-shrink-0 no-download">
                          <BlockStyleOverridePanel
                            scenarioId={scenario.id!}
                            blockStyle={scenario.block_style || null}
                            commonSettings={commonSettings}
                            onStyleChange={(newStyle) => {
                              setScenarios((prev) =>
                                prev.map((s) => (s.id === scenario.id ? { ...s, block_style: newStyle } : s))
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
