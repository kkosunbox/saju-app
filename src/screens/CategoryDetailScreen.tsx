import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Screen from '../components/Screen';
import ScoreRing from '../components/ScoreRing';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Stars from '../components/Stars';
import Disclaimer from '../components/Disclaimer';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { analysisTheme, categoryTheme, CategoryKey, colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ category: CategoryKey }>();
  const { fortune } = useApp();
  if (!fortune) return null;
  const t = categoryTheme[params.category];
  const f = fortune.combined;
  const score = f[params.category];
  const a = fortune.analyses;
  const contributions = [a.saju, a.thai, a.mbti, a.blood].map(x => ({ key: x.source, v: x.scoreBias[params.category] }));
  const maxAbs = Math.max(8, ...contributions.map(c => Math.abs(c.v)));

  return (
    <Screen title={t.label} back>
      <View style={[s.hero, { backgroundColor: t.bg }]}>
        <ScoreRing score={score} size={128} stroke={9} color={t.color} track="rgba(0,0,0,0.06)" textColor={t.color} label="점" />
        <Stars score={score} color={t.color} size={14} />
        <Text style={[txt.h2, s.heroText]}>{f.categoryTexts[params.category]}</Text>
      </View>

      <SectionHeader title="관점별 영향" caption="각 관점이 이 분야 점수를 얼마나 움직였는지" />
      <Card style={{ gap: 14 }}>
        {contributions.map(c => {
          const at = analysisTheme[c.key];
          const pct = (Math.abs(c.v) / maxAbs) * 50;
          const pos = c.v >= 0;
          return (
            <View key={c.key} style={s.row}>
              <Text style={s.rowLabel}>{at.emoji} {at.label}</Text>
              <View style={s.track}>
                <View style={s.center} />
                <View style={[s.bar, { width: `${pct}%`, backgroundColor: pos ? at.color : colors.inkMute }, pos ? { left: '50%' } : { right: '50%' }]} />
              </View>
              <Text style={[s.val, { color: pos ? at.color : colors.inkMute }]}>{c.v > 0 ? `+${c.v}` : c.v}</Text>
            </View>
          );
        })}
      </Card>

      <SectionHeader title="오늘의 팁" />
      <Card style={{ gap: 14 }}>
        <View style={s.tip}><Icon name="check" size={18} color={colors.success} strokeWidth={2.4} /><Text style={txt.bodyStrong}>{f.goodActions[0]}</Text></View>
        <View style={s.tip}><Icon name="clock" size={18} color={colors.purpleSoft} /><Text style={txt.bodyStrong}>{f.luckyTime} 활용하기</Text></View>
        {score < 72 ? <View style={s.tip}><Icon name="close" size={18} color={colors.danger} strokeWidth={2.4} /><Text style={txt.bodyStrong}>{f.avoidActions[0]} 미루기</Text></View> : null}
      </Card>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: radius.xl, paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center', gap: 10, marginTop: 4 },
  heroText: { textAlign: 'center', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { width: 104, fontSize: 13, fontWeight: '600', color: colors.inkSub },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  center: { position: 'absolute', left: '50%', width: 1, height: 8, backgroundColor: colors.lineStrong },
  bar: { position: 'absolute', height: 8, borderRadius: 4 },
  val: { width: 30, textAlign: 'right', fontWeight: '800', fontSize: 13 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
