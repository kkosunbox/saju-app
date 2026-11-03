import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import BrandMark, { BRAND } from './BrandMark';
import Icon from './Icon';
import SolidIcon from './SolidIcon';
import { BUSINESS } from '../content/business';
import { colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

const SOCIAL = [
  { key: 'instagram', label: '운Pick 인스타그램', url: 'https://www.instagram.com/woonpick.official/' },
  { key: 'kakao', label: '운Pick 카카오톡 채널', url: 'http://pf.kakao.com/_MiaWX' },
] as const;

function SocialGlyph({ name, color }: { name: (typeof SOCIAL)[number]['key']; color: string }) {
  if (name === 'instagram') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={18} height={18} rx={5.5} stroke={color} strokeWidth={1.8} />
        <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={1.8} />
        <Circle cx={17.3} cy={6.7} r={1.15} fill={color} />
      </Svg>
    );
  }
  // 카카오톡 말풍선
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 3.6c-5.13 0-9.3 3.27-9.3 7.31 0 2.6 1.73 4.88 4.34 6.18l-.9 3.3c-.08.3.26.54.52.37l3.94-2.6c.45.05.91.07 1.4.07 5.13 0 9.3-3.27 9.3-7.31S17.13 3.6 12 3.6z"
      />
    </Svg>
  );
}

/** 사업자 정보 푸터 — 결제를 웹에서만 받으므로 웹에서만 그린다. 사업자 정보는 접혀 있다가 눌러서 펼친다 */
export default function BusinessFooter({ style }: { style?: object }) {
  const [open, setOpen] = useState(false);
  if (Platform.OS !== 'web') return null;
  return (
    <View style={[s.wrap, style]}>
      <View style={s.head}>
        <BrandMark size={14} />
        <View style={s.links}>
          {/* <a href> 로 그려 검색엔진도 따라간다 */}
          <Link href="/legal/terms" style={s.link}>이용약관</Link>
          <View style={s.bar} />
          <Link href="/legal/privacy" style={s.link}>개인정보처리방침</Link>
        </View>
      </View>
      <Pressable
        onPress={() => setOpen(v => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[s.toggle, open && s.toggleOpen]}
      >
        <View style={s.toggleLabel}>
          <SolidIcon name="documentText" size={16} color={colors.accent} />
          <Text style={s.toggleText}>사업자 정보</Text>
        </View>
        <View style={open && s.flip}>
          <Icon name="chevronDown" size={16} color={colors.inkMute} strokeWidth={1.5} />
        </View>
      </Pressable>
      {open && (
        <View style={s.card}>
          {BUSINESS.map(([k, v]) => (
            <View key={k} style={s.row}>
              <Text style={s.key}>{k}</Text>
              <Text style={s.value}>{v}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={s.social}>
        {SOCIAL.map(item => (
          // react-native-web 이 href·hrefAttrs 로 새 탭에 여는 <a> 를 그린다
          <Pressable
            key={item.key}
            {...({ href: item.url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } as object)}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            style={({ hovered }: { hovered?: boolean }) => [s.socialBtn, hovered && s.socialBtnHover]}
          >
            <SocialGlyph name={item.key} color={colors.inkSub} />
          </Pressable>
        ))}
      </View>
      <Text style={s.copy}>© {BRAND.name}. All rights reserved.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 26, paddingBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { ...sansW('700'), fontSize: 12, lineHeight: 20, letterSpacing: -0.48, color: colors.ink },
  bar: { width: 1, height: 14, backgroundColor: colors.lineStrong },
  toggle: {
    marginTop: 20, height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.lg,
  },
  toggleOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  toggleLabel: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 4 },
  toggleText: { ...sansW('700'), fontSize: 13, lineHeight: 20, letterSpacing: -0.52, color: colors.ink },
  flip: { transform: [{ rotate: '180deg' }] },
  card: {
    padding: 16, gap: 3, backgroundColor: colors.card,
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.lineStrong,
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
  },
  row: { flexDirection: 'row', gap: 8 },
  key: { ...sansW('600'), width: 119, fontSize: 11, lineHeight: 20, letterSpacing: -0.44, color: colors.inkSub },
  value: { ...sansW('400'), flex: 1, fontSize: 11, lineHeight: 20, letterSpacing: -0.44, color: colors.inkSub },
  social: { marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  socialBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
  },
  socialBtnHover: { borderColor: colors.lineStrong, backgroundColor: colors.surface },
  copy: { ...sansW('500'), marginTop: 16, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, textAlign: 'center' },
});
