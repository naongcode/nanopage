'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Scenario, Project, CommonBlockSettings, ImageCrop, LayoutPreset } from '@/types';
import { DEFAULT_COMMON_SETTINGS, FONT_FAMILIES as SHARED_FONT_FAMILIES, FONT_WEIGHTS as SHARED_FONT_WEIGHTS } from '@/lib/block-settings-defaults';
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
import { uploadImages } from '@/lib/upload';

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
  onAdditionalImageAdd,
  onAdditionalImageRemove,
  onImagesReorder,
  onTextPositionChange,
}: {
  scenario: Scenario;
  index: number;
  isSelected: boolean;
  effectiveStyle: CommonBlockSettings;
  onSelect: () => void;
  onTitleChange: (text: string) => void;
  onSubtitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onAdditionalImageAdd?: (slotIndex: number, file: File) => void;
  onAdditionalImageRemove?: (slotIndex: number) => void;
  onImagesReorder?: (fromIndex: number, toIndex: number) => void;
  onTextPositionChange?: (x: number, y: number) => void;
}) {
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textOffset, setTextOffset] = useState({ x: scenario.text_position_x || 0, y: scenario.text_position_y || 0 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const preset = scenario.layout_preset || 'vertical';

  // 텍스트 드래그 핸들러
  const textOffsetRef = useRef(textOffset);
  textOffsetRef.current = textOffset;

  const handleTextDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingText(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: textOffset.x,
      startY: textOffset.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;
      setTextOffset({ x: newX, y: newY });
      textOffsetRef.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDraggingText(false);
      onTextPositionChange?.(textOffsetRef.current.x, textOffsetRef.current.y);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 멀티 이미지 슬롯 렌더링
  const renderImageSlot = (slotIndex: number, isMain: boolean = false) => {
    const imgUrl = slotIndex === 0
      ? scenario.selected_image_url
      : scenario.additional_image_urls?.[slotIndex - 1];

    const isDragging = draggedSlot === slotIndex;
    const isDragOver = dragOverSlot === slotIndex && draggedSlot !== slotIndex;

    return (
      <div
        key={slotIndex}
        draggable={!!imgUrl}
        onDragStart={(e) => {
          setDraggedSlot(slotIndex);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDraggedSlot(null);
          setDragOverSlot(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverSlot(slotIndex);
        }}
        onDragLeave={() => setDragOverSlot(null)}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedSlot !== null && draggedSlot !== slotIndex && onImagesReorder) {
            onImagesReorder(draggedSlot, slotIndex);
          }
          setDraggedSlot(null);
          setDragOverSlot(null);
        }}
        className={`relative group bg-slate-200 flex items-center justify-center overflow-hidden transition-all h-full
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${isDragOver ? 'ring-4 ring-violet-500 ring-inset' : ''}
          ${imgUrl ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        `}
      >
        {imgUrl ? (
          <>
            <img src={imgUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            {/* 삭제 버튼 (메인 이미지 제외) */}
            {slotIndex > 0 && onAdditionalImageRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdditionalImageRemove(slotIndex - 1);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold shadow-lg"
              >
                x
              </button>
            )}
            {/* 드래그 힌트 */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
              드래그로 이동
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors">
            <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-slate-500 text-sm font-medium">
              {isMain ? '메인 이미지' : `이미지 ${slotIndex + 1}`}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onAdditionalImageAdd) {
                  onAdditionalImageAdd(slotIndex, file);
                }
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    );
  };

  const title = scenario.title_text || '';
  const subtitle = scenario.subtitle_text || '';
  const description = scenario.user_edited_description_text || scenario.description_text || '';

  // 드래그 핸들 아이콘
  const DragHandle = (
    <button
      onMouseDown={handleTextDragStart}
      className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover/text:opacity-100 transition-opacity ${isDraggingText ? '!opacity-100 bg-violet-700' : ''}`}
      style={{ cursor: isDraggingText ? 'grabbing' : 'grab' }}
      title="드래그하여 텍스트 이동"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );

  const fs = effectiveStyle.textFontSize;
  const titleSize = Math.round(fs * 1.4);
  const subtitleSize = Math.round(fs * 0.8);

  const TextContent = (
    <div
      className="relative group/text"
      style={{
        transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
        transition: isDraggingText ? 'none' : 'transform 0.2s ease',
      }}
    >
      {DragHandle}
      {(textOffset.x !== 0 || textOffset.y !== 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTextOffset({ x: 0, y: 0 });
            onTextPositionChange?.(0, 0);
          }}
          className="absolute -top-3 right-0 z-20 px-2 py-0.5 rounded bg-slate-500 hover:bg-slate-600 text-white text-xs opacity-0 group-hover/text:opacity-100 transition-opacity no-download"
          title="위치 초기화"
        >
          초기화
        </button>
      )}
    <div className="space-y-2 p-4" style={{ fontWeight: effectiveStyle.textFontWeight }}>
      {/* 제목 - 선택사항 */}
      {editingField === 'title' ? (
        <input
          type="text"
          defaultValue={title}
          placeholder="제목 (선택사항)"
          className="w-full px-2 py-1 font-bold border-b-2 border-violet-400 outline-none bg-transparent"
          style={{
            fontSize: `${titleSize}px`,
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
          className="font-bold cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition"
          style={{
            fontSize: `${titleSize}px`,
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
          className="w-full px-2 py-1 border-b border-violet-300 outline-none bg-transparent"
          style={{
            fontSize: `${subtitleSize}px`,
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
          className="cursor-text hover:bg-black/5 rounded px-1 -mx-1 transition"
          style={{
            fontSize: `${subtitleSize}px`,
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

  // 오버레이용 드래그 핸들 (밝은 배경 위)
  const OverlayDragHandle = (
    <button
      onMouseDown={handleTextDragStart}
      className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-violet-600 flex items-center justify-center shadow-lg opacity-0 group-hover/text:opacity-100 transition-opacity ${isDraggingText ? '!opacity-100 bg-white' : ''}`}
      style={{ cursor: isDraggingText ? 'grabbing' : 'grab' }}
      title="드래그하여 텍스트 이동"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );

  const OverlayResetButton = (
    <>
      {(textOffset.x !== 0 || textOffset.y !== 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTextOffset({ x: 0, y: 0 });
            onTextPositionChange?.(0, 0);
          }}
          className="absolute -top-3 right-0 z-20 px-2 py-0.5 rounded bg-white/70 hover:bg-white text-slate-700 text-xs opacity-0 group-hover/text:opacity-100 transition-opacity no-download"
          title="위치 초기화"
        >
          초기화
        </button>
      )}
    </>
  );

  // 오버레이 텍스트 컴포넌트 (재사용)
  const OverlayTextContent = ({ position = 'center' }: { position?: 'top' | 'center' | 'bottom' }) => {
    const overlayTextColor = getOverlayTextColor();
    return (
      <div
        className="absolute inset-x-0 px-8 group/text"
        style={{
          top: position === 'top' ? '2rem' : position === 'center' ? '50%' : 'auto',
          bottom: position === 'bottom' ? '2rem' : 'auto',
          transform: position === 'center'
            ? `translateY(-50%) translate(${textOffset.x}px, ${textOffset.y}px)`
            : `translate(${textOffset.x}px, ${textOffset.y}px)`,
          transition: isDraggingText ? 'none' : 'transform 0.2s ease',
        }}
      >
        {OverlayDragHandle}
        {OverlayResetButton}
        <div
          className="space-y-3"
          style={{
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)',
            textAlign: effectiveStyle.textAlign,
            fontFamily: effectiveStyle.textFontFamily,
            fontWeight: effectiveStyle.textFontWeight,
          }}
        >
          {editingField === 'title' ? (
            <input
              type="text"
              defaultValue={title}
              placeholder="제목 (선택사항)"
              className="w-full px-3 py-2 font-bold border-b-2 border-white/50 outline-none bg-black/30 rounded-lg backdrop-blur-sm"
              style={{ fontSize: `${titleSize}px`, color: overlayTextColor, fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}
              onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onTitleChange(e.currentTarget.value); setEditingField(null); }}}
              autoFocus
            />
          ) : title ? (
            <h3
              onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
              className="w-full font-bold cursor-text hover:opacity-80 transition leading-tight"
              style={{ fontSize: `${titleSize}px`, color: overlayTextColor, textAlign: effectiveStyle.textAlign }}
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
              className="w-full px-3 py-1 border-b border-white/30 outline-none bg-black/30 rounded-lg backdrop-blur-sm"
              style={{ fontSize: `${subtitleSize}px`, color: overlayTextColor, opacity: 0.9, fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign }}
              onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onSubtitleChange(e.currentTarget.value); setEditingField(null); }}}
              autoFocus
            />
          ) : subtitle ? (
            <p
              onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
              className="w-full cursor-text hover:opacity-80 transition"
              style={{ fontSize: `${subtitleSize}px`, color: overlayTextColor, opacity: 0.9, textAlign: effectiveStyle.textAlign }}
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
              className="absolute bottom-0 left-0 right-0 py-4 px-6 group/text"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                transition: isDraggingText ? 'none' : 'transform 0.2s ease',
              }}
            >
              {OverlayDragHandle}
              {OverlayResetButton}
              <p
                onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                className="text-white text-center cursor-text hover:opacity-80 transition font-medium"
                style={{ fontSize: `${fs}px`, textShadow: '0 1px 3px rgba(0,0,0,0.5)', fontFamily: effectiveStyle.textFontFamily }}
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
            <div
              className="absolute inset-0 flex items-center group/text"
              style={{
                transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                transition: isDraggingText ? 'none' : 'transform 0.2s ease',
              }}
            >
              {OverlayDragHandle}
              {OverlayResetButton}
              <div className="w-full px-10 py-12 space-y-5" style={{ fontFamily: effectiveStyle.textFontFamily, textAlign: effectiveStyle.textAlign, fontWeight: effectiveStyle.textFontWeight, textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)' }}>
                {editingField === 'title' ? (
                  <input
                    type="text"
                    defaultValue={title}
                    placeholder="제목 (선택사항)"
                    className="w-full font-black bg-transparent border-b-2 border-white/50 outline-none text-white"
                    style={{ fontSize: `${Math.round(titleSize * 1.5)}px`, textShadow: '0 4px 12px rgba(0,0,0,0.5)', textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : title ? (
                  <h2
                    onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                    className="w-full font-black text-white cursor-text hover:opacity-80 transition"
                    style={{ fontSize: `${Math.round(titleSize * 1.5)}px`, textShadow: '0 4px 12px rgba(0,0,0,0.5)', lineHeight: '1.1', textAlign: effectiveStyle.textAlign }}
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
                    className="w-full bg-transparent border-b border-white/30 outline-none text-white/90"
                    style={{ fontSize: `${subtitleSize}px`, textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : subtitle ? (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                    className="w-full text-white/90 cursor-text hover:opacity-80"
                    style={{ fontSize: `${subtitleSize}px`, textAlign: effectiveStyle.textAlign }}
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
                    className="w-full bg-transparent border border-white/30 rounded outline-none text-white/80 p-2 resize-none"
                    style={{ fontSize: `${fs}px`, textAlign: effectiveStyle.textAlign }}
                    onBlur={(e) => { onDescriptionChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : description ? (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="w-full text-white/80 cursor-text hover:opacity-80 leading-relaxed whitespace-pre-line"
                    style={{ fontSize: `${fs}px`, textAlign: effectiveStyle.textAlign }}
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
            <div className="w-3/5 flex flex-col justify-center p-10 relative group/text">
              {DragHandle}
              {(textOffset.x !== 0 || textOffset.y !== 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTextOffset({ x: 0, y: 0 });
                    onTextPositionChange?.(0, 0);
                  }}
                  className="absolute -top-3 right-0 z-20 px-2 py-0.5 rounded bg-slate-500 hover:bg-slate-600 text-white text-xs opacity-0 group-hover/text:opacity-100 transition-opacity no-download"
                  title="위치 초기화"
                >
                  초기화
                </button>
              )}
              {/* 큰 따옴표 */}
              <div
                className="absolute top-6 left-6 text-8xl opacity-10 font-serif leading-none select-none"
                style={{ color: effectiveStyle.textColor }}
              >
                "
              </div>
              <div
                className="relative z-10 pl-8"
                style={{
                  transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                  transition: isDraggingText ? 'none' : 'transform 0.2s ease',
                }}
              >
                {editingField === 'description' ? (
                  <textarea
                    defaultValue={description}
                    className="w-full italic bg-transparent border-b border-gray-300 outline-none resize-none"
                    style={{ fontSize: `${Math.round(fs * 1.2)}px`, color: effectiveStyle.textColor, fontFamily: effectiveStyle.textFontFamily }}
                    rows={4}
                    onBlur={(e) => { onDescriptionChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="italic cursor-text hover:opacity-80 transition leading-relaxed whitespace-pre-line"
                    style={{ fontSize: `${Math.round(fs * 1.2)}px`, color: effectiveStyle.textColor, fontFamily: effectiveStyle.textFontFamily }}
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
                      className="w-full bg-transparent border-b border-gray-200 outline-none mt-1"
                      style={{ fontSize: `${subtitleSize}px`, color: effectiveStyle.textColor, opacity: 0.6 }}
                      onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onSubtitleChange(e.currentTarget.value); setEditingField(null); }}}
                      autoFocus
                    />
                  ) : subtitle ? (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                      className="opacity-60 cursor-text hover:opacity-80 mt-1"
                      style={{ fontSize: `${subtitleSize}px`, color: effectiveStyle.textColor }}
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
              className="absolute bottom-6 left-6 right-6 p-6 rounded-xl backdrop-blur-md group/text"
              style={{
                background: 'rgba(255,255,255,0.9)',
                transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                transition: isDraggingText ? 'none' : 'transform 0.2s ease',
              }}
            >
              {OverlayDragHandle}
              {OverlayResetButton}
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      defaultValue={title}
                      className="w-full font-bold bg-transparent border-b border-gray-300 outline-none"
                      style={{ fontSize: `${titleSize}px`, color: effectiveStyle.textColor }}
                      onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                      autoFocus
                    />
                  ) : (
                    <h3
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="font-bold cursor-text hover:opacity-80"
                      style={{ fontSize: `${titleSize}px`, color: effectiveStyle.textColor }}
                    >
                      {title || '제목'}
                    </h3>
                  )}
                  {(subtitle || description) && (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                      className="mt-1 cursor-text hover:opacity-80 whitespace-pre-line"
                      style={{ fontSize: `${subtitleSize}px`, color: effectiveStyle.textColor, opacity: 0.7 }}
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
              className="w-[30%] flex flex-col justify-center p-6 relative"
              style={{ background: effectiveStyle.blockBackgroundColor }}
            >
              <div
                className="space-y-4 relative group/text"
                style={{
                  transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                  transition: isDraggingText ? 'none' : 'transform 0.2s ease',
                }}
              >
                {DragHandle}
                {(textOffset.x !== 0 || textOffset.y !== 0) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextOffset({ x: 0, y: 0 });
                      onTextPositionChange?.(0, 0);
                    }}
                    className="absolute -top-3 right-0 z-20 px-2 py-0.5 rounded bg-slate-500 hover:bg-slate-600 text-white text-xs opacity-0 group-hover/text:opacity-100 transition-opacity no-download"
                    title="위치 초기화"
                  >
                    초기화
                  </button>
                )}
                {editingField === 'title' ? (
                  <input
                    type="text"
                    defaultValue={title}
                    className="w-full font-bold bg-transparent border-b outline-none"
                    style={{ fontSize: `${titleSize}px`, color: effectiveStyle.textColor, borderColor: effectiveStyle.textColor + '50' }}
                    onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                    autoFocus
                  />
                ) : (
                  <h3
                    onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                    className="font-bold cursor-text hover:opacity-80 transition leading-tight"
                    style={{ fontSize: `${titleSize}px`, color: effectiveStyle.textColor }}
                  >
                    {title || '제목'}
                  </h3>
                )}
                {description && (
                  <p
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                    className="cursor-text hover:opacity-80 leading-relaxed whitespace-pre-line"
                    style={{ fontSize: `${subtitleSize}px`, color: effectiveStyle.textColor, opacity: 0.8 }}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // ===== 멀티 이미지: 3단 가로 =====
      case 'triple-row':
        return (
          <div className="flex flex-col">
            <div className="grid grid-cols-3 gap-2" style={{ minHeight: '250px' }}>
              {renderImageSlot(0, true)}
              {renderImageSlot(1)}
              {renderImageSlot(2)}
            </div>
            <div className="p-6">{TextContent}</div>
          </div>
        );

      // ===== 멀티 이미지: 3단 세로 =====
      case 'triple-column':
        return (
          <div className="flex min-h-[500px]">
            <div className="flex flex-col gap-2 w-3/5">
              {renderImageSlot(0, true)}
              {renderImageSlot(1)}
              {renderImageSlot(2)}
            </div>
            <div className="w-2/5 flex flex-col justify-center p-6">{TextContent}</div>
          </div>
        );

      // ===== 멀티 이미지: 메인+서브 =====
      case 'triple-featured':
        return (
          <div className="flex flex-col">
            <div className="grid grid-cols-2 grid-rows-2 gap-2" style={{ height: '400px' }}>
              <div className="row-span-2">
                {renderImageSlot(0, true)}
              </div>
              {renderImageSlot(1)}
              {renderImageSlot(2)}
            </div>
            <div className="p-6">{TextContent}</div>
          </div>
        );

      // ===== 멀티 이미지: 매거진 그리드 =====
      case 'triple-masonry':
        return (
          <div className="grid grid-cols-3 gap-1" style={{ minHeight: '450px' }}>
            {/* 메인 이미지 (2/3) + 텍스트 오버레이 */}
            <div className="col-span-2 row-span-2 relative">
              {renderImageSlot(0, true)}
              {/* 하단 그라데이션 + 텍스트 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-6 px-6">
                <div className="space-y-2">
                  {editingField === 'title' ? (
                    <input
                      type="text"
                      defaultValue={title}
                      placeholder="제목"
                      className="w-full font-bold bg-transparent border-b border-white/50 outline-none text-white"
                      style={{ fontSize: `${titleSize}px`, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      onBlur={(e) => { onTitleChange(e.target.value); setEditingField(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onTitleChange(e.currentTarget.value); setEditingField(null); }}}
                      autoFocus
                    />
                  ) : (
                    <h3
                      onClick={(e) => { e.stopPropagation(); setEditingField('title'); }}
                      className="font-bold text-white cursor-text hover:opacity-80 transition"
                      style={{ fontSize: `${titleSize}px`, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                      {title || '제목을 입력하세요'}
                    </h3>
                  )}
                  {editingField === 'subtitle' ? (
                    <input
                      type="text"
                      defaultValue={subtitle}
                      placeholder="부제목"
                      className="w-full bg-transparent border-b border-white/30 outline-none text-white/80"
                      style={{ fontSize: `${subtitleSize}px` }}
                      onBlur={(e) => { onSubtitleChange(e.target.value); setEditingField(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { onSubtitleChange(e.currentTarget.value); setEditingField(null); }}}
                      autoFocus
                    />
                  ) : subtitle ? (
                    <p
                      onClick={(e) => { e.stopPropagation(); setEditingField('subtitle'); }}
                      className="text-white/80 cursor-text hover:opacity-80"
                      style={{ fontSize: `${subtitleSize}px` }}
                    >
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            {/* 우측 서브 이미지들 (1/3) */}
            <div className="row-span-2 flex flex-col gap-1">
              <div className="flex-1 relative">
                {renderImageSlot(1)}
              </div>
              <div className="flex-1 relative">
                {renderImageSlot(2)}
                {/* 본문은 마지막 이미지 하단에 작게 */}
                {description && (
                  <div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3"
                    onClick={(e) => { e.stopPropagation(); setEditingField('description'); }}
                  >
                    <p className="text-white/90 line-clamp-2 cursor-text hover:opacity-80 whitespace-pre-line" style={{ fontSize: `${Math.round(fs * 0.7)}px` }}>
                      {description}
                    </p>
                  </div>
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
}: {
  scenario: Scenario | null;
  commonSettings: CommonBlockSettings;
  onCommonSettingsChange: (settings: CommonBlockSettings) => void;
  onLayoutChange: (preset: LayoutPreset) => void;
  onBlockStyleChange: (style: Partial<CommonBlockSettings> | null) => void;
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
    // 멀티 이미지 (3개)
    { id: 'triple-row', label: '3단 가로', icon: '🖼️', category: '멀티' },
    { id: 'triple-column', label: '3단 세로', icon: '📋', category: '멀티' },
    { id: 'triple-featured', label: '메인+서브', icon: '🎨', category: '멀티' },
    { id: 'triple-masonry', label: '매거진3', icon: '📰', category: '멀티' },
  ];

  const FONT_FAMILIES = SHARED_FONT_FAMILIES;

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
                    {FONT_FAMILIES.map((f) => (
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

            {/* 자동 저장 안내 */}
            <p className="text-center text-xs text-slate-500 py-2">
              변경사항이 자동 저장됩니다
            </p>
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
      const urls = await uploadImages([file]);
      const url = urls[0];

      // 현재 시나리오 가져오기
      const scenario = scenarios.find((s) => s.id === scenarioId);
      const currentImages = scenario?.additional_image_urls || [];

      // 슬롯 인덱스에 맞게 배열 업데이트
      const newImages = [...currentImages];
      if (slotIndex === 0) {
        // 메인 이미지는 selected_image_url 업데이트
        await fetch(`/api/scenarios/${scenarioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selected_image_url: url }),
        });
        setScenarios((prev) =>
          prev.map((s) => (s.id === scenarioId ? { ...s, selected_image_url: url } : s))
        );
      } else {
        // 추가 이미지는 additional_image_urls 업데이트
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

      // 해당 슬롯의 이미지를 빈 문자열로 설정 (위치 유지)
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

      // 모든 이미지를 하나의 배열로 만듦 (메인 + 추가)
      const allImages = [
        scenario.selected_image_url || '',
        ...(scenario.additional_image_urls || []),
      ];

      // 3개 슬롯 보장
      while (allImages.length < 3) allImages.push('');

      // 위치 교환
      const temp = allImages[fromIndex];
      allImages[fromIndex] = allImages[toIndex];
      allImages[toIndex] = temp;

      // 업데이트 데이터 준비
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
    // 사용 중인 폰트 패밀리 수집
    const usedFamilies = new Set<string>();
    scenarios.forEach(s => {
      const style = { ...commonSettings, ...(s.block_style || {}) };
      usedFamilies.add(style.textFontFamily || commonSettings.textFontFamily);
    });

    let css = '';

    // Google Fonts CSS 가져오기 (fetch API는 CORS 지원)
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

    // MaruBuri
    if (Array.from(usedFamilies).some(f => f.includes('MaruBuri'))) {
      css += `@font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; }\n`;
      css += `@font-face { font-family: 'MaruBuri'; src: url('https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; }\n`;
    }

    // Pretendard (사용 중인 weight만)
    if (Array.from(usedFamilies).some(f => f.includes('Pretendard'))) {
      try {
        const ptRes = await fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        const ptText = await ptRes.text();
        // relative URL을 absolute로 변환
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

    // 모든 font URL을 data URI로 변환
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

      // 폰트 임베딩 CSS 빌드 (cssRules CORS 에러 방지)
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
                    onAdditionalImageAdd={(slotIndex, file) => handleAdditionalImageAdd(scenario.id!, slotIndex, file)}
                    onAdditionalImageRemove={(slotIndex) => handleAdditionalImageRemove(scenario.id!, slotIndex)}
                    onImagesReorder={(from, to) => handleImagesReorder(scenario.id!, from, to)}
                    onTextPositionChange={(x, y) => handleTextPositionChange(scenario.id!, x, y)}
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
          />
        </aside>
      </div>
    </div>
  );
}
