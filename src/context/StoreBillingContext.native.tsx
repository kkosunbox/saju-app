import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { Purchase } from 'expo-iap';
import { useApp } from './AppContext';
import { refreshPoints, usePremium } from './PremiumContext';
import { PACKS, SUBSCRIPTION } from '../services/premium/catalog';
import { pointsApi } from '../services/server/pointsApi';
import { ApiError } from '../api/client';
import type { BillingStatus, StoreBilling, StoreProduct } from '../services/premium/storeTypes';

type Iap = typeof import('expo-iap');
const Ctx = createContext<StoreBilling | null>(null);
const skus = PACKS.map(pack => pack[3]);
/** 정기 구독 — App Store 자동 갱신 구독 · Google Play 정기결제 (기본 요금제 monthly) */
const SUB_SKU = SUBSCRIPTION.productId;
const GOOGLE_BASE_PLAN = 'monthly';
const ANDROID_PACKAGE = 'com.woonpick.android';
type SubProduct = { displayPrice: string; offerToken: string | null };

/** 구독 확인 오류 → 안내 */
function subscriptionError(e: unknown): string {
  const code = e instanceof ApiError ? e.code : '';
  if (code === 'ACTIVE_SUBSCRIPTION_EXISTS') return '이미 이용 중인 구독이 있어요. [마이 > 정기 구독 관리]에서 확인해 주세요.';
  if (code === 'SUBSCRIPTION_EXPIRED') return '이 스토어 계정의 구독은 이미 끝났어요.';
  if (code === 'PAYMENT_FAILED') return '다른 운Pick 계정에서 시작한 구독이거나 확인할 수 없는 구독이에요.';
  if (code === 'PAYMENT_NOT_READY') return '스토어 구독은 준비 중이에요. 잠시 후 다시 시도해 주세요.';
  return '구독 확인을 마치지 못했어요. 잠시 후 [구매 복원]을 눌러 주세요.';
}

/** One listener for the entire signed-in session, including after leaving the charge screen. */
export function StoreBillingProvider({ children }: { children: React.ReactNode }) {
  const { account } = useApp();
  const memberId = account?.id;
  const { toast, subscription: mySubscription } = usePremium();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(!!memberId);
  const [products, setProducts] = useState<Record<string, StoreProduct>>({});
  const [status, setStatus] = useState<BillingStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const sdk = useRef<Iap | null>(null);
  const requesting = useRef(false);
  const [subProduct, setSubProduct] = useState<SubProduct | null>(null);
  const [subStatus, setSubStatus] = useState<BillingStatus>('idle');
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const requestingSub = useRef(false);
  /** 구독 확인 — 구매 직후 · 복원 · 앱이 다시 열릴 때 (quiet: 알림 없이) */
  const confirmSub = useRef<(purchase: Purchase, quiet: boolean) => Promise<void>>(async () => {});

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
    const handleSub = async (purchase: Purchase, quiet: boolean) => {
      if (!alive || !iap) return;
      if (purchase.purchaseState === 'pending') {
        setSubStatus('pending'); setSubMessage('스토어에서 결제 승인을 기다리고 있어요. 승인되면 자동으로 구독이 시작돼요.');
        return;
      }
      if (purchase.purchaseState !== 'purchased' || !purchase.purchaseToken) return;
      const key = purchase.purchaseToken;
      if (processing.has(key)) return;
      processing.add(key);
      if (!quiet) { setSubStatus('verifying'); setSubMessage(null); }
      try {
        // iOS: purchaseToken is this transaction's signed StoreKit 2 JWS
        if (Platform.OS === 'ios') await pointsApi.confirmAppleSubscription(purchase.purchaseToken);
        else await pointsApi.confirmGoogleSubscription(purchase.purchaseToken); // the server acknowledges
        if (Platform.OS === 'ios') await iap.finishTransaction({ purchase, isConsumable: false });
        await refreshPoints();
        if (alive && !quiet) { setSubStatus('success'); setSubMessage(null); toast('정기 구독을 시작했어요. 지금부터 혜택을 쓸 수 있어요'); }
      } catch (error) {
        // an ended subscription restored: nothing to keep, so the transaction is finished
        if (Platform.OS === 'ios' && error instanceof ApiError && error.code === 'SUBSCRIPTION_EXPIRED')
          await iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
        if (alive && !quiet) { setSubStatus('error'); setSubMessage(subscriptionError(error)); }
      } finally { processing.delete(key); requestingSub.current = false; }
    };
    confirmSub.current = handleSub;
    const handle = async (purchase: Purchase, quiet = false) => {
      if (purchase.productId === SUB_SKU) return handleSub(purchase, quiet);
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
      for (const purchase of pending) {
        // Android lists active subscriptions too: only ones the server has not acknowledged yet
        if (purchase.productId === SUB_SKU && Platform.OS === 'android' && (purchase as { isAcknowledgedAndroid?: boolean }).isAcknowledgedAndroid) continue;
        await handle(purchase, purchase.productId === SUB_SKU);
      }
    };
    (async () => {
      try {
        iap = await import('expo-iap');
        if (!alive) return;
        setLoading(true); setReady(false); setProducts({}); setStatus('idle'); setMessage(null);
        updated = iap.purchaseUpdatedListener(purchase => { void handle(purchase); });
        errors = iap.purchaseErrorListener(error => {
          if (!alive) return;
          if (requestingSub.current) {
            requestingSub.current = false;
            if (error.code === iap!.ErrorCode.UserCancelled) { setSubStatus('idle'); setSubMessage(null); }
            else if (error.code === iap!.ErrorCode.DeferredPayment || error.code === iap!.ErrorCode.Pending) { setSubStatus('pending'); setSubMessage('스토어에서 결제 승인을 기다리고 있어요. 승인되면 자동으로 구독이 시작돼요.'); }
            else { setSubStatus('error'); setSubMessage('구독을 진행하지 못했어요. 스토어 계정을 확인한 뒤 다시 시도해 주세요.'); }
            return;
          }
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
        // the subscription may not be on sale in this store yet: points keep working without it
        try {
          const subs = await iap.fetchProducts({ skus: [SUB_SKU], type: 'subs' });
          const product = (subs ?? []).find(item => item.id === SUB_SKU) as { displayPrice: string; subscriptionOffers?: { basePlanIdAndroid?: string | null; offerTokenAndroid?: string | null; id: string }[] } | undefined;
          if (alive && product) {
            const offers = product.subscriptionOffers ?? [];
            const base = offers.find(o => o.basePlanIdAndroid === GOOGLE_BASE_PLAN && o.offerTokenAndroid) ?? offers.find(o => o.offerTokenAndroid);
            setSubProduct({ displayPrice: product.displayPrice, offerToken: base?.offerTokenAndroid ?? null });
          }
        } catch { /* not on sale yet */ }
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

  const subscribe = useCallback(async () => {
    if (!memberId || !sdk.current || !subProduct || requestingSub.current) return;
    if (mySubscription) { setSubStatus('error'); setSubMessage('이미 이용 중인 구독이 있어요. [마이 > 정기 구독 관리]에서 확인해 주세요.'); return; }
    if (Platform.OS === 'android' && !subProduct.offerToken) { setSubStatus('error'); setSubMessage('구독 상품 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'); return; }
    requestingSub.current = true; setSubStatus('purchasing'); setSubMessage(null);
    try {
      const identifiers = await pointsApi.storeAccount();
      await sdk.current.requestPurchase({ type: 'subs', request: {
        apple: { sku: SUB_SKU, appAccountToken: identifiers.appAccountToken, andDangerouslyFinishTransactionAutomatically: false },
        google: { skus: [SUB_SKU], obfuscatedAccountId: identifiers.obfuscatedAccountId, subscriptionOffers: [{ sku: SUB_SKU, offerToken: subProduct.offerToken ?? '' }] },
      } });
    } catch (error) {
      requestingSub.current = false;
      if ((error as { code?: string }).code === 'user-cancelled') { setSubStatus('idle'); setSubMessage(null); }
      else { setSubStatus('error'); setSubMessage(subscriptionError(error)); }
    }
  }, [memberId, subProduct, mySubscription]);

  const restore = useCallback(async () => {
    if (!memberId || !sdk.current) return;
    setSubStatus('verifying'); setSubMessage(null);
    try {
      const owned = (await sdk.current.getAvailablePurchases()).filter(p => p.productId === SUB_SKU);
      const latest = owned.sort((a, b) => (b.transactionDate ?? 0) - (a.transactionDate ?? 0))[0];
      if (!latest) { setSubStatus('idle'); setSubMessage('이 스토어 계정에는 복원할 구독이 없어요.'); return; }
      await confirmSub.current(latest, false);
    } catch {
      setSubStatus('error'); setSubMessage('구독을 복원하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }, [memberId]);

  const manage = useCallback(async () => {
    try {
      const iap = sdk.current ?? (await import('expo-iap'));
      await iap.deepLinkToSubscriptions({ skuAndroid: SUB_SKU, packageNameAndroid: ANDROID_PACKAGE });
    } catch {
      toast(Platform.OS === 'ios' ? '설정 > Apple 계정 > 구독에서 관리할 수 있어요' : 'Play 스토어 > 결제 및 정기 결제에서 관리할 수 있어요');
    }
  }, [toast]);

  return <Ctx.Provider value={{ ready: !!memberId && ready, loading: !!memberId && loading, products: memberId ? products : {}, status, message, activeProductId, purchase, retry: () => {
    setLoading(true); setReady(false); setStatus('idle'); setMessage(null); setGeneration(g => g + 1);
  }, subscription: {
    ready: !!memberId && ready && !!subProduct,
    displayPrice: subProduct?.displayPrice ?? null,
    status: subStatus, message: subMessage, subscribe, restore, manage,
  } }}>{children}</Ctx.Provider>;
}

export function useStoreBilling(): StoreBilling {
  const value = useContext(Ctx);
  if (!value) throw new Error('StoreBillingProvider is missing');
  return value;
}
