import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import FriendCompare from '../../components/FriendCompare';
import ScrollUnroll from '../../components/ScrollUnroll';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';
import BrandMark from '../../components/BrandMark';
import Mascot from '../../components/Mascot';
import { SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { pastLifeSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { fonts, radius, txt, SCREEN_PX } from '../../theme/typography';

/** 무료: 전생 테스트 — 띠(시대) · 일간 오행 × MBTI(신분) · 일지(장면) */
export default function PastLifeScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const q = useFreeContent('past-life');
  const draw = useOpened('past-life');
  const [drawn, setDrawn] = useState(false);
  if (!u) return null;
  if (!q.data || !draw.ready) return <LoadingScreen title="전생 테스트" error={q.error} onRetry={q.refetch} />;
  const P = q.data;
  const spec = pastLifeSpec(u, P);

  // 처음엔 말린 두루마리 — 끌어내려 펼치면 결과 화면
  if (!draw.opened) {
    return (
      <Screen title="전생 테스트" back scroll={false} contentStyle={SEALED_PAD}>
        <Text style={[txt.title, { marginTop: 8 }]}>{u.nickname}님은{'\n'}전생에 누구였을까?</Text>
        <Text style={[txt.small, { marginTop: 8, marginBottom: 24 }]}>띠와 타고난 기운에 적힌 전생의 기록이에요</Text>
        <ScrollUnroll onDone={() => { setDrawn(true); draw.open(); }}>
          <Mascot name="pastLife" size={56} />
          <Text style={s.eyebrow}>{u.nickname}님은 전생에</Text>
          <Text style={s.name}>{P.title}</Text>
          <Text style={s.era}>{P.era}</Text>
          <Text style={s.scene}>“{P.scene}”</Text>
        </ScrollUnroll>
      </Screen>
    );
  }
  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);

  return (
    <Screen title="전생 테스트" back>
      <FriendCompare route="PastLife" spec={spec} />
      {wrap(
      <View style={s.card}>
        <View style={s.brand}><BrandMark light size={15} /></View>
        <View style={s.seal}><Mascot name="pastLife" size={64} /></View>
        <Text style={s.eyebrow}>{u.nickname}님은 전생에</Text>
        <Text style={s.name}>{P.title}</Text>
        <Text style={s.era}>{P.era}</Text>
        <Text style={s.scene}>“{P.scene}”</Text>
      </View>
      )}
      <ShareActions spec={spec} title="친구는 전생에 누구였을까?" />

      <SubHead title="이번 생까지 가져온 것" />
      <Card style={{ gap: 12 }}>
        <Row k="타고난 재능" v={P.carried} />
        <Row k="이번 생의 숙제" v={P.karma} />
        <Row k="전생에서 이어진 인연" v={`${P.bond} 사람과 처음 만나도 오래 안 사이처럼 편해요`} />
      </Card>

      <PressableScale onPress={() => nav.navigate('Spouse')} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>이번 생의 인연이 궁금하다면</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>미래 배우자는 어떤 사람일까? 첫 화면은 무료로 볼 수 있어요 →</Text>
      </PressableScale>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View>
      <Text style={txt.caption}>{k}</Text>
      <Text style={[txt.body, { fontSize: 15, marginTop: 2 }]}>{v}</Text>
    </View>
  );
}

/** 스크롤을 끈 봉인 화면은 Screen의 기본 여백을 받지 못해 직접 준다 */
const SEALED_PAD = { paddingHorizontal: SCREEN_PX, paddingTop: 8 };

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { fontFamily: fonts.serif, color: colors.white, fontSize: 14, fontWeight: '600' },
  seal: { marginTop: 12, width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 18 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 30, lineHeight: 38, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  era: { color: colors.moon, fontSize: 13, marginTop: 4 },
  scene: { color: 'rgba(255,255,255,0.86)', fontSize: 14, lineHeight: 22, marginTop: 16, textAlign: 'center' },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.card },
});
