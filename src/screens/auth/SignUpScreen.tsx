import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import { FieldError, FieldLabel } from '../../components/auth/AuthKit';
import TermsAgreement, { NO_AGREEMENTS, requiredAgreed } from '../../components/auth/TermsAgreement';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { ApiError } from '../../api/client';
import { isEmail, isStrongPassword, PASSWORD_HINT } from '../../utils/validate';
import { colors } from '../../theme/colors';
import { txt } from '../../theme/typography';
import { useNavigation } from '@/navigation/compat';

const MESSAGE: Record<string, string> = {
  ALREADY_EXISTS: '이미 가입한 이메일이에요. 로그인해 주세요.',
  BAD_REQUEST: '인증번호가 맞지 않거나 시간이 지났어요. 다시 받아 주세요.',
  INVALID_CODE: '인증번호가 맞지 않아요.',
  DAILY_LIMIT_REACHED: '오늘은 인증 메일을 더 보낼 수 없어요. 내일 다시 시도해 주세요.',
  COOLDOWN_PERIOD_NOT_EXPIRED: '잠시 후 다시 보내 주세요.',
};
const messageOf = (e: unknown, fallback: string) => (e instanceof ApiError && MESSAGE[e.code]) || fallback;

/** 이메일 가입: 이메일·비밀번호 → 약관 시트 → 메일로 받은 인증번호 → 가입 (게스트로 쓰던 데이터는 그대로 이어짐) */
export default function SignUpScreen() {
  const { sendSignupCode, verifySignupCode, completeSignup } = useApp();
  const nav = useNavigation();
  const { toast } = usePremium();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [agree, setAgree] = useState(NO_AGREEMENTS);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const emailBad = email.length > 0 && !isEmail(email);
  const pwBad = pw.length > 0 && !isStrongPassword(pw);
  const formOk = isEmail(email) && isStrongPassword(pw);
  const requiredOk = requiredAgreed(agree);

  /** 약관 동의 → 인증 메일 발송 */
  const submit = async () => {
    if (!formOk || !requiredOk || busy) return;
    setBusy(true); setErr(null);
    try {
      await sendSignupCode(email);
      setSheet(false);
      setCodeSent(true);
      toast('인증번호를 메일로 보냈어요');
    } catch (e) {
      setSheet(false);
      setErr(messageOf(e, '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setBusy(false);
    }
  };

  /** 인증번호 확인 → 가입 완료 */
  const finish = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true); setErr(null);
    try {
      const emailVerifiedToken = await verifySignupCode(email, code);
      await completeSignup({ emailVerifiedToken, password: pw, marketing: agree.marketing });
      toast('가입을 환영해요!');
    } catch (e) {
      setErr(messageOf(e, '가입하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      setBusy(false);
    }
  };

  if (codeSent) {
    return (
      <Screen back footer={<PrimaryButton label={busy ? '가입 중…' : '가입 완료'} onPress={finish} disabled={code.length !== 6 || busy} />}>
        <Text style={[txt.title, { marginTop: 8 }]}>메일로 받은 인증번호</Text>
        <Text style={[txt.small, { marginTop: 6 }]}>{email}로 보낸 6자리 숫자를 입력해 주세요. 10분 동안 쓸 수 있어요.</Text>
        <View style={{ marginTop: 28 }}>
          <TextField value={code} onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setErr(null); }} placeholder="000000" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" autoFocus invalid={!!err} />
          <FieldError>{err}</FieldError>
          <PressableScale onPress={() => { setCodeSent(false); setCode(''); }} hitSlop={8} style={{ marginTop: 14 }}>
            <Text style={s.docLink}>메일을 다시 받을래요</Text>
          </PressableScale>
        </View>
      </Screen>
    );
  }

  return (
    <Screen back footer={<PrimaryButton label="다음" onPress={() => setSheet(true)} disabled={!formOk} />}>
      <Text style={[txt.title, { marginTop: 8 }]}>이메일로 시작하기</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>이메일 인증 한 번이면 바로 시작할 수 있어요. 지금까지 본 운세는 그대로 이어져요.</Text>

      <View style={{ marginTop: 28, gap: 20 }}>
        <View>
          <FieldLabel>이메일</FieldLabel>
          <TextField value={email} onChangeText={t => { setEmail(t); setErr(null); }} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoFocus invalid={emailBad || !!err} />
          <FieldError>{emailBad ? '이메일 형식을 확인해 주세요.' : err}</FieldError>
        </View>
        <View>
          <FieldLabel>비밀번호</FieldLabel>
          <View>
            <TextField value={pw} onChangeText={setPw} placeholder={PASSWORD_HINT} secureTextEntry={!show} autoComplete="new-password" textContentType="newPassword" invalid={pwBad} containerStyle={{ paddingRight: 64 }} />
            <PressableScale onPress={() => setShow(v => !v)} style={s.eye} hitSlop={8} accessibilityLabel={show ? '비밀번호 숨기기' : '비밀번호 보기'}>
              <Text style={s.eyeText}>{show ? '숨기기' : '보기'}</Text>
            </PressableScale>
          </View>
          {pwBad ? <FieldError>{`${PASSWORD_HINT}으로 만들어 주세요.`}</FieldError> : <Text style={[txt.caption, { marginTop: 6 }]}>{PASSWORD_HINT}</Text>}
        </View>
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        <Text style={txt.h2}>약관에 동의해 주세요</Text>
        <TermsAgreement value={agree} onChange={setAgree} onOpenDoc={doc => { setSheet(false); nav.navigate('Legal', { doc }); }} />
        <PrimaryButton label={busy ? '보내는 중…' : '동의하고 인증 메일 받기'} onPress={submit} disabled={!requiredOk || busy} style={{ marginTop: 16 }} />
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText: { fontSize: 13, fontWeight: '600', color: colors.inkMute },
  docLink: { fontSize: 12, fontWeight: '700', color: colors.purple, marginTop: 6 },
});
