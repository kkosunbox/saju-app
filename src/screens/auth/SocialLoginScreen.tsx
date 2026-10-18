import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { isWebSocial, startWebSocialLogin } from '../../services/server/socialAuth';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/BrandMark';
import { DemoNote, Mark, SocialButton } from '../../components/auth/AuthKit';
import { RootStackParamList } from '../../navigation/types';
import { SOCIAL_LABEL } from '../../components/auth/socialLabels';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

/**
 * 카카오·네이버·Apple·Google 로그인.
 * 웹 카카오·네이버·구글: 버튼을 누르면 그 회사 로그인 페이지로 갔다가 /oauth/{provider}/callback 으로 돌아온다
 * (services/server/socialAuth.ts). 게스트로 쓰던 데이터는 그 계정으로 이어진다.
 * 앱(네이티브)과 Apple 은 각 콘솔에 앱 정보를 등록한 키가 생기면 붙인다 — 지금은 이메일로 안내.
 */
export default function SocialLoginScreen() {
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'SocialLogin'>>();
  const p = params.provider;
  const brand = SOCIAL_LABEL[p];
  const LOGO_BG = { kakao: '#FEE500', naver: '#03C75A', apple: '#000000', google: '#FFFFFF' }[p];
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const live = Platform.OS === 'web' && isWebSocial(p);
  const go = async () => {
    if (!isWebSocial(p) || busy) return;
    setBusy(true); setFailed(false);
    try { await startWebSocialLogin(p); } catch { setFailed(true); setBusy(false); }
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
        <Text style={[txt.small, { textAlign: 'center', marginTop: 6 }]}>처음이라면 약관에만 동의하면 바로 시작할 수 있어요.</Text>

        {live ? (
          <Text style={[txt.small, { textAlign: 'center' }]}>{failed ? `${brand} 로그인 페이지를 열지 못했어요. 잠시 후 다시 시도해 주세요.` : `${brand} 로그인 페이지로 이동해요. 지금까지 본 운세는 그대로 이어져요.`}</Text>
        ) : (
          <DemoNote>{Platform.OS === 'web' ? `${brand} 로그인은 준비 중이에요.` : `앱에서 ${brand} 로그인은 준비 중이에요.`} 지금은 이메일로 시작해 주세요. 지금까지 본 운세는 그대로 이어져요.</DemoNote>
        )}
      </View>
      <View style={s.footer}>
        {live
          ? <SocialButton provider={params.provider} onPress={go} label={busy ? '이동하는 중…' : `${brand}로 계속하기`} />
          : <SocialButton provider={params.provider} onPress={() => nav.navigate('SignUp')} label="이메일로 시작하기" />}
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
  footer: { paddingHorizontal: 24, paddingBottom: 8 },
});
