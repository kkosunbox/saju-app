import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, RefreshControl, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@/navigation/compat';
import { NativeStackNavigationProp } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import AnalysisTile from '../components/AnalysisTile';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import BusinessFooter from '../components/BusinessFooter';
import ScoreRing from '../components/ScoreRing';
import Mascot, { ArtName, Logo } from '../components/Mascot';
import DrawMascot from '../components/DrawMascot';
import AnimatedNumber from '../components/AnimatedNumber';
import PromoCard from '../components/PromoCard';
import HScroll from '../components/HScroll';
import CharacterArt, { artOfPillar } from '../components/CharacterArt';
import { CategoryGlyph } from '../components/CategoryIcon';
import { PointPill } from '../components/HeaderPoints';
import { usePremium } from '../context/PremiumContext';
import { ITEMS } from '../services/premium/catalog';
import { useFreeContent } from '../services/server/contentApi';
import { useConsultStatus } from '../services/server/consultApi';
import { useFortuneDraw, useOpened } from '../services/content/opened';
import { motion } from '../utils/motion';
import { DEV_TOOLS } from '../utils/devTools';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { FriendResult, PendingInvite, getFriendResult, markFriendSeen, getPendingInvite, savePendingInvite, clearPendingInvite } from '../services/share/linkShare';
import { openFriendRoute } from '../navigation/premium';
import { CategoryKey, categoryTheme, colors, gradients, isDark } from '../theme/colors';
import { radius, SCREEN_PX, shadow, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { useWebTopBar } from '../utils/webThemeColor';
import { COPY } from '../content/copy';
import { KEYWORDS } from '../data/keywords';
import { KeywordTag } from '../types';
import BottomSheet from '../components/BottomSheet';
import InvitePicker from '../components/InvitePicker';
import WelcomeBonusSheet from '../components/WelcomeBonusSheet';
import { useInviteShare } from '../services/share/useInviteShare';
import ScoreDelta, { ScoreDeltaText, scoreDeltaLabel } from '../components/ScoreDelta';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MASCOT_PREVIEWS = [
  { pose: 'crown', label: '왕관' }, { pose: 'hearts', label: '하트' }, { pose: 'clover', label: '클로버' },
  { pose: 'checklist', label: '체크' }, { pose: 'breeze', label: '바람' }, { pose: 'question', label: '물음표' },
  { pose: 'rain', label: '비' }, { pose: 'sleepy', label: '졸음' },
] as const;

const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
const READ_STEPS = ['사주로 오늘의 일진을 짚는 중…', '별자리 흐름을 맞춰 보는 중…', 'MBTI 성향을 겹쳐 보는 중…', '혈액형 한마디까지 엮는 중…', '오늘의 이야기를 쓰는 중…'];

/** 말풍선 안에서 차례로 바뀌는 '풀어보는 중' 문구 (마지막 문구에서 멈춘다) */
function ReadingSteps({ style }: { style: StyleProp<TextStyle> }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(n => Math.min(n + 1, READ_STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, []);
  return <Text style={style} numberOfLines={3} accessibilityLiveRegion="polite">{READ_STEPS[i]}</Text>;
}
/** 점수 링 색 — 디자인의 분야별 링 그라디언트 시작색 */
const RING: Record<CategoryKey, string> = { love: '#C93B3B', money: '#E1A338', work: '#28B2FE', relationship: '#06C755' };
/** 마스코트 밑 해시태그 — 관점별 한 줄의 태그 중 여러 관점에 겹친 것부터, 3개(길면 2개)까지 */
const TAG_MAX_CHARS = 12;
/** 유리 칩 위쪽에 맺히는 빛 — 아래로 갈수록 사라진다 */
const GLASS_SHINE = isDark ? (['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] as const) : (['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.15)'] as const);

function mascotTags(lists: KeywordTag[][]): string[] {
  const count = new Map<KeywordTag, number>();
  lists.flat().forEach(t => count.set(t, (count.get(t) ?? 0) + 1));
  const top = [...count.keys()].sort((x, y) => count.get(y)! - count.get(x)!).slice(0, 3).map(t => KEYWORDS[t].label);
  return top.join('').length > TAG_MAX_CHARS ? top.slice(0, 2) : top;
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, account, fortune, today, fortuneLoading, refreshFortune, fortuneWriting } = useApp();
  const consultStatus = useConsultStatus(!!account).data;
  const consultFreeLeft = account ? consultStatus?.freeLeft ?? 0 : 5;
  const consultCost = consultStatus?.cost ?? 100;
  const { owned, toast } = usePremium();
  const { sendInvite, inviteShareSheet } = useInviteShare();
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const tal = useFreeContent('talisman').data;
  const match = useFreeContent('mbti-match').data?.best[0];
  const ch = useFreeContent('character').data;
  const pl = useFreeContent('past-life').data;
  // 오늘의 운세는 마스코트를 꾹 눌러 뽑은 뒤, 풀이가 다 써지면 한 번에 펼친다
  const draw = useFortuneDraw();
  const [luckOpen, setLuckOpen] = useState(false);
  const [drawn, setDrawn] = useState(false); // 방금 뽑았으면 차례로 펼친다 (이미 뽑은 날엔 바로)
  const [waitingForPolish, setWaitingForPolish] = useState(false);
  const [mascotPreview, setMascotPreview] = useState<{ date: string; index: number } | null>(null);
  const mascotOverride = DEV_TOOLS && mascotPreview?.date === today ? MASCOT_PREVIEWS[mascotPreview.index] : null;
  // 타이머 대신 실제 세 구역 연출의 완료 신호를 기다린다.
  const completePolish = useCallback(() => setWaitingForPolish(false), []);
  const sealed = draw.ready && !draw.opened;
  const reading = draw.ready && draw.opened && (fortuneWriting || waitingForPolish);
  const hidden = sealed || reading; // 결과를 가리는 동안 (뽑기 전 · 풀이를 기다리는 중)
  const [pop] = useState(() => new Animated.Value(1));
  const [count] = useState(() => new Animated.Value(0));
  // 풀이가 도착하면: 말풍선이 팡 뜨며 점수가 올라간다 (나머지는 later()로 차례로)
  const total = fortune?.combined.totalScore;
  const yesterday = fortune?.yesterdayScores; // 어제 대비 ▲▼
  useEffect(() => {
    if (!drawn || reading || total === undefined) return;
    pop.setValue(0.8);
    count.setValue(0);
    Animated.spring(pop, { toValue: 1, speed: 12, bounciness: 12, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: total, duration: 900, delay: 120, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [drawn, reading, total, pop, count]);
  // 테스트용(local·dev): 오늘 뽑은 기록을 지워 마스코트를 다시 봉인한다
  const resetDraw = () => {
    draw.reset();
    setDrawn(false);
    setWaitingForPolish(false);
  };
  // 날짜·점수는 건드리지 않고 홈 마스코트 종류만 임시로 순환한다. 날짜가 바뀌면 자동 해제.
  const cycleMascot = () => {
    if (!DEV_TOOLS || hidden || !fortune) return;
    setMascotPreview(current => ({
      date: today,
      index: ((current?.date === today ? current.index : -1) + 1) % MASCOT_PREVIEWS.length,
    }));
  };
  // 뽑기 전엔 결과를 타일에 미리 보여주지 않는다
  const opened = {
    tal: useOpened('talisman'), mbti: useOpened('mbti-match'), char: useOpened('character'), past: useOpened('past-life'),
  };
  const [friend, setFriend] = useState<FriendResult | null>(null);
  useEffect(() => { getFriendResult().then(f => setFriend(f && !f.seen ? f : null)); }, []);
  // 프로필을 넣으러 갔다 온 초대(auto)는 홈에 오면 궁합 보기 안내를 한 번 연다 — 수락하거나 버리거나
  useFocusEffect(useCallback(() => {
    getPendingInvite().then(inv => {
      if (!inv?.auto) return;
      setInvite(inv);
      setShowInvite(true);
      savePendingInvite({ ...inv, auto: false });
    });
  }, []));
  const closeInvite = () => { setShowInvite(false); setInvite(null); };
  const declineInvite = () => { clearPendingInvite(); closeInvite(); };
  // 내 초대 링크로 상대가 본 궁합 중 아직 안 연 것 — 궁합 탭과 같은 캐시
  const compat = useQuery({ queryKey: [...compatKeys.list, user?.id, user?.version], queryFn: () => compatApi.list(user!.id), enabled: !!user });
  const { refetch: refetchCompat } = compat;
  useFocusEffect(useCallback(() => { if (user) refetchCompat(); }, [user, refetchCompat]));
  const arrived = compat.data?.filter(r => r.isNew) ?? [];

  const insets = useSafeAreaInsets();
  // 당겨서 새로고침할 때도 위가 비지 않게 화면 위로 400 더 늘려 둔다 (디자인 높이 296 + 상태바).
  // 상단 바(상태바 + 로고 줄)까지는 단색으로 두어 Safari 상단 바와 경계가 보이지 않게 한다
  const skyH = 296 + insets.top;
  const skyHold = insets.top + 56;
  // 웹: 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다
  const onScrollTopBar = useWebTopBar([
    [0, gradients.sky[0]], [skyHold, gradients.sky[0]], [skyH * 0.48, gradients.sky[1]], [skyH * 0.88, gradients.sky[2]],
  ]);
  const top = (
    <View style={[s.topBar, { marginTop: insets.top }]}>
      <Logo height={33} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flexShrink: 1, marginLeft: 12 }}>
        {DEV_TOOLS && draw.opened ? (
          <View style={s.devControls}>
            <PressableScale onPress={resetDraw} hitSlop={4} scaleTo={0.9} style={s.devReset} accessibilityLabel="오늘의 운세 뽑기 전으로 되돌리기 (테스트용)">
              <Text style={s.devResetText}>뽑기 초기화</Text>
            </PressableScale>
            <PressableScale onPress={cycleMascot} onLongPress={() => setMascotPreview(null)} disabled={hidden} hitSlop={4} scaleTo={0.9} style={[s.devReset, hidden && { opacity: 0.35 }]} accessibilityLabel={`다음 마스코트로 변경 (테스트용)${mascotOverride ? ` · 현재 ${mascotOverride.label}` : ''}`} accessibilityHint="왕관·하트·클로버·체크·바람·물음표·비·졸음 순서로 바뀌어요. 길게 누르면 오늘의 마스코트로 돌아가요">
              <Text style={s.devResetText}>{mascotOverride ? `${mascotOverride.label} ↻` : '↻'}</Text>
            </PressableScale>
          </View>
        ) : null}
        <PointPill />
        <PressableScale onPress={() => fortune && nav.navigate('Share')} hitSlop={8} scaleTo={0.9} accessibilityLabel="오늘의 운세 카드 공유하기" disabled={!fortune || hidden} style={hidden && { opacity: 0.35 }}>
          <Icon name="share" size={24} color={colors.ink} />
        </PressableScale>
      </View>
    </View>
  );
  const sky = (
    <LinearGradient
      pointerEvents="none"
      colors={[gradients.sky[0], ...gradients.sky]}
      locations={[0, (400 + skyHold) / (400 + skyH), (400 + skyH * 0.48) / (400 + skyH), (400 + skyH * 0.88) / (400 + skyH)]}
      style={[s.sky, { height: 400 + skyH }]}
    />
  );

  // 스켈레톤과 본 화면이 따로 그리면 운세가 오는 순간 시트가 다시 올라오니 본 화면에서만 연다
  const invitePrompt = invite && user ? (
    <BottomSheet visible={showInvite} onClose={declineInvite}>
      <InvitePicker invite={invite} onDone={closeInvite} onDecline={declineInvite} />
    </BottomSheet>
  ) : null;

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
  const tags = mascotTags([a.saju.tags, a.thai.tags, a.mbti.tags, a.blood.tags]);

  // 오늘의 무료 콘텐츠 — 뽑은 뒤에만 결과 한 줄을 보여준다 (뽑기 전엔 '?' 봉인)
  type Free = { k: string; art?: ArtName; pillar?: string; big?: string; title: string; sub: string; sealed?: boolean; isNew?: boolean; go(): void };
  const FREE = ([
    { k: 'tal', art: 'talisman', title: '오늘의 부적', sub: tal?.keyword ?? '…', go: () => nav.navigate('Talisman') },
    { k: 'mbti', big: opened.mbti.opened ? match?.type ?? 'MBTI' : 'MBTI', title: '찰떡 MBTI', sub: match ? `${match.nickname} · ${match.score}점` : '…', go: () => nav.navigate('MbtiMatch') },
    { k: 'char', art: 'tiger', pillar: ch?.hanja, title: '사주 캐릭터', sub: ch?.name ?? '…', go: () => nav.navigate('Character') },
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
    draw.open(); // 뽑았다고 기록하면 useFortuneDraw가 서버에 풀이를 부탁한다
    setDrawn(true);
    setWaitingForPolish(true);
  };
  /** 방금 뽑았을 때만 차례로 나타나게 (Reveal은 처음 그려질 때 한 번 움직인다) */
  // 종합 풀이는 오늘의 운세를 뽑고 풀이가 나온 뒤에만 연다
  const openCombined = () => {
    if (sealed) toast('마스코트를 꾹 눌러 오늘의 운세를 먼저 뽑아 보세요');
    else if (reading) toast('오늘의 이야기를 쓰고 있어요. 잠깐만 기다려 주세요');
    else nav.navigate('CombinedAnalysis');
  };
  const later = (delay: number, node: React.ReactNode) => (drawn ? <Reveal delay={delay}>{node}</Reveal> : node);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* 웹(아이폰 Safari)은 스크롤 영역 위로 삐져나간 하늘을 잘라 버려서, 당기면 뒤가 보인다.
          뒤쪽 위 절반을 하늘색으로 깔고 내용은 흰 바탕으로 덮어, 위로 당기면 하늘색·아래로 당기면 흰색이 보이게 한다 */}
      <View pointerEvents="none" style={[s.overscrollTop, { backgroundColor: gradients.sky[0] }]} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, backgroundColor: colors.cream }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => onScrollTopBar(e.nativeEvent.contentOffset.y)}
        refreshControl={<RefreshControl refreshing={fortuneLoading} onRefresh={() => refreshFortune()} tintColor={colors.white} />}
      >
        {sky}
        {top}
        <View style={{ paddingHorizontal: SCREEN_PX }}>
          <Reveal>
            <Text style={s.hello}>{user.nickname}님의 오늘</Text>
            <Text style={s.date}>{formatKoreanDate(today)}</Text>
          </Reveal>

          {/* 내 링크로 상대가 궁합을 봤다 — 누르면 결과로 (열면 궁합 탭이 '봤음'으로 바꾼다) */}
          {arrived.length ? (
            <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Compatibility', params: { result: arrived[0] } })} style={[s.notice, { marginTop: 16 }]} scaleTo={0.98} accessibilityLabel={`${arrived[0].target.nickname}님과의 궁합 결과 보기`}>
              <Mascot name="friends" size={30} />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeTitle} numberOfLines={1}>
                  {arrived.length > 1 ? `${arrived[0].target.nickname}님 외 ${arrived.length - 1}명이` : `${arrived[0].target.nickname}님이`} 내 링크로 궁합을 봤어요
                </Text>
                <Text style={txt.small} numberOfLines={1}>둘의 궁합 {arrived[0].total}점 · 눌러서 결과 보기</Text>
              </View>
              <Icon name="chevronRight" size={18} color={colors.inkMute} />
            </PressableScale>
          ) : null}

          {friend ? (
            <PressableScale onPress={() => { markFriendSeen(); setFriend(null); openFriendRoute(nav, friend.c); }} style={[s.notice, { marginTop: arrived.length ? 8 : 16 }]} scaleTo={0.98} accessibilityLabel={`${friend.n}님이 보낸 결과 보기`}>
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
            <PressableScale onPress={() => nav.navigate('CombinedAnalysis')} disabled={hidden} style={s.bubbleWrap} scaleTo={0.98} accessibilityLabel={sealed ? '오늘의 운세가 도착했어요. 아래 마스코트를 꾹 눌러 뽑아 보세요' : reading ? '오늘의 운세를 풀어보는 중이에요' : `오늘의 종합운 ${f.totalScore}점.${scoreDeltaLabel(f.totalScore, yesterday?.totalScore)} ${f.summary} 종합 풀이 보기`}>
              <Animated.View style={[s.bubble, shadow.hero, { transform: [{ scale: pop }] }]}>
                {hidden ? <Text style={[s.bubbleScore, { color: colors.accent }]}>?</Text>
                  : drawn ? <AnimatedNumber value={count} style={s.bubbleScore} />
                  : <Text style={s.bubbleScore}>{f.totalScore}</Text>}
                {sealed ? <Text style={s.bubbleText} numberOfLines={3}>{'오늘의 운세가 도착했어요.\n저를 꾹 눌러 뽑아 보세요!'}</Text>
                  : reading ? <ReadingSteps style={s.bubbleText} />
                  : (
                    <View style={s.bubbleBody}>
                      <Text style={[s.bubbleText, { flex: 0 }]} numberOfLines={3}>{f.summary}</Text>
                      <ScoreDeltaText now={f.totalScore} before={yesterday?.totalScore} />
                    </View>
                  )}
              </Animated.View>
              <View style={s.tail} />
            </PressableScale>
            <DrawMascot sealed={sealed} busy={reading} onDrawn={onDrawn} onPolishComplete={completePolish} pose={mascotOverride?.pose} scores={hidden ? undefined : f} />
            {!hidden && later(300, (
              <View style={s.mascotTags} accessibilityLabel={`오늘의 키워드 ${tags.join(', ')}`}>
                {tags.map(tag => (
                  <View key={tag} style={s.glassChip}>
                    <LinearGradient colors={GLASS_SHINE} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                    <Text style={s.mascotTag}><Text style={s.mascotTagHash}>#</Text>{tag}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Reveal>

          {/* 분야별 점수 */}
          <View style={s.rings}>
            {CATS.map((c, i) => {
              const t = categoryTheme[c];
              return (
                <PressableScale key={c} onPress={() => nav.navigate('CategoryDetail', { category: c })} disabled={hidden} style={s.ringCell} scaleTo={0.94} accessibilityLabel={hidden ? `${t.label}, 아직 안 나옴` : `${t.label} ${f[c]}점${scoreDeltaLabel(f[c], yesterday?.[c])}`}>
                  {hidden ? (
                    <View style={s.ringSealed}><Text style={s.ringQ}>?</Text></View>
                  ) : (
                    <ScoreRing score={f[c]} size={64} stroke={3} color={RING[c]} track="transparent" inner={colors.card} textColor={colors.inkSub} fontSize={20} delay={drawn ? 450 + i * 140 : 250 + i * 80}>
                      {/* 어제 대비 칩: 숫자 밑에 작게, 링이 다 차오른 뒤 톡 */}
                      <ScoreDelta now={f[c]} before={yesterday?.[c]} delay={(drawn ? 450 + i * 140 : 250 + i * 80) + 1100} small />
                    </ScoreRing>
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
          {hidden ? (
            <View style={[s.today, s.todaySealed]}>
              <Text style={s.todayTitle}>오늘의 운세</Text>
              <Text style={s.sealedText}>{reading ? '네 가지 관점을 엮어\n오늘의 이야기를 쓰고 있어요' : '뽑으면 오늘의 이야기와\n행운의 컬러 · 숫자 · 시간이 나와요'}</Text>
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
            <Text style={s.todayStory}>{f.storyBrief || f.summary}</Text>
            <PressableScale
              onPress={() => setLuckOpen((v) => !v)}
              disabled={!f.luckyReasons}
              scaleTo={0.98}
              style={s.luckyBox}
              accessibilityLabel={luckOpen ? '행운 근거 접기' : '행운 근거 보기'}
            >
              <View style={s.lucky}>
                <View style={s.luck}>
                  <Text style={s.luckK}>컬러</Text>
                  <View style={[s.swatch, { backgroundColor: f.luckyColorHex }]} />
                  <Text style={s.luckV} numberOfLines={1}>{f.luckyColor}</Text>
                </View>
                <View style={s.luck}>
                  <Text style={s.luckK}>숫자</Text>
                  <Text style={s.luckV}>{f.luckyNumber}</Text>
                </View>
                <View style={s.luck}>
                  <Text style={s.luckK}>시간</Text>
                  <Text style={s.luckV} numberOfLines={1}>{f.luckyTime.replace('~', ' - ')}</Text>
                </View>
                {f.luckyReasons ? (
                  <View style={luckOpen ? s.luckChevronOpen : undefined}>
                    <Icon name="chevronDown" size={14} color={colors.inkMute} />
                  </View>
                ) : null}
              </View>
              {luckOpen && f.luckyReasons ? (
                <View style={s.luckWhy}>
                  {([['컬러', f.luckyReasons.color], ['숫자', f.luckyReasons.number], ['시간', f.luckyReasons.time]] as const).map(([k, why]) => (
                    <View key={k} style={s.luckWhyRow}>
                      <Text style={s.luckWhyK}>{k}</Text>
                      <Text style={s.luckWhyV}>{why}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </PressableScale>
          </View>
          ))}
          </View>

          {hidden ? null : later(1050, (
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
              desc="저한테 편하게 얘기해 주세요. 도움이 될 거예요."
              cta={consultFreeLeft > 0 ? '무료 티켓 사용 →' : `${consultCost} · 상담 시작하기 →`}
              coin={consultFreeLeft <= 0}
              onPress={() => nav.navigate('Tabs', { screen: 'Consult' })}
              accessibilityLabel="고민 상담하기"
            />
          </View>

          <SectionHeader title="무료로 즐기기" caption={COPY.friend} action="콘텐츠 전체 보기" onAction={() => nav.navigate('Tabs', { screen: 'Content' })} />
        </View>
        <HScroll contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 12 }}>
          {FREE.map(x => (
            <PressableScale key={x.k} onPress={x.go} style={s.freeCard} scaleTo={0.96} accessibilityLabel={x.sealed ? `${x.title}, 아직 안 뽑음` : `${x.title}, ${x.sub}`}>
              <View style={s.freeTop}>
                {/* 뽑기 전 찰떡 MBTI는 결과 대신 MBTI 카드 그림 */}
                {/* 뽑은 사주 캐릭터는 내 캐릭터 그림 (뽑기 전엔 결과를 숨기려고 공용 그림) */}
                {x.pillar && !x.sealed && artOfPillar(x.pillar) ? <CharacterArt hanja={x.pillar} size={48} />
                  : x.art || x.sealed ? <Mascot name={x.art ?? 'mbti'} size={44} /> : <Text style={s.freeBig} numberOfLines={1}>{x.big}</Text>}
              </View>
              {/* 뽑기 전 표시는 카드 오른쪽 위 — NEW는 그 아래에 */}
              {x.sealed ? <View style={s.freeQ}><Text style={s.freeQText}>?</Text></View> : null}
              {x.isNew ? <View style={[s.freeNew, x.sealed && { top: 40 }]}><Text style={s.freeNewText}>NEW</Text></View> : null}
              <Text style={s.freeTitle}>{x.title}</Text>
              <Text style={[s.freeSub, x.sealed && s.freeSubSealed]} numberOfLines={1}>{x.sub}</Text>
            </PressableScale>
          ))}
        </HScroll>

        <View style={{ paddingHorizontal: SCREEN_PX }}>
          <SectionHeader title="4가지 관점" caption="오늘의 운세는 이렇게 만들어져요" action="종합 풀이 보기" onAction={openCombined} />
          <View style={s.grid}>
            <View style={s.gridRow}>
              <AnalysisTile analysis={a.saju} onPress={() => nav.navigate('AnalysisDetail', { source: 'saju' })} />
              <AnalysisTile analysis={a.mbti} onPress={() => nav.navigate('AnalysisDetail', { source: 'mbti' })} />
            </View>
            <View style={s.gridRow}>
              <AnalysisTile analysis={a.thai} onPress={() => nav.navigate('AnalysisDetail', { source: 'thai' })} />
              <AnalysisTile analysis={a.blood} onPress={() => nav.navigate('AnalysisDetail', { source: 'blood' })} />
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
            cta={spouseOwned ? '리포트 다시보기 →' : `${ITEMS.spouse().cost} · 리포트 열기 →`}
            onPress={() => nav.navigate('Spouse')}
          />
          <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} style={s.link} scaleTo={0.98}>
            <Text style={s.linkText}>평생운 · 신년운세 · 월별운세 · 테마 운세 · 길일</Text>
            <Icon name="chevronRight" size={16} color={colors.ink} />
          </PressableScale>

          <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
          <Disclaimer compact />
          <BusinessFooter style={{ marginTop: 28 }} />
        </View>
      </ScrollView>
      {invitePrompt}
      {inviteShareSheet}
      <WelcomeBonusSheet hidden={showInvite} />
    </View>
  );
}

const s = StyleSheet.create({
  sky: { position: 'absolute', top: -400, left: 0, right: 0 },
  overscrollTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  devControls: { flexDirection: 'row', flexWrap: 'wrap', flexShrink: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  devReset: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_PX },
  hello: { ...txt.title, marginTop: 8 },
  date: { fontSize: 14, fontWeight: '500', color: isDark ? colors.inkMute : '#999999', letterSpacing: -0.5, marginTop: 6 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.accent },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },

  bubbleWrap: { marginTop: 20, marginHorizontal: 19 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 24, minHeight: 72, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, backgroundColor: colors.cream },
  bubbleBody: { flex: 1, gap: 4 },
  bubbleScore: { fontSize: 32, fontWeight: '600', color: colors.ink, letterSpacing: -1.3, fontVariant: ['tabular-nums'] },
  bubbleText: { flex: 1, fontSize: 16, lineHeight: 19, fontWeight: '600', color: colors.ink, letterSpacing: -0.6 },
  mascotTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: -12, marginBottom: 16, paddingHorizontal: SCREEN_PX },
  // 리퀴드 글래스 칩: 비치는 바탕 + 위쪽 빛 반사 + 얇은 빛 테두리
  glassChip: {
    overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)',
    shadowColor: isDark ? '#000000' : '#1E8FD6', shadowOpacity: isDark ? 0.3 : 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  mascotTag: { fontSize: 13, fontWeight: '600', color: colors.inkSub, letterSpacing: -0.5 },
  mascotTagHash: { color: colors.accent, fontWeight: '700' },
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
  todayStory: { fontSize: 14, lineHeight: 21, color: colors.ink, letterSpacing: -0.5, marginTop: 8 },
  luckyBox: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.xs, backgroundColor: colors.surface },
  lucky: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  luckChevronOpen: { transform: [{ rotate: '180deg' }] },
  luckWhy: { gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  luckWhyRow: { flexDirection: 'row', gap: 8 },
  luckWhyK: { width: 28, fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.5 },
  luckWhyV: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.inkSub, letterSpacing: -0.5 },
  luck: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  luckK: { fontSize: 13, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.5 },
  luckV: { fontSize: 13, fontWeight: '500', color: colors.ink, letterSpacing: -0.5, flexShrink: 1 },
  swatch: { width: 16, height: 16, borderRadius: 8 },

  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, height: 48, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.ink, letterSpacing: -0.5, flexShrink: 1 },

  freeCard: { width: 116, height: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  freeTop: { height: 44, justifyContent: 'center' },
  freeBig: { fontSize: 24, fontWeight: '700', color: colors.inkSub, letterSpacing: -0.5 },
  freeQ: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  freeQText: { fontSize: 12, fontWeight: '800', color: colors.white },
  freeNew: { position: 'absolute', top: 16, right: 12, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, backgroundColor: colors.seal },
  freeNewText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  freeSubSealed: { color: colors.accent, fontWeight: '700' },
  freeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  freeSub: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.6, marginTop: 2 },

  grid: { gap: 16 },
  gridRow: { flexDirection: 'row', gap: 20 },
  tomorrow: { fontSize: 14, fontWeight: '700', color: '#838383', textAlign: 'center', marginTop: 32, letterSpacing: -0.5 },
});
