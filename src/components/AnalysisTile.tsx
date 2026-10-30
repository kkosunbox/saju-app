import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import { HomeAnalysisArt, HomeOutlineIcon } from './home/HomeDesignAssets';
import { AnalysisResult } from '../types';
import { analysisTheme, colors, isDark } from '../theme/colors';
import { radius, sansW } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/**
 * 4가지 관점 타일 — 관점마다 다른 파스텔 그라디언트와 마스코트 포즈.
 * 관점 이름 · 한 줄 결과 · 키워드 칩 · › 동그라미.
 */
export default function AnalysisTile({ analysis, onPress, sealed }: { analysis: AnalysisResult; onPress(): void; sealed?: boolean }) {
  const t = analysisTheme[analysis.source];
  const tile = !isDark && analysis.source === 'saju' ? analysisTheme.thai.tile
    : !isDark && analysis.source === 'thai' ? analysisTheme.saju.tile : t.tile;
  return (
    <PressableScale onPress={onPress} disabled={sealed} style={s.wrap} scaleTo={0.97} accessibilityLabel={sealed ? `${t.label}, 오늘의 운세를 뽑으면 보여요` : `${t.label}: ${analysis.headline}`}>
      <LinearGradient colors={tile} style={s.tile}>
        <HomeAnalysisArt source={analysis.source} />
        <Text style={s.label} numberOfLines={1}>{t.label} · {t.sub}</Text>
        <Text style={[s.headline, KEEP, sealed && { color: colors.inkMute }]} numberOfLines={3}>{sealed ? '오늘의 운세를 뽑으면 보여요' : analysis.headline}</Text>
        <View style={s.foot}>
          {sealed ? <View /> : (
            <View style={[s.tag, { borderColor: t.color }]}>
              <Text style={[s.tagText, { color: t.color }]}>{KEYWORDS[analysis.tags[0]].label}</Text>
            </View>
          )}
          <View style={s.more}><HomeOutlineIcon name="chevronRight" size={20} color={colors.inkMute} /></View>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  tile: { height: 140, borderRadius: radius.lg, padding: 16, overflow: 'hidden' },
  label: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: colors.inkMute, letterSpacing: -0.65, includeFontPadding: false },
  headline: { ...sansW('700'), fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: -0.56, marginTop: 4, maxWidth: 121, includeFontPadding: false },
  foot: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  // Figma의 내부 선 0.5px를 패딩 안에 포함해 내용 시작점을 4px로 맞춘다.
  tag: { height: 18, borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 3.5, justifyContent: 'center' },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: 0, opacity: 0.8, includeFontPadding: false },
  more: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
