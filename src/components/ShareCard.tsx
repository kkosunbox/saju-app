import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { Image } from 'expo-image';
import ShareCardBackdrop, { STORY_WIDTH, STORY_HEIGHT } from './ShareCardBackdrop';
import { Logo } from './Mascot';
import ShareLinkBadge from './ShareLinkBadge';
import CharacterArt from './CharacterArt';
import TodayShareCard from './TodayShareCard';
import CharacterShareCard from './CharacterShareCard';
import TarotCard from './tarot/TarotCard';
import MbtiArt from './MbtiArt';
import PastLifeArt from './PastLifeArt';
import Svg, { Path } from 'react-native-svg';
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
/** 찰떡 MBTI 카드 두 캐릭터 사이 하트 (피그마 Favorite_fill 20 틀, 채움 + 선 2) */
const MBTI_HEART = 'M3.70887 11.5901L9.50272 17.0328C9.64787 17.1691 9.72044 17.2373 9.79936 17.2719C9.92724 17.3279 10.0727 17.3279 10.2006 17.2719C10.2795 17.2373 10.3521 17.1691 10.4972 17.0328L16.2911 11.5901C17.9212 10.0587 18.1192 7.53875 16.7482 5.77164L16.4904 5.43937C14.8502 3.3254 11.558 3.67993 10.4055 6.09463C10.2427 6.43572 9.75722 6.43572 9.59442 6.09463C8.44196 3.67993 5.14975 3.3254 3.5096 5.43937L3.2518 5.77164C1.88077 7.53875 2.07873 10.0587 3.70887 11.5901Z';
// Figma's 110 × 110 illustration slots, including each source image's crop transform.
const ART = {
  Monthly: { source: require('../../assets/figma/share/monthly.webp'), x: -118.5, y: -8.18, w: 329.24, h: 107.6 },
  PastLife: { source: require('../../assets/figma/share/pastlife.webp'), x: -222.14, y: -8.18, w: 329.24, h: 107.6 },
  ThemeCareer: { source: require('../../assets/figma/share/career.webp'), x: -14.68, y: -9.15, w: 124.2, h: 124.2 },
  SajuDeep: { source: require('../../assets/figma/share/saju.webp'), x: -26.09, y: -19.29, w: 152.18, h: 152.18 },
  Theme: { source: require('../../assets/figma/share/love.webp'), x: -26.3, y: -14.07, w: 142.85, h: 142.85 },
  NewYear: { source: require('../../assets/figma/share/newyear.webp'), x: -22.94, y: -17.29, w: 145.87, h: 145.87 },
  Life: { source: require('../../assets/figma/share/life.webp'), x: -22.94, y: -17.29, w: 145.87, h: 145.87 },
  Lucky: { source: require('../../assets/figma/share/lucky.webp'), x: -28.18, y: -26.36, w: 155.55, h: 155.55 },
  ThemeMoney: { source: require('../../assets/figma/share/money.webp'), x: -31.76, y: -31.15, w: 167.22, h: 167.22 },
  Pet: { source: require('../../assets/images/soon-pet.webp'), x: -2.7, y: 0, w: 115.4, h: 110 },
  MbtiMatch: { source: require('../../assets/figma/share/mbti.webp'), x: -173.46, y: -74.08, w: 356.07, h: 444.52 },
};

/** Story image only: all content comes from the existing result; no private birth details. */
const ShareCard = forwardRef<ViewInstance, { spec: ShareSpec; today: string; onArtReady?: () => void }>(function ShareCard({ spec, today, onArtReady }, ref) {
  if (spec.today) return <TodayShareCard ref={ref} data={spec.today} today={today} />;
  if (spec.character) return <CharacterShareCard ref={ref} data={spec.character} today={today} />;
  const gold = !!spec.talisman;
  // 전생·찰떡 MBTI: 밤하늘 카드 — 글자는 흰색·연회색, 지표 칸은 남색
  const night = !!spec.pastLife || !!spec.mbti;
  // 오늘의 타로: 남색 밤하늘 카드 — 위쪽 글자는 흰색·연회색, 아래 구름 위 글자는 검정
  const tarot = !!spec.tarot;
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
  // 타로는 피그마대로 지표 값 16 (메이저 22장도 한 줄에 들어간다)
  const statFontSize = tarot ? 16 : Math.max(14, Math.min(compactStats ? 16 : 18, ...statFits));
  return (
    <View ref={ref} collapsable={false} style={s.card} testID="share-card">
      <ShareCardBackdrop gold={gold} night={night} tarot={tarot} mbti={!!spec.mbti} />
      <View style={s.logo}><Logo height={49} /></View>
      <Text style={[s.date, gold && { color: '#5D0000' }, (night || tarot) && n.mute]}>{formatKoreanDate(today)}</Text>
      {spec.talisman ? <>
        <View style={s.hanjaBox}><Text style={s.hanja} numberOfLines={1} adjustsFontSizeToFit>{spec.talisman.hanja}</Text></View>
        <Text style={s.mantra} numberOfLines={2} adjustsFontSizeToFit>{spec.talisman.mantra}</Text>
        <View style={s.chipRow}><View style={s.chip}><Text style={s.chipText}>{spec.talisman.nickname} · 오늘의 {spec.talisman.keyword}</Text></View></View>
      </> : <>
        {spec.mbti ? <>
          <View style={[s.mbtiCell, { left: 52 }]}><MbtiArt type={spec.mbti.mine} size={80} /><Text style={s.mbtiType}>{spec.mbti.mine}</Text></View>
          <View style={s.mbtiHeart}><Svg width={20} height={20} viewBox="0 0 20 20"><Path d={MBTI_HEART} fill="#28B2FE" stroke="#28B2FE" strokeWidth={2} strokeLinecap="round" /></Svg></View>
          <View style={[s.mbtiCell, { left: 179 }]}><MbtiArt type={spec.mbti.partner} size={80} /><Text style={s.mbtiType}>{spec.mbti.partner}</Text></View>
        </> : tarot ? <View style={t.card}><View style={t.cardClip}><TarotCard reading={spec.tarot} width={80} /></View></View> : <View style={s.artSlot}>
          {spec.pastLife ? <PastLifeArt result={spec.pastLife} size={110} onDisplay={onArtReady} /> : spec.pillar ? <CharacterArt hanja={spec.pillar} size={110} /> : <Image source={art.source} style={{ position: 'absolute', left: art.x * 1.1, top: art.y * 1.1, width: art.w * 1.1, height: art.h * 1.1 }} contentFit="fill" accessible={false} />}
        </View>}
        <Text style={[s.eyebrow, tarot && n.white]} numberOfLines={1} adjustsFontSizeToFit>{spec.eyebrow}</Text>
        <Text style={[s.headline, { fontSize: titleSize, letterSpacing: -titleSize * 0.05 }, multilineTitle && s.multilineTitle, (night || tarot) && n.white, KEEP]} numberOfLines={multilineTitle ? 2 : 1} adjustsFontSizeToFit>{spec.headline}</Text>
        {detail ? <>
          <Text style={[s.detailLabel, night && n.mute, tarot && t.ink]} numberOfLines={1} adjustsFontSizeToFit>{detail.label}</Text>
          <Text style={[s.detailValue, { fontSize: detailSize, letterSpacing: -detailSize * 0.05 }, multilineDetail && s.multilineDetail]} numberOfLines={multilineDetail ? 2 : 1} adjustsFontSizeToFit>{detail.value}</Text>
        </> : null}
        {spec.sub ? <Text style={[s.line, night && n.mute, tarot && t.ink, KEEP]} numberOfLines={2} adjustsFontSizeToFit>“{spec.sub}”</Text> : null}
      </>}
      <View style={[s.stats, night && n.stats]} testID="share-stats">
        {spec.stats.map(([label, value], i) => <View key={label} style={[s.stat, gold && { flex: [1.1, 0.55, 1.35][i] ?? 1 }]}>
          <View style={s.statValueBox}>
            <Text style={[s.statValue, { fontSize: statFontSize, lineHeight: statFontSize > 14 ? 21 : 15 }, night && n.white, tarot && t.statValue]} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
          </View>
          <Text style={[s.statLabel, { fontSize: Math.max(10, fit(label, 12, 79, -0.04)) }, night && n.mute]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        </View>)}
      </View>
      <Text style={[s.hook, spec.hook.length > 15 && s.longHook, night && n.white, KEEP]} numberOfLines={2}>{spec.hook}</Text>
      <Text style={[s.url, night && n.white]}>생일만 넣으면 30초 · 운픽</Text>
      <ShareLinkBadge style={s.link} />
    </View>
  );
});
export default ShareCard;

/** 오늘의 타로 (피그마 482:2937) — 카드 그림 (115, 104) 80×115, 모서리 7, 빛 2 2 12 2 rgba(254,247,219,.5) */
const t = StyleSheet.create({
  card: { position: 'absolute', left: 115, top: 104, width: 80, height: 115, borderRadius: 7, backgroundColor: '#FEF7DB',
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 12px 2px rgba(254, 247, 219, 0.5)' } : { shadowColor: '#FEF7DB', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 2, height: 2 } }) },
  // 2:3 카드 그림(80×120)을 115 높이에 맞춰 위아래 2.5씩 잘라 낸다
  cardClip: { width: 80, height: 115, borderRadius: 7, overflow: 'hidden', justifyContent: 'center' },
  ink: { color: '#000000' },
  // 피그마 지표 값 16/800 자간 -0.04em (카드 번호만 -0.08em)
  statValue: { letterSpacing: -0.64 },
});

/** 전생 밤하늘 카드 색 (피그마 286:1955) */
const n = StyleSheet.create({
  white: { color: '#FFFFFF' },
  mute: { color: '#DDDDDD' },
  stats: { backgroundColor: '#0C1E4A' },
});

const s = StyleSheet.create({
  card: { width: CARD_W, height: CARD_H, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  logo: { position: 'absolute', left: 20, top: 9 },
  date: { ...sansW('500'), position: 'absolute', left: 36, right: 36, top: 72, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, textAlign: 'center', color: '#777777' },
  artSlot: { position: 'absolute', left: 100, top: 106, width: 110, height: 110, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // 찰떡 MBTI (피그마 272:2030) — 그림 칸 자리에 내 MBTI(52) · 하트(146, 146) · 찰떡 MBTI(179), 그림 80 아래 1 띄워 유형 20/600
  mbtiCell: { position: 'absolute', top: 108, width: 80, alignItems: 'center' },
  mbtiType: { ...sansW('600'), marginTop: 1, fontSize: 20, lineHeight: 24, letterSpacing: -1, color: '#FFFFFF' },
  mbtiHeart: { position: 'absolute', left: 146, top: 146, width: 20, height: 20 },
  eyebrow: { ...sansW('700'), position: 'absolute', left: 28, right: 28, top: 230, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#28B2FE' },
  headline: { ...EXTRA, position: 'absolute', left: 25, right: 25, top: 252, fontSize: 32, lineHeight: 38, letterSpacing: -1.6, textAlign: 'center', color: '#000000' },
  multilineTitle: { top: 248, fontSize: 20, lineHeight: 24, height: 48, letterSpacing: -1 },
  multilineDetail: { top: 314, fontSize: 18, lineHeight: 22, height: 44, letterSpacing: -0.9 },
  detailLabel: { ...sansW('600'), position: 'absolute', left: 28, right: 28, top: 297, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#777777' },
  detailValue: { ...EXTRA, position: 'absolute', left: 28, right: 28, top: 316, fontSize: 24, lineHeight: 30, letterSpacing: -1.2, textAlign: 'center', color: '#1FA6FD' },
  line: { ...sansW('600'), position: 'absolute', left: 26, right: 26, top: 362, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, textAlign: 'center', color: '#777777' },
  stats: { position: 'absolute', left: 28, top: 398, width: 255, height: 61, flexDirection: 'row', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#FFFFFF' },
  stat: { flex: 1, height: 61, alignItems: 'center', paddingHorizontal: 3 },
  // 흰 칸(61) 안에서 값·라벨 묶음의 위아래 여백을 맞춘다 (위 10.5 · 아래 11)
  statValueBox: { position: 'absolute', left: 3, right: 3, top: 6, height: 30, justifyContent: 'center' },
  statValue: { ...EXTRA, maxWidth: '100%', fontSize: 18, lineHeight: 21, letterSpacing: -0.72, textAlign: 'center', color: '#000000' },
  statLabel: { ...sansW('600'), position: 'absolute', top: 36, left: 3, right: 3, fontSize: 12, lineHeight: 14, letterSpacing: -0.48, textAlign: 'center', color: '#777777' },
  hook: { ...EXTRA, position: 'absolute', left: 24, top: 482, width: 164, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, color: '#000000' },
  longHook: { top: 470 },
  url: { ...sansW('500'), position: 'absolute', left: 24, top: 508, fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: '#000000' },
  // 링크 뱃지 — 피그마 (180, 492), 오른쪽 끝 291
  link: { position: 'absolute', right: 20, top: 492 },
  hanjaBox: { position: 'absolute', left: 92, top: 144, width: 127, height: 115, justifyContent: 'center', alignItems: 'center' },
  hanja: { ...sansW('700'), fontSize: 96, lineHeight: 115, letterSpacing: -4.8, color: '#BC3827' },
  mantra: { ...sansW('700'), position: 'absolute', left: 28, right: 28, top: 302, fontSize: 16, lineHeight: 18, letterSpacing: -0.8, textAlign: 'center', color: '#000000' },
  chipRow: { position: 'absolute', left: 28, right: 28, top: 332, alignItems: 'center' },
  chip: { borderWidth: 0.5, borderColor: '#BC3827', borderRadius: 24, paddingHorizontal: 8, paddingVertical: 4 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 14, color: '#BC3827', opacity: 0.8 },
});
