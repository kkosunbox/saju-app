import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DailyFortune, User } from '../types';
import { storage } from '../services/storage/storageService';
import { fortuneApi } from '../api/fortune';
import { todayISO } from '../utils/date';

interface AppState {
  booting: boolean;
  onboarded: boolean;
  user: User | null;
  today: string;
  fortune: DailyFortune | null;
  fortuneLoading: boolean;
  completeOnboarding(): Promise<void>;
  saveUser(u: User): Promise<void>;
  refreshFortune(force?: boolean): Promise<void>;
  resetProfile(): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [today, setToday] = useState(todayISO());

  useEffect(() => {
    (async () => {
      const [ob, u] = await Promise.all([storage.getOnboarded(), storage.getUser()]);
      setOnboarded(ob);
      setUser(u);
      setBooting(false);
    })();
  }, []);

  const refreshFortune = useCallback(async (force = false) => {
    if (!user) return;
    const date = todayISO();
    setToday(date);
    setFortuneLoading(true);
    try {
      setFortune(await fortuneApi.getDaily(user, date, { force }));
    } finally {
      setFortuneLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshFortune(); }, [refreshFortune]);

  const value: AppState = {
    booting, onboarded, user, today, fortune, fortuneLoading, refreshFortune,
    completeOnboarding: async () => { await storage.setOnboarded(true); setOnboarded(true); },
    saveUser: async u => { await storage.saveUser(u); setFortune(null); setUser(u); },
    resetProfile: async () => { await storage.clearAll(); await storage.setOnboarded(true); setFortune(null); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
