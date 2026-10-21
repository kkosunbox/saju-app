import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import Card from '../components/Card';
import BrandMark from '../components/BrandMark';
import Mascot from '../components/Mascot';
import ScoreRing from '../components/ScoreRing';
import { COPY } from '../content/copy';
import { analysisTheme, CategoryKey, categoryTheme, colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt } from '../theme/typography';
import { useWebThemeColor } from '../utils/webThemeColor';

const SOURCES = ['saju', 'thai', 'mbti', 'blood'] as const;
const SOURCE_LINE: Record<(typeof SOURCES)[number], string> = {
  saju: '태어난 날의 네 기둥과 오늘의 일진이 만나는 자리',
  thai: '서양 · 인도 · 태국, 세 갈래 별점이 오늘 건네는 힌트',
  mbti: '지금의 성향이 오늘의 흐름을 어떻게 받는지',
  blood: '기질 한마디로 보는 오늘의 컨디션',
};
/** 예시 화면의 점수 — 홈의 분야별 링과 같은 색 */
const SAMPLE: { k: CategoryKey; score: number; ring: string }[] = [
  { k: 'love', score: 78, ring: '#C93B3B' },
  { k: 'money', score: 64, ring: '#E1A338' },
  { k: 'work', score: 88, ring: '#28B2FE' },
  { k: 'relationship', score: 71, ring: '#06C755' },
];
const STEPS: [string, string][] = [
  ['몇 가지만 답해요', '생년월일 · 태어난 시간 · 성별 · 혈액형 · MBTI. 모르는 건 건너뛰어도 돼요.'],
  ['마스코트를 꾹 눌러 뽑아요', '네 가지 관점이 읽은 오늘의 운이 한 번에 펼쳐져요.'],
  ['친구와 나눠요', '결과를 스토리 카드로 만들고, 친구 결과와 나란히 비교해요.'],
];
const FREE: [string, string, string][] = [
  ['日', '오늘의 운세', '종합 점수와 연애·재물·일·관계, 오늘 할 일과 피할 일'],
  ['週', '주간 · 월간 · 연간 흐름', '분야별로 좋은 날과 조심할 날'],
  ['和', '궁합', '상대 정보를 넣거나, 링크 하나로 친구에게 신청받기'],
  ['遊', '찰떡 MBTI · 사주 캐릭터 · 오늘의 부적 · 전생', '가볍게 보고 친구와 나누는 콘텐츠'],
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
  const start = () => { completeOnboarding(); };
  const login = async () => { await completeOnboarding(); router.push('/login'); };

  // 떠 있는 버튼: 히어로가 지나가면 보이고, 마지막 버튼이 화면에 들어오면 숨긴다
  const [heroH, setHeroH] = useState(0);
  const [lastCtaY, setLastCtaY] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [y, setY] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setY(e.nativeEvent.contentOffset.y);
  // 맨 위 하늘이 보이는 동안만 상단 바를 하늘색으로, 내리면 흰 내용에 맞춰 기본색으로
  useWebThemeColor(y < 40 ? gradients.sky[0] : colors.cream);
  // lastCtaY는 히어로 아래 본문 기준 위치
  const floating = heroH > 0 && y > heroH - 40 && (!lastCtaY || y + viewH < heroH + lastCtaY + 40);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, overflow: 'hidden' }}>
      {/* 당겨도 위가 하얗게 비지 않게 */}
      <View pointerEvents="none" style={[s.overscroll, { backgroundColor: gradients.sky[0] }]} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={32} onLayout={e => setViewH(e.nativeEvent.layout.height)}>
        <View onLayout={e => setHeroH(e.nativeEvent.layout.height)}>
        <LinearGradient colors={gradients.sky} locations={[0, 0.5, 0.92]} style={[s.hero, { paddingTop: insets.top }]}>
          <View style={s.top}>
            <BrandMark light />
            <PressableScale onPress={login} hitSlop={12} scaleTo={0.94} accessibilityRole="link"><Text style={s.topLink}>로그인</Text></PressableScale>
          </View>
          <Mascot size={150} style={{ alignSelf: 'center', marginTop: 12 }} />
          <Text style={[txt.title, s.headline]} accessibilityRole="header">{COPY.ask.replace('어떤 운을 ', '어떤 운을\n')}</Text>
          <Text style={[txt.body, s.lead]}>사주 · 별자리 · MBTI · 혈액형, 네 가지로 읽는 오늘.{'\n'}1분이면 나오고, 가입하지 않아도 돼요.</Text>
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
                  <Text style={s.ringLabel}>{categoryTheme[c.k].short}</Text>
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
                <View style={[s.seal, { backgroundColor: analysisTheme[k].bg }]}><Text style={[s.sealText, { color: analysisTheme[k].color }]}>{analysisTheme[k].emoji}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{analysisTheme[k].label}</Text>
                  <Text style={txt.small}>{SOURCE_LINE[k]}</Text>
                </View>
              </View>
            ))}
          </Card>
          <Text style={[txt.small, { marginTop: 10 }]}>네 관점이 같은 말을 할수록 그날의 흐름이 또렷해져요. 그래서 한 가지 점보다 덜 들쭉날쭉해요.</Text>

          <Text style={s.h}>무료로 즐기기</Text>
          <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {FREE.map(([h, t, d], i) => (
              <View key={t} style={[s.row, i > 0 && s.line]}>
                <View style={[s.seal, { backgroundColor: colors.lavenderSoft }]}><Text style={[s.sealText, { color: colors.purple }]}>{h}</Text></View>
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

          <View onLayout={e => setLastCtaY(e.nativeEvent.layout.y)}>
            <PrimaryButton label={CTA} onPress={start} style={{ marginTop: 32 }} />
          </View>
          <View style={s.footer}>
            <Text style={txt.caption}>운세는 재미와 참고를 위한 콘텐츠예요. 중요한 결정은 전문가와 상의하세요.</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <PressableScale onPress={() => router.push('/legal/terms')} hitSlop={8} accessibilityRole="link"><Text style={s.footLink}>이용약관</Text></PressableScale>
              <PressableScale onPress={() => router.push('/legal/privacy')} hitSlop={8} accessibilityRole="link"><Text style={s.footLink}>개인정보처리방침</Text></PressableScale>
            </View>
          </View>
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
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  ringLabel: { fontSize: 12, fontWeight: '600', color: colors.inkSub },
  h: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 36, marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontSize: 14, fontWeight: '700', color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  seal: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sealText: { fontFamily: fonts.serif, fontSize: 19, fontWeight: '700' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  footer: { marginTop: 32, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  footLink: { fontSize: 13, fontWeight: '600', color: colors.inkSub, textDecorationLine: 'underline' },
  floatBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 12, backgroundColor: colors.cream, ...shadow.float },
});
