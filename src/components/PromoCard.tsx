import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import Mascot from './Mascot';
import { Coin } from './premium/Kit';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

/** 어두운 카드 제목 색 — 디자인에서 카드마다 다른 연한 색을 쓴다 */
export const PROMO_TONE = { gold: '#ECDB7B', lime: '#DFEEA5', mint: '#9FE3D2', sky: '#9ED8FF' } as const;

interface Props {
  title: string;
  desc: string;
  /** 아래 알약 버튼 문구 (예: "100 · 상담 시작하기 →" — coin이면 앞에 마스코트 아이콘) */
  cta: string;
  /** 알약 앞에 동전을 붙인다 (유료) */
  coin?: boolean;
  /** 알약 앞에 파란 "보유중"을 붙인다 */
  owned?: boolean;
  tone?: keyof typeof PROMO_TONE;
  isNew?: boolean;
  onPress(): void;
  accessibilityLabel?: string;
}

/** 어두운 남색 프로모션 카드 — 제목 · 한 줄 설명 · 알약 버튼 · 오른쪽 아래 마스코트 실루엣 */
export default function PromoCard({ title, desc, cta, coin, owned, tone = 'gold', isNew, onPress, accessibilityLabel }: Props) {
  return (
    <PressableScale onPress={onPress} style={s.card} scaleTo={0.98} accessibilityLabel={accessibilityLabel ?? title}>
      <Mascot name="shadow" size={110} style={s.art} />
      <View style={s.titleRow}>
        <Text style={[s.title, { color: PROMO_TONE[tone] }]}>{title}</Text>
        {isNew ? <View style={s.new}><Text style={s.newText}>NEW</Text></View> : null}
      </View>
      <Text style={s.desc}>{desc}</Text>
      <View style={s.cta}>
        {coin ? <Coin size={16} /> : null}
        <Text style={s.ctaText}>
          {owned ? <Text style={{ color: '#4392F7' }}>보유중 · </Text> : null}{cta}
        </Text>
      </View>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  card: { minHeight: 110, padding: 16, borderRadius: radius.lg, backgroundColor: colors.heroBg, overflow: 'hidden' },
  art: { position: 'absolute', right: 0, bottom: -16, opacity: 0.18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 16, lineHeight: 18, fontWeight: '700', letterSpacing: -0.8 },
  new: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5, borderWidth: 0.5, borderColor: '#FF7A3C' },
  newText: { fontSize: 12, fontWeight: '600', color: '#FF7A3C', opacity: 0.85 },
  desc: { fontSize: 13, lineHeight: 18, color: colors.white, letterSpacing: -0.6, marginTop: 8, paddingRight: 80 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#F5F6F8' },
  ctaText: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: '#000', letterSpacing: -0.6 },
});
