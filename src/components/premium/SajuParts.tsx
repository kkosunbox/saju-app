import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, isDark } from '../../theme/colors';
import { sansW } from '../../theme/typography';
import { SrcKey } from '../../types/premium';

const ICONS = {
  user: require('../../../assets/figma/saju/user.svg'),
  heart: require('../../../assets/figma/saju/heart.svg'),
  puzzle: require('../../../assets/figma/saju/puzzle.svg'),
  database: require('../../../assets/figma/saju/database.svg'),
  work: require('../../../assets/figma/saju/work.svg'),
  people: require('../../../assets/figma/saju/people.svg'),
  health: require('../../../assets/figma/saju/health.svg'),
  'luck-color': require('../../../assets/figma/saju/luck-color.svg'),
  'luck-number': require('../../../assets/figma/saju/luck-number.svg'),
  'luck-direction': require('../../../assets/figma/saju/luck-direction.svg'),
  'luck-season': require('../../../assets/figma/saju/luck-season.svg'),
  'luck-food': require('../../../assets/figma/saju/luck-food.svg'),
  'luck-items': require('../../../assets/figma/saju/luck-items.svg'),
  'luck-activity': require('../../../assets/figma/saju/luck-activity.svg'),
  saju: require('../../../assets/figma/saju/saju.svg'),
  thai: require('../../../assets/figma/saju/thai.svg'),
  mbti: require('../../../assets/figma/saju/mbti.svg'),
  blood: require('../../../assets/figma/saju/blood.svg'),
};
export type SajuIconName = keyof typeof ICONS;

/** Keep exported vector dimensions inside the design's icon slot. */
export function SajuIcon({ name }: { name: SajuIconName }) {
  const [width, height] = name === 'work' ? [13, 13.0002] : name === 'people' ? [15, 11.0005]
    : name === 'luck-items' ? [12.8, 11.2] : name.startsWith('luck-') ? [16, 16] : [20, 20];
  return <View style={{ width: name.startsWith('luck-') ? 16 : 20, height: name.startsWith('luck-') ? 16 : 20, alignItems: 'center', justifyContent: 'center' }}><Image source={ICONS[name]} style={{ width, height }} contentFit="contain" /></View>;
}

export const SOURCE_TONES: Record<SrcKey, string> = { saju: '#FE8828', thai: '#61AA4D', mbti: '#2885FE', blood: '#E54D4D' };
export function SourceMark({ source }: { source: SrcKey }) {
  return <View style={[s.sourceMark, { borderColor: SOURCE_TONES[source] }]}><SajuIcon name={source} /></View>;
}

export function SajuHeading({ title, icon, small = false }: { title: string; icon: SajuIconName; small?: boolean }) {
  return <View style={s.heading}><SajuIcon name={icon} /><Text style={[s.cardTitle, { lineHeight: 20 }, small && { fontSize: 14, letterSpacing: -0.7 }]}>{title}</Text></View>;
}

export function SubHead({ title, caption }: { title: string; caption?: string }) {
  const [number, label] = title.split(' · ');
  return <View style={s.section}>
    <Text style={s.number}>{number}</Text>
    <View style={s.sectionTitle}>
      <Text style={s.sectionLabel} accessibilityRole="header">{label}</Text>
      {caption ? <View style={s.captionRow}><View style={s.divider} /><Text style={s.caption}>{caption}</Text></View> : null}
    </View>
  </View>;
}

export function Para({ children, mt = 6, style }: { children: React.ReactNode; mt?: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.body, { marginTop: mt }, style]}>{children}</Text>;
}
export function Bullet({ children }: { children: React.ReactNode }) {
  return <View style={s.bullet}><View style={s.bulletDot} /><Text style={[s.body, { flex: 1 }]}>{children}</Text></View>;
}
export function Tip({ title, children, style }: { title: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.tip, style]}><View style={s.tipHeading}><Image source={require('../../../assets/figma/saju/mascot.png')} style={{ width: 19, height: 18 }} contentFit="contain" /><Text style={s.tipTitle}>{title}</Text></View><Para mt={4}>{children}</Para></View>;
}
export function Closing({ children }: { children: React.ReactNode }) {
  return <View style={s.closing}><Image source={require('../../../assets/figma/saju/mascot.png')} style={{ width: 57, height: 53 }} contentFit="contain" /><View style={{ flex: 1 }}><Text style={[s.cardTitle, { lineHeight: 19, color: colors.white }]}>평생 기억할 한마디</Text><Para mt={4} style={{ color: colors.white }}>{children}</Para></View></View>;
}

export function InfoRows({ rows }: { rows: [SajuIconName, string, string][] }) {
  return <View style={s.table}>{rows.map(([icon, label, value], i) => <View key={label} style={[s.infoRow, i > 0 && s.topLine]}><SajuIcon name={icon} /><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>)}</View>;
}
const SOURCE_LABEL = { saju: '사주', thai: '점성술', mbti: 'MBTI', blood: '혈액형' };
export function ViewRow({ k, children }: { k: SrcKey; children: React.ReactNode }) {
  return <View style={s.viewRow}><SourceMark source={k} /><Text style={s.sourceLabel}>{SOURCE_LABEL[k]}</Text><Text style={[s.body, { flex: 1 }]}>{children}</Text></View>;
}

const s = StyleSheet.create({
  body: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.ink, flexShrink: 1 },
  section: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 32, marginBottom: 16 },
  sectionTitle: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8 },
  number: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: colors.accent },
  sectionLabel: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: colors.ink },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: '100%' },
  divider: { height: 14, width: 1, backgroundColor: '#999999' },
  caption: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, flexShrink: 1 },
  bullet: { flexDirection: 'row', gap: 9, marginTop: 10 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4392F7', marginTop: 7 },
  tip: { backgroundColor: colors.surface, borderRadius: 6, padding: 12 },
  tipHeading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipTitle: { ...sansW('600'), fontSize: 13, letterSpacing: -0.65, color: colors.accent },
  closing: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.heroBg, borderRadius: 12, padding: 16, paddingLeft: 12, marginTop: 16 },
  table: { backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 16 },
  topLine: { borderTopWidth: 1, borderTopColor: isDark ? colors.lineStrong : '#E8E8E8' },
  infoLabel: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink, flexShrink: 1 },
  infoValue: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, color: colors.ink, textAlign: 'right', flex: 1 },
  sourceMark: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  sourceLabel: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: colors.ink, width: 48 },
});
