import React from 'react';
import { Linking, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import PressableScale from '../PressableScale';
import { usePromoTrack } from '../PromoSlot';
import { PET_SNACK, PetSnackBanner as Banner } from '../../content/petSnack';
import { colors, isDark } from '../../theme/colors';
import { sansW } from '../../theme/typography';

/** 간식 서비스 광고 (Figma 362:1286) — 반려동물 궁합의 입력·미리보기·결과 화면 맨 위. PET_SNACK이 null이면 그리지 않는다 */
export default function PetSnackBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  return PET_SNACK ? <SnackCard banner={PET_SNACK} style={style} /> : null;
}

function SnackCard({ banner, style }: { banner: Banner; style?: StyleProp<ViewStyle> }) {
  const onPress = usePromoTrack('pet', 'snack', () => { Linking.openURL(banner.url).catch(() => {}); });
  return (
    <PressableScale onPress={onPress} style={[s.card, style]} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={`광고. ${banner.title}. ${banner.desc}`}>
      <Image source={require('../../../assets/images/kkosunbox-snack.webp')} style={s.thumb} contentFit="cover" accessible={false} />
      <View style={s.copy}>
        <Text style={s.title} numberOfLines={1}>{banner.title}</Text>
        <Text style={s.desc} numberOfLines={1}>{banner.desc}</Text>
        <Text style={s.cta} numberOfLines={1}>{banner.cta}</Text>
      </View>
      <View style={s.ad}><Text style={s.adText}>AD</Text></View>
    </PressableScale>
  );
}

// Figma 색은 광고 브랜드 색이라 고정, 다크 모드에서는 카드와 글자만 어둡게 맞춘다
const CARD = isDark ? colors.card : '#F7F7F7';
const TITLE = isDark ? colors.ink : '#371B00';
const DESC = isDark ? colors.inkMute : '#656565';
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  // 327×98 · 둥근 12 · 그림 74 (위·왼 12) · 그림과 글 사이 16
  card: { flexDirection: 'row', alignItems: 'flex-start', height: 98, padding: 12, gap: 16, borderRadius: 12, backgroundColor: CARD },
  thumb: { width: 74, height: 74, borderRadius: 9 },
  // 제목 위 19 (카드 패딩 12 + 7) · 줄 사이 8
  copy: { flex: 1, paddingTop: 7, gap: 8 },
  title: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: TITLE, ...TIGHT },
  desc: { ...sansW('400'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, color: DESC, ...TIGHT },
  cta: { ...sansW('400'), fontSize: 12, lineHeight: 14, letterSpacing: -0.48, color: '#EC7700', textDecorationLine: 'underline', alignSelf: 'flex-start', ...TIGHT },
  // 오른쪽 위 AD 알약 29×18 (위 8 · 오른쪽 11.5)
  ad: { position: 'absolute', top: 8, right: 11.5, width: 29, height: 18, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  adText: { ...sansW('700'), fontSize: 10, lineHeight: 12, color: '#717171', ...TIGHT },
});
