import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import ScoreBar from './ScoreBar';
import Icon from './Icon';
import { CategoryKey, categoryTheme, colors } from '../theme/colors';
import Ico from './Ico';
import { fonts } from '../theme/typography';

/** 분야별 운세 한 줄: 아이콘 · 이름 · 점수 · 막대 · 한 문장 */
export default function CategoryRow({ category, score, text, onPress, delay, badge, lines = 1 }: { category: CategoryKey; score: number; text?: string; onPress(): void; delay?: number; badge?: string; lines?: number }) {
  const t = categoryTheme[category];
  return (
    <PressableScale onPress={onPress} style={s.row} accessibilityLabel={`${t.label} ${score}점`}>
      <Ico ch={t.emoji} size={42} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={s.head}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.label}>{t.label}</Text>
            {badge ? <View style={[s.badge, { backgroundColor: t.bg }]}><Text style={[s.badgeText, { color: t.color }]}>{badge}</Text></View> : null}
          </View>
          <Text style={[s.score, { color: t.color }]}>{score}</Text>
        </View>
        <ScoreBar value={score} color={t.color} delay={delay} />
        {text ? <Text style={[s.text, lines > 1 && { lineHeight: 19 }]} numberOfLines={lines}>{text}</Text> : null}
      </View>
      <Icon name="chevronRight" size={18} color={colors.inkMute} />
    </PressableScale>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  score: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  text: { fontSize: 13.5, lineHeight: 20, color: colors.inkSub },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
