// 공통 블록 설정 타입
export interface CommonBlockSettings {
  blockWidth: number;
  blockBackgroundColor: string;
  textFontFamily: string;
  textFontSize: number;
  textColor: string;
  textFontWeight: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

// 개별 블록 스타일 (공통 설정의 일부만 override 가능)
export interface BlockStyle extends Partial<CommonBlockSettings> {}

// 이미지 자르기 정보
export interface ImageCrop {
  x: number;      // 퍼센트
  y: number;      // 퍼센트
  width: number;  // 퍼센트
  height: number; // 퍼센트
  zoom: number;   // 배율
  // 픽셀 기반 (정확한 표시용)
  pixelX?: number;
  pixelY?: number;
  pixelWidth?: number;
  pixelHeight?: number;
}

// 프로젝트 타입 정의
export interface Project {
  id?: string;
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
  product_images?: string[]; // 제품 이미지 URL 배열
  common_block_settings?: CommonBlockSettings; // 공통 블록 설정
  created_at?: string;
  updated_at?: string;
}

// 레이아웃 프리셋 타입
export type LayoutPreset =
  | 'vertical'              // 이미지 위 + 텍스트 아래 (기본)
  | 'horizontal-left'       // 이미지 좌측 + 텍스트 우측
  | 'horizontal-right'      // 텍스트 좌측 + 이미지 우측
  | 'overlay-center'        // 이미지 전체 배경 + 텍스트 중앙
  | 'overlay-bottom'        // 이미지 전체 배경 + 텍스트 하단
  | 'overlay-top'           // 이미지 전체 배경 + 텍스트 상단
  | 'text-first'            // 텍스트 위 + 이미지 아래
  | 'image-dominant'        // 이미지 80% + 하단 작은 캡션
  | 'magazine'              // 이미지 60% 좌측 + 텍스트 40% 우측
  | 'card';                 // 이미지 상단 (정사각형) + 텍스트 하단 (카드)

// 시나리오 타입 정의
export interface Scenario {
  id?: string;
  project_id?: string;
  scenario_no: number;
  image_type: string;
  role: string;
  prompt_text: string;
  user_edited_prompt_text?: string | null;
  description_text?: string;  // AI 생성 설명글
  user_edited_description_text?: string | null;  // 사용자 수정 설명글
  generated_image_urls?: string[];  // 생성된 모든 이미지들
  selected_image_url?: string | null;  // 현재 선택된 이미지
  layout_preset?: LayoutPreset | null;  // 레이아웃 프리셋
  text_position_x?: number;  // 텍스트 X 좌표
  text_position_y?: number | null;  // 텍스트 Y 좌표 (NULL이면 기본 레이아웃)
  text_width?: number | null;  // 텍스트 너비
  text_height?: number | null;  // 텍스트 높이
  block_style?: BlockStyle | null;  // 개별 블록 스타일 override
  image_crop?: ImageCrop | null;  // 이미지 자르기 정보
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// API 요청/응답 타입
export interface CreateProjectRequest {
  // Step 1: 사용자 입력 (필수)
  project_name: string;
  category: string;
  differentiation_concept: string;
  target_customer: string;
  product_images?: string[];

  // Step 2: AI가 자동 생성 (선택사항, 사용자가 직접 입력할 수도 있음)
  selling_point_1?: string;
  selling_point_2?: string;
  selling_point_3?: string;
  visual_concept?: string;
  tone_and_manner?: string;
  required_scene_1?: string;
  required_scene_2?: string;
  forbidden_element?: string;
}

export interface CreateProjectResponse {
  project_id: string;
  scenarios: Scenario[];
}

export interface GetProjectResponse {
  project: Project;
  scenarios: Scenario[];
}

export interface UpdateScenarioRequest {
  image_type?: string;
  role?: string;
  user_edited_prompt_text?: string;
  user_edited_description_text?: string;
  layout_preset?: LayoutPreset | null;  // 레이아웃 프리셋
  text_position_x?: number;
  text_position_y?: number | null;
  text_width?: number | null;
  text_height?: number | null;
  block_style?: BlockStyle | null;  // 개별 블록 스타일
  image_crop?: ImageCrop | null;  // 이미지 자르기
}
