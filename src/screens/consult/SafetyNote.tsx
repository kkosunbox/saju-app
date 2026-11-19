import React from 'react';
import { Linking, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import PressableScale from '../../components/PressableScale';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/typography';

/** 위기 상담 전화 — 대화에서 위기 신호가 보일 때만 보여 준다 */
const HOTLINES: [string, string][] = [
  ['자살예방 상담전화', '109'],
  ['정신건강 위기상담', '1577-0199'],
  ['청소년 상담', '1388'],
];
const call = (num: string) => Linking.openURL(`tel:${num.replace(/-/g, '')}`).catch(() => {});

/** 대화에서 위기 신호가 보이면 답변 위에 고정해서 보여 주는 상담 전화 카드 */
export function CrisisCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, style]} accessibilityRole="summary">
      <Text style={s.cardT}>혼자 견디지 않아도 괜찮아요</Text>
      <Text style={s.cardD}>지금 많이 힘들다면 전문 상담사와 바로 이야기해 보세요. 24시간 언제든 받아요.</Text>
      <View style={s.lines}>
        {HOTLINES.map(([label, num]) => (
          <PressableScale key={num} onPress={() => call(num)} style={s.line} scaleTo={0.97} accessibilityLabel={`${label} ${num}에 전화하기`}>
            <Text style={s.lineK}>{label}</Text>
            <Text style={s.lineV}>{num}</Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  cardT: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  cardD: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.inkSub, letterSpacing: -0.5 },
  lines: { marginTop: 12, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.card },
  lineK: { fontSize: 13, fontWeight: '600', color: colors.ink, letterSpacing: -0.5 },
  lineV: { fontSize: 15, fontWeight: '700', color: colors.accent, letterSpacing: -0.3 },
});
