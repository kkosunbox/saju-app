import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import { FieldError, FieldLabel } from '../../components/auth/AuthKit';
import { usePremium } from '../../context/PremiumContext';
import { ApiError } from '../../api/client';
import { authApi } from '../../services/server/authApi';
import { isEmail, isStrongPassword, PASSWORD_HINT } from '../../utils/validate';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';

/** 비밀번호 찾기: ① 이메일 → ② 인증번호 + 새 비밀번호 */
export default function FindPasswordScreen() {
  const nav = useNavigation();
  const { toast } = usePremium();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);

  // 재발송 대기 시간
  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const send = async () => {
    if (!isEmail(email) || busy) return;
    setBusy(true); setErr(null);
    try {
      await authApi.sendResetCode(email);
      setStep(2); setLeft(60); setCode('');
    } catch (e) { setErr(e instanceof ApiError && e.code === 'CONTENT_NOT_FOUND' ? '가입하지 않은 이메일이에요.' : '인증번호를 보내지 못했어요.'); }
    finally { setBusy(false); }
  };

  const pwBad = pw.length > 0 && !isStrongPassword(pw);
  const pw2Bad = pw2.length > 0 && pw2 !== pw;
  const can2 = code.length === 6 && isStrongPassword(pw) && pw === pw2 && !busy;
  const reset = async () => {
    if (!can2) return;
    setBusy(true); setErr(null);
    try {
      await authApi.resetPassword(email, code, pw);
      toast('비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요');
      nav.goBack();
    } catch (e) { setErr(e instanceof ApiError && e.status === 400 ? '인증번호가 맞지 않거나 시간이 지났어요.' : '비밀번호를 바꾸지 못했어요.'); setBusy(false); }
  };

  return (
    <Screen
      title="비밀번호 찾기"
      back
      footer={step === 1
        ? <PrimaryButton label={busy ? '보내는 중…' : '인증번호 받기'} onPress={send} disabled={!isEmail(email) || busy} />
        : <PrimaryButton label={busy ? '변경 중…' : '비밀번호 변경'} onPress={reset} disabled={!can2} />}
    >
      <Text style={[txt.title, { marginTop: 8 }]}>{step === 1 ? '가입한 이메일을\n알려주세요' : '인증번호와\n새 비밀번호를 입력해 주세요'}</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>{step === 1 ? '비밀번호를 다시 설정할 수 있는 인증번호를 보내드려요.' : `${email.trim()}로 보낸 6자리 인증번호를 입력해 주세요.`}</Text>

      {step === 1 ? (
        <View style={{ marginTop: 28 }}>
          <FieldLabel>이메일</FieldLabel>
          <TextField value={email} onChangeText={t => { setEmail(t); setErr(null); }} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="send" onSubmitEditing={send} invalid={!!err} />
          <FieldError>{err}</FieldError>
        </View>
      ) : (
        <View style={{ marginTop: 28, gap: 20 }}>
          <View>
            <FieldLabel>인증번호</FieldLabel>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextField containerStyle={{ flex: 1 }} value={code} onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setErr(null); }} placeholder="6자리 숫자" keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" invalid={!!err && /인증번호/.test(err)} />
              <PressableScale onPress={send} disabled={left > 0 || busy} style={{ height: 52, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.card, justifyContent: 'center', opacity: left > 0 ? 0.5 : 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.inkSub }}>{left > 0 ? `재발송 ${left}초` : '재발송'}</Text>
              </PressableScale>
            </View>
            <Text style={[txt.caption, { marginTop: 6 }]}>인증번호는 10분 동안 유효해요.</Text>
          </View>
          <View>
            <FieldLabel>새 비밀번호</FieldLabel>
            <TextField value={pw} onChangeText={setPw} placeholder={PASSWORD_HINT} secureTextEntry autoComplete="new-password" textContentType="newPassword" invalid={pwBad} />
            <FieldError>{pwBad ? `${PASSWORD_HINT}으로 만들어 주세요.` : null}</FieldError>
          </View>
          <View>
            <FieldLabel>새 비밀번호 확인</FieldLabel>
            <TextField value={pw2} onChangeText={setPw2} placeholder="한 번 더 입력해 주세요" secureTextEntry autoComplete="new-password" textContentType="newPassword" invalid={pw2Bad} />
            <FieldError>{pw2Bad ? '비밀번호가 서로 달라요.' : err}</FieldError>
          </View>
          <PressableScale onPress={() => { setStep(1); setErr(null); }} hitSlop={8}><Text style={{ fontSize: 13, color: colors.inkMute, textAlign: 'center', textDecorationLine: 'underline' }}>이메일 다시 입력하기</Text></PressableScale>
        </View>
      )}
    </Screen>
  );
}
