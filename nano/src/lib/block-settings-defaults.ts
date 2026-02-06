import { CommonBlockSettings } from '@/types';

export const DEFAULT_COMMON_SETTINGS: CommonBlockSettings = {
  blockWidth: 700,
  blockBackgroundColor: '#ffffff',
  textFontFamily: 'Pretendard, -apple-system, sans-serif',
  textFontSize: 16,
  textColor: '#1a1a1a',
  textFontWeight: '400',
  textAlign: 'left',
};

export const FONT_FAMILIES = [
  { label: 'Pretendard (기본)', value: 'Pretendard, -apple-system, sans-serif' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: '나눔명조', value: '"Nanum Myeongjo", serif' },
  { label: 'Spoqa Han Sans', value: '"Spoqa Han Sans Neo", sans-serif' },
  { label: 'Wanted Sans', value: '"Wanted Sans", sans-serif' },
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
];

export const FONT_WEIGHTS = [
  { label: '얇게 (300)', value: '300' },
  { label: '보통', value: 'normal' },
  { label: '중간 (500)', value: '500' },
  { label: '굵게', value: 'bold' },
  { label: '매우 굵게 (900)', value: '900' },
];

export const TEXT_ALIGNS = [
  { label: '왼쪽', value: 'left' },
  { label: '가운데', value: 'center' },
  { label: '오른쪽', value: 'right' },
];
