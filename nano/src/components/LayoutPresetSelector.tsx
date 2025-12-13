'use client';

import { useState } from 'react';
import { LayoutPreset } from '@/types';
import { getLayoutPresetList, applyLayoutPreset } from '@/lib/layout-presets';

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
  const [isOpen, setIsOpen] = useState(false);
  const presets = getLayoutPresetList();
  const activePreset = currentPreset || 'vertical';

  const handlePresetClick = async (presetId: LayoutPreset) => {
    try {
      // 프리셋 적용 (부모 컴포넌트에서 처리)
      onPresetChange(presetId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error applying preset:', error);
      alert('프리셋 적용에 실패했습니다.');
    }
  };

  return (
    <div className="relative">
      {/* 프리셋 선택 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {presets.find((p) => p.id === activePreset)?.icon || '📱'}
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-purple-900">
              {presets.find((p) => p.id === activePreset)?.name || '세로형 (기본)'}
            </div>
            <div className="text-xs text-purple-600">
              레이아웃 프리셋
            </div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-purple-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 프리셋 목록 드롭다운 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full max-w-md bg-white rounded-lg shadow-2xl border-2 border-purple-200 max-h-96 overflow-y-auto">
          <div className="p-3 border-b bg-purple-50">
            <h3 className="font-bold text-purple-900">레이아웃 프리셋 선택</h3>
            <p className="text-xs text-purple-600 mt-1">
              이미지와 텍스트 배치 스타일을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={`p-3 rounded-lg border-2 transition text-left hover:shadow-md ${
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

          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
