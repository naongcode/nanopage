// 각 필드별 선택 가능한 옵션들

export interface FieldOption {
  label: string;
  value: string;
  category?: string; // 옵션 카테고리 (조합 시 사용)
}

export const FIELD_OPTIONS = {
  // 타겟 고객
  target_customer: {
    preference: [
      { label: '조용한 환경을 선호하는', value: '조용한 환경을 선호하는' },
      { label: '활동적인 라이프스타일의', value: '활동적인 라이프스타일의' },
      { label: '건강을 중시하는', value: '건강을 중시하는' },
      { label: '트렌디한 스타일을 추구하는', value: '트렌디한 스타일을 추구하는' },
      { label: '심플한 디자인을 선호하는', value: '심플한 디자인을 선호하는' },
      { label: '프리미엄을 추구하는', value: '프리미엄을 추구하는' },
    ],
    age: [
      { label: '10대', value: '10대' },
      { label: '20대', value: '20대' },
      { label: '30대', value: '30대' },
      { label: '20~30대', value: '20~30대' },
      { label: '30~40대', value: '30~40대' },
      { label: '40~50대', value: '40~50대' },
      { label: '전 연령', value: '전 연령' },
    ],
    occupation: [
      { label: '직장인', value: '직장인' },
      { label: '학생', value: '학생' },
      { label: '주부', value: '주부' },
      { label: '프리랜서', value: '프리랜서' },
      { label: '직장인/학생', value: '직장인/학생' },
    ],
    family: [
      { label: '1인 가구', value: '1인 가구' },
      { label: '신혼부부', value: '신혼부부' },
      { label: '자녀가 있는 가족', value: '자녀가 있는 가족' },
      { label: '4인 가족', value: '4인 가족' },
    ],
  },

  // 차별화 컨셉 (피하고 싶은 이미지)
  differentiation_concept: [
    { label: '화려한 색상', value: '화려한 색상' },
    { label: '과격한 스포츠 활동', value: '과격한 스포츠 활동' },
    { label: '인공적인 느낌', value: '인공적인 느낌' },
    { label: '저렴해 보이는 이미지', value: '저렴해 보이는 이미지' },
    { label: '과도한 장식', value: '과도한 장식' },
    { label: '트렌디한 로고 강조', value: '트렌디한 로고 강조' },
    { label: '대량 생산 느낌', value: '대량 생산 느낌' },
  ],

  // 시각적 컨셉
  visual_concept: {
    location: [
      { label: '고급스러운 사무 공간', value: '고급스러운 사무 공간' },
      { label: '자연광 홈카페', value: '자연광 홈카페' },
      { label: '미니멀한 인테리어', value: '미니멀한 인테리어' },
      { label: '북유럽 스타일 거실', value: '북유럽 스타일 거실' },
      { label: '야외 자연 배경', value: '야외 자연 배경' },
      { label: '모던한 주방', value: '모던한 주방' },
      { label: '깔끔한 욕실', value: '깔끔한 욕실' },
    ],
    lighting: [
      { label: '자연광', value: '자연광' },
      { label: '따뜻한 조명', value: '따뜻한 조명' },
      { label: '부드러운 간접조명', value: '부드러운 간접조명' },
      { label: '밝은 주광', value: '밝은 주광' },
    ],
  },

  // 톤앤매너
  tone_and_manner: {
    mood: [
      { label: '차분한', value: '차분한' },
      { label: '따뜻한', value: '따뜻한' },
      { label: '시원한', value: '시원한' },
      { label: '부드러운', value: '부드러운' },
      { label: '고급스러운', value: '고급스러운' },
      { label: '자연스러운', value: '자연스러운' },
    ],
    color_scheme: [
      { label: '뉴트럴 톤', value: '뉴트럴 톤' },
      { label: '파스텔 톤', value: '파스텔 톤' },
      { label: '어스 톤', value: '어스 톤' },
      { label: '모노 톤', value: '모노 톤' },
    ],
    colors: [
      { label: '화이트', value: '화이트' },
      { label: '베이지', value: '베이지' },
      { label: '그레이', value: '그레이' },
      { label: '브라운', value: '브라운' },
      { label: '핑크', value: '핑크' },
      { label: '블루', value: '블루' },
      { label: '그린', value: '그린' },
    ],
  },

  // 필수 연출 상황 (공통)
  required_scenes: [
    { label: '카페에서 노트북 작업', value: '카페에서 노트북 작업을 하며 집중하는 모습' },
    { label: '출퇴근길 대중교통', value: '출퇴근길 지하철/버스 안에서 휴식을 취하는 모습' },
    { label: '집에서 독서', value: '집에서 편안하게 책을 읽는 모습' },
    { label: '공원 산책', value: '공원이나 거리를 산책하는 자연스러운 모습' },
    { label: '아침 루틴', value: '아침에 일어나 루틴을 시작하는 모습' },
    { label: '운동 전후', value: '운동 전후 제품을 사용하는 모습' },
    { label: '가족과 함께', value: '가족과 함께 시간을 보내는 모습' },
    { label: '친구들과 모임', value: '친구들과 모임에서 사용하는 모습' },
  ],

  // 금지 요소
  forbidden_elements: [
    { label: '과격한 스포츠', value: '과격한 스포츠 활동을 연상시키는 요소' },
    { label: '화려한 메이크업', value: '화려한 메이크업이나 파티 분위기' },
    { label: '인공 조명', value: '인공적인 조명이나 플라스틱 용기' },
    { label: '과도한 액세서리', value: '과도하게 포즈를 취하거나 화려한 액세서리' },
    { label: '저가 이미지', value: '저렴해 보이는 배경이나 소품' },
  ],
};
