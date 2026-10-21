import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import Icon from './Icon';
import Mascot from './Mascot';
import { AnalysisResult } from '../types';
import { analysisTheme, colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const POSE = { saju: 'pose-saju', thai: 'pose-thai', mbti: 'pose-mbti', blood: 'pose-blood' } as const;

/**
 * 4가지 관점 타일 — 관점마다 다른 파스텔 그라디언트와 마스코트 포즈.
 * 관점 이름 · 한 줄 결과 · 키워드 칩 · › 동그라미.
 */
export default function AnalysisTile({ analysis, onPress, sealed }: { analysis: AnalysisResult; onPress(): void; sealed?: boolean }) {
  const t = analysisTheme[analysis.source];
  return (
    <PressableScale onPress={onPress} disabled={sealed} style={s.wrap} scaleTo={0.97} accessibilityLabel={sealed ? `${t.label}, 오늘의 운세를 뽑으면 보여요` : `${t.label}: ${analysis.headline}`}>
      <LinearGradient colors={t.tile} style={s.tile}>
        <Mascot name={POSE[analysis.source]} size={64} style={s.art} />
        <Text style={s.label} numberOfLines={1}>{t.label} · {t.sub}</Text>
        <Text style={[s.headline, KEEP, sealed && { color: colors.inkMute }]} numberOfLines={3}>{sealed ? '오늘의 운세를 뽑으면 보여요' : analysis.headline}</Text>
        <View style={s.foot}>
          {sealed ? <View /> : (
            <View style={[s.tag, { borderColor: t.color }]}>
              <Text style={[s.tagText, { color: t.color }]}>{KEYWORDS[analysis.tags[0]].label}</Text>
            </View>
          )}
          <View style={s.more}><Icon name="chevronRight" size={18} color={colors.ink} strokeWidth={2} /></View>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  tile: { height: 140, borderRadius: radius.lg, padding: 16, overflow: 'hidden' },
  art: { position: 'absolute', right: 6, top: 38 },
  label: { fontSize: 13, lineHeight: 18, color: colors.inkMute, fontWeight: '500', letterSpacing: -0.6 },
  headline: { ...sansW('700'), fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: -0.5, marginTop: 8, paddingRight: 36 },
  foot: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  tag: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  tagText: { fontSize: 12, fontWeight: '600', opacity: 0.85 },
  more: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
