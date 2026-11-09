import { LinearGradient } from "expo-linear-gradient";
import { Link, router, type Href } from "expo-router";
import { useState } from "react";
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
import { CategoryGlyph } from "../components/CategoryIcon";
import Mascot, { ArtName } from "../components/Mascot";
import MascotCarousel from "../components/MascotCarousel";
import PressableScale from "../components/PressableScale";
import PrimaryButton from "../components/PrimaryButton";
import PromoCard from "../components/PromoCard";
import { CONSULT_DESIGN, RECOMMENDATION_DESIGN } from "../components/PromoSlot";
import ReviewCarousel from "../components/ReviewCarousel";
import ScoreRing from "../components/ScoreRing";
import { COPY } from "../content/copy";
import { GUIDE_SLUGS, GUIDES } from "../content/guides";
import { useApp } from "../context/AppContext";
import { ITEMS } from "../services/premium/catalog";
import { newYearOf } from "../services/promo/promos";
import {
  analysisTheme,
  CategoryKey,
  categoryTheme,
  colors,
  gradients,
} from "../theme/colors";
import { fonts, radius, shadow, txt } from "../theme/typography";
import { todayISO } from "../utils/date";
import { useWebTopBar, webSafeTop } from "../utils/webThemeColor";

const SOURCES = ["saju", "thai", "mbti", "tarot"] as const;
const POSE = {
  saju: "pose-saju",
  thai: "pose-thai",
  mbti: "pose-mbti",
  tarot: "soon-tarot",
} as const;
const SOURCE_LINE: Record<(typeof SOURCES)[number], string> = {
  saju: "태어난 날의 네 기둥과 오늘의 일진이 만나는 자리",
  thai: "서양 · 인도 · 태국, 세 갈래 별점이 오늘 건네는 힌트",
  mbti: "지금의 성향이 오늘의 흐름을 어떻게 받는지",
  tarot: "카드 한 장으로 생각해보는 오늘의 선택",
};
/** 예시 화면의 점수 — 홈의 분야별 링과 같은 색 */
const SAMPLE: { k: CategoryKey; score: number; ring: string }[] = [
  { k: "love", score: 78, ring: "#C93B3B" },
  { k: "money", score: 64, ring: "#E1A338" },
  { k: "work", score: 88, ring: "#28B2FE" },
  { k: "relationship", score: 71, ring: "#06C755" },
];
const STEPS: [string, string][] = [
  [
    "몇 가지만 답해요",
    "생년월일 · 태어난 시간 · 성별 · MBTI.\n모르는 건 건너뛰어도 돼요.",
  ],
  [
    "오늘의 운세를 확인해요",
    "사주 · MBTI · 타로 · 별자리로 읽은\n오늘의 흐름과 나에게 맞는 조언을 만나요.",
  ],
  [
    "친구와 나눠요",
    "결과를 스토리 카드로 만들고,\n친구 결과와 나란히 비교해요.",
  ],
];
/** 앱 홈 · 콘텐츠 탭과 같은 그림 (그림 높이는 40칸 안에 맞춘 값) */
const FREE: [ArtName, number, string, string][] = [
  [
    "today",
    30,
    "오늘의 운세",
    "종합 점수와 연애·재물·일·관계, 오늘 할 일과 피할 일",
  ],
  ["month", 30, "주간 · 월간 · 연간 흐름", "분야별로 좋은 날과 조심할 날"],
  ["friends", 22, "궁합", "상대 정보를 넣거나, 링크 하나로 친구에게 신청받기"],
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
const CTA = "내 운세 보기 · 무료";
// TODO: 임시 리뷰 — 실제 사용자 리뷰가 쌓이면 교체
const REVIEWS = [
  "출근길 지하철에서 보는 게 루틴이 됐어요. 말조심 하라는 날에는 확실히 조심해야할 일이 생기더라구요",
  "사주랑 MBTI를 같이 봐주니 좋네요 ㅋㅋ 내용이 은근 잘 맞아요. 오늘도 맞는 말만 함",
  "점수 낮은 날에도 말투가 다정해서 기분이 안상하는듯해요. 조심하라는 얘기도 혼내는 느낌이 아니라 챙겨주는 느낌? 오히려 위로받는듯",
  "친구랑 궁합 링크 주고받다가 단톡방 전체가 하게 됨 ㅎㅎ",
  "가입 안 해도 바로 결과가 나와서 부담이 없었어요. 생일이랑 MBTI만 넣었는데 1분도 안 걸림. 나중에 가입하니까 기록도 그대로 남아 있더라고요",
  "오늘의 부적이 너무 귀여워서 매일 스토리에 올리는 중이에요 🍀 친구들이 그거 어디서 받냐고 자꾸 물어봐서 링크 몇 번 보냈는지 모르겠어요",
  "월간 흐름 보고 이사 날짜 잡을 때 참고했어요. 100% 믿는 건 아니지만 좋은 날이라고 하니까 괜히 마음이 편하더라고요. 이사도 무사히 끝!",
  "타로 한 장 뽑는 게 은근 중독돼요. 아침에 커피 내리면서 하나씩 뽑고, 카드가 건네는 질문 하나 붙잡고 하루 보내요",
  "재물운 높다던 날 잊고 있던 환급금이 들어왔어요 ㅋㅋㅋ 우연인 거 아는데 그 뒤로 아침마다 확인하게 됨. 오늘은 지출 조심이래서 장바구니 비웠어요",
  "엄마 생일 넣어서 같이 봤는데 엄마가 더 좋아하셨어요 ㅎㅎ 성격 풀이가 너무 엄마 같다고 둘이 한참 웃었네요. 이제 엄마가 먼저 보내줘요",
  "다른 운세 앱들은 광고가 너무 많아서 금방 지웠는데 여긴 깔끔해서 오래 쓰게 되네요. 글씨도 읽기 편하고 화면이 예뻐요",
  "연애운 좋다길래 미루던 연락을 먼저 해봤는데… 결과가 좋았어요. 그냥 등 떠밀어 주는 한마디가 필요했을수도요",
  "하루 시작 전에 오늘 할 일이랑 피할 일만 봐도 생각보다 도움이 돼요. 뭔가 하루를 미리 정리하고 시작하는 느낌이라 아침이 덜 정신없어요",
  "처음엔 재미로 깔았는데 주간 흐름이 은근 잘 맞아서 계속 보게 됐어요. 바쁜 주에는 미리 마음의 준비를 하게 되더라고요",
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

  // 떠 있는 버튼: 히어로가 지나가면 보이고, 마지막 버튼이 화면에 들어오면 숨긴다
  const [heroH, setHeroH] = useState(0);
  const [lastCtaY, setLastCtaY] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [y, setY] = useState(0);
  // 히어로는 상단 바(상태바 + 로고 줄)까지 단색으로 두어 Safari 상단 바와 경계가 보이지 않게 하고,
  // 웹에서는 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다
  const heroHold = safeTop + 52;
  const heroGradient =
    heroH > heroHold * 2
      ? {
          colors: [gradients.sky[0], ...gradients.sky] as const,
          locations: [0, heroHold / heroH, 0.5, 0.92] as const,
        }
      : { colors: gradients.sky, locations: [0, 0.5, 0.92] as const };
  const onScrollTopBar = useWebTopBar(
    heroH > heroHold * 2
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
        style={[s.overscroll, { backgroundColor: gradients.sky[0] }]}
      />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
      >
        <View onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}>
          <LinearGradient
            colors={heroGradient.colors}
            locations={heroGradient.locations}
            style={[s.hero, { paddingTop: safeTop }]}
          >
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
            <View style={{ marginTop: 12 }}>
              <MascotCarousel size={150} />
            </View>
            <Text style={[txt.title, s.headline]} accessibilityRole="header">
              {COPY.ask.replace("어떤 운을 ", "어떤 운을\n")}
            </Text>
            <Text style={[txt.body, s.lead]}>
              사주 · MBTI · 타로 · 별자리, 네 가지로 읽는 오늘.{"\n"}1분이면
              나오고, 가입하지 않아도 돼요.
            </Text>
            <PrimaryButton
              label={CTA}
              onPress={start}
              style={{ marginTop: 20 }}
            />
          </LinearGradient>
        </View>

        <View style={s.body}>
          {/* 실제로 받게 될 화면을 먼저 보여준다 */}
          <Card style={[s.preview, shadow.card]}>
            <View style={s.previewHead}>
              <Text style={s.previewTitle}>오늘의 운세</Text>
              <View style={s.sampleTag}>
                <Text style={s.sampleText}>예시</Text>
              </View>
            </View>
            <View style={s.previewMain}>
              <ScoreRing
                score={82}
                size={88}
                stroke={5}
                color={colors.accent}
                track={colors.line}
                textColor={colors.ink}
                fontSize={30}
                delay={300}
              />
              <Text style={[txt.bodyStrong, { flex: 1 }]}>
                막혀 있던 일이 풀리는 날이에요. 미뤄 둔 연락을 먼저 해 보세요.
              </Text>
            </View>
            <View style={s.rings}>
              {SAMPLE.map((c, i) => (
                <View key={c.k} style={{ alignItems: "center", gap: 6 }}>
                  <ScoreRing
                    score={c.score}
                    size={52}
                    stroke={3}
                    color={c.ring}
                    track="transparent"
                    inner={colors.card}
                    textColor={colors.inkSub}
                    fontSize={19}
                    delay={450 + i * 120}
                  />
                  <View style={s.ringLabel}>
                    <CategoryGlyph category={c.k} size={12} />
                    <Text style={s.ringText}>{categoryTheme[c.k].short}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Text style={s.h}>1분이면 시작해요</Text>
          <View>
            {STEPS.map(([t, d], i) => (
              <View key={t} style={s.step}>
                {/* 번호 사이를 잇는 선 — 설명 길이와 상관없이 번호 간격이 같아 보이게 */}
                <View style={s.stepRail}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  {i < STEPS.length - 1 ? <View style={s.stepLine} /> : null}
                </View>
                <View
                  style={[
                    s.stepBody,
                    i === STEPS.length - 1 && {
                      paddingBottom: 0,
                      minHeight: 0,
                    },
                  ]}
                >
                  <Text style={s.rowTitle}>{t}</Text>
                  <Text style={txt.small}>{d}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.h}>네 가지 관점으로 나를 읽어요</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {SOURCES.map((k, i) => (
              <View key={k} style={[s.row, i > 0 && s.line]}>
                <LinearGradient colors={analysisTheme[k].tile} style={s.seal}>
                  <Mascot name={POSE[k]} size={30} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>
                    {analysisTheme[k].label}{" "}
                    <Text style={s.rowSub}>· {analysisTheme[k].sub}</Text>
                  </Text>
                  <Text style={txt.small}>{SOURCE_LINE[k]}</Text>
                </View>
              </View>
            ))}
          </Card>
          <Text style={[txt.small, { marginTop: 10 }]}>
            타고난 바탕과 오늘의 흐름, 나의 성향과 카드의 메시지를 함께 읽어요.
          </Text>

          <Text style={s.h}>무료로 즐기기</Text>
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

          <Text style={s.h}>먼저 써 본 사람들의 이야기</Text>
          <ReviewCarousel reviews={REVIEWS} sidePad={24} />

          <Text style={s.h}>{COPY.deeper}</Text>
          <View style={{ gap: 10 }}>
            {PAID_BANNERS.map((b) => {
              const d = RECOMMENDATION_DESIGN[b.key] ?? CONSULT_DESIGN;
              return (
                <PromoCard
                  key={b.key}
                  variant="recommendation"
                  base={d.base}
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
            등도 있어요.{"\n"}앱 안의 알로 원하는 것만 열어 보세요. 가입하면
            100알을 드려요.
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
  hero: { paddingHorizontal: 24, paddingBottom: 28 },
  top: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  }, // 홈 상단 바와 같은 높이 · 로고 크기 (좌우 24는 hero가 준다)
  topLink: { fontSize: 14, fontWeight: "700", color: colors.white },
  headline: {
    fontSize: 28,
    lineHeight: 38,
    marginTop: 16,
    textAlign: "center",
  },
  lead: { marginTop: 10, textAlign: "center" },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: colors.cream,
  },
  preview: { padding: 18, gap: 16 },
  previewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  sampleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
  sampleText: { fontSize: 11, fontWeight: "700", color: colors.purpleSoft },
  previewMain: { flexDirection: "row", alignItems: "center", gap: 16 },
  rings: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  ringLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  ringText: { fontSize: 12, fontWeight: "600", color: colors.inkSub },
  h: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 36,
    marginBottom: 12,
  },
  step: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  stepRail: { width: 28, alignItems: "center" },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.lineStrong,
    marginVertical: 4,
  },
  // 설명은 두 줄로 맞춰 써서 단계마다 높이가 같다
  stepBody: { flex: 1, paddingTop: 3, paddingBottom: 20, minHeight: 84 },
  stepNumText: { fontSize: 14, fontWeight: "700", color: colors.white },
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
  guideBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.purpleSoft,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
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
