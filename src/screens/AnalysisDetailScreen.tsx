import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { analysisTheme, colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';
import { AnalysisResult } from '../types';

const NOTE: Record<string, string> = {
  saju: '양력 기준 근사 만세력으로 계산해요. 정밀 계산은 업데이트 예정이에요.',
  thai: '태어난 요일의 수호 행성과 오늘 행성의 관계로 풀어요.',
  mbti: 'MBTI는 예측이 아닌 성향 분석이에요.',
  blood: '혈액형 성격론은 재미를 위한 콘텐츠예요.',
};

export default function AnalysisDetailScreen() {
  const params = useLocalSearchParams<{ source: AnalysisResult['source'] }>();
  const { fortune } = useApp();
  if (!fortune) return null;
  const a = fortune.analyses[params.source];
  const t = analysisTheme[params.source];

  return (
    <Screen title={t.label} back>
      <View style={[s.hero, { backgroundColor: t.bg }]}>
        <View style={s.emoji}><Text style={{ fontSize: 30 }}>{t.emoji}</Text></View>
        <Text style={[s.sub, { color: t.color }]}>{t.sub}</Text>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 6 }]}>{a.headline}</Text>
        <View style={s.tags}>
          {a.tags.map(tag => (
            <View key={tag} style={[s.tag, { backgroundColor: colors.white }]}>
              <Text style={[s.tagText, { color: t.color }]}>{KEYWORDS[tag].emoji} {KEYWORDS[tag].label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Card style={{ marginTop: 12 }}>
        <Text style={txt.body}>{a.description}</Text>
      </Card>

      <SectionHeader title="분석 내용" />
      <Card style={{ paddingVertical: 4 }}>
        {a.details.map((d, i) => (
          <View key={d.label} style={[s.row, i > 0 && s.border]}>
            <Text style={s.label}>{d.label}</Text>
            <Text style={s.value}>{d.value}</Text>
          </View>
        ))}
      </Card>

      <Text style={[txt.caption, { marginTop: 16, textAlign: 'center' }]}>{NOTE[a.source]}</Text>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: 24, alignItems: 'center', marginTop: 4 },
  emoji: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 12, fontWeight: '700', marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14 },
  tag: { borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  tagText: { fontSize: 12, fontWeight: '700' },
  row: { paddingVertical: 14, gap: 4 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  label: { fontSize: 12, color: colors.inkMute, fontWeight: '600' },
  value: { fontSize: 15, color: colors.ink, fontWeight: '600', lineHeight: 22 },
});
