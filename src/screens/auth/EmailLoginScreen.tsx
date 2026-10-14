import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { FieldError } from '../../components/auth/AuthKit';
import { useApp } from '../../context/AppContext';
import { AuthError, isEmail } from '../../services/auth/authService';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

export default function EmailLoginScreen() {
  const nav = useNavigation();
  const { signIn } = useApp();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const can = isEmail(email) && pw.length > 0 && !busy;

  // 비밀번호 찾기 등에서 돌아오면 비밀번호와 오류를 비운다
  useFocusEffect(useCallback(() => { setPw(''); setErr(null); }, []));

  const submit = async () => {
    if (!can) return;
    setBusy(true); setErr(null);
    try { await signIn(email, pw); }
    catch (e) { setErr(e instanceof AuthError ? e.message : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.'); setBusy(false); }
  };

  return (
    <Screen back footer={<PrimaryButton label={busy ? '로그인 중…' : '로그인'} onPress={submit} disabled={!can} />}>
      <Text style={[txt.title, { marginTop: 8 }]}>이메일로 로그인</Text>
      <View style={{ marginTop: 28, gap: 8 }}>
        <TextField value={email} onChangeText={t => { setEmail(t); setErr(null); }} placeholder="이메일" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoFocus />
        <TextField value={pw} onChangeText={t => { setPw(t); setErr(null); }} placeholder="비밀번호" secureTextEntry autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} invalid={!!err} />
        <FieldError>{err}</FieldError>
      </View>
      <View style={s.links}>
        <PressableScale onPress={() => nav.navigate('FindPassword')} hitSlop={8}><Text style={s.link}>비밀번호 찾기</Text></PressableScale>
        <View style={s.sep} />
        <PressableScale onPress={() => nav.navigate('SignUp')} hitSlop={8}><Text style={s.link}>회원가입</Text></PressableScale>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 24 },
  link: { fontSize: 14, color: colors.inkSub, fontWeight: '500' },
  sep: { width: 1, height: 12, backgroundColor: colors.lineStrong },
});
