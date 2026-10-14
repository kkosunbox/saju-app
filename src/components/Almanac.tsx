import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, radius, sansW } from '../theme/typography';
import { parseISO, weekdayOf } from '../utils/date';

/**
 * 책력(冊曆) 한 장 — 공유 카드와 같은 디자인 언어를 앱 안에서도 쓴다.
 * 이중 테두리 · 모서리 꺾쇠 · 제호와 날짜 · 왼쪽 정렬 명조 · 비스듬한 낙관 · 옅은 워터마크 한자.
 * tone: 관점·분야 고유색(color) / 바탕색(bg)
 */
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;
const WEEK_H = ['日', '月', '火', '水', '木', '金', '土'];

export function AlmanacHero({ tone, kicker, seal, eyebrow, title, today, tags, children }: {
  tone: { color: string; bg: string }; kicker: string; seal: string; eyebrow?: string; title: string; today: string;
  tags?: string[]; children?: React.ReactNode;
}) {
  const { m, d } = parseISO(today);
  return (
    <View style={[s.sheet, { backgroundColor: tone.bg }]}>
      <Text style={[s.wm, { color: tone.color }]} numberOfLines={1}>{seal}</Text>
      <View style={[s.frame, { borderColor: tone.color + '40' }]}>
        <View style={[s.frameIn, { borderColor: tone.color + '30' }]}>
          {(['tl', 'tr', 'bl', 'br'] as const).map(k => <View key={k} style={[s.corner, s[k], { borderColor: tone.color }]} />)}
          <View style={s.mast}>
            <Text style={[s.kicker, { color: tone.color }]}>{kicker}</Text>
            <Text style={s.date}>{m}.{String(d).padStart(2, '0')} {WEEK_H[weekdayOf(today)]}</Text>
          </View>
          <View style={[s.rule, { backgroundColor: colors.ink }]} />
          <View style={[s.ruleThin, { backgroundColor: colors.ink }]} />
          <View style={s.body}>
            {eyebrow ? <Text style={[s.eyebrow, { color: tone.color }]}>{eyebrow}</Text> : null}
            <Text style={[s.title, KEEP]}>{title}</Text>
            {tags?.length ? (
              <View style={s.tags}>
                {tags.map((t, i) => (
                  <View key={t} style={[s.tag, { borderColor: tone.color, transform: [{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }] }]}>
                    <Text style={[s.tagText, { color: tone.color }]}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={[s.stamp, { backgroundColor: tone.color }]}>
              <View style={s.stampIn}><Text style={s.stampText}>{seal}</Text></View>
            </View>
          </View>
          {children}
        </View>
      </View>
    </View>
  );
}

/** 장부형 목록 — 一·二·三 번호 + 작은 라벨 + 명조 값, 점선 구분 */
const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export function Ledger({ rows, tone }: { rows: [string, string][]; tone: string }) {
  return (
    <View style={s.ledger}>
      {rows.map(([k, v], i) => (
        <View key={k} style={[s.lrow, i > 0 && s.ldash]}>
          <Text style={[s.lnum, { color: tone }]}>{NUM[i] ?? i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.lk}>{k}</Text>
            <Text style={[s.lv, KEEP]}>{v}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** 풀이 인용 — 왼쪽 색 띠 + 명조 본문 */
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
  sheet: { borderRadius: radius.xl, padding: 10, overflow: 'hidden', marginTop: 4 },
  wm: { position: 'absolute', right: -24, bottom: -40, fontFamily: fonts.serif, fontSize: 200, lineHeight: 220, fontWeight: '700', opacity: 0.07 },
  frame: { borderWidth: 1, borderRadius: 10, padding: 3 },
  frameIn: { borderWidth: 0.5, borderRadius: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 },
  corner: { position: 'absolute', width: 10, height: 10, opacity: 0.8 },
  tl: { top: 5, left: 5, borderTopWidth: 1, borderLeftWidth: 1 },
  tr: { top: 5, right: 5, borderTopWidth: 1, borderRightWidth: 1 },
  bl: { bottom: 5, left: 5, borderBottomWidth: 1, borderLeftWidth: 1 },
  br: { bottom: 5, right: 5, borderBottomWidth: 1, borderRightWidth: 1 },
  mast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  kicker: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  date: { fontSize: 12, fontWeight: '600', color: colors.inkMute, letterSpacing: 0.4 },
  rule: { height: 1.2, marginTop: 8, opacity: 0.8 },
  ruleThin: { height: 0.5, marginTop: 2, opacity: 0.6 },
  body: { marginTop: 16, paddingRight: 54, minHeight: 64 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 31, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { borderWidth: 1.2, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  stamp: { position: 'absolute', right: 0, top: 0, width: 50, height: 50, borderRadius: 4, padding: 3, transform: [{ rotate: '-6deg' }] },
  stampIn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  stampText: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 31, fontWeight: '700', color: '#FBF4E8' },
  ledger: { borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18, paddingVertical: 4 },
  lrow: { flexDirection: 'row', gap: 14, paddingVertical: 14 },
  ldash: { borderTopWidth: 1, borderTopColor: colors.lineStrong, borderStyle: 'dashed' },
  lnum: { width: 18, fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  lk: { fontSize: 12, fontWeight: '700', color: colors.inkMute, letterSpacing: 0.3 },
  lv: { ...sansW('600'), fontSize: 16, lineHeight: 23, color: colors.ink, marginTop: 3 },
  quote: { flexDirection: 'row', gap: 14, marginTop: 14, paddingVertical: 4 },
  qbar: { width: 3, borderRadius: 2 },
  qlabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  qtext: { ...sansW('400'), fontSize: 16, lineHeight: 26, color: colors.ink, marginTop: 6 },
  fig: { marginTop: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 18 },
  figHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  figTitle: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: colors.ink },
  figCap: { fontSize: 12, color: colors.inkMute, fontWeight: '600' },
});
