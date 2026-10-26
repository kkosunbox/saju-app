import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';

/** 부적 종이에 적히는 내용 — 공유 카드(스토리)에서도 같은 부적을 그린다 */
export interface TalismanPaperData { hanja: string; mantra: string; keyword: string; nickname: string }

/** Figma's illustrated paper stays light in both appearance modes. */
const INK = '#BC3827';
export const PAPER_W = 247, PAPER_H = 335;

/** 오늘의 부적 종이 — 캡처(html2canvas · view-shot)에서도 나오도록 View·Text·Image만 쓴다 */
const TalismanPaper = forwardRef<View, { data: TalismanPaperData; today: string; onLoad?: () => void }>(({ data, today, onLoad }, ref) => (
  <View ref={ref} collapsable={false} style={s.paper}>
    <Image source={require('../../assets/figma/talisman/paper.png')} style={s.paperImage} resizeMode="cover" onLoad={onLoad} accessible={false} />
    <Text style={s.top}>{formatKoreanDate(today)}</Text>
    <View style={s.charm}><Text style={[s.hanja, data.hanja.length > 1 && s.multipleHanja]} adjustsFontSizeToFit numberOfLines={1}>{data.hanja}</Text></View>
    <View style={s.message}>
      <Text style={s.mantra} adjustsFontSizeToFit numberOfLines={2}>{data.mantra}</Text>
      <View style={s.keyword}><Text style={s.keywordText} numberOfLines={1}>{data.nickname} · 오늘의 {data.keyword}</Text></View>
    </View>
  </View>
));
TalismanPaper.displayName = 'TalismanPaper';

export default TalismanPaper;

const s = StyleSheet.create({
  paper: { width: PAPER_W, height: PAPER_H, borderRadius: 12, alignItems: 'center', overflow: 'hidden', backgroundColor: '#FFF3B8' },
  paperImage: { position: 'absolute', top: 0, left: 0, width: PAPER_W, height: PAPER_H },
  top: { ...sansW('500'), position: 'absolute', top: 16, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#5D0000' },
  charm: { position: 'absolute', top: 51.5, left: 57, width: 134, height: 158, alignItems: 'center', justifyContent: 'center' },
  hanja: { ...sansW('700'), fontSize: 86, lineHeight: 103, letterSpacing: -4.3, color: INK, textAlign: 'center' },
  multipleHanja: { fontSize: 52, letterSpacing: -2.6 },
  message: { position: 'absolute', top: 231, left: 12, right: 12, alignItems: 'center' },
  mantra: { ...sansW('700'), fontSize: 16, lineHeight: 18, color: '#000000', textAlign: 'center', letterSpacing: -0.8 },
  keyword: { marginTop: 12, maxWidth: PAPER_W - 32, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, borderWidth: 0.5, borderColor: INK },
  keywordText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: 0, color: INK, opacity: 0.8 },
});
