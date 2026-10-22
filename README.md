# saju-app (운Pick)

> 오늘의 운, 하나만 Pick! — 사주 · 점성술 · MBTI · 혈액형을 겹쳐 읽는 운세 앱

Expo(SDK 57) + Expo Router로 **iOS · Android · Web을 하나의 코드베이스**로 운영한다.
화면은 `onulna-prototype`(v0.6, 운Pick)을 옮긴 것이고, 서버는 [`saju-be-monorepo`](../saju-be-monorepo).
설계 문서: `saju-be-monorepo/docs/fortune-module-design.md` · 브랜드: [docs/BRAND.md](docs/BRAND.md)

## 실행

```bash
npm install
npm start            # Expo Go / 시뮬레이터
npm run web          # 웹 개발 서버 (http://localhost:4000)
npm run build:web    # 웹 정적 빌드 → dist/ (라우트별 HTML)
npm run typecheck
npm run lint
```

## 흐름 (프로토타입과 다른 점)

- **게스트로 시작**: 앱은 온보딩 슬라이드, 웹은 서비스 소개 랜딩(`LandingScreen`) → 프로필 입력(게스트 계정 생성) → 홈. 로그인 없이 무료 기능을 모두 쓴다.
- 90일 동안 쓰지 않은 게스트는 서버가 데이터와 함께 지운다 (worker cron).
- **로그인은 필요할 때**: 유료 콘텐츠 열람 · 포인트 충전 · 출석 체크 · 고민 상담 · 마이 탭.
  로그인 화면은 위로 띄우고, 성공하면 들어오기 전 화면으로 돌아간다 (`src/app/_layout.tsx`).
- **게스트 → 회원**: 게스트로 쓰던 프로필·궁합 기록은 가입하면 그 계정으로 이어진다 (서버의 게스트 승격·병합).
- **포인트·열람권은 회원만**: 가입 축하 100알, 출석·공유 보상, 충전, 열람 모두 서버 원장 (`src/context/PremiumContext.tsx`).
- 프로토타입의 마스터 계정(앱 내장 관리자 로그인)은 넣지 않았다.

## 구조

```
src/
  app/            Expo Router 라우트 (파일 = 화면 = URL). 화면 구현은 screens/ 를 re-export
    (tabs)/       홈 · 운세 · 콘텐츠 · 궁합 · 마이
    login/ signup find-password legal/[doc]   로그인·약관
    premium/      상세 사주 · 평생운 · 신년 · 월별 · 테마/[kind] · 길일
    category/[category] analysis/[source] combined share wallet mbti-match character talisman spouse consult past-life
    _layout.tsx   글꼴 · Provider · 보호 라우트(Stack.Protected) · 로그인 후 복귀 · 웹 폰 폭 프레임
    +html.tsx     웹 HTML 셸 (lang, 메타, 웹폰트, 한국어 줄바꿈)
  navigation/
    compat.ts     React Navigation 호환 계층 (useNavigation().navigate('화면이름') → Expo Router 경로)
  api/            openapi-fetch 클라이언트(토큰 갱신) · react-query · 서버 OpenAPI 스키마 타입 (npm run api:fetch / api:types)
  services/server/  서버 API 모듈 (auth · profile · fortune · contents · premium · points · compat · consult)
  services/premium/ catalog(가격표 표시) · helpers(표시용 계산: 십성 이름, 충·합, 일진·월주) · data(문장표)
  screens/ components/ context/ theme/ data/ content/ types/ utils/
```

- 화면 이름 → 경로 표는 `src/navigation/compat.ts`의 `ROUTES`. 새 화면을 만들면 라우트 파일과 `ROUTES`에 함께 추가한다.
- 객체 params(공유 카드, 궁합 상대)는 개인정보가 URL에 남지 않도록 메모리로 넘긴다. 웹에서 새로고침하면 사라진다.
- 글꼴: 네이티브는 `src/theme/fontFiles.native.ts`의 파일을 불러오고, 웹은 `+html.tsx`의 웹폰트를 쓴다 (웹 번들에 글꼴 파일을 넣지 않는다).
- 화면 모드(시스템·라이트·다크)는 앱 시작 때 한 번 정해진다. 저장은 웹 localStorage, 네이티브 SecureStore(동기 읽기).

## 서버와 기기의 역할

- **모든 계산과 기록은 서버**(`saju-be-monorepo`, 기본 `http://localhost:8080`, `EXPO_PUBLIC_API_URL`로 변경):
  만세력·운세·무료/유료 콘텐츠·궁합(저장된 상대)·포인트·결제·고민 상담(AI).
- 유료 화면은 열기 전에는 `/premium/previews/*`(무료 상단 요약)만 받고, 본문은 열람권이 있을 때 `/premium/contents/*`에서 받는다.
  앱은 서버 결과를 받아 문장표(`services/premium/data.ts`)로 화면을 그린다.
- **기기에는** 로그인 토큰(네이티브 SecureStore · 웹은 httpOnly 쿠키 + 메모리, localStorage에는 로그인 표시만), 온보딩 완료, 알림 시간, 새 콘텐츠 알림 신청, 이달의 미션 체크만 둔다.
- 결제: 웹은 토스페이먼츠 결제위젯(`/charge`), 앱 인앱결제는 준비 중.
- 웹 배포(Vercel): 환경 변수 `EXPO_PUBLIC_API_URL`에 운영 API 주소. 빌드할 때 들어가므로 바꾸면 다시 배포한다.
- 앱 빌드(EAS): `eas.json`의 빌드 종류(preview · production)마다 `EXPO_PUBLIC_WEB_URL` = 앱에서 공유하는 링크가 여는 웹 주소. 웹은 지금 열린 주소를 쓰므로 필요 없다. 지금 값(`woonpick.com` · `dev.woonpick.com`)은 예시 — 도메인이 정해지면 바꾼다.

## 남은 작업

- [ ] 네이티브(iOS·Android) 시뮬레이터/실기기 확인 — 지금까지 웹으로만 확인함
- [x] 웹 소셜 로그인(카카오·네이버·구글) — 지금은 다른 프로젝트 테스트 키, 개발 서버는 `npm run web`(포트 4000) — 콘솔에 `http://localhost:4000/auth/callback/{provider}` 콜백 등록 필요
- [ ] 앱(네이티브) 소셜 로그인 · Apple 로그인 · 앱 인앱결제 — 운Pick 키·스토어 계정 발급 후
- [ ] lint 정리: `react-hooks/refs` 54건(프로토타입의 `useRef(new Animated.Value())` 패턴 — React Compiler가 해당 컴포넌트 최적화를 건너뜀), `react/no-unescaped-entities` 22건 등
- [ ] 아이콘·스플래시 재생성 스크립트(`npm run icons`)는 프로토타입에만 있음
