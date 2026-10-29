import React from 'react';
import { ImageBackground, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ART } from './Mascot';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { usePremium } from '../context/PremiumContext';
import { Item } from '../services/premium/catalog';
import { ShareSpec } from '../services/share/shareSpecs';
import { colors } from '../theme/colors';
import { radius, sansW } from '../theme/typography';

/**
 * 유료 결과 끝의 공유 배너 — 열람한 사람에게만 (결과를 받기 전에는 숨김).
 * 카드 그림 바탕 + 하늘색 점선. 박스를 그림 비율(327×68)에 맞춰 폭이 달라도 그림이 잘리지 않게 한다.
 */
export default function ShareCta({ item, spec, style }: { item?: Item; spec?: ShareSpec | null; style?: StyleProp<ViewStyle> }) {
  const nav = useNavigation();
  const { owned } = usePremium();
  if (!spec || (item && !owned(item.key))) return null;
  return (
    <PressableScale onPress={() => nav.navigate('Share', { spec })} style={[s.bannerBox, style]} scaleTo={0.98} accessibilityLabel="결과를 카드로 공유하기">
      <ImageBackground source={ART.shareBanner} style={s.banner} imageStyle={s.fill} resizeMode="stretch">
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>결과를 카드로 공유하기</Text>
          <Text style={s.bannerSub}>핵심만 담고 궁금한 부분은 가려줘요</Text>
        </View>
        <Icon name="download" size={24} color={BANNER_INK} />
      </ImageBackground>
    </PressableScale>
  );
}

// 배너 그림이 밝은 하늘색이라 글자는 화면 모드와 상관없이 어둡게
const BANNER_INK = '#222222';

const s = StyleSheet.create({
  bannerBox: { marginTop: 16, borderRadius: radius.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, overflow: 'hidden' },
  banner: { aspectRatio: 984 / 204, minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 84, paddingRight: 20 },
  fill: { width: '100%', height: '100%' },
  bannerTitle: { ...sansW('700'), fontSize: 14, letterSpacing: -0.56, color: BANNER_INK },
  bannerSub: { ...sansW('400'), marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#000000' },
});

/** 유료 화면 상단 오른쪽 공유 아이콘 — 열람한 사람에게만 보인다 */
export function ShareIconButton({ item, spec, download = false }: { item?: Item; spec?: ShareSpec | null; download?: boolean }) {
  const nav = useNavigation();
  const { owned } = usePremium();
  if (!spec || (item && !owned(item.key))) return null;
  return (
    <PressableScale onPress={() => nav.navigate('Share', { spec })} scaleTo={0.9} accessibilityLabel="결과를 카드로 공유하기" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={download ? "download" : "share"} size={download ? 24 : 20} color={colors.purple} />
    </PressableScale>
  );
}
