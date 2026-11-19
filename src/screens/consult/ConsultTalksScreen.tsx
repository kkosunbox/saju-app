import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import { PointPill } from '../../components/HeaderPoints';
import { BodyState } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ConsultView, consultApi, consultKeys } from '../../services/server/consultApi';
import { FortuneHistoryItem, fortuneApi, fortuneHistoryKeys } from '../../services/server/fortuneApi';
import { colors } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, kstMonth } from './parts';

const PAGE = 20;
const OPEN_MAX = 50;
const CONSULT_MASCOT = require('../../../assets/images/consult-mascot.webp');

type Tab = 'consult' | 'fortune';
type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * 대화 기록 탭 — 고민 상담과 지난 오늘의 운세(뽑은 날만)를 위 탭으로 나눠 본다.
 * 상담은 이어서 이야기할 대화를 맨 위에, 지난 대화는 한 달씩 묶어 끝까지 내리면 더 불러온다
 */
export default function ConsultTalksScreen() {
  const { tab: initial } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(initial === 'fortune' ? 'fortune' : 'consult');
  // 탭이 이미 열려 있을 때 '지난 운세'로 다시 들어와도 운세 탭으로
  useEffect(() => { if (initial === 'fortune') setTab('fortune'); }, [initial]);
  const header = { largeTitle: '대화 기록', right: <PointPill attendHint quiet /> };
  return (
    <Screen {...header} scroll={false}>
      <View style={s.tabs} accessibilityRole="tablist">
        {([['consult', '고민 상담'], ['fortune', '오늘의 운세']] as [Tab, string][]).map(([k, label]) => (
          <PressableScale key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]} scaleTo={0.97} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <Text style={[s.tabText, tab === k && s.tabTextOn]}>{label}</Text>
          </PressableScale>
        ))}
      </View>
      {tab === 'consult' ? <ConsultList /> : <FortuneList />}
    </Screen>
  );
}

function Empty({ title, body, cta, onPress }: { title: string; body: string; cta: string; onPress(): void }) {
  return (
    <View style={s.empty}>
      <Image source={CONSULT_MASCOT} style={s.mascot} contentFit="cover" accessible={false} />
      <Text style={s.emptyT}>{title}</Text>
      <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>{body}</Text>
      <PrimaryButton label={cta} onPress={onPress} style={{ marginTop: 20, alignSelf: 'stretch' }} />
    </View>
  );
}

function ConsultList() {
  const nav = useNavigation<Nav>();
  const { account } = useApp();
  const openQ = useQuery({
    queryKey: ['consults', 'talks', 'open'],
    queryFn: () => consultApi.list({ kind: 'open', limit: OPEN_MAX }),
    enabled: !!account,
  });
  const pastQ = useInfiniteQuery({
    queryKey: consultKeys.pages('past'),
    queryFn: ({ pageParam }) => consultApi.list({ kind: 'past', before: pageParam, limit: PAGE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.length < PAGE ? undefined : last[last.length - 1].id),
    enabled: !!account,
  });

  if (!account) {
    return <View style={s.pad}><Empty title="로그인하면 대화가 쌓여요" body="운알이와 나눈 고민과 답을 여기서 다시 볼 수 있어요." cta="로그인하기 →" onPress={() => router.push('/login')} /></View>;
  }
  if (openQ.isPending || pastQ.isPending || openQ.isError || pastQ.isError) {
    return <View style={s.pad}><BodyState error={openQ.isError || pastQ.isError} onRetry={() => { openQ.refetch(); pastQ.refetch(); }} /></View>;
  }

  // 섹션마다 카드 하나 — 이어서 이야기하기는 한 묶음, 지난 대화는 달마다
  const sections: { title: string; data: ConsultView[][] }[] = [];
  if (openQ.data.length) sections.push({ title: '이어서 이야기하기', data: [openQ.data] });
  for (const e of pastQ.data.pages.flat()) {
    const month = kstMonth(e.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.title === month) last.data[0].push(e);
    else sections.push({ title: month, data: [[e]] });
  }
  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });

  return (
    <SectionList
      sections={sections}
      keyExtractor={group => `${group[0].id}`}
      renderItem={({ item }) => <ConsultRows rows={item} onOpen={openChat} />}
      renderSectionHeader={({ section }) => <Text style={s.month} accessibilityRole="header">{section.title}</Text>}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onEndReached={() => { if (pastQ.hasNextPage && !pastQ.isFetchingNextPage) pastQ.fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<Empty title="아직 나눈 대화가 없어요" body={'혼자 품고 있던 고민을 운알이에게 들려주세요.\n대화가 여기에 차곡차곡 쌓여요.'} cta="첫 고민 들려주기 →" onPress={() => nav.navigate('Home')} />}
      ListFooterComponent={pastQ.isFetchingNextPage ? <View style={s.more}><ActivityIndicator color={colors.purple} /></View> : undefined}
    />
  );
}

/** 지난 오늘의 운세 — 뽑은 날만, 한 달씩 묶어서 */
function FortuneList() {
  const nav = useNavigation<Nav>();
  const { user } = useApp();
  const q = useInfiniteQuery({
    queryKey: fortuneHistoryKeys.pages,
    queryFn: ({ pageParam }) => fortuneApi.history({ before: pageParam, limit: PAGE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.length < PAGE ? undefined : last[last.length - 1].id),
    enabled: !!user,
  });
  if (q.isPending || q.isError) {
    return <View style={s.pad}><BodyState error={q.isError} onRetry={() => q.refetch()} /></View>;
  }
  const sections: { title: string; data: FortuneHistoryItem[][] }[] = [];
  for (const h of q.data.pages.flat()) {
    const month = kstMonth(`${h.date}T00:00:00+09:00`);
    const last = sections[sections.length - 1];
    if (last && last.title === month) last.data[0].push(h);
    else sections.push({ title: month, data: [[h]] });
  }
  const open = (h: FortuneHistoryItem) => nav.push('FortuneHistory', { id: String(h.id) });

  return (
    <SectionList
      sections={sections}
      keyExtractor={group => `f${group[0].id}`}
      renderItem={({ item }) => <FortuneRows rows={item} onOpen={open} />}
      renderSectionHeader={({ section }) => <Text style={s.month} accessibilityRole="header">{section.title}</Text>}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onEndReached={() => { if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<Empty title="아직 본 운세가 없어요" body={'운알이에게 오늘의 운세를 물어보세요.\n본 운세가 여기에 날짜별로 쌓여요.'} cta="오늘의 운세 물어보기 →" onPress={() => nav.navigate('Today')} />}
      ListFooterComponent={q.isFetchingNextPage ? <View style={s.more}><ActivityIndicator color={colors.purple} /></View> : undefined}
    />
  );
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return { day: String(d.getUTCDate()), wd: WEEKDAY[d.getUTCDay()] };
};

function FortuneRows({ rows, onOpen }: { rows: FortuneHistoryItem[]; onOpen(h: FortuneHistoryItem): void }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {rows.map((h, i) => {
        const { day, wd } = dayLabel(h.date);
        return (
          <PressableScale key={h.id} onPress={() => onOpen(h)} style={[s.row, i > 0 && s.rowLine]} scaleTo={0.98} accessibilityLabel={`${h.date} ${h.nickname}님 운세 ${h.totalScore}점`}>
            <View style={s.date}>
              <Text style={s.dateD}>{day}</Text>
              <Text style={s.dateW}>{wd}</Text>
            </View>
            {/* 누구 것인지와 점수만 — 칭호 · 요약은 열어서 본다 */}
            <Text style={[s.rowT, { flex: 1 }]} numberOfLines={1}>{h.nickname}님 · {h.totalScore}점</Text>
            <Icon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>
        );
      })}
    </Card>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: SCREEN_PX, paddingTop: 4, paddingBottom: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.card },
  tabOn: { backgroundColor: colors.ink },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.inkSub, letterSpacing: -0.4 },
  tabTextOn: { color: colors.cream },
  pad: { paddingHorizontal: SCREEN_PX },
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 0, paddingBottom: 40 },
  month: { fontSize: 14, fontWeight: '700', color: colors.inkSub, letterSpacing: -0.5, marginTop: 20, marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 40 },
  mascot: { width: 172, height: 115 },
  emptyT: { marginTop: 8, fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  more: { paddingVertical: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, paddingLeft: 12, paddingRight: 16 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.lineStrong },
  date: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dateD: { fontSize: 15, lineHeight: 18, fontWeight: '800', color: colors.ink },
  dateW: { fontSize: 10, lineHeight: 12, color: colors.inkMute },
  rowT: { fontSize: 14, lineHeight: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.56 },
  rowM: { fontSize: 11, lineHeight: 18, color: colors.inkMute, letterSpacing: -0.55 },
});
