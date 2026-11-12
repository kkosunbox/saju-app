/** Points wallet, history, unlocks (entitlements) and the web Toss charge. Members only. */
import { api, call, requestData } from '../../api/client';

export interface Wallet {
  balance: number;
  expiringSoon: number;
  attendedToday: boolean;
  /** 오늘 출석 체크로 받는 알 (구독 중이면 2배) */
  attendanceReward: number;
  /** 구독 혜택으로 출석 알이 2배 */
  attendanceDoubled: boolean;
  shareRewardsLeft: number;
  /** 이번 호출로 준 가입 축하 알 (지갑을 처음 만든 호출만, 그 밖엔 0) */
  signupBonus: number;
}

export type TransactionType = 'charge' | 'grant' | 'use' | 'expire' | 'refund' | 'revoke' | 'adjust';
/** 이용내역 필터 — in: 들어온 알(충전·적립), out: 나간 알(사용·소멸·환불·회수) */
export type TransactionDirection = 'in' | 'out';
export interface PointTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  label: string;
  createdAt: string;
}

export interface Entitlement {
  contentKey: string;
  source: string;
  /** Period items only (길일 찾기); null keeps forever. */
  validUntil: string | null;
  createdAt: string;
}

/** 이번 결제 회차의 구독 혜택 */
export interface SubscriptionBenefits {
  /** 지금 혜택을 받는 중 (결제 실패 재시도 중이면 false) */
  active: boolean;
  consultTotal: number;
  consultUsed: number;
  consultLeft: number;
  /** 무료로 열 수 있는 이번 달 월별 상세운세 키 (monthly:YYYY-MM) */
  monthlyContentKey: string;
  attendanceMultiplier: number;
}

/** 내 구독 — active 이용 중 · grace 결제 실패(재시도 중) · cancelled 해지 예약(기간 끝까지 유지) */
export interface MySubscription {
  id: number;
  store: 'apple' | 'google' | 'toss';
  productId: string;
  status: 'active' | 'grace' | 'cancelled' | 'expired';
  priceKrw: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  nextChargeAt: string | null;
  graceUntil: string | null;
  /** 카드사 · 마스킹 번호 */
  cardLabel: string | null;
  benefits: SubscriptionBenefits;
}

/** 결제 한 건 (알 충전 · 구독 결제) */
export interface Purchase {
  id: number;
  store: 'apple' | 'google' | 'toss';
  productId: string;
  status: 'pending' | 'completed' | 'refunded' | 'cancelled' | 'failed';
  amountKrw: number;
  completedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface TossOrder {
  orderId: string;
  orderName: string;
  amount: number;
  customerKey: string;
  clientKey: string;
}

/** Query keys, so screens and the context share one cache. */
export const pointsKeys = {
  wallet: ['points', 'wallet'] as const,
  transactions: ['points', 'transactions'] as const,
  unlocks: ['points', 'unlocks'] as const,
  /** 'points' 아래라 알·열람권을 새로 읽을 때 같이 새로 읽는다 (구독 혜택이 바뀌므로) */
  subscription: ['points', 'subscription'] as const,
  purchases: ['points', 'purchases'] as const,
  subscriptionPayments: ['points', 'subscription-payments'] as const,
};

export const pointsApi = {
  storeAccount: () => requestData<{ appAccountToken: string; obfuscatedAccountId: string }>('/v1/payments/store/account'),
  confirmApple: (signedTransaction: string) => requestData('/v1/payments/apple/transactions', { signedTransaction }),
  confirmGoogle: (productId: string, purchaseToken: string) => requestData('/v1/payments/google/purchases', { productId, purchaseToken }),
  wallet: () => call<Wallet>(api.GET('/v1/points/wallet')),

  /** 최신순. beforeId를 주면 그 id보다 오래된 내역 (다음 페이지). direction: in 들어온 알만 · out 나간 알만 */
  async transactions(limit = 20, beforeId?: number, direction?: TransactionDirection): Promise<PointTransaction[]> {
    const data = await call<{ list: PointTransaction[] }>(api.GET('/v1/points/transactions', { params: { query: { limit, beforeId, direction } } }));
    return data.list;
  },

  attend: () => call<PointTransaction>(api.POST('/v1/points/attendance')),

  /** contentKey: `share:{spec file}` — the server allows one reward a day. */
  rewardShare: (contentKey: string) =>
    call<{ granted: boolean; balance: number; shareRewardsLeft: number }>(api.POST('/v1/points/share-rewards', { body: { contentKey } })),

  async unlocks(): Promise<Entitlement[]> {
    const data = await call<{ list: Entitlement[] }>(api.GET('/v1/premium/unlocks'));
    return data.list;
  },

  /** Already open → charged 0. Price is the server's. viaSubscription: 구독 혜택으로 열었음 (이번 달 월별 상세운세) */
  unlock: (contentKey: string) =>
    call<{ charged: number; viaSubscription: boolean; balance: number; entitlements: Entitlement[] }>(api.POST('/v1/premium/unlocks', { body: { contentKey } })),

  createTossOrder: (productId: string) => call<TossOrder>(api.POST('/v1/payments/toss/orders', { body: { productId } as never })),

  confirmToss: (body: { paymentKey: string; orderId: string; amount: number }) =>
    call(api.POST('/v1/payments/toss/confirm', { body })),

  /** 정기 구독 카드 등록 준비 — 받은 키로 토스 requestBillingAuth 를 연다 */
  subscriptionBillingAuth: () => call<{ clientKey: string; customerKey: string }>(api.GET('/v1/subscriptions/toss/billing-auth')),

  /** 카드 등록 successUrl 의 authKey 로 구독 시작 (첫 결제까지). 첫 결제가 실패하면 구독은 만들어지지 않는다 */
  startTossSubscription: (productId: string, authKey: string) =>
    call(api.POST('/v1/subscriptions/toss', { body: { productId, authKey } })),

  /** 끝나지 않은 내 구독 (없으면 null) */
  mySubscription: () => call<MySubscription | null>(api.GET('/v1/subscriptions/me')),
  /** 해지 — 이번 결제 기간 끝까지 유지되고 다음 결제가 안 된다. 결제 실패(재시도 중)면 바로 끝난다 */
  cancelSubscription: () => call<MySubscription>(api.POST('/v1/subscriptions/me/cancel')),
  /** 해지 취소 — 기간이 끝나기 전이면 다시 자동 결제된다 */
  resumeSubscription: () => call<MySubscription>(api.POST('/v1/subscriptions/me/resume')),

  /** 결제 카드 변경 — 카드 등록창(subscriptionBillingAuth)의 successUrl authKey. 결제 실패 중이면 새 카드로 바로 다시 결제된다 */
  changeSubscriptionCard: (authKey: string) => call<MySubscription>(api.POST('/v1/subscriptions/me/card', { body: { authKey } })),

  /** 내 구독 결제 내역 한 페이지 (최신순). total = 전체 건수 */
  subscriptionPayments: (page: number, limit: number) =>
    call<{ list: Purchase[]; total: number }>(api.GET('/v1/subscriptions/me/payments', { params: { query: { page, limit } } })),

  /** 내 결제 내역 (최신순, 결제 대기 제외) */
  async purchases(): Promise<Purchase[]> {
    const data = await call<{ list: Purchase[] }>(api.GET('/v1/payments/purchases'));
    return data.list;
  },
};
