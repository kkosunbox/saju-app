import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DailyFortune, User } from '../types';
import { setStorageScope, storage } from '../services/storage/storageService';
import { getDailyFortune } from '../services/fortune/fortuneService';
import { Account, SignUpInput, SocialProvider, authService } from '../services/auth/authService';
import { todayISO } from '../utils/date';
import { captureInvite } from '../services/share/linkShare';

interface AppState {
  booting: boolean;
  onboarded: boolean;
  account: Account | null;
  user: User | null;
  today: string;
  fortune: DailyFortune | null;
  fortuneLoading: boolean;
  completeOnboarding(): Promise<void>;
  saveUser(u: User): Promise<void>;
  refreshFortune(force?: boolean): Promise<void>;
  resetProfile(): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signInWithProvider(provider: SocialProvider, profile: { name: string; email: string | null }): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [today, setToday] = useState(todayISO());

  /**
   * 계정이 바뀌면 저장 범위를 바꾸고 그 계정의 프로필을 불러온다.
   * 로그인 전에는 게스트 범위를 쓴다. 게스트로 쓰던 프로필은 로그인한 계정에 프로필이 없을 때만 옮긴다
   * (서버의 게스트 병합과 같은 규칙).
   */
  const enter = useCallback(async (acc: Account | null) => {
    setStorageScope(null);
    const guestUser = acc ? await storage.getUser() : null;
    setStorageScope(acc?.id ?? null);
    setFortune(null);
    let u = await storage.getUser();
    if (acc && !u && guestUser) {
      await storage.saveUser(guestUser);
      u = guestUser;
    }
    setUser(u);
    setAccount(acc);
  }, []);

  useEffect(() => {
    (async () => {
      await captureInvite();
      const [ob, acc] = await Promise.all([storage.getOnboarded(), authService.currentAccount()]);
      setOnboarded(ob);
      await enter(acc);
      setBooting(false);
    })();
  }, []);

  const refreshFortune = useCallback(async (force = false) => {
    if (!user) return;
    const date = todayISO();
    setToday(date);
    setFortuneLoading(true);
    try {
      setFortune(await getDailyFortune(user, date, { force }));
    } finally {
      setFortuneLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshFortune(); }, [refreshFortune]);

  const value: AppState = {
    booting, onboarded, account, user, today, fortune, fortuneLoading, refreshFortune,
    completeOnboarding: async () => { await storage.setOnboarded(true); setOnboarded(true); },
    saveUser: async u => { await storage.saveUser(u); setFortune(null); setUser(u); },
    resetProfile: async () => { await storage.clearAll(); setFortune(null); setUser(null); },
    signIn: async (email, password) => enter(await authService.signIn(email, password)),
    signUp: async input => enter(await authService.signUp(input)),
    signInWithProvider: async (provider, profile) => enter(await authService.signInWithProvider(provider, profile)),
    signOut: async () => { await authService.signOut(); await enter(null); },
    deleteAccount: async () => { if (account) await authService.deleteAccount(account.id); await enter(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
