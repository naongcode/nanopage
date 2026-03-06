'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scenario, Project, CommonBlockSettings, LayoutPreset } from '@/types';
import { DEFAULT_COMMON_SETTINGS } from '@/lib/block-settings-defaults';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { uploadImages } from '@/lib/upload';
import { BlockListItem } from '@/components/editor/BlockListItem';
import { CanvasBlock } from '@/components/editor/CanvasBlock';
import { PropertyPanel } from '@/components/editor/PropertyPanel';

// 랜덤 배치용 레이아웃 목록
const RANDOM_LAYOUTS: LayoutPreset[] = [
  'vertical', 'text-first', 'card',
  'horizontal-left', 'horizontal-right', 'magazine', 'split',
  'overlay-center', 'overlay-top', 'overlay-bottom',
  'hero', 'minimal', 'quote', 'fullwidth', 'image-dominant',
  'triple-row', 'triple-column', 'triple-featured', 'triple-masonry',
];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commonSettings, setCommonSettings] = useState<CommonBlockSettings>(DEFAULT_COMMON_SETTINGS);

  const [zoom, setZoom] = useState(100);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const scrollToBlock = (id: string) => {
    const block = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement;
    const canvas = canvasRef.current;
    if (!block || !canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const scrollTarget = canvas.scrollTop + blockRect.top - canvasRect.top - (canvas.clientHeight - blockRect.height) / 2;
    canvas.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 데이터 로드
  useEffect(() => {
    if (projectId) fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    if (project?.common_block_settings) {
      setCommonSettings(project.common_block_settings);
    }
  }, [project]);

  // 공통 설정 자동 저장 (1초 디바운스)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (!projectId) return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ common_block_settings: commonSettings }),
        });
      } catch (error) {
        console.error('Error auto-saving common settings:', error);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [commonSettings, projectId]);

  // 랜덤 레이아웃 배치 함수
  const applyRandomLayouts = async (scenarioList: Scenario[], saveToServer = true) => {
    setIsRandomizing(true);
    const updatedScenarios = scenarioList.map((s) => {
      const randomLayout = RANDOM_LAYOUTS[Math.floor(Math.random() * RANDOM_LAYOUTS.length)];
      return { ...s, layout_preset: randomLayout };
    });

    setScenarios(updatedScenarios);

    if (saveToServer) {
      await Promise.all(
        updatedScenarios.map((s) =>
          fetch(`/api/scenarios/${s.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout_preset: s.layout_preset }),
          }).catch((err) => console.error('Error saving layout:', err))
        )
      );
    }

    setIsRandomizing(false);
  };

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('프로젝트를 불러올 수 없습니다.');

      const data = await response.json();
      setProject(data.project);

      const scenariosWithImages = data.scenarios
        .filter((s: Scenario) => s.selected_image_url)
        .sort((a: Scenario, b: Scenario) => a.scenario_no - b.scenario_no);

      const hasNoLayout = scenariosWithImages.some((s: Scenario) => !s.layout_preset);
      if (hasNoLayout) {
        await applyRandomLayouts(scenariosWithImages, true);
      } else {
        setScenarios(scenariosWithImages);
      }

      if (scenariosWithImages.length > 0) {
        setSelectedId(scenariosWithImages[0].id);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedScenario = scenarios.find((s) => s.id === selectedId) || null;

  const getEffectiveStyle = (scenario: Scenario): CommonBlockSettings => {
    return { ...commonSettings, ...(scenario.block_style || {}) };
  };

  // 드래그 앤 드롭
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

  // 텍스트 위치 변경
  const handleTextPositionChange = async (scenarioId: string, x: number, y: number) => {
    try {
      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_position_x: x, text_position_y: y }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, text_position_x: x, text_position_y: y } : s))
      );
    } catch (error) {
      console.error('Error saving text position:', error);
    }
  };

  // 텍스트 수정
  const handleTitleEdit = async (scenarioId: string, text: string) => {
    try {
      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title_text: text }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, title_text: text } : s))
      );
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  const handleSubtitleEdit = async (scenarioId: string, text: string) => {
    try {
      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitle_text: text }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, subtitle_text: text } : s))
      );
    } catch (error) {
      console.error('Error saving subtitle:', error);
    }
  };

  const handleDescriptionEdit = async (scenarioId: string, text: string) => {
    try {
      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_edited_description_text: text }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, user_edited_description_text: text } : s))
      );
    } catch (error) {
      console.error('Error saving description:', error);
    }
  };

  // 레이아웃 변경
  const handleLayoutChange = async (preset: LayoutPreset) => {
    if (!selectedId) return;
    try {
      await fetch(`/api/scenarios/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_preset: preset }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, layout_preset: preset } : s))
      );
    } catch (error) {
      console.error('Error changing layout:', error);
    }
  };

  // 추가 이미지 업로드
  const handleAdditionalImageAdd = async (scenarioId: string, slotIndex: number, file: File) => {
    try {
      const urls = await uploadImages([file], projectId);
      const url = urls[0];

      const scenario = scenarios.find((s) => s.id === scenarioId);
      const currentImages = scenario?.additional_image_urls || [];

      const newImages = [...currentImages];
      if (slotIndex === 0) {
        await fetch(`/api/scenarios/${scenarioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selected_image_url: url }),
        });
        setScenarios((prev) =>
          prev.map((s) => (s.id === scenarioId ? { ...s, selected_image_url: url } : s))
        );
      } else {
        newImages[slotIndex - 1] = url;
        await fetch(`/api/scenarios/${scenarioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ additional_image_urls: newImages }),
        });
        setScenarios((prev) =>
          prev.map((s) => (s.id === scenarioId ? { ...s, additional_image_urls: newImages } : s))
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  // 추가 이미지 삭제
  const handleAdditionalImageRemove = async (scenarioId: string, slotIndex: number) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      const currentImages = scenario?.additional_image_urls || [];

      const newImages = [...currentImages];
      newImages[slotIndex] = '';

      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_image_urls: newImages }),
      });

      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, additional_image_urls: newImages } : s))
      );
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // 이미지 순서 변경
  const handleImagesReorder = async (scenarioId: string, fromIndex: number, toIndex: number) => {
    try {
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      const allImages = [
        scenario.selected_image_url || '',
        ...(scenario.additional_image_urls || []),
      ];

      while (allImages.length < 3) allImages.push('');

      const temp = allImages[fromIndex];
      allImages[fromIndex] = allImages[toIndex];
      allImages[toIndex] = temp;

      const newMainImage = allImages[0];
      const newAdditionalImages = allImages.slice(1);

      await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_image_url: newMainImage,
          additional_image_urls: newAdditionalImages,
        }),
      });

      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId
            ? { ...s, selected_image_url: newMainImage, additional_image_urls: newAdditionalImages }
            : s
        )
      );
    } catch (error) {
      console.error('Error reordering images:', error);
    }
  };

  // 개별 블록 스타일 변경
  const handleBlockStyleChange = async (style: Partial<CommonBlockSettings> | null) => {
    if (!selectedId) return;
    try {
      await fetch(`/api/scenarios/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_style: style }),
      });
      setScenarios((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, block_style: style } : s))
      );
    } catch (error) {
      console.error('Error changing block style:', error);
    }
  };

  // 폰트 CSS 빌드 (사용 중인 폰트만 data URI로 임베딩)
  const buildFontEmbedCSS = async (): Promise<string> => {
    const usedFamilies = new Set<string>();
    scenarios.forEach(s => {
      const style = { ...commonSettings, ...(s.block_style || {}) };
      usedFamilies.add(style.textFontFamily || commonSettings.textFontFamily);
    });

    let css = '';

    const gfLink = document.querySelector<HTMLLinkElement>('link[href*="fonts.googleapis.com/css2"]');
    if (gfLink?.href) {
      try {
        const res = await fetch(gfLink.href);
        const gfText = await res.text();
        const blocks = gfText.match(/@font-face\s*\{[^}]+\}/g) || [];
        for (const block of blocks) {
          const fm = block.match(/font-family:\s*['"]([^'"]+)['"]/);
          if (fm && Array.from(usedFamilies).some(f => f.includes(fm[1]))) {
            css += block + '\n';
          }
        }
      } catch (e) {
        console.warn('Google Fonts CSS fetch failed:', e);
      }
    }

    if (Array.from(usedFamilies).some(f => f.includes('MaruBuri'))) {
      css += `@font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; }\n`;
      css += `@font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; }\n`;
    }

    if (Array.from(usedFamilies).some(f => f.includes('Pretendard'))) {
      try {
        const ptRes = await fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        const ptText = await ptRes.text();
        const ptBase = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/';
        const ptFixed = ptText.replace(/url\(\.?\/?/g, `url(${ptBase}`);
        const ptBlocks = ptFixed.match(/@font-face\s*\{[^}]+\}/g) || [];
        const neededWeights = new Set<string>();
        scenarios.forEach(s => {
          const style = { ...commonSettings, ...(s.block_style || {}) };
          if ((style.textFontFamily || '').includes('Pretendard')) {
            neededWeights.add(style.textFontWeight || commonSettings.textFontWeight || '400');
          }
        });
        for (const block of ptBlocks) {
          const wm = block.match(/font-weight:\s*(\d+)/);
          if (wm && neededWeights.has(wm[1])) {
            css += block + '\n';
          }
        }
      } catch (e) {
        console.warn('Pretendard CSS fetch failed:', e);
      }
    }

    if (!css) return '';

    const urlRegex = /url\(['"]?([^'")\s]+)['"]?\)/g;
    const fontUrls = new Map<string, string>();
    let m;
    while ((m = urlRegex.exec(css)) !== null) {
      if (m[1].startsWith('http')) fontUrls.set(m[1], '');
    }

    await Promise.allSettled(
      Array.from(fontUrls.keys()).map(async (url) => {
        try {
          const r = await fetch(url, { mode: 'cors' });
          const blob = await r.blob();
          const dataUri: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          fontUrls.set(url, dataUri);
        } catch { /* skip failed fonts */ }
      })
    );

    return css.replace(/url\(['"]?([^'")\s]+)['"]?\)/g, (full, url) => {
      const dataUri = fontUrls.get(url);
      return dataUri ? `url('${dataUri}')` : full;
    });
  };

  // 다운로드
  const handleDownload = async (format: 'png' | 'jpg') => {
    try {
      const { toCanvas } = await import('html-to-image');
      const blocks = document.querySelectorAll('.canvas-block');
      if (blocks.length === 0) return;

      let fontEmbedCSS = '';
      try {
        fontEmbedCSS = await buildFontEmbedCSS();
      } catch (e) {
        console.warn('Font embedding failed, downloading without fonts:', e);
      }

      const options = {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        useCORS: true,
        skipAutoScale: true,
        fontEmbedCSS,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        filter: (node: HTMLElement) => {
          return !node.classList?.contains('no-download');
        },
        fetchRequestInit: {
          mode: 'cors' as RequestMode,
          credentials: 'omit' as RequestCredentials,
        },
      };

      const canvases = await Promise.all(
        Array.from(blocks).map((el) => toCanvas(el as HTMLElement, options))
      );

      const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
      const maxWidth = Math.max(...canvases.map((c) => c.width));

      const merged = document.createElement('canvas');
      merged.width = maxWidth;
      merged.height = totalHeight;
      const ctx = merged.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      let y = 0;
      canvases.forEach((c) => {
        ctx.drawImage(c, 0, y);
        y += c.height;
      });

      const dataUrl = merged.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `${project?.project_name || 'detail-page'}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!project || scenarios.length === 0) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-white text-lg">생성된 이미지가 없습니다.</p>
        <button
          onClick={() => router.push(`/result?id=${projectId}`)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
        >
          결과 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* 상단 툴바 */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-semibold">{project.project_name}</h1>
            <p className="text-xs text-slate-500">상세페이지 에디터</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 랜덤 배치 버튼 */}
          <button
            onClick={() => applyRandomLayouts(scenarios)}
            disabled={isRandomizing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
          >
            <span>{isRandomizing ? '배치 중...' : '🎲 랜덤 배치'}</span>
          </button>

          {/* 줌 컨트롤 */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="text-slate-400 hover:text-white"
            >
              −
            </button>
            <span className="text-sm text-white w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="text-slate-400 hover:text-white"
            >
              +
            </button>
          </div>

          {/* 다운로드 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('png')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
            >
              PNG
            </button>
            <button
              onClick={() => handleDownload('jpg')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
            >
              JPG
            </button>
          </div>
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 사이드바 - 블록 목록 */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">블록 목록</h2>
            <p className="text-xs text-slate-500 mt-1">드래그하여 순서 변경</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={scenarios.map((s) => s.id!)}
                strategy={verticalListSortingStrategy}
              >
                {scenarios.map((scenario, index) => (
                  <BlockListItem
                    key={scenario.id}
                    scenario={scenario}
                    index={index}
                    isSelected={selectedId === scenario.id}
                    onSelect={() => {
                      setSelectedId(scenario.id!);
                      scrollToBlock(scenario.id!);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </aside>

        {/* 중앙 캔버스 */}
        <main className="flex-1 overflow-auto bg-slate-800/50" ref={canvasRef}>
          <div
            className="min-h-full py-8 flex flex-col items-center"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div className="space-y-6">
              {scenarios.map((scenario, index) => (
                <div key={scenario.id} className="canvas-block" data-block-id={scenario.id}>
                  <CanvasBlock
                    scenario={scenario}
                    index={index}
                    isSelected={selectedId === scenario.id}
                    effectiveStyle={getEffectiveStyle(scenario)}
                    onSelect={() => setSelectedId(scenario.id!)}
                    onTitleChange={(text) => handleTitleEdit(scenario.id!, text)}
                    onSubtitleChange={(text) => handleSubtitleEdit(scenario.id!, text)}
                    onDescriptionChange={(text) => handleDescriptionEdit(scenario.id!, text)}
                    onAdditionalImageAdd={(slotIndex, file) => handleAdditionalImageAdd(scenario.id!, slotIndex, file)}
                    onAdditionalImageRemove={(slotIndex) => handleAdditionalImageRemove(scenario.id!, slotIndex)}
                    onImagesReorder={(from, to) => handleImagesReorder(scenario.id!, from, to)}
                    onTextPositionChange={(x, y) => handleTextPositionChange(scenario.id!, x, y)}
                    onBlockStyleChange={(style) => {
                      fetch(`/api/scenarios/${scenario.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ block_style: style }),
                      }).catch(console.error);
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === scenario.id ? { ...s, block_style: style } : s))
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* 오른쪽 속성 패널 */}
        <aside className="w-80 border-l border-slate-800 shrink-0">
          <PropertyPanel
            scenario={selectedScenario}
            commonSettings={commonSettings}
            onCommonSettingsChange={setCommonSettings}
            onLayoutChange={handleLayoutChange}
            onBlockStyleChange={handleBlockStyleChange}
          />
        </aside>
      </div>
    </div>
  );
}
