import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@/navigation/compat';
import { NativeStackNavigationProp } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { useHasTabHistory, useTabBack } from '../navigation/tabBack';
import TodayHero from '../components/TodayHero';
import AnalysisTile from '../components/AnalysisTile';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
import BrandMark from '../components/BrandMark';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import { Coin, PriceTag } from '../components/premium/Kit';
import { usePremium } from '../context/PremiumContext';
import { ITEMS } from '../services/premium/catalog';
import { mbtiMatches, pastLife, sajuCharacter, todayTalisman } from '../services/content/freeContent';
import { FriendResult, clearPendingInvite, getFriendResult, markFriendSeen, getPendingInvite, inviteUrl, shareLink } from '../services/share/linkShare';
import { openFriendRoute } from '../navigation/premium';
import { PartnerInput } from '../types';
import { colors } from '../theme/colors';
import { fonts, radius, SCREEN_PX, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { COPY } from '../content/copy';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, fortune, today, fortuneLoading, refreshFortune } = useApp();
  const { points, toast } = usePremium();
  const [invite, setInvite] = useState<PartnerInput | null>(null);
  const [friend, setFriend] = useState<FriendResult | null>(null);
  useEffect(() => { getPendingInvite().then(setInvite); getFriendResult().then(f => setFriend(f && !f.seen ? f : null)); }, []);

  const tabBack = useTabBack();
  const hasHistory = useHasTabHistory();
  const top = (
    <View style={s.topBar}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {hasHistory ? (
          <PressableScale onPress={tabBack} hitSlop={10} style={[s.iconBtn, { marginLeft: -12 }]} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
            <Icon name="chevronLeft" size={24} />
          </PressableScale>
        ) : null}
        <BrandMark />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <PressableScale onPress={() => nav.navigate('Wallet')} style={s.ptPill} scaleTo={0.94} accessibilityLabel={`내 포인트 ${points}P`}>
          <Coin size={16} />
          <Text style={s.ptText}>{points.toLocaleString('ko-KR')}</Text>
        </PressableScale>
        <PressableScale onPress={() => fortune && nav.navigate('Share')} style={s.iconBtn} scaleTo={0.9} accessibilityLabel="오늘의 운세 공유하기" disabled={!fortune}>
          <Icon name="share" size={20} color={colors.purple} />
        </PressableScale>
      </View>
    </View>
  );

  if (!fortune || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        {top}
        <HomeSkeleton />
      </SafeAreaView>
    );
  }
  const f = fortune.combined;
  const a = fortune.analyses;
  const tal = todayTalisman(user, today);
  const match = mbtiMatches(user.mbti).best[0];
  const ch = sajuCharacter(user);
  const pl = pastLife(user);

  const sendInvite = async () => {
    const r = await shareLink(`${user.nickname}님이 궁합 보자고 보냈어요. 생일만 넣으면 둘의 궁합이 바로 나와요.`, inviteUrl(user));
    if (r === 'copied') toast('초대 링크를 복사했어요. 친구에게 보내 보세요');
  };
  const openInvite = async () => {
    if (!invite) return;
    await clearPendingInvite();
    setInvite(null);
    nav.navigate('Tabs', { screen: 'Compatibility', params: { partner: invite } });
  };

  // 오늘의 무료 콘텐츠 — 결과의 일부를 미리 보여줘 누르고 싶게
  const FREE: { k: string; big: string; title: string; sub: string; go(): void; tone?: 'paper' }[] = [
    { k: 'tal', big: tal.hanja, title: '오늘의 부적', sub: tal.keyword, go: () => nav.navigate('Talisman'), tone: 'paper' },
    { k: 'mbti', big: match.type, title: '찰떡 MBTI', sub: `${match.nickname} · ${match.score}점`, go: () => nav.navigate('MbtiMatch') },
    { k: 'char', big: ch.hanja, title: '사주 캐릭터', sub: ch.name, go: () => nav.navigate('Character') },
    { k: 'past', big: '前', title: '전생 테스트', sub: pl.title, go: () => nav.navigate('PastLife') },
    { k: 'inv', big: '和', title: '친구 궁합 초대', sub: '링크로 보내기', go: sendInvite },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      {top}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PX, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={fortuneLoading} onRefresh={() => refreshFortune()} tintColor={colors.purple} />}
      >
        <Reveal>
          <Text style={txt.title}>{user.nickname}님의 오늘</Text>
          <Text style={[txt.small, { marginTop: 2, marginBottom: 16 }]}>{formatKoreanDate(today)}</Text>
        </Reveal>

        {invite ? (
          <PressableScale onPress={openInvite} style={s.invite} scaleTo={0.98} accessibilityLabel={`${invite.nickname}님과 궁합 보기`}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.seal }}>和</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{invite.nickname}님이 궁합을 신청했어요</Text>
              <Text style={txt.small}>눌러서 둘의 궁합 결과 바로 보기</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        ) : null}

        {friend ? (
          <PressableScale onPress={() => { markFriendSeen(); setFriend(null); openFriendRoute(nav, friend.c); }} style={s.invite} scaleTo={0.98} accessibilityLabel={`${friend.n}님이 보낸 결과 보기`}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.seal }}>比</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }} numberOfLines={1}>{friend.n}님의 '{friend.k}' 결과가 도착했어요</Text>
              <Text style={txt.small} numberOfLines={1}>{friend.h} · 나도 해보고 비교하기</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        ) : null}

        <Reveal delay={90}>
          <TodayHero fortune={f} today={today} onOpenStory={() => nav.navigate('CombinedAnalysis')} onOpenCategory={c => nav.navigate('CategoryDetail', { category: c })} />
        </Reveal>

        <SectionHeader title="오늘의 행동" />
        <ActionTabs good={f.goodActions} avoid={f.avoidActions} />

        <SectionHeader title="무료로 즐기기" caption={COPY.friend} action="전체 보기" onAction={() => nav.navigate('Tabs', { screen: 'Content' })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SCREEN_PX }} contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 10 }}>
          {FREE.map(x => (
            <PressableScale key={x.k} onPress={x.go} style={[s.freeCard, x.tone === 'paper' && s.paper]} scaleTo={0.96} accessibilityLabel={x.title}>
              <Text style={[s.freeBig, x.tone === 'paper' && { color: '#A5321F' }]} numberOfLines={1}>{x.big}</Text>
              <Text style={[s.freeTitle, x.tone === 'paper' && { color: '#3A2410' }]}>{x.title}</Text>
              <Text style={[txt.caption, x.tone === 'paper' && { color: '#7A5A2A' }]} numberOfLines={1}>{x.sub}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        <SectionHeader title="4가지 관점" caption="오늘의 운세는 이렇게 만들어졌어요" action="종합 보기" onAction={() => nav.navigate('CombinedAnalysis')} />
        <View style={s.grid}>
          <View style={s.gridRow}>
            <AnalysisTile analysis={a.saju} onPress={() => nav.navigate('AnalysisDetail', { source: 'saju' })} />
            <AnalysisTile analysis={a.thai} onPress={() => nav.navigate('AnalysisDetail', { source: 'thai' })} />
          </View>
          <View style={s.gridRow}>
            <AnalysisTile analysis={a.mbti} onPress={() => nav.navigate('AnalysisDetail', { source: 'mbti' })} />
            <AnalysisTile analysis={a.blood} onPress={() => nav.navigate('AnalysisDetail', { source: 'blood' })} />
          </View>
        </View>

        <SectionHeader title="더 깊이 보기" caption={COPY.deeper} />
        <PressableScale onPress={() => nav.navigate('Spouse')} style={s.premium} scaleTo={0.985} accessibilityLabel="미래 배우자 리포트">
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={s.newTag}><Text style={s.newText}>NEW</Text></View>
              <PriceTag item={ITEMS.spouse()} />
            </View>
            <Text style={s.premiumTitle}>미래 배우자 리포트</Text>
            <Text style={s.premiumDesc}>어떤 사람을, 언제, 어디서 만나게 될까?</Text>
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.moon }}>緣</Text>
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Consult')} style={[s.premium, { marginTop: 10 }]} scaleTo={0.985} accessibilityLabel="말 못 할 고민 상담">
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={s.newTag}><Text style={s.newText}>NEW</Text></View>
            </View>
            <Text style={s.premiumTitle}>말 못 할 고민 상담</Text>
            <Text style={s.premiumDesc}>200자로 털어놓으면 사주가 익명으로 답해요 · 100P</Text>
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.moon }}>談</Text>
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} style={s.allLink} scaleTo={0.98}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.purple }}>평생운 · 신년운세 · 월별운세 · 테마 운세 · 길일</Text>
          <Icon name="chevronRight" size={16} color={colors.purple} />
        </PressableScale>

        <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: SCREEN_PX, paddingRight: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ptPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.lavenderSoft },
  ptText: { fontSize: 13, fontWeight: '800', color: colors.purple },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 12, borderRadius: radius.lg, backgroundColor: colors.loveBg, borderWidth: 1, borderColor: colors.love },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  freeCard: { width: 132, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  paper: { backgroundColor: '#EED9A4', borderColor: '#D9BE7E' },
  freeBig: { fontFamily: fonts.serif, fontSize: 30, fontWeight: '600', color: colors.purple, lineHeight: 38 },
  freeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 10 },
  premium: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: radius.xl, backgroundColor: colors.heroBg },
  premiumTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.white, marginTop: 10 },
  premiumDesc: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  newTag: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.seal },
  newText: { fontSize: 11, fontWeight: '800', color: colors.white },
  tomorrow: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700', color: colors.inkSub, textAlign: 'center', marginTop: 32 },
  allLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 16, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft },
});
