export interface StoreProduct {
  id: string;
  displayPrice: string;
}

export type BillingStatus = 'idle' | 'purchasing' | 'pending' | 'verifying' | 'success' | 'error';
export interface StoreBilling {
  ready: boolean;
  loading: boolean;
  products: Record<string, StoreProduct>;
  status: BillingStatus;
  message: string | null;
  activeProductId: string | null;
  purchase(productId: string): Promise<void>;
  retry(): void;
}
