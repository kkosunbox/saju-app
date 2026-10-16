import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ScoreBar from '../../components/ScoreBar';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import BrandMark from '../../components/BrandMark';
import { SubHead, scoreColor } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { MBTI_INFO } from '../../data/mbtiData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { mbtiSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';

/** 무료: 나와 가장 잘 맞는 MBTI */
export default function MbtiMatchScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const card = useRef<View>(null);
  const [showAll, setShowAll] = useState(false);
  const q = useFreeContent('mbti-match');
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="찰떡 MBTI" error={q.error} onRetry={q.refetch} />;
  const { best, worst, all } = q.data;
  const top = best[0];

  return (
    <Screen title="찰떡 MBTI" back>
      <FriendCompare route="MbtiMatch" spec={mbtiSpec(u, q.data)} />
      {/* 공유 카드 */}
      <View ref={card} collapsable={false} style={s.card}>
        <View style={s.brand}><BrandMark light size={15} /></View>
        <Text style={s.eyebrow}>{u.mbti} {u.nickname}님의 찰떡 MBTI는</Text>
        <Text style={s.big}>{top.type}</Text>
        <Text style={s.nick}>{top.nickname} · 궁합 {top.score}점</Text>
        <Text style={s.reason}>{top.reason}</Text>
        <View style={s.rankRow}>
          {best.slice(1).map((b, i) => (
            <View key={b.type} style={s.rankCell}>
              <Text style={s.rankNo}>{i + 2}위</Text>
              <Text style={s.rankType}>{b.type}</Text>
            </View>
          ))}
          <View style={[s.rankCell, { borderColor: 'rgba(181,67,46,0.6)' }]}>
            <Text style={[s.rankNo, { color: '#E9A091' }]}>조심</Text>
            <Text style={s.rankType}>{worst.type}</Text>
          </View>
        </View>
      </View>
      <ShareActions spec={mbtiSpec(u, q.data)} />

      <SubHead title="TOP 3 찰떡 궁합" caption="함께하면 서로를 빛내주는 성향" />
      <View style={{ gap: 10 }}>
        {best.map((b, i) => (
          <Card key={b.type}>
            <View style={s.between}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[s.medal, i === 0 && { backgroundColor: colors.navy }]}><Text style={[s.medalText, i === 0 && { color: colors.moon }]}>{i + 1}</Text></View>
                <View>
                  <Text style={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: '600', color: colors.ink }}>{b.type}</Text>
                  <Text style={txt.caption}>{b.nickname}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.serif, fontSize: 20, fontWeight: '600', color: scoreColor(b.score) }}>{b.score}</Text>
            </View>
            <Text style={[txt.body, { marginTop: 10, fontSize: 14 }]}>{b.reason}</Text>
            <Text style={[txt.small, { marginTop: 4, color: colors.purpleSoft }]}>함께라면 · {b.together}</Text>
          </Card>
        ))}
      </View>

      <SubHead title="조금 노력이 필요한 사이" />
      <Card>
        <View style={s.between}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 19, fontWeight: '600', color: colors.ink }}>{worst.type} <Text style={txt.caption}>{worst.nickname}</Text></Text>
          <Text style={{ fontFamily: fonts.serif, fontSize: 18, color: colors.inkMute }}>{worst.score}</Text>
        </View>
        <Text style={[txt.body, { marginTop: 8, fontSize: 14 }]}>보는 방식이 많이 달라 오해가 생기기 쉬워요. 대신 서로의 다름을 인정하면 가장 크게 배우는 사이이기도 해요. {u.mbti}인 내가 '{MBTI_INFO[u.mbti].watch}'만 조심하면 충분해요.</Text>
      </Card>

      <SubHead title="16가지 MBTI 궁합 순위" />
      <Card style={{ gap: 12 }}>
        {(showAll ? all : all.slice(0, 6)).map(m => (
          <View key={m.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ width: 44, fontSize: 14, fontWeight: '700', color: m.type === u.mbti ? colors.purpleSoft : colors.ink }}>{m.type}</Text>
            <View style={{ flex: 1 }}><ScoreBar value={m.score} color={m.score >= 85 ? colors.navy : colors.purpleSoft} /></View>
            <Text style={{ width: 26, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.inkSub }}>{m.score}</Text>
          </View>
        ))}
        <PressableScale onPress={() => setShowAll(v => !v)} hitSlop={8}><Text style={s.more}>{showAll ? '접기' : '전체 16개 보기'}</Text></PressableScale>
      </Card>

      <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Compatibility' })} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.purple }}>특정한 사람과의 궁합이 궁금하다면?</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>사주 · 태국 점성술 · 혈액형까지 함께 보는 궁합 보러 가기 →</Text>
      </PressableScale>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>MBTI 궁합은 재미로 보는 성향 조합이에요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { fontFamily: fonts.serif, color: colors.white, fontSize: 14, fontWeight: '600' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 18 },
  big: { fontFamily: fonts.serif, color: colors.moon, fontSize: 56, fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  nick: { color: colors.white, fontSize: 15, fontWeight: '600' },
  reason: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  rankRow: { flexDirection: 'row', gap: 8, marginTop: 18, alignSelf: 'stretch' },
  rankCell: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  rankNo: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  rankType: { fontFamily: fonts.serif, color: colors.white, fontSize: 16, fontWeight: '600', marginTop: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medal: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  medalText: { fontSize: 14, fontWeight: '800', color: colors.purpleSoft },
  more: { fontSize: 13, color: colors.purpleSoft, fontWeight: '600', textAlign: 'center' },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft, borderWidth: 1, borderColor: colors.lavender },
});
