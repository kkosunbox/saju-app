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
import { useFreeContent } from '../services/server/contentApi';
import { useConsultStatus } from '../services/server/consultApi';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { queryClient } from '../api/query';
import { ApiError } from '../api/client';
import { FriendResult, PendingInvite, clearPendingInvite, getFriendResult, markFriendSeen, getPendingInvite, shareInvite } from '../services/share/linkShare';
import { openFriendRoute } from '../navigation/premium';
import { colors } from '../theme/colors';
import { fonts, radius, SCREEN_PX, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { COPY } from '../content/copy';
import BottomSheet from '../components/BottomSheet';
import OptionChip from '../components/OptionChip';
import { RELATIONSHIPS } from '../data/relationships';
import { Relationship } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, account, fortune, today, fortuneLoading, refreshFortune } = useApp();
  const consultStatus = useConsultStatus(!!account).data;
  const consultFreeLeft = account ? consultStatus?.freeLeft ?? 0 : 5;
  const { points, toast } = usePremium();
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [askRelationship, setAskRelationship] = useState(false);
  const tal = useFreeContent('talisman').data;
  const match = useFreeContent('mbti-match').data?.best[0];
  const ch = useFreeContent('character').data;
  const pl = useFreeContent('past-life').data;
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

  const sendInvite = async () => {
    const r = await shareInvite(user.nickname);
    if (r === 'copied') toast('초대 링크를 복사했어요. 친구에게 보내 보세요');
    else if (r === 'failed') toast('초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
  };
  /** 관계를 고르면 그 관계에 맞는 궁합이 나온다 */
  const openInvite = async (relationship: Relationship) => {
    setAskRelationship(false);
    if (!invite) return;
    try {
      const result = await compatApi.acceptInvite(user.id, invite.token, relationship);
      await clearPendingInvite();
      setInvite(null);
      queryClient.invalidateQueries({ queryKey: compatKeys.list });
      nav.navigate('Tabs', { screen: 'Compatibility', params: { result } });
    } catch (e) {
      const gone = e instanceof ApiError && ['INVITATION_NOT_FOUND', 'INVITATION_TOKEN_EXPIRED', 'BAD_REQUEST'].includes(e.code);
      if (gone) { await clearPendingInvite(); setInvite(null); }
      toast(gone ? '초대 링크가 만료됐거나 꺼졌어요' : '궁합을 불러오지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  // 오늘의 무료 콘텐츠 — 결과의 일부를 미리 보여줘 누르고 싶게
  const FREE: { k: string; big: string; title: string; sub: string; go(): void; tone?: 'paper' }[] = [
    { k: 'tal', big: tal?.hanja ?? '符', title: '오늘의 부적', sub: tal?.keyword ?? '…', go: () => nav.navigate('Talisman'), tone: 'paper' },
    { k: 'mbti', big: match?.type ?? '性', title: '찰떡 MBTI', sub: match ? `${match.nickname} · ${match.score}점` : '…', go: () => nav.navigate('MbtiMatch') },
    { k: 'char', big: ch?.hanja ?? '命', title: '사주 캐릭터', sub: ch?.name ?? '…', go: () => nav.navigate('Character') },
    { k: 'past', big: '前', title: '전생 테스트', sub: pl?.title ?? '…', go: () => nav.navigate('PastLife') },
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
          <PressableScale onPress={() => setAskRelationship(true)} style={s.invite} scaleTo={0.98} accessibilityLabel={`${invite.inviterNickname}님과 궁합 보기`}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: colors.seal }}>和</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{invite.inviterNickname}님이 궁합을 신청했어요</Text>
              <Text style={txt.small}>눌러서 둘의 궁합 결과 바로 보기</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.inkMute} />
          </PressableScale>
        ) : null}
        {invite ? (
          <BottomSheet visible={askRelationship} onClose={() => setAskRelationship(false)}>
            <Text style={[txt.h2, { textAlign: 'center' }]}>{invite.inviterNickname}님과 어떤 사이인가요?</Text>
            <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>관계에 맞는 궁합으로 보여 드려요</Text>
            <View style={s.relGrid}>
              {RELATIONSHIPS.map(x => <OptionChip key={x.k} compact style={s.relCell} label={x.l} sub={x.hint} selected={false} onPress={() => openInvite(x.k)} />)}
            </View>
          </BottomSheet>
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
          <TodayHero fortune={f} today={today} dayPillar={fortune.dayPillar ?? { stem: 0, branch: 0 }} onOpenStory={() => nav.navigate('CombinedAnalysis')} onOpenCategory={c => nav.navigate('CategoryDetail', { category: c })} />
        </Reveal>

        <SectionHeader title="오늘의 행동" />
        <ActionTabs good={f.goodActions} avoid={f.avoidActions} />
        <PressableScale onPress={() => nav.navigate('Fortune')} style={s.allLink} scaleTo={0.98} accessibilityLabel="기간별 운세 보기">
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.purple }}>이번 주 · 이번 달 · 올해 운세 흐름 보기</Text>
          <Icon name="chevronRight" size={16} color={colors.purple} />
        </PressableScale>

        <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Consult' })} style={[s.premium, { marginTop: 24 }]} scaleTo={0.985} accessibilityLabel="고민 상담하기">
          <View style={{ flex: 1 }}>
            {consultFreeLeft > 0 ? <View style={{ flexDirection: 'row' }}><View style={s.newTag}><Text style={s.newText}>오늘 무료 {consultFreeLeft}번 남음</Text></View></View> : null}
            <Text style={s.premiumTitle}>오늘 마음에 걸리는 일 있나요?</Text>
            <Text style={s.premiumDesc}>털어놓으면 사주로 답하고, 이어서 더 물어볼 수 있어요</Text>
          </View>
          <Text style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.moon }}>談</Text>
        </PressableScale>

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
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  relCell: { width: '48.9%' },
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
