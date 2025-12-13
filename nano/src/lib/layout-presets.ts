import { LayoutPreset } from '@/types';

export interface LayoutPresetConfig {
  id: LayoutPreset;
  name: string;
  description: string;
  icon: string;
  preview: string; // 미리보기 이미지 또는 이모지
  layoutType: 'vertical' | 'horizontal' | 'overlay';
  imageSize: number; // 이미지 영역 비율 (%)
  textSize: number; // 텍스트 영역 비율 (%)
  isOverlay: boolean; // 텍스트가 이미지 위에 오버레이되는지
  defaultTextPosition?: {
    // 오버레이 타입일 때의 기본 텍스트 위치
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const LAYOUT_PRESETS: Record<LayoutPreset, LayoutPresetConfig> = {
  vertical: {
    id: 'vertical',
    name: '세로형 (기본)',
    description: '이미지 위 + 텍스트 아래. 가장 기본적인 레이아웃',
    icon: '📱',
    preview: '▭\n━',
    layoutType: 'vertical',
    imageSize: 70,
    textSize: 30,
    isOverlay: false,
  },
  'horizontal-left': {
    id: 'horizontal-left',
    name: '가로형 (좌이미지)',
    description: '이미지 왼쪽 50% + 텍스트 오른쪽 50%',
    icon: '◧',
    preview: '▭━',
    layoutType: 'horizontal',
    imageSize: 50,
    textSize: 50,
    isOverlay: false,
  },
  'horizontal-right': {
    id: 'horizontal-right',
    name: '가로형 (우이미지)',
    description: '텍스트 왼쪽 50% + 이미지 오른쪽 50%',
    icon: '◨',
    preview: '━▭',
    layoutType: 'horizontal',
    imageSize: 50,
    textSize: 50,
    isOverlay: false,
  },
  'overlay-center': {
    id: 'overlay-center',
    name: '오버레이 중앙',
    description: '이미지 전체 배경 + 텍스트 중앙 배치',
    icon: '🎯',
    preview: '▭⊡▭',
    layoutType: 'overlay',
    imageSize: 100,
    textSize: 0,
    isOverlay: true,
    defaultTextPosition: {
      x: 50,
      y: 200,
      width: 600,
      height: 100,
    },
  },
  'overlay-bottom': {
    id: 'overlay-bottom',
    name: '오버레이 하단',
    description: '이미지 전체 배경 + 텍스트 하단 배치',
    icon: '🔽',
    preview: '▭\n⊡',
    layoutType: 'overlay',
    imageSize: 100,
    textSize: 0,
    isOverlay: true,
    defaultTextPosition: {
      x: 50,
      y: 480,
      width: 600,
      height: 80,
    },
  },
  'overlay-top': {
    id: 'overlay-top',
    name: '오버레이 상단',
    description: '이미지 전체 배경 + 텍스트 상단 배치',
    icon: '🔼',
    preview: '⊡\n▭',
    layoutType: 'overlay',
    imageSize: 100,
    textSize: 0,
    isOverlay: true,
    defaultTextPosition: {
      x: 50,
      y: 40,
      width: 600,
      height: 80,
    },
  },
  'text-first': {
    id: 'text-first',
    name: '텍스트 우선',
    description: '텍스트 위 + 이미지 아래',
    icon: '📝',
    preview: '━\n▭',
    layoutType: 'vertical',
    imageSize: 60,
    textSize: 40,
    isOverlay: false,
  },
  'image-dominant': {
    id: 'image-dominant',
    name: '이미지 중심',
    description: '이미지 80% + 하단 작은 캡션',
    icon: '🖼️',
    preview: '▭\n─',
    layoutType: 'vertical',
    imageSize: 80,
    textSize: 20,
    isOverlay: false,
  },
  magazine: {
    id: 'magazine',
    name: '매거진 스타일',
    description: '이미지 60% 좌측 + 텍스트 40% 우측 (프리미엄)',
    icon: '📰',
    preview: '▭━',
    layoutType: 'horizontal',
    imageSize: 60,
    textSize: 40,
    isOverlay: false,
  },
  card: {
    id: 'card',
    name: '카드형',
    description: '이미지 상단 (정사각형) + 텍스트 하단 (카드)',
    icon: '🎴',
    preview: '▭\n━',
    layoutType: 'vertical',
    imageSize: 60,
    textSize: 40,
    isOverlay: false,
  },
};

// 프리셋 목록을 배열로 반환 (UI에서 사용)
export const getLayoutPresetList = (): LayoutPresetConfig[] => {
  return Object.values(LAYOUT_PRESETS);
};

// 프리셋 ID로 설정 가져오기
export const getLayoutPresetConfig = (
  presetId: LayoutPreset | null | undefined
): LayoutPresetConfig => {
  if (!presetId) {
    return LAYOUT_PRESETS.vertical; // 기본값
  }
  return LAYOUT_PRESETS[presetId];
};

// 프리셋 적용 시 자동으로 설정할 값들 반환
export const applyLayoutPreset = (
  presetId: LayoutPreset
): {
  layout_preset: LayoutPreset;
  text_position_x?: number;
  text_position_y?: number | null;
  text_width?: number | null;
  text_height?: number | null;
} => {
  const config = LAYOUT_PRESETS[presetId];

  if (config.isOverlay && config.defaultTextPosition) {
    // 오버레이 타입: 텍스트 위치 설정
    return {
      layout_preset: presetId,
      text_position_x: config.defaultTextPosition.x,
      text_position_y: config.defaultTextPosition.y,
      text_width: config.defaultTextPosition.width,
      text_height: config.defaultTextPosition.height,
    };
  } else {
    // 비오버레이 타입: 텍스트 위치 초기화 (레이아웃으로 처리)
    return {
      layout_preset: presetId,
      text_position_x: 0,
      text_position_y: null,
      text_width: null,
      text_height: null,
    };
  }
};
