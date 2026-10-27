import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import PrimaryButton from '../../components/PrimaryButton';
import { SOCIAL_LABEL } from '../../components/auth/socialLabels';
import { SocialLoginError, finishWebSocialLogin } from '../../services/server/socialAuth';
import { useAfterSocialLogin } from './useAfterSocialLogin';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

const MESSAGE: Record<SocialLoginError['reason'], string> = {
  state: '로그인 요청이 만료됐어요. 처음부터 다시 시도해 주세요.',
  denied: '로그인을 취소했어요.',
  'two-factor': '2단계 인증을 쓰는 계정은 지금 웹에서 로그인할 수 없어요. 이메일로 로그인해 주세요.',
  server: '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.',
};

/** 웹 소셜 로그인 콜백 (/oauth/{provider}/callback · /auth/callback/{provider}): 서버에서 로그인을 마치고 돌아간다 */
export default function OAuthCallbackScreen() {
  const q = useLocalSearchParams<{ provider: string; code?: string; state?: string; error?: string }>();
  const afterLogin = useAfterSocialLogin();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const brand = SOCIAL_LABEL[q.provider as keyof typeof SOCIAL_LABEL] ?? '소셜';

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        await afterLogin(await finishWebSocialLogin(q.provider, q));
      } catch (e) {
        setError(MESSAGE[e instanceof SocialLoginError ? e.reason : 'server']);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={s.page}>
      {error ? (
        <View style={s.box}>
          <Text style={[txt.h2, { textAlign: 'center' }]}>{brand} 로그인</Text>
          <Text style={[txt.body, { textAlign: 'center', marginTop: 10 }]}>{error}</Text>
          <PrimaryButton label="로그인 화면으로" onPress={() => router.replace('/login')} style={{ marginTop: 24, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <View style={s.box}>
          <ActivityIndicator color={colors.purple} />
          <Text style={[txt.small, { marginTop: 12 }]}>{brand} 계정으로 로그인하고 있어요</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center' },
  box: { alignItems: 'center', paddingHorizontal: 32 },
});
