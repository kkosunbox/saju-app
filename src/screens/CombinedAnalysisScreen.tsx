import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Seal from '../components/Seal';
import KeywordChip from '../components/KeywordChip';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { LogoMark } from '../components/BrandMark';
import { useApp } from '../context/AppContext';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt, sansW } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';
import { AlmanacHero, Figure } from '../components/Almanac';

export default function CombinedAnalysisScreen() {
  const { fortune, today } = useApp();
  if (!fortune) return null;
  const f = fortune.combined;
  const list = [fortune.analyses.saju, fortune.analyses.thai, fortune.analyses.mbti, fortune.analyses.blood];
  const common = new Set(f.commonKeywords);

  return (
    <Screen title="종합 분석" back>
      <AlmanacHero
        tone={{ color: colors.purple, bg: colors.lavenderSoft }} kicker="綜合 · 종합 분석" seal="合" eyebrow="네 가지 관점이 겹친 오늘"
        title={f.summary} today={today} tags={f.commonKeywords.length ? f.commonKeywords : f.keywords.slice(0, 1)}
      />

      <Figure title="관점별 한 줄" caption="겹친 키워드는 굵게">
        {list.map((a, i) => {
          const t = analysisTheme[a.source];
          return (
            <View key={a.source} style={[s.item, i > 0 && s.border]}>
              <View style={[s.seal, { backgroundColor: t.color }]}><Text style={s.sealText}>{t.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { color: t.color }]}>{t.label}</Text>
                <Text style={s.itemHeadline}>{a.headline}</Text>
                <View style={s.tags}>
                  {a.tags.map(tag => {
                    const on = common.has(KEYWORDS[tag].label);
                    return <Text key={tag} style={[s.tagText, on && { color: t.color, fontWeight: '800' }]}>#{KEYWORDS[tag].label}</Text>;
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </Figure>

      <View style={[s.storyWrap, shadow.hero]}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.story}>
          <View style={s.storyHead}><LogoMark size={18} fg={'#F4EDDF'} /><Text style={s.storyLabel}>오늘의 나에게 맞는 이야기</Text></View>
          <Text style={s.storyText}>{f.combinedStory}</Text>
        </LinearGradient>
      </View>

      <SectionHeader title="그래서 오늘은" />
      <ActionTabs good={f.goodActions} avoid={f.avoidActions} />

      <Text style={[txt.caption, { marginTop: 16, textAlign: 'center' }]}>
        사주 · 태국 점성술 · MBTI · 혈액형을 겹쳐 읽은 풀이예요
      </Text>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  commonBox: { marginTop: 20, backgroundColor: colors.lavenderSoft, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.lavender },
  commonLabel: { fontSize: 12, fontWeight: '700', color: colors.purpleSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  list: { marginTop: 12, backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 18, ...shadow.card },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.lineStrong, borderStyle: 'dashed' },
  seal: { width: 30, height: 30, borderRadius: 3, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }], marginTop: 2 },
  sealText: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: '#FBF4E8' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  itemTitle: { fontSize: 12, fontWeight: '800' },
  itemHeadline: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4, letterSpacing: -0.3, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  tag: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 12, color: colors.inkMute, fontWeight: '600' },
  storyWrap: { marginTop: 24, borderRadius: radius.xl, backgroundColor: colors.heroBg },
  story: { borderRadius: radius.xl, padding: 22 },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storyLabel: { color: colors.moon, fontSize: 13, fontWeight: '700' },
  storyText: { ...sansW('400'), color: colors.white, fontSize: 15.5, lineHeight: 26, marginTop: 12, letterSpacing: -0.2 },
});
