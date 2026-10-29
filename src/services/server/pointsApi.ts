/** Points wallet, history, unlocks (entitlements) and the web Toss charge. Members only. */
import { api, call, requestData } from '../../api/client';

export interface Wallet {
  balance: number;
  expiringSoon: number;
  attendedToday: boolean;
  shareRewardsLeft: number;
  /** 이번 호출로 준 가입 축하 알 (지갑을 처음 만든 호출만, 그 밖엔 0) */
  signupBonus: number;
}

export type TransactionType = 'charge' | 'grant' | 'use' | 'expire' | 'refund' | 'revoke' | 'adjust';
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
};

export const pointsApi = {
  storeAccount: () => requestData<{ appAccountToken: string; obfuscatedAccountId: string }>('/v1/payments/store/account'),
  confirmApple: (signedTransaction: string) => requestData('/v1/payments/apple/transactions', { signedTransaction }),
  confirmGoogle: (productId: string, purchaseToken: string) => requestData('/v1/payments/google/purchases', { productId, purchaseToken }),
  wallet: () => call<Wallet>(api.GET('/v1/points/wallet')),

  /** 최신순. beforeId를 주면 그 id보다 오래된 내역 (다음 페이지) */
  async transactions(limit = 20, beforeId?: number): Promise<PointTransaction[]> {
    const data = await call<{ list: PointTransaction[] }>(api.GET('/v1/points/transactions', { params: { query: { limit, beforeId } } }));
    return data.list;
  },

  attend: () => call<PointTransaction>(api.POST('/v1/points/attendance')),

  /** contentKey: `share:{spec file}` — the server allows one reward per key a day, 3 a day. */
  rewardShare: (contentKey: string) =>
    call<{ granted: boolean; balance: number; shareRewardsLeft: number }>(api.POST('/v1/points/share-rewards', { body: { contentKey } })),

  async unlocks(): Promise<Entitlement[]> {
    const data = await call<{ list: Entitlement[] }>(api.GET('/v1/premium/unlocks'));
    return data.list;
  },

  /** Already open → charged 0. Price is the server's. */
  unlock: (contentKey: string) =>
    call<{ charged: number; balance: number; entitlements: Entitlement[] }>(api.POST('/v1/premium/unlocks', { body: { contentKey } })),

  createTossOrder: (productId: string) => call<TossOrder>(api.POST('/v1/payments/toss/orders', { body: { productId } as never })),

  confirmToss: (body: { paymentKey: string; orderId: string; amount: number }) =>
    call(api.POST('/v1/payments/toss/confirm', { body })),
};
