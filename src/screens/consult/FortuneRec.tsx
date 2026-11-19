import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { Coin } from '../../components/premium/Kit';
import PromoSlot from '../../components/PromoSlot';
import { PromoKey, promosOf } from '../../services/promo/promos';
import { StreamBlock } from '../../components/Stream';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { usePremiumPreview } from '../../services/server/premiumApi';
import { CombinedFortune, User } from '../../types';
import { SpousePreview } from '../../types/premium';
import { colors, isDark } from '../../theme/colors';
import { radius } from '../../theme/typography';
import { spousePortraitFor } from '../content/spousePortraits';

type Cat = 'love' | 'money' | 'work' | 'relationship';
const CAT_LABEL: Record<Cat, string> = { love: '연애운', money: '재물운', work: '직장운', relationship: '관계운' };

/** 분야마다 이어서 볼 리포트 (앞에서부터, 이미 산 건 건너뛴다) — 다른 화면과 같은 추천 배너를 쓴다 */
const CAT_PROMOS: Record<Cat, PromoKey[]> = {
  love: ['spouse', 'theme-love'],
  money: ['theme-money'],
  work: ['theme-career'],
  relationship: ['crush'],
};
/** 오늘 분야와 상관없이 하나씩 번갈아 보여 주는 큰 리포트 */
const EVERGREEN: PromoKey[] = ['newyear', 'life', 'sajuDeep'];

/**
 * 오늘의 운세 아래 '더 깊이 보기' 배너 두 장.
 * 1) 오늘 점수가 가장 높은 분야의 리포트 — 연애운이면 미래 배우자의 흐린 얼굴 (내 운세를 볼 때만, 얼굴은 내 사주로 고른다)
 * 2) 신년운세 · 평생운 · 상세 사주 중 하나 (아직 안 산 것 중 무작위)
 */
export default function FortuneRec({ fortune: f, mine }: { fortune: CombinedFortune; mine: boolean }) {
  const nav = useNavigation();
  const { user, today } = useApp();
  const { owned, points } = usePremium();
  const promos = promosOf(nav as never, today);
  const top = (Object.keys(CAT_LABEL) as Cat[]).sort((a, b) => f[b] - f[a])[0];
  const fresh = (k: PromoKey) => !owned(promos[k].item.key);
  const catKey = CAT_PROMOS[top].find(fresh) ?? null;
  // 화면을 다시 그려도 바뀌지 않게 처음 한 번만 고른다
  const [roll] = useState(() => Math.random());
  const pool = EVERGREEN.filter(fresh);
  const extra = pool.length ? pool[Math.floor(roll * pool.length)] : null;
  const wantsFace = mine && catKey === 'spouse';
  const preview = usePremiumPreview<SpousePreview>({ kind: 'spouse' }, wantsFace);
  if (!user || (!catKey && !extra)) return null;
  const portrait = wantsFace && preview.data ? spousePortraitFor(user, preview.data.spouseEl)?.preview : undefined;

  return (
    <StreamBlock style={{ marginTop: 28, gap: 12 }}>
      <Text style={s.caption}>이런 것도 있어요</Text>
      {catKey && portrait ? (
        <SpouseFaceCard
          user={user} portrait={portrait} onPress={promos.spouse.go}
          // 얼굴 옆 좁은 칸이라 다른 배너보다 짧게
          cta={`${promos.spouse.item.cost}알 · ${points >= promos.spouse.item.cost ? '바로 열기' : '리포트 열기'} →`}
        />
      ) : catKey ? (
        <PromoSlot screen="fortune_chat" promo={promos[catKey]} teaser />
      ) : null}
      {extra ? <PromoSlot screen="fortune_chat" promo={promos[extra]} teaser /> : null}
    </StreamBlock>
  );
}

/** 흐린 얼굴 + 자물쇠 — 열면 또렷한 얼굴과 리포트를 본다. 아래 알약은 다른 추천 배너와 같은 모양 */
function SpouseFaceCard({ user, portrait, cta, onPress }: { user: User; portrait: number | object; cta: string; onPress(): void }) {
  const who = user.gender === 'female' ? '남편' : '아내';
  return (
    <PressableScale onPress={onPress} style={s.face} scaleTo={0.98} accessibilityLabel={`미래의 ${who} 얼굴 열어 보기`}>
      <View style={s.faceImgBox}>
        <Image source={portrait} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={2} accessible={false} />
        <View style={s.faceWash} />
        <View style={s.faceLock}><Icon name="lock" size={16} color={colors.white} strokeWidth={2} /></View>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.faceTitle}>미래의 {who}, 이런 얼굴일지도</Text>
        <Text style={s.faceDesc}>사주로 그린 배우자의 얼굴 · 성격 · 만나는 때와 곳</Text>
        <View style={s.facePill}>
          <Coin size={16} />
          <Text style={s.facePillText} numberOfLines={1}>{cta}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  caption: { fontSize: 13, fontWeight: '600', color: colors.inkMute, letterSpacing: -0.4, marginBottom: -2 },
  face: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, alignItems: 'center' },
  faceImgBox: { width: 84, height: 105, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.lineStrong },
  faceWash: { ...StyleSheet.absoluteFill, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)' },
  faceLock: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  faceTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  facePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.cream },
  facePillText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  faceDesc: { fontSize: 13, lineHeight: 18, color: colors.inkMute, letterSpacing: -0.5 },
});
