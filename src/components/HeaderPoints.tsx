import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { ART } from './Mascot';
import { usePremium } from '../context/PremiumContext';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';
import { profileType } from '../theme/profileDesign';

/** 상단 오른쪽: 내 포인트 알약(누르면 지갑) */
export function PointPill() {
  const nav = useNavigation();
  const { points } = usePremium();
  return (
    <PressableScale onPress={() => nav.navigate('Wallet')} style={s.pill} scaleTo={0.94} accessibilityLabel={`내 알 ${points}개`}>
      <View style={{ width: 16, height: 16 }}>
        <Image source={ART.mascot} style={{ width: 16, height: 15, marginTop: 1 }} contentFit="cover" accessible={false} />
      </View>
      <Text style={s.text}>{points.toLocaleString('ko-KR')}</Text>
    </PressableScale>
  );
}

/** 상단 오른쪽: 포인트 알약 + (있으면) 저장·공유 버튼 */
export default function HeaderPoints({ onSave, saveLabel = '공유하기', color = colors.ink }: { onSave?: () => void; saveLabel?: string; color?: string }) {
  return (
    <>
      <PointPill />
      {onSave ? (
        <PressableScale onPress={onSave} hitSlop={8} scaleTo={0.9} accessibilityLabel={saveLabel}>
          <Icon name="download" size={24} color={color} />
        </PressableScale>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingLeft: 6, paddingRight: 6, borderRadius: radius.pill, backgroundColor: colors.heroBg },
  text: { ...profileType(14, '800', 17, -0.56, colors.white) },
});
