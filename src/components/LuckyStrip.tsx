import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { CombinedFortune } from '../types';
import { colors } from '../theme/colors';

export default function LuckyStrip({ f }: { f: CombinedFortune }) {
  return (
    <Card style={s.card}>
      <View style={s.item}>
        <View style={[s.swatch, { backgroundColor: f.luckyColorHex }]} />
        <Text style={s.value}>{f.luckyColor}</Text>
        <Text style={s.label}>행운의 색</Text>
      </View>
      <View style={s.div} />
      <View style={s.item}>
        <Text style={s.big}>{f.luckyNumber}</Text>
        <Text style={s.label}>행운의 숫자</Text>
      </View>
      <View style={s.div} />
      <View style={s.item}>
        <Text style={[s.big, { fontSize: 15 }]}>{f.luckyTime.replace('~', ' – ')}</Text>
        <Text style={s.label}>행운의 시간</Text>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  div: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: colors.lineStrong },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.white, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  value: { fontSize: 13, fontWeight: '700', color: colors.ink },
  big: { fontSize: 20, fontWeight: '800', color: colors.purple, height: 24, lineHeight: 24, fontVariant: ['tabular-nums'] },
  label: { fontSize: 11, color: colors.inkMute, fontWeight: '500' },
});
