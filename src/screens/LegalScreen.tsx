import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../components/Screen';
import { RootStackParamList } from '../navigation/types';
import { LEGAL, LEGAL_UPDATED } from '../content/legal';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** 이용약관 · 개인정보처리방침 */
export default function LegalScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Legal'>>();
  const d = LEGAL[params.doc];
  return (
    <Screen title={d.title} back>
      <Text style={[txt.caption, { marginBottom: 8 }]}>운Pick · 시행일 {LEGAL_UPDATED}</Text>
      {d.sections.map(([h, b]) => (
        <View key={h} style={s.sec}>
          <Text style={s.h}>{h}</Text>
          <Text style={s.b}>{b}</Text>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  sec: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  h: { fontSize: 15, fontWeight: '700', color: colors.ink },
  b: { fontSize: 14, lineHeight: 22, color: colors.inkSub, marginTop: 6 },
});
