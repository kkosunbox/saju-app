This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## 배포 (운Pick)

"라이브·데브 커밋 푸시하고 앱에도 반영"이라고 하면 아래를 순서대로 한다.

1. **커밋** — 작업 브랜치는 `dev`. 메시지는 기존 로그처럼 `type(scope): 바뀐 동작을 영어 한 문단으로` + Co-Authored-By 줄.
2. **웹 (Vercel)** — 브랜치 푸시가 곧 배포다. 따로 할 일 없음.
   ```bash
   git push origin dev          # dev.woonpick.com (데브)
   git push origin dev:master   # woonpick.com (라이브) — dev와 master는 같은 커밋을 유지한다
   ```
3. **앱 (EAS Update, JS만 바뀐 경우)** — `store-test` 채널로 OTA를 보낸다. 내부 테스트(TestFlight·Play 내부 테스트) 빌드가 이 채널을 본다.
   ```bash
   EXPO_PUBLIC_API_URL=https://api-dev.woonpick.com EXPO_PUBLIC_WEB_URL=https://dev.woonpick.com \
     npx eas-cli update --channel store-test --environment preview --message "<한국어 한 줄 요약>" --non-interactive
   ```
   - API·웹 주소는 EAS 환경변수에 없다(eas.json build 프로필에만 있음). **반드시 위처럼 직접 넘긴다** — 빠뜨리면 localhost:8080 을 보는 번들이 나간다(실제로 한 번 재배포함).
   - runtimeVersion 이 fingerprint 정책이라 iOS·Android가 각자 다른 런타임으로 두 그룹이 올라간다. 정상.
   - `production` 채널로는 OTA를 보낸 적이 없다(스토어 심사·출시 빌드). 사용자가 명시적으로 말할 때만 같은 명령에 `--channel production --environment production` 과 운영 주소(`https://api.woonpick.com`, `https://woonpick.com`)로 보낸다.
   - 네이티브 모듈·app.json 플러그인이 바뀌면 OTA로는 닿지 않는다 → `store-test` 프로필로 새 빌드 후 제출.

## 피그마 디자인 반영

피그마 링크를 주며 화면을 맞춰 달라고 하면 `/figma-apply` 스킬(`.claude/skills/figma-apply/SKILL.md`)의 절차를 따른다.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
