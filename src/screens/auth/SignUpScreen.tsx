import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import BottomSheet from '../../components/BottomSheet';
import { CheckRow, FieldError, FieldLabel } from '../../components/auth/AuthKit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { AuthError, isEmail, isStrongPassword } from '../../services/auth/authService';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import { useNavigation } from '@/navigation/compat';

type AgreeKey = 'age' | 'terms' | 'privacy' | 'marketing';
const AGREES: { k: AgreeKey; label: string; required: boolean }[] = [
  { k: 'age', label: '[필수] 만 14세 이상이에요', required: true },
  { k: 'terms', label: '[필수] 서비스 이용약관', required: true },
  { k: 'privacy', label: '[필수] 개인정보 수집·이용', required: true },
  { k: 'marketing', label: '[선택] 아침 운세·이벤트 알림 받기', required: false },
];
const DOC: Partial<Record<AgreeKey, string>> = {
  terms: '운세 콘텐츠는 재미와 참고를 위한 것이며 중요한 결정의 근거가 될 수 없어요. 포인트는 콘텐츠 열람에만 쓸 수 있어요.',
  privacy: '항목: 이메일, 닉네임, 생년월일·출생시간, 성별, MBTI, 혈액형 · 목적: 맞춤 운세 제공 · 보관: 회원 탈퇴 시까지',
};

/** 이메일 가입: 입력은 두 칸만, 약관은 마지막에 시트 한 장으로 */
export default function SignUpScreen() {
  const { signUp } = useApp();
  const nav = useNavigation();
  const { toast } = usePremium();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [agree, setAgree] = useState<Record<AgreeKey, boolean>>({ age: false, terms: false, privacy: false, marketing: false });
  const [doc, setDoc] = useState<AgreeKey | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailBad = email.length > 0 && !isEmail(email);
  const pwBad = pw.length > 0 && !isStrongPassword(pw);
  const formOk = isEmail(email) && isStrongPassword(pw);
  const allAgree = AGREES.every(a => agree[a.k]);
  const requiredOk = AGREES.filter(a => a.required).every(a => agree[a.k]);

  const submit = async () => {
    if (!formOk || !requiredOk || busy) return;
    setBusy(true); setErr(null);
    try {
      await signUp({ email, password: pw, marketing: agree.marketing });
      setSheet(false);
      toast('가입을 환영해요! 운세 프로필을 만들어 볼까요');
    } catch (e) {
      setSheet(false);
      setErr(e instanceof AuthError ? e.message : '가입하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <Screen back footer={<PrimaryButton label="다음" onPress={() => setSheet(true)} disabled={!formOk} />}>
      <Text style={[txt.title, { marginTop: 8 }]}>이메일로 시작하기</Text>
      <Text style={[txt.small, { marginTop: 6 }]}>이메일과 비밀번호만 있으면 바로 시작할 수 있어요.</Text>

      <View style={{ marginTop: 28, gap: 20 }}>
        <View>
          <FieldLabel>이메일</FieldLabel>
          <TextField value={email} onChangeText={t => { setEmail(t); setErr(null); }} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoFocus invalid={emailBad || !!err} />
          <FieldError>{emailBad ? '이메일 형식을 확인해 주세요.' : err}</FieldError>
        </View>
        <View>
          <FieldLabel>비밀번호</FieldLabel>
          <View>
            <TextField value={pw} onChangeText={setPw} placeholder="영문·숫자 포함 8자 이상" secureTextEntry={!show} autoComplete="new-password" textContentType="newPassword" invalid={pwBad} containerStyle={{ paddingRight: 64 }} />
            <PressableScale onPress={() => setShow(v => !v)} style={s.eye} hitSlop={8} accessibilityLabel={show ? '비밀번호 숨기기' : '비밀번호 보기'}>
              <Text style={s.eyeText}>{show ? '숨기기' : '보기'}</Text>
            </PressableScale>
          </View>
          {pwBad ? <FieldError>영문과 숫자를 섞어 8자 이상으로 만들어 주세요.</FieldError> : <Text style={[txt.caption, { marginTop: 6 }]}>영문과 숫자를 섞어 8자 이상</Text>}
        </View>
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        <Text style={txt.h2}>약관에 동의해 주세요</Text>
        <PressableScale onPress={() => { const v = !allAgree; setAgree({ age: v, terms: v, privacy: v, marketing: v }); }} style={[s.all, allAgree && s.allOn]} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: allAgree }}>
          <Text style={[s.allText, allAgree && { color: colors.white }]}>{allAgree ? '✓ ' : ''}전체 동의하기</Text>
        </PressableScale>
        <View style={{ marginTop: 6 }}>
          {AGREES.map(a => (
            <CheckRow key={a.k} checked={agree[a.k]} label={a.label} onPress={() => setAgree(x => ({ ...x, [a.k]: !x[a.k] }))} onView={DOC[a.k] ? () => setDoc(d => (d === a.k ? null : a.k)) : undefined} />
          ))}
          {doc && DOC[doc] ? (
            <View style={s.docBox}>
              <Text style={s.doc}>{DOC[doc]}</Text>
              <PressableScale onPress={() => { setSheet(false); nav.navigate('Legal', { doc: doc === 'privacy' ? 'privacy' : 'terms' }); }} hitSlop={8}>
                <Text style={s.docLink}>전문 보기 →</Text>
              </PressableScale>
            </View>
          ) : null}
        </View>
        <PrimaryButton label={busy ? '가입 중…' : '동의하고 가입하기'} onPress={submit} disabled={!requiredOk || busy} style={{ marginTop: 16 }} />
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText: { fontSize: 13, fontWeight: '600', color: colors.inkMute },
  all: { marginTop: 16, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  allOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  allText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  docBox: { marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: colors.cream },
  doc: { fontSize: 12, lineHeight: 18, color: colors.inkSub },
  docLink: { fontSize: 12, fontWeight: '700', color: colors.purple, marginTop: 6 },
});
