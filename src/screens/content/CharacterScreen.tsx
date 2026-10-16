import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import BrandMark from '../../components/BrandMark';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { ELEMENT_INFO } from '../../data/sajuData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { characterSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';

/** 무료: 일주(60갑자)로 보는 나의 사주 캐릭터 */
export default function CharacterScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const card = useRef<View>(null);
  const q = useFreeContent('character');
  if (!u) return null;
  if (!q.data) return <LoadingScreen title="나의 사주 캐릭터" error={q.error} onRetry={q.refetch} />;
  const c = q.data;

  return (
    <Screen title="나의 사주 캐릭터" back>
      <FriendCompare route="Character" spec={characterSpec(u, c)} />
      <View ref={card} collapsable={false} style={s.card}>
        <View style={s.brand}><BrandMark light size={15} /></View>
        <View style={[s.seal, { borderColor: colors.moon }]}><Text style={s.sealText}>{c.hanja}</Text></View>
        <Text style={s.eyebrow}>{u.nickname}님은</Text>
        <Text style={s.name}>{c.name}</Text>
        <Text style={s.title}>{c.title}</Text>
        <View style={s.chips}>
          {c.traits.slice(0, 3).map(t => <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>)}
        </View>
        <Text style={s.foot}>60가지 사주 캐릭터 중 하나 · {ELEMENT_INFO[c.element].ko}({ELEMENT_INFO[c.element].hanja})의 기운</Text>
      </View>
      <ShareActions spec={characterSpec(u, c)} />

      <SubHead title="이런 사람이에요" caption={c.core} />
      <Card>
        {c.traits.map(t => <Bullet key={t}>{t}</Bullet>)}
        <Text style={[txt.body, { marginTop: 10, fontSize: 14 }]}>속마음 · {c.inner}</Text>
      </Card>

      <SubHead title="찰떡 캐릭터" caption="함께 있으면 편안한 기운" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 28, color: colors.purpleSoft }}>合</Text>
        <View style={{ flex: 1 }}>
          <Text style={txt.h3}>{c.bestFriend}</Text>
          <Text style={[txt.small, { marginTop: 2 }]}>친구에게 공유해서 찰떡 캐릭터인지 확인해 보세요</Text>
        </View>
      </Card>

      <PressableScale onPress={() => nav.navigate('SajuDeep')} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.purple }}>내 사주를 더 깊이 알고 싶다면</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>원국표 · 오행 · 신살 · 재물 · 연애까지, 상세 사주 해석 보러 가기 →</Text>
      </PressableScale>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.xl, padding: 22, alignItems: 'center', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { fontFamily: fonts.serif, color: colors.white, fontSize: 14, fontWeight: '600' },
  seal: { marginTop: 20, width: 84, height: 84, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  sealText: { fontFamily: fonts.serif, fontSize: 30, fontWeight: '600', color: colors.moon, letterSpacing: 2 },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 18 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 36, fontWeight: '600', marginTop: 2 },
  title: { color: colors.moon, fontSize: 14, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 16 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  chipText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  foot: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 18 },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft, borderWidth: 1, borderColor: colors.lavender },
});
