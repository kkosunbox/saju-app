import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot, { ArtName } from './Mascot';
import { colors } from '../theme/colors';
import { fonts, radius, sansW } from '../theme/typography';
import { parseISO, weekdayOf } from '../utils/date';

/**
 * 상세 화면 첫 카드 — 관점·분야 색의 옅은 그라디언트 위에 제목 · 키워드 · 마스코트.
 * (예전 책력 한 장의 자리. 공유 카드와 같은 내용 순서를 지킨다)
 * tone: 관점·분야 고유색(color) / 바탕색(bg). seal: 관점·분야 한자 — 마스코트 포즈를 고르는 데 쓴다.
 */
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const POSE: Record<string, ArtName> = { 命: 'pose-saju', 星: 'pose-thai', 曜: 'pose-thai', 性: 'pose-mbti', 血: 'pose-blood' };

export function AlmanacHero({ tone, kicker, seal, eyebrow, title, today, tags, children }: {
  tone: { color: string; bg: string }; kicker: string; seal: string; eyebrow?: string; title: string; today: string;
  tags?: string[]; children?: React.ReactNode;
}) {
  const { m, d } = parseISO(today);
  // "四柱 · 사주" 처럼 한자 제호가 앞에 붙어 오면 한글만 쓴다
  const label = kicker.includes(' · ') ? kicker.split(' · ').slice(1).join(' · ') : kicker;
  return (
    <LinearGradient colors={[tone.bg, colors.cream]} locations={[0, 1]} style={s.sheet}>
      <View style={s.mast}>
        <Text style={[s.kicker, { color: tone.color }]}>{label}</Text>
        <Text style={s.date}>{m}.{String(d).padStart(2, '0')} ({WEEK[weekdayOf(today)]})</Text>
      </View>
      <View style={s.body}>
        <Mascot name={POSE[seal] ?? 'mascot'} size={64} style={s.art} />
        {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
        <Text style={[s.title, KEEP]}>{title}</Text>
        {tags?.length ? (
          <View style={s.tags}>
            {tags.map(t => (
              <View key={t} style={[s.tag, { borderColor: tone.color }]}>
                <Text style={[s.tagText, { color: tone.color }]}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {children}
    </LinearGradient>
  );
}

/** 목록 — 번호 동그라미 + 작은 라벨 + 굵은 값 */
export function Ledger({ rows, tone }: { rows: [string, string][]; tone: string }) {
  return (
    <View style={s.ledger}>
      {rows.map(([k, v], i) => (
        <View key={k} style={[s.lrow, i > 0 && s.ldash]}>
          <View style={[s.lnum, { backgroundColor: tone }]}><Text style={s.lnumT}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.lk}>{k}</Text>
            <Text style={[s.lv, KEEP]}>{v}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** 풀이 인용 — 왼쪽 색 띠 + 본문 */
export function Quote({ label, text, tone }: { label: string; text: string; tone: string }) {
  return (
    <View style={s.quote}>
      <View style={[s.qbar, { backgroundColor: tone }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.qlabel, { color: tone }]}>{label}</Text>
        <Text style={[s.qtext, KEEP]}>{text}</Text>
      </View>
    </View>
  );
}

/** 도해 카드 틀 — 제목 + 그림 */
export function Figure({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <View style={s.fig}>
      <View style={s.figHead}>
        <Text style={s.figTitle}>{title}</Text>
        {caption ? <Text style={s.figCap}>{caption}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  sheet: { borderRadius: radius.lg, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, overflow: 'hidden', marginTop: 4 },
  mast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: -0.4 },
  date: { fontSize: 12, fontWeight: '500', color: colors.inkMute },
  body: { marginTop: 14, paddingRight: 72, minHeight: 64 },
  art: { position: 'absolute', right: -4, top: -4 },
  eyebrow: { fontSize: 13, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.5 },
  title: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.8, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { borderWidth: 0.5, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: colors.cream },
  tagText: { fontSize: 12, fontWeight: '600' },
  ledger: { borderRadius: radius.lg, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 4 },
  lrow: { flexDirection: 'row', gap: 14, paddingVertical: 14 },
  ldash: { borderTopWidth: 1, borderTopColor: colors.line },
  lnum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  lnumT: { fontSize: 12, fontWeight: '700', color: colors.white },
  lk: { fontSize: 12, fontWeight: '600', color: colors.inkMute },
  lv: { ...sansW('600'), fontSize: 15, lineHeight: 22, color: colors.ink, letterSpacing: -0.5, marginTop: 3 },
  quote: { flexDirection: 'row', gap: 14, marginTop: 14, paddingVertical: 4 },
  qbar: { width: 3, borderRadius: 2 },
  qlabel: { fontSize: 12, fontWeight: '700' },
  qtext: { ...sansW('400'), fontSize: 15, lineHeight: 24, color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  fig: { marginTop: 14, borderRadius: radius.lg, backgroundColor: colors.card, padding: 16 },
  figHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  figTitle: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: colors.ink },
  figCap: { fontSize: 12, color: colors.inkMute, fontWeight: '600' },
});
