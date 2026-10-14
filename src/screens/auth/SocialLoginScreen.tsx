import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/BrandMark';
import { CheckRow, DemoNote, Mark, SocialButton } from '../../components/auth/AuthKit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { SOCIAL_LABEL } from '../../services/auth/authService';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

/**
 * 카카오·네이버·Apple·Google 로그인 (데모)
 * 실제 연동 시 이 화면 대신 각 사의 OAuth 동의 화면이 열리고, 돌아온 인가 코드를 서버에서 토큰으로 바꾼다.
 */
export default function SocialLoginScreen() {
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'SocialLogin'>>();
  const { signInWithProvider } = useApp();
  const { toast } = usePremium();
  const p = params.provider;
  const brand = SOCIAL_LABEL[p];
  const LOGO_BG = { kakao: '#FEE500', naver: '#03C75A', apple: '#000000', google: '#FFFFFF' }[p];
  const [emailOk, setEmailOk] = useState(true);
  const [busy, setBusy] = useState(false);

  const agree = async () => {
    setBusy(true);
    await signInWithProvider(p, { name: `${brand} 사용자`, email: emailOk ? `demo@${p === 'apple' ? 'icloud' : p === 'google' ? 'gmail' : p}.com` : null });
    toast(`${brand} 계정으로 로그인했어요`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={s.top}>
        <View style={{ width: 44 }} />
        <Text style={txt.h3}>{brand} 로그인</Text>
        <PressableScale onPress={() => nav.goBack()} style={s.close} accessibilityLabel="닫기" scaleTo={0.9}><Icon name="close" size={22} /></PressableScale>
      </View>
      <View style={s.body}>
        <View style={s.logos}>
          <View style={[s.logo, { backgroundColor: LOGO_BG }, p === 'google' && { borderWidth: 1, borderColor: '#DADCE0' }]}>
            <Mark provider={p} size={28} />
          </View>
          <View style={s.dots}>{[0, 1, 2].map(i => <View key={i} style={s.dot} />)}</View>
          <View style={[s.logo, { backgroundColor: colors.heroBg }]}><LogoMark size={38} fg={'#F4EDDF'} /></View>
        </View>
        <Text style={[txt.h2, { textAlign: 'center', marginTop: 20 }]}>운Pick에서 {brand} 계정 정보를{'\n'}요청해요</Text>
        <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>동의하면 별도 가입 없이 바로 시작할 수 있어요.</Text>

        <View style={s.card}>
          <Text style={s.cardHead}>제공 항목</Text>
          <CheckRow checked label={`[필수] 프로필 정보 (닉네임)`} onPress={() => {}} />
          <CheckRow checked={emailOk} label="[선택] 이메일 주소" onPress={() => setEmailOk(v => !v)} />
        </View>
        <DemoNote>기획 공유용 데모예요. 실제 {brand} 계정에 접속하지 않고, 이 기기에 데모 계정을 만들어 로그인해요.</DemoNote>
      </View>
      <View style={s.footer}>
        <SocialButton provider={params.provider} onPress={agree} label={busy ? '로그인 중…' : `동의하고 ${brand}로 계속하기`} />
        <PressableScale onPress={() => nav.goBack()} style={{ alignSelf: 'center', padding: 12 }}><Text style={{ fontSize: 14, color: colors.inkMute }}>취소</Text></PressableScale>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  logos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  logo: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  cardHead: { fontSize: 12, fontWeight: '700', color: colors.inkMute, marginBottom: 2, marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 8 },
});
