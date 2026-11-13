/**
 * 콘텐츠 화면 하나의 "누구 것을 보나" — 고른 프로필(기본: 대표 프로필)과, 예전에 산 것을 볼 때는 그 열람권.
 *
 * 열어 본 콘텐츠는 서버가 처음 열 때의 프로필 정보와 날짜를 그대로 돌려준다(person · openedOn).
 * 이 안의 화면은 그 사람과 그 날로 그려지도록 앱 상태의 user · today를 바꿔 준다 — 화면 위쪽 이름 · 원국 · 나이까지
 * 본문과 같은 사람 · 같은 날 기준이 되어, 프로필을 고친 뒤에도 섞이지 않는다.
 * 아직 안 연(미리보기) 화면은 고른 프로필의 지금 정보로 그린다.
 * 공유 링크(/r/{token}) 화면은 그쪽이 정한 주인 · 날을 그대로 쓴다.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppStateOverride, useApp } from './AppContext';
import { usePremium } from './PremiumContext';
import { useSharedView } from './SharedViewContext';
import { ContentPerson, personToUser } from '../services/server/profileApi';
import { Entitlement } from '../services/server/pointsApi';
import { Item } from '../services/premium/catalog';
import { User } from '../types';

interface Opened {
  /** 어느 화면(콘텐츠 키 · 프로필 · 열람권)에서 받은 값인지 — 다른 걸 고르면 버린다 */
  key: string;
  person: User;
  openedOn: string | null;
}

export interface ContentScope {
  /** 고른 프로필 (대표 프로필이 기본) */
  profile: User | null;
  profileId: number | null;
  /** 예전에 산 것을 보는 중이면 그 열람권 (아니면 null → 프로필의 지금 정보로 연 것) */
  entitlement: Entitlement | null;
  /** 이 화면이 실제로 쓰는 날 (열어 본 콘텐츠: 처음 연 날). 쿼리 키에는 쓰지 않는다 */
  realToday: string;
  selectProfile(profileId: number): void;
  selectEntitlement(entitlement: Entitlement | null): void;
  /** 열어 본 콘텐츠 · 뽑은 무료 콘텐츠가 받은 사람과 날 (화면을 그 기준으로 다시 그린다) */
  reportOpened(scopeKey: string, person: ContentPerson, openedOn: string | null): void;
  /** reportOpened에 넘길 지금 고른 것의 키 */
  scopeKey(contentKey: string): string;
  /** 이 화면에서 프로필 추가로 간다 — 추가하고 돌아오면 그 프로필을 고른 채로 */
  expectNewProfile(): void;
}


const Ctx = createContext<ContentScope | null>(null);

/** 콘텐츠 화면을 감싼다. initialProfileId: 링크 · 목록에서 프로필을 정해서 들어올 때 */
export function ContentScopeProvider({ children, contentKey, initialProfileId }: { children: React.ReactNode; contentKey: string; initialProfileId?: number }) {
  const app = useApp();
  const shared = useSharedView();
  const [picked, setPicked] = useState<number | null>(initialProfileId ?? null);
  const remembered = app.contentProfiles[contentKey];
  const selected = picked ?? remembered;
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const primary = app.user;
  const profile = (selected != null ? app.profiles.find(p => p.profileId === selected) : null) ?? primary;
  const profileId = profile?.profileId ?? null;
  const { rememberContentProfile } = app;
  // 포커스된 화면만 기록한다. 뒤에 남아 있는 화면이 마지막 선택을 덮어쓰지 않게 한다.
  useFocusEffect(useCallback(() => {
    if (!shared && profileId != null) rememberContentProfile(contentKey, profileId);
  }, [shared, contentKey, profileId, rememberContentProfile]));
  const scopeKey = useCallback(
    (contentKey: string) => `${contentKey}|${profileId ?? ''}|${profile?.version ?? ''}|${entitlement?.id ?? ''}`,
    [profileId, profile?.version, entitlement?.id],
  );
  const reportOpened = useCallback((key: string, person: ContentPerson, openedOn: string | null) => {
    setOpened(prev =>
      prev && prev.key === key && prev.openedOn === openedOn && prev.person.nickname === person.nickname && prev.person.birthDate === person.birthDateSolar
        ? prev
        : { key, person: personToUser(app.user?.id ?? '', person), openedOn },
    );
  }, [app.user?.id]);
  // 프로필을 추가하러 갔다 오면 새로 생긴 프로필로 — 갈 때의 프로필 목록과 비교한다 (저장 · 돌아오기 순서와 상관없이)
  const before = useRef<Set<number> | null>(null);
  const pickAdded = useCallback(() => {
    if (!before.current) return false;
    const added = app.profiles.find(p => p.profileId != null && !before.current!.has(p.profileId));
    if (!added) return false;
    before.current = null;
    setPicked(added.profileId!);
    setEntitlement(null);
    setOpened(null);
    return true;
  }, [app.profiles]);
  useEffect(() => { pickAdded(); }, [pickAdded]);
  // 추가하지 않고 돌아왔으면 기다리기를 그만둔다 (나중에 다른 곳에서 생긴 프로필로 바뀌지 않게)
  useFocusEffect(useCallback(() => {
    if (before.current && !pickAdded()) before.current = null;
  }, [pickAdded]));
  const value = useMemo<ContentScope>(() => ({
    profile,
    profileId,
    entitlement,
    realToday: app.today,
    selectProfile: id => { setPicked(id); setEntitlement(null); setOpened(null); },
    selectEntitlement: e => { setEntitlement(e); setOpened(null); if (e?.profileId != null) setPicked(e.profileId); },
    reportOpened,
    scopeKey,
    expectNewProfile: () => { before.current = new Set(app.profiles.map(p => p.profileId!).filter(id => id != null)); },
  }), [profile, profileId, entitlement, app.today, app.profiles, reportOpened, scopeKey]);

  if (shared) return <>{children}</>;
  // 받은 값이 지금 고른 것과 같을 때만 그 사람 · 그 날로 그린다
  const current = opened && opened.key.split('|').slice(1).join('|') === `${profileId ?? ''}|${profile?.version ?? ''}|${entitlement?.id ?? ''}` ? opened : null;
  const patch = {
    user: current?.person ?? profile,
    today: current?.openedOn ?? app.today,
  };
  return (
    <Ctx.Provider value={value}>
      <AppStateOverride patch={patch}>{children}</AppStateOverride>
    </Ctx.Provider>
  );
}

/** 지금 화면의 범위 (콘텐츠 화면 밖 · 공유 화면이면 null → 대표 프로필) */
export function useContentScope(): ContentScope | null {
  return useContext(Ctx);
}

/**
 * 열람권 · 구독 혜택 · 열기를 지금 고른 프로필 기준으로.
 * 예전에 산 것을 보는 중이면 그 콘텐츠는 열린 것으로 본다.
 */
export function useScopedPremium() {
  const p = usePremium();
  const scope = useContentScope();
  const pid = scope?.profileId ?? undefined;
  const viewing = scope?.entitlement ?? null;
  return {
    ...p,
    owned: (key: string) => (viewing?.contentKey === key) || p.owned(key, pid),
    subscriptionFree: (key: string) => !(viewing?.contentKey === key) && p.subscriptionFree(key, pid),
    openUnlock: (item: Item, onDone?: () => void) => p.openUnlock(item, onDone, pid),
    /** 이 프로필로 이 콘텐츠를 산 기록 (지금 정보로 연 것 포함, 최근 순) */
    records: (key: string) => p.records(key, pid),
  };
}

/** 콘텐츠 화면 라우트를 범위로 감싼다 */
export function withContentScope<P extends object>(Screen: React.ComponentType<P>, content: string, parameter?: string) {
  function Scoped(props: P) {
    const params = useLocalSearchParams();
    const app = useApp();
    const contentKey = parameter ? `${content}/${params[parameter] ?? ''}` : content;
    return <ContentScopeProvider key={`${app.user?.id ?? ''}:${contentKey}`} contentKey={contentKey}><Screen {...props} /></ContentScopeProvider>;
  }
  Scoped.displayName = `Scoped(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Scoped;
}
