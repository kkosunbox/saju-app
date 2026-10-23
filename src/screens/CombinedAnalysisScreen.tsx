import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Screen from '../components/Screen';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { Logo } from '../components/Mascot';
import { useApp } from '../context/AppContext';
import { analysisTheme, colors, isDark, SourceKey } from '../theme/colors';
import { sansW, txt } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';
import { parseISO, weekdayOf } from '../utils/date';
import { useFortuneDraw, useMarkOpened } from '../services/content/opened';
import LoadingScreen from '../components/LoadingScreen';

const INK = isDark ? colors.ink : '#000000';
const TITLE = '오늘의 운세 · 종합풀이';
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const SOURCES: Record<SourceKey, { icon: number; color: string }> = {
  saju: { icon: require('../../assets/figma/combined/saju.svg'), color: '#FE8828' },
  thai: { icon: require('../../assets/figma/combined/thai.svg'), color: '#61AA4D' },
  mbti: { icon: require('../../assets/figma/combined/mbti.svg'), color: '#2885FE' },
  blood: { icon: require('../../assets/figma/combined/blood.svg'), color: '#E54D4D' },
};
const STORIES = [
  { icon: require('../../assets/figma/combined/flow.svg'), bg: '#F1FAFF' },
  { icon: require('../../assets/figma/combined/perspective.svg'), bg: '#FFFAF1' },
  { icon: require('../../assets/figma/combined/center.svg'), bg: '#F8FBF6' },
];

export default function CombinedAnalysisScreen() {
  const { fortune, today, fortuneWriting } = useApp();
  useMarkOpened('fortune');
  useFortuneDraw();
  if (!fortune) return null;
  if (fortuneWriting) return <LoadingScreen title={TITLE} message="네 가지 관점을 엮어 오늘의 이야기를 쓰고 있어요" />;
  const f = fortune.combined;
  const list = [fortune.analyses.saju, fortune.analyses.thai, fortune.analyses.mbti, fortune.analyses.blood];
  const common = new Set(f.commonKeywords);
  const sections = f.storySections?.length ? f.storySections : [{ title: '오늘의 이야기', body: f.combinedStory }];
  const tags = f.commonKeywords.length ? f.commonKeywords : f.keywords.slice(0, 1);
  const { m, d } = parseISO(today);

  return (
    <Screen title={TITLE} titleStyle={s.screenTitle} back contentStyle={s.content}>
      <View style={s.hero}>
        <Image source={require('../../assets/figma/combined/hero.png')} style={s.heroArt} contentFit="contain" />
        <View style={s.heroTop}>
          <Logo height={19} />
          <Text style={s.date}>{m}.{String(d).padStart(2, '0')} ({WEEK[weekdayOf(today)]})</Text>
        </View>
        <Text style={s.eyebrow}>네 가지 관점이 겹친 오늘</Text>
        <Text style={s.summary}>{f.summary}</Text>
        <View style={s.heroTags}>
          {tags.map(tag => <View key={tag} style={s.heroChip}><Text style={s.heroTag}>{tag}</Text></View>)}
        </View>
      </View>

      <SectionHeader variant="figma" title="관점별 한 줄" caption="겹친 키워드는 굵게 표시됩니다." />
      <View style={s.list}>
        {list.map((a, i) => {
          const source = SOURCES[a.source];
          return (
            <View key={a.source} style={[s.item, i > 0 && s.border]}>
              <View style={s.iconSlot}><Image source={source.icon} style={s.icon} contentFit="contain" /></View>
              <View style={s.itemCopy}>
                <Text style={s.itemTitle}>{analysisTheme[a.source].label}</Text>
                <Text style={s.itemHeadline}>{a.headline}</Text>
                <View style={s.tags}>
                  {a.tags.map(tag => {
                    const label = KEYWORDS[tag].label;
                    return <Text key={tag} style={[s.tagText, common.has(label) && { ...sansW('600'), color: source.color }]}>#{label}</Text>;
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <SectionHeader variant="figma" title="오늘 나에게 맞는 이야기" />
      <View style={s.stories}>
        {sections.map((section, i) => {
          const theme = STORIES[i % STORIES.length];
          return (
            <View key={`${i}-${section.title}`} style={[s.section, { backgroundColor: isDark ? colors.card : theme.bg }]}>
              <View style={s.sectionHead}>
                <Image source={theme.icon} style={s.icon} contentFit="contain" />
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={s.sectionBody}>{section.body}</Text>
            </View>
          );
        })}
      </View>

      <SectionHeader variant="figma" title="그래서 오늘은" />
      <ActionTabs good={f.goodActions} avoid={f.avoidActions} variant="figma" />
      <Text style={[txt.caption, s.caption]}>사주 · 점성술 · MBTI · 혈액형을 겹쳐 읽은 풀이예요</Text>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 0 },
  screenTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0, color: INK, includeFontPadding: false },
  hero: { minHeight: 140, borderRadius: 12, backgroundColor: '#18263D', overflow: 'hidden', paddingHorizontal: 16, paddingTop: 11, paddingBottom: 16 },
  heroArt: { position: 'absolute', right: 0, bottom: 0, width: 327, height: 140 },
  heroTop: { height: 19, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  date: { includeFontPadding: false, ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 5 },
  eyebrow: { includeFontPadding: false, ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 14 },
  summary: { includeFontPadding: false, ...sansW('700'), fontSize: 20, lineHeight: 18, letterSpacing: -1, color: '#FFFFFF', marginTop: 8 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16, paddingLeft: 2 },
  heroChip: { borderWidth: 0.5, borderColor: '#FFFFFF', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  heroTag: { includeFontPadding: false, ...sansW('600'), fontSize: 12, lineHeight: 14, color: '#FFFFFF', opacity: 0.8 },
  list: { backgroundColor: isDark ? colors.card : '#F5F6F8', borderRadius: 12, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, minHeight: 85 },
  border: { borderTopWidth: 1, borderTopColor: isDark ? colors.lineStrong : '#ECEEF2' },
  iconSlot: { marginTop: 12, width: 38, height: 38, borderRadius: 6, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 20, height: 20 },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { includeFontPadding: false, ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK },
  itemHeadline: { includeFontPadding: false, ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagText: { includeFontPadding: false, ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  stories: { gap: 16 },
  section: { borderRadius: 12, padding: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { includeFontPadding: false, ...sansW('600'), flex: 1, fontSize: 16, lineHeight: 20, letterSpacing: -0.8, color: INK },
  sectionBody: { includeFontPadding: false, ...sansW('400'), color: INK, fontSize: 13, lineHeight: 18, marginTop: 7, letterSpacing: -0.65 },
  caption: { marginTop: 16, textAlign: 'center' },
});
