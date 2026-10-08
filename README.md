# saju-app (오늘나)

사주 · 태국 점성술 · MBTI · 혈액형을 종합한 개인 맞춤 운세 앱.
Expo(SDK 57) + Expo Router로 **iOS · Android · Web을 하나의 코드베이스**로 운영한다.
서버는 [`saju-be-monorepo`](../saju-be-monorepo)(NestJS).

## 실행

```bash
npm install
npm start            # Expo Go / 시뮬레이터
npm run web          # 웹 개발 서버
npm run build:web    # 웹 정적 빌드 → dist/ (라우트별 HTML 생성, SEO)
npm run typecheck
npm run lint
```

## 구조

```
src/
  app/           Expo Router 라우트 (파일 = 화면 = URL). 화면 구현은 screens/를 re-export
    (tabs)/      홈 · 운세 · 궁합 · 마이
    category/[category], analysis/[source], combined, share, onboarding, profile-setup
    +html.tsx    웹 HTML 셸 (lang, 기본 메타)
  screens/       화면 컴포넌트
  components/    공용 UI
  context/       AppContext (사용자, 오늘의 운세)
  api/
    fortune.ts   운세 API 창구 — 화면은 이것만 의존
    local-engine/ 프로토타입 계산 로직 (임시, BE 이전 대상)
  services/      storage(AsyncStorage), share, notification
  theme/ types/ data/ utils/
```

## 웹 / 플랫폼 분기 원칙

- 웹은 `web.output: "static"`으로 라우트별 HTML을 생성한다. 화면별 메타는 `expo-router/head`의 `<Head>`로 추가.
  동적 라우트는 `generateStaticParams`로 페이지를 미리 생성한다.
- 결제처럼 앱/웹 동작이 다른 기능은 플랫폼 확장자로 분리한다: `payment.native.ts`(인앱결제) / `payment.web.ts`(PG).

## 남은 작업

- [ ] BE 운세 API 구현 후 `src/api/fortune.ts`를 HTTP 호출로 교체, `local-engine/` 삭제
- [ ] BE Swagger(OpenAPI)에서 API 타입 생성
- [ ] `useRef(new Animated.Value())` 패턴 정리 (React Compiler lint `react-hooks/refs` 오류 53건)
- [ ] 앱 아이콘 / 스플래시 이미지 교체 (현재 Expo 기본 이미지)
