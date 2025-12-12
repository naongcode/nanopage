'use client';

import { useState } from 'react';
import { CommonBlockSettings } from '@/types';
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_ALIGNS } from '@/lib/block-settings-defaults';

interface CommonSettingsPanelProps {
  projectId: string;
  settings: CommonBlockSettings;
  onSettingsChange: (newSettings: CommonBlockSettings) => void;
}

export function CommonSettingsPanel({
  projectId,
  settings,
  onSettingsChange,
}: CommonSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ common_block_settings: settings }),
      });

      if (!response.ok) throw new Error('공통 설정 저장 실패');

      alert('공통 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Error saving common settings:', error);
      alert('공통 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">공통 설정</h3>
          <p className="text-xs text-gray-500">모든 블록에 적용됩니다</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
        >
          {isOpen ? '닫기' : '열기'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          {/* 블록 너비 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              블록 너비 (px)
            </label>
            <input
              type="number"
              value={settings.blockWidth}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  blockWidth: parseInt(e.target.value) || 700,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min="300"
              max="1200"
            />
          </div>

          {/* 배경색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              배경색
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.blockBackgroundColor}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    blockBackgroundColor: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.blockBackgroundColor}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    blockBackgroundColor: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* 폰트 패밀리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              폰트
            </label>
            <select
              value={settings.textFontFamily}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  textFontFamily: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* 글꼴 크기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              글꼴 크기 (px)
            </label>
            <input
              type="number"
              value={settings.textFontSize}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  textFontSize: parseInt(e.target.value) || 16,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              min="10"
              max="72"
            />
          </div>

          {/* 텍스트 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              텍스트 색상
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    textColor: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    textColor: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* 굵기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              굵기
            </label>
            <select
              value={settings.textFontWeight}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  textFontWeight: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정렬
            </label>
            <select
              value={settings.textAlign}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  textAlign: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {TEXT_ALIGNS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* 저장 버튼 */}
          <div className="md:col-span-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isSaving ? '저장 중...' : '공통 설정 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
