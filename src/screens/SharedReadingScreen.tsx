import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import LoadingScreen from '../components/LoadingScreen';
import PrimaryButton from '../components/PrimaryButton';
import { AppStateOverride } from '../context/AppContext';
import { SharedView, SharedViewProvider } from '../context/SharedViewContext';
import { ApiError } from '../api/client';
import { getSharedContent } from '../services/share/fullShare';
import { titleOfKey } from '../services/premium/catalog';
import { shareFileName } from '../services/shareService';
import { toSajuFull } from '../services/premium/helpers';
import SajuDeepScreen from './premium/SajuDeepScreen';
import LifeScreen from './premium/LifeScreen';
import NewYearScreen from './premium/NewYearScreen';
import MonthlyScreen from './premium/MonthlyScreen';
import ThemeScreen from './premium/ThemeScreen';
import LuckyScreen from './premium/LuckyScreen';
import SpouseScreen from './content/SpouseScreen';
import CompatibilityScreen from './CompatibilityScreen';
import PetScreen from './content/PetScreen';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** 콘텐츠 종류 → 공유한 사람이 보던 화면 (그대로 그린다) */
const SCREENS: Record<string, React.ComponentType> = {
  saju: SajuDeepScreen,
  life: LifeScreen,
  spouse: SpouseScreen,
  newyear: NewYearScreen,
  monthly: MonthlyScreen,
  theme: ThemeScreen,
  lucky: LuckyScreen,
  // 심층 궁합 · 속마음은 궁합 결과 화면에서 그 부분만 열린 채로
  compat: CompatibilityScreen,
  crush: CompatibilityScreen,
  pet: PetScreen,
};

/**
 * 유료 풀이 전체 공유 링크 (/r/{token}) — 로그인 없이 공유한 사람의 풀이를 공유 시점 그대로 본다.
 * 화면은 공유한 사람이 보던 유료 화면을 그대로 쓰고, 아래에 '나도 보기' 버튼을 둔다.
 */
export default function SharedReadingScreen() {
  const { token, pdf } = useLocalSearchParams<{ token: string; pdf?: string }>();
  // PDF 저장 버튼으로 열었으면 다 그려진 뒤 인쇄 창을 띄운다 (화면은 공유 화면 그대로)
  const pdfMode = Platform.OS === 'web' && pdf === '1';
  const q = useQuery({
    queryKey: ['shared-reading', token],
    enabled: !!token,
    queryFn: () => getSharedContent(token),
    retry: false,
    staleTime: Infinity,
  });
  const view = useMemo<SharedView | null>(() => {
    if (!q.data) return null;
    const { contentKey, content, owner, sharedOn, compat, pet } = q.data;
    return { contentKey, data: content.data, F: content.profile ? toSajuFull(content.profile) : null, reading: content.reading ?? null, owner, sharedOn, compat, pet };
  }, [q.data]);
  const root = useRef<ViewInstance>(null);
  const joinBar = useRef<ViewInstance>(null);
  // PDF로 저장할 때 파일 이름이 되는 문서 제목
  const pdfName = view ? shareFileName(view.owner.nickname, titleOfKey(view.contentKey)) : '';
  usePrintLayout(!!view, root, joinBar, pdfName);
  useEffect(() => {
    if (!pdfMode || !view) return;
    const t = setTimeout(() => window.print(), PRINT_DELAY_MS);
    return () => clearTimeout(t);
  }, [pdfMode, view]);

  if (q.isError) {
    const gone = q.error instanceof ApiError && q.error.status === 404;
    if (!gone) return <LoadingScreen title="공유된 풀이" error={q.error} onRetry={() => q.refetch()} />;
    return (
      <Screen title="공유된 풀이" contentStyle={s.gone}>
        <Text style={[txt.h2, { textAlign: 'center' }]}>열 수 없는 링크예요</Text>
        <Text style={[txt.body, { textAlign: 'center', marginTop: 8 }]}>공유한 사람이 공유를 취소했거나 잘못된 링크예요.</Text>
        <PrimaryButton label="나도 내 사주 풀이 보기" onPress={() => router.replace('/')} style={{ marginTop: 24, alignSelf: 'stretch' }} />
      </Screen>
    );
  }
  if (!view) return <LoadingScreen title="공유된 풀이" />;
  const Body = SCREENS[view.contentKey.split(':')[0]];
  if (!Body) return <LoadingScreen title="공유된 풀이" error={new Error('unknown content')} />;
  return (
    <AppStateOverride patch={{ user: view.owner, today: view.sharedOn }}>
      {/* 브라우저 탭 제목도 '이름 · 콘텐츠 이름 · 운Pick' (사이트 공통 제목보다 안쪽이라 이것이 쓰인다) */}
      {Platform.OS === 'web' ? <Head><title>{pdfName}</title></Head> : null}
      <SharedViewProvider value={view}>
        <View ref={root} style={{ flex: 1, backgroundColor: colors.cream }}>
          <View style={{ flex: 1 }}><Body /></View>
          <View ref={joinBar}><JoinBar nickname={view.owner.nickname} /></View>
        </View>
      </SharedViewProvider>
    </AppStateOverride>
  );
}

/** 이보다 작은 상자(점수 칸 · 칩 등)는 나누지 않는다 — 한두 줄만 넘어가면 어색하다 */
const SPLIT_MIN_PX = 120;
/** 이만큼 큰 그림(표지 그림 등)이 든 카드는 나누지 않는다 — 아이콘 같은 작은 그림은 상관없다 */
const ART_MIN_PX = 80;
/** PDF 저장 버튼으로 열었을 때 글이 나타나는 연출이 끝나길 기다리는 시간 */
const PRINT_DELAY_MS = 1500;
/** 화면 폭(430px)에 맞춘 종이 — 공유 화면과 같은 모양으로 쪽이 나뉜다 (지원하지 않는 브라우저는 A4 가운데에) */
const PRINT_CSS = `
@page { size: 130mm 240mm; margin: 8mm; }
@media print { p, div { orphans: 2; widows: 2; } [data-print-head] { break-after: avoid; page-break-after: avoid; } }
@media print {
  html, body, #root { height: auto !important; overflow: visible !important; background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

/**
 * 인쇄 · PDF 저장 (웹) — PDF 저장 버튼이든 브라우저 메뉴의 인쇄든, 인쇄하는 동안만 화면을 종이에 맞게 편다.
 * - 앱 화면은 창 높이에 맞춘 칸(화면 틀 · 스크롤 영역) 안에 있어 그대로 인쇄하면 보이는 한 화면만 찍힌다.
 *   그래서 스크롤 영역부터 문서 맨 위까지 높이 · 넘침 제한을 풀어 풀이 전체가 이어지게 한다.
 * - 폰 폭 틀(최대 430px)은 종이 가운데에 두고, 아래 '나도 보기' 바는 뺀다.
 * - 글 카드는 쪽 경계에서 이어지게 나누고, 작은 상자 · 그림 표지는 통째로 다음 쪽으로 넘긴다.
 * 인쇄 창을 닫으면 원래대로 돌려놓는다 (화면은 늘 공유 화면 그대로).
 */
function usePrintLayout(ready: boolean, root: React.RefObject<ViewInstance | null>, joinBar: React.RefObject<ViewInstance | null>, fileName: string) {
  useEffect(() => {
    if (!ready || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    let saved: [HTMLElement, string | null][] = [];
    let title: string | null = null;
    const set = (el: HTMLElement, props: Record<string, string>) => {
      if (!saved.some(([e]) => e === el)) saved.push([el, el.getAttribute('style')]);
      for (const [k, v] of Object.entries(props)) el.style.setProperty(k, v, 'important');
    };
    const unclamp = (from: HTMLElement) => {
      for (let el: HTMLElement | null = from; el && el !== document.body; el = el.parentElement) {
        set(el, { height: 'auto', 'max-height': 'none', overflow: 'visible', position: 'relative', transform: 'none', flex: 'none' });
        if (getComputedStyle(el).maxWidth !== 'none') set(el, { 'margin-left': 'auto', 'margin-right': 'auto', 'align-self': 'center' });
      }
    };
    const before = () => {
      // 브라우저는 문서 제목을 PDF 파일 이름으로 쓴다
      title = document.title;
      document.title = fileName;
      const top = root.current as unknown as HTMLElement | null;
      if (!top) return;
      // 스크롤 영역(들)을 먼저 찾아 둔다 — 높이를 풀면 더는 스크롤 영역으로 보이지 않는다
      const scrollers = [...top.querySelectorAll<HTMLElement>('div')].filter(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY));
      const cards = [...top.querySelectorAll<HTMLElement>('div')].filter(el => {
        const cs = getComputedStyle(el);
        const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
        return filled && parseFloat(cs.borderTopLeftRadius) > 0;
      });
      scrollers.forEach(unclamp);
      unclamp(top);
      // 글 카드는 쪽 경계에서 그대로 잘려 다음 쪽에 이어지고, 작은 상자와 그림이 든 표지만 통째로 넘긴다.
      // (조각마다 여백을 다시 붙이면 카드가 길어져 다음 카드와 겹친다)
      const hasArt = (el: HTMLElement) => [...el.querySelectorAll('img')].some(img => img.offsetHeight >= ART_MIN_PX);
      cards.forEach(el => { if (el.offsetHeight < SPLIT_MIN_PX || hasArt(el)) set(el, { 'break-inside': 'avoid' }); });
      const bar = joinBar.current as unknown as HTMLElement | null;
      if (bar) set(bar, { display: 'none' });
    };
    const after = () => {
      saved.forEach(([el, attr]) => (attr === null ? el.removeAttribute('style') : el.setAttribute('style', attr)));
      saved = [];
      if (title !== null) document.title = title;
      title = null;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      after();
      style.remove();
    };
  }, [ready, root, joinBar, fileName]);
}

/** 받은 사람을 내 풀이로 이끄는 하단 바 — 프로필이 없으면 첫 화면(온보딩)으로 간다 */
function JoinBar({ nickname }: { nickname: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>{nickname}님이 운Pick에서 받은 풀이예요</Text>
      <PrimaryButton label="나도 내 사주 풀이 보기" onPress={() => router.push('/')} />
    </View>
  );
}

const s = StyleSheet.create({
  gone: { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 },
  bar: { paddingHorizontal: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
});
