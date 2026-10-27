import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { Purchase } from 'expo-iap';
import { useApp } from './AppContext';
import { refreshPoints, usePremium } from './PremiumContext';
import { PACKS } from '../services/premium/catalog';
import { pointsApi } from '../services/server/pointsApi';
import { ApiError } from '../api/client';
import type { BillingStatus, StoreBilling, StoreProduct } from '../services/premium/storeTypes';

type Iap = typeof import('expo-iap');
const Ctx = createContext<StoreBilling | null>(null);
const skus = PACKS.map(pack => pack[3]);

/** One listener for the entire signed-in session, including after leaving the charge screen. */
export function StoreBillingProvider({ children }: { children: React.ReactNode }) {
  const { account } = useApp();
  const memberId = account?.id;
  const { toast } = usePremium();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(!!memberId);
  const [products, setProducts] = useState<Record<string, StoreProduct>>({});
  const [status, setStatus] = useState<BillingStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const sdk = useRef<Iap | null>(null);
  const requesting = useRef(false);

  useEffect(() => {
    if (!memberId) return;
    let alive = true;
    let iap: Iap | undefined;
    let updated: { remove(): void } | undefined;
    let errors: { remove(): void } | undefined;
    let appState: { remove(): void } | undefined;
    const processing = new Set<string>();
    const errorMessage = (e: unknown) => e instanceof ApiError && e.code === 'PAYMENT_NOT_READY'
      ? '스토어 결제는 준비 중이에요. 잠시 후 다시 시도해 주세요.'
      : '결제 확인을 마치지 못했어요. 다시 확인을 눌러 주세요. 확인 전에는 같은 상품을 다시 구매하지 마세요.';
    const handle = async (purchase: Purchase) => {
      if (!alive || !iap || !skus.includes(purchase.productId)) return;
      if (purchase.purchaseState === 'pending') {
        setActiveProductId(purchase.productId); setStatus('pending');
        setMessage('스토어에서 결제 승인을 기다리고 있어요. 승인되면 자동으로 확인해요.');
        return;
      }
      if (purchase.purchaseState !== 'purchased') return;
      const key = purchase.purchaseToken || purchase.id;
      if (!key || processing.has(key)) return;
      processing.add(key);
      setActiveProductId(purchase.productId); setStatus('verifying'); setMessage(null);
      try {
        if (Platform.OS === 'ios') {
          // purchaseToken is this exact transaction's signed StoreKit 2 JWS.
          if (!purchase.purchaseToken) throw new Error('Missing signed Apple transaction');
          await pointsApi.confirmApple(purchase.purchaseToken);
          await iap.finishTransaction({ purchase, isConsumable: true });
        } else {
          if (!purchase.purchaseToken) throw new Error('Missing Google purchase token');
          // The server consumes/acknowledges after its durable grant; do not consume twice on device.
          await pointsApi.confirmGoogle(purchase.productId, purchase.purchaseToken);
        }
        if (alive) {
          await refreshPoints();
          setStatus('success'); setMessage('알이 충전됐어요'); toast('알이 충전됐어요');
        }
      } catch (error) {
        if (alive) { setStatus('error'); setMessage(errorMessage(error)); }
      } finally { processing.delete(key); requesting.current = false; }
    };
    const reconcile = async () => {
      if (!iap || !alive) return;
      const pending = Platform.OS === 'ios' ? await iap.getPendingTransactionsIOS() : await iap.getAvailablePurchases();
      for (const purchase of pending) await handle(purchase);
    };
    (async () => {
      try {
        iap = await import('expo-iap');
        if (!alive) return;
        setLoading(true); setReady(false); setProducts({}); setStatus('idle'); setMessage(null);
        updated = iap.purchaseUpdatedListener(purchase => { void handle(purchase); });
        errors = iap.purchaseErrorListener(error => {
          if (!alive) return;
          requesting.current = false;
          if (error.code === iap!.ErrorCode.UserCancelled) { setStatus('idle'); setMessage('결제를 취소했어요.'); }
          else if (error.code === iap!.ErrorCode.DeferredPayment || error.code === iap!.ErrorCode.Pending) { setStatus('pending'); setMessage('스토어에서 결제 승인을 기다리고 있어요. 승인 후 다시 확인해 주세요.'); }
          else { setStatus('error'); setMessage('결제를 진행하지 못했어요. 스토어 계정을 확인한 뒤 다시 시도해 주세요.'); }
        });
        await iap.initConnection();
        const items = await iap.fetchProducts({ skus, type: 'in-app' });
        if (!alive) return;
        sdk.current = iap;
        setProducts(Object.fromEntries((items ?? []).map(product => [product.id, { id: product.id, displayPrice: product.displayPrice }])));
        setReady(true);
        await reconcile();
        appState = AppState.addEventListener('change', state => { if (state === 'active') void reconcile().catch(() => { if (alive) setMessage('미완료 결제를 확인하지 못했어요. 다시 확인해 주세요.'); }); });
      } catch {
        if (alive) setMessage('스토어에 연결하지 못했어요. 스토어에서 설치한 최신 앱과 로그인 상태를 확인해 주세요.');
      } finally { if (alive) setLoading(false); }
    })();
    return () => {
      alive = false; sdk.current = null; requesting.current = false;
      updated?.remove(); errors?.remove(); appState?.remove();
      if (iap) void iap.endConnection().catch(() => {});
    };
  }, [memberId, generation, toast]);

  const purchase = useCallback(async (productId: string) => {
    if (!memberId || !sdk.current || !ready || !products[productId] || requesting.current) return;
    requesting.current = true; setActiveProductId(productId); setStatus('purchasing'); setMessage(null);
    try {
      const identifiers = await pointsApi.storeAccount();
      await sdk.current.requestPurchase({ type: 'in-app', request: {
        apple: { sku: productId, appAccountToken: identifiers.appAccountToken, quantity: 1, andDangerouslyFinishTransactionAutomatically: false },
        google: { skus: [productId], obfuscatedAccountId: identifiers.obfuscatedAccountId },
      } });
    } catch (error) {
      requesting.current = false;
      if ((error as { code?: string }).code === 'user-cancelled') { setStatus('idle'); setMessage('결제를 취소했어요.'); }
      else { setStatus('error'); setMessage(error instanceof ApiError && error.code === 'PAYMENT_NOT_READY' ? '스토어 결제는 준비 중이에요. 잠시 후 다시 시도해 주세요.' : '결제를 진행하지 못했어요. 다시 확인해 주세요.'); }
    }
  }, [memberId, ready, products]);

  return <Ctx.Provider value={{ ready: !!memberId && ready, loading: !!memberId && loading, products: memberId ? products : {}, status, message, activeProductId, purchase, retry: () => {
    setLoading(true); setReady(false); setStatus('idle'); setMessage(null); setGeneration(g => g + 1);
  } }}>{children}</Ctx.Provider>;
}

export function useStoreBilling(): StoreBilling {
  const value = useContext(Ctx);
  if (!value) throw new Error('StoreBillingProvider is missing');
  return value;
}
