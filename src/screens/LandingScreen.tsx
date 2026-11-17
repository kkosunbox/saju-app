import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BrandMark from "../components/BrandMark";
import BusinessFooter from "../components/BusinessFooter";
import Card from "../components/Card";
import { HomeAnalysisArt } from "../components/home/HomeDesignAssets";
import Mascot, { ArtName } from "../components/Mascot";
import MascotCarousel from "../components/MascotCarousel";
import PressableScale from "../components/PressableScale";
import PrimaryButton from "../components/PrimaryButton";
import PromoCard from "../components/PromoCard";
import { promoDesign } from "../components/PromoSlot";
import ReviewCarousel from "../components/ReviewCarousel";
import { GUIDE_SLUGS, GUIDES } from "../content/guides";
import { useApp } from "../context/AppContext";
import { ITEMS } from "../services/premium/catalog";
import { newYearOf } from "../services/promo/promos";
import { sampleUsers } from "../services/sampleUsers";
import { analysisTheme, colors, gradients, isDark } from "../theme/colors";
import { fonts, radius, sansW, shadow, txt } from "../theme/typography";
import { todayISO } from "../utils/date";
import { useWebTopBar, webSafeTop } from "../utils/webThemeColor";

/**
 * 4가지 관점 — 홈의 관점 타일과 같은 그라디언트 · 그림 (Figma 501:2916). 두 칸씩 두 줄.
 * place: 94 높이 타일 안 그림 자리 (오른쪽 · 위)
 */
const SOURCES = [
  ["saju", "mbti"],
  ["thai", "tarot"],
] as const;
type SourceKey = (typeof SOURCES)[number][number];
const SOURCE_CARD: Record<
  SourceKey,
  {
    sub: string;
    title: string;
    tile: readonly [string, string];
    place: { right: number; top: number; width?: number; height?: number };
  }
> = {
  saju: {
    sub: "사주 · 타고난 기운",
    title: "나의 기질과\n오늘의 흐름",
    tile: isDark ? analysisTheme.saju.tile : analysisTheme.thai.tile,
    place: { right: 12, top: 28 },
  },
  mbti: {
    sub: "MBTI · 지금의 성향",
    title: "내 성향으로\n바라본 오늘",
    tile: analysisTheme.mbti.tile,
    place: { right: 8, top: 28 },
  },
  thai: {
    sub: "태국 점성술 · 요일의 행성",
    title: "오늘의 별이\n전하는 힌트",
    tile: isDark ? analysisTheme.thai.tile : analysisTheme.saju.tile,
    place: { right: 9, top: 37 },
  },
  tarot: {
    sub: "타로 · 오늘의 선택",
    title: "카드 한 장이\n건네는 메시지",
    tile: analysisTheme.tarot.tile,
    place: { right: 12, top: 33, width: 58, height: 50 },
  },
};
/** 히어로 하늘 (Figma 501:2754) — 구름 그림 위에 파랑 → 투명 그라디언트, 그림 끝(아래 58)은 흰색으로 덮어 걷는다 */
const HERO_TOP = isDark ? gradients.sky[0] : "#21AFFE";
/** Figma 프레임은 위 44 상태바를 포함한다 — 상단 바 위치에 맞춰 배경을 그만큼 올린다 */
const FIGMA_STATUS = 44;
/** 앱 홈 · 콘텐츠 탭과 같은 그림 (그림 높이는 40칸 안에 맞춘 값) */
const FREE: [ArtName, number, string, string][] = [
  [
    "today",
    30,
    "오늘의 운세",
    "종합 점수와 연애·재물·일·관계, 오늘 할 일과 피할 일",
  ],
  ["month", 30, "주간 · 월간 · 연간 흐름", "분야별로 좋은 날과 조심할 날"],
  ["friends", 22, "궁합", "상대 정보를 넣거나, 링크 하나로 신청받기"],
  [
    "talisman",
    32,
    "찰떡 MBTI · 사주 캐릭터 · 오늘의 부적 · 전생",
    "가볍게 보고 친구와 나누는 콘텐츠",
  ],
];
/** 앱 안 유료 추천 배너 중 네 장만 — 나머지는 이름만 한 줄로 */
const NEW_YEAR = newYearOf(todayISO());
const PAID_BANNERS = [
  {
    key: "newyear",
    title: `${NEW_YEAR}년 신년운세`,
    desc: "올해의 사자성어 · 분야별 6대 운세 · 12개월 하나하나",
    item: ITEMS.newyear(NEW_YEAR),
  },
  {
    key: "theme-love",
    title: "연애·결혼 운세",
    desc: "연애 스타일 · 잘 맞는 사람 · 인연이 오는 해",
    item: ITEMS.theme("love"),
  },
  {
    key: "theme-money",
    title: "재물 운세",
    desc: "돈 버는 방식 · 재물이 모이는 시기 · 5년 흐름",
    item: ITEMS.theme("money"),
  },
  {
    key: "theme-career",
    title: "직업 · 적성 운세",
    desc: "맞는 일 · 커리어 상승기 · 이직 타이밍",
    item: ITEMS.theme("career"),
  },
] as const;
const PAID_MORE = [
  "상세 사주 해석",
  "평생운 · 10년 대운",
  "미래 배우자",
  "그 사람의 속마음",
  "길일 찾기",
];
const CTA = "무료로 내 운세 보기";
const HEADLINE = "오늘 나에게 올 운,\n미리 알고 시작해요";
/** 히어로의 큰 숫자 */
type Proof = { n: number };

/** 0에서 n까지 1초 동안 올라가는 숫자 */
function useCountUp(n: number): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!n) return;
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / 1000);
      setV(Math.round(n * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return v;
}

/** 히어로 맨 위 큰 숫자 — 집계가 없거나 작으면 원래 제목만 보인다 */
function SocialProof({ proof }: { proof: Proof }) {
  const v = useCountUp(proof.n);
  const n = proof.n.toLocaleString("ko-KR");
  return (
    <View
      style={s.proof}
      accessible
      accessibilityLabel={`${n}명 운을 Pick하고 있어요`}
    >
      <Text style={s.proofNum}>
        {v.toLocaleString("ko-KR")}
        <Text style={s.proofUnit}>명</Text>
      </Text>
      <Text style={s.proofPost}>운을 Pick하고 있어요</Text>
    </View>
  );
}
/** 미리보기 화면 아래 세 줄 — 이미지에 보이는 것만 말한다 */
const POINTS: [string, string][] = [
  ["점수보다 한 줄", "오늘이 어떤 날인지 한 문장으로 먼저 알려 줘요"],
  ["연애 · 재물 · 직장 · 관계", "어제보다 오른 운, 내려간 운을 한눈에"],
  ["행운의 색 · 숫자 · 시간", "오늘 바로 써먹을 수 있는 작은 힌트까지"],
];
/** 칩 테두리 · 글자 파랑 (Figma #00A3FF, 글자는 80%) */
const CHIP_BLUE = "#00A3FF";
// TODO: 임시 리뷰 — 실제 사용자 리뷰가 쌓이면 교체
const REVIEWS = [
  "출근길 지하철에서 보는 게 루틴이 됐어요. 말조심 하라는 날에는 확실히 조심해야할 일이 생기기도 함",
  "사주랑 MBTI를 같이 보니 더 결과가 와닿는듯? ㅋㅋ 내용이 은근 잘 맞아요",
  "점수 낮은 날엔 괜히 신경쓰이지만.. 뭔가 챙겨주는 느낌? 오히려 위로받는듯요",
  "친구가 궁합 링크 줘서 들어왔다가 정착했어요",
  "가입 안 해도 바로 결과가 나와서 부담이 없는게 장점임. 나중에 가입하니까 기록도 그대로 이어짐 굳",
  "오늘의 부적이 너무 귀엽고 괜히 뭔가 힘이 돼요 ㅠㅠ",
  "월간 흐름 보고 이사 날짜 잡을 때 참고했어요. 100% 믿는 건 아니지만 좋은 날이라고 하니까 괜히 마음이 편하더라고요. 이사도 무사히 끝!",
  "타로 한 장 뽑는 게 은근 중독돼요. 아침에 커피 내리면서 하나씩 뽑는 맛!",
  "재물운 높다던 날 잊고 있던 환급금이 들어왔어요 ㅋㅋㅋ 우연인 거 아는데 그 뒤로 아침마다 확인하게 됨..",
  "엄마 생일 넣어서 같이 봤는데 엄마가 더 좋아하심 ㅎㅎ 풀이가 너무 그럴싸해서 둘이 한참 깔깔댐",
  "다른 운세 앱들은 광고가 너무 많아서 금방 지웠는데 여긴 깔끔해서 오래 쓰게 되네요. 글씨도 읽기 편하고 화면이 예뻐요",
  "연애운 좋다길래 미루던 연락을 먼저 해봤는데… 결과가 좋았어요. 그냥 등 떠밀어 주는 한마디가 필요했을수도요ㅠㅠㅎㅎ",
  "하루 시작 전에 오늘 할 일이랑 피할 일만 봐도 생각보다 도움이 돼요. 뭔가 하루를 미리 정리하고 시작하는 느낌이라 좋네요",
  "처음엔 재미로 깔았는데 주간 흐름이 은근 잘 맞아서 계속 보게 됐어요. 바쁜 주에는 미리 마음의 준비를 하게 돼요",
] as const;

/**
 * 웹 첫 화면 (프로필이 없는 방문자). 앱은 온보딩 슬라이드를 쓴다.
 * [내 운세 보기] → 프로필 입력 → 홈. 계정이 있으면 [로그인].
 * 첫 버튼이 화면 밖으로 나가면 아래에 버튼이 떠 있고, 마지막 버튼이 보이면 들어간다.
 */
export default function LandingScreen() {
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const safeTop = webSafeTop(insets.top);
  const start = () => {
    completeOnboarding();
  };
  const login = () => router.push("/login");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);
  // 서버 정적 렌더와 첫 화면이 같게 — 날짜로 정하는 숫자는 브라우저에서 그린다
  const proof: Proof | null = loaded ? { n: sampleUsers() } : null;

  // 떠 있는 버튼: 히어로가 지나가면 보이고, 마지막 버튼이 화면에 들어오면 숨긴다
  const [heroH, setHeroH] = useState(0);
  const [lastCtaY, setLastCtaY] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [y, setY] = useState(0);
  // 히어로는 상단 바(상태바 + 로고 줄)까지 단색으로 두어 Safari 상단 바와 경계가 보이지 않게 하고,
  // 웹에서는 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다
  const heroHold = safeTop + 52;
  const skyTop = safeTop - FIGMA_STATUS;
  const heroGradient =
    heroH > heroHold * 2
      ? {
          colors: [gradients.sky[0], ...gradients.sky] as const,
          locations: [0, heroHold / heroH, 0.5, 0.92] as const,
        }
      : { colors: gradients.sky, locations: [0, 0.5, 0.92] as const };
  const onScrollTopBar = useWebTopBar(
    !isDark
      ? [
          [0, HERO_TOP],
          [skyTop + 64, HERO_TOP],
          [skyTop + 225, "#E3F4FF"],
          [skyTop + 362, colors.cream],
        ]
      : heroH > heroHold * 2
        ? [
            [0, gradients.sky[0]],
            [heroHold, gradients.sky[0]],
            [heroH * 0.5, gradients.sky[1]],
            [heroH * 0.92, gradients.sky[2]],
          ]
        : [[0, gradients.sky[0]]],
  );
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setY(e.nativeEvent.contentOffset.y);
    onScrollTopBar(e.nativeEvent.contentOffset.y);
  };
  // lastCtaY는 히어로 아래 본문 기준 위치
  const floating =
    heroH > 0 &&
    y > heroH - 40 &&
    (!lastCtaY || y + viewH < heroH + lastCtaY + 40);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.cream, overflow: "hidden" }}
    >
      {/* 당겨도 위가 하얗게 비지 않게 */}
      <View
        pointerEvents="none"
        style={[s.overscroll, { backgroundColor: HERO_TOP }]}
      />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
      >
        <View onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}>
          <LinearGradient
            colors={isDark ? heroGradient.colors : [colors.cream, colors.cream]}
            locations={isDark ? heroGradient.locations : undefined}
            style={[s.hero, { paddingTop: safeTop }]}
          >
            {isDark ? null : (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image
                  source={require("../../assets/images/landing-hero-bg.webp")}
                  style={[s.heroBg, { top: skyTop - 20 }]}
                  contentFit="fill"
                  accessible={false}
                />
                <LinearGradient
                  colors={[
                    "rgba(33,175,254,1)",
                    "rgba(33,175,254,1)",
                    "rgba(200,235,255,0.55)",
                    "rgba(255,255,255,0)",
                  ]}
                  locations={[0, 0.16, 0.56, 0.9]}
                  style={[s.heroSky, { top: skyTop }]}
                />
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0)",
                    "rgba(255,255,255,0.55)",
                    "rgba(255,255,255,1)",
                  ]}
                  locations={[0.12, 0.52, 1]}
                  style={[s.heroFade, { top: skyTop + 328 }]}
                />
              </View>
            )}
            <View style={s.top}>
              <BrandMark light />
              <PressableScale
                onPress={login}
                hitSlop={12}
                scaleTo={0.94}
                accessibilityRole="link"
              >
                <Text style={s.topLink}>로그인</Text>
              </PressableScale>
            </View>
            <View style={s.mascot}>
              <MascotCarousel size={136} />
            </View>
            {/* 숫자가 있으면 숫자가 제목이 된다 — 바로 아래 리뷰가 숫자를 받쳐 준다 */}
            {proof ? (
              <SocialProof proof={proof} />
            ) : (
              <Text style={s.headline} accessibilityRole="header">
                {HEADLINE}
              </Text>
            )}
            <View style={s.heroReviews}>
              <ReviewCarousel reviews={REVIEWS} sidePad={24} lines={4} />
            </View>
            <PrimaryButton
              label={CTA}
              onPress={start}
              style={{ marginTop: 20 }}
            />
          </LinearGradient>
        </View>

        <View style={s.body}>
          {/* 실제로 받게 될 화면을 먼저 보여준다 — 앱 홈과 홈 화면 위젯 */}
          <Text style={[s.h, s.hFirst]}>오늘의 운세</Text>
          <Text style={s.hSub}>
            매일 무료로 제공되며, 위젯으로 설정해두고 편하게 확인할 수도 있어요.
          </Text>
          <View style={[s.preview, !isDark && s.previewSky]}>
            <Image
              source={
                isDark
                  ? require("../../assets/images/landing-preview.webp")
                  : require("../../assets/images/landing-preview-sky.webp")
              }
              style={s.previewImage}
              contentFit="cover"
              accessibilityLabel="운Pick 오늘의 운세 화면과 홈 화면 위젯"
            />
            {/* 하늘 그림의 위아래를 바탕색으로 풀어 네모 띠처럼 보이지 않게 */}
            {isDark ? null : (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={[colors.cream, "rgba(255,255,255,0)"]}
                  style={[s.previewFade, { top: 0 }]}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(255,255,255,0)", colors.cream]}
                  style={[s.previewFade, { bottom: 0 }]}
                />
              </>
            )}
          </View>
          {/* <View style={s.points}>
            {POINTS.map(([t, d]) => (
              <View key={t} style={s.point}>
                <Text style={s.pointTitle}>{t}</Text>
                <Text style={s.pointText}>{d}</Text>
              </View>
            ))}
          </View> */}

          <Text style={[s.h, s.hPlain]}>여러가지 관점에서 운세를 읽어요</Text>
          <View style={s.sources}>
            {SOURCES.map((row) => (
              <View key={row[0]} style={s.sourceRow}>
                {row.map((k) => {
                  const c = SOURCE_CARD[k];
                  return (
                    <LinearGradient key={k} colors={c.tile} style={s.source}>
                      <HomeAnalysisArt source={k} place={c.place} />
                      <Text style={s.sourceSub} numberOfLines={1}>
                        {c.sub}
                      </Text>
                      <Text style={s.sourceTitle}>{c.title}</Text>
                    </LinearGradient>
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={s.sourceNote}>
            타고난 바탕과 오늘의 흐름, 나의 성향과 카드의 메시지를 함께 읽어요.
          </Text>

          <Text style={s.h}>무료로 즐길 수 있어요</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {FREE.map(([art, h, t, d], i) => (
              <View key={t} style={[s.row, i > 0 && s.line]}>
                <View style={[s.seal, { backgroundColor: colors.cream }]}>
                  <Mascot name={art} size={h} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{t}</Text>
                  <Text style={txt.small}>{d}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Text style={s.h}>용하다고 소문난 사주·운세 풀이</Text>
          <View style={{ gap: 10 }}>
            {PAID_BANNERS.map((b) => {
              const d = promoDesign(b.key, NEW_YEAR);
              return (
                <PromoCard
                  key={b.key}
                  variant="recommendation"
                  base={d.base}
                  descInset={d.descInset}
                  tone={d.tone}
                  title={b.title}
                  desc={b.desc}
                  coin
                  cta={`${b.item.cost}알 · 자세히 보기 →`}
                  onPress={start}
                />
              );
            })}
          </View>
          <Text style={[txt.small, { marginTop: 12 }]}>
            <Text style={{ color: colors.inkSub, fontWeight: "600" }}>
              {PAID_MORE.join(" · ")}
            </Text>{" "}
            등도 있어요.
          </Text>

          {/* 서비스 소개 페이지 — <a href> 로 그려 검색엔진도 따라간다 */}
          <Text style={s.h}>운세 하나씩 알아보기</Text>
          <View style={s.guides}>
            {GUIDE_SLUGS.map((k) => {
              const g = GUIDES[k];
              return (
                <Link key={k} href={`/g/${k}` as Href} asChild>
                  <Pressable style={s.guide}>
                    <View style={s.guideHead}>
                      <View style={s.guideArt}>
                        <Mascot name={g.art} size={28} />
                      </View>
                      <Text style={s.guideArrow}>→</Text>
                    </View>
                    <Text style={s.guideName} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={s.guideShort} numberOfLines={2}>
                      {g.short}
                    </Text>
                    <Text style={s.guideBadge} numberOfLines={1}>
                      {g.badge}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>

          <View onLayout={(e) => setLastCtaY(e.nativeEvent.layout.y)}>
            <PrimaryButton
              label={CTA}
              onPress={start}
              style={{ marginTop: 32 }}
            />
          </View>
          <Text style={[txt.caption, { marginTop: 32 }]}>
            운세는 재미와 참고를 위한 콘텐츠예요. 중요한 결정은 전문가와
            상의하세요.
          </Text>
          <BusinessFooter style={{ marginTop: 16 }} />
        </View>
      </ScrollView>

      {floating ? (
        <View
          style={[s.floatBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <PrimaryButton label={CTA} onPress={start} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  overscroll: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  hero: { paddingHorizontal: 24, paddingBottom: 32, overflow: "hidden" },
  heroBg: { position: "absolute", left: 0, right: 0, height: 396 },
  heroSky: { position: "absolute", left: 0, right: 0, height: 402 },
  heroFade: { position: "absolute", left: 0, right: 0, height: 58 },
  // 상단 바(56) 안 로그인 글자 아래 18 (Figma 81 → 99) — 바 아래 여백이 19.5라 살짝 당긴다
  mascot: { alignItems: "center", marginTop: -2 },
  top: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }, // 홈 상단 바와 같은 높이 · 로고 크기 (좌우 24는 hero가 준다)
  topLink: {
    ...sansW("700"),
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.56,
    color: colors.white,
  },
  headline: {
    ...sansW("800"),
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.96,
    color: colors.ink,
    marginTop: 10,
    textAlign: "center",
  },
  proof: { alignItems: "center", marginTop: 6, gap: 2 },
  proofNum: {
    ...sansW("800"),
    fontSize: 52,
    lineHeight: 60,
    letterSpacing: -2,
    color: isDark ? colors.ink : "#0A8FE8",
    fontVariant: ["tabular-nums"],
  },
  proofUnit: { fontSize: 30, letterSpacing: -1 },
  proofPost: {
    ...sansW("700"),
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.72,
    color: colors.ink,
  },
  // 숫자 바로 아래 — 제목 없이 카드만
  heroReviews: { marginTop: 20 },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: colors.cream,
  },
  // 화면 끝까지 붙여 그림 속 폰을 크게 보인다
  preview: { marginHorizontal: -24, overflow: "hidden" },
  previewSky: { marginTop: -4 },
  // 그림 좌우의 빈 하늘을 잘라 폰을 더 크게
  previewImage: { width: "100%", aspectRatio: 4 / 3 },
  previewFade: { position: "absolute", left: 0, right: 0, height: 72 },
  points: { marginTop: 16, gap: 12 },
  point: { gap: 2 },
  pointTitle: {
    ...sansW("700"),
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  pointText: {
    ...sansW("500"),
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.52,
    color: colors.inkSub,
  },
  h: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 36,
    marginBottom: 12,
  },
  hFirst: { marginTop: 8, marginBottom: 6 },
  hSub: {
    ...sansW("500"),
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.56,
    color: colors.inkSub,
    marginBottom: 16,
  },
  // Figma 501:2919 — 18 Bold, 자간 없음
  hPlain: {
    ...sansW("700"),
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: 0,
    color: isDark ? colors.ink : "#000000",
    marginBottom: 16,
  },
  sources: { gap: 16 },
  sourceRow: { flexDirection: "row", gap: 16 },
  source: {
    flex: 1,
    height: 94,
    borderRadius: radius.lg,
    padding: 16,
    overflow: "hidden",
  },
  sourceSub: {
    ...sansW("500"),
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.65,
    color: colors.inkMute,
  },
  sourceTitle: {
    ...sansW("700"),
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.56,
    color: colors.ink,
    marginTop: 4,
  },
  sourceNote: {
    ...sansW("400"),
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.48,
    color: isDark ? colors.inkMute : "#838383",
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  seal: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  rowSub: { fontSize: 13, fontWeight: "500", color: colors.inkMute },
  guides: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  // 두 칸씩 나란히 — 홀수면 마지막 칸은 한 줄을 다 쓴다
  guide: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    gap: 4,
  },
  guideHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  guideArt: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  guideArrow: { fontSize: 14, fontWeight: "700", color: colors.inkMute },
  guideName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  guideShort: { ...txt.caption, color: colors.inkSub, minHeight: 34 },
  // Figma 505:3158 — 테두리 0.5 파랑 칩, 바탕 없음
  guideBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    ...sansW("600"),
    fontSize: 11,
    lineHeight: 13,
    color: "rgba(0,163,255,0.8)",
    paddingHorizontal: 3.5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: CHIP_BLUE,
    borderRadius: radius.xs,
    overflow: "hidden",
  },
  floatBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.cream,
    ...shadow.float,
  },
});
