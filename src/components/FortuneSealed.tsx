/**
 * 오늘의 운세를 아직 안 뽑았을 때 결과 대신 보여주는 봉인 카드 — 뽑기는 홈 한 곳에서만 한다.
 * 운세 화면 '오늘' 탭, 그리고 결과 화면을 띄워 둔 채 날짜가 바뀌었을 때 쓴다.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import PrimaryButton from './PrimaryButton';
import ResultMascot from './ResultMascot';
import MascotShadow from './MascotShadow';
import { colors } from '../theme/colors';
import { radius } from '../theme/typography';

const MASCOT_SIZE = 88;

export default function FortuneSealed({ message = '홈에서 오늘의 운세를 뽑으면\n점수와 풀이를 볼 수 있어요' }: { message?: string }) {
  const nav = useNavigation();
  return (
    <View style={s.card}>
      <View style={s.mascot}>
        <MascotShadow size={MASCOT_SIZE} style={{ opacity: 0.65 }} />
        <ResultMascot pose={null} size={MASCOT_SIZE} />
      </View>
      <Text style={s.title}>오늘의 운세를 아직 뽑지 않았어요</Text>
      <Text style={s.text}>{message}</Text>
      <PrimaryButton label="홈에서 뽑기 →" onPress={() => nav.navigate('Tabs', { screen: 'Home' })} size="medium" style={s.button} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginTop: 20, alignItems: 'center', paddingTop: 28, paddingBottom: 22, paddingHorizontal: 20, borderRadius: radius.lg, backgroundColor: colors.card },
  mascot: { width: MASCOT_SIZE * 1.08, height: MASCOT_SIZE },
  title: { marginTop: 14, fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  text: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.inkMute, letterSpacing: -0.5, textAlign: 'center' },
  button: { marginTop: 18, alignSelf: 'stretch' },
});
