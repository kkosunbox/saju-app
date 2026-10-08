import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import KeywordChip from '../components/KeywordChip';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { Crescent } from '../components/BrandMark';
import { useApp } from '../context/AppContext';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { radius, shadow, txt } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

export default function CombinedAnalysisScreen() {
  const { fortune } = useApp();
  if (!fortune) return null;
  const f = fortune.combined;
  const list = [fortune.analyses.saju, fortune.analyses.thai, fortune.analyses.mbti, fortune.analyses.blood];
  const common = new Set(f.commonKeywords);

  return (
    <Screen title="종합 분석" back>
      <Text style={[txt.title, { marginTop: 4 }]}>4가지 분석을{'\n'}종합했어요</Text>

      {/* 공통 키워드를 먼저 — 결론부터 */}
      <View style={s.commonBox}>
        <Text style={s.commonLabel}>여러 관점에서 겹친 키워드</Text>
        <View style={s.chips}>
          {(f.commonKeywords.length ? f.commonKeywords : f.keywords.slice(0, 1)).map(k => <KeywordChip key={k} label={k} tone="strong" />)}
        </View>
      </View>

      {/* 관점별 결과: 색 점 + 한 줄 + 태그(공통이면 강조) */}
      <View style={s.list}>
        {list.map((a, i) => {
          const t = analysisTheme[a.source];
          return (
            <View key={a.source} style={[s.item, i > 0 && s.border]}>
              <View style={[s.dot, { backgroundColor: t.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { color: t.color }]}>{t.emoji} {t.label}</Text>
                <Text style={s.itemHeadline}>{a.headline}</Text>
                <View style={s.tags}>
                  {a.tags.map(tag => {
                    const on = common.has(KEYWORDS[tag].label);
                    return (
                      <View key={tag} style={[s.tag, on && { backgroundColor: colors.lavender }]}>
                        <Text style={[s.tagText, on && { color: colors.purple, fontWeight: '700' }]}>#{KEYWORDS[tag].label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[s.storyWrap, shadow.hero]}>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.story}>
          <View style={s.storyHead}><Crescent size={14} color={colors.moon} cut="#5A46A8" /><Text style={s.storyLabel}>오늘의 나에게 맞는 이야기</Text></View>
          <Text style={s.storyText}>{f.combinedStory}</Text>
        </LinearGradient>
      </View>

      <SectionHeader title="그래서 오늘은" />
      <ActionTabs good={f.goodActions} avoid={f.avoidActions} />

      <Text style={[txt.caption, { marginTop: 16, textAlign: 'center' }]}>
        {fortune.engine === 'ai' ? 'AI가 네 가지 결과를 종합했어요' : '종합 규칙 엔진으로 만든 결과예요'}
      </Text>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  commonBox: { marginTop: 20, backgroundColor: colors.lavenderSoft, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.lavender },
  commonLabel: { fontSize: 12, fontWeight: '700', color: colors.purpleSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  list: { marginTop: 12, backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: 18, ...shadow.card },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  itemTitle: { fontSize: 12, fontWeight: '800' },
  itemHeadline: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4, letterSpacing: -0.3, lineHeight: 21 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  tagText: { fontSize: 11, color: colors.inkMute, fontWeight: '600' },
  storyWrap: { marginTop: 24, borderRadius: radius.xl, backgroundColor: colors.purple },
  story: { borderRadius: radius.xl, padding: 22 },
  storyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storyLabel: { color: colors.moon, fontSize: 13, fontWeight: '700' },
  storyText: { color: colors.white, fontSize: 16, lineHeight: 27, marginTop: 12, letterSpacing: -0.2 },
});
