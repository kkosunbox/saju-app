import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import ScoreRing from '../components/ScoreRing';
import CategoryRow from '../components/CategoryRow';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { fortuneApi } from '../api/fortune';
import { Period, PeriodFortune } from '../types';
import { CategoryKey, colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { motion, useReducedMotion } from '../utils/motion';

const TABS: { key: Period; label: string }[] = [
  { key: 'daily', label: '오늘' }, { key: 'weekly', label: '주간' }, { key: 'monthly', label: '월간' }, { key: 'yearly', label: '연간' },
];
const CHART_H = 120;

function FlowBar({ label, score, best, index }: { label: string; score: number; best: boolean; index: number }) {
  const reduced = useReducedMotion();
  const h = useRef(new Animated.Value(0)).current;
  const target = Math.max(10, ((score - 50) / 50) * CHART_H);
  useEffect(() => {
    if (reduced) { h.setValue(target); return; }
    h.setValue(0);
    Animated.timing(h, { toValue: target, duration: 700, delay: index * 45, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [target, reduced]);
  return (
    <View style={s.col}>
      <Text style={[s.colScore, best && { color: colors.purple }]}>{score}</Text>
      <Animated.View style={[s.colBar, { height: h, backgroundColor: best ? colors.purple : colors.lavender }]} />
      <Text style={[s.colLabel, best && { color: colors.purple, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

export default function FortuneScreen() {
  const { user, fortune, today } = useApp();
  const [tab, setTab] = useState<Period>('daily');
  const [period, setPeriod] = useState<PeriodFortune | null>(null);
  useEffect(() => {
    if (!user || tab === 'daily') return setPeriod(null);
    let alive = true;
    fortuneApi.getPeriod(user, today, tab).then(p => alive && setPeriod(p));
    return () => { alive = false; };
  }, [user, today, tab]);
  if (!user || !fortune) return null;
  const f = fortune.combined;

  const score = tab === 'daily' ? f.totalScore : period?.score ?? 0;
  const label = tab === 'daily' ? '오늘' : period?.label ?? '';
  const summary = tab === 'daily' ? f.summary : period?.summary ?? '';
  const bestScore = period ? Math.max(...period.flow.map(x => x.score)) : 0;

  return (
    <Screen largeTitle="운세">
      <Segmented<Period> options={TABS} value={tab} onChange={setTab} />

      <Card style={s.summary}>
        <ScoreRing key={tab} score={score} size={84} stroke={7} color={colors.purpleSoft} track={colors.lavenderSoft} textColor={colors.purple} />
        <View style={{ flex: 1 }}>
          <Text style={txt.caption}>{label}의 흐름</Text>
          <Text style={[txt.bodyStrong, { marginTop: 4 }]}>{summary}</Text>
          {period ? (
            <View style={s.focus}><Text style={s.focusText}>집중 테마 · {period.focus}</Text></View>
          ) : null}
        </View>
      </Card>

      {tab === 'daily' ? (
        <>
          <SectionHeader title="분야별 운세" />
          <Card style={{ paddingVertical: 4 }}>
            {(['love', 'money', 'work', 'relationship'] as CategoryKey[]).map((k, i) => (
              <View key={k} style={i > 0 ? s.border : null}>
                <CategoryRow category={k} score={f[k]} text={f.categoryTexts[k]} delay={i * 80} onPress={() => router.push(`/category/${k}`)} />
              </View>
            ))}
          </Card>
        </>
      ) : period ? (
        <>
          <SectionHeader title={tab === 'weekly' ? '요일별 흐름' : tab === 'monthly' ? '주차별 흐름' : '월별 흐름'} />
          <Card style={s.chart}>
            {period.flow.map((x, i) => (
              <FlowBar key={`${tab}-${x.label}`} label={x.label} score={x.score} best={x.score === bestScore} index={i} />
            ))}
          </Card>
        </>
      ) : null}
      <Disclaimer />
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  focus: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.lavenderSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  focusText: { fontSize: 12, fontWeight: '700', color: colors.purple },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 22, height: CHART_H + 80 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' },
  colScore: { fontSize: 10, color: colors.inkMute, fontWeight: '700' },
  colBar: { width: '72%', maxWidth: 26, borderRadius: 6 },
  colLabel: { fontSize: 11, color: colors.inkSub },
});
