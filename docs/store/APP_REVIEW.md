# App Store 심사 준비 (2026-10-28)

## 계정과 빌드

- App Store Connect 앱: 운Pick, `6827429370`, iOS 버전 1.0.
- 심사 계정: `test@woonpick.com`. 비밀번호는 App Store Connect에만 저장한다.
- 무료 알 지급 후 라이브 잔액 10,110개, 개발 잔액 10,000개. 두 환경에서 실제 로그인과 잔액 조회를 검증했다.
- TestFlight 빌드 4는 `store-test` 프로필로 개발 API에 연결된다. TestFlight 심사 대기 상태를 확인했다.
- 정식 제출용 빌드 5는 `production` 프로필로 라이브 API에 연결된다.
- EAS build: `ef120c61-2673-4e99-94f5-8bf35b982a7c` (FINISHED).
- EAS submission: `8e0d3cac-bd81-4d7b-95c0-e0b094b6c7ef` (FINISHED, 2026-10-28 01:17 KST).
- Apple 빌드 5 처리 VALID 확인 후 정식 버전에 연결했다. 개발용 빌드 4는 정식 버전에서 선택 해제했다.
- **2026-10-28 01:31 KST 제출 완료**. iOS 앱 1.0 / 빌드 1.0.0 (5)와 인앱 상품 5개, 총 6개 항목 모두 **심사 대기 중**인 것을 App Store Connect에서 확인했다.
- 제출 ID: `b8157ddf-da8c-4a4a-8f12-c93b05a47939`.
- 제출 내역: https://appstoreconnect.apple.com/apps/6827429370/distribution/reviewsubmissions/details/b8157ddf-da8c-4a4a-8f12-c93b05a47939
- 증빙 화면: `review-submitted.png`. 기존 설정대로 승인 후 자동 출시한다.

## 저장한 정보

- 한국어 앱 설명·키워드·지원 URL·마케팅 URL·저작권.
- 담당자 SEAN KIM, 회사 공개 이메일과 전화번호.
- TestFlight 설명·심사 메모·로그인 정보와 정식 앱 심사 메모·로그인 정보.
- 콘텐츠 권한: 직접 제작·AI 생성 자료만 사용한다는 운영자 확인에 따라 작성.
- 연령 설문: 한국 12+, 글로벌 13+.
- 개인정보처리방침: https://woonpick.com/legal/privacy
- 개인정보 레이블 8종을 운영자 동의 후 게시했다. 계정에 연결되며 앱 기능/개인화에 사용하고 광고 추적에 사용하지 않는다.
- 앱 다운로드 무료, Apple 기본 전체 배포 지역. 인앱 상품은 기존 설정대로 한국 스토어에서만 구매 가능하며 심사 메모에 명시했다.

## 이미지

- 공개 제품 페이지: `screenshots/01-home.png` ~ `04-content.png`, 1179×2556 PNG 4장.
- 동일 앱 코드의 라이브 모바일 웹 화면을 사용했다. iOS 전용 결제 화면을 재현한 이미지는 아니다.
- `screenshots/05-iap-review.png`: 공통 알 충전 목록. 5개 인앱 상품의 심사용 이미지로만 사용했다.
- 상품 ID: `points_1000`, `points_3000`, `points_5000`, `points_10000`, `points_30000`.
- 상품별 심사 이미지 COMPLETE, 상품 상태 READY_TO_SUBMIT 확인 후 동반 제출했다. 현재 5개 상품 모두 심사 대기 중이다.

## 서버와 검사

- Backend `b7d2a24`: 운영의 Apple Sandbox 거래는 지정한 심사 계정(ID 3)만 허용한다. 서명, Apple 서버 재조회, 거래 소유자, 중복 지급 검증은 유지한다.
- 개발·운영 배포 Ready/Green과 심사 계정 로그인·잔액 조회를 검증했다.
- Backend 포인트·결제 테스트 62개, TypeScript, 변경 파일 ESLint, API 빌드 통과.
- App TypeScript 통과. 기존 앱 ESLint는 55 errors / 25 warnings으로 실패했으며 앱 런타임 코드는 이번 작업에서 수정하지 않았다.
- 실제 iPhone의 신규 샌드박스 구매·재구매·환불은 이번 작업에서 실행하지 않았다.
