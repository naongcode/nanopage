# 나노바나나 프로젝트 가이드

## 프로젝트 개요

이커머스 상세페이지 시각화 프롬프트 생성 서비스
- Next.js + TypeScript + Tailwind CSS
- OpenAI GPT-4o-mini API
- Supabase (Database + Storage)

## 주요 문서

- **`로드맵.md`** - 전체 개발 계획 및 진행상황 (체크박스로 관리)
- **`작업내역.md`** - 상세 작업 히스토리 및 변경 사항
- **`상세페이지 기획.md`** - 서비스 기획안
- **`프로세스_정의.md`** - 3단계 작업 프로세스 정의
- **`기능_및_고려사항.md`** - 기능 목록 및 기술적 고려사항

## 작업 지침

1. `로드맵.md`를 따라서 우선순위대로 작업 수행
2. 완료된 항목은 `로드맵.md`의 체크박스에 표시
3. 상세한 작업 내역은 `작업내역.md`에 날짜별로 기록
4. 파일이 1000줄 이상 길어지면 코드 분리 검토
5. DB가 변경되면 supabase db push로 업데이트 할것
6. migration 파일은 nano/supabase/migrations에 저장할것

## 디렉토리 구조

```
nano/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── projects/
│   │   │   │   ├── route.ts (POST: 프로젝트 생성)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts (GET: 프로젝트 조회, PUT: 프로젝트 수정)
│   │   │   ├── scenarios/
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts (PATCH: 시나리오 수정, DELETE: 시나리오 삭제)
│   │   │   │       └── restore/
│   │   │   │           └── route.ts (POST: 시나리오 복원)
│   │   │   ├── setup/
│   │   │   │   └── route.ts (Supabase 설정)
│   │   │   └── upload/
│   │   │       └── route.ts (이미지 업로드)
│   │   ├── layout.tsx
│   │   ├── page.tsx (홈 페이지)
│   │   ├── new/
│   │   │   └── page.tsx (새 프로젝트 생성)
│   │   ├── edit/
│   │   │   └── page.tsx (프로젝트 수정) ⭐ 신규
│   │   ├── projects/
│   │   │   └── page.tsx (프로젝트 목록)
│   │   ├── result/
│   │   │   └── page.tsx (시나리오 결과)
│   │   └── setup/
│   │       └── page.tsx (설정 페이지)
│   ├── components/
│   │   └── FieldOptions.tsx
│   ├── lib/
│   │   ├── field-options.ts
│   │   ├── supabase.ts
│   │   └── templates.ts
│   └── types/
│       └── index.ts
├── public/
├── supabase/
├── supabase-schema.sql
├── supabase-storage-setup.sql
├── supabase-migration-soft-delete.sql
├── next.config.ts
├── package.json
└── tsconfig.json
```