# Vercel 배포 가이드

## 사전 준비

1. Vercel 계정 생성 (https://vercel.com)
2. GitHub/GitLab/Bitbucket 연동
3. 필요한 환경변수 준비

## 배포 방법

### 1. Vercel CLI를 통한 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리로 이동
cd nano

# 배포
vercel
```

### 2. Vercel 웹 대시보드를 통한 배포

1. Vercel 대시보드 접속 (https://vercel.com/dashboard)
2. "New Project" 클릭
3. Git Repository 선택 및 import
4. Framework Preset: Next.js (자동 감지됨)
5. Root Directory: `nano` 선택
6. Environment Variables 추가 (아래 참고)
7. "Deploy" 클릭

## 환경변수 설정

Vercel 프로젝트 설정에서 다음 환경변수를 추가해야 합니다:

### Supabase 설정
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anonymous Key

### AI API 설정
- `OPENAI_API_KEY`: OpenAI API Key
- `GOOGLE_API_KEY`: Google Gemini API Key
- `google_key`: Google Key
- `google_project`: Google Project ID

## 환경변수 추가 방법

### Vercel 대시보드
1. 프로젝트 Settings > Environment Variables
2. 각 환경변수 이름과 값 입력
3. Environment: Production, Preview, Development 선택
4. "Save" 클릭

### Vercel CLI
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_API_KEY
vercel env add google_key
vercel env add google_project
```

## 배포 후 확인사항

1. Supabase 연결 확인
2. 이미지 업로드 기능 확인
3. AI 프롬프트 생성 기능 확인
4. 프로젝트 저장/불러오기 기능 확인

## 도메인 설정

1. Vercel 프로젝트 Settings > Domains
2. Custom Domain 추가
3. DNS 설정 (Vercel이 제공하는 레코드 추가)

## 문제 해결

### 빌드 에러
- 환경변수가 올바르게 설정되었는지 확인
- `package.json`의 dependencies 확인
- Vercel 로그 확인

### Supabase 연결 에러
- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### API 에러
- OpenAI 및 Google API 키가 유효한지 확인
- API 사용량 제한 확인
