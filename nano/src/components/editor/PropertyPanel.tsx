'use client';

import { useState } from 'react';
import { Scenario, CommonBlockSettings, LayoutPreset } from '@/types';
import { FONT_FAMILIES as SHARED_FONT_FAMILIES, FONT_WEIGHTS as SHARED_FONT_WEIGHTS } from '@/lib/block-settings-defaults';

const LAYOUT_OPTIONS: { id: LayoutPreset; label: string; icon: string; category?: string }[] = [
  { id: 'vertical', label: '기본', icon: '📱', category: '기본' },
  { id: 'text-first', label: '텍스트 위', icon: '📝', category: '기본' },
  { id: 'card', label: '카드', icon: '🎴', category: '기본' },
  { id: 'horizontal-left', label: '좌 이미지', icon: '◧', category: '가로형' },
  { id: 'horizontal-right', label: '우 이미지', icon: '◨', category: '가로형' },
  { id: 'magazine', label: '매거진', icon: '📰', category: '가로형' },
  { id: 'split', label: '비대칭', icon: '⬓', category: '가로형' },
  { id: 'overlay-center', label: '중앙', icon: '🎯', category: '오버레이' },
  { id: 'overlay-top', label: '상단', icon: '⬆️', category: '오버레이' },
  { id: 'overlay-bottom', label: '하단', icon: '⬇️', category: '오버레이' },
  { id: 'hero', label: '히어로', icon: '🦸', category: '특수' },
  { id: 'minimal', label: '미니멀', icon: '✨', category: '특수' },
  { id: 'quote', label: '인용문', icon: '💬', category: '특수' },
  { id: 'fullwidth', label: '전체폭', icon: '🌅', category: '특수' },
  { id: 'image-dominant', label: '캡션', icon: '🖼️', category: '특수' },
  { id: 'triple-row', label: '3단 가로', icon: '🖼️', category: '멀티' },
  { id: 'triple-column', label: '3단 세로', icon: '📋', category: '멀티' },
  { id: 'triple-featured', label: '메인+서브', icon: '🎨', category: '멀티' },
  { id: 'triple-masonry', label: '매거진3', icon: '📰', category: '멀티' },
];

export function PropertyPanel({
  scenario,
  commonSettings,
  onCommonSettingsChange,
  onLayoutChange,
  onBlockStyleChange,
}: {
  scenario: Scenario | null;
  commonSettings: CommonBlockSettings;
  onCommonSettingsChange: (settings: CommonBlockSettings) => void;
  onLayoutChange: (preset: LayoutPreset) => void;
  onBlockStyleChange: (style: Partial<CommonBlockSettings> | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<'block' | 'global'>('block');

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* 탭 헤더 */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('block')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'block'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          개별블록설정
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-3 text-sm font-medium transition ${
            activeTab === 'global'
              ? 'text-violet-400 border-b-2 border-violet-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          전체 스타일
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'block' && scenario ? (
          <>
            {/* 레이아웃 선택 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                레이아웃
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onLayoutChange(opt.id)}
                    className={`p-1.5 rounded-lg text-center transition ${
                      scenario.layout_preset === opt.id || (!scenario.layout_preset && opt.id === 'vertical')
                        ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={opt.label}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <p className="text-[10px] mt-0.5 truncate">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 블록 스타일 Override */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                개별 스타일 (선택)
              </h4>
              <div className="space-y-3">
                {/* 배경색 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">배경색</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={scenario.block_style?.blockBackgroundColor || commonSettings.blockBackgroundColor}
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        blockBackgroundColor: e.target.value
                      })}
                      className="w-10 h-8 rounded cursor-pointer bg-slate-800 border border-slate-600"
                    />
                    <input
                      type="text"
                      value={scenario.block_style?.blockBackgroundColor || ''}
                      placeholder="기본값 사용"
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        blockBackgroundColor: e.target.value || undefined
                      })}
                      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    />
                  </div>
                </div>

                {/* 텍스트 색상 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">텍스트 색상</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={scenario.block_style?.textColor || commonSettings.textColor}
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        textColor: e.target.value
                      })}
                      className="w-10 h-8 rounded cursor-pointer bg-slate-800 border border-slate-600"
                    />
                    <input
                      type="text"
                      value={scenario.block_style?.textColor || ''}
                      placeholder="기본값 사용"
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        textColor: e.target.value || undefined
                      })}
                      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    />
                  </div>
                </div>

                {/* 폰트 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">폰트</label>
                  <select
                    value={scenario.block_style?.textFontFamily || ''}
                    onChange={(e) => onBlockStyleChange({
                      ...scenario.block_style,
                      textFontFamily: e.target.value || undefined
                    })}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                  >
                    <option value="">기본값 사용</option>
                    {SHARED_FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* 글꼴 굵기 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">글꼴 굵기</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={scenario.block_style?.textFontWeight || ''}
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        textFontWeight: (e.target.value || undefined) as any
                      })}
                      className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    >
                      <option value="">기본값 사용</option>
                      {SHARED_FONT_WEIGHTS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                    {scenario.block_style?.textFontWeight && (
                      <button
                        onClick={() => {
                          const { textFontWeight, ...rest } = scenario.block_style || {};
                          onBlockStyleChange(Object.keys(rest).length > 0 ? rest : null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-300"
                        title="기본값으로"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>

                {/* 글자 크기 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">글자 크기</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="30"
                      value={scenario.block_style?.textFontSize || commonSettings.textFontSize}
                      onChange={(e) => onBlockStyleChange({
                        ...scenario.block_style,
                        textFontSize: parseInt(e.target.value)
                      })}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-300 w-10 text-right">
                      {scenario.block_style?.textFontSize || commonSettings.textFontSize}px
                    </span>
                    {scenario.block_style?.textFontSize && (
                      <button
                        onClick={() => {
                          const { textFontSize, ...rest } = scenario.block_style || {};
                          onBlockStyleChange(Object.keys(rest).length > 0 ? rest : null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-300"
                        title="기본값으로"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>

                {/* 텍스트 정렬 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">텍스트 정렬</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => {
                      const isActive = scenario.block_style?.textAlign === align;
                      const isDefault = !scenario.block_style?.textAlign && commonSettings.textAlign === align;
                      return (
                        <button
                          key={align}
                          onClick={() => {
                            if (isActive) {
                              const { textAlign, ...rest } = scenario.block_style || {};
                              onBlockStyleChange(Object.keys(rest).length > 0 ? rest : null);
                            } else {
                              onBlockStyleChange({
                                ...scenario.block_style,
                                textAlign: align
                              });
                            }
                          }}
                          className={`flex-1 py-1.5 rounded text-xs transition ${
                            isActive
                              ? 'bg-violet-600 text-white'
                              : isDefault
                              ? 'bg-slate-700 text-slate-300 ring-1 ring-slate-500'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {align === 'left' ? '좌측' : align === 'center' ? '중앙' : '우측'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 추가 여백 (높이) */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">추가 여백 (높이)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={scenario.block_style?.blockHeight || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val === 0) {
                          const { blockHeight, ...rest } = scenario.block_style || {};
                          onBlockStyleChange(Object.keys(rest).length > 0 ? rest : null);
                        } else {
                          onBlockStyleChange({
                            ...scenario.block_style,
                            blockHeight: val
                          });
                        }
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-300 w-14 text-right">
                      +{scenario.block_style?.blockHeight || 0}px
                    </span>
                  </div>
                </div>

                {/* 리셋 버튼 */}
                {scenario.block_style && Object.keys(scenario.block_style).length > 0 && (
                  <button
                    onClick={() => onBlockStyleChange(null)}
                    className="w-full py-2 text-sm text-red-400 hover:text-red-300 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition"
                  >
                    개별 스타일 초기화
                  </button>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'block' ? (
          <div className="text-center text-slate-500 py-8">
            <p>블록을 선택하세요</p>
          </div>
        ) : null}

        {activeTab === 'global' && (
          <>
            {/* 블록 너비 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                블록 너비
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="400"
                  max="1000"
                  value={commonSettings.blockWidth}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    blockWidth: parseInt(e.target.value),
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-slate-300 w-16 text-right">
                  {commonSettings.blockWidth}px
                </span>
              </div>
            </div>

            {/* 배경색 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                기본 배경색
              </h4>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={commonSettings.blockBackgroundColor}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    blockBackgroundColor: e.target.value,
                  })}
                  className="w-12 h-10 rounded cursor-pointer bg-slate-800 border border-slate-600"
                />
                <input
                  type="text"
                  value={commonSettings.blockBackgroundColor}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    blockBackgroundColor: e.target.value,
                  })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* 폰트 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                폰트
              </h4>
              <select
                value={commonSettings.textFontFamily}
                onChange={(e) => onCommonSettingsChange({
                  ...commonSettings,
                  textFontFamily: e.target.value,
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
              >
                {SHARED_FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* 글꼴 굵기 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                글꼴 굵기
              </h4>
              <select
                value={commonSettings.textFontWeight}
                onChange={(e) => onCommonSettingsChange({
                  ...commonSettings,
                  textFontWeight: e.target.value as CommonBlockSettings['textFontWeight'],
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
              >
                {SHARED_FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* 글꼴 크기 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                본문 글꼴 크기
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="12"
                  max="30"
                  value={commonSettings.textFontSize}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    textFontSize: parseInt(e.target.value),
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-slate-300 w-12 text-right">
                  {commonSettings.textFontSize}px
                </span>
              </div>
            </div>

            {/* 텍스트 색상 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                텍스트 색상
              </h4>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={commonSettings.textColor}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    textColor: e.target.value,
                  })}
                  className="w-12 h-10 rounded cursor-pointer bg-slate-800 border border-slate-600"
                />
                <input
                  type="text"
                  value={commonSettings.textColor}
                  onChange={(e) => onCommonSettingsChange({
                    ...commonSettings,
                    textColor: e.target.value,
                  })}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* 텍스트 정렬 */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                텍스트 정렬
              </h4>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => onCommonSettingsChange({
                      ...commonSettings,
                      textAlign: align,
                    })}
                    className={`flex-1 py-2 rounded transition ${
                      commonSettings.textAlign === align
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {align === 'left' ? '좌측' : align === 'center' ? '중앙' : '우측'}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 py-2">
              변경사항이 자동 저장됩니다
            </p>
          </>
        )}
      </div>
    </div>
  );
}
