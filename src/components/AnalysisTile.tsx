import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { AnalysisResult } from '../types';
import { analysisTheme, colors } from '../theme/colors';
import { radius, shadow } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

/** 4가지 분석 타일 — 관점마다 고유 색·아이콘 배경으로 즉시 구분 */
export default function AnalysisTile({ analysis, onPress }: { analysis: AnalysisResult; onPress(): void }) {
  const t = analysisTheme[analysis.source];
  return (
    <PressableScale onPress={onPress} style={[s.tile, shadow.card]} accessibilityLabel={`${t.label}: ${analysis.headline}`}>
      <View style={[s.band, { backgroundColor: t.color }]} />
      <View style={s.head}>
        <View style={[s.icon, { backgroundColor: t.bg }]}><Text style={{ fontSize: 18 }}>{t.emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: t.color }]}>{t.label}</Text>
          <Text style={s.sub}>{t.sub}</Text>
        </View>
      </View>
      <Text style={s.headline} numberOfLines={2}>{analysis.headline}</Text>
      <View style={[s.tag, { backgroundColor: t.bg }]}>
        <Text style={[s.tagText, { color: t.color }]}>#{KEYWORDS[analysis.tags[0]].label}</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, paddingTop: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong, minHeight: 168 },
  band: { position: 'absolute', top: 0, left: 18, width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 11, color: colors.inkMute, marginTop: 1 },
  headline: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, marginTop: 14, flex: 1 },
  tag: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, marginTop: 12 },
  tagText: { fontSize: 11, fontWeight: '700' },
});
