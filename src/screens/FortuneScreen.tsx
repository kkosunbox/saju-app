import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import Card from '../components/Card';
import ScoreRing from '../components/ScoreRing';
import CategoryRow from '../components/CategoryRow';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { LockCard } from '../components/premium/Kit';
import { ITEMS } from '../services/premium/catalog';
import { parseISO } from '../utils/date';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { fortuneApi } from '../services/server/fortuneApi';
import { Period } from '../types';
import { CategoryKey, colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { motion, useReducedMotion } from '../utils/motion';
import { COPY } from '../content/copy';

const TABS: { key: Period; label: string }[] = [
  { key: 'daily', label: '오늘' }, { key: 'weekly', label: '주간' }, { key: 'monthly', label: '월간' }, { key: 'yearly', label: '연간' },
];
const CHART_H = 120;
const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];
/** 목록에 가격만 보여주기 위한 대표 상품 */
const CONSULT_ITEM = { ...ITEMS.consult('preview'), title: '고민 상담 1회' };
const CRUSH_ITEM = { ...ITEMS.crush(0, ''), key: 'crush:preview', title: '그 사람의 속마음' };

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
      <Animated.View style={[s.colBar, { height: h, backgroundColor: best ? colors.navy : colors.lavender }]} />
      <Text style={[s.colLabel, best && { color: colors.purple, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

/** 오늘 · 주간 · 월간 · 연간 운세 (홈 · 콘텐츠에서 들어온다) */
export default function FortuneScreen() {
  const { user, fortune, today } = useApp();
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Fortune'>>();
  const [tab, setTab] = useState<Period>(TABS.some(t => t.key === params?.period) ? params!.period! : 'daily');
  const [open, setOpen] = useState<CategoryKey | null>(null);
  const periodQuery = useQuery({
    queryKey: ['period', tab, user?.id, user?.version, today],
    enabled: !!user && tab !== 'daily',
    queryFn: () => fortuneApi.period(tab as 'weekly' | 'monthly' | 'yearly'),
  });
  const period = tab === 'daily' ? null : periodQuery.data ?? null;
  if (!user || !fortune) return null;
  const f = fortune.combined;

  const score = tab === 'daily' ? f.totalScore : period?.score ?? 0;
  const label = tab === 'daily' ? '오늘' : period?.label ?? '';
  const summary = tab === 'daily' ? f.summary : period?.summary ?? (periodQuery.error ? '불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : '불러오는 중…');
  const bestScore = period ? Math.max(...period.flow.map(x => x.score)) : 0;

  // 이 기간에 가장 약한 분야를 먼저 추천하고, 기간에 맞는 유료 콘텐츠를 덧붙인다
  const scoreOf = (k: CategoryKey) => (tab === 'daily' ? f[k] : period?.cats[k].score ?? 0);
  const weak = CATS.reduce((a, b) => (scoreOf(b) < scoreOf(a) ? b : a));
  const { y: ty, m: tm } = parseISO(today);
  const R = {
    love: { key: 'theme-love', title: `${label} 연애운이 아쉽다면`, desc: '연애·결혼 운세 · 잘 맞는 사람 · 인연이 오는 해', item: ITEMS.theme('love'), go: () => nav.navigate('Theme', { kind: 'love' }) },
    money: { key: 'theme-money', title: `${label} 재물운이 아쉽다면`, desc: '재물 운세 · 돈 버는 방식 · 재물이 모이는 시기', item: ITEMS.theme('money'), go: () => nav.navigate('Theme', { kind: 'money' }) },
    work: { key: 'theme-career', title: `${label} 직장운이 아쉽다면`, desc: '직업·적성 운세 · 커리어 상승기 · 이직 타이밍', item: ITEMS.theme('career'), go: () => nav.navigate('Theme', { kind: 'career' }) },
    relationship: { key: 'consult', title: '사람 때문에 고민이라면', desc: '고민 상담 · 하루 5번 무료 · 사주가 익명으로 답해요', item: CONSULT_ITEM, go: () => nav.navigate('Tabs', { screen: 'Consult' }) },
    consult: { key: 'consult', title: '고민 상담', desc: '하루 5번 무료 · 결론부터 · 이어서 물어보기', item: CONSULT_ITEM, go: () => nav.navigate('Tabs', { screen: 'Consult' }) },
    lucky: { key: 'lucky', title: '길일 찾기', desc: '이사 · 계약 · 고백 · 면접하기 좋은 날 TOP 5', item: ITEMS.lucky('move', today), go: () => nav.navigate('Lucky') },
    crush: { key: 'crush', title: '그 사람의 속마음', desc: '마음 온도 · 연인 가능성 · 연락하기 좋은 날', item: CRUSH_ITEM, go: () => nav.navigate('Tabs', { screen: 'Compatibility' }) },
    monthly: { key: 'monthly', title: `${tm}월 상세운세`, desc: '운세 달력 · 주차별 흐름 · 좋은 날 활용법 · 이달의 미션', item: ITEMS.monthly(ty, tm), go: () => nav.navigate('Monthly') },
    newyear: { key: 'newyear', title: `${ty}년 신년운세`, desc: '올해의 사자성어 · 분야별 6대 운세 · 12개월 하나하나', item: ITEMS.newyear(ty), go: () => nav.navigate('NewYear') },
    life: { key: 'life', title: '평생운 · 10년 대운', desc: '인생 그래프 · 황금기와 위기 · 앞으로 10년', item: ITEMS.life(), go: () => nav.navigate('Life') },
    spouse: { key: 'spouse', title: '미래 배우자 리포트', desc: '어떤 사람을, 언제, 어디서 만나게 될까?', item: ITEMS.spouse(), go: () => nav.navigate('Spouse') },
  };
  const BY_TAB: Record<Period, (keyof typeof R)[]> = { daily: ['consult', 'spouse'], weekly: ['lucky', 'crush'], monthly: ['monthly', 'lucky'], yearly: ['newyear', 'life'] };
  const recs = [R[weak], ...BY_TAB[tab].map(k => R[k])].filter((r, i, a) => a.findIndex(x => x.key === r.key) === i).slice(0, 3);

  return (
    <Screen largeTitle="운세" subtitle={COPY.four} back>
      <Segmented<Period> options={TABS} value={tab} onChange={t => { setTab(t); setOpen(null); }} />

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

      <SectionHeader title={`${label} 분야별 운세`} caption={tab === 'daily' ? '눌러서 자세히 보기' : '눌러서 풀이 펼치기'} />
      <Card style={{ paddingVertical: 4 }}>
        {CATS.map((k, i) => {
          const c = tab === 'daily' ? { score: f[k], text: f.categoryTexts[k], best: '' } : period?.cats[k];
          if (!c) return null;
          return (
            <View key={`${tab}-${k}`} style={i > 0 ? s.border : null}>
              <CategoryRow
                category={k} score={c.score} text={c.text} delay={i * 80}
                badge={c.best ? `${c.best} 최고` : undefined}
                lines={tab !== 'daily' && open === k ? 4 : 1}
                onPress={() => (tab === 'daily' ? nav.navigate('CategoryDetail', { category: k }) : setOpen(open === k ? null : k))}
              />
            </View>
          );
        })}
      </Card>

      {period ? (
        <>
          <SectionHeader title={tab === 'weekly' ? '요일별 흐름' : tab === 'monthly' ? '주차별 흐름' : '월별 흐름'} />
          <Card style={s.chart}>
            {period.flow.map((x, i) => (
              <FlowBar key={`${tab}-${x.label}`} label={x.label} score={x.score} best={x.score === bestScore} index={i} />
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="더 깊이 보기" caption={`${label}의 흐름에 맞춰 골랐어요`} />
      {recs.map((r, i) => (
        <LockCard key={r.key} title={r.title} desc={r.desc} item={r.item} onPress={r.go} mt={i === 0 ? 0 : 10} />
      ))}
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
  colScore: { fontSize: 11, color: colors.inkMute, fontWeight: '700' },
  colBar: { width: '72%', maxWidth: 26, borderRadius: 6 },
  colLabel: { fontSize: 12, color: colors.inkSub },
});
