import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, Platform, RefreshControl, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { ClipPath, Defs, G, LinearGradient as SvgGradient, Rect, RectProps, Stop, Text as SvgText } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@/navigation/compat';
import { NativeStackNavigationProp } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import AnalysisTile from '../components/AnalysisTile';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
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
import { HomeCategoryGlyph, HomeFreeArt, HomeOutlineIcon } from '../components/home/HomeDesignAssets';
import { PointPill } from '../components/HeaderPoints';
import { usePremium } from '../context/PremiumContext';
import { ITEMS } from '../services/premium/catalog';
import { useFreeContent } from '../services/server/contentApi';
import { useConsultStatus } from '../services/server/consultApi';
import { useFortuneDraw, useOpened } from '../services/content/opened';
import { motion, useReducedMotion, useScreenLive } from '../utils/motion';
import { DEV_TOOLS } from '../utils/devTools';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { FriendResult, PendingInvite, getFriendResult, markFriendSeen, getPendingInvite, savePendingInvite, clearPendingInvite } from '../services/share/linkShare';
import { openFriendRoute } from '../navigation/premium';
import { CategoryKey, categoryTheme, colors, gradients, isDark } from '../theme/colors';
import { radius, sansW, SCREEN_PX, shadow, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { useWebTopBar, webSafeTop } from '../utils/webThemeColor';
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
// Figma 각 분야 라벨 그룹의 링 중심 대비 위치(375px 프레임).
const CATEGORY_LABEL_OFFSET = { love: 0, money: 0.5, work: -0.5, relationship: 0.5 } as const;
const READ_STEPS = ['사주로 오늘의 일진을 짚는 중…', '별자리 흐름을 맞춰 보는 중…', 'MBTI 성향을 겹쳐 보는 중…', '오늘의 타로 카드를 펼치는 중…', '오늘의 이야기를 쓰는 중…'];

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
const TAG_FONT = 13;
/** 키워드 글자색과, 글자 위로만 훑고 지나가는 빛 */
const TAG_INK = isDark ? '#7CC4EE' : '#28B2FE';
const TAG_GLINT = isDark ? '#EAF7FF' : '#D2EEFF';
const GLINT_W = 26;
/** SVG 글자도 앱 글꼴(Pretendard SemiBold)로 — 원래 글자 자리와 폭이 맞게 */
const TAG_FACE = sansW('600');
// Animated injects an Android-only prop that SVG forwards to the DOM on web.
const GlintRect = React.forwardRef<Rect, RectProps & { collapsable?: boolean }>(function GlintRect(props, ref) {
  if (Platform.OS !== 'web') return <Rect {...props} ref={ref} />;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { collapsable, ...svgProps } = props;
  return <Rect {...svgProps} ref={ref} />;
});
const AnimatedRect = Animated.createAnimatedComponent(GlintRect);

/** 글자 모양으로 잘라낸 안에서만 빛 줄기가 지나간다 — 한 줄기가 칩을 하나씩 관통하도록 칩마다 sweep 구간을 늦춘다 */
function GlintTag({ label, sweep, index, count }: { label: string; sweep: Animated.Value; index: number; count: number }) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const step = 1 / (count + 1);
  const from = index * step;
  const x = sweep.interpolate({ inputRange: [from, from + step * 2], outputRange: [-GLINT_W, (box?.width ?? 0) + GLINT_W], extrapolate: 'clamp' });
  const id = `tag-glint-${index}`;
  return (
    <View>
      {/* 크기는 보통 글자로 잡고, 그린 뒤엔 투명하게 두어 SVG 글자만 보인다 */}
      <Text style={[s.mascotTag, box && { color: 'transparent' }]} onLayout={e => setBox(e.nativeEvent.layout)}>#{label}</Text>
      {box && (
        <Svg width={box.width} height={box.height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <ClipPath id={`${id}-clip`}>
              <SvgText x={0} y={box.height / 2 + TAG_FONT * 0.36} fontSize={TAG_FONT} fontFamily={TAG_FACE.fontFamily} fontWeight={TAG_FACE.fontWeight} letterSpacing={-0.65}>{`#${label}`}</SvgText>
            </ClipPath>
            <SvgGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={TAG_GLINT} stopOpacity={0} />
              <Stop offset="0.5" stopColor={TAG_GLINT} stopOpacity={1} />
              <Stop offset="1" stopColor={TAG_GLINT} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <G clipPath={`url(#${id}-clip)`}>
            <Rect width={box.width} height={box.height} fill={TAG_INK} />
            <AnimatedRect x={x} width={GLINT_W} height={box.height} fill={`url(#${id}-glint)`} />
          </G>
        </Svg>
      )}
    </View>
  );
}

function useTagSweep() {
  const reduced = useReducedMotion();
  const live = useScreenLive();
  const [sweep] = useState(() => new Animated.Value(0));
  // SVG 속성이라 네이티브로 못 넘겨 JS가 매 프레임 그린다 — 홈이 안 보이면 멈춘다
  useEffect(() => {
    if (reduced || !live) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1200),
      Animated.timing(sweep, { toValue: 1, duration: 2200, easing: motion.easeInOut, useNativeDriver: false }),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: false }),
      Animated.delay(2600),
    ]));
    loop.start();
    return () => { loop.stop(); sweep.setValue(0); };
  }, [reduced, live, sweep]);
  return sweep;
}

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
  // 오늘의 운세는 마스코트를 꾹 눌러 뽑은 뒤, 풀이가 다 써지면 한 번에 펼친다
  const draw = useFortuneDraw();
  const [luckOpen, setLuckOpen] = useState(false);
  const [drawn, setDrawn] = useState(false); // 방금 뽑았으면 차례로 펼친다 (이미 뽑은 날엔 바로)
  const [waitingForPolish, setWaitingForPolish] = useState(false);
  const tagSweep = useTagSweep();
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
  // 오늘의 운세(Home) 결과는 눌러도 이 화면이라 알림을 띄우지 않는다 (로그인 화면 안내에는 쓰인다)
  useEffect(() => { getFriendResult().then(f => setFriend(f && !f.seen && f.c !== 'Home' ? f : null)); }, []);
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
  const safeTop = webSafeTop(insets.top);
  // 당겨서 새로고침할 때도 위가 비지 않게 화면 위로 400 더 늘려 둔다 (디자인 높이 296 + 상태바).
  // 상단 바(상태바 + 로고 줄)까지는 단색으로 두어 Safari 상단 바와 경계가 보이지 않게 한다
  // Figma 좌표에는 상태바 44px이 포함되어 있다. 실제 safe area로 치환한다.
  const skyH = (isDark ? 296 : 252) + safeTop;
  const skyHold = safeTop + (isDark ? 56 : 0);
  // 웹: 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다
  const onScrollTopBar = useWebTopBar([
    [0, gradients.sky[0]], [skyHold, gradients.sky[0]], [skyH * 0.48, gradients.sky[1]], [skyH * 0.88, gradients.sky[2]],
  ]);
  // 뒤에 깐 하늘색은 맨 위에서 당길 때만 둔다. 빠르게 스크롤하면 Safari가 내용을 늦게 그려 빈 자리로 하늘색 띠가 비친다
  const [atTop, setAtTop] = useState(true);
  const onScroll = (y: number) => {
    onScrollTopBar(y);
    setAtTop(y <= 0);
  };
  const top = (
    <View style={[s.topBar, { marginTop: safeTop }]}>
      <Logo height={55} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, marginLeft: 12 }}>
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
          <HomeOutlineIcon name="download" size={24} color={isDark ? colors.ink : '#000000'} />
        </PressableScale>
      </View>
    </View>
  );
  const sky = (
    <View pointerEvents="none" style={[s.skyBackdrop, { height: 404 + safeTop }]}>
      {!isDark && (
        <Image
          source={require('../../assets/figma/home/clouds.png')}
          contentFit="fill"
          accessible={false}
          style={[s.clouds, { top: safeTop - 22 }]}
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={isDark ? [gradients.sky[0], ...gradients.sky] : ['#15ABFE', '#15ABFE', 'rgba(200,235,255,0.55)', 'rgba(255,255,255,0)']}
        locations={[0, (400 + skyHold) / (400 + skyH), (400 + (isDark ? skyH * 0.48 : safeTop - 44 + 296 * 0.47596)) / (400 + skyH), (400 + (isDark ? skyH * 0.88 : safeTop - 44 + 296 * 0.88262)) / (400 + skyH)]}
        style={[s.sky, { height: 400 + skyH }]}
      />
      {!isDark && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', '#FFFFFF']}
          locations={[0.11738, 0.52404, 1]}
          style={[s.cloudFade, { top: 282 + safeTop }]}
        />
      )}
    </View>
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
  const tags = mascotTags([a.saju.tags, a.thai.tags, a.mbti.tags, a.tarot?.tags ?? []]);

  // 오늘의 무료 콘텐츠 — 뽑은 뒤에만 결과 한 줄을 보여준다
  type Free = { k: string; art?: ArtName; big?: string; title: string; sub: string; sealed?: boolean; isNew?: boolean; go(): void };
  const FREE = ([
    { k: 'tal', art: 'talisman', title: '오늘의 부적', sub: tal?.keyword ?? '…', go: () => nav.navigate('Talisman') },
    { k: 'mbti', art: 'mbti', big: opened.mbti.opened ? match?.type ?? 'MBTI' : 'MBTI', title: '찰떡 MBTI', sub: '잘맞는 유형은?', go: () => nav.navigate('MbtiMatch') },
    { k: 'char', art: 'tiger', title: '사주 캐릭터', sub: '나의 캐릭터는?', go: () => nav.navigate('Character') },
    { k: 'past', art: 'pastLife', title: '전생테스트', sub: '나의 전생은?', go: () => nav.navigate('PastLife') },
    { k: 'inv', art: 'friends', title: '친구 궁합 초대', sub: '링크로 보내기', go: sendInvite },
  ] as Free[]).map((x): Free => {
    const o = opened[x.k as keyof typeof opened];
    if (!o) return x;
    if (!o.ready) return { ...x, sub: '…' };
    // 부적은 날마다 새로 뽑아서 'NEW'
    return o.opened ? x : { ...x, sealed: true, isNew: x.k === 'tal', sub: x.k === 'tal' ? '오늘 부적 받기' : x.k === 'mbti' ? '잘맞는 유형은?' : '눌러서 뽑기' };
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
      {atTop ? <View pointerEvents="none" style={[s.overscrollTop, { backgroundColor: gradients.sky[0] }]} /> : null}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, backgroundColor: colors.cream }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
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
              <HomeOutlineIcon name="chevronRight" size={18} color={colors.inkMute} />
            </PressableScale>
          ) : null}

          {friend ? (
            <PressableScale onPress={() => { markFriendSeen(); setFriend(null); openFriendRoute(nav, friend.c); }} style={[s.notice, { marginTop: arrived.length ? 8 : 16 }]} scaleTo={0.98} accessibilityLabel={`${friend.n}님이 보낸 결과 보기`}>
              <Mascot size={30} />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeTitle} numberOfLines={1}>{friend.n}님의 &apos;{friend.k}&apos; 결과가 도착했어요</Text>
                <Text style={txt.small} numberOfLines={1}>{friend.h} · 나도 해보고 비교하기</Text>
              </View>
              <HomeOutlineIcon name="chevronRight" size={18} color={colors.inkMute} />
            </PressableScale>
          ) : null}

          {/* 오늘의 점수 말풍선 + 마스코트 — 뽑기 전엔 '?'와 안내, 저장값을 읽기 전엔 비워 둔다 */}
          <View style={!draw.ready && { opacity: 0 }}>
          <Reveal delay={90}>
            <PressableScale onPress={() => nav.navigate('CombinedAnalysis')} disabled={hidden} style={s.bubbleWrap} scaleTo={0.98} accessibilityLabel={sealed ? '오늘의 운세가 도착했어요. 아래 마스코트를 꾹 눌러 뽑아 보세요' : reading ? '오늘의 운세를 풀어보는 중이에요' : `오늘의 종합운 ${f.totalScore}점.${scoreDeltaLabel(f.totalScore, yesterday?.totalScore)} ${f.summary} 종합 풀이 보기`}>
              <Animated.View style={[s.bubble, isDark && shadow.hero, { transform: [{ scale: pop }] }]}>
                {!isDark && <Image source={require('../../assets/figma/home/score-bubble.svg')} style={s.bubbleArt} contentFit="fill" accessible={false} />}
                {hidden ? <Text style={[s.bubbleScore, { color: colors.accent }]}>?</Text>
                  : drawn ? <AnimatedNumber value={count} style={s.bubbleScore} />
                  : <Text style={s.bubbleScore}>{f.totalScore}</Text>}
                {sealed ? <Text style={s.bubbleText} numberOfLines={3}>{'오늘의 운세가 도착했어요.\n저를 꾹 눌러 뽑아 보세요!'}</Text>
                  : reading ? <ReadingSteps style={s.bubbleText} />
                  : (
                    <View style={s.bubbleBody}>
                      <Text style={[s.bubbleText, { flex: 0 }]} numberOfLines={3}>{f.summary}</Text>
                      <ScoreDeltaText now={f.totalScore} before={yesterday?.totalScore} style={[s.bubbleDelta, !isDark && { color: f.totalScore > (yesterday?.totalScore ?? f.totalScore) ? '#DD2828' : '#3D79D4' }]} />
                    </View>
                  )}
              </Animated.View>
              {isDark && <View style={s.tail} />}
            </PressableScale>
            <DrawMascot sealed={sealed} busy={reading} onDrawn={onDrawn} onPolishComplete={completePolish} pose={mascotOverride?.pose} scores={hidden ? undefined : f} />
            {!hidden && later(300, (
              <View style={s.mascotTags} accessibilityLabel={`오늘의 키워드 ${tags.join(', ')}`}>
                {tags.map((tag, i) => (
                  <View key={tag} style={s.tagChip}>
                    <GlintTag label={tag} sweep={tagSweep} index={i} count={tags.length} />
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
                    <ScoreRing score={f[c]} size={64} stroke={3} color={RING[c]} track="transparent" inner={colors.card} textColor={colors.inkSub} fontSize={24} innerSize={56} inset={0} gradientEndColor={isDark ? undefined : "#F1F1F1"} numberStyle={s.ringNumber} delay={drawn ? 450 + i * 140 : 250 + i * 80}>
                      {/* 어제 대비 칩: 숫자 밑에 작게, 링이 다 차오른 뒤 톡 */}
                      <ScoreDelta now={f[c]} before={yesterday?.[c]} delay={(drawn ? 450 + i * 140 : 250 + i * 80) + 1100} small style={s.ringDeltaWrap} textStyle={[s.ringDelta, !isDark && { color: f[c] > (yesterday?.[c] ?? f[c]) ? '#DD2828' : '#3D79D4' }]} />
                    </ScoreRing>
                  )}
                  <View style={[s.ringLabel, { transform: [{ translateX: CATEGORY_LABEL_OFFSET[c] }] }]}>
                    <HomeCategoryGlyph category={c} />
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
              <Text style={s.sealedText}>{reading ? '네 가지 관점을 엮어\n오늘의 이야기를 쓰고 있어요' : '오늘의 타로 카드와 이야기,\n행운의 컬러 · 숫자 · 시간을 뽑아요'}</Text>
            </View>
          ) : later(900, (
          <View style={s.today}>
            <View style={s.todayHead}>
              <Text style={s.todayTitle}>오늘의 운세</Text>
              <PressableScale onPress={() => nav.navigate('CombinedAnalysis')} hitSlop={10} scaleTo={0.95} style={s.todayMore} accessibilityLabel="종합 풀이 보기">
                <Text style={s.todayMoreText}>종합풀이</Text>
                <HomeOutlineIcon name="chevronRight" size={16} color={colors.inkMute} />
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
              <View style={[s.lucky, f.luckyReasons && s.luckyExpandable]}>
                <View style={[s.luck, s.luckColor]}>
                  <Text style={s.luckK}>컬러</Text>
                  <View style={[s.swatch, { backgroundColor: f.luckyColorHex }]} />
                  <Text style={[s.luckV, s.luckColorValue]} numberOfLines={1}>{f.luckyColor}</Text>
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
                  <View style={[s.luckChevron, luckOpen && s.luckChevronOpen]}>
                    <HomeOutlineIcon name="chevronDown" size={16} color={colors.inkMute} />
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
          <View style={s.freeHeader}>
            <Text style={s.freeHeading} accessibilityRole="header">무료로 즐기기</Text>
            <View style={s.freeDivider}><View style={s.freeDividerLine} /></View>
            <Text style={s.freeCaption}>{COPY.friend}</Text>
            <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} hitSlop={12} scaleTo={0.9} accessibilityLabel="콘텐츠 전체 보기" style={s.freeMore}>
              <HomeOutlineIcon name="chevronRight" size={20} color={colors.inkMute} />
            </PressableScale>
          </View>
        </View>
        <HScroll contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 12 }}>
          {FREE.map(x => (
            <PressableScale key={x.k} onPress={x.go} style={[s.freeCard, x.k === 'tal' ? s.freeTalisman : x.k === 'mbti' ? s.freeMbti : x.k === 'char' ? s.freeCharacter : x.k === 'past' ? s.freePast : s.freeInvite]} scaleTo={0.96} accessibilityLabel={x.sealed ? `${x.title}, 아직 안 뽑음` : `${x.title}, ${x.sub}`}>
              <View style={s.freeTop}>
                {/* 뽑기 전 찰떡 MBTI는 결과 대신 MBTI 카드 그림 */}
                {x.k === 'tal' || x.k === 'mbti' || x.k === 'char' || x.k === 'past' || x.k === 'inv' ? <HomeFreeArt kind={x.k} />
                  : x.art || x.sealed ? <Mascot name={x.art ?? 'mbti'} size={39} style={x.k !== 'tal' ? [s.freeInsetArt, (x.k === 'past' || x.k === 'inv') && s.freeLastArt] : undefined} /> : <Text style={s.freeBig} numberOfLines={1}>{x.big}</Text>}
              </View>
              {/* 뽑기 전 표시는 카드 오른쪽 위 — NEW는 그 아래에 */}
              {x.isNew ? <View style={s.freeNew}><Text style={s.freeNewText}>NEW</Text></View> : null}
              <Text style={[s.freeTitle, x.k === 'mbti' && s.freeTitleDark]}>{x.title}</Text>
              <Text style={[s.freeSub, x.k === 'mbti' && s.freeSubDark]} numberOfLines={1}>{x.sub}</Text>
            </PressableScale>
          ))}
        </HScroll>

        <View style={{ paddingHorizontal: SCREEN_PX }}>
          <PressableScale onPress={() => nav.navigate('Fortune')} style={[s.link, { marginTop: 32 }]} scaleTo={0.98} accessibilityLabel="기간별 운세 보기">
            <Text style={[s.linkText, s.periodLinkText]}>이번 주 · 이번 달 · 올해 운세 흐름 보기</Text>
            <HomeOutlineIcon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>

          <View style={{ marginTop: 16 }}>
            <PromoCard
              variant="figma"
              tone="lime"
              title="오늘 마음에 걸리는 일 있나요?"
              desc="털어놓으면 사주로 답하고, 이어서 더 물어볼 수 있어요"
              cta={consultFreeLeft > 0 ? `오늘 무료 상담 ${consultFreeLeft}번 남음 →` : `${consultCost} · 상담 시작하기 →`}
              coin={consultFreeLeft <= 0}
              onPress={() => nav.navigate('Tabs', { screen: 'Consult' })}
              accessibilityLabel="고민 상담하기"
            />
          </View>

          <SectionHeader variant="figma" titleStyle={{ letterSpacing: 0, width: 79 }} title="4가지 관점" caption="오늘의 운세는 이렇게 만들어졌어요" action="종합 풀이 보기" onAction={openCombined} />
          <View style={s.grid}>
            <View style={s.gridRow}>
              <AnalysisTile analysis={a.saju} onPress={() => nav.navigate('AnalysisDetail', { source: 'saju' })} />
              <AnalysisTile analysis={a.mbti} onPress={() => nav.navigate('AnalysisDetail', { source: 'mbti' })} />
            </View>
            <View style={s.gridRow}>
              <AnalysisTile analysis={a.thai} onPress={() => nav.navigate('AnalysisDetail', { source: 'thai' })} />
              {a.tarot ? <AnalysisTile analysis={a.tarot} onPress={() => nav.navigate('AnalysisDetail', { source: 'tarot' })} /> : null}
            </View>
          </View>

          <SectionHeader variant="figma" titleStyle={{ letterSpacing: 0, width: 87 }} title="더 깊이 보기" caption={COPY.deeper} />
          <PromoCard
            variant="figma"
            badgePlacement="inline"
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
            <HomeOutlineIcon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>

          <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
          <Disclaimer compact mt={17} />
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
  skyBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  clouds: { position: 'absolute', left: 0, width: '100%', height: 406 },
  cloudFade: { position: 'absolute', left: 0, right: 0, height: 122 },
  sky: { position: 'absolute', top: -400, left: 0, right: 0 },
  overscrollTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  devControls: { flexDirection: 'row', flexWrap: 'wrap', flexShrink: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  devReset: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_PX },
  hello: { ...sansW('800'), ...(Platform.OS !== 'web' && { fontFamily: 'Pretendard-ExtraBold' }), fontSize: 24, lineHeight: 29, letterSpacing: -0.96, color: colors.ink, includeFontPadding: false },
  date: { ...sansW('500'), fontSize: 14, lineHeight: 17, color: isDark ? colors.inkMute : '#999999', letterSpacing: -0.56, marginTop: 7, includeFontPadding: false },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.accent },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },

  bubbleWrap: { marginTop: 10, marginHorizontal: 19 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 24, minHeight: 82, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 24, backgroundColor: isDark ? colors.cream : 'transparent' },
  bubbleArt: { position: 'absolute', top: -5, left: -9, right: -9, bottom: -32 },
  bubbleBody: { flex: 1, gap: 4, paddingRight: 5 },
  bubbleScore: { ...sansW('700'), fontSize: 32, lineHeight: 38, minWidth: 40, textAlign: 'center', color: colors.ink, letterSpacing: -1.28, fontVariant: ['tabular-nums'], includeFontPadding: false },
  bubbleText: { ...sansW('600'), flex: 1, fontSize: 16, lineHeight: 19, color: colors.ink, letterSpacing: -0.64, includeFontPadding: false },
  bubbleDelta: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, includeFontPadding: false },
  mascotTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: -12, marginBottom: 20, paddingHorizontal: 0 },
  // Figma 키워드 칩: 흰 바탕, 10×6 패딩, 옅은 하늘색 그림자
  tagChip: {
    borderRadius: 24, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#28B2FE', shadowOpacity: isDark ? 0 : 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 4 }, elevation: isDark ? 0 : 2,
  },
  mascotTag: { ...sansW('600'), fontSize: TAG_FONT, lineHeight: 18, color: TAG_INK, letterSpacing: -0.65, includeFontPadding: false },
  tail: { position: 'absolute', left: 52, bottom: -7, width: 16, height: 16, borderRadius: 3, backgroundColor: colors.cream, transform: [{ rotate: '45deg' }] },

  ringSealed: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line },
  ringQ: { fontSize: 24, fontWeight: '700', color: colors.inkMute },
  todaySealed: { alignItems: 'center', paddingTop: 22, paddingBottom: 22 },
  sealedText: { fontSize: 13, lineHeight: 19, color: colors.inkMute, letterSpacing: -0.5, textAlign: 'center', marginTop: 8 },
  rings: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingLeft: 6, paddingRight: 5 },
  ringCell: { alignItems: 'center', gap: 8 },
  ringNumber: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -0.96, includeFontPadding: false },
  ringDeltaWrap: { marginTop: -2 },
  ringDelta: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, includeFontPadding: false },
  ringLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringText: { ...sansW('600'), width: 24, fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },

  today: { marginTop: 24, padding: 16, paddingBottom: 11, borderRadius: radius.lg, backgroundColor: colors.card },
  todayHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  todayTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },
  todayMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  todayMoreText: { ...sansW('500'), minWidth: 47, textAlign: 'right', fontSize: 13, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.52, includeFontPadding: false },
  todayStory: { ...sansW('400'), fontSize: 13, lineHeight: 18, color: isDark ? colors.ink : '#000000', letterSpacing: -0.65, marginTop: 8, includeFontPadding: false },
  luckyBox: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.xs, backgroundColor: colors.surface },
  lucky: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 8 },
  luckyExpandable: { paddingRight: 18 },
  luckChevron: { position: 'absolute', right: 0, top: 0 },
  luckChevronOpen: { transform: [{ rotate: '180deg' }] },
  luckWhy: { gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  luckWhyRow: { flexDirection: 'row', gap: 8 },
  luckWhyK: { width: 28, fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.5 },
  luckWhyV: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.inkSub, letterSpacing: -0.5 },
  luck: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  luckColor: { gap: 6 },
  luckColorValue: { marginLeft: -1 },
  luckK: { ...sansW('500'), fontSize: 13, lineHeight: 16, color: colors.inkMute, letterSpacing: -0.52, includeFontPadding: false },
  luckV: { ...sansW('500'), fontSize: 13, lineHeight: 16, color: colors.ink, letterSpacing: -0.52, includeFontPadding: false },
  swatch: { width: 16, height: 16, borderRadius: 8 },

  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, height: 48, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  linkText: { ...sansW('600'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, flexShrink: 1, includeFontPadding: false },

  // Figma의 AUTO 행간 텍스트는 높이 16px 고정 칸 안에 놓여 있다.
  periodLinkText: { height: 16 },

  freeCard: { width: 116, height: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  freeHeader: { marginTop: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  freeHeading: { ...sansW('600'), minWidth: 98, fontSize: 18, lineHeight: 21, letterSpacing: 0, color: isDark ? colors.ink : '#000000', includeFontPadding: false },
  freeDivider: { width: 0, height: 14 },
  freeDividerLine: { position: 'absolute', left: -0.5, width: 1, height: 14, backgroundColor: '#999999' },
  freeCaption: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, flexShrink: 1, includeFontPadding: false },
  freeMore: { marginLeft: 'auto' },
  freeTalisman: { backgroundImage: isDark ? undefined : 'linear-gradient(221.36886913927867deg, #FFD277 33.96%, #FDFCF5 62.549%, #FFE399 95.265%)' },
  freeMbti: { backgroundColor: '#1D212D' },
  freeCharacter: { backgroundColor: isDark ? colors.card : '#DFE9FF' },
  freePast: { backgroundColor: isDark ? colors.card : '#F2EEFB' },
  freeInvite: { backgroundColor: isDark ? colors.card : '#F0F6FF' },
  freeTop: { height: 39, marginBottom: 8, justifyContent: 'center' },
  freeInsetArt: { marginLeft: -3 },
  freeLastArt: { transform: [{ translateY: -1 }] },
  freeBig: { ...sansW('700'), fontSize: 24, color: '#FFFFFF', letterSpacing: -0.5 },
  freeNew: { position: 'absolute', top: 16, right: 12, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, backgroundColor: colors.seal },
  freeNewText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  freeTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },
  freeTitleDark: { color: '#FFFFFF' },
  freeSub: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: isDark ? colors.inkSub : '#555555', letterSpacing: -0.65, marginTop: 4, includeFontPadding: false },
  freeSubDark: { color: '#999999' },

  grid: { gap: 16, marginRight: -1 },
  gridRow: { flexDirection: 'row', gap: 20 },
  tomorrow: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: '#838383', textAlign: 'center', marginTop: 26, letterSpacing: -0.56, includeFontPadding: false },
});
