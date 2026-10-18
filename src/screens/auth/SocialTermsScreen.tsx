import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import Screen from '../../components/Screen';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { FieldError } from '../../components/auth/AuthKit';
import TermsAgreement, { NO_AGREEMENTS, requiredAgreed } from '../../components/auth/TermsAgreement';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { authApi } from '../../services/server/authApi';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

/** 앱 안 경로만 (다른 사이트로 보내지 않는다) */
const safeNext = (next?: string) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

/**
 * 소셜 가입 마무리: 소셜 로그인을 마친 새 계정이 운Pick 약관에 동의한다 (POST /auth/complete-signup).
 * 동의하기 전에 나가면 다음 소셜 로그인 때 다시 이 화면으로 온다.
 */
export default function SocialTermsScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signOut } = useApp();
  const { toast } = usePremium();
  const [agree, setAgree] = useState(NO_AGREEMENTS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ok = requiredAgreed(agree);

  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr(null);
    try {
      await authApi.agreeTerms(agree.marketing);
      toast('가입을 환영해요!');
      router.replace(safeNext(next) as Href);
    } catch {
      setErr('가입을 마치지 못했어요. 잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  const leave = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <Screen footer={<PrimaryButton label={busy ? '가입하는 중…' : '동의하고 시작하기'} onPress={submit} disabled={!ok || busy} />}>
      <Text style={[txt.title, { marginTop: 8 }]}>약관에 동의해 주세요</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>마지막 단계예요. 동의하면 가입이 끝나요.</Text>
      <TermsAgreement value={agree} onChange={setAgree} onOpenDoc={doc => router.push(`/legal/${doc}`)} />
      <FieldError>{err}</FieldError>
      <PressableScale onPress={leave} hitSlop={8} style={{ alignSelf: 'center', marginTop: 20 }}>
        <Text style={s.leave}>동의하지 않고 로그아웃</Text>
      </PressableScale>
    </Screen>
  );
}

const s = StyleSheet.create({
  leave: { fontSize: 13, color: colors.inkMute, textDecorationLine: 'underline' },
});
