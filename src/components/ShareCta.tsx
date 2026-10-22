import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { ART } from './Mascot';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { usePremium } from '../context/PremiumContext';
import { Item } from '../services/premium/catalog';
import { ShareSpec } from '../services/share/shareSpecs';
import { colors } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';

/**
 * 유료 결과 끝의 공유 배너 — 열람한 사람에게만 (결과를 받기 전에는 숨김).
 * banner: 카드 그림 바탕 + 하늘색 점선 (궁합 결과 디자인)
 */
export default function ShareCta({ item, spec, banner }: { item?: Item; spec?: ShareSpec | null; banner?: boolean }) {
  const nav = useNavigation();
  const { owned } = usePremium();
  if (!spec || (item && !owned(item.key))) return null;
  if (banner) {
    return (
      <PressableScale onPress={() => nav.navigate('Share', { spec })} style={s.bannerBox} scaleTo={0.98} accessibilityLabel="결과를 카드로 공유하기">
        <ImageBackground source={ART.shareBanner} style={s.banner} imageStyle={s.fill} resizeMode="cover">
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>결과를 카드로 공유하기</Text>
            <Text style={s.bannerSub}>핵심만 담고 궁금한 부분은 가려 줘요</Text>
          </View>
          <Icon name="download" size={24} color={BANNER_INK} />
        </ImageBackground>
      </PressableScale>
    );
  }
  return (
    <PressableScale onPress={() => nav.navigate('Share', { spec })} style={s.box} scaleTo={0.98} accessibilityLabel="결과를 카드로 공유하기">
      <View style={s.seal}><Text style={s.sealText}>{spec.seal}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>결과를 카드로 공유하기</Text>
        <Text style={[txt.small, { marginTop: 2 }]}>핵심만 담고 궁금한 부분은 가려 줘요 · 인스타 스토리 크기</Text>
      </View>
      <Icon name="share" size={20} color={colors.purple} />
    </PressableScale>
  );
}

// 배너 그림이 밝은 하늘색이라 글자는 화면 모드와 상관없이 어둡게
const BANNER_INK = '#222222';

const s = StyleSheet.create({
  bannerBox: { marginTop: 12, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, overflow: 'hidden' },
  banner: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 84, paddingRight: 20 },
  fill: { width: '100%', height: '100%' },
  bannerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: BANNER_INK },
  bannerSub: { marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#000000' },
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, borderStyle: 'dashed' },
  seal: { width: 40, height: 40, borderRadius: 4, borderWidth: 1.5, borderColor: colors.seal, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  sealText: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.seal },
});

/** 유료 화면 상단 오른쪽 공유 아이콘 — 열람한 사람에게만 보인다 */
export function ShareIconButton({ item, spec }: { item?: Item; spec?: ShareSpec | null }) {
  const nav = useNavigation();
  const { owned } = usePremium();
  if (!spec || (item && !owned(item.key))) return null;
  return (
    <PressableScale onPress={() => nav.navigate('Share', { spec })} scaleTo={0.9} accessibilityLabel="결과를 카드로 공유하기" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="share" size={20} color={colors.purple} />
    </PressableScale>
  );
}
