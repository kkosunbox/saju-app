/**
 * 유료 콘텐츠 카드의 노출 · 클릭 기록 — 모아 두었다가 몇 초에 한 번 서버(POST /v1/promo-events)로 보낸다.
 * 기록은 성과 집계용이라 실패해도 화면에는 아무 영향이 없다.
 */
import { AppState } from 'react-native';
import { requestData } from '../../api/client';

export type PromoEventType = 'view' | 'click';
interface PromoEvent { type: PromoEventType; screen: string; item: string }

const FLUSH_MS = 4000;
const MAX_BATCH = 50;
let queue: PromoEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  while (queue.length) {
    const events = queue.slice(0, MAX_BATCH);
    queue = queue.slice(MAX_BATCH);
    requestData('/v1/promo-events', { events }).catch(() => {});
  }
}

AppState.addEventListener('change', state => { if (state !== 'active') flush(); });

/** screen: 화면 이름 (fortune_daily, category_love …), item: 열람권 키 또는 그 앞부분 (theme:love, lucky, consult …) */
export function trackPromo(type: PromoEventType, screen: string, item: string) {
  queue.push({ type, screen, item });
  if (queue.length >= MAX_BATCH) flush();
  else timer ??= setTimeout(flush, FLUSH_MS);
}
