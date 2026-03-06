'use client';

import { useState, useRef, useCallback } from 'react';
import { Scenario, CommonBlockSettings, BlockStyle } from '@/types';

export function CanvasBlock({
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
  onBlockStyleChange,
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
  onBlockStyleChange?: (style: BlockStyle | null) => void;
}) {
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textOffset, setTextOffset] = useState({ x: scenario.text_position_x || 0, y: scenario.text_position_y || 0 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const preset = scenario.layout_preset || 'vertical';

  // 이미지 조정 state
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [localScale, setLocalScale] = useState(scenario.block_style?.imageScale ?? 1);
  const [localOffsetX, setLocalOffsetX] = useState(scenario.block_style?.imageOffsetX ?? 0);
  const [localOffsetY, setLocalOffsetY] = useState(scenario.block_style?.imageOffsetY ?? 0);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  // 클로저에서 최신 state 참조용 ref
  const localScaleRef = useRef(localScale);
  localScaleRef.current = localScale;
  const localOffsetXRef = useRef(localOffsetX);
  localOffsetXRef.current = localOffsetX;
  const localOffsetYRef = useRef(localOffsetY);
  localOffsetYRef.current = localOffsetY;

  // 변경사항 저장
  const saveImageTransform = useCallback((scale: number, ox: number, oy: number) => {
    onBlockStyleChange?.({
      ...scenario.block_style,
      imageScale: scale === 1 ? undefined : scale,
      imageOffsetX: ox === 0 ? undefined : ox,
      imageOffsetY: oy === 0 ? undefined : oy,
    });
  }, [scenario.block_style, onBlockStyleChange]);

  // 이미지 컨테이너 드래그 → 블록 내부에서 위치 이동
  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSelected) {
      onSelect();
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startOX = localOffsetXRef.current;
    const startOY = localOffsetYRef.current;
    let didDrag = false;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!didDrag && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!didDrag) {
        didDrag = true;
        setIsDraggingImg(true);
      }
      ev.preventDefault();
      setLocalOffsetX(startOX + dx);
      setLocalOffsetY(startOY + dy);
    };
    const onUp = () => {
      if (didDrag) {
        setIsDraggingImg(false);
        saveImageTransform(localScaleRef.current, localOffsetXRef.current, localOffsetYRef.current);
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // 가장자리 핸들 드래그 → 크기 조절 (중심 기준 대칭 확대/축소)
  const handleResizeDragStart = (e: React.MouseEvent, edge: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw') => {
    e.preventDefault();
    e.stopPropagation();
    const startScale = localScaleRef.current;
    const startX = e.clientX;
    const startY = e.clientY;
    const refSize = imgContainerRef.current
      ? Math.max(imgContainerRef.current.offsetWidth, imgContainerRef.current.offsetHeight)
      : 400;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let delta = 0;
      if (edge === 'e')       delta = dx;
      else if (edge === 'w')  delta = -dx;
      else if (edge === 's')  delta = dy;
      else if (edge === 'n')  delta = -dy;
      else if (edge === 'se') delta = (dx + dy) / 2;
      else if (edge === 'nw') delta = (-dx - dy) / 2;
      else if (edge === 'ne') delta = (dx - dy) / 2;
      else if (edge === 'sw') delta = (-dx + dy) / 2;

      const newScale = Math.max(0.3, Math.min(4, startScale + delta / (refSize / 2)));
      setLocalScale(newScale);
    };
    const onUp = () => {
      saveImageTransform(localScaleRef.current, localOffsetXRef.current, localOffsetYRef.current);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const renderMainImage = (mode: 'fill' | 'natural' = 'natural') => {
    const hasTransform = localScale !== 1 || localOffsetX !== 0 || localOffsetY !== 0;

    type EdgeHandle = { edge: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'; style: React.CSSProperties };
    const handles: EdgeHandle[] = [
      { edge: 'n',  style: { top: -4, left: '50%', transform: 'translateX(-50%)', width: 36, height: 8, cursor: 'ns-resize' } },
      { edge: 's',  style: { bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 36, height: 8, cursor: 'ns-resize' } },
      { edge: 'e',  style: { right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 36, cursor: 'ew-resize' } },
      { edge: 'w',  style: { left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 36, cursor: 'ew-resize' } },
      { edge: 'nw', style: { top: -4, left: -4, width: 10, height: 10, cursor: 'nw-resize' } },
      { edge: 'ne', style: { top: -4, right: -4, width: 10, height: 10, cursor: 'ne-resize' } },
      { edge: 'sw', style: { bottom: -4, left: -4, width: 10, height: 10, cursor: 'sw-resize' } },
      { edge: 'se', style: { bottom: -4, right: -4, width: 10, height: 10, cursor: 'se-resize' } },
    ];

    const imgContent = (
      <>
        <img
          src={scenario.selected_image_url || ''}
          alt=""
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
          draggable={false}
        />
        {isSelected && handles.map(({ edge, style }) => (
          <div
            key={edge}
            className="absolute bg-violet-500 hover:bg-violet-300 rounded-sm z-20 no-download"
            style={{ position: 'absolute', ...style }}
            onMouseDown={(e) => handleResizeDragStart(e, edge)}
          />
        ))}
        {isSelected && hasTransform && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20 no-download">
            <span className="px-1.5 py-0.5 bg-black/60 text-white text-xs rounded tabular-nums">
              {Math.round(localScale * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalScale(1);
                setLocalOffsetX(0);
                setLocalOffsetY(0);
                saveImageTransform(1, 0, 0);
              }}
              className="px-1.5 py-0.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded"
            >
              초기화
            </button>
          </div>
        )}
      </>
    );

    if (mode === 'fill') {
      return (
        <div className="absolute inset-0">
          <div
            ref={imgContainerRef}
            onMouseDown={handleImageMouseDown}
            style={{
              position: 'absolute',
              left: `calc(50% + ${localOffsetX}px)`,
              top: `calc(50% + ${localOffsetY}px)`,
              width: `${localScale * 100}%`,
              height: `${localScale * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isSelected ? (isDraggingImg ? 'grabbing' : 'grab') : 'default',
            }}
          >
            {imgContent}
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <img
          src={scenario.selected_image_url || ''}
          alt=""
          className="w-full block"
          style={{ visibility: 'hidden' }}
          draggable={false}
        />
        <div
          ref={imgContainerRef}
          onMouseDown={handleImageMouseDown}
          style={{
            position: 'absolute',
            left: `calc(50% + ${localOffsetX}px)`,
            top: `calc(50% + ${localOffsetY}px)`,
            width: `${localScale * 100}%`,
            height: `${localScale * 100}%`,
            transform: 'translate(-50%, -50%)',
            cursor: isSelected ? (isDraggingImg ? 'grabbing' : 'grab') : 'default',
          }}
        >
          {imgContent}
        </div>
      </div>
    );
  };

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
      case 'text-first':
        return (
          <div className="flex flex-col">
            <div className="py-8 px-6 border-b-4" style={{ borderColor: effectiveStyle.textColor + '20' }}>
              {TextContent}
            </div>
            <div className="relative">
              {renderMainImage('natural')}
            </div>
          </div>
        );

      case 'horizontal-left':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-1/2 relative">
              {renderMainImage('fill')}
            </div>
            <div className="w-1/2 flex flex-col justify-center p-8 bg-gradient-to-r from-gray-50/50 to-transparent">
              {TextContent}
            </div>
          </div>
        );

      case 'horizontal-right':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-1/2 flex flex-col justify-center p-8 bg-gradient-to-l from-gray-50/50 to-transparent">
              {TextContent}
            </div>
            <div className="w-1/2 relative">
              {renderMainImage('fill')}
            </div>
          </div>
        );

      case 'magazine':
        return (
          <div className="flex min-h-[450px]">
            <div className="w-3/5 relative">
              {renderMainImage('fill')}
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white/20 to-transparent pointer-events-none z-10" />
            </div>
            <div className="w-2/5 flex flex-col justify-center p-8">
              <div className="border-l-4 pl-6" style={{ borderColor: effectiveStyle.textColor }}>
                {TextContent}
              </div>
            </div>
          </div>
        );

      case 'overlay-center':
      case 'overlay-top':
      case 'overlay-bottom':
        return (
          <div className="relative min-h-[500px] overflow-hidden">
            {renderMainImage('fill')}
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
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

      case 'card':
        return (
          <div className="rounded-2xl shadow-xl bg-white">
            <div className="aspect-[4/3] relative">
              {renderMainImage('fill')}
            </div>
            <div className="p-6">
              {TextContent}
            </div>
          </div>
        );

      case 'image-dominant':
        return (
          <div className="relative">
            {renderMainImage('natural')}
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

      case 'hero':
        return (
          <div className="relative min-h-[600px] overflow-hidden">
            {renderMainImage('fill')}
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

      case 'minimal':
        return (
          <div className="p-12 space-y-8">
            <div className="max-w-md mx-auto text-center space-y-4">
              {TextContent}
            </div>
            <div className="max-w-lg mx-auto">
              <div className="rounded-lg shadow-lg">
                {renderMainImage('natural')}
              </div>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="flex min-h-[400px]">
            <div className="w-2/5 relative">
              {renderMainImage('fill')}
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

      case 'fullwidth':
        return (
          <div className="relative">
            {renderMainImage('natural')}
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

      case 'split':
        return (
          <div className="flex min-h-[450px]">
            <div className="w-[70%] relative">
              {renderMainImage('fill')}
              <div
                className="absolute inset-y-0 right-0 w-24 pointer-events-none z-10"
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

      case 'triple-masonry':
        return (
          <div className="grid grid-cols-3 gap-1" style={{ minHeight: '450px' }}>
            <div className="col-span-2 row-span-2 relative">
              {renderImageSlot(0, true)}
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
            <div className="row-span-2 flex flex-col gap-1">
              <div className="flex-1 relative">
                {renderImageSlot(1)}
              </div>
              <div className="flex-1 relative">
                {renderImageSlot(2)}
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

      default:
        return (
          <div className="flex flex-col">
            <div className="relative">
              {renderMainImage('natural')}
            </div>
            <div className="p-6">
              {TextContent}
            </div>
          </div>
        );
    }
  };

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
      <div className="absolute -left-10 top-4 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {index + 1}
      </div>
      {renderLayout()}
    </div>
  );
}
