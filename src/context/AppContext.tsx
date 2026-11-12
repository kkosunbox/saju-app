/**
 * Session, profile and today's fortune — all from the server.
 * No account yet: the first profile submit creates a guest. Login / signup while a guest
 * keeps the guest's data on the server (upgrade or merge).
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState as NativeAppState } from 'react-native';
import { DailyFortune, User } from '../types';
import { storage } from '../services/storage/storageService';
import { push } from '../services/push';
import { Account, authApi } from '../services/server/authApi';
import { fortuneApi } from '../services/server/fortuneApi';
import { ProfileInput, profileApi } from '../services/server/profileApi';
import { IS_WEB, getTokens } from '../api/tokens';
import { setOnSessionLost } from '../api/client';
import { queryClient } from '../api/query';
import { todayISO } from '../utils/date';
import { captureInvite } from '../services/share/linkShare';
import { clearFortuneWidget, syncFortuneWidget } from '../services/fortuneWidget';
import { nextISO } from '../widgets/fortuneWidgetProps';

interface AppState {
  booting: boolean;
  onboarded: boolean;
  /** Logged-in member, null for guests and before any profile. */
  account: Account | null;
  user: User | null;
  /** True while "다시 입력" shows the profile form for an existing profile. */
  editingProfile: boolean;
  today: string;
  fortune: DailyFortune | null;
  fortuneLoading: boolean;
  fortuneError: Error | null;
  /** 뽑은 뒤 AI가 오늘의 문장을 쓰는 중 (끝나거나 실패하면 false — 그땐 규칙 문장을 보여준다) */
  fortuneWriting: boolean;
  /** 뽑았을 때 한 번: 서버에 AI 문장을 요청한다 (이미 썼거나 AI가 꺼져 있으면 아무것도 안 함) */
  drawFortune(): Promise<void>;
  completeOnboarding(): Promise<void>;
  /** Web profile setup: opens the landing again without changing the session. */
  returnToLanding(): Promise<void>;
  /** Creates (as a guest if needed) or updates the profile. */
  saveUser(input: ProfileInput): Promise<void>;
  refreshFortune(): Promise<void>;
  /** "다시 입력": opens the profile form prefilled (records are kept). */
  resetProfile(): void;
  cancelProfileEdit(): void;
  signIn(email: string, password: string): Promise<void>;
  /** After a login finished elsewhere (web social callback): reads the new session. true if it has a profile. */
  reloadSession(): Promise<boolean>;
  checkSignupEmail(email: string): Promise<{ exists: boolean; social: boolean }>;
  sendSignupCode(email: string): Promise<void>;
  verifySignupCode(email: string, otp: string): Promise<string>;
  completeSignup(params: { emailVerifiedToken: string; password: string; marketing: boolean }): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(reason?: string): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState<Error | null>(null);
  const [today, setToday] = useState(todayISO());

  const clearSession = useCallback(() => {
    queryClient.clear();
    setAccount(null);
    setUser(null);
    setFortune(null);
    setEditingProfile(false);
    clearFortuneWidget();
  }, []);

  /** Reads who we are and our profile from the server. */
  const loadSession = useCallback(async (): Promise<boolean> => {
    if (!(await getTokens())) {
      clearSession();
      return false;
    }
    const me = await authApi.me();
    const profile = await profileApi.get(me.id);
    // set together: the sign-in redirect (app/_layout.tsx) reads the profile when the account appears
    setAccount(me.status === 'guest' ? null : me);
    setFortune(null);
    setUser(profile);
    return !!profile;
  }, [clearSession]);

  /** Web: after signing out the next visit starts from the landing again (apps go straight to the profile form). */
  const afterSignOut = useCallback(async () => {
    clearSession();
    if (IS_WEB) { await storage.setOnboarded(false); setOnboarded(false); }
  }, [clearSession]);

  useEffect(() => {
    setOnSessionLost(clearSession);
    (async () => {
      await captureInvite();
      setOnboarded(await storage.getOnboarded());
      try {
        await loadSession();
      } catch {
        // offline or server down: start without a session, the screens retry
      }
      setBooting(false);
    })();
  }, []);

  const refreshFortune = useCallback(async () => {
    if (!user) return;
    const targetDate = todayISO();
    setToday(targetDate);
    setFortune(current => current?.date === targetDate ? current : null);
    setFortuneLoading(true);
    setFortuneError(null);
    try {
      setFortune(await fortuneApi.daily(user.id));
    } catch (err) {
      setFortuneError(err as Error);
    } finally {
      setFortuneLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshFortune(); }, [refreshFortune]);

  // 앱을 열 때·계정이 바뀔 때 (로그인, 게스트 생성) 이 기기를 지금 계정의 푸시 기기로
  const userId = user?.id;
  useEffect(() => { if (userId) void push.sync(); }, [userId, account?.id]);

  // An open app also rolls over at KST midnight; returning from the background checks immediately.
  useEffect(() => {
    if (!user) return;
    let lastDate = todayISO();
    const checkDate = () => {
      const next = todayISO();
      if (next === lastDate) return;
      lastDate = next;
      void refreshFortune();
    };
    const timer = setInterval(checkDate, 30_000);
    const subscription = NativeAppState.addEventListener('change', state => { if (state === 'active') checkDate(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [user, refreshFortune]);

  // 홈 화면 위젯: 오늘 운세가 바뀔 때마다(불러옴 · 뽑음 · 프로필 수정) 오늘과 내일 운세를 넣어 둔다.
  // 내일 운세도 규칙 엔진이라 AI 비용이 없고, 덕분에 내일 앱을 안 열어도 위젯이 새 날 운세를 보여 준다.
  const widgetTomorrow = useRef<{ key: string; fortune: DailyFortune | null } | null>(null);
  useEffect(() => {
    if (!fortune || !user || fortune.date !== todayISO()) return;
    let live = true;
    const key = `${fortune.userId}:${fortune.date}:${user.version ?? ''}`;
    (async () => {
      if (widgetTomorrow.current?.key !== key) {
        let tomorrow: DailyFortune | null = null;
        try {
          tomorrow = await fortuneApi.daily(fortune.userId, nextISO(fortune.date));
        } catch {
          // 내일 것이 없으면 오늘만 넣는다 (자정부터는 '앱을 열어 주세요')
        }
        widgetTomorrow.current = { key, fortune: tomorrow };
      }
      if (live) await syncFortuneWidget(fortune, widgetTomorrow.current.fortune);
    })();
    return () => { live = false; };
  }, [fortune, user]);

  // 날짜별로 한 번만 요청한다 — 서버가 실패를 돌려줘도 다음에 앱을 열 때 다시
  const drawing = useRef<string | null>(null);
  const [drawnKey, setDrawnKey] = useState<string | null>(null);
  const fortuneKey = fortune ? `${fortune.userId}:${fortune.date}` : null;
  const fortuneWriting = !!fortune?.textsPending && drawnKey !== fortuneKey;
  const drawFortune = useCallback(async () => {
    // AI 문장이 남았거나, 뽑았다는 기록이 서버에 아직 없을 때 (다른 기기에서도 뽑은 걸로 보이게)
    const needed = !!fortune?.textsPending || fortune?.drawn === false;
    if (!needed || !fortuneKey || drawing.current === fortuneKey) return;
    drawing.current = fortuneKey;
    try {
      setFortune(await fortuneApi.draw(fortune.userId, fortune.date));
    } catch {
      // 규칙 문장을 그대로 보여준다
    } finally {
      setDrawnKey(fortuneKey);
    }
  }, [fortune, fortuneKey]);

  const value: AppState = {
    booting, onboarded, account, user, editingProfile, today, fortune, fortuneLoading, fortuneError, refreshFortune, fortuneWriting, drawFortune,
    completeOnboarding: async () => { await storage.setOnboarded(true); setOnboarded(true); },
    returnToLanding: async () => {
      if (!IS_WEB || user) return;
      await storage.setOnboarded(false);
      setOnboarded(false);
    },
    saveUser: async input => {
      if (!(await getTokens())) await authApi.startGuest();
      const me = await authApi.me();
      const saved = await profileApi.save(me.id, input);
      queryClient.invalidateQueries();
      setFortune(null);
      setUser(saved);
      setEditingProfile(false);
    },
    resetProfile: () => setEditingProfile(true),
    cancelProfileEdit: () => setEditingProfile(false),
    signIn: async (email, password) => { await authApi.login(email, password); queryClient.clear(); await loadSession(); },
    reloadSession: async () => { queryClient.clear(); return loadSession(); },
    checkSignupEmail: email => authApi.checkSignupEmail(email),
    sendSignupCode: email => authApi.sendSignupCode(email),
    verifySignupCode: (email, otp) => authApi.verifySignupCode(email, otp),
    completeSignup: async params => { await authApi.signup(params); queryClient.clear(); await loadSession(); },
    signOut: async () => { await push.unregister(); await authApi.signOut(); await afterSignOut(); },
    deleteAccount: async reason => { await authApi.withdraw(reason); await afterSignOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** 이 안의 화면에는 앱 상태 일부를 바꿔 보여 준다 (공유 링크: 공유한 사람의 프로필과 공유한 날) */
export function AppStateOverride({ patch, children }: { patch: Partial<AppState>; children: React.ReactNode }) {
  const v = useApp();
  return <Ctx.Provider value={{ ...v, ...patch }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
