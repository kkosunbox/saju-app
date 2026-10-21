import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import BrandMark from '../../components/BrandMark';
import Mascot from '../../components/Mascot';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { ELEMENT_INFO } from '../../data/sajuData';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { characterSpec } from '../../services/share/shareSpecs';
import FriendCompare from '../../components/FriendCompare';
import PillarSlot from '../../components/PillarSlot';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';

/** 무료: 일주(60갑자)로 보는 나의 사주 캐릭터 */
export default function CharacterScreen() {
  const nav = useNavigation();
  const { user: u } = useApp();
  const card = useRef<View>(null);
  const q = useFreeContent('character');
  const draw = useOpened('character');
  const [drawn, setDrawn] = useState(false);
  if (!u) return null;
  if (!q.data || !draw.ready) return <LoadingScreen title="나의 사주 캐릭터" error={q.error} onRetry={q.refetch} />;
  const c = q.data;

  // 처음엔 60갑자 슬롯에서 내 일주를 찾는다
  if (!draw.opened) {
    return (
      <Screen title="나의 사주 캐릭터" back>
        <Text style={[txt.title, { marginTop: 8 }]}>60가지 사주 캐릭터 중{'\n'}{u.nickname}님은 누구일까?</Text>
        <Text style={[txt.small, { marginTop: 8 }]}>태어난 날의 기둥(일주)이 캐릭터를 정해요</Text>
        <PillarSlot target={c.hanja} onDone={() => { setDrawn(true); draw.open(); }} />
      </Screen>
    );
  }
  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);

  return (
    <Screen title="나의 사주 캐릭터" back>
      <FriendCompare route="Character" spec={characterSpec(u, c)} />
      {wrap(
      <View ref={card} collapsable={false} style={s.card}>
        <View style={s.brand}><BrandMark light size={15} /></View>
        {/* 캐릭터 그림은 아직 호랑이 하나뿐 — 60가지 그림이 나오면 c.hanja(일주)로 고른다 */}
        <View style={s.art}>
          <Mascot name="tiger" size={104} />
          <View style={s.hanja}><Text style={s.hanjaText}>{c.hanja}</Text></View>
        </View>
        <Text style={s.eyebrow}>{u.nickname}님은</Text>
        <Text style={s.name}>{c.name}</Text>
        <Text style={s.title}>{c.title}</Text>
        <View style={s.chips}>
          {c.traits.slice(0, 3).map(t => <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>)}
        </View>
        <Text style={s.foot}>60가지 사주 캐릭터 중 하나 · {ELEMENT_INFO[c.element].ko}({ELEMENT_INFO[c.element].hanja})의 기운</Text>
      </View>
      )}
      <ShareActions spec={characterSpec(u, c)} />

      <SubHead title="이런 사람이에요" caption={c.core} />
      <Card>
        {c.traits.map(t => <Bullet key={t}>{t}</Bullet>)}
        <Text style={[txt.body, { marginTop: 10, fontSize: 14 }]}>속마음 · {c.inner}</Text>
      </Card>

      <SubHead title="찰떡 캐릭터" caption="함께 있으면 편안한 기운" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Mascot name="friends" size={34} />
        <View style={{ flex: 1 }}>
          <Text style={txt.h3}>{c.bestFriend}</Text>
          <Text style={[txt.small, { marginTop: 2 }]}>친구에게 공유해서 찰떡 캐릭터인지 확인해 보세요</Text>
        </View>
      </Card>

      <PressableScale onPress={() => nav.navigate('SajuDeep')} style={s.cta} scaleTo={0.98}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>내 사주를 더 깊이 알고 싶다면</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>원국표 · 오행 · 신살 · 재물 · 연애까지, 상세 사주 해석 보러 가기 →</Text>
      </PressableScale>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.heroBg, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginTop: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  brandText: { fontFamily: fonts.serif, color: colors.white, fontSize: 14, fontWeight: '600' },
  art: { marginTop: 12, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  hanja: { position: 'absolute', right: -4, bottom: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.moon },
  hanjaText: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '700', color: colors.heroBg, letterSpacing: 1 },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 18 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 36, fontWeight: '600', marginTop: 2 },
  title: { color: colors.moon, fontSize: 14, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 16 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)' },
  chipText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  foot: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 18 },
  cta: { marginTop: 24, padding: 18, borderRadius: radius.lg, backgroundColor: colors.card },
});
