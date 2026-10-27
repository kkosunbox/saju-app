import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import BrandMark, { BRAND } from './BrandMark';
import { BUSINESS } from '../content/business';
import { colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

/** 사업자 정보 푸터 — 결제를 웹에서만 받으므로 웹에서만 그린다 */
export default function BusinessFooter({ style }: { style?: object }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={[s.wrap, style]}>
      <View style={s.head}>
        <BrandMark size={16} />
        <View style={s.links}>
          {/* <a href> 로 그려 검색엔진도 따라간다 */}
          <Link href="/legal/terms" style={s.link}>이용약관</Link>
          <View style={s.bar} />
          <Link href="/legal/privacy" style={s.link}>개인정보처리방침</Link>
        </View>
      </View>
      <View style={s.card}>
        {BUSINESS.map(([k, v]) => (
          <View key={k} style={s.row}>
            <Text style={s.key}>{k}</Text>
            <Text style={s.value}>{v}</Text>
          </View>
        ))}
      </View>
      <Text style={s.copy}>© {BRAND.name}. All rights reserved.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 24, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  head: { marginHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { ...sansW('600'), fontSize: 12, letterSpacing: -0.3, color: colors.inkSub },
  bar: { width: StyleSheet.hairlineWidth, height: 10, backgroundColor: colors.lineStrong },
  card: { marginTop: 16, padding: 14, gap: 6, borderRadius: radius.lg, backgroundColor: colors.card },
  row: { flexDirection: 'row', gap: 10 },
  key: { ...sansW('600'), width: 112, fontSize: 11, lineHeight: 16, letterSpacing: -0.2, color: colors.inkMute },
  value: { ...sansW('400'), flex: 1, fontSize: 11, lineHeight: 16, letterSpacing: -0.2, color: colors.inkSub },
  copy: { ...sansW('400'), marginTop: 14, fontSize: 11, letterSpacing: -0.2, color: colors.inkMute, textAlign: 'center' },
});
