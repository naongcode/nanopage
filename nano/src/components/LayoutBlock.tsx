'use client';

import { useState } from 'react';
import { Scenario, CommonBlockSettings } from '@/types';
import { getLayoutPresetConfig } from '@/lib/layout-presets';
import { ImageWithCrop } from './ImageWithCrop';
import { Rnd } from 'react-rnd';

interface LayoutBlockProps {
  scenario: Scenario;
  effectiveStyle: CommonBlockSettings;
  isEditingCrop: boolean;
  onCropSave: (crop: any) => void;
  onCropEditComplete: () => void;
  onTitleEdit: (text: string) => void;
  onSubtitleEdit: (text: string) => void;
  onDescriptionEdit: (text: string) => void;
  onTextPositionChange: (x: number, y: number, width: number, height: number) => void;
  onAdditionalImageAdd?: (index: number, url: string) => void;
  onAdditionalImageRemove?: (index: number) => void;
}

type EditingField = 'title' | 'subtitle' | 'description' | null;

export function LayoutBlock({
  scenario,
  effectiveStyle,
  isEditingCrop,
  onCropSave,
  onCropEditComplete,
  onTitleEdit,
  onSubtitleEdit,
  onDescriptionEdit,
  onTextPositionChange,
  onAdditionalImageAdd,
  onAdditionalImageRemove,
}: LayoutBlockProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);

  const presetConfig = getLayoutPresetConfig(scenario.layout_preset);

  const title = scenario.title_text || '';
  const subtitle = scenario.subtitle_text || '';
  const description = scenario.user_edited_description_text || scenario.description_text || '';

  // 이미지 컴포넌트
  const ImageContent = isEditingCrop ? (
    <ImageWithCrop
      imageUrl={scenario.selected_image_url || ''}
      crop={scenario.image_crop || null}
      isEditing={true}
      onCropChange={onCropSave}
      onEditComplete={onCropEditComplete}
    />
  ) : (
    <ImageWithCrop
      imageUrl={scenario.selected_image_url || ''}
      crop={scenario.image_crop || null}
      isEditing={false}
      onCropChange={() => {}}
      onEditComplete={() => {}}
    />
  );

  // 상세페이지용 텍스트 컴포넌트
  const TextContent = (
    <div className="flex flex-col gap-4">
      {/* 부제목 - 캐치프레이즈 역할 */}
      {editingField === 'subtitle' ? (
        <input
          type="text"
          defaultValue={subtitle}
          className="w-full py-1 text-xs tracking-widest uppercase border-b border-gray-200 focus:border-gray-400 outline-none bg-transparent"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            opacity: 0.5,
            textAlign: effectiveStyle.textAlign,
          }}
          onBlur={(e) => {
            onSubtitleEdit(e.target.value);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSubtitleEdit(e.currentTarget.value);
              setEditingField(null);
            }
          }}
          autoFocus
        />
      ) : (
        <p
          onClick={() => setEditingField('subtitle')}
          className="text-xs tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            opacity: 0.5,
            textAlign: effectiveStyle.textAlign,
          }}
        >
          {subtitle || 'SPECIAL EDITION'}
        </p>
      )}

      {/* 제목 - 상품명/핵심 메시지 */}
      {editingField === 'title' ? (
        <input
          type="text"
          defaultValue={title}
          className="w-full py-1 text-3xl font-bold border-b-2 border-gray-400 focus:border-gray-600 outline-none bg-transparent"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
          }}
          onBlur={(e) => {
            onTitleEdit(e.target.value);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onTitleEdit(e.currentTarget.value);
              setEditingField(null);
            }
          }}
          autoFocus
        />
      ) : (
        <h2
          onClick={() => setEditingField('title')}
          className="text-3xl font-bold cursor-pointer hover:opacity-70 transition-opacity leading-tight"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
            wordBreak: 'keep-all',
          }}
        >
          {title || '당신의 일상을 바꿀 단 하나의 선택'}
        </h2>
      )}

      {/* 본문 - 상품 설명 */}
      {editingField === 'description' ? (
        <textarea
          defaultValue={description}
          className="w-full p-2 border border-gray-200 rounded resize-none focus:ring-1 focus:ring-gray-300 outline-none"
          rows={4}
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            lineHeight: '1.8',
          }}
          onBlur={(e) => {
            onDescriptionEdit(e.target.value);
            setEditingField(null);
          }}
          autoFocus
        />
      ) : (
        <p
          onClick={() => setEditingField('description')}
          className="cursor-pointer hover:opacity-70 transition-opacity whitespace-pre-line leading-relaxed"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            opacity: 0.75,
            textAlign: effectiveStyle.textAlign,
            wordBreak: 'keep-all',
          }}
        >
          {description || '완벽한 디테일과 프리미엄 소재로 완성된 제품입니다. 오랜 시간 연구 끝에 탄생한 이 제품은 당신의 라이프스타일에 특별함을 더해줄 것입니다.'}
        </p>
      )}
    </div>
  );

  // 오버레이 타입
  if (presetConfig.isOverlay) {
    return (
      <div className="relative" style={{ minHeight: '600px', width: '100%' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-full">
            {isEditingCrop ? (
              <ImageWithCrop
                imageUrl={scenario.selected_image_url || ''}
                crop={scenario.image_crop || null}
                isEditing={true}
                onCropChange={onCropSave}
                onEditComplete={onCropEditComplete}
              />
            ) : (
              <img
                src={scenario.selected_image_url || ''}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        <Rnd
          position={{
            x: scenario.text_position_x || presetConfig.defaultTextPosition?.x || 50,
            y: scenario.text_position_y || presetConfig.defaultTextPosition?.y || 100,
          }}
          size={{
            width: scenario.text_width || presetConfig.defaultTextPosition?.width || 600,
            height: scenario.text_height || presetConfig.defaultTextPosition?.height || 'auto',
          }}
          onDragStop={(e, d) => {
            onTextPositionChange(
              d.x,
              d.y,
              scenario.text_width || presetConfig.defaultTextPosition?.width || 600,
              scenario.text_height || presetConfig.defaultTextPosition?.height || 80
            );
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            onTextPositionChange(
              position.x,
              position.y,
              parseInt(ref.style.width),
              parseInt(ref.style.height)
            );
          }}
          bounds="parent"
          className="border border-dashed border-gray-400/60"
          style={{ borderRadius: '6px' }}
        >
          <div
            className="h-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.97)',
              padding: '1.5rem 2rem',
              borderRadius: '6px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {TextContent}
          </div>
        </Rnd>
      </div>
    );
  }

  // 세로형 레이아웃
  if (presetConfig.layoutType === 'vertical') {
    // 텍스트 우선 - 강조 문구 먼저
    if (presetConfig.id === 'text-first') {
      return (
        <div className="w-full">
          <div className="px-6 py-10 text-center max-w-2xl mx-auto">{TextContent}</div>
          <div className="w-full">{ImageContent}</div>
        </div>
      );
    }
    // 이미지 중심 - 짧은 캡션만
    if (presetConfig.id === 'image-dominant') {
      return (
        <div className="w-full">
          <div className="w-full">{ImageContent}</div>
          <div className="py-4 px-6 text-center">{TextContent}</div>
        </div>
      );
    }
    // 카드형 - 정사각 이미지 + 설명
    if (presetConfig.id === 'card') {
      return (
        <div className="w-full">
          <div className="aspect-square overflow-hidden">{ImageContent}</div>
          <div className="py-8 px-8">{TextContent}</div>
        </div>
      );
    }
    // 미니멀 - 여백 많이
    if (presetConfig.id === 'minimal') {
      return (
        <div className="w-full py-12">
          <div className="px-10 mb-8 max-w-xl mx-auto text-center">{TextContent}</div>
          <div className="w-full">{ImageContent}</div>
        </div>
      );
    }
    // 기본 세로형
    return (
      <div className="w-full">
        <div className="w-full">{ImageContent}</div>
        <div className="py-8 px-8">{TextContent}</div>
      </div>
    );
  }

  // 가로형 레이아웃
  if (presetConfig.layoutType === 'horizontal') {
    // magazine: 프리미엄 매거진 스타일
    if (presetConfig.id === 'magazine') {
      return (
        <div className="flex items-stretch w-full" style={{ minHeight: '450px' }}>
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '58%' }}>{ImageContent}</div>
          <div
            className="flex flex-col justify-center bg-neutral-50"
            style={{ width: '42%', padding: '3rem' }}
          >
            {TextContent}
          </div>
        </div>
      );
    }

    // quote: 인용문/추천사 스타일
    if (presetConfig.id === 'quote') {
      return (
        <div className="flex items-stretch w-full" style={{ minHeight: '380px' }}>
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '45%' }}>{ImageContent}</div>
          <div
            className="flex flex-col justify-center pl-10 pr-8 py-8"
            style={{ width: '55%' }}
          >
            {TextContent}
          </div>
        </div>
      );
    }

    // split: 비대칭 분할
    if (presetConfig.id === 'split') {
      return (
        <div className="flex items-stretch w-full" style={{ minHeight: '400px' }}>
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '62%' }}>{ImageContent}</div>
          <div
            className="flex flex-col justify-center bg-stone-100"
            style={{ width: '38%', padding: '2.5rem' }}
          >
            {TextContent}
          </div>
        </div>
      );
    }

    // horizontal-right: 텍스트 좌, 이미지 우
    if (presetConfig.id === 'horizontal-right') {
      return (
        <div className="flex items-stretch w-full" style={{ minHeight: '400px' }}>
          <div
            className="flex flex-col justify-center pr-10 pl-8 py-8"
            style={{ width: '45%' }}
          >
            {TextContent}
          </div>
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '55%' }}>{ImageContent}</div>
        </div>
      );
    }

    // 기본 horizontal-left: 이미지 좌, 텍스트 우
    return (
      <div className="flex items-stretch w-full" style={{ minHeight: '400px' }}>
        <div className="flex-shrink-0 overflow-hidden" style={{ width: '55%' }}>{ImageContent}</div>
        <div
          className="flex flex-col justify-center pl-10 pr-8 py-8"
          style={{ width: '45%' }}
        >
          {TextContent}
        </div>
      </div>
    );
  }

  // 멀티 이미지 레이아웃
  if (presetConfig.layoutType === 'multi-image') {
    const mainImage = scenario.selected_image_url || '';
    const additionalImages = scenario.additional_image_urls || [];
    const allImages = [mainImage, ...additionalImages];

    // 이미지 슬롯 컴포넌트
    const ImageSlot = ({ index, imageUrl }: { index: number; imageUrl?: string }) => (
      <div className="relative group bg-gray-100 flex items-center justify-center overflow-hidden h-full">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`이미지 ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {onAdditionalImageRemove && index > 0 && (
              <button
                onClick={() => onAdditionalImageRemove(index - 1)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              >
                x
              </button>
            )}
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">이미지 {index + 1}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onAdditionalImageAdd) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onAdditionalImageAdd(index - 1, reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        )}
      </div>
    );

    // triple-row: 3개 가로 나란히 + 하단 텍스트 (상세컷 나열)
    if (presetConfig.id === 'triple-row') {
      return (
        <div className="w-full">
          <div className="grid grid-cols-3 gap-px bg-gray-200" style={{ minHeight: '280px' }}>
            <ImageSlot index={0} imageUrl={allImages[0]} />
            <ImageSlot index={1} imageUrl={allImages[1]} />
            <ImageSlot index={2} imageUrl={allImages[2]} />
          </div>
          <div className="py-8 px-8 text-center max-w-2xl mx-auto">{TextContent}</div>
        </div>
      );
    }

    // triple-column: 3개 세로 + 우측 텍스트 (상품 디테일)
    if (presetConfig.id === 'triple-column') {
      return (
        <div className="flex w-full" style={{ minHeight: '520px' }}>
          <div className="flex flex-col gap-px bg-gray-200" style={{ width: '50%' }}>
            <div className="flex-1 bg-white">
              <ImageSlot index={0} imageUrl={allImages[0]} />
            </div>
            <div className="flex-1 bg-white">
              <ImageSlot index={1} imageUrl={allImages[1]} />
            </div>
            <div className="flex-1 bg-white">
              <ImageSlot index={2} imageUrl={allImages[2]} />
            </div>
          </div>
          <div
            className="flex flex-col justify-center bg-neutral-50"
            style={{ width: '50%', padding: '3rem' }}
          >
            {TextContent}
          </div>
        </div>
      );
    }

    // triple-featured: 메인 + 서브 (대표 이미지 강조)
    if (presetConfig.id === 'triple-featured') {
      return (
        <div className="w-full">
          <div className="grid grid-cols-2 gap-px bg-gray-200" style={{ minHeight: '420px' }}>
            <div className="row-span-2 bg-white">
              <ImageSlot index={0} imageUrl={allImages[0]} />
            </div>
            <div className="bg-white">
              <ImageSlot index={1} imageUrl={allImages[1]} />
            </div>
            <div className="bg-white">
              <ImageSlot index={2} imageUrl={allImages[2]} />
            </div>
          </div>
          <div className="py-8 px-8">{TextContent}</div>
        </div>
      );
    }

    // triple-masonry: 매거진 스타일 + 오버레이 텍스트
    if (presetConfig.id === 'triple-masonry') {
      return (
        <div className="relative" style={{ minHeight: '500px' }}>
          <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full" style={{ minHeight: '500px' }}>
            <div className="col-span-2 row-span-2">
              <ImageSlot index={0} imageUrl={allImages[0]} />
            </div>
            <div>
              <ImageSlot index={1} imageUrl={allImages[1]} />
            </div>
            <div>
              <ImageSlot index={2} imageUrl={allImages[2]} />
            </div>
          </div>
          <Rnd
            position={{
              x: scenario.text_position_x || presetConfig.defaultTextPosition?.x || 30,
              y: scenario.text_position_y || presetConfig.defaultTextPosition?.y || 350,
            }}
            size={{
              width: scenario.text_width || presetConfig.defaultTextPosition?.width || 400,
              height: scenario.text_height || presetConfig.defaultTextPosition?.height || 'auto',
            }}
            onDragStop={(e, d) => {
              onTextPositionChange(
                d.x,
                d.y,
                scenario.text_width || presetConfig.defaultTextPosition?.width || 400,
                scenario.text_height || presetConfig.defaultTextPosition?.height || 100
              );
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              onTextPositionChange(
                position.x,
                position.y,
                parseInt(ref.style.width),
                parseInt(ref.style.height)
              );
            }}
            bounds="parent"
            className="border border-dashed border-gray-400/60"
            style={{ borderRadius: '6px' }}
          >
            <div
              className="h-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.97)',
                padding: '1.5rem 2rem',
                borderRadius: '6px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              {TextContent}
            </div>
          </Rnd>
        </div>
      );
    }
  }

  // 기본값
  return (
    <div className="w-full">
      <div className="w-full">{ImageContent}</div>
      <div className="py-8 px-8">{TextContent}</div>
    </div>
  );
}
