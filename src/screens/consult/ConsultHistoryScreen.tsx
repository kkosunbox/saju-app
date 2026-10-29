import React from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import { BodyState } from '../../components/premium/Kit';
import { RootStackParamList } from '../../navigation/types';
import { ConsultView, consultApi, consultKeys } from '../../services/server/consultApi';
import { colors } from '../../theme/colors';
import { SCREEN_PX, txt } from '../../theme/typography';
import { ConsultRows, kstMonth } from './parts';

const PAGE = 20;

/** 상담 기록 전체 — 끝까지 내리면 다음 묶음을 불러온다. 지난 상담은 한 달씩 묶는다 */
export default function ConsultHistoryScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ConsultHistory'>>();
  const kind = params?.kind === 'open' ? 'open' : 'past';
  const insets = useSafeAreaInsets();
  const q = useInfiniteQuery({
    queryKey: consultKeys.pages(kind),
    queryFn: ({ pageParam }) => consultApi.list({ kind, before: pageParam, limit: PAGE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: last => (last.length < PAGE ? undefined : last[last.length - 1].id),
  });
  const title = kind === 'open' ? '이어서 이야기하기' : '지난 상담';
  if (q.isPending || q.isError) {
    return <Screen title={title} back><BodyState error={q.isError} onRetry={() => q.refetch()} /></Screen>;
  }

  const rows = q.data.pages.flat();
  // 섹션마다 카드 하나 — 지난 상담은 달마다, 이어서 이야기하기는 한 묶음
  const sections: { title: string; data: ConsultView[][] }[] = [];
  for (const e of rows) {
    const month = kind === 'past' ? kstMonth(e.createdAt) : '';
    const last = sections[sections.length - 1];
    if (last && last.title === month) last.data[0].push(e);
    else sections.push({ title: month, data: [[e]] });
  }
  const openChat = (e: ConsultView) => nav.push('ConsultChat', { id: String(e.id) });

  return (
    <Screen title={title} back scroll={false}>
      <SectionList
        sections={sections}
        keyExtractor={group => String(group[0].id)}
        renderItem={({ item }) => <ConsultRows rows={item} onOpen={openChat} />}
        renderSectionHeader={({ section }) => (section.title ? <Text style={s.month} accessibilityRole="header">{section.title}</Text> : null)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[s.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        onEndReached={() => { if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text style={[txt.small, s.empty]}>{kind === 'open' ? '이어서 이야기할 상담이 없어요' : '지난 상담이 없어요'}</Text>}
        ListFooterComponent={q.isFetchingNextPage ? <View style={s.more}><ActivityIndicator color={colors.purple} /></View> : undefined}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  month: { fontSize: 14, fontWeight: '700', color: colors.inkSub, letterSpacing: -0.5, marginTop: 20, marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 40 },
  more: { paddingVertical: 20 },
});
