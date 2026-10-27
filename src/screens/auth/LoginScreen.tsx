import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@/navigation/compat';
import BrandMark from '../../components/BrandMark';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import Icon from '../../components/Icon';
import { SocialCircle } from '../../components/auth/AuthKit';
import { usePremium } from '../../context/PremiumContext';
import { SocialProvider } from '../../components/auth/socialLabels';
import { getFriendResult, getPendingInvite } from '../../services/share/linkShare';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { COPY } from '../../content/copy';

const PROVIDERS: SocialProvider[] = ['kakao', 'naver', 'apple', 'google'];

/** 로그인: 큰 문구 + 소셜 아이콘 한 줄. 이메일은 보조 동선으로. 유료 콘텐츠·포인트·마이 탭에서 띄운다 */
export default function LoginScreen() {
  const nav = useNavigation();
  const { toast } = usePremium();
  const [help, setHelp] = useState(false);
  // 친구가 보낸 결과·궁합 초대 링크로 들어왔다면 가입 전에 먼저 보여준다
  const [gift, setGift] = useState<{ who: string; what: string; line: string } | null>(null);
  useEffect(() => {
    (async () => {
      const f = await getFriendResult();
      if (f) return setGift({ who: f.n, what: `'${f.k}' 결과를 보냈어요`, line: f.h });
      const inv = await getPendingInvite();
      if (inv) setGift({ who: inv.inviterNickname, what: '궁합을 신청했어요', line: '가입하면 둘의 궁합이 바로 나와요' });
    })();
  }, []);

  const helpItem = (label: string, onPress: () => void) => (
    <PressableScale key={label} onPress={() => { setHelp(false); onPress(); }} style={s.helpRow} scaleTo={0.98}>
      <Text style={s.helpText}>{label}</Text>
      <Icon name="chevronRight" size={18} color={colors.inkMute} />
    </PressableScale>
  );

  return (
    <SafeAreaView style={s.root}>
      {/* 필요한 순간에 위로 띄우는 화면이라 닫고 돌아갈 수 있게 */}
      {nav.canGoBack() ? (
        <PressableScale onPress={() => nav.goBack()} hitSlop={12} style={s.close} accessibilityLabel="닫기" scaleTo={0.9}>
          <Icon name="close" size={22} />
        </PressableScale>
      ) : null}
      <View style={s.hero}>
        {gift ? (
          <View style={s.gift}>
            <Text style={s.giftWho}>{gift.who}님이 {gift.what}</Text>
            <Text style={s.giftLine} numberOfLines={2}>“{gift.line}”</Text>
            <Text style={[txt.caption, { marginTop: 6 }]}>30초 가입하고 내 결과와 바로 비교해 보세요</Text>
          </View>
        ) : null}
        <BrandMark size={58} />
        <Text style={s.headline}>{COPY.ask}</Text>
        <Text style={[txt.small, { marginTop: 6 }]}>{COPY.pickMe}</Text>
      </View>

      <View style={s.bottom}>
        <Text style={s.caption}>SNS 계정으로 간편 가입하기</Text>
        <View style={s.circles}>
          {PROVIDERS.map(p => <SocialCircle key={p} provider={p} onPress={() => nav.navigate('SocialLogin', { provider: p })} />)}
        </View>
        <PressableScale onPress={() => nav.navigate('SignUp')} hitSlop={8} style={{ marginTop: 26 }}>
          <Text style={s.emailLink}>이메일로 시작하기</Text>
        </PressableScale>
        <PressableScale onPress={() => setHelp(true)} style={s.helpPill} scaleTo={0.96}>
          <Text style={s.helpPillText}>로그인에 어려움이 있나요?</Text>
        </PressableScale>
      </View>

      <BottomSheet visible={help} onClose={() => setHelp(false)}>
        <Text style={[txt.h2, { marginBottom: 6 }]}>무엇을 도와드릴까요?</Text>
        {helpItem('이메일로 로그인', () => nav.navigate('EmailLogin'))}
        {helpItem('비밀번호를 잊어버렸어요', () => nav.navigate('FindPassword'))}
        {helpItem('어떤 방법으로 가입했는지 모르겠어요', () => toast('가입할 때 쓴 SNS 아이콘을 차례로 눌러 보세요'))}
        {helpItem('고객센터에 문의하기', () => toast('고객센터는 준비 중이에요 (데모)'))}
      </BottomSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  close: { position: 'absolute', top: 8, left: 12, zIndex: 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: colors.cream },
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  headline: { fontFamily: fonts.display, fontSize: 21, lineHeight: 29, fontWeight: '700', color: colors.ink, letterSpacing: -0.6, marginTop: -24 }, // 로고 아래 여백(약 46)을 빼고 레터링에서 22
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  logoText: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 56, fontWeight: '800', color: colors.purple, letterSpacing: -1, marginTop: 20 },
  logoDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.moon, marginTop: 22 },
  bottom: { alignItems: 'center', paddingBottom: 20, paddingHorizontal: 24 },
  caption: { fontSize: 13, color: colors.inkMute, fontWeight: '500' },
  circles: { flexDirection: 'row', gap: 16, marginTop: 16 },
  emailLink: { fontSize: 15, fontWeight: '600', color: colors.inkSub, textDecorationLine: 'underline' },
  helpPill: { marginTop: 28, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong },
  helpPillText: { fontSize: 13, color: colors.inkMute, fontWeight: '500' },
  gift: { marginBottom: 32, padding: 16, borderRadius: radius.lg, backgroundColor: colors.loveBg, borderWidth: 1, borderColor: colors.love },
  giftWho: { fontSize: 13, fontWeight: '800', color: colors.love },
  giftLine: { fontFamily: fonts.display, fontSize: 19, lineHeight: 27, fontWeight: '700', color: colors.ink, marginTop: 6 },
  helpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  helpText: { fontSize: 15, color: colors.ink, fontWeight: '500' },
});
