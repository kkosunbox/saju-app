# saju-app (운Pick)

> 오늘의 운, 하나만 Pick! — 사주 · 태국 점성술 · MBTI · 혈액형을 겹쳐 읽는 운세 앱

Expo(SDK 57) + Expo Router로 **iOS · Android · Web을 하나의 코드베이스**로 운영한다.
화면은 `onulna-prototype`(v0.6, 운Pick)을 옮긴 것이고, 서버는 [`saju-be-monorepo`](../saju-be-monorepo).
설계 문서: `saju-be-monorepo/docs/fortune-module-design.md` · 브랜드: [docs/BRAND.md](docs/BRAND.md)

## 실행

```bash
npm install
npm start            # Expo Go / 시뮬레이터
npm run web          # 웹 개발 서버
npm run build:web    # 웹 정적 빌드 → dist/ (라우트별 HTML)
npm run typecheck
npm run lint
```

## 흐름 (프로토타입과 다른 점)

- **게스트로 시작**: 온보딩 → 프로필 입력 → 홈. 로그인 없이 무료 기능을 모두 쓴다.
- **로그인은 필요할 때**: 유료 콘텐츠 열람 · 포인트 충전 · 출석 체크 · 마이 탭 · 프로필 입력 첫 단계("로그인").
  로그인 화면은 위로 띄우고, 성공하면 들어오기 전 화면으로 돌아간다 (`src/app/_layout.tsx`).
- **포인트·열람권은 회원만**: 게스트는 0P, 가입 축하 100P도 로그인 후 (`src/context/PremiumContext.tsx`).
- 게스트로 입력한 프로필은 로그인한 계정에 프로필이 없을 때만 그 계정으로 옮긴다 (서버의 게스트 병합과 같은 규칙).
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
  screens/ components/ context/ services/ theme/ data/ content/ types/ utils/   프로토타입 그대로
```

- 화면 이름 → 경로 표는 `src/navigation/compat.ts`의 `ROUTES`. 새 화면을 만들면 라우트 파일과 `ROUTES`에 함께 추가한다.
- 객체 params(공유 카드, 궁합 상대)는 개인정보가 URL에 남지 않도록 메모리로 넘긴다. 웹에서 새로고침하면 사라진다.
- 화면 모드(시스템·라이트·다크)는 앱 시작 때 한 번 정해진다. 저장은 웹 localStorage, 네이티브 SecureStore(동기 읽기).

## 지금은 로컬로 동작하는 것 (BE 연동 단계에서 교체)

| 기능 | 현재 | 교체 대상 |
|---|---|---|
| 로그인 | `services/auth/authService.ts` 기기 저장 데모 | `/auth/guest`, `/auth/{kakao,naver,google,apple}` |
| 운세 계산 | `services/fortune`, `services/premium/engine.ts` (근사 만세력) | `/fortunes/*` (정확한 만세력) |
| 프로필 | AsyncStorage | `/fortune-profile` (음력 입력 지원) |
| 포인트·열람권 | `PremiumContext` 기기 저장 데모 | 서버 원장 + 인앱결제/PG |
| AI 리포트·고민 상담 | 꺼짐 | 서버 API |

## 남은 작업

- [ ] 네이티브(iOS·Android) 시뮬레이터/실기기 확인 — 이번 이전은 웹으로만 확인함
- [ ] 프로필 입력에 음력·윤달 선택 추가 (서버는 지원, 화면은 양력만)
- [ ] lint 정리: `react-hooks/refs` 54건(프로토타입의 `useRef(new Animated.Value())` 패턴 — React Compiler가 해당 컴포넌트 최적화를 건너뜀), `react/no-unescaped-entities` 22건 등
- [ ] 아이콘·스플래시 재생성 스크립트(`npm run icons`)는 프로토타입에만 있음
