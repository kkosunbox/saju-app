import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import ScoreBar from './ScoreBar';
import AnimatedNumber from './AnimatedNumber';
import Icon from './Icon';
import { CombinedFortune } from '../types';
import { CategoryKey, categoryTheme, colors, isDark } from '../theme/colors';
import { fonts, radius, sansW } from '../theme/typography';
import { BRANCHES, STEMS } from '../data/sajuData';
import { dayPillar } from '../services/fortune/sajuService';
import { parseISO, weekdayOf } from '../utils/date';
import { useReducedMotion } from '../utils/motion';

const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
const GRADES = ['守', '平', '吉', '大吉'];
const WEEK_H = ['日', '月', '火', '水', '木', '金', '土'];
const KEEP = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 점수 → 책력의 길흉 한 글자. 나쁜 말은 쓰지 않는다(낮은 날은 '지키는 날') */
function grade(n: number) {
  if (n >= 85) return { h: '大吉', ko: '크게 좋은 날' };
  if (n >= 70) return { h: '吉', ko: '좋은 날' };
  if (n >= 55) return { h: '平', ko: '무난한 날' };
  return { h: '守', ko: '지키는 날' };
}

/** 한지 · 먹 · 인주 — 다크 모드에선 먹색 종이 */
const P = isDark
  ? { paper: '#1F1D19', edge: '#3A352C', rule: 'rgba(237,231,219,0.55)', hair: 'rgba(237,231,219,0.14)', wm: 'rgba(237,231,219,0.05)', fiber: 'rgba(237,231,219,0.05)' }
  : { paper: '#FBF6EA', edge: '#E3D7BF', rule: 'rgba(28,26,23,0.78)', hair: 'rgba(28,26,23,0.12)', wm: 'rgba(168,64,43,0.06)', fiber: 'rgba(120,96,60,0.07)' };

/** 한지 결 — 날짜로 고정된 옅은 섬유 몇 가닥 (매번 같은 자리) */
function fibers(seed: number) {
  let x = seed * 9301 + 49297;
  const r = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 14 }, () => ({ left: `${r() * 92}%` as const, top: `${r() * 94}%` as const, width: 14 + r() * 26, rot: -30 + r() * 60 }));
}

interface Props { fortune: CombinedFortune; today: string; onOpenStory(): void; onOpenCategory(c: CategoryKey): void }

/**
 * 홈의 얼굴 — 오늘의 책력 한 장.
 * 제호(今日運勢 · 호수 · 날짜) → 큰 명조 점수와 길흉 · 한 줄 요약 · 일진 낙관 → 점수 눈금 →
 * 분야별 장부 칸 → 행운(色·數·時) → 일진과 '종합 풀이' 한 줄. 공유 카드와 같은 디자인 언어.
 */
export default function TodayHero({ fortune: f, today, onOpenStory, onOpenCategory }: Props) {
  const reduced = useReducedMotion();
  const { y, m, d } = parseISO(today);
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  const dp = dayPillar(today);
  const stem = STEMS[dp.stem], branch = BRANCHES[dp.branch];
  const g = grade(f.totalScore);

  const n = useRef(new Animated.Value(reduced ? f.totalScore : 0)).current;
  useEffect(() => {
    if (reduced) { n.setValue(f.totalScore); return; }
    Animated.timing(n, { toValue: f.totalScore, duration: 900, delay: 250, useNativeDriver: false }).start();
  }, [f.totalScore, reduced]);

  return (
    <View style={s.sheet}>
      {fibers(doy).map((x, i) => (
        <View key={i} pointerEvents="none" style={[s.fiber, { left: x.left, top: x.top, width: x.width, transform: [{ rotate: `${x.rot}deg` }] }]} />
      ))}
      <Text pointerEvents="none" style={s.wm} numberOfLines={1}>{g.h.slice(-1)}</Text>

      <View pointerEvents="box-none" style={s.frame}>
        <View pointerEvents="box-none" style={s.frameIn}>
          {(['tl', 'tr', 'bl', 'br'] as const).map(k => <View key={k} pointerEvents="none" style={[s.corner, s[k]]} />)}

          {/* 제호 */}
          <View style={s.mast}>
            <Text style={s.kicker}>今日運勢<Text style={s.kickerKo}>  오늘의 종합운</Text></Text>
            <Text style={s.issue}>第 {doy} 號 · {m}.{String(d).padStart(2, '0')} {WEEK_H[weekdayOf(today)]}</Text>
          </View>
          <View style={s.rule} />
          <View style={s.ruleThin} />

          <PressableScale onPress={onOpenStory} scaleTo={0.985} accessibilityLabel={`오늘의 종합운 ${f.totalScore}점, ${g.ko}. ${f.summary} 종합 풀이 보기`}>
            {/* 점수 · 길흉 · 요약 · 일진 낙관 */}
            <View style={s.main}>
              <View style={s.scoreCol}>
                <View style={s.scoreRow}>
                  <AnimatedNumber value={n} initial={reduced ? f.totalScore : 0} style={s.score} />
                  <Text style={s.unit}>點</Text>
                </View>
                <View style={s.gradeBox}>
                  <Text style={s.gradeH}>{g.h}</Text>
                  <Text style={s.gradeKo}>{g.ko}</Text>
                </View>
              </View>
              <View style={s.vrule} />
              <View style={{ flex: 1 }}>
                <Text style={[s.summary, KEEP]} numberOfLines={3}>{f.summary}</Text>
                <View style={s.tags}>
                  {f.keywords.slice(0, 3).map((k, i) => (
                    <View key={k} style={[s.tag, { transform: [{ rotate: `${i % 2 ? 1.2 : -1.2}deg` }] }]}>
                      <Text style={s.tagText}>{k}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 일진 낙관 — 오늘의 간지 두 글자를 세로로 */}
            <View pointerEvents="none" style={s.seal}>
              <View style={s.sealIn}>
                <Text style={s.sealText}>{stem.hanja}</Text>
                <Text style={s.sealText}>{branch.hanja}</Text>
              </View>
            </View>

            {/* 길흉 눈금 — 守 · 平 · 吉 · 大吉 네 칸, 오늘의 칸까지 인주색 */}
            <View style={s.scale}>
              {GRADES.map((h, i) => {
                const on = i <= GRADES.indexOf(g.h), now = h === g.h;
                return (
                  <View key={h} style={s.seg}>
                    <View style={[s.segBar, { backgroundColor: on ? colors.seal : P.hair, opacity: on && !now ? 0.45 : 1 }]} />
                    <Text style={[s.tick, now && s.tickOn]}>{h}</Text>
                  </View>
                );
              })}
            </View>
          </PressableScale>

          {/* 분야별 장부 칸 */}
          <View style={s.ledger}>
            {CATS.map((c, i) => {
              const t = categoryTheme[c];
              return (
                <PressableScale key={c} style={[s.cell, i > 0 && s.cellLine]} onPress={() => onOpenCategory(c)} scaleTo={0.94} accessibilityLabel={`${t.label} ${f[c]}점`}>
                  <View style={s.cellHead}>
                    <Text style={[s.cellH, { color: t.color }]}>{t.emoji}</Text>
                    <Text style={s.cellLabel}>{t.short}</Text>
                  </View>
                  <Text style={s.cellScore}>{f[c]}</Text>
                  <ScoreBar value={f[c]} color={t.color} track={P.hair} height={3} delay={500 + i * 80} />
                </PressableScale>
              );
            })}
          </View>

          {/* 행운 — 色 · 數 · 時 */}
          <View style={s.lucky}>
            <View style={s.luck}>
              <Text style={s.luckH}>色</Text>
              <View style={[s.swatch, { backgroundColor: f.luckyColorHex }]} />
              <Text style={s.luckV} numberOfLines={1}>{f.luckyColor}</Text>
            </View>
            <View style={s.luck}>
              <Text style={s.luckH}>數</Text>
              <Text style={s.luckNum}>{f.luckyNumber}</Text>
            </View>
            <View style={[s.luck, { flex: 1.5 }]}>
              <Text style={s.luckH}>時</Text>
              <Text style={s.luckNum} numberOfLines={1}>{f.luckyTime.replace('~', '–')}</Text>
            </View>
          </View>

          {/* 끝줄 — 일진 · 종합 풀이 */}
          <PressableScale onPress={onOpenStory} scaleTo={0.97} style={s.foot} accessibilityLabel="종합 풀이 읽기">
            <Text style={s.footL}>오늘의 일진 <Text style={s.footH}>{stem.hanja}{branch.hanja}</Text> {stem.ko}{branch.ko}일 · {branch.animal}의 날</Text>
            <View style={s.footR}>
              <Text style={s.footMore}>종합 풀이</Text>
              <Icon name="chevronRight" size={14} color={colors.seal} strokeWidth={2.4} />
            </View>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    borderRadius: radius.xl, padding: 8, overflow: 'hidden', backgroundColor: P.paper, borderWidth: 1, borderColor: P.edge,
    shadowColor: '#3A2A10', shadowOpacity: isDark ? 0.4 : 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  fiber: { position: 'absolute', height: 1, borderRadius: 1, backgroundColor: P.fiber },
  wm: { position: 'absolute', right: -18, bottom: 40, fontFamily: fonts.serif, fontSize: 210, lineHeight: 230, fontWeight: '700', color: P.wm },
  frame: { borderWidth: 1, borderColor: colors.seal + '55', borderRadius: 12, padding: 3 },
  frameIn: { borderWidth: 0.5, borderColor: colors.seal + '40', borderRadius: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  corner: { position: 'absolute', width: 10, height: 10, borderColor: colors.seal, opacity: 0.85 },
  tl: { top: 5, left: 5, borderTopWidth: 1.2, borderLeftWidth: 1.2 },
  tr: { top: 5, right: 5, borderTopWidth: 1.2, borderRightWidth: 1.2 },
  bl: { bottom: 5, left: 5, borderBottomWidth: 1.2, borderLeftWidth: 1.2 },
  br: { bottom: 5, right: 5, borderBottomWidth: 1.2, borderRightWidth: 1.2 },

  mast: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 2 },
  kicker: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700', letterSpacing: 2, color: colors.seal },
  kickerKo: { ...sansW('700'), fontSize: 12, letterSpacing: 0, color: colors.inkSub },
  issue: { ...sansW('600'), fontSize: 12, color: colors.inkMute, letterSpacing: 0.3 },
  rule: { height: 1.4, backgroundColor: P.rule, marginTop: 9 },
  ruleThin: { height: 0.6, backgroundColor: P.rule, marginTop: 2, opacity: 0.7 },

  main: { flexDirection: 'row', alignItems: 'stretch', marginTop: 16, paddingRight: 36 },
  scoreCol: { width: 92, alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end' },
  score: { fontFamily: fonts.serif, fontSize: 60, lineHeight: 64, fontWeight: '700', color: colors.ink, letterSpacing: -2.5, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.inkSub, marginLeft: 3, marginBottom: 10 },
  gradeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  gradeH: { fontFamily: fonts.serif, fontSize: 13, lineHeight: 17, fontWeight: '700', color: colors.seal, borderWidth: 1.2, borderColor: colors.seal, borderRadius: 3, paddingHorizontal: 4, paddingTop: 1 },
  gradeKo: { ...sansW('700'), fontSize: 12, color: colors.seal },
  vrule: { width: 1, backgroundColor: P.hair, marginHorizontal: 12 },
  summary: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { borderWidth: 1.1, borderColor: colors.inkSub, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { ...sansW('700'), fontSize: 12, color: colors.inkSub },

  seal: { position: 'absolute', right: -4, top: 12, width: 34, height: 56, borderRadius: 4, padding: 3, backgroundColor: colors.seal, transform: [{ rotate: '5deg' }] },
  sealIn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  sealText: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 19, fontWeight: '700', color: '#FBF4E8' },

  scale: { flexDirection: 'row', gap: 4, marginTop: 18 },
  seg: { flex: 1, alignItems: 'center', gap: 5 },
  segBar: { alignSelf: 'stretch', height: 3, borderRadius: 2 },
  tick: { fontFamily: fonts.serif, fontSize: 12, fontWeight: '700', color: colors.inkMute },
  tickOn: { color: colors.seal },

  ledger: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: P.hair },
  cell: { flex: 1, paddingVertical: 12, paddingHorizontal: 9, gap: 5 },
  cellLine: { borderLeftWidth: 1, borderLeftColor: P.hair },
  cellHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellH: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700' },
  cellLabel: { ...sansW('600'), fontSize: 12, color: colors.inkSub },
  cellScore: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 26, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },

  lucky: { flexDirection: 'row', paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: P.hair, borderStyle: 'dashed' },
  luck: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  luckH: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700', color: colors.seal },
  swatch: { width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: P.hair },
  luckV: { ...sansW('600'), fontSize: 13.5, color: colors.ink, flexShrink: 1 },
  luckNum: { fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },

  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  footL: { ...sansW('500'), fontSize: 12, color: colors.inkMute, flexShrink: 1 },
  footH: { fontFamily: fonts.serif, fontWeight: '700', color: colors.inkSub },
  footR: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  footMore: { ...sansW('700'), fontSize: 13, color: colors.seal },
});
