import React, { forwardRef } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';
import { GiftTalisman } from '../content/giftTalismans';

/** 부적 종이에 적히는 내용 — 공유 카드(스토리)에서도 같은 부적을 그린다 */
export interface TalismanPaperData { hanja: string; mantra: string; keyword: string; nickname: string }

/** Figma's illustrated paper stays light in both appearance modes. */
const INK = '#BC3827';
export const PAPER_W = 263, PAPER_H = 412;

interface PaperProps { today: string; onLoad?: () => void }

/** 종이 그림 + 흰 테두리 — 캡처(html2canvas · view-shot)에서도 나오도록 View·Text·Image만 쓴다 */
const Paper = forwardRef<View, PaperProps & { bg: ImageSourcePropType; dateStyle: object; children: React.ReactNode }>(({ bg, today, onLoad, dateStyle, children }, ref) => (
  <View ref={ref} collapsable={false} style={s.paper}>
    <Image source={bg} style={s.paperImage} resizeMode="cover" onLoad={onLoad} accessible={false} />
    <Text style={[s.date, dateStyle]}>{formatKoreanDate(today)}</Text>
    {children}
    <View pointerEvents="none" style={s.border} />
  </View>
));
Paper.displayName = 'Paper';

const Hanja = ({ text, color, top }: { text: string; color: string; top: number }) => (
  <View style={[s.charm, { top }]}><Text style={[s.hanja, { color }, text.length > 1 && s.multipleHanja]} adjustsFontSizeToFit numberOfLines={1}>{text}</Text></View>
);

const Chip = ({ text, color, top }: { text: string; color: string; top: number }) => (
  <View style={[s.chipRow, { top }]}><View style={[s.chip, { borderColor: color }]}><Text style={[s.chipText, { color }]} numberOfLines={1}>{text}</Text></View></View>
);

/** 오늘 나의 부적 */
const TalismanPaper = forwardRef<View, PaperProps & { data: TalismanPaperData }>(({ data, ...rest }, ref) => (
  <Paper ref={ref} bg={require('../../assets/figma/talisman/paper-today.webp')} dateStyle={s.todayDate} {...rest}>
    <Hanja text={data.hanja} color={INK} top={124} />
    <Text style={[s.line, s.mantra, { top: 298 }]} adjustsFontSizeToFit numberOfLines={1}>{data.mantra}</Text>
    <Chip text={`${data.nickname} · 오늘의 ${data.keyword}`} color={INK} top={328} />
  </Paper>
));
TalismanPaper.displayName = 'TalismanPaper';

/** 친구에게 보내는 선물 부적 — 받는 사람을 비우면 From만 적는다 */
export const GiftTalismanPaper = forwardRef<View, PaperProps & { gift: GiftTalisman; to: string; from: string }>(({ gift, to, from, ...rest }, ref) => (
  <Paper ref={ref} bg={gift.paper} dateStyle={s.giftDate} {...rest}>
    <Hanja text={gift.hanja} color={gift.ink} top={106} />
    <Text style={[s.line, s.title, { top: 271 }]} numberOfLines={1}>{gift.label}의 부적</Text>
    <Text style={[s.line, s.wish, { top: 297, color: gift.ink }]} adjustsFontSizeToFit numberOfLines={1}>{gift.wish}</Text>
    <Chip text={to ? `To. ${to} From. ${from}` : `From. ${from}`} color={gift.ink} top={323} />
  </Paper>
));
GiftTalismanPaper.displayName = 'GiftTalismanPaper';

export default TalismanPaper;

const s = StyleSheet.create({
  paper: { width: PAPER_W, height: PAPER_H, borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF3D6' },
  paperImage: { position: 'absolute', top: 0, left: 0, width: PAPER_W, height: PAPER_H },
  border: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 32, borderWidth: 3, borderColor: '#FFFFFF' },
  date: { ...sansW('500'), position: 'absolute', left: 0, right: 0, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, textAlign: 'center' },
  todayDate: { top: 39, color: '#5D0000' },
  giftDate: { top: 27, color: '#210505' },
  charm: { position: 'absolute', left: 57, width: 149, height: 115, alignItems: 'center', justifyContent: 'center' },
  hanja: { ...sansW('700'), fontSize: 96, lineHeight: 115, letterSpacing: -4.8, textAlign: 'center' },
  multipleHanja: { fontSize: 56, letterSpacing: -2.8 },
  line: { position: 'absolute', left: 16, right: 16, lineHeight: 18, textAlign: 'center' },
  mantra: { ...sansW('700'), fontSize: 16, letterSpacing: -0.8, color: '#000000' },
  title: { ...sansW('700'), fontSize: 16, letterSpacing: -0.8, color: '#000000' },
  wish: { ...sansW('700'), fontSize: 14, letterSpacing: -0.7 },
  chipRow: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  chip: { maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, borderWidth: 0.5 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: 0, opacity: 0.8 },
});
