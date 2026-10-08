import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from './PressableScale';
import ScoreRing from './ScoreRing';
import ScoreBar from './ScoreBar';
import Stars from './Stars';
import KeywordChip from './KeywordChip';
import Icon from './Icon';
import { CombinedFortune } from '../types';
import { CategoryKey, categoryTheme, colors, gradients } from '../theme/colors';
import { radius, shadow } from '../theme/typography';

const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];

interface Props { fortune: CombinedFortune; onOpenStory(): void; onOpenCategory(c: CategoryKey): void }

/**
 * 홈의 전부를 한 카드에: 종합 점수 → 한 줄 요약 → 키워드 → 분야별 점수.
 * 스크롤 없이 첫 화면에서 오늘의 운세를 읽을 수 있게 한다.
 */
export default function TodayHero({ fortune: f, onOpenStory, onOpenCategory }: Props) {
  return (
    <View style={[s.shadowWrap, shadow.hero]}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.card}>
        <View style={s.glow} />
        <View style={[s.dot, { top: 22, right: 30 }]} />
        <View style={[s.dot, { top: 58, right: 72, width: 2, height: 2, opacity: 0.5 }]} />

        <PressableScale onPress={onOpenStory} scaleTo={0.985} accessibilityLabel={`오늘의 종합운 ${f.totalScore}점, ${f.summary} 자세히 보기`}>
          <View style={s.top}>
            <ScoreRing score={f.totalScore} size={116} stroke={8} />
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>오늘의 종합운</Text>
              <Stars score={f.totalScore} />
              <Text style={s.summary} numberOfLines={3}>{f.summary}</Text>
              <View style={s.more}>
                <Text style={s.moreText}>종합 풀이</Text>
                <Icon name="chevronRight" size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
              </View>
            </View>
          </View>
          <View style={s.chips}>
            {f.keywords.map(k => <KeywordChip key={k} label={k} tone="onDark" />)}
          </View>
        </PressableScale>

        <View style={s.divider} />

        <View style={s.cats}>
          {CATS.map((c, i) => {
            const t = categoryTheme[c];
            return (
              <PressableScale key={c} style={s.cat} onPress={() => onOpenCategory(c)} scaleTo={0.93} accessibilityLabel={`${t.label} ${f[c]}점`}>
                <Text style={s.catLabel}>{t.emoji} {t.short}</Text>
                <Text style={s.catScore}>{f[c]}</Text>
                <ScoreBar value={f[c]} color={t.color} track="rgba(255,255,255,0.14)" height={4} delay={500 + i * 80} />
              </PressableScale>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  shadowWrap: { borderRadius: radius.xl, backgroundColor: colors.purple },
  card: { borderRadius: radius.xl, padding: 20, overflow: 'hidden' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFFFFF', opacity: 0.05, top: -90, left: -60 },
  dot: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#fff', opacity: 0.7 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  summary: { color: colors.white, fontSize: 17, lineHeight: 24, fontWeight: '700', letterSpacing: -0.4, marginTop: 6 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  moreText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)', marginVertical: 16 },
  cats: { flexDirection: 'row', gap: 12 },
  cat: { flex: 1, gap: 4 },
  catLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600' },
  catScore: { color: colors.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
});
