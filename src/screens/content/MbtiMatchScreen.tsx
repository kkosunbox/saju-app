import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ScoreBar from '../../components/ScoreBar';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import { Logo } from '../../components/Mascot';
import HeaderPoints from '../../components/HeaderPoints';
import { SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { MBTI_INFO } from '../../data/mbtiData';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import { mbtiSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';
import MbtiDeck from '../../components/MbtiDeck';
import MbtiArt from '../../components/MbtiArt';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';

/** 무료: 나와 가장 잘 맞는 MBTI */
export default function MbtiMatchScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const card = useRef<View>(null);
  const [showAll, setShowAll] = useState(false);
  const q = useFreeContent('mbti-match');
  const draw = useOpened('mbti-match');
  const [drawn, setDrawn] = useState(false);
  if (!u) return null;
  if (!q.data || !draw.ready) return <LoadingScreen title="찰떡 MBTI" error={q.error} onRetry={q.refetch} />;
  const { best, worst, all } = q.data;
  const top = best[0];

  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);
  // 처음엔 엎어 둔 16장 — 다 뒤집히면 결과 화면
  if (!draw.opened) {
    return (
      <Screen title="찰떡 MBTI" back>
        <Text style={[txt.title, { marginTop: 8 }]}>16가지 MBTI 중{'\n'}{u.nickname}님의 찰떡은?</Text>
        <Text style={[txt.small, { marginTop: 8, marginBottom: 24 }]}>{u.mbti}인 나와의 궁합 점수 순서대로 카드가 뒤집혀요</Text>
        <MbtiDeck all={all} top={top.type} onDone={() => { setDrawn(true); draw.open(); }} />
      </Screen>
    );
  }

  return (
    <Screen title="찰떡 MBTI" back right={<HeaderPoints onSave={() => nav.navigate('Share', { spec: mbtiSpec(u, q.data) })} saveLabel="스토리 카드 만들기" />}>
      <FriendCompare route="MbtiMatch" spec={mbtiSpec(u, q.data)} />
      {/* 결과 카드 */}
      {wrap(
      <View ref={card} collapsable={false} style={s.card}>
        <MbtiArt type={top.type} size={115} style={s.cardArt} />
        <Logo height={29} />
        <Text style={s.eyebrow}>{u.mbti} {u.nickname}님의 찰떡 MBTI는</Text>
        <Text style={s.big}>{top.type}</Text>
        <Text style={s.nick}>{top.nickname} ㆍ 궁합 {top.score}점</Text>
        <Text style={s.reason}>{top.reason}</Text>
      </View>
      )}
      <View style={s.rankRow}>
        {best.slice(1).map((b, i) => (
          <View key={b.type} style={s.rankCell}>
            <Text style={s.rankNo}>{i + 2}위</Text>
            <Text style={s.rankType}>{b.type}</Text>
          </View>
        ))}
        <View style={s.rankCell}>
          <Text style={[s.rankNo, { color: colors.love }]}>조심</Text>
          <Text style={[s.rankType, { color: colors.love }]}>{worst.type}</Text>
        </View>
      </View>
      <ShareActions spec={mbtiSpec(u, q.data)} />

      <SubHead title="TOP3 찰떡궁합" caption="함께하면 서로를 빛내주는 성향" />
      <View style={{ gap: 12 }}>
        {best.map((b, i) => (
          <Card key={b.type} style={{ padding: 16 }}>
            <View style={s.between}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.medal, i === 0 && { backgroundColor: colors.navy }]}><Text style={[s.medalText, i === 0 && { color: colors.white }]}>{i + 1}</Text></View>
                <MbtiArt type={b.type} size={36} />
                <Text style={s.topType}>{b.type}</Text>
                <Text style={txt.small}>{b.nickname}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={txt.small}>궁합점수</Text>
                <Text style={s.topScore}>{b.score}</Text>
              </View>
            </View>
            <Text style={[txt.small, { marginTop: 12 }]}>{b.reason}</Text>
            <Text style={s.together}>함께라면 · {b.together}</Text>
          </Card>
        ))}
      </View>

      <SubHead title="조금 노력이 필요한 사이" />
      <Card>
        <View style={s.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MbtiArt type={worst.type} size={36} />
            <Text style={s.topType}>{worst.type} <Text style={txt.small}>{worst.nickname}</Text></Text>
          </View>
          <Text style={[s.topScore, { color: colors.inkMute }]}>{worst.score}</Text>
        </View>
        <Text style={[txt.body, { marginTop: 8, fontSize: 14 }]}>보는 방식이 많이 달라 오해가 생기기 쉬워요. 대신 서로의 다름을 인정하면 가장 크게 배우는 사이이기도 해요. {u.mbti}인 내가 '{MBTI_INFO[u.mbti].watch}'만 조심하면 충분해요.</Text>
      </Card>

      <SubHead title="16가지 MBTI 궁합 순위" />
      <Card style={{ gap: 12 }}>
        {(showAll ? all : all.slice(0, 6)).map(m => (
          <View key={m.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ width: 44, fontSize: 14, fontWeight: '700', color: m.type === u.mbti ? colors.purpleSoft : colors.ink }}>{m.type}</Text>
            <View style={{ flex: 1 }}><ScoreBar value={m.score} color={m.score >= 85 ? colors.accent : colors.purpleSoft} track={colors.lineStrong} /></View>
            <Text style={{ width: 26, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.inkSub }}>{m.score}</Text>
          </View>
        ))}
        <PressableScale onPress={() => setShowAll(v => !v)} hitSlop={8}><Text style={s.more}>{showAll ? '접기' : '전체 16개 보기'}</Text></PressableScale>
      </Card>

      <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Compatibility' })} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>특정한 사람과의 궁합이 궁금하다면?</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>사주 · 점성술 · 혈액형까지 함께 보는 궁합 보러 가기 →</Text>
      </PressableScale>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>MBTI 궁합은 재미로 보는 성향 조합이에요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.lg, paddingHorizontal: 17, paddingTop: 11, paddingBottom: 19, overflow: 'hidden' },
  cardArt: { position: 'absolute', right: 23, top: 23 },
  eyebrow: { color: '#DDDDDD', fontSize: 13, lineHeight: 18, letterSpacing: -0.6, marginTop: 14 },
  big: { color: colors.white, fontSize: 44, lineHeight: 53, fontWeight: '600', letterSpacing: -2 },
  nick: { color: '#DFEEA5', fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.6 },
  reason: { color: colors.white, fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: -0.6, marginTop: 12 },
  rankRow: { flexDirection: 'row', marginTop: 12, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  rankCell: { flex: 1, alignItems: 'center', gap: 4 },
  rankNo: { color: colors.inkMute, fontSize: 13, fontWeight: '500' },
  rankType: { color: colors.ink, fontSize: 20, fontWeight: '600', letterSpacing: -1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medal: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  medalText: { fontSize: 13, fontWeight: '700', color: colors.inkSub },
  topType: { fontSize: 20, fontWeight: '600', color: colors.ink, letterSpacing: -1 },
  topScore: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  together: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.mbti, letterSpacing: -0.6, marginTop: 8 },
  more: { fontSize: 13, color: colors.purpleSoft, fontWeight: '600', textAlign: 'center' },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.card },
});
