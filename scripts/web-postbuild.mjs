/**
 * npm run build:web 뒤에 자동으로 돈다 (postbuild:web).
 * - 없는 주소는 Vercel이 404.html 을 404 상태로 보낸다 → expo-router 의 +not-found 를 그대로 쓴다
 * - expo-router 가 만드는 개발용 경로 목록(/_sitemap)은 공개 사이트에 두지 않는다
 */
import { copyFileSync, existsSync, rmSync } from 'node:fs';

const dist = 'dist';
copyFileSync(`${dist}/+not-found.html`, `${dist}/404.html`);
for (const f of ['_sitemap.html']) if (existsSync(`${dist}/${f}`)) rmSync(`${dist}/${f}`);
