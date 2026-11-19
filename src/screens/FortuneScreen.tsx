import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { RootStackParamList } from '../navigation/types';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import { LinearGradient } from 'expo-linear-gradient';
import ScoreRing from '../components/ScoreRing';
import ResultMascot from '../components/ResultMascot';
import MascotShadow from '../components/MascotShadow';
import { Image } from 'expo-image';
import { PROMO_TONE } from '../components/PromoCard';
import PromoSlot from '../components/PromoSlot';
import { PROMO_OF_CATEGORY, PromoKey, promosOf } from '../services/promo/promos';
import CategoryRow from '../components/CategoryRow';
import FlowLineChart from '../components/FlowLineChart';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { fortuneApi } from '../services/server/fortuneApi';
import { Period } from '../types';
import { CategoryKey, colors, gradients, isDark } from '../theme/colors';
import { radius } from '../theme/typography';

/** 오늘의 운세는 운알톡(오늘의 운세 대화)에서 본다 — 여기는 기간 운세만 */
type PeriodTab = Exclude<Period, 'daily'>;
const TABS: { key: PeriodTab; label: string }[] = [
  { key: 'weekly', label: '주간' }, { key: 'monthly', label: '월간' }, { key: 'yearly', label: '연간' },
];
const TONES: (keyof typeof PROMO_TONE)[] = ['mint', 'lime', 'gold'];
const CATS: CategoryKey[] = ['love', 'money', 'work', 'relationship'];

/** 주간 · 월간 · 연간 운세 (홈 · 콘텐츠에서 들어온다). 기간 운세라 오늘의 운세를 뽑지 않아도 보인다 */
export default function FortuneScreen() {
  const { user, today } = useApp();
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Fortune'>>();
  const [tab, setTab] = useState<PeriodTab>(TABS.some(t => t.key === params?.period) ? params!.period as PeriodTab : 'weekly');
  const periodQuery = useQuery({
    queryKey: ['period', tab, user?.id, user?.version, today],
    enabled: !!user,
    queryFn: () => fortuneApi.period(tab),
  });
  const period = periodQuery.data ?? null;
  if (!user) return null;

  const score = period?.score ?? 0;
  const label = period?.label ?? '';
  const summary = period?.summary ?? (periodQuery.error ? '불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : '불러오는 중…');

  // 이 기간에 가장 약한 분야를 먼저 추천하고, 기간에 맞는 유료 콘텐츠를 덧붙인다
  const scoreOf = (k: CategoryKey) => period?.cats[k].score ?? 0;
  const weak = CATS.reduce((a, b) => (scoreOf(b) < scoreOf(a) ? b : a));
  const P = promosOf(nav, today);
  const WEAK_TITLE: Record<CategoryKey, string> = { love: `${label} 연애운이 아쉽다면`, money: `${label} 재물운이 아쉽다면`, work: `${label} 직장운이 아쉽다면`, relationship: '사람 때문에 고민이라면' };
  const BY_TAB: Record<PeriodTab, PromoKey[]> = {
    weekly: ['lucky', 'crush'], monthly: ['monthly', 'lucky'], yearly: ['newyear', 'life'],
  };
  const recs = [PROMO_OF_CATEGORY[weak], ...BY_TAB[tab]].filter((k, i, a) => a.indexOf(k) === i).slice(0, 3);

  return (
    <Screen title="운세" back>
      <Segmented<PeriodTab> options={TABS} value={tab} onChange={setTab} />

      <LinearGradient colors={gradients.skyCard} style={s.hero}>
        {/* 홈처럼 하늘 위에 옅은 구름을 깔고, 마스코트 발밑에 그림자를 둔다 */}
        {!isDark && <Image source={require('../../assets/figma/home/clouds.webp')} contentFit="fill" accessible={false} style={s.heroClouds} />}
        <View style={{ alignSelf: 'center' }}>
          <MascotShadow size={88} />
          <ResultMascot scores={period ? { totalScore: period.score, love: period.cats.love.score, money: period.cats.money.score, work: period.cats.work.score, relationship: period.cats.relationship.score } : undefined} size={88} />
        </View>
        <View style={s.heroRow}>
          <ScoreRing key={tab} score={score} accessibilityLabel={`${score}점`} size={54} stroke={2.5} color={colors.accent} track="transparent" inner={colors.cream} textColor={colors.inkSub} fontSize={24} />
          <View style={{ flex: 1 }}>
            <View style={s.heroHead}>
              <Text style={s.heroTitle}>{tab === 'weekly' ? '이번주' : label}의 흐름</Text>
              {period ? <View style={s.focus}><Text style={s.focusText}>집중 테마 · {period.focus}</Text></View> : null}
            </View>
            <Text style={s.heroText}>{summary}</Text>
          </View>
        </View>
      </LinearGradient>

      <SectionHeader variant="figma" title={`${label} 분야별 운세`} />
      <View style={{ gap: 16 }}>
        {CATS.map((k, i) => {
          const c = period?.cats[k];
          if (!c) return null;
          return (
            <CategoryRow
              key={`${tab}-${k}`}
              category={k} score={c.score} text={c.text} delay={i * 80}
              badge={c.best ? `${c.best} 최고` : undefined}
            />
          );
        })}
      </View>

      {period ? (
        <>
          <SectionHeader variant="figma" title={tab === 'weekly' ? '요일별 흐름' : tab === 'monthly' ? '주차별 흐름' : '월별 흐름'} />
          <FlowLineChart key={tab} data={period.flow} />
        </>
      ) : null}

      <SectionHeader variant="figma" title="더 깊이 보기" caption={`${label}의 흐름에 맞춰 골랐어요`} />
      <View style={{ gap: 16 }}>
        {recs.map((k, i) => (
          <PromoSlot key={k} screen={`fortune_${tab}`} promo={P[k]} tone={TONES[i % TONES.length]} title={i === 0 ? WEAK_TITLE[weak] : undefined} teaser />
        ))}
      </View>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { marginTop: 20, minHeight: 180, borderRadius: radius.lg, overflow: 'hidden', paddingTop: 19, paddingBottom: 16, paddingHorizontal: 16 },
  // 홈 하늘(375×406)과 같은 비율로 깔고 위쪽 구름만 보이게
  heroClouds: { position: 'absolute', top: 0, left: 0, right: 0, height: 354, opacity: 0.7 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  heroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heroTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  heroText: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6, marginTop: 4 },
  focus: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  focusText: { fontSize: 12, fontWeight: '600', color: colors.purpleSoft, letterSpacing: -0.4 },
});
