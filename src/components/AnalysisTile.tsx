import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { AnalysisResult } from '../types';
import { analysisTheme, colors } from '../theme/colors';
import { fonts, radius, shadow, sansW } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

const KICKER = { saju: '四柱', thai: '七曜', mbti: '性向', blood: '血型' } as const;
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/**
 * 4가지 관점 타일 — 작은 책력 쪽지.
 * 한자 제호 · 비스듬한 관점 낙관 · 명조 한 줄 · 도장형 키워드 · 점선 아래 '자세히'.
 */
export default function AnalysisTile({ analysis, onPress }: { analysis: AnalysisResult; onPress(): void }) {
  const t = analysisTheme[analysis.source];
  return (
    <PressableScale onPress={onPress} style={[s.tile, shadow.card]} accessibilityLabel={`${t.label}: ${analysis.headline}`}>
      <View style={[s.seal, { backgroundColor: t.color }]}><Text style={s.sealText}>{t.emoji}</Text></View>
      <Text style={[s.kicker, { color: t.color }]}>{KICKER[analysis.source]}</Text>
      <Text style={s.label}>{t.label} · {t.sub}</Text>
      <Text style={[s.headline, KEEP]} numberOfLines={3}>{analysis.headline}</Text>
      <View style={s.foot}>
        <View style={[s.tag, { borderColor: t.color }]}>
          <Text style={[s.tagText, { color: t.color }]}>{KEYWORDS[analysis.tags[0]].label}</Text>
        </View>
        <Text style={s.more}>자세히 ›</Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line, minHeight: 176 },
  seal: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 3, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  sealText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 20, fontWeight: '700', color: '#FBF4E8' },
  kicker: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  label: { fontSize: 12, color: colors.inkMute, fontWeight: '600', marginTop: 2 },
  headline: { ...sansW('700'), fontSize: 15, lineHeight: 21, color: colors.ink, letterSpacing: -0.3, marginTop: 12, flex: 1 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.lineStrong, borderStyle: 'dashed' },
  tag: { borderWidth: 1.2, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2, transform: [{ rotate: '-1.5deg' }] },
  tagText: { fontSize: 11.5, fontWeight: '800' },
  more: { fontSize: 12, fontWeight: '700', color: colors.inkMute },
});
