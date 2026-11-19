import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useNavigation } from '@/navigation/compat';
import Screen from '../components/Screen';
import Card from '../components/Card';
import { Image } from 'expo-image';
import { POSES } from '../components/ResultMascot';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import { CheckRow, FieldError, FieldLabel } from '../components/auth/AuthKit';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { fmtN } from '../services/premium/catalog';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';

/** 탈퇴 사유. 서버에는 "[라벨] 덧붙인 말"로 보낸다 */
const REASONS = [
  { key: 'accuracy', label: '운세 풀이가 잘 맞지 않았어요' },
  { key: 'content', label: '보고 싶은 콘텐츠가 없어요' },
  { key: 'price', label: '알·구독 가격이 부담돼요' },
  { key: 'bug', label: '쓰기 불편하거나 오류가 있었어요', hint: '어떤 화면에서 불편하셨는지 문의하기로 알려 주시면, 가장 먼저 고칠게요.', link: '문의하기로 알려 주기' },
  { key: 'noti', label: '알림이 너무 자주 와요', hint: '알림은 마이 탭의 알림 설정에서 끄거나 시간을 바꿀 수 있어요. 탈퇴하지 않아도 조용히 둘 수 있어요.' },
  { key: 'privacy', label: '개인정보가 걱정돼요', hint: '어떤 정보를 어디에 쓰는지는 개인정보처리방침에 모두 적어 두었어요. 걱정되는 점을 문의하기로 남겨 주시면 직접 답해 드릴게요.', link: '문의하기로 물어보기' },
  { key: 'rejoin', label: '다른 계정으로 다시 가입할래요', hint: '탈퇴하면 지금 계정의 알·풀이 기록은 새 계정으로 옮겨지지 않아요.' },
  { key: 'etc', label: '기타' },
] as const;
type ReasonKey = (typeof REASONS)[number]['key'];

/** 결제하지 않은 사람에게 보여 줄 무료 콘텐츠 */
const FREE: { title: string; sub: string; go: '/character' | '/mbti-match' | '/past-life' | '/talisman' | '/today' | '/compatibility' }[] = [
  { title: '오늘의 운세', sub: '매일 새로 뽑는 하루 한 장', go: '/today' },
  { title: '기본 궁합', sub: '그 사람과 나, 얼마나 잘 맞을까', go: '/compatibility' },
  { title: '사주 캐릭터', sub: '타고난 기운으로 그린 나의 캐릭터', go: '/character' },
  { title: '찰떡 MBTI', sub: '나와 가장 잘 맞는 MBTI', go: '/mbti-match' },
  { title: '전생 기록서', sub: '전생의 나는 어떤 사람이었을까', go: '/past-life' },
];

const DETAIL_MAX = 500;
const ETC_MIN = 5;

/**
 * 회원 탈퇴: 1) 지워지는 것 확인 → 2) 사유(필수) → 3) 마지막 동의 후 탈퇴.
 * 실수로 두 번 눌러 탈퇴되지 않도록 단계를 나누고, 떠나는 이유를 꼭 듣는다.
 */
export default function WithdrawScreen() {
  const nav = useNavigation();
  const { profiles, deleteAccount } = useApp();
  const { points, ownedCount, subscription } = usePremium();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState<ReasonKey | null>(null);
  const [detail, setDetail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const picked = REASONS.find(r => r.key === reason);
  const detailOk = reason !== 'etc' || detail.trim().length >= ETC_MIN;
  const reasonOk = !!reason && detailOk;
  // 앱스토어·구글 플레이 구독은 스토어에서 직접 해지해야 결제가 멈춘다
  const storeSub = subscription && subscription.status !== 'expired' && subscription.autoRenew && subscription.store !== 'toss' ? subscription.store : null;

  // 유료 풀이를 열었거나 구독한 사람에겐 잃는 것을, 아니면(막 가입했거나 무료로만 쓴 사람) 아직 못 해 본 무료 콘텐츠를 보여 준다.
  // 알은 가입 환영 알로 누구나 갖고 있어서 기준으로 쓰지 않는다
  const invested = ownedCount > 0 || !!subscription;
  const losses = ([] as (readonly [string, string] | false | null)[]).concat([
    ['저장된 프로필', `${profiles.length}명`],
    points > 0 && ['남아 있는 알', `${fmtN(points)}개`],
    ownedCount > 0 && ['열어 본 유료 풀이', `${ownedCount}개`],
    subscription && subscription.status !== 'expired' && ['정기 구독 혜택', '즉시 사라짐'],
    ['오늘의 운세 · 운알톡 기록', '전부'],
  ]).filter((r): r is readonly [string, string] => !!r);

  const stay = () => nav.goBack();
  const back = () => (step === 1 ? stay() : setStep((step - 1) as 1 | 2));

  const submit = async () => {
    if (!reasonOk || !agreed || busy || !picked) return;
    setBusy(true); setErr(null);
    const text = `[${picked.label}]${detail.trim() ? ` ${detail.trim()}` : ''}`;
    try {
      await deleteAccount(text); // 온보딩 전 상태가 되면 라우터 가드가 온보딩 화면으로 보낸다
    } catch {
      setErr('탈퇴를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  const footer = step === 1 ? (
    <View style={{ gap: 8 }}>
      <PrimaryButton label="조금 더 함께할게요" onPress={stay} />
      <PrimaryButton label="그래도 떠날래요 →" variant="soft" onPress={() => setStep(2)} />
    </View>
  ) : step === 2 ? (
    <PrimaryButton label="다음 →" onPress={() => setStep(3)} disabled={!reasonOk} />
  ) : (
    <View style={{ gap: 8 }}>
      <PrimaryButton label="다시 생각해 볼게요" onPress={stay} />
      <PressableScale onPress={submit} disabled={!agreed || busy} style={[s.danger, (!agreed || busy) && { opacity: 0.4 }]} accessibilityRole="button" accessibilityState={{ disabled: !agreed || busy }}>
        <Text style={s.dangerLabel}>{busy ? '탈퇴하는 중…' : '탈퇴하기'}</Text>
      </PressableScale>
    </View>
  );

  return (
    <Screen title="회원 탈퇴" back onBack={back} footer={footer}>
      <Text style={[txt.caption, { marginTop: 8 }]}>{step} / 3</Text>
      <View style={s.progress}>{[1, 2, 3].map(i => <View key={i} style={[s.bar, i <= step && s.barOn]} />)}</View>

      {step === 1 ? <>
        <View style={s.hero}>
          <Image source={POSES.rain} style={{ width: 96, height: 96 }} contentFit="contain" accessibilityLabel="비구름 아래 시무룩한 젤리" />
        </View>
        {invested ? <>
          <Text style={[txt.title, s.center]}>{'정말 떠나시는 건가요?'}</Text>
          <Text style={[txt.body, s.center, { marginTop: 8 }]}>
            {'함께 쌓아 온 것들이 아직 이만큼 남아 있어요.\n탈퇴하면 모두 지워지고 되돌릴 수 없어요.'}
          </Text>
          <Card style={s.lossCard}>
            {losses.map(([label, value], i) => <LossRow key={label} label={label} value={value} last={i === losses.length - 1} />)}
          </Card>
        </> : <>
          <Text style={[txt.title, s.center]}>{'정말 떠나시는 건가요?'}</Text>
          <Text style={[txt.body, s.center, { marginTop: 8 }]}>
            {'운Pick은 무료로 매일 즐길 수 있어요.'}
          </Text>
          <View style={{ marginTop: 20, gap: 8 }}>
            {FREE.map(f => (
              <PressableScale key={f.title} onPress={() => router.push(f.go)} scaleTo={0.98} style={s.free} accessibilityLabel={`${f.title} 보러 가기`}>
                <View style={{ flex: 1 }}>
                  <Text style={txt.bodyStrong}>{f.title}</Text>
                  <Text style={[txt.small, { marginTop: 2 }]}>{f.sub}</Text>
                </View>
                <Text style={s.freeTag}>무료 →</Text>
              </PressableScale>
            ))}
          </View>
          <Text style={[txt.caption, s.center, { marginTop: 14 }]}>탈퇴하면 저장한 프로필 {profiles.length}명과 운세 기록이 모두 지워져요.</Text>
        </>}

        {storeSub ? (
          <View style={s.warn}>
            <Text style={s.warnTitle}>구독은 직접 해지해 주세요</Text>
            <Text style={s.warnBody}>
              {`${storeSub === 'apple' ? 'App Store' : 'Google Play'} 구독은 탈퇴만으로 결제가 멈추지 않아요. ${storeSub === 'apple' ? '설정 › Apple ID › 구독' : 'Play 스토어 › 결제 및 정기 결제'}에서 먼저 해지해 주세요.`}
            </Text>
          </View>
        ) : null}
      </> : null}

      {step === 2 ? <>
        <Text style={[txt.title, { marginTop: 20 }]}>{'어떤 점이\n아쉬우셨나요?'}</Text>
        <Text style={[txt.small, { marginTop: 6 }]}>남겨 주신 이야기는 운영팀이 한 줄 한 줄 직접 읽어요. 다음에 오셨을 땐 더 나은 운Pick이 되어 있을게요.</Text>

        <View style={{ marginTop: 22, gap: 8 }}>
          {REASONS.map(r => {
            const on = reason === r.key;
            return (
              <PressableScale key={r.key} onPress={() => setReason(r.key)} scaleTo={0.98} haptic style={[s.reason, on && s.reasonOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
                <Text style={[s.reasonLabel, on && { color: colors.ink, fontWeight: '700' }]}>{r.label}</Text>
              </PressableScale>
            );
          })}
        </View>

        {picked && 'hint' in picked ? (
          <View style={s.hint}>
            <Text style={s.hintText}>{picked.hint}</Text>
            {'link' in picked ? (
              <PressableScale onPress={() => nav.navigate('Inquiry')} hitSlop={8} style={{ marginTop: 8 }}>
                <Text style={s.hintLink}>{picked.link} →</Text>
              </PressableScale>
            ) : null}
          </View>
        ) : null}

        {reason ? (
          <View style={{ marginTop: 22 }}>
            <FieldLabel>{reason === 'etc' ? '어떤 이유인지 알려 주세요 (필수)' : '조금 더 들려주실 수 있을까요? (선택)'}</FieldLabel>
            <TextField
              value={detail}
              onChangeText={setDetail}
              placeholder={reason === 'etc' ? `${ETC_MIN}자 이상 적어 주세요` : '한 줄이라도 큰 힘이 돼요'}
              multiline
              maxLength={DETAIL_MAX}
              style={{ height: 120 }}
            />
            <Text style={[txt.caption, { textAlign: 'right', marginTop: 6 }]}>{detail.length} / {DETAIL_MAX}</Text>
          </View>
        ) : null}
      </> : null}

      {step === 3 ? <>
        <Text style={[txt.title, { marginTop: 20 }]}>{'마지막으로\n한 번만 더 확인할게요'}</Text>
        <Card style={s.lossCard}>
          <Text style={txt.caption}>떠나시는 이유</Text>
          <Text style={[txt.bodyStrong, { marginTop: 4 }]}>{picked?.label}</Text>
          {detail.trim() ? <Text style={[txt.body, { marginTop: 4 }]}>{detail.trim()}</Text> : null}
        </Card>
        <View style={{ marginTop: 16, gap: 6 }}>
          <Text style={txt.body}>· 프로필 · 운세 기록 · 알 · 유료 풀이가 모두 지워져요.</Text>
          <Text style={txt.body}>· 지워진 내용은 운영팀도 되살릴 수 없어요.</Text>
          {storeSub ? <Text style={[txt.body, { color: colors.danger }]}>· 스토어 구독은 직접 해지해야 결제가 멈춰요.</Text> : null}
        </View>
        <View style={{ marginTop: 20 }}>
          <CheckRow checked={agreed} onPress={() => setAgreed(a => !a)} label="위 내용을 모두 확인했고, 탈퇴에 동의해요" strong />
        </View>
        <FieldError>{err}</FieldError>
      </> : null}
    </Screen>
  );
}

function LossRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.lossRow, !last && s.lossBorder]}>
      <Text style={txt.body}>{label}</Text>
      <Text style={[txt.bodyStrong, { color: colors.danger }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 6, marginTop: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  barOn: { backgroundColor: colors.navy },
  free: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.card },
  freeTag: { ...txt.small, color: colors.accent, fontWeight: '700' },
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  lossCard: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 14 },
  lossRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  lossBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  warn: { marginTop: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  warnTitle: { ...txt.bodyStrong, color: colors.danger },
  warnBody: { ...txt.small, color: colors.inkSub, marginTop: 4 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.card },
  reasonOn: { borderColor: colors.navy, backgroundColor: colors.surface },
  reasonLabel: { ...txt.body, flex: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  hint: { marginTop: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  hintText: { ...txt.small, color: colors.inkSub },
  hintLink: { ...txt.small, color: colors.accent, fontWeight: '700' },
  danger: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  dangerLabel: { color: colors.white, fontSize: 15, fontWeight: '600', letterSpacing: -0.5 },
});
