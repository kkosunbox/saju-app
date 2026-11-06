import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../components/Screen';
import ScoreRing from '../components/ScoreRing';
import SectionHeader from '../components/SectionHeader';
import Stars from '../components/Stars';
import ScoreDelta, { scoreDeltaLabel } from '../components/ScoreDelta';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { AlmanacHero, Figure, Ledger } from '../components/Almanac';
import { ACTION_NOTE } from '../data/keywords';
import { RootStackParamList } from '../navigation/types';
import { analysisTheme, categoryTheme, colors } from '../theme/colors';
import { useFortuneDraw, useMarkOpened } from '../services/content/opened';
import LoadingScreen from '../components/LoadingScreen';
import PromoSlot from '../components/PromoSlot';
import { PROMO_OF_CATEGORY, promosOf } from '../services/promo/promos';

const KICKER = { love: '緣分 · 연애운', money: '財物 · 재물운', work: '事業 · 직장운', relationship: '人和 · 관계운' } as const;
const VIEWPOINTS = {
  saju: { icon: require('../../assets/figma/category-impact/saju.svg'), color: '#FE8828' },
  thai: { icon: require('../../assets/figma/category-impact/thai.svg'), color: '#61AA4D' },
  mbti: { icon: require('../../assets/figma/category-impact/mbti.svg'), color: '#2885FE' },
  tarot: { icon: require('../../assets/figma/category-impact/tarot.svg'), color: '#B157FB' },
} as const;

export default function CategoryDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'CategoryDetail'>>();
  const nav = useNavigation();
  const { fortune, today, fortuneWriting } = useApp();
  useMarkOpened('fortune');
  useFortuneDraw();
  if (!fortune) return null;
  const t = categoryTheme[params.category];
  // 풀이(AI)가 다 써질 때까지 기다렸다가 한 번에 보여준다
  if (fortuneWriting) return <LoadingScreen title={`오늘의 ${t.label}`} message="오늘의 풀이를 쓰고 있어요" />;
  const f = fortune.combined;
  const score = f[params.category];
  const yesterday = fortune.yesterdayScores?.[params.category];
  const a = fortune.analyses;
  const contributions = (Object.keys(VIEWPOINTS) as (keyof typeof VIEWPOINTS)[])
    .filter(key => f.viewpointImpacts || a[key])
    .map(key => ({ key, v: f.viewpointImpacts?.[key][params.category] ?? a[key]!.scoreBias[params.category] }));
  const maxAbs = Math.max(8, ...contributions.map(c => Math.abs(c.v)));

  return (
    <Screen title={t.label} back>
      <AlmanacHero tone={t} kicker={KICKER[params.category]} seal={t.emoji} eyebrow={`오늘의 ${t.label}`} title={f.categoryTexts[params.category]} today={today}>
        <View style={s.scoreRow}>
          <ScoreRing score={score} accessibilityLabel={`${score}점${scoreDeltaLabel(score, yesterday)}`} size={76} stroke={6} color={t.color} track="rgba(0,0,0,0.06)" textColor={t.color} label="점" />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={s.starsRow}>
              <Stars score={score} color={t.color} size={13} />
              {/* 어제 대비: 링이 다 차오른 뒤 톡 */}
              <ScoreDelta now={score} before={yesterday} prefix="어제보다" delay={1250} />
            </View>
            <Text style={s.scoreNote}>{score >= 83 ? '힘이 실리는 날이에요. 미뤄 둔 일을 꺼내 보세요.' : score >= 66 ? '무난하게 흘러가는 날이에요. 평소 리듬을 지켜요.' : '한 박자 쉬어 가면 좋은 날이에요. 무리하지 마세요.'}</Text>
          </View>
        </View>
      </AlmanacHero>

      <Figure title="관점별 영향" caption={f.viewpointImpacts ? '각 관점 반영 전후의 점수 차이 · 합산하지 않아요' : '이전에 계산된 운세의 관점별 신호예요'}>
        <View style={{ gap: 14 }}>
          {contributions.map(c => {
            const { icon, color } = VIEWPOINTS[c.key];
            const pct = (Math.abs(c.v) / maxAbs) * 50;
            const pos = c.v >= 0;
            return (
              <View key={c.key} style={s.row}>
                <View style={s.viewpointLabel}>
                  <Image source={icon} style={s.viewpointIcon} contentFit="contain" />
                  <Text style={s.rowLabel}>{analysisTheme[c.key].label}</Text>
                </View>
                <View style={s.track}>
                  <View style={s.center} />
                  <View style={[s.bar, { width: `${pct}%`, backgroundColor: color }, pos ? { left: '50%' } : { right: '50%' }]} />
                </View>
                <Text style={[s.val, { color: pos ? color : colors.inkMute }]}>{c.v > 0 ? `+${c.v}` : c.v}</Text>
              </View>
            );
          })}
        </View>
      </Figure>

      <SectionHeader title="오늘의 팁" />
      <Ledger tone={t.color} rows={[
        [f.goodActions[0], ACTION_NOTE[f.goodActions[0]] ?? '오늘 한 번 해 보세요.'],
        [`행운의 시간 ${f.luckyTime}`, '중요한 연락이나 결정은 이 시간대에 잡아 보세요.'],
        ...(score < 66 ? [[`오늘은 피하기 · ${f.avoidActions[0]}`, ACTION_NOTE[f.avoidActions[0]] ?? '오늘은 한 걸음 물러서도 괜찮아요.']] as [string, string][] : []),
      ]} />

      {/* 같은 분야를 더 깊이 보는 유료 콘텐츠 하나 — 점수가 낮은 날은 '아쉽다면'으로 */}
      <SectionHeader title="더 깊이 보기" />
      <PromoSlot
        screen={`category_${params.category}`} promo={promosOf(nav, today)[PROMO_OF_CATEGORY[params.category]]} tone="mint" teaser
        title={score < 66 ? (params.category === 'relationship' ? '사람 때문에 고민이라면' : `오늘 ${t.label}이 아쉽다면`) : undefined}
      />
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', borderStyle: 'dashed' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreNote: { fontSize: 13.5, lineHeight: 20, color: colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewpointLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 104, minHeight: 17 },
  viewpointIcon: { width: 12, height: 12 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  center: { position: 'absolute', left: '50%', width: 1, height: 8, backgroundColor: colors.lineStrong },
  bar: { position: 'absolute', height: 8, borderRadius: 4 },
  val: { width: 30, textAlign: 'right', fontWeight: '800', fontSize: 13 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
