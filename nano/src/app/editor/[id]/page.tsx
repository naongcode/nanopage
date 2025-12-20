'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scenario, Project, CommonBlockSettings, ImageCrop, LayoutPreset } from '@/types';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 블록 리스트 아이템
function BlockListItem({
  scenario,
  index,
  isSelected,
  onSelect,
}: {
  scenario: Scenario;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
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
    transition: isDragging ? 'none' : transition, // 드래그 중엔 애니메이션 제거
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
        isSelected
          ? 'bg-violet-600/20 ring-2 ring-violet-500'
          : 'bg-slate-800/50 hover:bg-slate-700/50'
      }`}
    >
      {/* 번호 */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
        isSelected ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {index + 1}
      </div>

      {/* 썸네일 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-900">
        <img
          src={scenario.selected_image_url || ''}
          alt=""
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* 제목 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {scenario.title_text || `블록 ${index + 1}`}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {scenario.layout_preset || 'vertical'}
        </p>
      </div>
    </div>
  );
}

// 캔버스 블록 렌더링
function CanvasBlock({
  scenario,
  index,
  isSelected,
  effectiveStyle,
  onSelect,
  onTitleChange,
  onSubtitleChange,
  onDescriptionChange,
}: {
  scenario: Scenario;
  index: number;
  isSelected: boolean;
  effectiveStyle: CommonBlockSettings;
  onSelect: () => void;
  onTitleChange: (text: string) => void;
  onSubtitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
}) {
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const preset = scenario.layout_preset || 'vertical';

  const title = scenario.title_text || '';
  const subtitle = scenario.subtitle_text || '';
  const description = scenario.user_edited_description_text || scenario.description_text || '';

  const TextContent = (
    <div className="space-y-2 p-4">
      {/* 제목 - 선택사항 */}
      {editingField === 'title' ? (
        <input
          type="text"
          defaultValue={title}
          placeholder="제목 (선택사항)"
          className="w-full px-2 py-1 text-xl font-bold border-b-2 border-violet-400 outline-none bg-transparent"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
          }}
          onBlur={(e) => {
            onTitleChange(e.target.value);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onTitleChange(e.currentTarget.value);
              setEditingField(null);
            }
          }}
          autoFocus
        />
      ) : title ? (
        <h3
          onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
          className="text-xl font-bold cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
          }}
        >
          {title}
        </h3>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
          className="text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 rounded px-2 py-1 transition no-download"
        >
          + 제목 추가
        </button>
      )}

      {/* 부제목 - 입력 안하면 숨김 (편집 모드에서만 플레이스홀더 표시) */}
      {editingField === 'subtitle' ? (
        <input
          type="text"
          defaultValue={subtitle}
          className="w-full px-2 py-1 text-sm border-b border-violet-300 outline-none bg-transparent"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: '#888',
            textAlign: effectiveStyle.textAlign,
          }}
          placeholder="부제목 (선택사항)"
          onBlur={(e) => {
            onSubtitleChange(e.target.value);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubtitleChange(e.currentTarget.value);
              setEditingField(null);
            }
          }}
          autoFocus
        />
      ) : subtitle ? (
        <p
          onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
          className="text-sm cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: '#888',
            textAlign: effectiveStyle.textAlign,
          }}
        >
          {subtitle}
        </p>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
          className="text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 rounded px-2 py-1 transition no-download"
        >
          + 부제목 추가
        </button>
      )}

      {/* 본문 */}
      {editingField === 'description' ? (
        <textarea
          defaultValue={description}
          className="w-full p-2 border border-violet-300 rounded resize-none outline-none"
          rows={3}
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
          }}
          onBlur={(e) => {
            onDescriptionChange(e.target.value);
            setEditingField(null);
          }}
          autoFocus
        />
      ) : (
        <p
          onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
          className="text-sm cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition whitespace-pre-line"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
            lineHeight: '1.7',
          }}
        >
          {description || '본문을 입력하세요'}
        </p>
      )}
    </div>
  );

  const ImageContent = (
    <div className="w-full">
      <img
        src={scenario.selected_image_url || ''}
        alt=""
        crossOrigin="anonymous"
        className="w-full object-cover"
        style={{
          ...(scenario.image_crop ? {
            objectPosition: `${scenario.image_crop.x}% ${scenario.image_crop.y}%`,
          } : {}),
        }}
      />
    </div>
  );

  // 오버레이용 텍스트 색상 헬퍼
  const getOverlayTextColor = () => effectiveStyle.textColor !== '#333333' ? effectiveStyle.textColor : '#ffffff';

  // 오버레이 텍스트 컴포넌트 (재사용)
  const OverlayTextContent = ({ position = 'center' }: { position?: 'top' | 'center' | 'bottom' }) => {
    const overlayTextColor = getOverlayTextColor();
    return (
      <div
        className="absolute inset-x-0 px-8"
        style={{
          top: position === 'top' ? '2rem' : position === 'center' ? '50%' : 'auto',
          bottom: position === 'bottom' ? '2rem' : 'auto',
          transform: position === 'center' ? 'translateY(-50%)' : 'none',
        }}
      >
        <div
          className="space-y-3"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            textAlign: effectiveStyle.textAlign,
            fontFamily: effectiveStyle.textFontFamily,
          }}
        >
          {editingField === 'title' ? (
            <input
              type="text"
              defaultValue={title}
              placeholder="제목 (선택사항)"
              className="w-full px-3 py-2 text-3xl font-bold border-b-2 border-white/50 outline-none bg-black/30 rounded-lg backdrop-blur-sm"
              style={{ color: overlayTextColor, fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}
              onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onTitleChange(e.currentTarget.value); setEditingField(null); }}}
              autoFocus
            />
          ) : title ? (
            <h3
              onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
              className="w-full text-3xl md:text-4xl font-bold cursor-text hover:opacity-80 transition leading-tight"
              style={{ color: overlayTextColor, textAlign: effectiveStyle.textAlign }}
            >
              {title}
            </h3>
          ) : (
            <div style={{ textAlign: effectiveStyle.textAlign }}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                className="text-sm text-white/50 hover:text-white/80 border border-dashed border-white/30 hover:border-white/50 rounded-lg px-3 py-1 transition no-download backdrop-blur-sm"
              >
                + 제목 추가
              </button>
            </div>
          )}

          {editingField === 'subtitle' ? (
            <input
              type="text"
              defaultValue={subtitle}
              placeholder="부제목 (선택사항)"
              className="w-full px-3 py-1 text-lg border-b border-white/30 outline-none bg-black/30 rounded-lg backdrop-blur-sm"
              style={{ color: overlayTextColor, opacity: 0.9, fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}
              onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onSubtitleChange(e.currentTarget.value); setEditingField(null); }}}
              autoFocus
            />
          ) : subtitle ? (
            <p
              onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
              className="w-full text-lg md:text-xl cursor-text hover:opacity-80 transition"
              style={{ color: overlayTextColor, opacity: 0.9, textAlign: effectiveStyle.textAlign }}
            >
              {subtitle}
            </p>
          ) : (
            <div style={{ textAlign: effectiveStyle.textAlign }}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                className="text-sm text-white/50 hover:text-white/80 border border-dashed border-white/30 hover:border-white/50 rounded-lg px-3 py-1 transition no-download backdrop-blur-sm"
              >
                + 부제목 추가
              </button>
            </div>
          )}

          {editingField === 'description' ? (
            <textarea
              defaultValue={description}
              placeholder="본문 (선택사항)"
              rows={3}
              className="w-full px-3 py-2 border border-white/30 outline-none bg-black/30 rounded-lg resize-none backdrop-blur-sm"
              style={{ color: overlayTextColor, opacity: 0.85, fontSize: effectiveStyle.textFontSize, fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}
              onBlur={(e) => { onDescriptionChange(e.target.value); setEditingField(null); }}
              autoFocus
            />
          ) : description ? (
            <p
              onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
              className="w-full cursor-text hover:opacity-80 transition whitespace-pre-line leading-relaxed"
              style={{ color: overlayTextColor, opacity: 0.85, fontSize: effectiveStyle.textFontSize, textAlign: effectiveStyle.textAlign }}
            >
              {description}
            </p>
          ) : (
            <div style={{ textAlign: effectiveStyle.textAlign }}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                className="text-sm text-white/50 hover:text-white/80 border border-dashed border-white/30 hover:border-white/50 rounded-lg px-3 py-1 transition no-download backdrop-blur-sm"
              >
                + 본문 추가
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 레이아웃별 렌더링
  const renderLayout = () => {
    switch (preset) {
      // ===== 텍스트 우선 =====
      case 'text-first':
        return (
          <div className="flex flex-col">
            <div className="py-8 px-6 border-b-4" style={{ borderColor: effectiveStyle.textColor + '20' }}>
              {TextContent}
            </div>
            <div className="relative">
              {ImageContent}
            </div>
          </div>
        );

      // ===== 가로형 좌측 이미지 =====
      case 'horizontal-left':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-1/2 relative overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="w-1/2 flex flex-col justify-center p-8 bg-gradient-to-r from-gray-50/50 to-transparent">
              {TextContent}
            </div>
          </div>
        );

      // ===== 가로형 우측 이미지 =====
      case 'horizontal-right':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-1/2 flex flex-col justify-center p-8 bg-gradient-to-l from-gray-50/50 to-transparent">
              {TextContent}
            </div>
            <div className="w-1/2 relative overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        );

      // ===== 매거진 스타일 =====
      case 'magazine':
        return (
          <div className="flex min-h-[450px]">
            <div className="w-3/5 relative overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 살짝 그라데이션 */}
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/20 to-transparent" />
            </div>
            <div className="w-2/5 flex flex-col justify-center p-8">
              <div className="border-l-4 pl-6" style={{ borderColor: effectiveStyle.textColor }}>
                {TextContent}
              </div>
            </div>
          </div>
        );

      // ===== 오버레이 =====
      case 'overlay-center':
      case 'overlay-top':
      case 'overlay-bottom':
        return (
          <div className="relative min-h-[500px]">
            <img
              src={scenario.selected_image_url || ''}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: preset === 'overlay-top'
                  ? 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)'
                  : preset === 'overlay-bottom'
                  ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)'
                  : 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
              }}
            />
            <OverlayTextContent position={preset === 'overlay-top' ? 'top' : preset === 'overlay-bottom' ? 'bottom' : 'center'} />
          </div>
        );

      // ===== 카드 스타일 =====
      case 'card':
        return (
          <div className="rounded-2xl overflow-hidden shadow-xl bg-white">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              {TextContent}
            </div>
          </div>
        );

      // ===== 이미지 중심 =====
      case 'image-dominant':
        return (
          <div className="relative">
            {ImageContent}
            <div
              className="absolute bottom-0 left-0 right-0 py-4 px-6"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
              }}
            >
              <p
                onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                className="text-white text-center cursor-text hover:opacity-80 transition text-lg font-medium"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', fontFamily: effectiveStyle.textFontFamily }}
              >
                {editingField === 'title' ? (
                  <input
                    type="text"
                    defaultValue={title}
                    className="w-full text-center bg-transparent border-b border-white/50 outline-none"
                    onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : (
                  title || '캡션을 입력하세요'
                )}
              </p>
            </div>
          </div>
        );

      // ===== 히어로 배너 (NEW) =====
      case 'hero':
        return (
          <div className="relative min-h-[600px]">
            <img
              src={scenario.selected_image_url || ''}
              alt=""
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-10 py-12 space-y-5" style={{ fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}>
                {editingField === 'title' ? (
                  <input
                    type="text"
                    defaultValue={title}
                    placeholder="제목 (선택사항)"
                    className="w-full text-5xl font-black bg-transparent border-b-2 border-white/50 outline-none text-white"
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)', textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : title ? (
                  <h2
                    onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                    className="w-full text-4xl md:text-5xl lg:text-6xl font-black text-white cursor-text hover:opacity-80 transition"
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)', lineHeight: '1.1', textAlign: effectiveStyle.textAlign }}
                  >
                    {title}
                  </h2>
                ) : (
                  <div style={{ textAlign: effectiveStyle.textAlign }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="text-lg text-white/40 hover:text-white/70 border border-dashed border-white/30 rounded px-4 py-2 transition no-download"
                    >
                      + 제목 추가
                    </button>
                  </div>
                )}
                {editingField === 'subtitle' ? (
                  <input
                    type="text"
                    defaultValue={subtitle}
                    placeholder="부제목"
                    className="w-full text-xl bg-transparent border-b border-white/30 outline-none text-white/90"
                    style={{ textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : subtitle ? (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                    className="w-full text-xl md:text-2xl text-white/90 cursor-text hover:opacity-80"
                    style={{ textAlign: effectiveStyle.textAlign }}
                  >
                    {subtitle}
                  </p>
                ) : (
                  <div style={{ textAlign: effectiveStyle.textAlign }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                      className="text-sm text-white/40 hover:text-white/70 border border-dashed border-white/30 rounded px-3 py-1 transition no-download"
                    >
                      + 부제목
                    </button>
                  </div>
                )}
                {editingField === 'description' ? (
                  <textarea
                    defaultValue={description}
                    placeholder="본문"
                    rows={2}
                    className="w-full text-lg bg-transparent border border-white/30 rounded outline-none text-white/80 p-2 resize-none"
                    style={{ textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onDescriptionChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : description ? (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="w-full text-lg text-white/80 cursor-text hover:opacity-80 leading-relaxed"
                    style={{ textAlign: effectiveStyle.textAlign }}
                  >
                    {description}
                  </p>
                ) : (
                  <div style={{ textAlign: effectiveStyle.textAlign }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                      className="text-sm text-white/40 hover:text-white/70 border border-dashed border-white/30 rounded px-3 py-1 transition no-download"
                    >
                      + 본문
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ===== 미니멀 (NEW) =====
      case 'minimal':
        return (
          <div className="p-12 space-y-8">
            <div className="max-w-md mx-auto text-center space-y-4">
              {TextContent}
            </div>
            <div className="max-w-lg mx-auto">
              <div className="rounded-lg overflow-hidden shadow-lg">
                {ImageContent}
              </div>
            </div>
          </div>
        );

      // ===== 인용문 스타일 (NEW) =====
      case 'quote':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-2/5 relative overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="w-3/5 flex flex-col justify-center p-10 relative">
              {/* 큰 따옴표 */}
              <div
                className="absolute top-6 left-6 text-8xl opacity-10 font-serif leading-none select-none"
                style={{ color: effectiveStyle.textColor }}
              >
                "
              </div>
              <div className="relative z-10 pl-8">
                {editingField === 'description' ? (
                  <textarea
                    defaultValue={description}
                    className="w-full text-xl italic bg-transparent border-b border-gray-300 outline-none resize-none"
                    style={{ color: effectiveStyle.textColor, fontFamily: effectiveStyle.textFontFamily }}
                    rows={4}
                    onBlur={(e) => { onDescriptionChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="text-xl md:text-2xl italic cursor-text hover:opacity-80 transition leading-relaxed"
                    style={{ color: effectiveStyle.textColor, fontFamily: effectiveStyle.textFontFamily }}
                  >
                    {description || '인용문을 입력하세요'}
                  </p>
                )}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: effectiveStyle.textColor + '30' }}>
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      defaultValue={title}
                      placeholder="출처 (선택사항)"
                      className="w-full font-bold bg-transparent border-b border-gray-300 outline-none"
                      style={{ color: effectiveStyle.textColor }}
                      onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onTitleChange(e.currentTarget.value); setEditingField(null); }}}
                      autoFocus
                    />
                  ) : title ? (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="font-bold cursor-text hover:opacity-80"
                      style={{ color: effectiveStyle.textColor }}
                    >
                      — {title}
                    </p>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="text-xs opacity-50 hover:opacity-80 border border-dashed rounded px-2 py-1 transition no-download"
                      style={{ color: effectiveStyle.textColor, borderColor: effectiveStyle.textColor + '50' }}
                    >
                      + 출처 추가
                    </button>
                  )}
                  {editingField === 'subtitle' ? (
                    <input
                      type="text"
                      defaultValue={subtitle}
                      placeholder="부제목 (선택사항)"
                      className="w-full text-sm bg-transparent border-b border-gray-200 outline-none mt-1"
                      style={{ color: effectiveStyle.textColor, opacity: 0.6 }}
                      onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onSubtitleChange(e.currentTarget.value); setEditingField(null); }}}
                      autoFocus
                    />
                  ) : subtitle ? (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                      className="text-sm opacity-60 cursor-text hover:opacity-80 mt-1"
                      style={{ color: effectiveStyle.textColor }}
                    >
                      {subtitle}
                    </p>
                  ) : title ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                      className="text-xs opacity-40 hover:opacity-60 mt-1 no-download"
                      style={{ color: effectiveStyle.textColor }}
                    >
                      + 부제목
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );

      // ===== 전체 폭 (NEW) =====
      case 'fullwidth':
        return (
          <div className="relative">
            {ImageContent}
            <div
              className="absolute bottom-6 left-6 right-6 p-6 rounded-xl backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      defaultValue={title}
                      className="w-full text-xl font-bold bg-transparent border-b border-gray-300 outline-none"
                      style={{ color: effectiveStyle.textColor }}
                      onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                      autoFocus
                    />
                  ) : (
                    <h3
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="text-xl font-bold cursor-text hover:opacity-80"
                      style={{ color: effectiveStyle.textColor }}
                    >
                      {title || '제목'}
                    </h3>
                  )}
                  {(subtitle || description) && (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                      className="text-sm mt-1 cursor-text hover:opacity-80"
                      style={{ color: effectiveStyle.textColor, opacity: 0.7 }}
                    >
                      {subtitle || description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // ===== 비대칭 분할 (NEW) =====
      case 'split':
        return (
          <div className="flex min-h-[450px]">
            <div className="w-[70%] relative overflow-hidden">
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 대각선 클립 효과 */}
              <div
                className="absolute inset-y-0 right-0 w-24"
                style={{
                  background: effectiveStyle.blockBackgroundColor,
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                }}
              />
            </div>
            <div
              className="w-[30%] flex flex-col justify-center p-6"
              style={{ background: effectiveStyle.blockBackgroundColor }}
            >
              <div className="space-y-4">
                {editingField === 'title' ? (
                  <input
                    type="text"
                    defaultValue={title}
                    className="w-full text-2xl font-bold bg-transparent border-b outline-none"
                    style={{ color: effectiveStyle.textColor, borderColor: effectiveStyle.textColor + '50' }}
                    onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : (
                  <h3
                    onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                    className="text-2xl font-bold cursor-text hover:opacity-80 transition leading-tight"
                    style={{ color: effectiveStyle.textColor }}
                  >
                    {title || '제목'}
                  </h3>
                )}
                {description && (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="text-sm cursor-text hover:opacity-80 leading-relaxed"
                    style={{ color: effectiveStyle.textColor, opacity: 0.8 }}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // ===== 기본 (vertical) =====
      default:
        return (
          <div className="flex flex-col">
            <div className="relative overflow-hidden">
              {ImageContent}
            </div>
            <div className="p-6">
              {TextContent}
            </div>
          </div>
        );
    }
  };

  // 추가 여백이 있으면 상하로 균등 분배
  const extraPadding = effectiveStyle.blockHeight || 0;

  return (
    <div
      onClick={onSelect}
      className={`relative transition-all overflow-hidden ${
        isSelected ? 'ring-4 ring-violet-500 ring-offset-4 ring-offset-slate-900' : ''
      }`}
      style={{
        width: effectiveStyle.blockWidth,
        backgroundColor: effectiveStyle.blockBackgroundColor,
        paddingTop: extraPadding / 2,
        paddingBottom: extraPadding / 2,
      }}
    >
      {/* 블록 번호 인디케이터 */}
      <div className="absolute -left-10 top-4 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {index + 1}
      </div>
      {renderLayout()}
    </div>
  );
}

// 속성 패널
function PropertyPanel({
  scenario,
  commonSettings,
  onCommonSettingsChange,
  onLayoutChange,
  onBlockStyleChange,
  onSaveCommonSettings,
  isSaving,
}: {
  scenario: Scenario | null;
  commonSettings: CommonBlockSettings;
  onCommonSettingsChange: (settings: CommonBlockSettings) => void;
  onLayoutChange: (preset: LayoutPreset) => void;
  onBlockStyleChange: (style: Partial<CommonBlockSettings> | null) => void;
  onSaveCommonSettings: () => void;
  isSaving: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'block' | 'global'>('block');

  const LAYOUT_OPTIONS: { id: LayoutPreset; label: string; icon: string; category?: string }[] = [
    // 기본
    { id: 'vertical', label: '기본', icon: '📱', category: '기본' },
    { id: 'text-first', label: '텍스트 위', icon: '📝', category: '기본' },
    { id: 'card', label: '카드', icon: '🎴', category: '기본' },
    // 가로형
    { id: 'horizontal-left', label: '좌 이미지', icon: '◧', category: '가로형' },
    { id: 'horizontal-right', label: '우 이미지', icon: '◨', category: '가로형' },
    { id: 'magazine', label: '매거진', icon: '📰', category: '가로형' },
    { id: 'split', label: '비대칭', icon: '⬓', category: '가로형' },
    // 오버레이
    { id: 'overlay-center', label: '중앙', icon: '🎯', category: '오버레이' },
    { id: 'overlay-top', label: '상단', icon: '⬆️', category: '오버레이' },
    { id: 'overlay-bottom', label: '하단', icon: '⬇️', category: '오버레이' },
    // 특수
    { id: 'hero', label: '히어로', icon: '🦸', category: '특수' },
    { id: 'minimal', label: '미니멀', icon: '✨', category: '특수' },
    { id: 'quote', label: '인용문', icon: '💬', category: '특수' },
    { id: 'fullwidth', label: '전체폭', icon: '🌅', category: '특수' },
    { id: 'image-dominant', label: '캡션', icon: '🖼️', category: '특수' },
  ];

  const FONT_FAMILIES = [
    { value: 'Pretendard, sans-serif', label: 'Pretendard' },
    { value: 'Noto Sans KR, sans-serif', label: 'Noto Sans' },
    { value: 'Nanum Gothic, sans-serif', label: '나눔고딕' },
    { value: 'Nanum Myeongjo, serif', label: '나눔명조' },
    { value: 'Georgia, serif', label: 'Georgia' },
  ];

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
          블록 설정
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
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* 글자 크기 */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">글자 크기</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="12"
                      max="24"
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
                              // 이미 선택된 경우 기본값으로 되돌림
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
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
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
                  max="24"
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

            {/* 저장 버튼 */}
            <button
              onClick={onSaveCommonSettings}
              disabled={isSaving}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
            >
              {isSaving ? '저장 중...' : '전체 스타일 저장'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 랜덤 배치용 레이아웃 목록
const RANDOM_LAYOUTS: LayoutPreset[] = [
  'vertical', 'text-first', 'card',
  'horizontal-left', 'horizontal-right', 'magazine', 'split',
  'overlay-center', 'overlay-top', 'overlay-bottom',
  'hero', 'minimal', 'quote', 'fullwidth', 'image-dominant',
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
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이동 후 드래그 시작 (클릭과 구분)
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

  // 랜덤 레이아웃 배치 함수
  const applyRandomLayouts = async (scenarioList: Scenario[], saveToServer = true) => {
    setIsRandomizing(true);
    const updatedScenarios = scenarioList.map((s, idx) => {
      const randomLayout = RANDOM_LAYOUTS[Math.floor(Math.random() * RANDOM_LAYOUTS.length)];
      return { ...s, layout_preset: randomLayout };
    });

    setScenarios(updatedScenarios);

    // 서버에 저장
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

      // 레이아웃이 없는 블록들에 랜덤 배치 적용
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

  // 공통 설정 저장
  const handleSaveCommonSettings = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ common_block_settings: commonSettings }),
      });
      alert('전체 스타일이 저장되었습니다.');
    } catch (error) {
      console.error('Error saving common settings:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 다운로드
  const handleDownload = async (format: 'png' | 'jpg') => {
    try {
      const { toCanvas } = await import('html-to-image');
      const blocks = document.querySelectorAll('.canvas-block');
      if (blocks.length === 0) return;

      const options = {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        useCORS: true,
        skipAutoScale: true,
        skipFonts: true, // 외부 웹폰트 CORS 에러 방지
        // 이미지 URL에 타임스탬프 추가하여 캐시 무효화
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        // no-download 클래스를 가진 요소는 제외
        filter: (node: HTMLElement) => {
          return !node.classList?.contains('no-download');
        },
        // 이미지 요청 시 추가 설정
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
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
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
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
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
                    onSelect={() => setSelectedId(scenario.id!)}
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
                <div key={scenario.id} className="canvas-block">
                  <CanvasBlock
                    scenario={scenario}
                    index={index}
                    isSelected={selectedId === scenario.id}
                    effectiveStyle={getEffectiveStyle(scenario)}
                    onSelect={() => setSelectedId(scenario.id!)}
                    onTitleChange={(text) => handleTitleEdit(scenario.id!, text)}
                    onSubtitleChange={(text) => handleSubtitleEdit(scenario.id!, text)}
                    onDescriptionChange={(text) => handleDescriptionEdit(scenario.id!, text)}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* 오른쪽 속성 패널 */}
        <aside className="w-80 border-l border-slate-800 flex-shrink-0">
          <PropertyPanel
            scenario={selectedScenario}
            commonSettings={commonSettings}
            onCommonSettingsChange={setCommonSettings}
            onLayoutChange={handleLayoutChange}
            onBlockStyleChange={handleBlockStyleChange}
            onSaveCommonSettings={handleSaveCommonSettings}
            isSaving={isSaving}
          />
        </aside>
      </div>
    </div>
  );
}
