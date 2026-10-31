import React, { forwardRef } from 'react';
import { Image, Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import ShareCardBackdrop, { STORY_WIDTH, STORY_HEIGHT } from './ShareCardBackdrop';
import { Logo } from './Mascot';
import CharacterArt from './CharacterArt';
import TodayShareCard from './TodayShareCard';
import TarotCard from './tarot/TarotCard';
import { ShareSpec } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { sansW } from '../theme/typography';

export const CARD_W = STORY_WIDTH;
export const CARD_H = STORY_HEIGHT;
// Web Text does not implement adjustsFontSizeToFit; keep long dynamic results inside their slots.
const fit = (text: string, base: number, width: number, tracking = -0.05) => {
  const units = Array.from(text).reduce((n, c) => n + (/\s/.test(c) ? 0.3 : c.charCodeAt(0) <= 255 ? 0.6 : 1), 0);
  return Math.min(base, Math.floor(width / Math.max(1, units + text.length * tracking)));
};
const EXTRA = Platform.OS === 'web' ? sansW('800') : { fontFamily: 'Pretendard-ExtraBold' };
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
// Figma's 110 × 110 illustration slots, including each source image's crop transform.
const ART = {
  Monthly: { source: require('../../assets/figma/share/monthly.png'), x: -118.5, y: -8.18, w: 329.24, h: 107.6 },
  PastLife: { source: require('../../assets/figma/share/pastlife.png'), x: -222.14, y: -8.18, w: 329.24, h: 107.6 },
  ThemeCareer: { source: require('../../assets/figma/share/career.png'), x: -14.68, y: -9.15, w: 124.2, h: 124.2 },
  SajuDeep: { source: require('../../assets/figma/share/saju.png'), x: -26.09, y: -19.29, w: 152.18, h: 152.18 },
  Theme: { source: require('../../assets/figma/share/love.png'), x: -26.3, y: -14.07, w: 142.85, h: 142.85 },
  NewYear: { source: require('../../assets/figma/share/newyear.png'), x: -22.94, y: -17.29, w: 145.87, h: 145.87 },
  Life: { source: require('../../assets/figma/share/life.png'), x: -22.94, y: -17.29, w: 145.87, h: 145.87 },
  Lucky: { source: require('../../assets/figma/share/lucky.png'), x: -28.18, y: -26.36, w: 155.55, h: 155.55 },
  ThemeMoney: { source: require('../../assets/figma/share/money.png'), x: -31.76, y: -31.15, w: 167.22, h: 167.22 },
  MbtiMatch: { source: require('../../assets/figma/share/mbti.png'), x: -173.46, y: -74.08, w: 356.07, h: 444.52 },
};

/** Story image only: all content comes from the existing result; no private birth details. */
const ShareCard = forwardRef<ViewInstance, { spec: ShareSpec; today: string }>(function ShareCard({ spec, today }, ref) {
  if (spec.today) return <TodayShareCard ref={ref} data={spec.today} today={today} />;
  const gold = !!spec.talisman;
  const art = ART[spec.route as keyof typeof ART] ?? ART.SajuDeep;
  const detail = spec.detail ?? (spec.big ? { label: spec.big.label, value: `${spec.big.value}${spec.big.unit ?? ''}` } : undefined);
  const longTitle = spec.route === 'Life' || spec.route === 'Theme' || spec.headline.length > 13;
  const titleSize = fit(spec.headline, longTitle ? 24 : 32, 261);
  const detailSize = detail ? fit(detail.value, 24, 255) : 24;
  const multilineTitle = titleSize < 20;
  const multilineDetail = detailSize < 18;
  const compactStats = gold || spec.route === 'Life' || spec.route === 'Lucky';
  // Keep a row's values the same size. Let the actual text height determine centering;
  // a length estimate must never move a one-line value to the top of a two-line slot.
  const statFits = spec.stats.map(([, value], i) => fit(value, compactStats ? 16 : 18, gold ? 255 * ([1.1, 0.55, 1.35][i] ?? 1) / 3 - 6 : 79));
  const statFontSize = Math.max(14, Math.min(compactStats ? 16 : 18, ...statFits));
  return (
    <View ref={ref} collapsable={false} style={s.card} testID="share-card">
      <ShareCardBackdrop gold={gold} />
      <View style={s.logo}><Logo height={49} /></View>
      <Text style={[s.date, gold && { color: '#5D0000' }]}>{formatKoreanDate(today)}</Text>
      {spec.talisman ? <>
        <View style={s.hanjaBox}><Text style={s.hanja} numberOfLines={1} adjustsFontSizeToFit>{spec.talisman.hanja}</Text></View>
        <Text style={s.mantra} numberOfLines={2} adjustsFontSizeToFit>{spec.talisman.mantra}</Text>
        <View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>{spec.talisman.nickname} · 오늘의 {spec.talisman.keyword}</Text></View></View>
      </> : <>
        <View style={s.artSlot}>
          {spec.tarot ? <TarotCard reading={spec.tarot} width={73} /> : spec.pillar ? <CharacterArt hanja={spec.pillar} size={110} /> : <Image source={art.source} style={{ position: 'absolute', left: art.x * 1.1, top: art.y * 1.1, width: art.w * 1.1, height: art.h * 1.1 }} resizeMode="stretch" accessible={false} />}
        </View>
        <Text style={s.eyebrow} numberOfLines={1} adjustsFontSizeToFit>{spec.eyebrow}</Text>
        <Text style={[s.headline, { fontSize: titleSize, letterSpacing: -titleSize * 0.05 }, multilineTitle && s.multilineTitle, KEEP]} numberOfLines={multilineTitle ? 2 : 1} adjustsFontSizeToFit>{spec.headline}</Text>
        {detail ? <>
          <Text style={s.detailLabel} numberOfLines={1} adjustsFontSizeToFit>{detail.label}</Text>
          <Text style={[s.detailValue, { fontSize: detailSize, letterSpacing: -detailSize * 0.05 }, multilineDetail && s.multilineDetail]} numberOfLines={multilineDetail ? 2 : 1} adjustsFontSizeToFit>{detail.value}</Text>
        </> : null}
        {spec.sub ? <Text style={[s.line, KEEP]} numberOfLines={2} adjustsFontSizeToFit>“{spec.sub}”</Text> : null}
      </>}
      <View style={s.stats} testID="share-stats">
        {spec.stats.map(([label, value], i) => <View key={label} style={[s.stat, gold && { flex: [1.1, 0.55, 1.35][i] ?? 1 }]}>
          <View style={s.statValueBox}>
            <Text style={[s.statValue, { fontSize: statFontSize, lineHeight: statFontSize > 14 ? 21 : 15 }]} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
          </View>
          <Text style={[s.statLabel, { fontSize: Math.max(10, fit(label, 12, 79, -0.04)) }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        </View>)}
      </View>
      <Text style={[s.hook, spec.hook.length > 15 && s.longHook, KEEP]} numberOfLines={2}>{spec.hook}</Text>
      <Text style={s.url}>생일만 넣으면 30초 · 운픽</Text>
      <View style={s.cta}><Text style={s.ctaText}>나도 뽑아보기</Text></View>
    </View>
  );
});
export default ShareCard;

const s = StyleSheet.create({
  card: { width: CARD_W, height: CARD_H, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  logo: { position: 'absolute', left: 20, top: 9 },
  date: { ...sansW('500'), position: 'absolute', left: 36, right: 36, top: 72, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, textAlign: 'center', color: '#777777' },
  artSlot: { position: 'absolute', left: 100, top: 106, width: 110, height: 110, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...sansW('700'), position: 'absolute', left: 28, right: 28, top: 230, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#28B2FE' },
  headline: { ...EXTRA, position: 'absolute', left: 25, right: 25, top: 252, fontSize: 32, lineHeight: 38, letterSpacing: -1.6, textAlign: 'center', color: '#000000' },
  multilineTitle: { top: 248, fontSize: 20, lineHeight: 24, height: 48, letterSpacing: -1 },
  multilineDetail: { top: 314, fontSize: 18, lineHeight: 22, height: 44, letterSpacing: -0.9 },
  detailLabel: { ...sansW('600'), position: 'absolute', left: 28, right: 28, top: 297, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#777777' },
  detailValue: { ...EXTRA, position: 'absolute', left: 28, right: 28, top: 316, fontSize: 24, lineHeight: 30, letterSpacing: -1.2, textAlign: 'center', color: '#1FA6FD' },
  line: { ...sansW('600'), position: 'absolute', left: 26, right: 26, top: 362, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#777777' },
  stats: { position: 'absolute', left: 28, top: 398, width: 255, height: 61, flexDirection: 'row', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#FFFFFF' },
  stat: { flex: 1, height: 61, alignItems: 'center', paddingHorizontal: 3 },
  statValueBox: { position: 'absolute', left: 3, right: 3, top: 4, height: 30, justifyContent: 'center' },
  statValue: { ...EXTRA, maxWidth: '100%', fontSize: 18, lineHeight: 21, letterSpacing: -0.72, textAlign: 'center', color: '#000000' },
  statLabel: { ...sansW('600'), position: 'absolute', top: 34, left: 3, right: 3, fontSize: 12, lineHeight: 14, letterSpacing: -0.48, textAlign: 'center', color: '#777777' },
  hook: { ...EXTRA, position: 'absolute', left: 24, top: 482, width: 164, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: '#000000' },
  longHook: { top: 470 },
  url: { ...sansW('500'), position: 'absolute', left: 24, top: 508, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: '#000000' },
  cta: { position: 'absolute', right: 24, top: 485, height: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 5, backgroundColor: '#1D212D' },
  ctaText: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.26, color: '#EDEDED' },
  hanjaBox: { position: 'absolute', left: 92, top: 144, width: 127, height: 115, justifyContent: 'center', alignItems: 'center' },
  hanja: { ...sansW('700'), fontSize: 96, lineHeight: 115, letterSpacing: -4.8, color: '#BC3827' },
  mantra: { ...sansW('700'), position: 'absolute', left: 28, right: 28, top: 302, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, textAlign: 'center', color: '#000000' },
  chipRow: { position: 'absolute', left: 28, right: 28, top: 332, alignItems: 'center' },
  chip: { borderWidth: 0.5, borderColor: '#BC3827', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: '#BC3827', opacity: 0.8 },
});
