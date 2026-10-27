import React, { forwardRef } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ART, Logo } from './Mascot';
import { POSES } from './ResultMascot';
import { TodayCardData } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { getMascotFrame } from '../utils/mascotLayout';

/**
 * 오늘의 운세 공유 카드 — 하늘색 그라디언트 위에 구름 액자를 두고,
 * 홈과 같은 마스코트 · 오늘의 칭호 · 올해 상위 % · 한 줄 문구 · 분야 점수를 담는다.
 * ShareCard와 같은 9:16 크기. 캡처에서도 나오도록 View·Text·Image·그라디언트만 쓴다.
 */
const C = { ink: '#000000', mute: '#777777', accent: '#28B2FE', percent: '#1FA6FD', dark: '#1D212D' };

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 홈 마스코트와 같은 포즈 · 같은 칸 (몸통 기준 108×100) */
const MASCOT_SIZE = 100;
const CLOUDS = require('../../assets/images/share-today-bg.webp');

const TodayShareCard = forwardRef<View, { data: TodayCardData; today: string; width: number }>(function TodayShareCard({ data, today, width }, ref) {
  return (
    <View ref={ref} collapsable={false} style={[s.card, { width }]}>
      <LinearGradient colors={['#1BADFE', '#C4E3F3', '#8ACAFF']} locations={[0, 0.44, 0.95]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={s.mast}><Logo height={37} /></View>

      {/* 구름 액자 */}
      <LinearGradient colors={['#7FD1FF', '#B8EAC2', '#94D9D9', '#83D1F6']} locations={[0, 0.51, 0.71, 1]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={s.frame}>
        <View style={s.inner}>
          <Image source={CLOUDS} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={s.top}>
            <Text style={s.date}>{formatKoreanDate(today)}</Text>
          </View>

          <View style={s.body}>
            <View style={s.mascot}>
              <Image source={data.pose ? POSES[data.pose] : ART.mascot} style={[s.art, getMascotFrame(data.pose ?? 'original', MASCOT_SIZE)]} resizeMode="contain" />
            </View>
            <Text style={s.owner} numberOfLines={1}>{data.nickname}님의 오늘 칭호</Text>
            <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit>{data.title}</Text>
            <Text style={s.yearLabel}>올해 나의 날 중</Text>
            <Text style={s.percent}>상위 {data.topPercent}%</Text>
            <Text style={[s.line, KEEP]} numberOfLines={2}>“{data.line}”</Text>
          </View>

          <View style={s.scores}>
            {data.scores.map(([k, v]) => (
              <View key={k} style={s.score}>
                <Text style={s.scoreV}>{v}</Text>
                <Text style={s.scoreK}>{k}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* 질문 */}
      <View style={s.foot}>
        <View style={{ flex: 1 }}>
          <Text style={s.hook}>너는 오늘 상위 몇 %?</Text>
          <Text style={s.url}><Text style={{ fontWeight: '500' }}>생일만 넣으면 30초 </Text>· 운Pick</Text>
        </View>
        <View style={s.cta}><Text style={s.ctaText}>나도 뽑아보기</Text></View>
      </View>
    </View>
  );
});

export default TodayShareCard;

const s = StyleSheet.create({
  card: { aspectRatio: 9 / 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  mast: { height: 30, justifyContent: 'center' },
  frame: { flex: 1, marginTop: 6, padding: 3, borderRadius: 32 },
  inner: { flex: 1, borderRadius: 29, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  top: { alignItems: 'center', paddingHorizontal: 21, paddingTop: 17 },
  date: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: -0.65, color: C.mute },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  mascot: { width: MASCOT_SIZE * 1.08, height: MASCOT_SIZE },
  art: { position: 'absolute' },
  owner: { marginTop: 12, fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: C.accent },
  title: { marginTop: 6, fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -1.4, color: C.ink },
  yearLabel: { marginTop: 14, fontSize: 14, fontWeight: '600', letterSpacing: -0.56, color: C.mute },
  percent: { marginTop: 2, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -1.2, color: C.percent },
  line: { marginTop: 14, fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: -0.56, color: C.mute, textAlign: 'center' },
  scores: { flexDirection: 'row', marginHorizontal: 5, marginBottom: 4, height: 61, paddingHorizontal: 12, alignItems: 'center', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#FFFFFF' },
  score: { flex: 1, alignItems: 'center' },
  scoreV: { fontSize: 18, lineHeight: 21, fontWeight: '800', letterSpacing: -0.72, color: C.ink },
  scoreK: { marginTop: 2, fontSize: 12, fontWeight: '600', letterSpacing: -0.48, color: C.mute },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingHorizontal: 4 },
  hook: { fontSize: 16, lineHeight: 18, fontWeight: '800', letterSpacing: -0.8, color: C.ink },
  url: { marginTop: 8, fontSize: 14, fontWeight: '600', letterSpacing: -0.56, color: C.ink },
  cta: { height: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 5, backgroundColor: C.dark },
  ctaText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.26, color: '#EDEDED' },
});
