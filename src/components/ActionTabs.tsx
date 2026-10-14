import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Segmented from './Segmented';
import Card from './Card';
import Icon from './Icon';
import { colors } from '../theme/colors';
import { ACTION_NOTE } from '../data/keywords';

/** 해야 할 것 / 피할 것을 한 번에 하나만 — 행동마다 다정한 한마디를 함께 */
export default function ActionTabs({ good, avoid }: { good: string[]; avoid: string[] }) {
  const [tab, setTab] = useState<'good' | 'avoid'>('good');
  const list = tab === 'good' ? good : avoid;
  const tone = tab === 'good' ? colors.success : colors.danger;
  return (
    <Card>
      <Segmented<'good' | 'avoid'> options={[{ key: 'good', label: '하면 좋은 것' }, { key: 'avoid', label: '피하면 좋은 것' }]} value={tab} onChange={setTab} />
      <View style={{ gap: 16, marginTop: 16 }}>
        {list.map(item => (
          <View key={item} style={s.row}>
            <View style={[s.mark, { backgroundColor: tone + '1A' }]}>
              <Icon name={tab === 'good' ? 'check' : 'close'} size={14} color={tone} strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.item}>{item}</Text>
              {ACTION_NOTE[item] ? <Text style={s.note}>{ACTION_NOTE[item]}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mark: { marginTop: 1, width: 24, height: 24, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  item: { fontSize: 15, lineHeight: 21, color: colors.ink, fontWeight: '600', letterSpacing: -0.2 },
  note: { fontSize: 13.5, lineHeight: 20, color: colors.inkSub, marginTop: 3 },
});
