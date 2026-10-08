import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';

export function emojiFor(label: string) {
  return Object.values(KEYWORDS).find(k => k.label === label)?.emoji ?? '✨';
}

type Tone = 'default' | 'strong' | 'onDark' | 'muted';

export default function KeywordChip({ label, tone = 'default', emoji = true, hash = false }: { label: string; tone?: Tone; emoji?: boolean; hash?: boolean }) {
  return (
    <View style={[s.chip, s[tone]]}>
      {emoji ? <Text style={s.emoji}>{emojiFor(label)}</Text> : null}
      <Text style={[s.text, tone === 'strong' || tone === 'onDark' ? { color: colors.white } : tone === 'muted' ? { color: colors.inkMute, fontWeight: '600', fontSize: 12 } : null]}>
        {hash ? '#' : ''}{label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  default: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  strong: { backgroundColor: colors.purple },
  onDark: { backgroundColor: 'rgba(255,255,255,0.14)' },
  muted: { backgroundColor: colors.cream, paddingHorizontal: 10, paddingVertical: 5 },
  emoji: { fontSize: 13 },
  text: { fontSize: 13, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
});
