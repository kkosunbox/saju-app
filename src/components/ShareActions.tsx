import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { SHARE_P, usePremium } from '../context/PremiumContext';
import { ShareSpec } from '../services/share/shareSpecs';
import { useShare } from '../services/share/useShare';
import { colors } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';
import { COPY } from '../content/copy';

/**
 * 무료 결과 아래 공유 블록 — 결과를 본 직후가 가장 공유하고 싶은 순간이라 크게 보여준다.
 * 링크로 보내면 친구가 열었을 때 내 결과와 친구 결과가 나란히 비교된다.
 */
export default function ShareActions({ spec, title = COPY.friend }: { spec: ShareSpec; title?: string }) {
  const nav = useNavigation();
  const { shareRewardsLeft } = usePremium();
  const { sendLink } = useShare();
  return (
    <View style={s.box}>
      <View style={s.head}>
        <Text style={s.title}>{title}</Text>
        {shareRewardsLeft > 0 ? <View style={s.badge}><Text style={s.badgeText}>공유 +{SHARE_P}P</Text></View> : null}
      </View>
      <Text style={[txt.small, { marginTop: 4 }]}>보내면 친구 결과와 내 결과가 나란히 비교돼요</Text>
      <View style={s.row}>
        <PressableScale onPress={() => sendLink(spec)} style={[s.btn, s.solid]} scaleTo={0.96} haptic accessibilityLabel="친구에게 링크 보내기">
          <Icon name="heart" size={18} color={colors.white} />
          <Text style={[s.text, { color: colors.white }]}>친구에게 보내기</Text>
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Share', { spec })} style={[s.btn, s.soft]} scaleTo={0.96} accessibilityLabel="스토리용 카드 만들기">
          <Icon name="share" size={18} color={colors.purple} />
          <Text style={[s.text, { color: colors.purple }]}>스토리 카드</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { marginTop: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 17, fontWeight: '700', color: colors.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.seal },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.white },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, height: 50, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  soft: { backgroundColor: colors.lavenderSoft },
  solid: { backgroundColor: colors.navy },
  text: { fontSize: 15, fontWeight: '600' },
});
