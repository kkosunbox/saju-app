import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { SHARE_P, usePremium } from '../context/PremiumContext';
import { ShareSpec } from '../services/share/shareSpecs';
import { useShare } from '../services/share/useShare';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { COPY } from '../content/copy';

/**
 * 무료 결과 아래 공유 블록 — 결과를 본 직후가 가장 공유하고 싶은 순간이라 크게 보여준다.
 * 링크로 보내면 친구가 열었을 때 내 결과와 친구 결과가 나란히 비교된다.
 */
export default function ShareActions({ spec, title = COPY.friend, outlined = false }: { spec: ShareSpec; title?: string; outlined?: boolean }) {
  const nav = useNavigation();
  const { shareRewardsLeft } = usePremium();
  const { sendLink } = useShare();
  const content = (
    <>
      <View style={[s.head, outlined && s.outlinedHead]}>
        <Text style={[s.title, outlined && s.outlinedTitle]}>{title}</Text>
        {shareRewardsLeft > 0 ? <View style={s.badge}><Text style={s.badgeText}>공유 +{SHARE_P}알</Text></View> : null}
      </View>
      <Text style={[txt.small, { marginTop: outlined ? 2 : 6 }]}>보내면 친구 결과와 내 결과가 나란히 비교돼요.</Text>
      <View style={s.row}>
        <PressableScale onPress={() => sendLink(spec)} style={[s.btn, s.solid]} scaleTo={0.96} haptic accessibilityLabel="친구에게 링크 보내기">
          <Text style={[s.text, { color: colors.white }]}>친구에게 보내기</Text>
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Share', { spec })} style={[s.btn, s.soft]} scaleTo={0.96} accessibilityLabel="스토리용 카드 만들기">
          <Text style={[s.text, { color: colors.ink }]}>스토리 카드</Text>
        </PressableScale>
      </View>
    </>
  );
  return outlined
    ? <View style={[s.box, s.outlined]}>{content}</View>
    : <GradientBorder outer={{ marginTop: 20 }} style={s.box}>{content}</GradientBorder>;
}

const s = StyleSheet.create({
  box: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  outlined: { marginTop: 24, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.lg, backgroundColor: colors.cream },
  outlinedHead: { gap: 8 },
  outlinedTitle: { flexShrink: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, letterSpacing: -0.8 },
  badge: { height: 24, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.xs, backgroundColor: colors.accent },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.white },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { flex: 1, height: 40, borderRadius: radius.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  soft: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong },
  solid: { backgroundColor: colors.navy },
  text: { fontSize: 14, fontWeight: '600', letterSpacing: -0.4 },
});
