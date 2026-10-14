import React, { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import BrandMark from './BrandMark';
import { ShareSpec } from '../services/share/shareSpecs';
import { parseISO } from '../utils/date';
import { seededRandom } from '../utils/seed';
import { fonts } from '../theme/typography';

/**
 * 공유 카드 — 인스타 스토리 비율(9:16). 책력(冊曆) 한 장처럼:
 * 한지 결 · 이중 테두리와 모서리 꺾쇠 · 제호와 호수(第 N 號) · 왼쪽 정렬 활자 · 붉은 낙관 ·
 * 실선으로 나눈 숫자 칸 · 가려 둔 "봉인된 이야기"로 호기심을 남기고, 마지막 질문으로 앱에 부른다.
 * 모든 간격은 8pt(4pt) 단위. 캡처(html2canvas)에서도 그대로 나오도록 View·Text만 쓴다.
 */
const C = {
  bg: '#F4EDDF', ink: '#1C1A17', mute: '#6F675B', line: '#CDBFA6', accent: '#A8402B',
  seal: '#B5432E', sealInk: '#FBF4E8', wm: 'rgba(28,26,23,0.045)', fiber: '#8A6F45',
};

/** 웹에서 한국어가 단어 중간에서 끊기지 않게 */
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 가림막 막대 너비 — 글자처럼 보이게 길이를 섞는다 */
const BARS = [64, 40, 88, 28, 52, 36];

export const CARD_W = 320;

/** 한지 섬유 — 콘텐츠마다 같은 배치가 나오도록 파일 이름으로 시드 */
function fibers(seed: string) {
  const r = seededRandom(seed);
  return Array.from({ length: 22 }, () => ({
    left: r() * 300, top: r() * 560, width: 8 + r() * 28, rot: r() * 70 - 35, op: 0.035 + r() * 0.04, h: 0.6,
  }));
}

const ShareCard = forwardRef<View, { spec: ShareSpec; today: string }>(({ spec, today }, ref) => {
  const { y, m, d } = parseISO(today);
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  const longHead = spec.headline.length > 18;
  return (
    <View ref={ref} collapsable={false} style={s.card}>
      {/* 한지 결 */}
      {fibers(spec.file).map((f, i) => (
        <View key={i} style={{ position: 'absolute', left: f.left, top: f.top, width: f.width, height: f.h, backgroundColor: C.fiber, opacity: f.op, borderRadius: 1, transform: [{ rotate: `${f.rot}deg` }] }} />
      ))}
      {/* 큰 워터마크 한자 */}
      <Text style={s.wm} numberOfLines={1}>{spec.seal}</Text>

      <View style={s.frame}>
        <View style={s.frameIn}>
          {/* 모서리 꺾쇠 */}
          <View style={[s.corner, { top: 4, left: 4, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[s.corner, { top: 4, right: 4, borderTopWidth: 1, borderRightWidth: 1 }]} />
          <View style={[s.corner, { bottom: 4, left: 4, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[s.corner, { bottom: 4, right: 4, borderBottomWidth: 1, borderRightWidth: 1 }]} />

          {/* 제호 */}
          <View style={s.mast}>
            <View style={s.brand}>
              <BrandMark size={15} />
            </View>
            <Text style={s.issue}>第 {doy} 號 · {y}.{String(m).padStart(2, '0')}.{String(d).padStart(2, '0')}</Text>
          </View>
          <View style={s.rule} />
          <View style={s.ruleThin} />

          {/* 분류 */}
          <View style={s.kindRow}>
            <View style={s.kindBar} />
            <Text style={s.kind}>{spec.kind}</Text>
          </View>

          {/* 본문 */}
          <View style={s.hero}>
            <Text style={s.eyebrow} numberOfLines={1}>{spec.eyebrow}</Text>
            <Text style={[longHead ? s.headSm : s.head, KEEP]} numberOfLines={3}>{spec.headline}</Text>
            {spec.sub ? <Text style={[s.sub, KEEP]} numberOfLines={spec.big ? 1 : 2}>{spec.sub}</Text> : null}
            {/* 낙관: 붉은 바탕 · 흰 글자 · 안쪽 테두리 */}
            <View style={s.stamp}>
              <View style={s.stampIn}><Text style={s.stampText}>{spec.seal}</Text></View>
            </View>
          </View>

          {/* 남는 높이에는 장식 구분선 */}
          <View style={s.spacer}>
            <View style={s.orn}>
              <View style={s.ornLine} />
              <View style={s.ornDot} />
              <View style={s.ornLine} />
            </View>
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

          {/* 봉인된 이야기 */}
          {spec.teaser ? (
            <View style={s.teaser}>
              <View style={s.teaserHead}>
                <View style={s.lock}><Text style={s.lockText}>封</Text></View>
                <Text style={s.teaserLabel} numberOfLines={1}>{spec.teaser}</Text>
                <Text style={s.teaserOpen}>앱에서만 열려요</Text>
              </View>
              <View style={s.bars}>
                {BARS.map((w, i) => <View key={i} style={[s.bar, { width: w, opacity: 0.78 + (i % 3) * 0.07 }]} />)}
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
      </View>
    </View>
  );
});

export default ShareCard;

const s = StyleSheet.create({
  card: { width: CARD_W, aspectRatio: 9 / 16, padding: 12, overflow: 'hidden', backgroundColor: C.bg },
  wm: { position: 'absolute', right: -48, bottom: 72, fontFamily: fonts.serif, fontSize: 300, lineHeight: 320, fontWeight: '700', color: C.wm },
  frame: { flex: 1, borderWidth: 1, borderColor: C.line, padding: 3 },
  frameIn: { flex: 1, borderWidth: 0.5, borderColor: C.line, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  corner: { position: 'absolute', width: 10, height: 10, borderColor: C.accent, opacity: 0.7 },
  mast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  brandText: { fontFamily: fonts.display, fontSize: 14, fontWeight: '800', letterSpacing: 0.6, color: C.ink },
  brandSub: { fontSize: 11, fontWeight: '600', color: C.mute, letterSpacing: 1 },
  issue: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, color: C.mute },
  rule: { height: 1.5, marginTop: 8, backgroundColor: C.ink },
  ruleThin: { height: 0.5, marginTop: 2, backgroundColor: C.ink },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  kindBar: { width: 16, height: 2, backgroundColor: C.accent },
  kind: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: C.accent },
  hero: { marginTop: 12, paddingRight: 60 },
  eyebrow: { fontSize: 12, fontWeight: '600', color: C.mute },
  head: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, marginTop: 8, color: C.ink },
  headSm: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6, marginTop: 8, color: C.ink },
  sub: { fontSize: 12, lineHeight: 18, marginTop: 8, color: C.mute },
  stamp: { position: 'absolute', right: 0, top: 0, width: 52, height: 52, borderRadius: 4, backgroundColor: C.seal, padding: 3, opacity: 0.94, transform: [{ rotate: '-6deg' }] },
  stampIn: { flex: 1, borderWidth: 1, borderColor: 'rgba(251,244,232,0.7)', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  stampText: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, fontWeight: '700', color: C.sealInk },
  spacer: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  orn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  ornLine: { width: 48, height: 0.5, backgroundColor: C.line },
  ornDot: { width: 5, height: 5, backgroundColor: C.accent, opacity: 0.7, transform: [{ rotate: '45deg' }] },
  big: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 4 },
  bigVal: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 48, fontWeight: '700', letterSpacing: -1.5, color: C.ink },
  bigUnit: { fontSize: 16, fontWeight: '600', letterSpacing: 0, color: C.mute },
  bigLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingBottom: 8, color: C.mute },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, marginTop: 8 },
  stat: { flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  statK: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: C.mute },
  statV: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: 2, color: C.ink },
  teaser: { marginTop: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, borderRadius: 4, padding: 8, backgroundColor: 'rgba(255,253,248,0.5)' },
  teaserHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: { width: 18, height: 18, borderRadius: 2, backgroundColor: C.seal, alignItems: 'center', justifyContent: 'center' },
  lockText: { fontFamily: fonts.serif, fontSize: 11, lineHeight: 14, fontWeight: '700', color: C.sealInk },
  teaserLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: C.ink },
  teaserOpen: { fontSize: 11, fontWeight: '700', color: C.accent },
  bars: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.ink },
  foot: { marginTop: 12 },
  hook: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 24, fontWeight: '700', letterSpacing: -0.4, color: C.ink },
  footRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  url: { fontSize: 11, fontWeight: '600', color: C.mute },
  cta: { fontSize: 11, fontWeight: '800', color: C.accent },
});
