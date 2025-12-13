'use client';

import { Scenario, CommonBlockSettings } from '@/types';
import { getLayoutPresetConfig } from '@/lib/layout-presets';
import { ImageWithCrop } from './ImageWithCrop';
import { Rnd } from 'react-rnd';

interface LayoutBlockProps {
  scenario: Scenario;
  effectiveStyle: CommonBlockSettings;
  isEditingCrop: boolean;
  editingScenarioId: string | null;
  onCropSave: (crop: any) => void;
  onCropEditComplete: () => void;
  onDescriptionEdit: (text: string) => void;
  onEditingChange: (scenarioId: string | null) => void;
  onTextPositionChange: (x: number, y: number, width: number, height: number) => void;
}

export function LayoutBlock({
  scenario,
  effectiveStyle,
  isEditingCrop,
  editingScenarioId,
  onCropSave,
  onCropEditComplete,
  onDescriptionEdit,
  onEditingChange,
  onTextPositionChange,
}: LayoutBlockProps) {
  const presetConfig = getLayoutPresetConfig(scenario.layout_preset);
  const displayDescription = scenario.user_edited_description_text || scenario.description_text || '';

  // 이미지 컴포넌트
  const ImageComponent = (
    <div className={presetConfig.layoutType === 'horizontal' ? 'flex-shrink-0' : 'w-full'}>
      {isEditingCrop ? (
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
      )}
    </div>
  );

  // 텍스트 컴포넌트
  const TextComponent = (
    <div className={presetConfig.layoutType === 'horizontal' ? 'flex-1' : 'w-full'}>
      {editingScenarioId === scenario.id ? (
        <textarea
          defaultValue={displayDescription}
          className="w-full p-3 border rounded-lg resize-none"
          rows={presetConfig.layoutType === 'horizontal' ? 10 : 3}
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            fontWeight: effectiveStyle.textFontWeight,
          }}
          onBlur={(e) => onDescriptionEdit(e.target.value)}
          autoFocus
        />
      ) : (
        <p
          onClick={() => onEditingChange(scenario.id || null)}
          className="cursor-pointer hover:bg-gray-100 p-3 rounded transition whitespace-pre-line"
          style={{
            fontFamily: effectiveStyle.textFontFamily,
            fontSize: `${effectiveStyle.textFontSize}px`,
            color: effectiveStyle.textColor,
            fontWeight: effectiveStyle.textFontWeight,
            textAlign: effectiveStyle.textAlign,
          }}
        >
          {displayDescription || '설명글을 입력하려면 클릭하세요'}
        </p>
      )}
    </div>
  );

  // 오버레이 타입 (텍스트가 이미지 위에)
  if (presetConfig.isOverlay) {
    const hasCustomPosition = scenario.text_position_y !== null && scenario.text_position_y !== undefined;

    return (
      <div className="relative" style={{ minHeight: '600px', width: '100%' }}>
        {/* 배경 이미지 */}
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
              <div className="w-full h-full">
                <img
                  src={scenario.selected_image_url || ''}
                  alt="배경 이미지"
                  className="w-full h-full object-cover"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 오버레이 텍스트 (드래그 가능) */}
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
          className="border-2 border-blue-500 shadow-lg"
          style={{
            borderRadius: '8px',
          }}
        >
          <div
            className="h-full p-3 bg-white/90 backdrop-blur-sm rounded-lg"
            style={{
              fontFamily: effectiveStyle.textFontFamily,
              fontSize: `${effectiveStyle.textFontSize}px`,
              color: effectiveStyle.textColor,
              fontWeight: effectiveStyle.textFontWeight,
              textAlign: effectiveStyle.textAlign,
            }}
          >
            {editingScenarioId === scenario.id ? (
              <textarea
                defaultValue={displayDescription}
                className="w-full h-full p-2 border rounded resize-none bg-transparent"
                style={{
                  fontFamily: effectiveStyle.textFontFamily,
                  fontSize: `${effectiveStyle.textFontSize}px`,
                  color: effectiveStyle.textColor,
                  fontWeight: effectiveStyle.textFontWeight,
                }}
                onBlur={(e) => onDescriptionEdit(e.target.value)}
                autoFocus
              />
            ) : (
              <p
                onClick={() => onEditingChange(scenario.id || null)}
                className="cursor-pointer whitespace-pre-line"
              >
                {displayDescription || '설명글을 입력하려면 클릭하세요'}
              </p>
            )}
          </div>
        </Rnd>
      </div>
    );
  }

  // 세로형 레이아웃
  if (presetConfig.layoutType === 'vertical') {
    if (presetConfig.id === 'text-first') {
      // 텍스트 먼저
      return (
        <div className="space-y-4">
          {TextComponent}
          {ImageComponent}
        </div>
      );
    } else if (presetConfig.id === 'image-dominant') {
      // 이미지 중심 (작은 캡션)
      return (
        <div className="space-y-2">
          {ImageComponent}
          <div className="text-sm text-gray-600 px-2">
            {TextComponent}
          </div>
        </div>
      );
    } else if (presetConfig.id === 'card') {
      // 카드형
      return (
        <div className="rounded-xl overflow-hidden shadow-lg bg-white">
          <div className="aspect-square overflow-hidden">
            {ImageComponent}
          </div>
          <div className="p-4">
            {TextComponent}
          </div>
        </div>
      );
    } else {
      // 기본 세로형 (vertical)
      return (
        <div className="space-y-4">
          {ImageComponent}
          {TextComponent}
        </div>
      );
    }
  }

  // 가로형 레이아웃
  if (presetConfig.layoutType === 'horizontal') {
    const imageWidth = presetConfig.id === 'magazine' ? '60%' : '50%';
    const textWidth = presetConfig.id === 'magazine' ? '40%' : '50%';

    if (presetConfig.id === 'horizontal-right') {
      // 텍스트 좌 + 이미지 우
      return (
        <div className="flex gap-6 items-center">
          <div style={{ width: textWidth }}>
            {TextComponent}
          </div>
          <div style={{ width: imageWidth }}>
            {ImageComponent}
          </div>
        </div>
      );
    } else {
      // 이미지 좌 + 텍스트 우 (horizontal-left, magazine)
      return (
        <div className="flex gap-6 items-center">
          <div style={{ width: imageWidth }}>
            {ImageComponent}
          </div>
          <div style={{ width: textWidth }}>
            {TextComponent}
          </div>
        </div>
      );
    }
  }

  // 기본값 (세로형)
  return (
    <div className="space-y-4">
      {ImageComponent}
      {TextComponent}
    </div>
  );
}
