// 카테고리별 템플릿 데이터

export interface TemplateData {
  project_name: string;
  category: string;
  differentiation_concept: string;
  target_customer: string;
  selling_point_1: string;
  selling_point_2: string;
  selling_point_3: string;
  visual_concept: string;
  tone_and_manner: string;
  required_scene_1: string;
  required_scene_2: string;
  forbidden_element: string;
}

export const CATEGORY_TEMPLATES: Record<string, TemplateData> = {
  electronics: {
    project_name: '프리미엄 무선 소음 차단 이어폰',
    category: '전자제품/음향기기',
    differentiation_concept: '화려한 색상, 과격한 스포츠 활동 강조',
    target_customer: '조용한 환경에서 집중을 원하는 20~30대 직장인/학생',
    selling_point_1: '딥 노이즈 캔슬링',
    selling_point_2: '인체공학적 무중력 디자인',
    selling_point_3: '울트라 롱 배터리 (48시간)',
    visual_concept: '고급스러운 사무 공간 / 자연광 홈카페',
    tone_and_manner: '차분한 뉴트럴 톤 (화이트, 베이지, 라이트 그레이)',
    required_scene_1: '카페에서 노트북 작업을 하며 집중하는 모습',
    required_scene_2: '출퇴근길 지하철/버스 안에서 휴식을 취하는 모습',
    forbidden_element: '과격한 스포츠 활동을 연상시키는 요소',
  },
  cosmetics: {
    project_name: '히알루론산 수분 진정 크림',
    category: '화장품/스킨케어',
    differentiation_concept: '화려한 메이크업, 파티 분위기, 과도한 광채',
    target_customer: '건조하고 민감한 피부를 가진 20~40대 여성',
    selling_point_1: '10중 히알루론산 보습',
    selling_point_2: '병풀 추출물 진정 효과',
    selling_point_3: '피부 장벽 강화',
    visual_concept: '차분한 아침 루틴 / 깨끗한 욕실 / 자연광',
    tone_and_manner: '부드러운 파스텔 톤 (아이보리, 연한 핑크, 민트)',
    required_scene_1: '세안 후 거울 앞에서 크림을 바르는 모습',
    required_scene_2: '침대에서 아침에 일어나 피부를 만지는 모습',
    forbidden_element: '화려한 메이크업이나 파티 분위기',
  },
  fashion: {
    project_name: '캐시미어 블렌드 오버핏 니트',
    category: '의류/니트웨어',
    differentiation_concept: '타이트한 핏, 화려한 프린트, 트렌디한 로고',
    target_customer: '심플하고 편안한 스타일을 선호하는 25~45세 직장인',
    selling_point_1: '프리미엄 캐시미어 30% 블렌드',
    selling_point_2: '부드러운 오버핏 실루엣',
    selling_point_3: '4시즌 착용 가능한 중간 두께',
    visual_concept: '미니멀한 인테리어 공간 / 자연스러운 일상',
    tone_and_manner: '따뜻한 어스 톤 (베이지, 카키, 브라운)',
    required_scene_1: '카페에서 책을 읽거나 노트북 작업을 하는 모습',
    required_scene_2: '공원이나 거리를 산책하는 자연스러운 모습',
    forbidden_element: '과도하게 포즈를 취하거나 화려한 액세서리',
  },
  food: {
    project_name: '유기농 콜드브루 원두',
    category: '식품/커피',
    differentiation_concept: '인스턴트 커피, 설탕 첨가, 대량 생산',
    target_customer: '커피 본연의 맛을 즐기는 30~50대 홈카페족',
    selling_point_1: '100% 유기농 원두',
    selling_point_2: '저온 추출 콜드브루 방식',
    selling_point_3: '산지 직거래 스페셜티 등급',
    visual_concept: '깔끔한 주방 / 햇살 가득한 창가 / 우드 톤 인테리어',
    tone_and_manner: '따뜻하고 자연스러운 톤 (우드 브라운, 크림, 다크 그린)',
    required_scene_1: '아침 햇살 아래 유리잔에 따르는 콜드브루',
    required_scene_2: '원두 봉지를 열어 원두 향을 맡는 모습',
    forbidden_element: '인공적인 조명, 플라스틱 용기, 설탕/시럽',
  },
  furniture: {
    project_name: '원목 원형 다이닝 테이블',
    category: '가구/테이블',
    differentiation_concept: '모던한 유리/메탈 소재, 각진 디자인',
    target_customer: '따뜻하고 내추럴한 인테리어를 선호하는 30~40대 가족',
    selling_point_1: '천연 원목 100%',
    selling_point_2: '부드러운 곡선 디자인',
    selling_point_3: '4~6인 가족용 최적 크기',
    visual_concept: '자연광 가득한 거실 / 북유럽 스타일 인테리어',
    tone_and_manner: '내추럴 우드 톤 (오크, 월넛, 화이트 오크)',
    required_scene_1: '가족이 함께 식사하는 따뜻한 분위기',
    required_scene_2: '테이블 위에 꽃병과 책이 놓여있는 일상적인 모습',
    forbidden_element: '차가운 메탈 소재, 인공 조명, 과도한 장식',
  },
};

export const CATEGORY_CARDS = [
  {
    id: 'electronics',
    icon: '🎧',
    title: '전자제품',
    subtitle: '이어폰 예시',
    description: '무선 이어폰, 스피커, 스마트 기기 등',
    color: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'cosmetics',
    icon: '💄',
    title: '화장품',
    subtitle: '수분크림 예시',
    description: '스킨케어, 메이크업, 향수 등',
    color: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-200',
  },
  {
    id: 'fashion',
    icon: '👕',
    title: '의류',
    subtitle: '니트 예시',
    description: '상의, 하의, 아우터, 액세서리 등',
    color: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'food',
    icon: '☕',
    title: '식품',
    subtitle: '커피 예시',
    description: '음료, 간식, 건강식품 등',
    color: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'furniture',
    icon: '🪑',
    title: '가구',
    subtitle: '테이블 예시',
    description: '테이블, 의자, 수납가구 등',
    color: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'custom',
    icon: '✏️',
    title: '직접 입력',
    subtitle: '빈 폼으로 시작',
    description: '처음부터 직접 작성하기',
    color: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-300',
  },
];
