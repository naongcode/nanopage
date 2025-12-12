'use client';

import { useState } from 'react';
import { BlockStyle, CommonBlockSettings } from '@/types';
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_ALIGNS } from '@/lib/block-settings-defaults';

interface BlockStyleOverridePanelProps {
  scenarioId: string;
  blockStyle: BlockStyle | null;
  commonSettings: CommonBlockSettings;
  onStyleChange: (newStyle: BlockStyle | null) => void;
}

export function BlockStyleOverridePanel({
  scenarioId,
  blockStyle,
  commonSettings,
  onStyleChange,
}: BlockStyleOverridePanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [localStyle, setLocalStyle] = useState<BlockStyle>(blockStyle || {});
  const [isSaving, setIsSaving] = useState(false);

  // 현재 적용 중인 값 (override가 있으면 override, 없으면 공통)
  const effectiveSettings = { ...commonSettings, ...localStyle };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_style: localStyle }),
      });

      if (!response.ok) throw new Error('개별 설정 저장 실패');

      onStyleChange(localStyle);
      alert('개별 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Error saving block style:', error);
      alert('개별 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('이 블록의 개별 설정을 모두 삭제하고 공통 설정으로 되돌릴까요?')) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_style: null }),
      });

      if (!response.ok) throw new Error('설정 초기화 실패');

      setLocalStyle({});
      onStyleChange(null);
      alert('공통 설정으로 되돌렸습니다.');
    } catch (error) {
      console.error('Error resetting block style:', error);
      alert('설정 초기화에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasOverrides = Object.keys(localStyle).length > 0;

  return (
    <div className="border-t mt-4 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-2"
      >
        {isOpen ? '개별 설정 닫기' : '개별 설정 열기'}
        {hasOverrides && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            적용 중
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            이 블록만의 스타일을 설정합니다. 설정하지 않은 항목은 공통 설정을 따릅니다.
          </p>

          {/* 블록 너비 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              블록 너비 (px)
              {localStyle.blockWidth === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {commonSettings.blockWidth})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={localStyle.blockWidth ?? ''}
                placeholder={`공통 설정: ${commonSettings.blockWidth}`}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    blockWidth: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                min="300"
                max="1200"
              />
              {localStyle.blockWidth !== undefined && (
                <button
                  onClick={() => {
                    const { blockWidth, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 배경색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              배경색
              {localStyle.blockBackgroundColor === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {commonSettings.blockBackgroundColor})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localStyle.blockBackgroundColor ?? commonSettings.blockBackgroundColor}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    blockBackgroundColor: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={localStyle.blockBackgroundColor ?? ''}
                placeholder={commonSettings.blockBackgroundColor}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    blockBackgroundColor: e.target.value || undefined,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
              {localStyle.blockBackgroundColor !== undefined && (
                <button
                  onClick={() => {
                    const { blockBackgroundColor, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 폰트 패밀리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              폰트
              {localStyle.textFontFamily === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {FONT_FAMILIES.find(f => f.value === commonSettings.textFontFamily)?.label})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <select
                value={localStyle.textFontFamily ?? commonSettings.textFontFamily}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textFontFamily: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              {localStyle.textFontFamily !== undefined && (
                <button
                  onClick={() => {
                    const { textFontFamily, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 글꼴 크기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              글꼴 크기 (px)
              {localStyle.textFontSize === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {commonSettings.textFontSize})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={localStyle.textFontSize ?? ''}
                placeholder={`공통 설정: ${commonSettings.textFontSize}`}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textFontSize: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                min="10"
                max="72"
              />
              {localStyle.textFontSize !== undefined && (
                <button
                  onClick={() => {
                    const { textFontSize, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 텍스트 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              텍스트 색상
              {localStyle.textColor === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {commonSettings.textColor})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={localStyle.textColor ?? commonSettings.textColor}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textColor: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={localStyle.textColor ?? ''}
                placeholder={commonSettings.textColor}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textColor: e.target.value || undefined,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
              />
              {localStyle.textColor !== undefined && (
                <button
                  onClick={() => {
                    const { textColor, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 굵기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              굵기
              {localStyle.textFontWeight === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {FONT_WEIGHTS.find(w => w.value === commonSettings.textFontWeight)?.label})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <select
                value={localStyle.textFontWeight ?? commonSettings.textFontWeight}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textFontWeight: e.target.value as any,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
              {localStyle.textFontWeight !== undefined && (
                <button
                  onClick={() => {
                    const { textFontWeight, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정렬
              {localStyle.textAlign === undefined && (
                <span className="ml-2 text-xs text-gray-500">
                  (공통: {TEXT_ALIGNS.find(a => a.value === commonSettings.textAlign)?.label})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <select
                value={localStyle.textAlign ?? commonSettings.textAlign}
                onChange={(e) =>
                  setLocalStyle({
                    ...localStyle,
                    textAlign: e.target.value as any,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              >
                {TEXT_ALIGNS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              {localStyle.textAlign !== undefined && (
                <button
                  onClick={() => {
                    const { textAlign, ...rest } = localStyle;
                    setLocalStyle(rest);
                  }}
                  className="px-2 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          {/* 저장/초기화 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition"
            >
              {isSaving ? '저장 중...' : '이 블록만 저장'}
            </button>
            <button
              onClick={handleReset}
              disabled={isSaving || !hasOverrides}
              className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm transition"
            >
              공통 설정으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
