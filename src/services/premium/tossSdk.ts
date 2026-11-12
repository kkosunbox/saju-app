/** 토스페이먼츠 JS SDK v2 (https://docs.tosspayments.com/sdk/v2/js) 중 쓰는 부분만 — 웹에서만 부른다 */

/** 결제위젯 (알 충전) */
export interface TossWidgets {
  setAmount(amount: { currency: 'KRW'; value: number }): Promise<void>;
  renderPaymentMethods(p: { selector: string; variantKey?: string }): Promise<unknown>;
  renderAgreement(p: { selector: string; variantKey?: string }): Promise<unknown>;
  requestPayment(p: { orderId: string; orderName: string; successUrl: string; failUrl: string }): Promise<void>;
}

/** 결제창 (정기 구독 카드 등록) — 성공하면 successUrl?customerKey=…&authKey=… 로 돌아온다 */
export interface TossPayment {
  requestBillingAuth(p: { method: 'CARD'; successUrl: string; failUrl: string }): Promise<void>;
}

export type TossPaymentsFn = (clientKey: string) => {
  widgets(p: { customerKey: string }): TossWidgets;
  payment(p: { customerKey: string }): TossPayment;
};

const TOSS_SDK = 'https://js.tosspayments.com/v2/standard';
let sdkLoading: Promise<TossPaymentsFn> | null = null;

export function loadToss(): Promise<TossPaymentsFn> {
  const w = window as unknown as { TossPayments?: TossPaymentsFn };
  if (w.TossPayments) return Promise.resolve(w.TossPayments);
  sdkLoading ??= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = TOSS_SDK;
    el.onload = () => (w.TossPayments ? resolve(w.TossPayments) : reject(new Error('TossPayments missing')));
    el.onerror = () => { sdkLoading = null; reject(new Error('TossPayments load failed')); };
    document.head.appendChild(el);
  });
  return sdkLoading;
}

/** 결제창을 닫거나 실패했을 때 토스가 주는 코드 → 안내 문구 */
export const TOSS_FAIL_MESSAGE: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제를 취소했어요.',
  PAY_PROCESS_ABORTED: '결제가 중단됐어요. 다시 시도해 주세요.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했어요. 다른 카드로 시도해 주세요.',
  USER_CANCEL: '카드 등록을 취소했어요.',
};
