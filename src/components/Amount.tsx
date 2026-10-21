import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import Mascot from './Mascot';

/** 재화 아이콘 — 마스코트 '알'. 예전 P 동전 자리. 그림 둘레 여백만큼 조금 크게 그린다 */
export function Coin({ size = 14 }: { size?: number }) {
  return <Mascot size={Math.round(size * 1.2)} style={{ marginVertical: -size * 0.1 }} />;
}

/** 숫자 옆 금액: [마스코트]100 — '알' 글자 대신 아이콘. sign: '+' · '−' */
export function Amount({ value, size = 14, sign = '', style, after }: { value: number; size?: number; sign?: string; style?: StyleProp<TextStyle>; after?: string }) {
  return (
    <View style={s.amount}>
      {sign ? <Text style={style}>{sign}</Text> : null}
      <Coin size={size} />
      <Text style={style}>{value.toLocaleString('ko-KR')}{after ?? ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  amount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
