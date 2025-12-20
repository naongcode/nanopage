import { CommonBlockSettings } from '@/types';

export const DEFAULT_COMMON_SETTINGS: CommonBlockSettings = {
  blockWidth: 700,
  blockBackgroundColor: '#ffffff',
  textFontFamily: '"Nanum Myeongjo", serif',
  textFontSize: 20,
  textColor: '#2d2d2d',
  textFontWeight: '400',
  textAlign: 'center',
};

export const FONT_FAMILIES = [
  { label: '나눔명조 (기본)', value: '"Nanum Myeongjo", serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: 'Pretendard', value: 'Pretendard, sans-serif' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
  { label: 'Playfair Display (우아)', value: '"Playfair Display", serif' },
  { label: 'Montserrat (세련)', value: '"Montserrat", sans-serif' },
  { label: 'Raleway (모던)', value: '"Raleway", sans-serif' },
  { label: 'Roboto (깔끔)', value: '"Roboto", sans-serif' },
  { label: '기본 고딕체', value: 'sans-serif' },
  { label: '기본 명조체', value: 'serif' },
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
