import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp, RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import PressableScale from '../../components/PressableScale';
import LoadingScreen from '../../components/LoadingScreen';
import { PointPill } from '../../components/HeaderPoints';
import { BodyState } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { fortuneApi } from '../../services/server/fortuneApi';
import { colors, isDark } from '../../theme/colors';
import { radius, SCREEN_PX, txt } from '../../theme/typography';
import { formatKoreanDate } from '../../utils/date';
import { MyBubble } from './parts';
import { ChatHeaderLeft } from './ChatMenu';
import { FortuneReading } from './FortuneChatScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * 지난 오늘의 운세 — 뽑았던 날의 운알이 답을 그때 그대로 다시 본다 (읽기만, 알 · 뽑기 없음).
 * 분야별 상세 · 공유 · 추천은 오늘 운세에만 있다
 */
export default function FortuneHistoryScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'FortuneHistory'>>();
  const { user, profiles, today } = useApp();
  const id = Number(params?.id);
  const q = useQuery({
    queryKey: ['fortune-history', 'one', id],
    queryFn: () => fortuneApi.drawn(user!.id, id),
    enabled: !!user && Number.isFinite(id),
    staleTime: Infinity, // 지난 운세는 바뀌지 않는다
  });
  const header = { left: <ChatHeaderLeft current={`fortune:${id}`} />, right: <PointPill attendHint quiet />, sky: true };

  if (!user) return null;
  if (q.isPending) return <LoadingScreen />;
  if (!q.data) return <Screen {...header}><BodyState error onRetry={() => q.refetch()} /></Screen>;
  const fortune = q.data;
  const who = fortune.person?.nickname ?? user.nickname;
  const isSelf = profiles.find(p => p.profileId === (fortune.profileId ?? user.profileId))?.relationship === 'self';

  return (
    <Screen {...header} scroll={false}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[txt.caption, { textAlign: 'center' }]}>{formatKoreanDate(fortune.date)} · 오늘의 운세</Text>
        <MyBubble>{isSelf ? '오늘 내 운세는 어때?' : `오늘 ${who}님 운세는 어때?`}</MyBubble>
        <FortuneReading fortune={fortune} who={who} />
        {fortune.date !== today ? (
          <PressableScale onPress={() => nav.navigate('Today')} style={s.today} scaleTo={0.98} accessibilityLabel="오늘의 운세 물어보기">
            <Text style={s.todayT}>오늘은 어떤 날일까요?</Text>
            <Text style={s.todayD}>오늘의 운세도 물어보세요 ›</Text>
          </PressableScale>
        ) : null}
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 24 }]}>운세는 재미와 참고를 위한 내용이에요.</Text>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  today: { marginTop: 28, padding: 16, borderRadius: radius.lg, backgroundColor: isDark ? colors.card : colors.accentSoft, gap: 4 },
  todayT: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  todayD: { fontSize: 13, color: colors.inkSub, letterSpacing: -0.5 },
});
