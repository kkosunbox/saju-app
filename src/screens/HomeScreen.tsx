import React, { useEffect, useId, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { ClipPath, Defs, G, LinearGradient as SvgGradient, Rect, RectProps, Stop, Text as SvgText } from 'react-native-svg';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
import Reveal from '../components/Reveal';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import BusinessFooter from '../components/BusinessFooter';
import ScoreRing from '../components/ScoreRing';
import { ArtName, Logo } from '../components/Mascot';
import AnimatedNumber from '../components/AnimatedNumber';
import PromoSlot, { NEW_YEAR_ART, TrackedPromoCard } from '../components/PromoSlot';
import { isNewYearSeason, newYearOf, promosOf } from '../services/promo/promos';
import HScroll from '../components/HScroll';
import { HomeCategoryGlyph, HomeFreeArt, HomeOutlineIcon } from '../components/home/HomeDesignAssets';
import HomeMascot from '../components/home/HomeMascot';
import LifeMapCards from '../components/home/LifeMapCards';
import Icon from '../components/Icon';
import { PointPill } from '../components/HeaderPoints';
import { usePremium } from '../context/PremiumContext';
import { ITEMS } from '../services/premium/catalog';
import { useFreeContent } from '../services/server/contentApi';
import { useFortuneDraw, useOpened } from '../services/content/opened';
import FortuneProfileBadge from '../components/home/FortuneProfileBadge';
import { motion, useReducedMotion, useScreenLive } from '../utils/motion';
import { DEV_TOOLS } from '../utils/devTools';
import { CategoryKey, categoryTheme, colors, gradients, isDark } from '../theme/colors';
import { radius, sansW, SCREEN_PX, shadow } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { useWebTopBar, webSafeTop } from '../utils/webThemeColor';
import { TopBarProbe, useTopBarInsets } from '../utils/topBarRegion';
import { COPY } from '../content/copy';
import { KEYWORDS } from '../data/keywords';
import { KeywordTag } from '../types';
import { YearPreview } from '../types/premium';
import WelcomeBonusSheet from '../components/WelcomeBonusSheet';
import { usePendingInviteSheet } from '../components/PendingInviteSheet';
import { useInviteShare } from '../services/share/useInviteShare';
import ScoreDelta, { ScoreDeltaText, scoreDeltaLabel } from '../components/ScoreDelta';
import HomeNotices from './consult/HomeNotices';
import { FortuneSpouseBanner } from './consult/FortuneRec';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
/** 홈 배너 버튼 — 가격 없이 */
const CHECK = '확인하러 가기 →';
const NEW_YEAR_PROMO_TOPICS = '분야별 6대 운세 · 12개월 흐름';
// Figma 각 분야 라벨 그룹의 링 중심 대비 위치(375px 프레임).
const CATEGORY_LABEL_OFFSET = { love: 0, money: 0.5, work: -0.5, relationship: 0.5 } as const;
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
  // 웹에선 SVG id가 문서 전체에서 공유된다 — 홈이 두 번 떠 있어도 겹치지 않게 인스턴스마다 다르게
  const id = `tag-glint-${useId().replace(/:/g, '')}`;
  return (
    <View>
      {/* 글자는 보통 Text로 늘 보이게 두고, SVG는 그 위에 빛줄기만 얹는다 — 클립이 빠져도 파란 네모가 드러나지 않는다 */}
      <Text style={s.mascotTag} onLayout={e => setBox(e.nativeEvent.layout)}>#{label}</Text>
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

/**
 * 홈 — 오늘의 점수·분야별 링과 리포트로 가는 길.
 * 오늘의 운세 풀이는 운알이가 대화로 들려준다(/today). 마스코트·말풍선·링을 누르면 그 대화로 넘어가고,
 * 대화에서 운세를 본 뒤 홈으로 돌아오면 점수와 키워드가 열려 있다.
 */
export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, fortuneUser, fortune, today, fortuneLoading, refreshFortune, fortuneWriting } = useApp();
  const { owned } = usePremium();
  const { sendInvite, inviteShareSheet } = useInviteShare();
  const invite = usePendingInviteSheet();
  const tal = useFreeContent('talisman').data;
  const match = useFreeContent('mbti-match').data?.best[0];
  const draw = useFortuneDraw();
  const tagSweep = useTagSweep();
  const sealed = draw.ready && !draw.opened;
  const reading = draw.ready && draw.opened && fortuneWriting;
  const hidden = sealed || reading; // 점수를 가리는 동안 (아직 안 들었거나 · 운알이가 쓰는 중)
  const live = useScreenLive();

  // 대화에서 운세를 듣고 돌아오면, 홈이 보이는 순간 말풍선이 팡 뜨며 점수가 올라간다 (이미 본 날엔 바로)
  const [drawn, setDrawn] = useState(false);
  const wasHidden = useRef(hidden);
  useEffect(() => {
    if (wasHidden.current && !hidden && draw.ready) setDrawn(true);
    wasHidden.current = hidden;
  }, [hidden, draw.ready]);
  const [pop] = useState(() => new Animated.Value(1));
  const [count] = useState(() => new Animated.Value(0));
  const total = fortune?.combined.totalScore;
  const yesterday = fortune?.yesterdayScores; // 어제 대비 ▲▼
  const played = useRef(false);
  useEffect(() => {
    if (!drawn || hidden || !live || total === undefined || played.current) return;
    played.current = true;
    pop.setValue(0.8);
    count.setValue(0);
    Animated.spring(pop, { toValue: 1, speed: 12, bounciness: 12, useNativeDriver: true }).start();
    Animated.timing(count, { toValue: total, duration: 900, delay: 120, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [drawn, hidden, live, total, pop, count]);
  // 테스트용(local·dev): 오늘 들은 기록을 지워 다시 '도착' 상태로
  const resetDraw = () => {
    draw.reset();
    setDrawn(false);
    played.current = false;
  };
  const opened = {
    tal: useOpened('talisman'), mbti: useOpened('mbti-match'), char: useOpened('character'), past: useOpened('past-life'),
  };

  // 상단 바 자리: 보통은 안전 영역과 같고, 상태 표시가 모서리에 있는 화면(iPhone Duo)에서는 그 옆까지 올라가 그 쪽만 비켜 선다
  const bar = useTopBarInsets();
  const safeTop = webSafeTop(bar.top);
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
    <View style={[s.topBar, { marginTop: safeTop, paddingLeft: Math.max(SCREEN_PX, bar.left), paddingRight: Math.max(SCREEN_PX, bar.right) }]}>
      <Logo height={55} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, marginLeft: 12 }}>
        {DEV_TOOLS && draw.opened ? (
          <PressableScale onPress={resetDraw} hitSlop={4} scaleTo={0.9} style={s.devReset} accessibilityLabel="오늘의 운세 듣기 전으로 되돌리기 (테스트용)">
            <Text style={s.devResetText}>뽑기 초기화</Text>
          </PressableScale>
        ) : null}
        <PointPill attendHint />
        <PressableScale onPress={() => fortune && nav.navigate('Share')} hitSlop={8} scaleTo={0.9} accessibilityLabel="오늘의 운세 카드 공유하기" disabled={!fortune || hidden} style={hidden && { opacity: 0.35 }}>
          <Icon name="external" size={24} strokeWidth={2} color={isDark ? colors.ink : '#000000'} />
        </PressableScale>
      </View>
    </View>
  );
  const sky = (
    <View pointerEvents="none" style={[s.skyBackdrop, { height: 404 + safeTop }]}>
      {!isDark && (
        <Image
          source={require('../../assets/figma/home/clouds.webp')}
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

  if (!fortune || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
        <TopBarProbe />
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
  const promos = promosOf(nav, today);
  const newYearPromo = isNewYearSeason(today) ? promos.newyear : null;
  const newYearArt = NEW_YEAR_ART[newYearOf(today)];

  // 오늘 한 번 무료로 본 뒤 다른 프로필은 알로 연다 — 여는 건 대화 화면에서
  const drawCost = sealed ? fortune.drawCost ?? 0 : 0;
  const who = fortuneUser?.nickname ?? user.nickname;
  const askToday = () => nav.navigate('Today');
  const later = (delay: number, node: React.ReactNode) => (drawn ? <Reveal delay={delay}>{node}</Reveal> : node);
  const bubbleText = sealed
    ? drawCost > 0 ? `오늘 무료 운세는 이미 봤어요.\n${drawCost}알로 ${who}님 운세를 열어 보세요!` : '오늘의 운세가 도착했어요.\n저를 누르면 들려 드릴게요!'
    : '오늘의 이야기를 쓰고 있어요.\n잠깐만 기다려 주세요…';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBarProbe />
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
            <View style={s.helloRow}>
              {/* 제목 전체가 프로필 고르기 버튼 — 「수현님의 오늘 (⌄)」 */}
              <FortuneProfileBadge textStyle={s.hello} />
            </View>
            <Text style={s.date}>{formatKoreanDate(today)}</Text>
          </Reveal>

          {/* 내 링크로 상대가 궁합을 봤다 · 친구 결과 링크로 들어왔다 */}
          <HomeNotices />

          {/* 오늘의 점수 말풍선 + 운알이 — 아직 안 들었으면 '?'와 안내. 누르면 운알이의 오늘의 운세 대화로 */}
          <View style={!draw.ready && { opacity: 0 }}>
          <Reveal delay={90}>
            <PressableScale onPress={askToday} style={s.bubbleWrap} scaleTo={0.98} accessibilityLabel={hidden ? `${bubbleText.replace('\n', ' ')} 운알이에게 오늘의 운세 듣기` : `오늘의 종합운 ${f.totalScore}점.${scoreDeltaLabel(f.totalScore, yesterday?.totalScore)} ${f.summary} 운알이에게 자세히 듣기`}>
              <Animated.View style={[s.bubble, isDark && shadow.hero, { transform: [{ scale: pop }] }]}>
                {!isDark && <Image source={require('../../assets/figma/home/score-bubble.svg')} style={s.bubbleArt} contentFit="fill" accessible={false} />}
                {hidden ? <Text style={[s.bubbleScore, { color: colors.accent }]}>?</Text>
                  : drawn ? <AnimatedNumber value={count} style={s.bubbleScore} />
                  : <Text style={s.bubbleScore}>{f.totalScore}</Text>}
                {hidden ? <Text style={s.bubbleText} numberOfLines={3}>{bubbleText}</Text>
                  : (
                    <View style={s.bubbleBody}>
                      <Text style={[s.bubbleText, { flex: 0 }]} numberOfLines={3}>{f.summary}</Text>
                      <ScoreDeltaText now={f.totalScore} before={yesterday?.totalScore} style={[s.bubbleDelta, !isDark && { color: f.totalScore > (yesterday?.totalScore ?? f.totalScore) ? '#DD2828' : '#3D79D4' }]} />
                    </View>
                  )}
              </Animated.View>
              {isDark && <View style={s.tail} />}
            </PressableScale>
            <HomeMascot
              sealed={hidden}
              hint={sealed ? (drawCost > 0 ? `${drawCost}알로 열기` : '눌러서 오늘의 운세 듣기') : reading ? '운알이가 쓰는 중…' : undefined}
              scores={hidden ? undefined : f}
              onPress={askToday}
            />
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

          {/* 분야별 점수 — 아직 안 들었으면 '?' (누르면 대화로) */}
          <View style={s.rings}>
            {CATS.map((c, i) => {
              const t = categoryTheme[c];
              return (
                <PressableScale key={c} onPress={() => (hidden ? askToday() : nav.navigate('CategoryDetail', { category: c }))} style={s.ringCell} scaleTo={0.94} accessibilityLabel={hidden ? `${t.label}, 아직 안 나옴. 운알이에게 오늘의 운세 듣기` : `${t.label} ${f[c]}점${scoreDeltaLabel(f[c], yesterday?.[c])}`}>
                  {hidden ? (
                    <View style={s.ringSealed}><Text style={s.ringQ}>?</Text></View>
                  ) : (
                    <ScoreRing score={f[c]} size={64} stroke={3} color={RING[c]} track="transparent" inner={colors.card} textColor={colors.inkSub} fontSize={24} innerSize={56} inset={0} gradientEndColor={isDark ? undefined : '#F1F1F1'} numberStyle={s.ringNumber} delay={drawn ? 450 + i * 140 : 250 + i * 80}>
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
          </View>

          {hidden ? null : later(600, (
            <View style={{ marginTop: 32 }}>
              <ActionTabs good={f.goodActions} avoid={f.avoidActions} />
            </View>
          ))}

          {/* 이번 주 · 이번 달 · 올해 흐름 */}
          <PressableScale onPress={() => nav.navigate('Fortune')} style={[s.link, { marginTop: 32 }]} scaleTo={0.98} accessibilityLabel="기간별 운세 보기">
            <Text style={[s.linkText, s.periodLinkText]}>이번 주 · 이번 달 · 올해 운세 흐름 보기</Text>
            <HomeOutlineIcon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>

          {/* 나의 인생 지도 — 신년운세 · 평생운 · 상세 사주 */}
          <SectionHeader variant="figma" titleStyle={{ letterSpacing: 0 }} title="나의 인생 지도" caption="타고난 사주로 그려 보는 내 삶의 큰 그림" />
          <View style={{ marginBottom: 16 }}>
            {newYearPromo ? (
              // 11월 ~ 1월: 다음 해(1월은 올해) 신년운세 — 해가 적힌 그림
              <PromoSlot
                screen="home"
                promo={{
                  ...newYearPromo,
                  title: newYearPromo.title.replace('신년운세', '신년 운세').replace('미리 보기', '미리보기'),
                  desc: `사자성어 · ${NEW_YEAR_PROMO_TOPICS}`,
                  teaser: data => {
                    const idiom = (data as YearPreview).idiom?.[0];
                    return idiom ? `「${idiom}」 · ${NEW_YEAR_PROMO_TOPICS}` : null;
                  },
                }}
                tone={newYearArt ? 'gold' : 'sky'}
                variant="home"
                base={newYearArt}
                teaser
                cta={CHECK}
              />
            ) : <PromoSlot screen="home" promo={promos.newyear} teaser cta={CHECK} />}
          </View>
          <LifeMapCards noPrice />

          <View style={s.freeHeader}>
            <Text style={s.freeHeading} accessibilityRole="header">무료로 즐기기</Text>
            <View style={s.freeDivider}><View style={s.freeDividerLine} /></View>
            <Text style={s.freeCaption} numberOfLines={1}>매일 새로 뽑는 소소한 재미</Text>
            <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} hitSlop={12} scaleTo={0.9} accessibilityLabel="콘텐츠 전체 보기" style={s.freeMore}>
              <HomeOutlineIcon name="chevronRight" size={20} color={colors.inkMute} />
            </PressableScale>
          </View>
        </View>
        <HScroll contentContainerStyle={{ paddingHorizontal: SCREEN_PX, gap: 12 }}>
          {FREE.map(x => (
            <PressableScale key={x.k} onPress={x.go} style={[s.freeCard, x.k === 'tal' ? s.freeTalisman : x.k === 'mbti' ? s.freeMbti : x.k === 'char' ? s.freeCharacter : x.k === 'past' ? s.freePast : s.freeInvite]} scaleTo={0.96} accessibilityLabel={x.sealed ? `${x.title}, 아직 안 뽑음` : `${x.title}, ${x.sub}`}>
              <View style={s.freeTop}>
                <HomeFreeArt kind={x.k as 'tal' | 'mbti' | 'char' | 'past' | 'inv'} />
              </View>
              {/* 뽑기 전 표시는 카드 오른쪽 위 — NEW는 그 아래에 */}
              {x.isNew ? <View style={s.freeNew}><Text style={s.freeNewText}>NEW</Text></View> : null}
              <Text style={[s.freeTitle, x.k === 'mbti' && s.freeTitleDark]}>{x.title}</Text>
              <Text style={[s.freeSub, x.k === 'mbti' && s.freeSubDark]} numberOfLines={1}>{x.sub}</Text>
            </PressableScale>
          ))}
        </HScroll>

        <View style={{ paddingHorizontal: SCREEN_PX }}>
          {/* 운알톡 — 무료로 즐기기 바로 아래 */}
          <View style={{ marginTop: 32 }}>
            <TrackedPromoCard
              screen="home" item="consult"
              variant="figma"
              tone="lime"
              title="마음의 소리, 운알이에게 들려줄래요?"
              desc="나의 사주를 기억하는 운알이와의 비밀 대화"
              cta="운알이와 대화하러 가기 →"
              onPress={() => nav.navigate('Consult')}
              accessibilityLabel="운알이와 대화하러 가기"
            />
          </View>

          {/* 테마 운세 — 미래 배우자 · 직업 · 반려동물 */}
          {/* 무료로 즐기기와 같은 머리 — 오른쪽 화살표는 콘텐츠 탭으로 */}
          <View style={s.freeHeader}>
            <Text style={s.freeHeading} accessibilityRole="header">골라 보는 테마 운세</Text>
            <View style={s.freeDivider}><View style={s.freeDividerLine} /></View>
            <Text style={s.freeCaption} numberOfLines={1}>궁금한 것만 골라 깊이</Text>
            <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} hitSlop={12} scaleTo={0.9} accessibilityLabel="콘텐츠 전체 보기" style={s.freeMore}>
              <HomeOutlineIcon name="chevronRight" size={20} color={colors.inkMute} />
            </PressableScale>
          </View>
          <View style={{ gap: 16 }}>
            {spouseOwned ? <PromoSlot screen="home" promo={promos.spouse} /> : <FortuneSpouseBanner promo={promos.spouse} screen="home" cta={CHECK} />}
            <PromoSlot screen="home" promo={promos['theme-career']} teaser cta={CHECK} />
            <TrackedPromoCard
              screen="home" item="pet"
              tone="lime" variant="recommendation" title="반려동물 궁합" desc="댕냥이와 나는 어떤 사이? 성격부터 함께 놀기 좋은 날까지"
              cta={CHECK} base={require('../../assets/figma/content/promo-pet-base.webp')}
              onPress={() => nav.navigate('Pet')}
            />
          </View>
          <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Content' })} style={s.link} scaleTo={0.98} accessibilityLabel="콘텐츠 전체 보기">
            <Text style={s.linkText}>궁합 · 우리 아이 사주 · 길일 · 콘텐츠 전체 보기</Text>
            <HomeOutlineIcon name="chevronRight" size={16} color={colors.inkMute} />
          </PressableScale>

          <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
          <Disclaimer compact mt={17} />
          <BusinessFooter style={{ marginTop: 28 }} />
        </View>
      </ScrollView>
      {invite.sheet}
      {inviteShareSheet}
      <WelcomeBonusSheet hidden={invite.visible} />
    </View>
  );
}

const s = StyleSheet.create({
  skyBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  clouds: { position: 'absolute', left: 0, width: '100%', height: 406 },
  cloudFade: { position: 'absolute', left: 0, right: 0, height: 122 },
  sky: { position: 'absolute', top: -400, left: 0, right: 0 },
  overscrollTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  devReset: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  topBar: { zIndex: 1, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SCREEN_PX },
  helloRow: { flexDirection: 'row', alignItems: 'center' },
  hello: { ...sansW('800'), ...(Platform.OS !== 'web' && { fontFamily: 'Pretendard-ExtraBold' }), fontSize: 24, lineHeight: 29, letterSpacing: -0.96, color: colors.ink, includeFontPadding: false },
  date: { ...sansW('500'), fontSize: 14, lineHeight: 17, color: isDark ? colors.inkMute : '#999999', letterSpacing: -0.56, marginTop: 7, includeFontPadding: false },

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
  rings: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingLeft: 6, paddingRight: 5 },
  ringCell: { alignItems: 'center', gap: 8 },
  ringNumber: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -0.96, includeFontPadding: false },
  ringDeltaWrap: { marginTop: -2 },
  ringDelta: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, includeFontPadding: false },
  ringLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringText: { ...sansW('600'), width: 24, fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },


  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, height: 48, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  linkText: { ...sansW('600'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, flexShrink: 1, includeFontPadding: false },

  // Figma의 AUTO 행간 텍스트는 높이 16px 고정 칸 안에 놓여 있다.
  periodLinkText: { height: 16 },

  freeCard: { width: 116, height: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  freeHeader: { marginTop: 32, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  freeNew: { position: 'absolute', top: 16, right: 12, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, backgroundColor: colors.seal },
  freeNewText: { fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  freeTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: colors.ink, letterSpacing: -0.56, includeFontPadding: false },
  freeTitleDark: { color: '#FFFFFF' },
  freeSub: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: isDark ? colors.inkSub : '#555555', letterSpacing: -0.65, marginTop: 4, includeFontPadding: false },
  freeSubDark: { color: '#999999' },

  tomorrow: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: '#838383', textAlign: 'center', marginTop: 26, letterSpacing: -0.56, includeFontPadding: false },
});
