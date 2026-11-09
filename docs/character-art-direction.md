# 사주 캐릭터 배경

생성 이미지는 캐릭터가 없는 오행 풍경 5종이다. 기존 캐릭터 60종은 앱에서 별도 레이어로 표시한다.

천간의 오행으로 풍경을 선택한다. 선택 로직은 `src/data/characterScene.ts`, 이미지를 배치하는 코드는 `src/components/CharacterScene.tsx`에 있다.

| 오행 | 배경 파일 | 풍경 |
| --- | --- | --- |
| 목 | `wood-clearing.webp` | 숲속 공터 |
| 화 | `fire-dawn.webp` | 살구빛 새벽 |
| 토 | `earth-dunes.webp` | 모래 언덕 |
| 금 | `metal-garden.webp` | 안개 정원 |
| 수 | `water-shore.webp` | 푸른 호숫가 |

파일은 `assets/images/character-worlds/`에 저장한다. 배경은 960×640 RGB WebP이며, 5종의 합계는 97,524바이트다.

캐릭터 발과 접지 그림자는 풍경 높이의 86%에 맞춘다. 작은 찰떡 캐릭터 영역에는 아바타를 사용한다.

캐릭터 옆의 배지는 일주 한자 대신 성장·열정·안정·결단·지혜의 기운을 표시한다. 결과 화면과 공유 카드에서 같은 문구를 사용한다.

생성 도구는 OpenAI 내장 `image_gen`이다. 정확한 프롬프트와 원본 파일명은 `character-backgrounds-imagegen.json`에 기록되어 있다. 고해상도 생성 원본 PNG는 앱 번들에 포함하지 않는다.

Pillow가 설치된 환경에서 다음 명령으로 WebP를 다시 만들 수 있다. `CHARACTER_IMAGE_SOURCE_DIR`는 매니페스트에 기록된 원본 PNG가 있는 디렉터리다.

```sh
python3 scripts/optimize-character-assets.py --manifest docs/character-backgrounds-imagegen.json --source-dir "$CHARACTER_IMAGE_SOURCE_DIR" --output-dir assets/images/character-worlds
```

`tests/characterScene.test.cjs`는 60갑자의 캐릭터 인덱스와 오행 배경 선택, 이름 대체 선택을 검사한다.
