# 전생 직업 마스코트

- 한국 20종 + 외국 20종. 앱은 `assets/images/past-life/{korean,foreign}/*.webp`만 참조한다.
- 384×384 투명 WebP, quality 82 / method 4. 원본 PNG 49,736,624 bytes → 앱용 826,748 bytes (약 98.34% 감소), 개별 최대 29,742 bytes.
- 축소 후 알파 채널과 WebP 재디코딩 알파 채널이 동일한지 40종 모두 검사했다.
- 한국 서당 훈장은 입 제거 수정본을 사용한다. 원본 및 생성 프롬프트는 `output/past-life-mascots-*`에 보존한다.

## 표시

`resolvePastLifeArt`에서 직업과 시대를 함께 확인한다. 서버와 동일하게 고려·조선·신라·백제·발해는 한국 그림, 그 밖의 시대는 외국 그림이다. 학당 선생·궁정 화가·큰 상단의 상인은 해당 직업으로 정규화한다. 모르는 직업은 기본 마스코트로 대체한다.

`PastLifeArt`를 뽑기 연출·결과·공유카드가 함께 사용한다. 뽑기 전에는 선택된 그림만 투명하게 준비하고, 공개 시점에 표시한다. 공유 데이터에는 직업·시대만 추가하며, 그림이 표시된 뒤 저장·공유와 웹 카드 사전 캡처를 활성화한다.

발밑의 옅은 타원 그림자는 기존 `MascotShadow` SVG를 재사용한다. 이미지 파일 추가나 이미지별 중복 저장 없이 화면과 저장 카드 모두에 적용된다.

## 확인

- `node --test tests/pastLifeArt.test.cjs`: 20개 직업 × 서버 시대 12개, 외국 직업 별칭, 미지의 직업, 공유 결과 일치, 전체/개별 용량 제한.
- Expo iOS·Android·웹 export 및 assetmap에서 40종 모두 384px WebP로 포함되는 것과 `output/` 원본이 포함되지 않는 것을 확인.
- 웹에서 실제 전생 뽑기 → 결과 → 스토리 카드 → PNG 저장 확인. 증빙은 `output/past-life-integration/`.
- TypeScript 통과. Expo lint 오류 0개, 기존 경고 194개.
