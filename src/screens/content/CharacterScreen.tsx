import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import ProfileSwitch from '../../components/premium/ProfileSwitch';
import BrandMark from '../../components/BrandMark';
import Mascot from '../../components/Mascot';
import { artOfName } from '../../components/CharacterArt';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { colors } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import { characterSpec } from '../../services/share/shareSpecs';
import CharacterScene, { CharacterAvatar } from '../../components/CharacterScene';
import { characterScene, CHARACTER_ENERGY_LABELS, CHARACTER_PALETTES, CHARACTER_SHARE_THEMES } from '../../data/characterScene';
import FriendCompare from '../../components/FriendCompare';
import PillarSlot from '../../components/PillarSlot';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';
import PromoSlot from '../../components/PromoSlot';
import SolidIcon from '../../components/SolidIcon';
import { PointPill } from '../../components/HeaderPoints';
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
  // 첫 정보 박스 색·하트 색 — 오행마다 다르다
  const info = CHARACTER_SHARE_THEMES[scene?.element ?? c.element];

  // 처음엔 60갑자 슬롯에서 내 일주를 찾는다
  if (!draw.opened) {
    return (
      <Screen title="나의 사주 캐릭터" back>
        {/* 누구 것을 볼지 — 다른 콘텐츠와 같은 프로필 선택 (메인 오늘의 운세 선택과는 따로) */}
        <ProfileSwitch style={{ marginBottom: 12 }} />
        <Text style={[txt.title, { marginTop: 8 }]}>60가지 사주 캐릭터 중{'\n'}{u.nickname}님은 누구일까?</Text>
        <Text style={[txt.small, { marginTop: 8 }]}>태어난 날의 기둥(일주)이 캐릭터를 정해요</Text>
        <PillarSlot target={c.hanja} onDone={() => { setDrawn(true); draw.open(); }} />
      </Screen>
    );
  }
  const wrap = (node: React.ReactNode) => (drawn ? <Reveal>{node}</Reveal> : node);

  return (
    <Screen title="나의 사주 캐릭터" back right={<View style={s.headRight}><PointPill attendHint quiet /><ShareIconButton spec={characterSpec(u, c)} /></View>}>
      <ProfileSwitch style={{ marginBottom: 12 }} />
      <FriendCompare route="Character" spec={characterSpec(u, c)} />
      {wrap(
      <View ref={card} collapsable={false} style={s.cardWrap}>
        {/* 일주(60갑자)마다 다른 캐릭터 그림 */}
        <View style={s.art}>
          <CharacterScene hanja={c.hanja} name={c.name} size={140} style={s.scene} />
          <View style={s.brand}><BrandMark size={15} /></View>
          <View style={s.energy}><Text style={[s.energyText, { color: palette.ink }]}>{energyLabel}</Text></View>
        </View>
        <View style={[s.details, { backgroundColor: info.panel }]}>
          <View style={s.nameBox}>
            <Text style={s.eyebrow}>{u.nickname}님은</Text>
            <Text style={s.name}>{c.name}</Text>
            <Text style={s.title}>{c.title}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.traits}>
            {c.traits.slice(0, 3).map(t => (
              <View key={t} style={s.trait}>
                <SolidIcon name="heartBubble" size={20} color={info.heart} />
                <Text style={s.traitText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={s.foot}>생일로 찾은 60가지 사주 캐릭터 중 하나</Text>
      </View>
      )}
      <ShareActions spec={characterSpec(u, c)} title="나의 사주 캐릭터를 공유해 볼까요?" sub="서로가 찰떡 캐릭터인지 확인해 보세요" marginTop={16} />

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
        <Text style={[txt.small, { marginTop: 10 }]}>공유하고 찰떡 캐릭터를 비교해 보세요</Text>
      </Card>

      <View style={s.cta}><PromoSlot screen="character" promo={promosOf(nav, today).sajuDeep} tone="mint" title="내 사주를 더 깊이 알고 싶다면" /></View>
    </Screen>
  );
}


const s = StyleSheet.create({
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardWrap: { marginTop: 4 },
  art: { width: '100%', height: 185, borderRadius: 18, overflow: 'hidden' },
  scene: { width: '100%', height: 185 },
  brand: { position: 'absolute', left: 16, top: 14, zIndex: 1 },
  energy: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.white },
  energyText: { ...sansW('700'), fontSize: 12, lineHeight: 16, letterSpacing: -0.48 },
  // Figma 489:3061 — 흰 이름 상자 없이 배경 위에 이름, 아래 #DDD 구분선(y114, 특징은 y130) 뒤 특징 3줄
  details: { marginTop: 16, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, borderRadius: 8 },
  nameBox: { alignItems: 'center' },
  divider: { height: 1, marginTop: 18, backgroundColor: '#DDDDDD' },
  eyebrow: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  // 28px 글자 — Figma 줄높이 18 상자 기준 위아래 12 간격을 34 줄높이 + 4 여백으로 맞춘다
  name: { ...sansW('800'), fontSize: 28, lineHeight: 34, letterSpacing: -1.4, color: '#000', marginVertical: 4, textAlign: 'center' },
  title: { ...sansW('500'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: colors.inkMute, textAlign: 'center' },
  traits: { marginTop: 15, gap: 12 },
  trait: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  traitText: { ...sansW('500'), flex: 1, fontSize: 14, lineHeight: 20, letterSpacing: -0.56, color: colors.ink },
  foot: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, marginTop: 12, textAlign: 'center' },
  friendArt: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  basis: { fontSize: 13, fontWeight: '600', color: colors.purpleSoft, marginTop: 4 },
  reasons: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  cta: { marginTop: 24 },
});
