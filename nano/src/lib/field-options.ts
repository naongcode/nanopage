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

  // 촬영 컨셉 (장면/스토리)
  shooting_concept: {
    food: [
      { label: '농장 수확', value: '농장에서 신선하게 수확하는 장면' },
      { label: '포장 공정', value: '위생적으로 포장하는 공정 장면' },
      { label: '요리 장면', value: '재료를 활용한 요리 조리 장면' },
      { label: '식탁 세팅', value: '아름답게 차려진 식탁 장면' },
      { label: '가족 식사', value: '가족이 함께 식사하는 따뜻한 장면' },
      { label: '1인 식사', value: '혼자 여유롭게 식사하는 장면' },
      { label: '재료 클로즈업', value: '신선한 재료 클로즈업 샷' },
    ],
    beauty: [
      { label: '스킨케어 루틴', value: '아침/저녁 스킨케어 루틴 장면' },
      { label: '화장대 연출', value: '깔끔한 화장대에서 사용하는 장면' },
      { label: '욕실 셀프케어', value: '욕실에서 셀프케어하는 장면' },
      { label: '피부 결 클로즈업', value: '건강한 피부 결 클로즈업' },
      { label: '성분 원료', value: '자연 유래 성분 원료 연출' },
    ],
    lifestyle: [
      { label: '일상 사용', value: '일상에서 자연스럽게 사용하는 장면' },
      { label: '아침 루틴', value: '아침 루틴에서 활용하는 장면' },
      { label: '저녁 휴식', value: '저녁 휴식 시간에 사용하는 장면' },
      { label: '외출 준비', value: '외출 준비 중 사용하는 장면' },
      { label: '여행/나들이', value: '여행이나 나들이 중 활용 장면' },
    ],
    tech: [
      { label: '업무 활용', value: '업무 중 생산성을 높이는 활용 장면' },
      { label: '홈오피스', value: '홈오피스 환경에서 사용하는 장면' },
      { label: '이동 중 사용', value: '이동 중 편리하게 사용하는 장면' },
      { label: '언박싱', value: '프리미엄 언박싱 장면' },
      { label: '디테일 샷', value: '제품 디테일과 마감 클로즈업' },
    ],
    fashion: [
      { label: '데일리룩', value: '데일리룩 스타일링 장면' },
      { label: '시즌 연출', value: '계절감 있는 야외 연출 장면' },
      { label: '코디 제안', value: '다양한 코디 제안 장면' },
      { label: '디테일 핏', value: '핏과 디테일 클로즈업 장면' },
    ],
    health: [
      { label: '운동 전후', value: '운동 전후 제품 활용 장면' },
      { label: '헬스장', value: '헬스장에서 사용하는 장면' },
      { label: '요가/필라테스', value: '요가나 필라테스 중 활용 장면' },
      { label: '러닝/조깅', value: '야외 러닝이나 조깅 중 장면' },
      { label: '건강식 준비', value: '건강한 식단 준비 장면' },
    ],
    baby: [
      { label: '육아 일상', value: '아이와 함께하는 육아 일상 장면' },
      { label: '수유/이유식', value: '수유나 이유식 시간 장면' },
      { label: '목욕 시간', value: '아이 목욕 시키는 장면' },
      { label: '놀이 시간', value: '아이와 놀이하는 장면' },
      { label: '외출 준비', value: '아이 외출 준비하는 장면' },
    ],
    pet: [
      { label: '반려동물 식사', value: '반려동물 식사 시간 장면' },
      { label: '산책', value: '반려동물과 산책하는 장면' },
      { label: '놀이', value: '반려동물과 놀아주는 장면' },
      { label: '그루밍', value: '반려동물 그루밍/목욕 장면' },
      { label: '휴식', value: '반려동물과 함께 휴식하는 장면' },
    ],
    home: [
      { label: '인테리어 연출', value: '세련된 인테리어 속 제품 연출' },
      { label: '청소/정리', value: '깔끔하게 청소하고 정리하는 장면' },
      { label: '홈카페', value: '집에서 카페처럼 즐기는 장면' },
      { label: '침실 휴식', value: '편안한 침실에서 휴식하는 장면' },
      { label: '발코니/테라스', value: '발코니나 테라스에서 활용 장면' },
    ],
    travel: [
      { label: '여행 준비', value: '여행 짐 싸는 장면' },
      { label: '공항/기내', value: '공항이나 기내에서 사용 장면' },
      { label: '호텔', value: '호텔에서 사용하는 장면' },
      { label: '관광지', value: '관광지에서 활용하는 장면' },
      { label: '캠핑/글램핑', value: '캠핑이나 글램핑 중 장면' },
    ],
  },
};
