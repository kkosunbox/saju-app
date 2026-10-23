# 사주 결과 마스코트

기존 mascot.png를 참조해 built-in image_gen으로 생성한 투명 본체 5종. 얼굴·소품은 ResultMascot.tsx에서 합성한다. 앱에는 384×384 투명 WebP(quality 90, method 6)를 사용한다. PNG 생성 원본은 Codex generated_images에 보존하고 앱 폴더의 중복 PNG는 제거했다.

## 선택 규칙

- 운세 응답의 날짜 일간(`dayPillar.stem`, 갑~계, 0~9)으로 목·화·토·금·수 타입을 정한다. 개인 원국이 아닌 해당 날짜의 기운을 사용하며, 홈·운세·종합 분석에서 동일하게 적용한다. 날짜 일간이 없으면 기존 무지개 젤리로 대체한다. 같은 오행의 날짜에는 같은 캐릭터가 나올 수 있다.
- 홈에서는 뽑기·풀이가 끝나야 오늘 표정과 소품을 공개.
- 종합 점수 60 미만: 쉬는 표정 + 구름. 80 이상: 웃는 눈. 그 외: 기본 눈.
- 휴식 외에는 가장 높은 분야가 75 이상이면 연애=하트, 재물=동전, 일=연필, 관계=리본. 동점 우선순위는 이 순서. 그 외 작은 별.
- 수치는 표현을 고르는 제품 기준이며 사주 계산을 변경하지 않는다.

## 이미지 최적화

- 원본 5장 합계: 4,576,108 bytes (4.36 MiB).
- 앱용 WebP 5장 합계: 67,356 bytes (65.8 KiB), 98.5% 감소.
- 각 파일: earth 11,620 / fire 14,290 / metal 13,730 / water 11,988 / wood 15,728 bytes.
- LANCZOS로 1254×1254 → 384×384 축소 후 WebP 변환. 축소한 PNG 대비 알파 채널이 정확히 같은지 검사했고 밝은·어두운 배경에서 화질을 비교했다.
- `mascotLayout.ts`의 1254 좌표는 원본 기준 정규화용이므로 그대로 유지한다.
- `expo export --platform all --dump-assetmap`으로 iOS·Android·웹 번들을 확인했다. 새 마스코트는 384px WebP 5종만 참조하며, 생성 원본 PNG 5장의 SHA-256과 일치하는 파일은 배포 에셋에 없다. `docs/`의 검증용 이미지도 에셋 목록에 없다.
- `assets/images/mascot.png`는 로고·뽑기 전·예외 상태에서 실제로 사용하는 기본 마스코트이므로 유지한다. 제외 대상인 고해상도 파생 PNG 5종과 구분한다.

## 크기·소품 보정

- `getMascotFrame`은 투명 PNG의 실제 실루엣 범위를 사용해 뽑기 전후 몸통 너비·중심·바닥 위치를 맞춘다. 새싹·불꽃의 장식은 몸통 위로 자연스럽게 돌출된다.
- `DrawMascot`은 공개 전후 같은 `ResultMascot`을 유지하고 `revealed`로 상태만 바꾼다.
- `MascotAccessory`는 기존 벡터 소품을 부드러운 그라디언트·반사광·측면 두께로 개선했다. SVG ID를 인스턴스마다 분리해 여러 캐릭터를 함께 렌더링할 때 색상이 섞이지 않게 한다.
- 보정 후 비교 이미지: `docs/mascot-refinement.png`.
- 홈 공개 연출: 원본과 결과 레이어를 함께 유지하고, 결과 이미지의 `onDisplay` 이후 480ms 동안 교차 페이드한다. 뽑기 직후의 점프·공개 시 확대는 제거하고 압축 복원·닦기·반사광은 유지한다. 동작 줄이기 설정에서는 페이드 없이 표시한다.
- 웹에서 실제 길게 누르기로 확인한 레이어 투명도: `(1, 0) → (0.910, 0.090) → (0.355, 0.645) → (0, 1)`. 결과 표시 전까지 원본이 유지된다. 검증 화면: `docs/mascot-transition.png`.

## 생성 프롬프트 원문

### wood

Use case: stylized-concept. Asset: one transparent mobile mascot body, wood element variant. Reference image is the existing brand jelly mascot; preserve its simple asymmetrical rounded blob silhouette and silky airbrushed rainbow pastel appearance. Create ONE body only, pale mint green with faint pastel yellow and blue iridescence, small two-leaf sprout on top. No face, NO EYES, no mouth, no limbs, no text, no props other than the described element marker. The app will draw its own face. Large calm unobstructed front surface in the middle for eyes. Front view, softly luminous smooth jelly, no harsh outline, no floor or cast shadow. Square transparent canvas, body occupies x=15%-85%, y=15%-85%, centered. Keep all features inside the central 80% canvas. Match the reference's soft matte translucence, avoid realistic glass or plastic, cute minimal premium Korean app mascot. True transparent background.

### fire

Use case: stylized-concept. Asset: one transparent mobile mascot body, fire element variant. Reference image is the existing brand jelly mascot; preserve its simple asymmetrical rounded blob silhouette and silky airbrushed rainbow pastel appearance. Create ONE body only, pale coral peach with faint pastel yellow and pink iridescence, soft flame-shaped tuft on top. No face, NO EYES, no mouth, no limbs, no text, no props other than the described element marker. The app will draw its own face. Large calm unobstructed front surface in the middle for eyes. Front view, softly luminous smooth jelly, no harsh outline, no floor or cast shadow. Square transparent canvas, body occupies x=15%-85%, y=15%-85%, centered. Keep all features inside the central 80% canvas. Match the reference's soft matte translucence, avoid realistic glass or plastic, cute minimal premium Korean app mascot. True transparent background.

### earth

Use case: stylized-concept. Asset: one transparent mobile mascot body, earth element variant. Reference image is the existing brand jelly mascot; preserve its simple asymmetrical rounded blob silhouette and silky airbrushed rainbow pastel appearance. Create ONE body only, pale buttery cream with faint pastel peach and mint iridescence, a rounder grounded silhouette with two tiny rounded pebble bumps at its base. No face, NO EYES, no mouth, no limbs, no text, no props other than the described element marker. The app will draw its own face. Large calm unobstructed front surface in the middle for eyes. Front view, softly luminous smooth jelly, no harsh outline, no floor or cast shadow. Square transparent canvas, body occupies x=15%-85%, y=15%-85%, centered. Keep all features inside the central 80% canvas. Match the reference's soft matte translucence, avoid realistic glass or plastic, cute minimal premium Korean app mascot. True transparent background.

### metal

Use case: stylized-concept. Asset: one transparent mobile mascot body, metal element variant. Reference image is the existing brand jelly mascot; preserve its simple asymmetrical rounded blob silhouette and silky airbrushed rainbow pastel appearance. Create ONE body only, pearly silvery white with faint pastel lavender and blue iridescence, one small four-point pearl star attached at upper right. No face, NO EYES, no mouth, no limbs, no text, no props other than the described element marker. The app will draw its own face. Large calm unobstructed front surface in the middle for eyes. Front view, softly luminous smooth jelly, no harsh outline, no floor or cast shadow. Square transparent canvas, body occupies x=15%-85%, y=15%-85%, centered. Keep all features inside the central 80% canvas. Match the reference's soft matte translucence, avoid realistic glass or plastic, cute minimal premium Korean app mascot. True transparent background.

### water

Use case: stylized-concept. Asset: one transparent mobile mascot body, water element variant. Reference image is the existing brand jelly mascot; preserve its simple asymmetrical rounded blob silhouette and silky airbrushed rainbow pastel appearance. Create ONE body only, pale sky blue with faint pastel lavender and mint iridescence, a gently curved droplet tip. No face, NO EYES, no mouth, no limbs, no text, no props other than the described element marker. The app will draw its own face. Large calm unobstructed front surface in the middle for eyes. Front view, softly luminous smooth jelly, no harsh outline, no floor or cast shadow. Square transparent canvas, body occupies x=15%-85%, y=15%-85%, centered. Keep all features inside the central 80% canvas. Match the reference's soft matte translucence, avoid realistic glass or plastic, cute minimal premium Korean app mascot. True transparent background.

