import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/BrandMark';
import { CheckRow, DemoNote, Mark, SocialButton } from '../../components/auth/AuthKit';
import { RootStackParamList } from '../../navigation/types';
import { SOCIAL_LABEL } from '../../components/auth/socialLabels';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

/**
 * 카카오·네이버·Apple·Google 로그인 — 준비 중.
 * 각 사 앱 키가 생기면 이 화면 대신 OAuth 동의 화면을 열고, 인가 코드를 서버(/auth/{provider})로 보낸다.
 * 서버는 게스트 토큰과 함께 오면 게스트를 회원으로 잇는다.
 */
export default function SocialLoginScreen() {
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'SocialLogin'>>();
  const p = params.provider;
  const brand = SOCIAL_LABEL[p];
  const LOGO_BG = { kakao: '#FEE500', naver: '#03C75A', apple: '#000000', google: '#FFFFFF' }[p];
  const [emailOk, setEmailOk] = useState(true);

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
        <DemoNote>{brand} 로그인은 준비 중이에요. 지금은 이메일로 시작해 주세요. 지금까지 본 운세는 그대로 이어져요.</DemoNote>
      </View>
      <View style={s.footer}>
        <SocialButton provider={params.provider} onPress={() => nav.navigate('SignUp')} label="이메일로 시작하기" />
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
