import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import ScoreBar from './ScoreBar';
import Icon from './Icon';
import CategoryIcon from './CategoryIcon';
import { CategoryKey, categoryTheme, colors, isDark } from '../theme/colors';
import { radius } from '../theme/typography';

/**
 * 분야별 운세 카드 한 장: 아이콘 · 이름 · (최고의 날) · 점수 · 막대 · 풀이.
 * onPress가 있으면(오늘) 한 줄만 보이고 › 동그라미로 상세 화면에 간다. 없으면(주간·월간·연간) 풀이를 다 펼쳐 둔다.
 */
export default function CategoryRow({ category, score, text, onPress, delay, badge }: { category: CategoryKey; score: number; text?: string; onPress?(): void; delay?: number; badge?: string }) {
  const t = categoryTheme[category];
  const body = (
    <>
      <CategoryIcon category={category} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={s.head}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            <Text style={s.label}>{t.label}</Text>
            {badge ? <View style={s.badge}><Text style={[s.badgeText, { color: t.color }]}>{badge}</Text></View> : null}
          </View>
          <Text style={[s.score, { color: t.color }]}>{score}</Text>
        </View>
        <ScoreBar value={score} color={t.color} track={isDark ? colors.lineStrong : '#E2E2E2'} delay={delay} />
        {text ? <Text style={s.text} numberOfLines={onPress ? 1 : undefined}>{text}</Text> : null}
      </View>
      {onPress ? <View style={s.chev}><Icon name="chevronRight" size={18} color={colors.inkSub} strokeWidth={2} /></View> : null}
    </>
  );
  if (!onPress) return <View style={s.row} accessible accessibilityLabel={`${t.label} ${score}점`}>{body}</View>;
  return <PressableScale onPress={onPress} style={s.row} scaleTo={0.98} accessibilityLabel={`${t.label} ${score}점`}>{body}</PressableScale>;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  score: { fontSize: 14, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  text: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface },
  badgeText: { fontSize: 12, fontWeight: '600', letterSpacing: -0.4 },
  chev: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
