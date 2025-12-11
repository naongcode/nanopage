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
  created_at?: string;
  updated_at?: string;
}

// 시나리오 타입 정의
export interface Scenario {
  id?: string;
  project_id?: string;
  scenario_no: number;
  image_type: string;
  role: string;
  prompt_text: string;
  user_edited_prompt_text?: string | null;
  generated_image_urls?: string[];  // 생성된 모든 이미지들
  selected_image_url?: string | null;  // 현재 선택된 이미지
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
}
