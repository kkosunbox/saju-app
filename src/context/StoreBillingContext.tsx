import React from 'react';
import type { StoreBilling } from '../services/premium/storeTypes';

/** Web purchases continue through Toss; Metro resolves .native.tsx on iOS/Android. */
export function StoreBillingProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function useStoreBilling(): StoreBilling {
  return { ready: false, loading: false, products: {}, status: 'idle', message: null, activeProductId: null, purchase: async () => {}, retry: () => {} };
}
