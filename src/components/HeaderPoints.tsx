import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { Coin } from './premium/Kit';
import { usePremium } from '../context/PremiumContext';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

/** 상단 오른쪽: 내 포인트 알약(누르면 지갑) */
export function PointPill() {
  const nav = useNavigation();
  const { points } = usePremium();
  return (
    <PressableScale onPress={() => nav.navigate('Wallet')} style={s.pill} scaleTo={0.94} accessibilityLabel={`내 포인트 ${points}알`}>
      <Coin size={16} />
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
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingLeft: 4, paddingRight: 8, borderRadius: radius.pill, backgroundColor: colors.lavenderSoft },
  text: { fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
});
