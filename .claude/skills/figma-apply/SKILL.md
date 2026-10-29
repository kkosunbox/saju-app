---
name: figma-apply
description: 피그마 디자인 링크를 받아 운Pick 앱 화면에 컴포넌트 단위로 반영하고, 로컬 웹 화면에서 글자 크기·굵기·자간·간격·여백을 수치로 대조한다. "피그마 디자인 반영", "디자인과 맞춰 줘", figma.com/design 링크와 함께 화면 이름을 줄 때 사용.
---

# 피그마 디자인 반영

사용자 요청 예: "<figma 링크> 길일 찾기 피그마 디자인이야. 기능적으로 빠지는 건 없고, 빠져 있으면 피그마에 누락된 거야. 컴포넌트 단위로 바뀐 것만 적용. 폰트 사이즈·웨이트·자간, UI 간격·패딩·마진을 꼼꼼히 확인. 앱 내 브라우저에 로컬 화면 떠 있으니 써. 알도 편하게 써도 됨."

## 원칙

- **기능은 건드리지 않는다.** 디자인에 없는 요소는 디자인 누락으로 보고 그대로 둔다. 바뀐 컴포넌트의 모양·수치만 옮긴다.
- 공용 컴포넌트(`Screen`, `ShareCta`, `Kit`, `Disclaimer` …)가 바뀌었으면 공용 쪽을 고친다(다른 화면에도 반영됨 — 보고할 때 어느 화면이 같이 바뀌는지 말한다). 이 화면에만 해당하면 화면 파일에서 고친다.
- 문구를 바꿔도 기존 디자인 요소(버튼 끝 → 같은 기호)는 남긴다.

## 1. 디자인 읽기

1. URL에서 fileKey와 node-id(`269-1017` → `269:1017`)를 뽑아 `get_figma_data`(Framelink Figma MCP)로 노드 트리를 받는다.
2. `download_figma_images`로 프레임 전체 PNG(pngScale 1)와 아이콘 노드들 SVG를 받는다. 저장 위치는 `saju-be-monorepo/.figma-tmp/<화면>/`(MCP 이미지 루트가 그 저장소다).
3. 긴 프레임 PNG는 Pillow(`/usr/bin/python3 -E`)로 600px씩 잘라 2배로 키워서 본다.
4. **프레임 구조를 먼저 판단한다.** 이 프로젝트 피그마는 흔히 *기존 화면 캡처(RECTANGLE + IMAGE fill)* 위에 바뀐 부분만 벡터로 덧그린다.
   - 캡처 이미지에 `cropTransform`이 있고 원본이 데스크톱 폭이면 캡처는 약 0.87배로 줄어 있다(앱 칸 430px → 375px). 캡처 속 위치·크기를 그대로 믿지 말고, 덧그린 벡터 노드의 크기·색·글꼴만 기준으로 삼는다.
   - 캡처 위 단색 RECTANGLE(예: `#F5F6F8` 31×26)은 예전 요소를 가리는 패치다 → 그 자리 요소가 바뀐다는 뜻.
   - 덧그린 요소의 위치는 "예전 요소와 중심이 같게" 놓인 경우가 많다. 주변 글자 위치가 그대로 유지되도록 gap을 조정한다.
5. 바뀐 컴포넌트 목록을 만든다: 헤더(뒤로가기 24 · 제목 18 SemiBold · 오른쪽 아이콘), 아이콘 교체, 배지, 카드, 공유 배너, 고지문 등. TEXT 노드의 fontSize/fontWeight/lineHeight/letterSpacing(em → px = em × fontSize)과 FRAME의 padding/gap/borderRadius를 기록한다.

## 2. 코드 찾기

- 앱은 `/Users/soohyun/Files/repository/hihireo08/saju-app`. 화면은 `src/screens/**`, 라우트는 `src/app/**`. 화면 제목으로 grep 한다.
- 아이콘: 선형은 `src/components/Icon.tsx`(24 viewBox, `external`·`download`·`close` 등 이미 있음 — 먼저 찾아본다), 꽉 찬 아이콘은 `src/components/SolidIcon.tsx`(size = 긴 변).
- 새 SolidIcon은 **SVG의 `d`를 스크립트로 그대로 옮긴다**(손으로 좌표 옮기지 않기). 그림이 Figma 20×20 틀 안에 놓인 아이콘은 원본 틀 크기(w/h)를 그대로 쓰면 위치가 정확하다.
- 색은 `src/theme/colors.ts` 토큰을 우선(`navy #1D212D`, `accent #28B2FE`, `ink #222`, `inkMute #777` …). 토큰에 없는 디자인 색은 파일 상단 상수로 둔다.
- 글자 스타일은 `src/theme/typography.ts`의 `txt.*`(h2 18/600, small 13/500, caption 12/500 …)와 비교한다.

## 3. 로컬 화면에서 재기

- 웹 개발 서버는 보통 다른 채팅이 4000번에 띄워 둔 상태다. `preview_start`가 포트 충돌을 내면 `navigate`로 `http://localhost:4000/<경로>`(예: `/premium/lucky`)를 바로 연다. 같은 폴더라 HMR로 수정이 반영된다.
- `resize_window` 375×812로 맞추고 잰다(콘텐츠 폭 327, 좌우 24). 끝나면 `preset: desktop`으로 되돌린다.
- 수치는 스크린샷 눈대중이 아니라 `javascript_tool`로 `getBoundingClientRect()`와 `getComputedStyle()`(fontSize·fontWeight·lineHeight·letterSpacing·color)을 읽어 표로 비교한다. 요소는 `[aria-label="…"]`나 textContent로 찾는다.
- 유료 화면은 잠겨 있으면 본문이 안 보인다. 사용자가 허락했으면 로컬(dev) 계정의 알로 열어서 확인한다(잠금 패널 "N으로 전체 보기" → 시트 "N으로 열기"). 쓴 알은 보고에 적는다.
- 스크롤 영역은 `element.scrollIntoView()` 후 `computer zoom`으로 확인한다.

## 4. 마무리

1. `npx tsc --noEmit -p .` 통과 확인.
2. 보고: 바뀐 컴포넌트별로 디자인 수치와 측정값, 같이 바뀐 다른 화면, 확인 못 한 것(예: 다크 모드), 쓴 알.
3. 배포 요청이 오면 `AGENTS.md`의 "배포 (운Pick)" 절차를 따른다.
