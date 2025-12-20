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

  // 3단계 텍스트 컴포넌트
  const TextContent = (
    <div className="space-y-3">
      {/* 제목 */}
      {editingField === 'title' ? (
        <input
          type="text"
          defaultValue={title}
          className="w-full px-2 py-1 text-2xl font-bold border-b-2 border-gray-300 focus:border-gray-500 outline-none bg-transparent"
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
          className="text-2xl font-bold cursor-pointer hover:opacity-70 transition-opacity"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
            lineHeight: '1.4',
          }}
        >
          {title || '제목을 입력하세요'}
        </h2>
      )}

      {/* 부제목 */}
      {editingField === 'subtitle' ? (
        <input
          type="text"
          defaultValue={subtitle}
          className="w-full px-2 py-1 text-sm border-b border-gray-200 focus:border-gray-400 outline-none bg-transparent"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: '#888',
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
          className="text-sm cursor-pointer hover:opacity-70 transition-opacity"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            color: '#888',
            textAlign: effectiveStyle.textAlign,
            lineHeight: '1.5',
          }}
        >
          {subtitle || '부제목을 입력하세요'}
        </p>
      )}

      {/* 본문 */}
      {editingField === 'description' ? (
        <textarea
          defaultValue={description}
          className="w-full p-2 border border-gray-200 rounded resize-none focus:ring-1 focus:ring-gray-300 outline-none"
          rows={3}
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
          className="cursor-pointer hover:opacity-70 transition-opacity whitespace-pre-line"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            textAlign: effectiveStyle.textAlign,
            lineHeight: '1.8',
            letterSpacing: '0.02em',
          }}
        >
          {description || '본문을 입력하세요'}
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
          className="border border-dashed border-gray-400"
          style={{ borderRadius: '4px' }}
        >
          <div
            className="h-full p-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
          >
            {TextContent}
          </div>
        </Rnd>
      </div>
    );
  }

  // 세로형 레이아웃
  if (presetConfig.layoutType === 'vertical') {
    if (presetConfig.id === 'text-first') {
      return (
        <div className="w-full">
          <div className="py-6 px-4">{TextContent}</div>
          <div className="w-full">{ImageContent}</div>
        </div>
      );
    } else if (presetConfig.id === 'image-dominant') {
      return (
        <div className="w-full">
          <div className="w-full">{ImageContent}</div>
          <div className="py-3 px-4">{TextContent}</div>
        </div>
      );
    } else if (presetConfig.id === 'card') {
      return (
        <div className="w-full">
          <div className="aspect-square overflow-hidden">{ImageContent}</div>
          <div className="py-6 px-4">{TextContent}</div>
        </div>
      );
    } else {
      return (
        <div className="w-full">
          <div className="w-full">{ImageContent}</div>
          <div className="py-5 px-4">{TextContent}</div>
        </div>
      );
    }
  }

  // 가로형 레이아웃
  if (presetConfig.layoutType === 'horizontal') {
    const imageWidth = presetConfig.id === 'magazine' ? '55%' : '50%';
    const textWidth = presetConfig.id === 'magazine' ? '45%' : '50%';

    if (presetConfig.id === 'magazine') {
      return (
        <div className="flex items-stretch w-full" style={{ minHeight: '400px' }}>
          <div style={{ width: imageWidth }}>{ImageContent}</div>
          <div style={{ width: textWidth }} className="flex flex-col justify-center px-8 py-6">
            {TextContent}
          </div>
        </div>
      );
    }

    if (presetConfig.id === 'horizontal-right') {
      return (
        <div className="flex items-center w-full gap-6">
          <div style={{ width: textWidth }} className="px-4 py-6">{TextContent}</div>
          <div style={{ width: imageWidth }}>{ImageContent}</div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center w-full gap-6">
          <div style={{ width: imageWidth }}>{ImageContent}</div>
          <div style={{ width: textWidth }} className="px-4 py-6">{TextContent}</div>
        </div>
      );
    }
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

    // triple-row: 3개 가로 나란히 + 하단 텍스트
    if (presetConfig.id === 'triple-row') {
      return (
        <div className="w-full">
          <div className="grid grid-cols-3 gap-2" style={{ minHeight: '250px' }}>
            <ImageSlot index={0} imageUrl={allImages[0]} />
            <ImageSlot index={1} imageUrl={allImages[1]} />
            <ImageSlot index={2} imageUrl={allImages[2]} />
          </div>
          <div className="py-5 px-4">{TextContent}</div>
        </div>
      );
    }

    // triple-column: 3개 세로 + 우측 텍스트
    if (presetConfig.id === 'triple-column') {
      return (
        <div className="flex w-full" style={{ minHeight: '500px' }}>
          <div className="flex flex-col gap-2" style={{ width: '60%' }}>
            <div style={{ height: '33.33%' }}>
              <ImageSlot index={0} imageUrl={allImages[0]} />
            </div>
            <div style={{ height: '33.33%' }}>
              <ImageSlot index={1} imageUrl={allImages[1]} />
            </div>
            <div style={{ height: '33.33%' }}>
              <ImageSlot index={2} imageUrl={allImages[2]} />
            </div>
          </div>
          <div className="flex-1 px-6 py-4 flex flex-col justify-center">{TextContent}</div>
        </div>
      );
    }

    // triple-featured: 1개 큰 이미지 + 2개 작은 이미지
    if (presetConfig.id === 'triple-featured') {
      return (
        <div className="w-full">
          <div className="grid grid-cols-2 gap-2" style={{ minHeight: '400px' }}>
            <div className="row-span-2">
              <ImageSlot index={0} imageUrl={allImages[0]} />
            </div>
            <div>
              <ImageSlot index={1} imageUrl={allImages[1]} />
            </div>
            <div>
              <ImageSlot index={2} imageUrl={allImages[2]} />
            </div>
          </div>
          <div className="py-5 px-4">{TextContent}</div>
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
            className="border border-dashed border-gray-400"
            style={{ borderRadius: '4px' }}
          >
            <div
              className="h-full p-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
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
      <div className="py-5 px-4">{TextContent}</div>
    </div>
  );
}
