import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot, { ArtName, Logo } from './Mascot';
import Icon from './Icon';
import CharacterArt from './CharacterArt';
import { ShareSpec } from '../services/share/shareSpecs';
import { parseISO } from '../utils/date';

/**
 * 공유 카드 — 인스타 스토리 비율(9:16). 홈과 같은 언어로:
 * 하늘색 그라디언트 위 로고 · 흰 말풍선에 결과 한 줄 · 둥실 뜬 마스코트 · 회색 숫자 칸 ·
 * 가려 둔 "잠긴 이야기"로 호기심을 남기고, 마지막 질문으로 앱에 부른다.
 * 모드(다크)와 상관없이 늘 밝은 카드. 캡처(html2canvas · view-shot)에서도 나오도록 View·Text·Image·그라디언트만 쓴다.
 */
const C = { ink: '#222222', sub: '#4F4F4F', mute: '#777777', card: '#F5F6F8', line: '#ECEEF2', accent: '#28B2FE', blue: '#4392F7', dark: '#1D212D' };

/** 웹에서 한국어가 단어 중간에서 끊기지 않게 */
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 가림막 막대 너비 — 글자처럼 보이게 길이를 섞는다 */
const BARS = [64, 40, 88, 28, 52, 36];

/** 관점 한자 → 마스코트 포즈 (나머지는 기본 마스코트) */
const POSE: Record<string, ArtName> = { 命: 'pose-saju', 星: 'pose-thai', 曜: 'pose-thai', 性: 'pose-mbti', 血: 'pose-blood', 符: 'talisman' };

export const CARD_W = 320;

const ShareCard = forwardRef<View, { spec: ShareSpec; today: string }>(({ spec, today }, ref) => {
  const { y, m, d } = parseISO(today);
  const longHead = spec.headline.length > 18;
  return (
    <View ref={ref} collapsable={false} style={s.card}>
      <LinearGradient colors={['#15ABFE', '#C8EBFF', '#FFFFFF']} locations={[0, 0.5, 1]} style={s.sky} />

      {/* 제호 */}
      <View style={s.mast}>
        <Logo height={24} />
        <Text style={s.date}>{y}.{String(m).padStart(2, '0')}.{String(d).padStart(2, '0')}</Text>
      </View>
      <View style={s.kind}><Text style={s.kindText}>{spec.kind}</Text></View>

      {/* 결과 말풍선 */}
      <View style={s.bubble}>
        <Text style={s.eyebrow} numberOfLines={1}>{spec.eyebrow}</Text>
        <Text style={[longHead ? s.headSm : s.head, KEEP]} numberOfLines={3}>{spec.headline}</Text>
        {spec.sub ? <Text style={[s.sub, KEEP]} numberOfLines={spec.big ? 1 : 2}>{spec.sub}</Text> : null}
        <View style={s.tail} />
      </View>

      {/* 남는 높이에는 마스코트 */}
      <View style={s.spacer}>
        {spec.pillar ? <CharacterArt hanja={spec.pillar} size={96} /> : <Mascot name={POSE[spec.seal] ?? 'mascot'} size={72} />}
      </View>

      {spec.big ? (
        <View style={s.big}>
          <Text style={s.bigVal}>{spec.big.value}<Text style={s.bigUnit}>{spec.big.unit}</Text></Text>
          <Text style={s.bigLabel}>{spec.big.label}</Text>
        </View>
      ) : null}

      {/* 숫자 칸 */}
      <View style={s.stats}>
        {spec.stats.map(([k, v], i) => (
          <View key={k} style={[s.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: C.line }]}>
            <Text style={s.statK} numberOfLines={1}>{k}</Text>
            <Text style={[s.statV, v.length > 7 ? { fontSize: 12, lineHeight: 20 } : v.length > 5 ? { fontSize: 14 } : null]} numberOfLines={1}>{v}</Text>
          </View>
        ))}
      </View>

      {/* 잠긴 이야기 */}
      {spec.teaser ? (
        <View style={s.teaser}>
          <View style={s.teaserHead}>
            <View style={s.lock}><Icon name="lock" size={12} color={C.accent} strokeWidth={2.2} /></View>
            <Text style={s.teaserLabel} numberOfLines={1}>{spec.teaser}</Text>
            <Text style={s.teaserOpen}>운Pick에서 확인</Text>
          </View>
          <View style={s.bars}>
            {BARS.map((w, i) => <View key={i} style={[s.bar, { width: w, opacity: 0.5 + (i % 3) * 0.12 }]} />)}
          </View>
        </View>
      ) : null}

      {/* 질문 */}
      <View style={s.foot}>
        <Text style={[s.hook, KEEP]} numberOfLines={2}>{spec.hook}</Text>
        <View style={s.footRow}>
          <Text style={s.url}>생일만 넣으면 30초 · 운Pick</Text>
          <Text style={s.cta}>내 결과 보기 →</Text>
        </View>
      </View>
    </View>
  );
});

export default ShareCard;

const s = StyleSheet.create({
  card: { width: CARD_W, aspectRatio: 9 / 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  mast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 11, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.2 },
  kind: { alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)' },
  kindText: { fontSize: 11, fontWeight: '700', color: C.blue },
  bubble: { marginTop: 10, padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  tail: { position: 'absolute', left: 36, bottom: -6, width: 12, height: 12, borderRadius: 2, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }] },
  eyebrow: { fontSize: 12, fontWeight: '600', color: C.mute },
  head: { fontSize: 26, lineHeight: 33, fontWeight: '800', letterSpacing: -1, marginTop: 6, color: C.ink },
  headSm: { fontSize: 20, lineHeight: 27, fontWeight: '800', letterSpacing: -0.8, marginTop: 6, color: C.ink },
  sub: { fontSize: 12, lineHeight: 18, marginTop: 6, color: C.sub },
  spacer: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  big: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bigVal: { fontSize: 44, lineHeight: 48, fontWeight: '800', letterSpacing: -1.5, color: C.ink },
  bigUnit: { fontSize: 16, fontWeight: '600', letterSpacing: 0, color: C.mute },
  bigLabel: { fontSize: 11, fontWeight: '700', paddingBottom: 8, color: C.mute },
  stats: { flexDirection: 'row', marginTop: 8, borderRadius: 12, backgroundColor: C.card },
  stat: { flex: 1, paddingVertical: 8, paddingHorizontal: 10 },
  statK: { fontSize: 11, fontWeight: '600', color: C.mute },
  statV: { fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: 2, color: C.ink },
  teaser: { marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: C.accent, padding: 10, backgroundColor: '#FFFFFF' },
  teaserHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#EAF7FF', alignItems: 'center', justifyContent: 'center' },
  teaserLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: C.ink },
  teaserOpen: { fontSize: 11, fontWeight: '700', color: C.accent },
  bars: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.dark },
  foot: { marginTop: 12 },
  hook: { fontSize: 17, lineHeight: 24, fontWeight: '800', letterSpacing: -0.6, color: C.ink },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  url: { fontSize: 11, fontWeight: '600', color: C.mute },
  cta: { fontSize: 11, fontWeight: '800', color: C.blue },
});
