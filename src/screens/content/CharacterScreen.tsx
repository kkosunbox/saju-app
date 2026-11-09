import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import BrandMark from '../../components/BrandMark';
import Mascot from '../../components/Mascot';
import { artOfName } from '../../components/CharacterArt';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { characterSpec } from '../../services/share/shareSpecs';
import CharacterScene, { CharacterAvatar } from '../../components/CharacterScene';
import { characterScene, CHARACTER_ENERGY_LABELS, CHARACTER_PALETTES } from '../../data/characterScene';
import FriendCompare from '../../components/FriendCompare';
import PillarSlot from '../../components/PillarSlot';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';
import PromoSlot from '../../components/PromoSlot';
import { promosOf } from '../../services/promo/promos';

/** 무료: 일주(60갑자)로 보는 나의 사주 캐릭터 */
export default function CharacterScreen() {
  const nav = useNavigation();
  const { user: u, today } = useApp();
  const card = useRef<ViewInstance>(null);
  const q = useFreeContent('character');
  const draw = useOpened('character');
  const [drawn, setDrawn] = useState(false);
  if (!u) return null;
  if (!q.data || !draw.ready) return <LoadingScreen title="나의 사주 캐릭터" error={q.error} onRetry={q.refetch} />;
  const c = q.data;
  const scene = characterScene(c.hanja, c.name);
  const palette = scene?.palette ?? CHARACTER_PALETTES[c.element];
  const energyLabel = scene?.energyLabel ?? CHARACTER_ENERGY_LABELS[c.element];

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
    <Screen title="나의 사주 캐릭터" back right={<ShareIconButton spec={characterSpec(u, c)} />}>
      <FriendCompare route="Character" spec={characterSpec(u, c)} />
      {wrap(
      <View ref={card} collapsable={false} style={[s.card, { backgroundColor: palette.soft }]}>
        <View style={s.brand}><BrandMark size={15} /></View>
        {/* 일주(60갑자)마다 다른 캐릭터 그림 */}
        <View style={s.art}>
          <CharacterScene hanja={c.hanja} name={c.name} size={160} style={s.scene} />
          <View style={[s.energy, { backgroundColor: palette.soft }]}><Text style={[s.energyText, { color: palette.ink }]}>{energyLabel}</Text></View>
        </View>
        <View style={s.details}>
          <Text style={[s.eyebrow, { color: palette.accent }]}>{u.nickname}님은</Text>
          <Text style={[s.name, { color: palette.ink }]}>{c.name}</Text>
          <Text style={[s.title, { color: palette.accent }]}>{c.title}</Text>
          <View style={s.chips}>
            {c.traits.slice(0, 3).map(t => <View key={t} style={s.chip}><Text style={[s.chipText, { color: palette.ink }]}>{t}</Text></View>)}
          </View>
          <Text style={[s.foot, { color: palette.accent }]}>생일로 찾은 60가지 사주 캐릭터 중 하나</Text>
        </View>
      </View>
      )}
      <ShareActions spec={characterSpec(u, c)} />

      <SubHead title="이런 사람이에요" caption={c.core} />
      <Card>
        {c.traits.map(t => <Bullet key={t} textStyle={txt.body}>{t}</Bullet>)}
        <Text style={[txt.body, { marginTop: 10, fontSize: 14 }]}>속마음 · {c.inner}</Text>
      </Card>

      <SubHead title="찰떡 캐릭터" caption="함께 있으면 편안한 기운" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {c.bestFriendHanja || artOfName(c.bestFriend)
            ? <View style={s.friendArt}><CharacterAvatar hanja={c.bestFriendHanja} name={c.bestFriend} size={56} /></View>
            : <Mascot name="friends" size={34} />}
          <View style={{ flex: 1 }}>
            <Text style={txt.h3}>{c.bestFriend}</Text>
            {c.bestFriendBasis ? <Text style={s.basis}>{c.bestFriendBasis}</Text> : null}
          </View>
        </View>
        {/* 왜 찰떡인지: 색끼리(천간합) · 동물끼리(육합) — 용어 없이 일상 말로 */}
        {c.bestFriendReasons?.length ? (
          <View style={s.reasons}>
            {c.bestFriendReasons.map(r => <Bullet key={r} textStyle={[txt.body, { fontSize: 14 }]}>{r}</Bullet>)}
          </View>
        ) : null}
        <Text style={[txt.small, { marginTop: 10 }]}>친구에게 공유해서 찰떡 캐릭터인지 확인해 보세요</Text>
      </Card>

      <View style={s.cta}><PromoSlot screen="character" promo={promosOf(nav, today).sajuDeep} tone="mint" title="내 사주를 더 깊이 알고 싶다면" /></View>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', alignItems: 'center', marginTop: 4 },
  brand: { position: 'absolute', left: 18, top: 16, zIndex: 1 },
  friendArt: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  art: { width: '100%', height: 216 },
  scene: { width: '100%' },
  details: { width: '100%', padding: 20, alignItems: 'center' },
  energy: { position: 'absolute', right: 16, bottom: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  energyText: { fontFamily: fonts.serif, fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: -0.2 },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 0 },
  name: { fontFamily: fonts.serif, color: colors.white, fontSize: 32, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  title: { color: colors.moon, fontSize: 14, marginTop: 6, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 16 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.5)' },
  chipText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  foot: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 16, textAlign: 'center' },
  basis: { fontSize: 13, fontWeight: '600', color: colors.purpleSoft, marginTop: 4 },
  reasons: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  cta: { marginTop: 24 },
});
