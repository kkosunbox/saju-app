import React, { useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { NativeStackNavigationProp, useNavigation } from '@/navigation/compat';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import PressableScale from '../components/PressableScale';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import BusinessFooter from '../components/BusinessFooter';
import FadeCarousel from '../components/FadeCarousel';
import { ART, Logo } from '../components/Mascot';
import { usePromoTrack } from '../components/PromoSlot';
import { CostPill, LineTag } from '../components/premium/Kit';
import { PointPill } from '../components/HeaderPoints';
import LifeMapCards from '../components/home/LifeMapCards';
import { ITEMS } from '../services/premium/catalog';
import { newYearOf, promosOf } from '../services/promo/promos';
import { useFortuneDraw } from '../services/content/opened';
import { DEV_TOOLS } from '../utils/devTools';
import { colors, gradients, isDark } from '../theme/colors';
import { radius, sansW, SCREEN_PX } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';
import { mixColor, useWebTopBar, webSafeTop } from '../utils/webThemeColor';
import { TopBarProbe, useTopBarInsets } from '../utils/topBarRegion';
import { COPY } from '../content/copy';
import WelcomeBonusSheet from '../components/WelcomeBonusSheet';
import { usePendingInviteSheet } from '../components/PendingInviteSheet';
import HomeNotices from './consult/HomeNotices';
import { DAY_STEM_TITLE } from '../content/dayStem';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Figma 375 프레임: 상태바 44 + 로고 줄 56 아래에서 배너 글이 시작하고, 다음 섹션 제목은 상태바 아래 225에서 시작한다 */
const BAR_H = 56;
const BANNER_H = 225;
/** 배너 바탕 그라데이션이 퍼지는 높이 (Figma 296 - 상태바 44) */
const SKY_H = 252;
const CARD = isDark ? colors.card : '#F6F6F6';
const TITLE_INK = isDark ? colors.ink : '#000000';
const NAVY = '#1D212D';
/** 고민상담 버튼에서 강조하는 말의 글자색 (Figma #28B2FE) */
const LEAD_INK = '#28B2FE';

interface Slide {
  key: string;
  /** 하늘 그라데이션 맨 위 · 가운데(48%) 색 */
  sky: [string, string];
  /** 둘째 줄 — [강조 글자, 강조 색, 나머지] */
  line: [string, string, string];
  cta: string;
  /** 알 아이콘과 글자 사이 (Figma: 오늘의 운세 2, 나머지 4) */
  ctaGap?: number;
  art: number;
  /** Figma 그림 크기와 오른쪽 · 위(상태바 아래) 위치 */
  artBox: { width: number; height: number; right: number; top: number };
  /** 캐릭터 발밑 그림자 — 그림 상자 안 가운데 x · 위 y · 폭, 그리고 바탕 하늘에 맞춘 색 */
  shadow: { cx: number; y: number; width: number; color: string };
  go(): void;
}

/**
 * 홈 — 위는 넘기는 배너(오늘의 운세 · 궁합 · 신년운세), 아래는 인기 · 깊이 보는 · 많이 보는 콘텐츠.
 * 오늘의 운세 풀이는 운알이가 대화로 들려준다(/today) — 첫 배너가 그리로 간다.
 */
export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { user, fortuneUser, today, fortuneLoading, refreshFortune } = useApp();
  const invite = usePendingInviteSheet();
  const draw = useFortuneDraw();
  const promos = promosOf(nav, today);
  const goSpouse = usePromoTrack('home', 'spouse', promos.spouse.go);
  const goConsult = usePromoTrack('home', 'consult', () => nav.navigate('Consult'));
  const goDayStem = usePromoTrack('home', 'day-stem', () => nav.navigate('DayStem'));

  const slides: Slide[] = [
    {
      key: 'today', sky: ['#15ABFE', 'rgba(200,235,255,0.55)'], line: ['오늘의 운세', '#008EDE', '가 도착했어요 ✨'], cta: '오늘의 운세 보기 →', ctaGap: 2,
      art: require('../../assets/figma/home/banner-today.webp'), artBox: { width: 101, height: 101, right: 27, top: 66 }, shadow: { cx: 52, y: 87.5, width: 72, color: '#0B5E9A' },
      go: () => nav.navigate('Today'),
    },
    {
      key: 'match', sky: ['#FFB1CF', 'rgba(255,243,250,0.55)'], line: ['그 사람과 나, ', '#F62D7D', '잘 맞을까요?'], cta: '우리 궁합 확인하기 →',
      art: require('../../assets/figma/home/banner-match.webp'), artBox: { width: 126, height: 115, right: 18, top: 59 }, shadow: { cx: 67, y: 100, width: 70, color: '#B0306A' },
      go: () => nav.navigate('Tabs', { screen: 'Compatibility' }),
    },
    {
      key: 'newyear', sky: ['#A3A9FF', '#F3F5F7'], line: [`${newYearOf(today)}년 운세`, '#0092E5', '를 확인하세요!'], cta: '신년운세 확인하기 →',
      art: require('../../assets/figma/home/banner-newyear.webp'), artBox: { width: 123, height: 113, right: 12, top: 63 }, shadow: { cx: 63.5, y: 94, width: 78, color: '#4A4FA8' },
      go: promos.newyear.go,
    },
  ];
  const [slide, setSlide] = useState(0);
  const sky0 = isDark ? gradients.sky[0] : slides[slide].sky[0];

  // 상단 바 자리: 보통은 안전 영역과 같고, 상태 표시가 모서리에 있는 화면(iPhone Duo)에서는 그 옆까지 올라가 그 쪽만 비켜 선다
  const bar = useTopBarInsets();
  const safeTop = webSafeTop(bar.top);
  // 웹: 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다.
  // 배너가 바뀌는 동안에도 매 프레임 두 장의 색을 바뀐 만큼 섞어, 상태바가 배너와 함께 서서히 바뀌게 한다
  const blendAt = useRef<[number, number, number]>([0, 0, 1]);
  const skyAt = (k: 0 | 1) => {
    if (isDark) return gradients.sky[k];
    const [from, to, t] = blendAt.current;
    return mixColor(slides[from].sky[k], slides[to].sky[k], t);
  };
  const onScrollTopBar = useWebTopBar(() => {
    const c0 = skyAt(0);
    return [[0, c0], [safeTop, c0], [safeTop + SKY_H * 0.48, skyAt(1)], [safeTop + SKY_H * 0.88, colors.cream]];
  });
  const onSlideBlend = (from: number, to: number, t: number) => {
    blendAt.current = [from, to, t];
    onScrollTopBar();
  };
  // 뒤에 깐 하늘색은 맨 위에서 당길 때만 둔다. 빠르게 스크롤하면 Safari가 내용을 늦게 그려 빈 자리로 하늘색 띠가 비친다
  const [atTop, setAtTop] = useState(true);
  const onScroll = (y: number) => {
    onScrollTopBar(y);
    setAtTop(y <= 0);
  };

  const top = (
    <View style={[s.topBar, { top: safeTop, paddingLeft: Math.max(SCREEN_PX, bar.left), paddingRight: Math.max(SCREEN_PX, bar.right) }]} pointerEvents="box-none">
      <Logo height={55} />
      <View style={s.topRight} pointerEvents="box-none">
        {DEV_TOOLS && draw.opened ? (
          <PressableScale onPress={draw.reset} hitSlop={4} scaleTo={0.9} style={s.devReset} accessibilityLabel="오늘의 운세 듣기 전으로 되돌리기 (테스트용)">
            <Text style={s.devResetText}>뽑기 초기화</Text>
          </PressableScale>
        ) : null}
        <PointPill attendHint bubbleAlign="right" />
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
        <TopBarProbe />
        <View style={{ height: safeTop + BAR_H }} />
        {top}
        <HomeSkeleton />
      </View>
    );
  }
  const who = fortuneUser?.nickname ?? user.nickname;

  const renderSlide = (b: Slide, onPress: () => void) => (
    <PressableScale onPress={onPress} scaleTo={1} style={[s.slide, { height: safeTop + BANNER_H, paddingTop: safeTop + BAR_H }]} accessibilityLabel={`${who}님 ${b.line[0]}${b.line[2]} ${b.cta.replace(' →', '')}`}>
      <ArtShadow b={b} top={safeTop} />
      <Image source={b.art} style={[s.art, { ...b.artBox, top: safeTop + b.artBox.top }]} contentFit="contain" accessible={false} draggable={false} />
      <Text style={s.hello} numberOfLines={2}>
        {`${who}님\n`}
        <Text style={{ color: b.line[1] }}>{b.line[0]}</Text>
        {b.line[2]}
      </Text>
      <Text style={s.date}>{formatKoreanDate(today)}</Text>
      <View style={[s.bannerCta, b.ctaGap != null && { gap: b.ctaGap }]}>
        <Image source={ART.mascot} style={s.coin} contentFit="contain" accessible={false} />
        <Text style={s.bannerCtaText}>{b.cta}</Text>
      </View>
    </PressableScale>
  );

  // 장마다 다른 하늘 — 구름 그림은 모든 장이 같아 배너 뒤에 한 번만 깐다
  const renderBackdrop = (b: Slide) => (
    <>
      <LinearGradient
        colors={isDark ? [...gradients.sky] : [b.sky[0], b.sky[0], b.sky[1], 'rgba(255,255,255,0)']}
        locations={isDark ? [0, 0.48, 0.88] : [0, safeTop / (safeTop + SKY_H), (safeTop + SKY_H * 0.48) / (safeTop + SKY_H), (safeTop + SKY_H * 0.88) / (safeTop + SKY_H)]}
        style={[s.skyGradient, { height: safeTop + SKY_H }]}
      />
      {/* 배너 아래 끝은 바탕색으로 녹여 다음 섹션과 이어지게 (Figma 구름 위 흰 띠) */}
      {!isDark && <LinearGradient colors={['rgba(255,255,255,0)', colors.cream]} style={s.bannerFade} />}
    </>
  );

  const CATEGORIES = [
    { k: 'newyear', label: '신년운세', img: require('../../assets/figma/home/cat-newyear.webp'), box: { width: 47, height: 37, left: 12, top: 16 }, go: promos.newyear.go },
    { k: 'love', label: '연애 · 결혼운', img: require('../../assets/figma/home/cat-love.webp'), box: { width: 44, height: 35, left: 13, top: 18 }, go: promos['theme-love'].go },
    { k: 'money', label: '재물운', img: require('../../assets/figma/home/cat-money.webp'), box: { width: 45, height: 37, left: 12, top: 16 }, go: promos['theme-money'].go },
    { k: 'career', label: '직업 · 적성운', img: require('../../assets/figma/home/cat-career.webp'), box: { width: 44, height: 38, left: 13, top: 16 }, go: promos['theme-career'].go },
  ];
  const TRENDING: { k: string; title: string; sub: string; cost?: number; img: number; box: { width: number; height: number; left: number; top: number }; go(): void }[] = [
    { k: 'tarot', title: '오늘의 타로', sub: '오늘 나에게 온 카드 한 장', img: require('../../assets/figma/home/row-tarot.webp'), box: { width: 25, height: 22, left: 6, top: 8 }, go: () => nav.navigate('AnalysisDetail', { source: 'tarot' }) },
    { k: 'pet', title: '반려동물 궁합', sub: '댕냥이와 나의 궁합은?', cost: ITEMS.pet(0, '').cost, img: require('../../assets/figma/home/row-pet.webp'), box: { width: 35, height: 34, left: 1, top: 2 }, go: () => nav.navigate('Pet') },
    { k: 'child', title: '우리 아이 사주', sub: '어떤 사람으로 자랄까?', cost: ITEMS.child(0, '').cost, img: require('../../assets/figma/home/row-child.webp'), box: { width: 33, height: 29, left: 3, top: 4 }, go: () => nav.navigate('Child') },
    { k: 'match', title: '궁합', sub: '그사람과 나 잘 맞을까?', cost: ITEMS.compat(0, '').cost, img: require('../../assets/figma/home/row-match.webp'), box: { width: 35, height: 21, left: 1, top: 8 }, go: () => nav.navigate('Tabs', { screen: 'Compatibility' }) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <TopBarProbe />
      {/* 웹(아이폰 Safari)은 스크롤 영역 위로 삐져나간 하늘을 잘라 버려서, 당기면 뒤가 보인다.
          뒤쪽 위 절반을 하늘색으로 깔고 내용은 흰 바탕으로 덮어, 위로 당기면 하늘색·아래로 당기면 흰색이 보이게 한다 */}
      {atTop ? <View pointerEvents="none" style={[s.overscrollTop, { backgroundColor: sky0 }]} /> : null}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, backgroundColor: colors.cream }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
        refreshControl={<RefreshControl refreshing={fortuneLoading} onRefresh={() => refreshFortune()} tintColor={colors.white} />}
      >
        {/* 당겨서 새로고침할 때도 위가 비지 않게 지금 배너의 맨 위 색을 위로 늘려 둔다 */}
        <View pointerEvents="none" style={[s.skyAbove, { backgroundColor: sky0 }]} />
        {!isDark && (
          <View pointerEvents="none" style={[s.cloudsWrap, { height: safeTop + BANNER_H }]}>
            <Image source={require('../../assets/figma/home/clouds.webp')} contentFit="fill" accessible={false} style={[s.clouds, { top: safeTop - 22 }]} />
          </View>
        )}
        <FadeCarousel
          items={slides}
          keyOf={b => b.key}
          labelOf={b => b.line[0] + b.line[2]}
          onPressItem={b => b.go()}
          onIndexChange={setSlide}
          onBlend={onSlideBlend}
          renderSlide={renderSlide}
          renderBackdrop={renderBackdrop}
          style={{ height: safeTop + BANNER_H }}
          dotsStyle={[s.dots, { top: safeTop + 188 }]}
          dotTargetStyle={s.dotTarget}
          dotStyle={s.dot}
          dotOnStyle={s.dotOn}
        />
        {top}

        <View style={{ paddingHorizontal: SCREEN_PX }}>
          {/* 내 링크로 상대가 궁합을 봤다 · 친구 결과 링크로 들어왔다 */}
          <HomeNotices style={{ marginTop: 0, marginBottom: 24 }} />

          <Text style={s.section} accessibilityRole="header">운픽에서 가장 인기있는 🔥</Text>
          <BigCard
            bg={require('../../assets/figma/home/popular-spouse.webp')}
            edge={require('../../assets/figma/home/popular-spouse-edge.webp')}
            title="미래 배우자 리포트" desc="나의 미래 배우자가 궁금하다면?"
            cta="바로 확인하기 →"
            onPress={goSpouse}
          />
          <BigCard
            bg={require('../../assets/figma/home/popular-mbti.webp')}
            edge={require('../../assets/figma/home/popular-mbti-edge.webp')}
            title={DAY_STEM_TITLE} desc="내 MBTI에 사주를 더하면?"
            cta="바로 확인하기 →"
            onPress={goDayStem}
            style={{ marginTop: 16 }}
          />

          <Text style={[s.section, { marginTop: 32 }]} accessibilityRole="header">나를 더 깊이 아는 운픽 콘텐츠</Text>
          <LifeMapCards home />
          <View style={s.cats}>
            {CATEGORIES.map(c => (
              <PressableScale key={c.k} onPress={c.go} style={s.cat} scaleTo={0.94} accessibilityLabel={c.label}>
                <View style={s.catTile}>
                  {/* 그림은 디자인 크기 그대로, 70 타일 안 위치를 가운데 기준으로 옮겨 둔다 */}
                  <Image source={c.img} style={[s.abs, { top: c.box.top, width: c.box.width, height: c.box.height, left: '50%', marginLeft: c.box.left - 35 }]} contentFit="contain" accessible={false} />
                </View>
                <Text style={s.catText} numberOfLines={1}>{c.label}</Text>
              </PressableScale>
            ))}
          </View>

          <Text style={[s.section, { marginTop: 32 }]} accessibilityRole="header">지금 가장 많이 보는 👀</Text>
          <BigCard
            bg={require('../../assets/figma/home/trending-consult.webp')}
            edge={require('../../assets/figma/home/trending-consult-edge.webp')}
            title="지금 어떤 고민이 있나요?" desc="운알이와의 편하게 비밀 대화해요."
            ctaLead="고민상담"
            cta=" 하러가기 →"
            onPress={goConsult}
          />
          <View style={s.rows}>
            {TRENDING.map(r => (
              <PressableScale key={r.k} onPress={r.go} style={s.row} scaleTo={0.98} accessibilityLabel={`${r.title}, ${r.sub}, ${r.cost == null ? '무료' : `${r.cost}알`}`}>
                <View style={s.rowIcon}>
                  <Image source={r.img} style={[s.abs, r.box]} contentFit="contain" accessible={false} />
                </View>
                <View style={s.rowBody}>
                  <Text style={s.rowTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{r.sub}</Text>
                </View>
                {/* 무료 칩은 Figma에서 알 알약보다 3 안쪽에 놓여 있다 */}
                {r.cost == null ? <View style={{ marginRight: 3 }}><LineTag label="무료" variant="figma" /></View> : <CostPill cost={r.cost} small variant="figma" />}
              </PressableScale>
            ))}
          </View>

          <Text style={s.tomorrow}>{COPY.tomorrow}</Text>
          <Disclaimer compact mt={17} />
          <BusinessFooter style={{ marginTop: 0 }} />
        </View>
      </ScrollView>
      {invite.sheet}
      <WelcomeBonusSheet hidden={invite.visible} />
    </View>
  );
}

/**
 * 바닥에 닿은 자리의 접지 그림자 — 좁고 얇고 진하게, 가운데를 캐릭터 아래 끝에 맞춘다.
 * 넓거나 흐리면 떠 보이고, 캐릭터보다 위에 두면 뒤로 숨어 안 보인다
 */
const SHADOW_H = 14;

/** 배너 캐릭터 발밑에 까는 타원 그림자 — 가운데가 진하고 가장자리로 사라진다 */
function ArtShadow({ b, top }: { b: Slide; top: number }) {
  const { artBox: a, shadow: sh, key } = b;
  const id = `home-art-shadow-${key}`;
  return (
    <Svg
      pointerEvents="none"
      width={sh.width} height={SHADOW_H}
      style={[s.art, { right: a.right + a.width - sh.cx - sh.width / 2, top: top + a.top + sh.y }]}
    >
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={sh.color} stopOpacity={0.75} />
          <Stop offset="0.6" stopColor={sh.color} stopOpacity={0.4} />
          <Stop offset="1" stopColor={sh.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={sh.width / 2} cy={SHADOW_H / 2} rx={sh.width / 2} ry={SHADOW_H / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Figma 327×128 그림 카드 — 제목 · 설명 · 흰 알약 버튼.
 * 화면이 넓어지면 높이 · 글 · 그림은 디자인 그대로 두고 폭만 늘린다: 그림은 원래 크기로 오른쪽에 붙이고,
 * 늘어난 왼쪽은 그림 왼쪽 가장자리(그림 없는 바탕)를 좌우로 뒤집어 이어 붙여 이음매 없이 채운다 */
function BigCard({ bg, edge, title, desc, cta, ctaLead, onPress, style }: {
  bg: number; edge: number; title: string; desc: string; cta: string;
  /** 버튼 글 앞에 파랗게 붙는 말 (예: 고민상담) */
  ctaLead?: string;
  onPress(): void; style?: object;
}) {
  return (
    <PressableScale onPress={onPress} style={[s.bigCard, style]} scaleTo={0.98} accessibilityLabel={`${title} ${desc}`}>
      <Image source={bg} style={s.bigArt} contentFit="fill" accessible={false} />
      <Image source={edge} style={s.bigEdge} contentFit="fill" accessible={false} />
      <Text style={s.bigTitle} numberOfLines={1}>{title}</Text>
      <Text style={s.bigDesc} numberOfLines={1}>{desc}</Text>
      <View style={s.pill}><Text style={s.pillText}>{ctaLead ? <Text style={{ color: LEAD_INK }}>{ctaLead}</Text> : null}{cta}</Text></View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  overscrollTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  skyAbove: { position: 'absolute', top: -400, left: 0, right: 0, height: 400 },
  devReset: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inkMute },
  devResetText: { fontSize: 11, fontWeight: '600', color: colors.inkSub },
  // 로고 줄은 넘기는 배너 위에 떠 있다 (Figma 로고 65×36 · 위 45, 알 알약 위 60)
  topBar: { position: 'absolute', left: 0, right: 0, zIndex: 1, height: BAR_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, marginLeft: 12 },

  slide: { paddingHorizontal: SCREEN_PX },
  cloudsWrap: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  clouds: { position: 'absolute', left: 0, width: '100%', height: 406 },
  skyGradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  art: { position: 'absolute' },
  bannerFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 },
  hello: { ...sansW('700'), fontSize: 20, lineHeight: 32, letterSpacing: -0.8, color: isDark ? colors.ink : '#222222', includeFontPadding: false },
  date: { ...sansW('500'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, color: isDark ? colors.inkMute : '#999999', marginTop: 4, includeFontPadding: false },
  bannerCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, marginTop: 8, paddingHorizontal: 10, borderRadius: 24, backgroundColor: NAVY },
  coin: { width: 13, height: 12 },
  bannerCtaText: { ...sansW('700'), fontSize: 12, lineHeight: 14, color: '#FFFFFF', includeFontPadding: false },
  // 점 8 · 간격 8 — 지금 장은 #7FB3FF
  dots: { height: 8, gap: 0 },
  dotTarget: { width: 16, height: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CFCFCF' },
  dotOn: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7FB3FF' },

  section: { ...sansW('700'), fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: TITLE_INK, marginBottom: 16, includeFontPadding: false },

  bigCard: { height: 128, borderRadius: 12, overflow: 'hidden', paddingTop: 25, paddingLeft: 16, backgroundColor: CARD },
  bigArt: { position: 'absolute', top: 0, right: 0, width: 327, height: 128 },
  // 뒤집은 가장자리 띠(110) — 오른쪽 끝을 그림 왼쪽 12(둥근 모서리 자리)까지 덮는다
  bigEdge: { position: 'absolute', top: 0, height: 128, width: 110, right: 327 - 12 },
  bigTitle: { ...sansW('700'), fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: '#000000', includeFontPadding: false },
  bigDesc: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#000000', marginTop: 8, includeFontPadding: false },
  pill: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 24, backgroundColor: '#FFFFFF' },
  pillText: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#000000', includeFontPadding: false },

  // 70×70 타일 4개, 아래 7에 이름 (Figma 행 간격 16)
  // 타일 4개가 폭을 나눠 채운다 (Figma 70 · 간격 16) — 높이 70은 그대로
  cats: { flexDirection: 'row', gap: 16, marginTop: 20 },
  cat: { flex: 1, alignItems: 'center' },
  catTile: { alignSelf: 'stretch', height: 70, borderRadius: 12, backgroundColor: CARD },
  abs: { position: 'absolute' },
  catText: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.78, color: isDark ? colors.ink : '#222222', marginTop: 7, textAlign: 'center', includeFontPadding: false, width: 80 },

  rows: { gap: 16, marginTop: 20 },
  row: { height: 62, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 20, borderRadius: 12, backgroundColor: CARD },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF' },
  rowBody: { flex: 1, marginLeft: 11, gap: 4 },
  rowTitle: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.78, color: isDark ? colors.ink : '#222222', includeFontPadding: false },
  rowSub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, includeFontPadding: false },

  tomorrow: { ...sansW('700'), fontSize: 14, lineHeight: 17, color: '#838383', textAlign: 'center', marginTop: 32, letterSpacing: -0.56, includeFontPadding: false },
});
