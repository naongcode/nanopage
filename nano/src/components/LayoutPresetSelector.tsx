'use client';

import { LayoutPreset } from '@/types';

interface LayoutPresetSelectorProps {
  scenarioId: string;
  currentPreset: LayoutPreset | null | undefined;
  onPresetChange: (presetId: LayoutPreset) => void;
}

// 간단한 프리셋 정의 (시각적 미리보기 중심)
const SIMPLE_PRESETS: {
  id: LayoutPreset;
  label: string;
  visual: React.ReactNode;
}[] = [
  {
    id: 'vertical',
    label: '기본',
    visual: (
      <div className="flex flex-col gap-1 w-full">
        <div className="bg-gray-400 h-8 rounded" />
        <div className="bg-gray-300 h-3 rounded" />
      </div>
    ),
  },
  {
    id: 'text-first',
    label: '텍스트 위',
    visual: (
      <div className="flex flex-col gap-1 w-full">
        <div className="bg-gray-300 h-3 rounded" />
        <div className="bg-gray-400 h-8 rounded" />
      </div>
    ),
  },
  {
    id: 'horizontal-left',
    label: '좌 이미지',
    visual: (
      <div className="flex gap-1 w-full h-10">
        <div className="bg-gray-400 flex-1 rounded" />
        <div className="bg-gray-300 flex-1 rounded" />
      </div>
    ),
  },
  {
    id: 'horizontal-right',
    label: '우 이미지',
    visual: (
      <div className="flex gap-1 w-full h-10">
        <div className="bg-gray-300 flex-1 rounded" />
        <div className="bg-gray-400 flex-1 rounded" />
      </div>
    ),
  },
  {
    id: 'image-dominant',
    label: '이미지 중심',
    visual: (
      <div className="flex flex-col gap-0.5 w-full">
        <div className="bg-gray-400 h-9 rounded" />
        <div className="bg-gray-300 h-2 rounded" />
      </div>
    ),
  },
  {
    id: 'card',
    label: '카드',
    visual: (
      <div className="flex flex-col w-full border border-gray-300 rounded overflow-hidden">
        <div className="bg-gray-400 h-6" />
        <div className="bg-white h-4 p-0.5">
          <div className="bg-gray-300 h-full rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'magazine',
    label: '매거진',
    visual: (
      <div className="flex gap-1 w-full h-10">
        <div className="bg-gray-400 w-3/5 rounded" />
        <div className="bg-gray-300 w-2/5 rounded" />
      </div>
    ),
  },
  {
    id: 'overlay-center',
    label: '오버레이',
    visual: (
      <div className="relative w-full h-10">
        <div className="absolute inset-0 bg-gray-400 rounded" />
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 bg-white/80 h-4 rounded" />
      </div>
    ),
  },
];

export function LayoutPresetSelector({
  scenarioId,
  currentPreset,
  onPresetChange,
}: LayoutPresetSelectorProps) {
  const activePreset = currentPreset || 'vertical';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="text-xs text-gray-500 mb-2">레이아웃</div>
      <div className="grid grid-cols-4 gap-2">
        {SIMPLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetChange(preset.id)}
            className={`p-2 rounded-lg border-2 transition-all ${
              activePreset === preset.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-100 hover:border-gray-300 bg-gray-50'
            }`}
            title={preset.label}
          >
            <div className="w-full aspect-square flex items-center justify-center p-1">
              {preset.visual}
            </div>
            <div className={`text-xs mt-1 truncate text-center ${
              activePreset === preset.id ? 'text-purple-700 font-medium' : 'text-gray-500'
            }`}>
              {preset.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
