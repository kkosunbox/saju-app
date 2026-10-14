import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

/** 키워드 → 한자 도장 (新 · 變 · 機 …) */
export function emojiFor(label: string) {
  return Object.values(KEYWORDS).find(k => k.label === label)?.emoji ?? '新';
}

type Tone = 'default' | 'strong' | 'onDark' | 'muted';

/** 책력: 칩 안에서는 도장을 생략하고 글자만 */
export default function KeywordChip({ label, tone = 'default', hash = false }: { label: string; tone?: Tone; emoji?: boolean; hash?: boolean }) {
  return (
    <View style={[s.chip, s[tone]]}>
      <Text style={[s.text, tone === 'strong' || tone === 'onDark' ? { color: colors.white } : tone === 'muted' ? { color: colors.inkMute, fontSize: 12 } : null]}>
        {hash ? '#' : ''}{label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.xs },
  default: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  strong: { backgroundColor: colors.navy },
  onDark: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  muted: { backgroundColor: colors.cream, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontSize: 13, fontWeight: '600', color: colors.ink, letterSpacing: -0.2 },
});
