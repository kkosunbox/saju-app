/** 구독 상태 문구 — 내 알 카드와 구독 관리 화면이 같이 쓴다 */
import { MySubscription } from '../../services/server/pointsApi';

const KST = 9 * 3600_000;
const kst = (iso: string) => new Date(Date.parse(iso) + KST);

/** 서버 시각 → 한국 날짜 "11월 12일" */
export const kstMonthDay = (iso: string) => {
  const d = kst(iso);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};

/** 서버 시각 → 한국 날짜 "2026.11.12" */
export const kstDot = (iso: string) => kst(iso).toISOString().slice(0, 10).replace(/-/g, '.');

export const won = (n: number) => n.toLocaleString('ko-KR') + '원';

/** 상태 칩 글자 */
export function subscriptionStatusLabel(sub: MySubscription): string {
  if (sub.status === 'grace') return '결제 실패';
  if (sub.status === 'cancelled') return '해지 예약';
  return '구독 중';
}

/** 한 줄 요약: 다음 결제일 · 해지 예약 · 결제 실패 */
export function subscriptionLine(sub: MySubscription): string {
  if (sub.status === 'grace') {
    return sub.graceUntil ? `결제 실패 · ${kstMonthDay(sub.graceUntil)}까지 다시 시도해요` : '결제 실패 · 다시 시도하는 중이에요';
  }
  if (sub.status === 'cancelled') return `해지 예약 · ${kstMonthDay(sub.currentPeriodEnd)}까지 이용`;
  if (sub.nextChargeAt) return `다음 결제 ${kstMonthDay(sub.nextChargeAt)} · ${won(sub.priceKrw)}`;
  // App Store · Google Play 구독은 스토어가 기간 끝에 갱신한다
  if (sub.store !== 'toss' && sub.autoRenew) return `다음 갱신 ${kstMonthDay(sub.currentPeriodEnd)} · ${won(sub.priceKrw)}`;
  return `${kstMonthDay(sub.currentPeriodEnd)}까지 이용`;
}
