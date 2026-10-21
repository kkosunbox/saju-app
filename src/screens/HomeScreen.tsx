import React, { useEffect, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation/compat';
import { NativeStackNavigationProp } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { useHasTabHistory, useTabBack } from '../navigation/tabBack';
import AnalysisTile from '../components/AnalysisTile';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import ScoreRing from '../components/ScoreRing';
import Mascot, { ArtName, Logo } from '../components/Mascot';
import DrawMascot from '../components/DrawMascot';
import AnimatedNumber from '../components/AnimatedNumber';
import PromoCard from '../components/PromoCard';
import { CategoryGlyph } from '../components/CategoryIcon';
import { PointPill } from '../components/HeaderPoints';
import { usePremium } from '../context/PremiumContext';
import { ITEMS } from '../services/premium/catalog';
import { useFreeContent } from '../services/server/contentApi';
import { useConsultStatus } from '../services/server/consultApi';
import { useOpened } from '../services/content/opened';
import { motion } from '../utils/motion';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { queryClient } from '../api/query';
import { ApiError } from '../api/client';
import { FriendResult, PendingInvite, clearPendingInvite, getFriendResult, markFriendSeen, getPendingInvite, shareInvite } from '../services/share/linkShare';
import { openFriendRoute } from '../navigation/premium';
import { CategoryKey, categoryTheme, colors, gradients, isDark } from '../theme/colors';
import { radius, SCREEN_PX, shadow, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { COPY } from '../content/copy';
import BottomSheet from '../components/BottomSheet';
import OptionChip from '../components/OptionChip';
import { RELATIONSHIPS } from '../data/relationships';
import { Relationship } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
/** 점수 링 색 — 디자인의 분야별 링 그라디언트 시작색 */
const RING: Record<CategoryKey, string> = { love: '#C93B3B', money: '#E1A338', work: '#28B2FE', relationship: '#06C755' };

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, account, fortune, today, fortuneLoading, refreshFortune } = useApp();
  const consultStatus = useConsultStatus(!!account).data;
  const consultFreeLeft = account ? consultStatus?.freeLeft ?? 0 : 5;
  const consultCost = consultStatus?.cost ?? 100;
  const { owned, toast } = usePremium();
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [askRelationship, setAskRelationship] = useState(false);
  const tal = useFreeContent('talisman').data;
  const match = useFreeContent('mbti-match').data?.best[0];
  const ch = useFreeContent('character').data;
  const pl = useFreeContent('past-life').data;
  // 오늘의 운세는 마스코트를 꾹 눌러 뽑은 뒤에 보여준다
  const draw = useOpened('fortune');
  const sealed = draw.ready && !draw.opened;
  const [drawn, setDrawn] = useState(false); // 방금 뽑았으면 차례로 펼친다 (이미 뽑은 날엔 바로)
  const [pop] = useState(() => new Animated.Value(1));
  const [count] = useState(() => new Animated.Value(0));
  // 뽑기 전엔 결과를 타일에 미리 보여주지 않는다
  const opened = {
    tal: useOpened('talisman'), mbti: useOpened('mbti-match'), char: useOpened('character'), past: useOpened('past-life'),
  };
  const [friend, setFriend] = useState<FriendResult | null>(null);
  useEffect(() => { getPendingInvite().then(setInvite); getFriendResult().then(f => setFriend(f && !f.seen ? f : null)); }, []);

  const tabBack = useTabBack();
  const hasHistory = useHasTabHistory();
  const insets = useSafeAreaInsets();
  const top = (
    <View style={[s.topBar, { marginTop: insets.top }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {hasHistory ? (
          <PressableScale onPress={tabBack} hitSlop={10} scaleTo={0.9} accessibilityLabel="뒤로 가기">
            <Icon name="chevronLeft" size={24} strokeWidth={2} />
          </PressableScale>
        ) : null}
        <Logo height={33} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <PointPill />
        <PressableScale onPress={() => fortune && nav.navigate('Share')} hitSlop={8} scaleTo={0.9} accessibilityLabel="오늘의 운세 카드 저장·공유하기" disabled={!fortune || sealed} style={sealed && { opacity: 0.35 }}>
          <Icon name="download" size={24} color={colors.ink} />
        </PressableScale>
      </View>
    </View>
  );
  // 당겨서 새로고침할 때도 위가 비지 않게 화면 위로 400 더 늘려 둔다 (디자인 높이 296 + 상태바)
  const skyH = 296 + insets.top;
  const sky = (
    <LinearGradient
      pointerEvents="none"
      colors={[gradients.sky[0], ...gradients.sky]}
      locations={[0, 400 / (400 + skyH), (400 + skyH * 0.48) / (400 + skyH), (400 + skyH * 0.88) / (400 + skyH)]}
      style={[s.sky, { height: 400 + skyH }]}
    />
  );

  if (!fortune || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
        {sky}
        {top}
        <HomeSkeleton />
      </View>
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

  // 오늘의 무료 콘텐츠 — 뽑은 뒤에만 결과 한 줄을 보여준다 (뽑기 전엔 '?' 봉인)
  type Free = { k: string; art?: ArtName; big?: string; title: string; sub: string; sealed?: boolean; isNew?: boolean; go(): void };
  const FREE = ([
    { k: 'tal', art: 'talisman', title: '오늘의 부적', sub: tal?.keyword ?? '…', go: () => nav.navigate('Talisman') },
    { k: 'mbti', big: opened.mbti.opened ? match?.type ?? 'MBTI' : 'MBTI', title: '찰떡 MBTI', sub: match ? `${match.nickname} · ${match.score}점` : '…', go: () => nav.navigate('MbtiMatch') },
    { k: 'char', art: 'tiger', title: '사주 캐릭터', sub: ch?.name ?? '…', go: () => nav.navigate('Character') },
    { k: 'past', art: 'pastLife', title: '전생 테스트', sub: pl?.title ?? '…', go: () => nav.navigate('PastLife') },
    { k: 'inv', art: 'friends', title: '친구 궁합 초대', sub: '링크로 보내기', go: sendInvite },
  ] as Free[]).map((x): Free => {
    const o = opened[x.k as keyof typeof opened];
    if (!o) return x;
    if (!o.ready) return { ...x, sub: '…' };
    // 부적은 날마다 새로 뽑아서 'NEW'
    return o.opened ? x : { ...x, sealed: true, isNew: x.k === 'tal', sub: x.k === 'tal' ? '오늘 부적 받기' : '눌러서 뽑기' };
  });
  const spouseOwned = owned(ITEMS.spouse().key);

  const onDrawn = () => {
    draw.open();
    setDrawn(true);
    pop.setValue(0.8);
    count.setValue(0);
    Animated.spring(pop, { toValue: 1, speed: 12, bounciness: 12, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: f.totalScore, duration: 900, delay: 120, easing: motion.easeOut, useNativeDriver: false }).start();
  };
  /** 방금 뽑았을 때만 차례로 나타나게 (Reveal은 처음 그려질 때 한 번 움직인다) */
  const later = (delay: number, node: React.ReactNode) => (drawn ? <Reveal delay={delay}>{node}</Reveal> : node);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={fortuneLoading} onRefresh={() => refreshFortune()} tintColor={colors.white} />}
      >
        {sky}
        {top}
        <View style={{ paddingHorizontal: SCREEN_PX }}>
          <Reveal>
            <Text style={s.hello}>{user.nickname}님의 오늘</Text>
            <Text style={s.date}>{formatKoreanDate(today)}</Text>
          </Reveal>

          {invite ? (
            <PressableScale onPress={() => setAskRelationship(true)} style={[s.notice, { marginTop: 16 }]} scaleTo={0.98} accessibilityLabel={`${invite.inviterNickname}님과 궁합 보기`}>
              <Mascot name="friends" size={30} />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeTitle}>{invite.inviterNickname}님이 궁합을 신청했어요</Text>
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
            <PressableScale onPress={() => { markFriendSeen(); setFriend(null); openFriendRoute(nav, friend.c); }} style={[s.notice, { marginTop: invite ? 8 : 16 }]} scaleTo={0.98} accessibilityLabel={`${friend.n}님이 보낸 결과 보기`}>
              <Mascot size={30} />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeTitle} numberOfLines={1}>{friend.n}님의 '{friend.k}' 결과가 도착했어요</Text>
                <Text style={txt.small} numberOfLines={1}>{friend.h} · 나도 해보고 비교하기</Text>
              </View>
              <Icon name="chevronRight" size={18} color={colors.inkMute} />
            </PressableScale>
          ) : null}

          {/* 오늘의 점수 말풍선 + 마스코트 — 뽑기 전엔 '?'와 안내, 저장값을 읽기 전엔 비워 둔다 */}
          <View style={!draw.ready && { opacity: 0 }}>
          <Reveal delay={90}>
            <PressableScale onPress={() => nav.navigate('CombinedAnalysis')} disabled={sealed} style={s.bubbleWrap} scaleTo={0.98} accessibilityLabel={sealed ? '오늘의 운세가 도착했어요. 아래 마스코트를 꾹 눌러 뽑아 보세요' : `오늘의 종합운 ${f.totalScore}점. ${f.summary} 종합 풀이 보기`}>
              <Animated.View style={[s.bubble, shadow.hero, { transform: [{ scale: pop }] }]}>
                {sealed ? <Text style={[s.bubbleScore, { color: colors.accent }]}>?</Text>
                  : drawn ? <AnimatedNumber value={count} style={s.bubbleScore} />
                  : <Text style={s.bubbleScore}>{f.totalScore}</Text>}
                <Text style={s.bubbleText} numberOfLines={3}>{sealed ? '오늘의 운세가 도착했어요.\n저를 꾹 눌러 뽑아 보세요!' : f.summary}</Text>
              </Animated.View>
              <View style={s.tail} />
            </PressableScale>
            <DrawMascot sealed={sealed} onDrawn={onDrawn} />
          </Reveal>

          {/* 분야별 점수 */}
          <View style={s.rings}>
            {CATS.map((c, i) => {
              const t = categoryTheme[c];
              return (
                <PressableScale key={c} onPress={() => nav.navigate('CategoryDetail', { category: c })} disabled={sealed} style={s.ringCell} scaleTo={0.94} accessibilityLabel={sealed ? `${t.label}, 아직 안 뽑음` : `${t.label} ${f[c]}점`}>
                  {sealed ? (
                    <View style={s.ringSealed}><Text style={s.ringQ}>?</Text></View>
                  ) : (
                    <ScoreRing score={f[c]} size={64} stroke={3} color={RING[c]} track="transparent" inner={colors.card} textColor={colors.inkSub} fontSize={24} delay={drawn ? 450 + i * 140 : 250 + i * 80} />
                  )}
                  <View style={s.ringLabel}>
                    <CategoryGlyph category={c} size={13} />
                    <Text style={s.ringText}>{t.short}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {/* 오늘의 운세 */}
          {sealed ? (
            <View style={[s.today, s.todaySealed]}>
              <Text style={s.todayTitle}>오늘의 운세</Text>
              <Text style={s.sealedText}>뽑으면 오늘의 이야기와{'\n'}행운의 컬러 · 숫자 · 시간이 나와요</Text>
            </View>
          ) : later(900, (
          <View style={s.today}>
            <View style={s.todayHead}>
              <Text style={s.todayTitle}>오늘의 운세</Text>
              <PressableScale onPress={() => nav.navigate('CombinedAnalysis')} hitSlop={10} scaleTo={0.95} style={s.todayMore} accessibilityLabel="종합 풀이 보기">
                <Text style={s.todayMoreText}>종합풀이</Text>
                <Icon name="chevronRight" size={16} color={colors.inkMute} />
              </PressableScale>
            </View>
            <Text style={s.todayStory} numberOfLines={6}>{f.combinedStory || f.summary}</Text>
            <View style={s.lucky}>
              <View style={s.luck}>
                <Text style={s.luckK}>행운의 컬러</Text>
                <View style={[s.swatch, { backgroundColor: f.luckyColorHex }]} accessibilityLabel={f.luckyColor} />
              </View>
              <View style={[s.luck, { flex: 0.7 }]}>
                <Text style={s.luckK}>숫자</Text>
                <Text style={s.luckV}>{f.luckyNumber}</Text>
              </View>
              <View style={[s.luck, { flex: 1.7 }]}>
                <Text style={s.luckK}>시간</Text>
                <Text style={s.luckV} numberOfLines={1}>{f.luckyTime.replace('~', ' - ')}</Text>
              </View>
            </View>
          </View>
          ))}
          </View>

          {sealed ? null : later(1050, (
            <View style={{ marginTop: 16 }}>
              <ActionTabs good={f.goodActions} avoid={f.avoidActions} />
            </View>
          ))}
          <PressableScale onPress={() => nav.navigate('Fortune')} style={s.link} scaleTo={0.98} accessibilityLabel="기간별 운세 보기">
            <Text style={s.linkText}>이번 주 · 이번 달 · 올해 운세 흐름 보기</Text>
            <Icon name="chevronRight" size={16} color={colors.ink} />
          </PressableScale>

          <View style={{ marginTop: 16 }}>
            <PromoCard
              tone="lime"
              title="오늘 마음에 걸리는 일 있나요?"
              desc="털어놓으면 사주로 답하고, 이어서 더 물어볼 수 있어요"
              cta={consultFreeLeft > 0 ? `오늘 무료 상담 ${consultFreeLeft}번 남음 →` : `${consultCost}알 · 상담 시작하기 →`}
              coin={consultFreeLeft <= 0}
              onPress={() => nav.navigate('Tabs', { screen: 'Consult' })}
              accessibilityLabel="고민 상담하기"
            />
          </View>

          <SectionHeader title="무료로 즐기기" caption={COPY.friend} action="콘텐츠 전체 보기" onAction={() => nav.navigate('Tabs', { screen: 'Content' })} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 12 }}>
          {FREE.map(x => (
            <PressableScale key={x.k} onPress={x.go} style={s.freeCard} scaleTo={0.96} accessibilityLabel={x.sealed ? `${x.title}, 아직 안 뽑음` : `${x.title}, ${x.sub}`}>
              <View style={s.freeTop}>
                {x.art ? <Mascot name={x.art} size={44} /> : <Text style={s.freeBig} numberOfLines={1}>{x.big}</Text>}
                {x.sealed ? <View style={s.freeQ}><Text style={s.freeQText}>?</Text></View> : null}
              </View>
              {x.isNew ? <View style={s.freeNew}><Text style={s.freeNewText}>NEW</Text></View> : null}
              <Text style={s.freeTitle}>{x.title}</Text>
              <Text style={[s.freeSub, x.sealed && s.freeSubSealed]} numberOfLines={1}>{x.sub}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: SCREEN_PX }}>
          <SectionHeader title="4가지 관점" caption="오늘의 운세는 이렇게 만들어졌어요" action="종합 풀이 보기" onAction={() => nav.navigate('CombinedAnalysis')} />
          <View style={s.grid}>
            <View style={s.gridRow}>
              <AnalysisTile sealed={sealed} analysis={a.saju} onPress={() => nav.navigate('AnalysisDetail', { source: 'saju' })} />
              <AnalysisTile sealed={sealed} analysis={a.mbti} onPress={() => nav.navigate('AnalysisDetail', { source: 'mbti' })} />
            </View>
            <View style={s.gridRow}>
              <AnalysisTile sealed={sealed} analysis={a.thai} onPress={() => nav.navigate('AnalysisDetail', { source: 'thai' })} />
              <AnalysisTile sealed={sealed} analysis={a.blood} onPress={() => nav.navigate('AnalysisDetail', { source: 'blood' })} />
            </View>
          </View>

          <SectionHeader title="더 깊이 보기" caption={COPY.deeper} />
          <PromoCard
            tone="gold"
            isNew
            title="미래 배우자 리포트"
            desc="어떤 사람을, 언제, 어디서 만나게 될까?"
            owned={spouseOwned}
            coin={!spouseOwned}
            cta={spouseOwned ? '리포트 다시보기 →' : `${ITEMS.spouse().cost}알 · 리포트 열기 →`}
            onPress={() => nav.navigate('Spouse')}
          />
          <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} style={s.link} scaleTo={0.98}>
            <Text style={s.linkText}>평생운 · 신년운세 · 월별운세 · 테마 운세 · 길일</Text>
            <Icon name="chevronRight" size={16} color={colors.ink} />
          </PressableScale>

          <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
          <Disclaimer compact />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sky: { position: 'absolute', top: -400, left: 0, right: 0 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_PX },
  hello: { ...txt.title, marginTop: 8 },
  date: { fontSize: 14, fontWeight: '500', color: isDark ? colors.inkMute : '#999999', letterSpacing: -0.5, marginTop: 6 },
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  relCell: { width: '48.9%' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.accent },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },

  bubbleWrap: { marginTop: 20, marginHorizontal: 19 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 24, minHeight: 72, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, backgroundColor: colors.cream },
  bubbleScore: { fontSize: 32, fontWeight: '600', color: colors.ink, letterSpacing: -1.3, fontVariant: ['tabular-nums'] },
  bubbleText: { flex: 1, fontSize: 16, lineHeight: 19, fontWeight: '600', color: colors.ink, letterSpacing: -0.6 },
  tail: { position: 'absolute', left: 52, bottom: -7, width: 16, height: 16, borderRadius: 3, backgroundColor: colors.cream, transform: [{ rotate: '45deg' }] },

  ringSealed: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line },
  ringQ: { fontSize: 24, fontWeight: '700', color: colors.inkMute },
  todaySealed: { alignItems: 'center', paddingVertical: 22 },
  sealedText: { fontSize: 13, lineHeight: 19, color: colors.inkMute, letterSpacing: -0.5, textAlign: 'center', marginTop: 8 },
  rings: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 6 },
  ringCell: { alignItems: 'center', gap: 4 },
  ringLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringText: { fontSize: 14, fontWeight: '600', color: colors.ink, letterSpacing: -0.5 },

  today: { marginTop: 24, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  todayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  todayMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayMoreText: { fontSize: 13, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.5 },
  todayStory: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6, marginTop: 8 },
  lucky: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.xs, backgroundColor: colors.surface },
  luck: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  luckK: { fontSize: 13, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.5 },
  luckV: { fontSize: 13, fontWeight: '500', color: colors.ink, letterSpacing: -0.5, flexShrink: 1 },
  swatch: { width: 16, height: 16, borderRadius: 8 },

  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, height: 48, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.ink, letterSpacing: -0.5, flexShrink: 1 },

  freeCard: { width: 116, height: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  freeTop: { height: 44, justifyContent: 'center' },
  freeBig: { fontSize: 24, fontWeight: '700', color: colors.inkSub, letterSpacing: -0.5 },
  freeQ: { position: 'absolute', left: 34, top: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy, borderWidth: 2, borderColor: colors.card },
  freeQText: { fontSize: 11, fontWeight: '800', color: colors.white },
  freeNew: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, backgroundColor: colors.seal },
  freeNewText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  freeSubSealed: { color: colors.accent, fontWeight: '700' },
  freeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  freeSub: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.6, marginTop: 2 },

  grid: { gap: 16 },
  gridRow: { flexDirection: 'row', gap: 20 },
  tomorrow: { fontSize: 14, fontWeight: '700', color: '#838383', textAlign: 'center', marginTop: 32, letterSpacing: -0.5 },
});
