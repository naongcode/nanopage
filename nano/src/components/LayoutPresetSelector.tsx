'use client';

import { LayoutPreset } from '@/types';
import { getLayoutPresetList } from '@/lib/layout-presets';

interface LayoutPresetSelectorProps {
  scenarioId: string;
  currentPreset: LayoutPreset | null | undefined;
  onPresetChange: (presetId: LayoutPreset) => void;
}

export function LayoutPresetSelector({
  scenarioId,
  currentPreset,
  onPresetChange,
}: LayoutPresetSelectorProps) {
  const presets = getLayoutPresetList();
  const activePreset = currentPreset || 'vertical';

  const handlePresetClick = async (presetId: LayoutPreset) => {
    try {
      onPresetChange(presetId);
    } catch (error) {
      console.error('Error applying preset:', error);
      alert('프리셋 적용에 실패했습니다.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-purple-200">
      <div className="p-3 border-b bg-purple-50">
        <h3 className="font-bold text-purple-900">레이아웃 프리셋</h3>
        <p className="text-xs text-purple-600 mt-1">
          이미지와 텍스트 배치 스타일을 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 max-h-96 overflow-y-auto">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`p-2 rounded-lg border-2 transition text-left hover:shadow-md ${
              activePreset === preset.id
                ? 'bg-purple-100 border-purple-500'
                : 'bg-white border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">{preset.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${
                  activePreset === preset.id ? 'text-purple-900' : 'text-gray-900'
                }`}>
                  {preset.name}
                </div>
                {activePreset === preset.id && (
                  <div className="text-xs text-purple-600 font-medium">✓ 적용 중</div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-2 line-clamp-2">
              {preset.description}
            </div>

            {/* 레이아웃 미리보기 */}
            <div className="bg-gray-50 rounded p-2 flex items-center justify-center">
              <div
                className="text-xs font-mono text-gray-400 whitespace-pre-line text-center"
                style={{ lineHeight: '1.2' }}
              >
                {preset.preview}
              </div>
            </div>

            {/* 레이아웃 타입 배지 */}
            <div className="mt-2 flex gap-1">
              <span className={`px-2 py-0.5 text-xs rounded ${
                preset.layoutType === 'vertical'
                  ? 'bg-blue-100 text-blue-700'
                  : preset.layoutType === 'horizontal'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {preset.layoutType === 'vertical' && '세로'}
                {preset.layoutType === 'horizontal' && '가로'}
                {preset.layoutType === 'overlay' && '오버레이'}
              </span>
              {preset.isOverlay && (
                <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                  드래그
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
