import { CommonBlockSettings } from '@/types';

export const DEFAULT_COMMON_SETTINGS: CommonBlockSettings = {
  blockWidth: 700,
  blockBackgroundColor: '#ffffff',
  textFontFamily: '"Gowun Dodum", sans-serif',
  textFontSize: 20,
  textColor: '#1a1a1a',
  textFontWeight: '600',
  textAlign: 'left',
};

export const FONT_FAMILIES = [
  // 깔끔한 고딕 계열
  { label: 'Pretendard (기본)', value: 'Pretendard, -apple-system, sans-serif' },
  { label: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: 'Spoqa Han Sans', value: '"Spoqa Han Sans Neo", sans-serif' },
  // 감성 명조 계열
  { label: '나눔명조', value: '"Nanum Myeongjo", serif' },
  { label: '눈누 마루부리', value: '"MaruBuri", serif' },
  { label: 'Noto Serif KR', value: '"Noto Serif KR", serif' },
  // 포인트/디자인 서체
  { label: 'Black Han Sans (임팩트)', value: '"Black Han Sans", sans-serif' },
  { label: 'Jua (둥근고딕)', value: '"Jua", sans-serif' },
  { label: 'Do Hyeon (굵은고딕)', value: '"Do Hyeon", sans-serif' },
  { label: 'Gamja Flower (손글씨)', value: '"Gamja Flower", cursive' },
  { label: 'Gaegu (손글씨)', value: '"Gaegu", cursive' },
  { label: 'Gowun Batang (바탕)', value: '"Gowun Batang", serif' },
  { label: 'Gowun Dodum (돋움)', value: '"Gowun Dodum", sans-serif' },
  { label: 'IBM Plex Sans KR', value: '"IBM Plex Sans KR", sans-serif' },
  // 영문 디자인 서체
  { label: 'Montserrat', value: '"Montserrat", sans-serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Poppins', value: '"Poppins", sans-serif' },
  { label: 'Raleway', value: '"Raleway", sans-serif' },
];

export const FONT_WEIGHTS = [
  { label: '가늘게 (300)', value: '300' },
  { label: '보통 (400)', value: '400' },
  { label: '중간 (500)', value: '500' },
  { label: '약간 굵게 (600)', value: '600' },
  { label: '굵게 (700)', value: '700' },
  { label: '매우 굵게 (800)', value: '800' },
  { label: '최대 굵기 (900)', value: '900' },
];

export const TEXT_ALIGNS = [
  { label: '왼쪽', value: 'left' },
  { label: '가운데', value: 'center' },
  { label: '오른쪽', value: 'right' },
];
