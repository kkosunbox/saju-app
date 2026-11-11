import React, { forwardRef } from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, TextStyle, Text, View, type ViewInstance } from 'react-native';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';
import { GiftTalisman } from '../content/giftTalismans';
import type { PaperDrawing } from './talismanPaperCanvas';

/** 부적 종이에 적히는 내용 — 공유 카드(스토리)에서도 같은 부적을 그린다 */
export interface TalismanPaperData { hanja: string; mantra: string; keyword: string; nickname: string }

/** Figma's illustrated paper stays light in both appearance modes. */
const INK = '#BC3827';
export const PAPER_W = 263, PAPER_H = 412;

interface PaperProps { today: string; onLoad?: () => void }

/** 종이 그림 + 흰 테두리 — 캡처(html2canvas · view-shot)에서도 나오도록 View·Text·Image만 쓴다 */
const Paper = forwardRef<ViewInstance, PaperProps & { bg: ImageSourcePropType; dateStyle: StyleProp<TextStyle>; children: React.ReactNode }>(({ bg, today, onLoad, dateStyle, children }, ref) => (
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
const TODAY_BG = require('../../assets/figma/talisman/paper-today.webp');
const TalismanPaper = forwardRef<ViewInstance, PaperProps & { data: TalismanPaperData }>(({ data, ...rest }, ref) => (
  <Paper ref={ref} bg={TODAY_BG} dateStyle={s.todayDate} {...rest}>
    <Hanja text={data.hanja} color={INK} top={124} />
    <Text style={[s.line, s.mantra, { top: 298 }]} adjustsFontSizeToFit numberOfLines={1}>{data.mantra}</Text>
    <Chip text={`${data.nickname} · 오늘의 ${data.keyword}`} color={INK} top={328} />
  </Paper>
));
TalismanPaper.displayName = 'TalismanPaper';

/** 친구에게 보내는 선물 부적 — 받는 사람·보내는 사람 중 빈 쪽은 칩에서 뺀다(둘 다 비면 칩 없음) */
export const GiftTalismanPaper = forwardRef<ViewInstance, PaperProps & { gift: GiftTalisman; to: string; from: string }>(({ gift, to, from, ...rest }, ref) => (
  <Paper ref={ref} bg={gift.paper} dateStyle={[s.giftDate, gift.dark && s.onDark]} {...rest}>
    <Hanja text={gift.hanja} color={gift.seal ?? gift.ink} top={gift.dark ? 102 : 106} />
    <Text style={[s.line, s.title, { top: 271 }, gift.dark && s.onDark]} numberOfLines={1}>{gift.label}의 부적</Text>
    <Text style={[s.line, s.wish, { top: 297, color: gift.ink }]} adjustsFontSizeToFit numberOfLines={1}>{gift.wish}</Text>
    {to || from ? <Chip text={[to && `To. ${to}`, from && `From. ${from}`].filter(Boolean).join(' ')} color={gift.ink} top={323} /> : null}
  </Paper>
));
GiftTalismanPaper.displayName = 'GiftTalismanPaper';

export default TalismanPaper;

/*
 * 웹 저장 · 공유 이미지용 그림 설명 (talismanPaperCanvas) — 아래 스타일 · 위 컴포넌트와 같은 위치 · 크기를 쓴다.
 * 글줄 · 칩 위치를 바꾸면 여기도 같이 바꾼다.
 */
const DATE = { size: 13, weight: '500', letterSpacing: -0.65, lineHeight: 18 } as const;
const BOLD16 = { size: 16, weight: '700', letterSpacing: -0.8, lineHeight: 18 } as const;

export const todayPaperDrawing = (data: TalismanPaperData, today: string): PaperDrawing => ({
  bg: TODAY_BG,
  date: { ...DATE, text: formatKoreanDate(today), top: 39, color: '#5D0000' },
  hanja: { text: data.hanja, color: INK, top: 124 },
  lines: [{ ...BOLD16, text: data.mantra, top: 298, color: '#000000', minSize: 11 }],
  chip: { text: `${data.nickname} · 오늘의 ${data.keyword}`, color: INK, top: 328 },
});

export const giftPaperDrawing = (gift: GiftTalisman, to: string, from: string, today: string): PaperDrawing => ({
  bg: gift.paper,
  date: { ...DATE, text: formatKoreanDate(today), top: 27, color: gift.dark ? '#FFFFFF' : '#210505' },
  hanja: { text: gift.hanja, color: gift.seal ?? gift.ink, top: gift.dark ? 102 : 106 },
  lines: [
    { ...BOLD16, text: `${gift.label}의 부적`, top: 271, color: gift.dark ? '#FFFFFF' : '#000000' },
    { size: 14, weight: '700', letterSpacing: -0.7, lineHeight: 18, text: gift.wish, top: 297, color: gift.ink, minSize: 10 },
  ],
  chip: to || from ? { text: [to && `To. ${to}`, from && `From. ${from}`].filter(Boolean).join(' '), color: gift.ink, top: 323 } : undefined,
});

const s = StyleSheet.create({
  paper: { width: PAPER_W, height: PAPER_H, borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFF3D6' },
  paperImage: { position: 'absolute', top: 0, left: 0, width: PAPER_W, height: PAPER_H },
  border: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 32, borderWidth: 3, borderColor: '#FFFFFF' },
  date: { ...sansW('500'), position: 'absolute', left: 0, right: 0, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, textAlign: 'center' },
  todayDate: { top: 39, color: '#5D0000' },
  giftDate: { top: 27, color: '#210505' },
  onDark: { color: '#FFFFFF' },
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
