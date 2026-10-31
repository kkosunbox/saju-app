import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, type Href } from 'expo-router';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import Card from '../components/Card';
import BrandMark from '../components/BrandMark';
import BusinessFooter from '../components/BusinessFooter';
import Mascot, { ArtName } from '../components/Mascot';
import MascotCarousel from '../components/MascotCarousel';
import { CategoryGlyph } from '../components/CategoryIcon';
import ScoreRing from '../components/ScoreRing';
import { COPY } from '../content/copy';
import { GUIDES, GUIDE_SLUGS } from '../content/guides';
import { analysisTheme, CategoryKey, categoryTheme, colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt } from '../theme/typography';
import { useWebTopBar, webSafeTop } from '../utils/webThemeColor';

const SOURCES = ['saju', 'thai', 'mbti', 'tarot'] as const;
const POSE = { saju: 'pose-saju', thai: 'pose-thai', mbti: 'pose-mbti', tarot: 'soon-tarot' } as const;
const SOURCE_LINE: Record<(typeof SOURCES)[number], string> = {
  saju: '태어난 날의 네 기둥과 오늘의 일진이 만나는 자리',
  thai: '서양 · 인도 · 태국, 세 갈래 별점이 오늘 건네는 힌트',
  mbti: '지금의 성향이 오늘의 흐름을 어떻게 받는지',
  tarot: '카드 한 장으로 생각해보는 오늘의 선택',
};
/** 예시 화면의 점수 — 홈의 분야별 링과 같은 색 */
const SAMPLE: { k: CategoryKey; score: number; ring: string }[] = [
  { k: 'love', score: 78, ring: '#C93B3B' },
  { k: 'money', score: 64, ring: '#E1A338' },
  { k: 'work', score: 88, ring: '#28B2FE' },
  { k: 'relationship', score: 71, ring: '#06C755' },
];
const STEPS: [string, string][] = [
  ['몇 가지만 답해요', '생년월일 · 태어난 시간 · 성별 · MBTI. 모르는 건 건너뛰어도 돼요.'],
  ['마스코트를 꾹 눌러 뽑아요', '그날의 기운을 닮은 젤리가 찾아오고, 네 가지 관점이 읽은 오늘의 운이 한 번에 펼쳐져요.'],
  ['친구와 나눠요', '결과를 스토리 카드로 만들고, 친구 결과와 나란히 비교해요.'],
];
/** 앱 홈 · 콘텐츠 탭과 같은 그림 (그림 높이는 40칸 안에 맞춘 값) */
const FREE: [ArtName, number, string, string][] = [
  ['today', 30, '오늘의 운세', '종합 점수와 연애·재물·일·관계, 오늘 할 일과 피할 일'],
  ['month', 30, '주간 · 월간 · 연간 흐름', '분야별로 좋은 날과 조심할 날'],
  ['friends', 22, '궁합', '상대 정보를 넣거나, 링크 하나로 친구에게 신청받기'],
  ['talisman', 32, '찰떡 MBTI · 사주 캐릭터 · 오늘의 부적 · 전생', '가볍게 보고 친구와 나누는 콘텐츠'],
];
const PAID = ['상세 사주 해석', '평생운 · 10년 대운', '신년 · 월별 운세', '연애 · 재물 · 직업 운세', '길일 찾기', '미래 배우자', '그 사람의 속마음', '말 못 할 고민 상담'];
const CTA = '내 운세 보기 · 무료';

/**
 * 웹 첫 화면 (프로필이 없는 방문자). 앱은 온보딩 슬라이드를 쓴다.
 * [내 운세 보기] → 프로필 입력 → 홈. 계정이 있으면 [로그인].
 * 첫 버튼이 화면 밖으로 나가면 아래에 버튼이 떠 있고, 마지막 버튼이 보이면 들어간다.
 */
export default function LandingScreen() {
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const safeTop = webSafeTop(insets.top);
  const start = () => { completeOnboarding(); };
  const login = () => router.push('/login');

  // 떠 있는 버튼: 히어로가 지나가면 보이고, 마지막 버튼이 화면에 들어오면 숨긴다
  const [heroH, setHeroH] = useState(0);
  const [lastCtaY, setLastCtaY] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [y, setY] = useState(0);
  // 히어로는 상단 바(상태바 + 로고 줄)까지 단색으로 두어 Safari 상단 바와 경계가 보이지 않게 하고,
  // 웹에서는 상단 바 색을 스크롤에 따라 바로 아래 하늘 색에 맞춘다
  const heroHold = safeTop + 52;
  const heroGradient = heroH > heroHold * 2
    ? { colors: [gradients.sky[0], ...gradients.sky] as const, locations: [0, heroHold / heroH, 0.5, 0.92] as const }
    : { colors: gradients.sky, locations: [0, 0.5, 0.92] as const };
  const onScrollTopBar = useWebTopBar(heroH > heroHold * 2
    ? [[0, gradients.sky[0]], [heroHold, gradients.sky[0]], [heroH * 0.5, gradients.sky[1]], [heroH * 0.92, gradients.sky[2]]]
    : [[0, gradients.sky[0]]]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setY(e.nativeEvent.contentOffset.y);
    onScrollTopBar(e.nativeEvent.contentOffset.y);
  };
  // lastCtaY는 히어로 아래 본문 기준 위치
  const floating = heroH > 0 && y > heroH - 40 && (!lastCtaY || y + viewH < heroH + lastCtaY + 40);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
      {/* 당겨도 위가 하얗게 비지 않게 */}
      <View pointerEvents="none" style={[s.overscroll, { backgroundColor: gradients.sky[0] }]} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} onLayout={e => setViewH(e.nativeEvent.layout.height)}>
        <View onLayout={e => setHeroH(e.nativeEvent.layout.height)}>
        <LinearGradient colors={heroGradient.colors} locations={heroGradient.locations} style={[s.hero, { paddingTop: safeTop }]}>
          <View style={s.top}>
            <BrandMark light />
            <PressableScale onPress={login} hitSlop={12} scaleTo={0.94} accessibilityRole="link"><Text style={s.topLink}>로그인</Text></PressableScale>
          </View>
          <View style={{ marginTop: 12 }}><MascotCarousel size={150} /></View>
          <Text style={[txt.title, s.headline]} accessibilityRole="header">{COPY.ask.replace('어떤 운을 ', '어떤 운을\n')}</Text>
          <Text style={[txt.body, s.lead]}>사주 · 별자리 · MBTI · 타로, 네 가지로 읽는 오늘.{'\n'}1분이면 나오고, 가입하지 않아도 돼요.</Text>
          <PrimaryButton label={CTA} onPress={start} style={{ marginTop: 20 }} />
        </LinearGradient>
        </View>

        <View style={s.body}>
          {/* 실제로 받게 될 화면을 먼저 보여준다 */}
          <Card style={[s.preview, shadow.card]}>
            <View style={s.previewHead}>
              <Text style={s.previewTitle}>오늘의 운세</Text>
              <View style={s.sampleTag}><Text style={s.sampleText}>예시</Text></View>
            </View>
            <View style={s.previewMain}>
              <ScoreRing score={82} size={88} stroke={5} color={colors.accent} track={colors.line} textColor={colors.ink} fontSize={30} delay={300} />
              <Text style={[txt.bodyStrong, { flex: 1 }]}>막혀 있던 일이 풀리는 날이에요. 미뤄 둔 연락을 먼저 해 보세요.</Text>
            </View>
            <View style={s.rings}>
              {SAMPLE.map((c, i) => (
                <View key={c.k} style={{ alignItems: 'center', gap: 6 }}>
                  <ScoreRing score={c.score} size={52} stroke={3} color={c.ring} track="transparent" inner={colors.card} textColor={colors.inkSub} fontSize={19} delay={450 + i * 120} />
                  <View style={s.ringLabel}>
                    <CategoryGlyph category={c.k} size={12} />
                    <Text style={s.ringText}>{categoryTheme[c.k].short}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Text style={s.h}>1분이면 시작해요</Text>
          <View style={{ gap: 14 }}>
            {STEPS.map(([t, d], i) => (
              <View key={t} style={s.step}>
                <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
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
                <LinearGradient colors={analysisTheme[k].tile} style={s.seal}><Mascot name={POSE[k]} size={30} /></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{analysisTheme[k].label} <Text style={s.rowSub}>· {analysisTheme[k].sub}</Text></Text>
                  <Text style={txt.small}>{SOURCE_LINE[k]}</Text>
                </View>
              </View>
            ))}
          </Card>
          <Text style={[txt.small, { marginTop: 10 }]}>타고난 바탕과 오늘의 흐름, 나의 성향과 카드의 메시지를 함께 읽어요.</Text>

          <Text style={s.h}>무료로 즐기기</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {FREE.map(([art, h, t, d], i) => (
              <View key={t} style={[s.row, i > 0 && s.line]}>
                <View style={[s.seal, { backgroundColor: colors.cream }]}><Mascot name={art} size={h} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{t}</Text>
                  <Text style={txt.small}>{d}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Text style={s.h}>{COPY.deeper}</Text>
          <View style={s.chips}>{PAID.map(p => <View key={p} style={s.chip}><Text style={s.chipText}>{p}</Text></View>)}</View>
          <Text style={[txt.small, { marginTop: 10 }]}>앱 안의 알로 원하는 것만 열어 보세요. 가입하면 100알을 드려요.</Text>

          {/* 서비스 소개 페이지 — <a href> 로 그려 검색엔진도 따라간다 */}
          <Text style={s.h}>운세 하나씩 알아보기</Text>
          <View style={s.chips}>
            {GUIDE_SLUGS.map(k => <Link key={k} href={`/g/${k}` as Href} style={s.guideChip}>{GUIDES[k].name}</Link>)}
          </View>

          <View onLayout={e => setLastCtaY(e.nativeEvent.layout.y)}>
            <PrimaryButton label={CTA} onPress={start} style={{ marginTop: 32 }} />
          </View>
          <Text style={[txt.caption, { marginTop: 32 }]}>운세는 재미와 참고를 위한 콘텐츠예요. 중요한 결정은 전문가와 상의하세요.</Text>
          <BusinessFooter style={{ marginTop: 16 }} />
        </View>
      </ScrollView>

      {floating ? (
        <View style={[s.floatBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <PrimaryButton label={CTA} onPress={start} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  overscroll: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  hero: { paddingHorizontal: 24, paddingBottom: 28 },
  top: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, // 홈 상단 바와 같은 높이 · 로고 크기 (좌우 24는 hero가 준다)
  topLink: { fontSize: 14, fontWeight: '700', color: colors.white },
  headline: { fontSize: 28, lineHeight: 38, marginTop: 16, textAlign: 'center' },
  lead: { marginTop: 10, textAlign: 'center' },
  body: { paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.cream },
  preview: { padding: 18, gap: 16 },
  previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sampleTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.accentSoft },
  sampleText: { fontSize: 11, fontWeight: '700', color: colors.purpleSoft },
  previewMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rings: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  ringLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ringText: { fontSize: 12, fontWeight: '600', color: colors.inkSub },
  h: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 36, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontSize: 14, fontWeight: '700', color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  seal: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 13, fontWeight: '500', color: colors.inkMute },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  guideChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, fontSize: 13, fontWeight: '600', color: colors.inkSub },
  floatBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, backgroundColor: colors.cream, ...shadow.float },
});
