/**
 * Session, profile and today's fortune — all from the server.
 * No account yet: the first profile submit creates a guest. Login / signup while a guest
 * keeps the guest's data on the server (upgrade or merge).
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState as NativeAppState } from 'react-native';
import { DailyFortune, User } from '../types';
import { ContentProfileSelections, storage } from '../services/storage/storageService';
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
import { WIDGET_DAYS_AHEAD, nextISO } from '../widgets/fortuneWidgetProps';

interface AppState {
  booting: boolean;
  onboarded: boolean;
  /** Logged-in member, null for guests and before any profile. */
  account: Account | null;
  /** The primary profile (today's fortune · 운알톡 · the default of every content). */
  user: User | null;
  /** All my profiles, the primary one first. */
  profiles: User[];
  /** 이 계정이 콘텐츠마다 마지막으로 본 프로필 (기기에 저장). */
  contentProfiles: ContentProfileSelections;
  rememberContentProfile(contentKey: string, profileId: number): void;
  /** Reads the profiles again (after one was added elsewhere, e.g. through a request link). */
  refreshProfiles(): Promise<void>;
  /** Adds a profile (first one becomes primary) or updates one by its id. */
  saveProfile(input: ProfileInput, profileId?: number): Promise<User>;
  /** Makes a profile the primary one (today's fortune · 운알톡 from now on). */
  setPrimaryProfile(profileId: number): Promise<void>;
  /** Removes a profile from the list (what was opened for it stays). Not the primary one. */
  removeProfile(profileId: number): Promise<void>;
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
  const [profiles, setProfiles] = useState<User[]>([]);
  const [contentSelection, setContentSelection] = useState<{ accountId: string; profiles: ContentProfileSelections } | null>(null);
  const rememberContentProfile = useCallback((contentKey: string, profileId: number) => {
    setContentSelection(current => !current || current.profiles[contentKey] === profileId
      ? current
      : { ...current, profiles: { ...current.profiles, [contentKey]: profileId } });
  }, []);
  useEffect(() => {
    if (contentSelection) void storage.saveContentProfiles(contentSelection.accountId, contentSelection.profiles);
  }, [contentSelection]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [fortuneError, setFortuneError] = useState<Error | null>(null);
  const [today, setToday] = useState(todayISO());

  const clearSession = useCallback(() => {
    queryClient.clear();
    setAccount(null);
    setUser(null);
    setProfiles([]);
    setContentSelection(null);
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
    const list = profile ? await profileApi.list(me.id).catch(() => [profile]) : [];
    const contentProfiles = await storage.getContentProfiles(String(me.id));
    setContentSelection({ accountId: String(me.id), profiles: contentProfiles });
    // set together: the sign-in redirect (app/_layout.tsx) reads the profile when the account appears
    setAccount(me.status === 'guest' ? null : me);
    setFortune(null);
    setUser(profile);
    setProfiles(list);
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

  // 화면이 포커스될 때마다 부르니 같은 계정이면 같은 함수로 둔다
  const accountKey = user?.id;
  const refreshProfiles = useCallback(async () => {
    if (!accountKey) return;
    setProfiles(await profileApi.list(accountKey));
  }, [accountKey]);

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

  // 홈 화면 위젯: 오늘 운세가 바뀔 때마다(불러옴 · 뽑음 · 프로필 수정) 오늘부터 일주일 치를 넣어 둔다.
  // 앞날 운세도 규칙 엔진이라 AI 비용이 없고, 덕분에 앱을 일주일 안 열어도 위젯이 매일 새 운세를 보여 준다.
  const widgetAhead = useRef<{ key: string; days: DailyFortune[] } | null>(null);
  useEffect(() => {
    // 웹에는 위젯이 없다
    if (IS_WEB || !fortune || !user || fortune.date !== todayISO()) return;
    let live = true;
    const key = `${fortune.userId}:${fortune.date}:${user.version ?? ''}`;
    (async () => {
      if (widgetAhead.current?.key !== key) {
        const dates: string[] = [];
        for (let i = 0, d = fortune.date; i < WIDGET_DAYS_AHEAD; i++) dates.push((d = nextISO(d)));
        const got = await Promise.all(dates.map(date => fortuneApi.daily(fortune.userId, date).catch(() => null)));
        // 이어지는 날까지만 쓴다 (중간에 빠지면 그 날부터는 '앱을 열어 주세요')
        const days: DailyFortune[] = [];
        for (const f of got) { if (!f) break; days.push(f); }
        widgetAhead.current = { key, days };
      }
      if (live) await syncFortuneWidget(fortune, widgetAhead.current.days);
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
      setContentSelection(current => current?.accountId === String(me.id) ? current : { accountId: String(me.id), profiles: {} });
      setUser(saved);
      setProfiles(await profileApi.list(me.id).catch(() => [saved]));
      setEditingProfile(false);
    },
    profiles,
    contentProfiles: contentSelection?.profiles ?? {},
    rememberContentProfile,
    refreshProfiles,
    saveProfile: async (input, profileId) => {
      if (!user) throw new Error('no profile yet');
      const saved = profileId == null
        ? await profileApi.create(user.id, input)
        : await profileApi.update(user.id, profileId, input);
      const list = await profileApi.list(user.id);
      setProfiles(list);
      const primary = list.find(p => p.isPrimary) ?? null;
      if (primary && (primary.profileId !== user.profileId || saved.isPrimary)) {
        setFortune(null);
        setUser(primary);
      }
      queryClient.invalidateQueries();
      return saved;
    },
    setPrimaryProfile: async profileId => {
      if (!user || user.profileId === profileId) return;
      const primary = await profileApi.setPrimary(user.id, profileId);
      setProfiles(await profileApi.list(user.id));
      queryClient.invalidateQueries();
      setFortune(null);
      setUser(primary);
    },
    removeProfile: async profileId => {
      if (!user) return;
      await profileApi.remove(profileId);
      setProfiles(await profileApi.list(user.id));
      queryClient.invalidateQueries();
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
