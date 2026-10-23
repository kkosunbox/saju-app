import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { BRAND } from './BrandMark';
import { BUSINESS } from '../content/business';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

/** 사업자 정보 푸터 — 결제를 웹에서만 받으므로 웹에서만 그린다 */
export default function BusinessFooter({ style }: { style?: object }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={[s.wrap, style]}>
      <View style={s.links}>
        {/* <a href> 로 그려 검색엔진도 따라간다 */}
        <Link href="/legal/terms" style={s.link}>이용약관</Link>
        <Link href="/legal/privacy" style={[s.link, s.strong]}>개인정보처리방침</Link>
      </View>
      <View style={s.info}>
        {BUSINESS.map(([k, v]) => <Text key={k} style={txt.caption}>{k}: {v}</Text>)}
      </View>
      <Text style={[txt.caption, { marginTop: 8 }]}>© {BRAND.name}. All rights reserved.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  links: { flexDirection: 'row', gap: 16 },
  link: { fontSize: 13, fontWeight: '600', color: colors.inkSub, textDecorationLine: 'underline' },
  strong: { fontWeight: '700' },
  info: { marginTop: 10, gap: 2 },
});
