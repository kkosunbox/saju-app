export interface StoreProduct {
  id: string;
  displayPrice: string;
}

export type BillingStatus = 'idle' | 'purchasing' | 'pending' | 'verifying' | 'success' | 'error';

/** App Store · Google Play 정기 구독 (premium_monthly) */
export interface StoreSubscription {
  /** 스토어에서 구독 상품을 받아 와 바로 구독할 수 있음 */
  ready: boolean;
  /** 스토어 가격 (예: ₩9,900) */
  displayPrice: string | null;
  status: BillingStatus;
  message: string | null;
  subscribe(): Promise<void>;
  /** 이 스토어 계정의 구독을 이 회원 것으로 다시 연결 */
  restore(): Promise<void>;
  /** 스토어 구독 관리 화면 (해지 · 결제 수단 · 환불) */
  manage(): Promise<void>;
}
export interface StoreBilling {
  ready: boolean;
  loading: boolean;
  products: Record<string, StoreProduct>;
  status: BillingStatus;
  message: string | null;
  activeProductId: string | null;
  purchase(productId: string): Promise<void>;
  retry(): void;
  subscription: StoreSubscription;
}
