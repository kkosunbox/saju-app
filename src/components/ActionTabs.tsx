import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Segmented from './Segmented';
import Card from './Card';
import Icon from './Icon';
import { colors } from '../theme/colors';

/** 해야 할 것 / 피할 것을 한 번에 하나만 보여줘 텍스트 양을 절반으로 */
export default function ActionTabs({ good, avoid }: { good: string[]; avoid: string[] }) {
  const [tab, setTab] = useState<'good' | 'avoid'>('good');
  const list = tab === 'good' ? good : avoid;
  const tone = tab === 'good' ? colors.success : colors.danger;
  return (
    <Card>
      <Segmented<'good' | 'avoid'> options={[{ key: 'good', label: '하면 좋은 것' }, { key: 'avoid', label: '피하면 좋은 것' }]} value={tab} onChange={setTab} />
      <View style={{ gap: 12, marginTop: 16 }}>
        {list.map(item => (
          <View key={item} style={s.row}>
            <View style={[s.mark, { backgroundColor: tone + '1A' }]}>
              <Icon name={tab === 'good' ? 'check' : 'close'} size={14} color={tone} strokeWidth={2.6} />
            </View>
            <Text style={s.item}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  item: { flex: 1, fontSize: 15, lineHeight: 21, color: colors.ink, fontWeight: '500', letterSpacing: -0.2 },
});
