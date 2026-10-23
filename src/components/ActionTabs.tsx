import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Segmented from './Segmented';
import Icon from './Icon';
import { colors, isDark } from '../theme/colors';
import { ACTION_NOTE } from '../data/keywords';
import { sansW } from '../theme/typography';

/** 해야 할 것 / 피할 것을 한 번에 하나만 — 행동마다 다정한 한마디를 "행동 — 한마디"로 */
export default function ActionTabs({ good, avoid, variant = 'default' }: { good: string[]; avoid: string[]; variant?: 'default' | 'figma' }) {
  const [tab, setTab] = useState<'good' | 'avoid'>('good');
  const list = tab === 'good' ? good : avoid;
  const isGood = tab === 'good';
  return (
    <View>
      <Segmented<'good' | 'avoid'> options={[{ key: 'good', label: '하면 좋은 것' }, { key: 'avoid', label: '피하면 좋은 것' }]} value={tab} onChange={setTab} variant={variant} />
      <View style={[s.list, variant === 'figma' && s.figmaList]}>
        {list.map(item => (
          <View key={item} style={[s.row, variant === 'figma' && s.figmaRow]}>
            <View style={[s.mark, variant === 'figma' && s.figmaMark, { backgroundColor: isGood ? colors.accentSoft : colors.loveBg }]}>
              <Icon name={isGood ? 'check' : 'close'} size={12} color={isGood ? colors.accent : colors.love} strokeWidth={3} />
            </View>
            <Text style={[s.item, variant === 'figma' && s.figmaItem]}>
              {item}
              {ACTION_NOTE[item] ? <Text style={variant === 'figma' ? undefined : s.note}> — {ACTION_NOTE[item]}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 12, marginTop: 16, paddingHorizontal: 4 },
  figmaList: { gap: 0 },
  figmaRow: { gap: 8 },
  figmaMark: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mark: { marginTop: 1, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  item: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.ink, fontWeight: '600', letterSpacing: -0.5 },
  note: { fontWeight: '500', color: colors.inkSub },
  figmaItem: { ...sansW('600'), fontSize: 12, lineHeight: 32, letterSpacing: -0.48, color: isDark ? colors.ink : '#000000', includeFontPadding: false },
});
