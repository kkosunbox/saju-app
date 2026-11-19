import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Platform, Pressable, SectionList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from '@/navigation/compat';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { Logo } from '../../components/Mascot';
import { useApp } from '../../context/AppContext';
import { ConsultView, consultApi } from '../../services/server/consultApi';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/typography';
import { catOf } from '../../services/content/consult';
import { kstDate, kstMonth } from './parts';

const PAGE = 20;
/** 지금 보는 화면 — 상담 id · 오늘의 운세 · 지난 운세(`fortune:{id}`) */
type Current = number | 'today' | `fortune:${number}`;
const native = Platform.OS !== 'web';
const APP_MAX_W = 430; // 웹 앱 화면 폭 (_layout webFrame)

/**
 * 운알톡 대화 화면 왼쪽 위 메뉴 — 누르면 왼쪽에서 대화 목록이 열린다.
 * 새 대화 · 오늘의 운세로 가고, 아래에는 고민 상담 대화를 한 달씩 묶어 끝까지 내리면 더 불러온다.
 * current: 지금 보고 있는 대화 (목록에서 표시) · 'today'면 오늘의 운세
 */
export function ChatMenuButton({ current }: { current?: Current }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale onPress={() => setOpen(true)} hitSlop={10} style={s.btn} scaleTo={0.9} accessibilityLabel="대화 목록 열기">
        <Icon name="menu" size={22} strokeWidth={2} />
      </PressableScale>
      <ChatDrawer visible={open} onClose={() => setOpen(false)} current={current} />
    </>
  );
}

/** 대화 화면 왼쪽 위 — 대화 목록 메뉴 + 로고(누르면 운알톡 첫 화면) */
export function ChatHeaderLeft({ current }: { current?: Current }) {
  const nav = useNavigation();
  return (
    <View style={s.left}>
      <ChatMenuButton current={current} />
      <PressableScale onPress={() => nav.navigate('Home')} hitSlop={6} scaleTo={0.94} accessibilityRole="button" accessibilityLabel="운알톡 처음 화면으로">
        <Logo height={36} color={colors.ink} />
      </PressableScale>
    </View>
  );
}

function ChatDrawer({ visible, onClose, current }: { visible: boolean; onClose(): void; current?: Current }) {
  const nav = useNavigation();
  const { account } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // 웹은 앱 화면(가운데 430 폭) 안에서 열린다 — 브라우저 창 왼쪽 끝이 아니라
  const frameW = Math.min(width, APP_MAX_W);
  const drawerW = Math.min(frameW * 0.84, 340);
  const [mounted, setMounted] = useState(visible);
  const [a] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    Animated.timing(a, visible
      ? { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: native }
      : { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: native },
    ).start(({ finished }) => { if (finished && !visible) setMounted(false); });
  }, [a, visible]);

  // 고민 상담 전체 (이어서 할 것 · 끝난 것 구분 없이 최신순) — 열었을 때만, 끝까지 내리면 더 불러온다
  const listQ = useInfiniteQuery({
    queryKey: ['consults', 'pages', 'all'],
    queryFn: ({ pageParam }) => consultApi.list({ before: pageParam, limit: PAGE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.length < PAGE ? undefined : last[last.length - 1].id),
    enabled: visible && !!account,
  });

  const go = (fn: () => void) => { onClose(); setTimeout(fn, native ? 120 : 0); };
  const openChat = (e: ConsultView) => { if (e.id !== current) go(() => nav.replace('ConsultChat', { id: String(e.id) })); else onClose(); };
  // 한 달씩 묶는다
  const sections: { title: string; data: ConsultView[] }[] = [];
  for (const e of listQ.data?.pages.flat() ?? []) {
    const month = kstMonth(e.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.title === month) last.data.push(e);
    else sections.push({ title: month, data: [e] });
  }
  const loadMore = () => { if (listQ.hasNextPage && !listQ.isFetchingNextPage) listQ.fetchNextPage(); };

  const row = (e: ConsultView) => {
    const on = e.id === current;
    return (
      <PressableScale key={e.id} onPress={() => openChat(e)} style={[s.row, on && s.rowOn]} scaleTo={0.98} accessibilityState={{ selected: on }} accessibilityLabel={e.answer?.headline ?? catOf(e.topic).label}>
        <Text style={[s.rowT, on && s.rowTOn]} numberOfLines={1}>{e.answer?.headline ?? catOf(e.topic).label}</Text>
        <Text style={s.rowM} numberOfLines={1}>{catOf(e.topic).label.replace('·', ' · ')} · {kstDate(e.createdAt)}{e.locked ? ' · 미리보기' : ''}</Text>
      </PressableScale>
    );
  };

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="대화 목록 닫기" />
      </Animated.View>
      <View style={s.frameWrap} pointerEvents="box-none">
      <View style={s.frame} pointerEvents="box-none">
      <Animated.View
        style={[s.drawer, { width: drawerW, paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-drawerW, 0] }) }] }]}
        accessibilityViewIsModal
      >
        <View style={s.head}>
          <Text style={s.headT} accessibilityRole="header">운알톡</Text>
          <PressableScale onPress={onClose} hitSlop={10} scaleTo={0.9} accessibilityLabel="닫기">
            <Icon name="close" size={22} color={colors.inkSub} />
          </PressableScale>
        </View>

        <PressableScale onPress={() => go(() => nav.navigate('Home'))} style={s.action} scaleTo={0.98} accessibilityLabel="새 대화 시작하기">
          <Icon name="plus" size={18} strokeWidth={2.2} />
          <Text style={s.actionT}>새 대화</Text>
        </PressableScale>
        <PressableScale onPress={() => (current === 'today' ? onClose() : go(() => nav.navigate('Today')))} style={[s.action, current === 'today' && s.rowOn]} scaleTo={0.98} accessibilityLabel="오늘의 운세 물어보기">
          <Icon name="sparkle" size={18} />
          <Text style={s.actionT}>오늘의 운세</Text>
        </PressableScale>

        {!account ? (
          <Text style={s.empty}>로그인하면 운알이와 나눈 대화가 여기에 쌓여요.</Text>
        ) : listQ.isPending ? (
          <View style={{ paddingVertical: 24 }}><ActivityIndicator color={colors.purple} /></View>
        ) : (
          <SectionList
            style={{ flex: 1 }}
            sections={sections}
            keyExtractor={e => String(e.id)}
            renderItem={({ item }) => row(item)}
            renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={<Text style={s.empty}>아직 나눈 대화가 없어요.{'\n'}혼자 품고 있던 고민을 들려주세요.</Text>}
            ListFooterComponent={listQ.isFetchingNextPage ? <View style={{ paddingVertical: 16 }}><ActivityIndicator color={colors.purple} /></View> : undefined}
          />
        )}

        {account ? (
          <PressableScale onPress={() => go(() => nav.navigate('Talks'))} style={s.all} scaleTo={0.98} accessibilityLabel="대화 기록 전체 보기">
            <Icon name="clock" size={18} color={colors.inkSub} />
            <Text style={s.allT}>대화 기록 전체 보기</Text>
            <Icon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>
        ) : null}
      </Animated.View>
      </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { width: 32, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  frame: { flex: 1, width: '100%', maxWidth: APP_MAX_W, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 16, backgroundColor: colors.cream, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44, paddingHorizontal: 4, marginBottom: 8 },
  headT: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radius.sm },
  actionT: { fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.5 },
  section: { fontSize: 12, fontWeight: '700', color: colors.inkMute, letterSpacing: -0.3, marginTop: 18, marginBottom: 6, paddingHorizontal: 12 },
  row: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.sm, gap: 3 },
  rowOn: { backgroundColor: colors.card },
  rowT: { fontSize: 14, fontWeight: '500', color: colors.ink, letterSpacing: -0.5 },
  rowTOn: { fontWeight: '700' },
  rowM: { fontSize: 12, color: colors.inkMute, letterSpacing: -0.4 },
  more: { alignItems: 'center', paddingVertical: 12 },
  moreT: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  empty: { fontSize: 13, lineHeight: 19, color: colors.inkMute, textAlign: 'center', marginTop: 24, letterSpacing: -0.4 },
  all: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  allT: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.inkSub, letterSpacing: -0.5 },
});
