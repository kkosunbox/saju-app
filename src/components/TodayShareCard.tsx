import React, { forwardRef } from 'react';
import { Image, Platform, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ART, Logo } from './Mascot';
import { POSES } from './ResultMascot';
import { TodayCardData } from '../services/share/shareSpecs';
import { formatKoreanDate } from '../utils/date';
import { getMascotFrame } from '../utils/mascotLayout';

/**
 * 오늘의 운세 공유 카드 — 하늘색 그라디언트 위에 구름 액자를 두고,
 * 홈과 같은 마스코트 · 오늘의 칭호 · 올해 상위 % · 한 줄 문구 · 분야 점수를 담는다.
 * 피그마(운픽_2_2)의 311 폭 좌표를 그대로 옮기고, 높이만 9:16(553)으로 둬 남는 5는 아래 여백이 된다.
 * 캡처에서도 나오도록 View·Text·Image·그라디언트만 쓴다.
 */
const C = { ink: '#000000', mute: '#777777', accent: '#28B2FE', percent: '#1FA6FD', dark: '#1D212D' };

const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

export const TODAY_W = 311;
/** 구름 액자 — 카드 기준 (20, 50) 271×416, 테두리 3 */
const FRAME = { left: 20, top: 50, width: 271, height: 416, border: 3 };
/** 홈 마스코트와 같은 포즈 · 같은 칸 (몸통 기준 108×100). 피그마 마스코트 몸통(96×90)과 같은 크기 */
const MASCOT_SIZE = 108;
/** 피그마 마스코트 몸통 가운데 — 카드 기준 y 167 */
const MASCOT_CY = 167;
const CLOUDS = require('../../assets/images/share-today-bg.webp');

/** 카드 기준 y → 액자 안쪽 기준 y */
const y = (cardY: number) => cardY - FRAME.top - FRAME.border;

const TodayShareCard = forwardRef<ViewInstance, { data: TodayCardData; today: string }>(function TodayShareCard({ data, today }, ref) {
  return (
    <View ref={ref} collapsable={false} style={s.card}>
      {/* 피그마 227° 그라디언트를 픽셀에서 되짚은 값 — 대각선(좌상→우하) 위 28.5% · 50% · 75% (웹·앱 모두 같은 선) */}
      <LinearGradient colors={['#1BADFE', '#C4E3F3', '#8ACAFF']} locations={[0.285, 0.5, 0.75]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={s.logo}><Logo height={49} /></View>

      {/* 구름 액자 */}
      <LinearGradient colors={['#7FD1FF', '#B8EAC2', '#94D9D9', '#83D1F6']} locations={[0, 0.51, 0.71, 1]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={s.frame}>
        <View style={s.inner}>
          <Image source={CLOUDS} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Text style={[s.row, s.date]}>{formatKoreanDate(today)}</Text>

          <View style={s.mascot}>
            <Image source={data.pose ? POSES[data.pose] : ART.mascot} style={[s.art, getMascotFrame(data.pose ?? 'original', MASCOT_SIZE)]} resizeMode="contain" />
          </View>
          <Text style={[s.row, s.owner]} numberOfLines={1}>{data.nickname}님의 오늘 칭호</Text>
          <Text style={[s.row, s.title]} numberOfLines={1} adjustsFontSizeToFit>{data.title}</Text>
          <Text style={[s.row, s.yearLabel]}>올해 나의 날 중</Text>
          <Text style={[s.row, s.percent]}>상위 {data.topPercent}%</Text>
          <Text style={[s.row, s.line, KEEP]} numberOfLines={2}>“{data.line}”</Text>

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
          <Text style={s.url}>생일만 넣으면 30초 · 운픽</Text>
        </View>
        <View style={s.cta}><Text style={s.ctaText}>나도 뽑아보기</Text></View>
      </View>
    </View>
  );
});

export default TodayShareCard;

const s = StyleSheet.create({
  card: { width: TODAY_W, aspectRatio: 9 / 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8ACAFF' },
  logo: { position: 'absolute', left: 20, top: 9 },
  frame: { position: 'absolute', left: FRAME.left, top: FRAME.top, width: FRAME.width, height: FRAME.height, padding: FRAME.border, borderRadius: 32 },
  inner: { flex: 1, borderRadius: 32 - FRAME.border, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  /** 액자 안 한 줄 — 가운데 정렬, 피그마 y에 맞춰 둔다 */
  row: { position: 'absolute', left: 16, right: 16, textAlign: 'center' },
  date: { top: y(72), fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: -0.65, color: C.mute },
  mascot: { position: 'absolute', alignSelf: 'center', top: y(MASCOT_CY) - MASCOT_SIZE / 2, width: MASCOT_SIZE * 1.08, height: MASCOT_SIZE },
  art: { position: 'absolute' },
  owner: { top: y(230), fontSize: 14, lineHeight: 17, fontWeight: '700', letterSpacing: -0.56, color: C.accent },
  // 피그마는 줄높이 18에 글자가 넘치게 그린다 — 같은 가운데(268 · 331)에 오도록 줄높이를 키워 위로 올린다
  title: { top: y(268) - 17, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -1.4, color: C.ink },
  yearLabel: { top: y(297), fontSize: 14, lineHeight: 17, fontWeight: '600', letterSpacing: -0.56, color: C.mute },
  percent: { top: y(331) - 15, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -1.2, color: C.percent },
  line: { top: y(362), fontSize: 14, lineHeight: 17, fontWeight: '600', letterSpacing: -0.56, color: C.mute },
  // 흰 점수 칸 — 카드 기준 (28, 398) 255×61, 칸마다 64 간격
  scores: { position: 'absolute', left: 5, right: 5, bottom: 4, height: 61, paddingTop: 11, flexDirection: 'row', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: '#FFFFFF' },
  score: { flex: 1, alignItems: 'center' },
  scoreV: { fontSize: 18, lineHeight: 21, fontWeight: '800', letterSpacing: -0.72, color: C.ink },
  scoreK: { marginTop: 2, fontSize: 12, lineHeight: 14, fontWeight: '600', letterSpacing: -0.48, color: C.mute },
  foot: { position: 'absolute', left: 24, right: 24, top: 482, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hook: { fontSize: 16, lineHeight: 18, fontWeight: '800', letterSpacing: -0.8, color: C.ink },
  url: { marginTop: 8, fontSize: 14, lineHeight: 17, fontWeight: '500', letterSpacing: -0.56, color: C.ink },
  cta: { marginTop: 3, height: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 5, backgroundColor: C.dark },
  ctaText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.26, color: '#EDEDED' },
});
