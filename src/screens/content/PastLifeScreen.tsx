import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import FriendCompare from '../../components/FriendCompare';
import BrandMark from '../../components/BrandMark';
import { SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { pastLife } from '../../services/content/freeContent';
import { pastLifeSpec } from '../../services/share/shareSpecs';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';

/** 무료: 전생 테스트 — 띠(시대) · 일간 오행 × MBTI(신분) · 일지(장면) */
export default function PastLifeScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  if (!u) return null;
  const P = pastLife(u);
  const spec = pastLifeSpec(u);

  return (
    <Screen title="전생 테스트" back>
      <FriendCompare route="PastLife" spec={spec} />
      <View style={s.card}>
        <View style={s.brand}><BrandMark light size={15} /></View>
        <View style={s.seal}><Text style={s.sealText}>{P.hanja}</Text></View>
        <Text style={s.eyebrow}>{u.nickname}님은 전생에</Text>
        <Text style={s.name}>{P.title}</Text>
        <Text style={s.era}>{P.era}</Text>
        <Text style={s.scene}>“{P.scene}”</Text>
      </View>
      <ShareActions spec={spec} title="친구는 전생에 누구였을까?" />

      <SubHead title="이번 생까지 가져온 것" />
      <Card style={{ gap: 12 }}>
        <Row k="타고난 재능" v={P.carried} />
        <Row k="이번 생의 숙제" v={P.karma} />
        <Row k="전생에서 이어진 인연" v={`${P.bond} 사람과 처음 만나도 오래 안 사이처럼 편해요`} />
      </Card>

      <PressableScale onPress={() => nav.navigate('Spouse')} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.purple }}>이번 생의 인연이 궁금하다면</Text>
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

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { fontFamily: fonts.serif, color: colors.white, fontSize: 14, fontWeight: '600' },
  seal: { marginTop: 18, width: 72, height: 72, borderRadius: 8, borderWidth: 2, borderColor: colors.moon, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  sealText: { fontFamily: fonts.serif, fontSize: 34, fontWeight: '700', color: colors.moon },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 18 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 30, lineHeight: 38, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  era: { color: colors.moon, fontSize: 13, marginTop: 4 },
  scene: { color: 'rgba(255,255,255,0.86)', fontSize: 14, lineHeight: 22, marginTop: 16, textAlign: 'center' },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft, borderWidth: 1, borderColor: colors.lavender },
});
