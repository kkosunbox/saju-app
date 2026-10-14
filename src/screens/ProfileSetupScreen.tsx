import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import MoonLoader from '../components/MoonLoader';
import Icon from '../components/Icon';
import { CheckRow } from '../components/auth/AuthKit';
import { colors } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { BloodType, Gender, MBTI, User } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { isValidDate } from '../utils/date';
import { motion, useReducedMotion } from '../utils/motion';
import { guessMbti } from '../utils/mbtiGuess';

/** 4단계: 이름 → 생일·시간 → 성별·혈액형 → MBTI (직업·관심사는 마이에서 나중에) */
const STEPS = [
  { key: 'name', q: '어떻게 불러드릴까요?', hint: '운세에서 불러드릴 이름이에요.' },
  { key: 'birth', q: '언제 태어났나요?', hint: '양력 기준이에요. 시간은 몰라도 괜찮아요.' },
  { key: 'basic', q: '성별과 혈액형을 알려주세요', hint: '' },
  { key: 'mbti', q: 'MBTI를 골라주세요', hint: '몰라도 괜찮아요. 4문항으로 찾거나, 건너뛰어도 돼요.' },
] as const;

/** MBTI 간이 테스트 — 축마다 한 문항 */
const QUIZ: { q: string; a: [string, string]; axis: [string, string] }[] = [
  { q: '주말에 충전하는 방법은?', a: ['친구들과 밖에서 놀기', '집에서 혼자 쉬기'], axis: ['E', 'I'] },
  { q: '새로운 일을 배울 때 나는?', a: ['순서와 사례부터 익힌다', '큰 그림과 원리부터 본다'], axis: ['S', 'N'] },
  { q: '친구가 고민을 털어놓으면?', a: ['해결책을 같이 찾는다', '먼저 마음을 공감해 준다'], axis: ['T', 'F'] },
  { q: '여행을 떠날 때 나는?', a: ['일정을 미리 짜둔다', '가서 끌리는 대로 다닌다'], axis: ['J', 'P'] },
];

const LOADING_MSGS = ['오늘의 운을 고르는 중', '사주 원국을 세우는 중', '태어난 요일의 행성을 찾는 중', 'MBTI 성향을 읽는 중', '네 가지 결과를 엮는 중'];

export default function ProfileSetupScreen() {
  const { saveUser, signOut, account } = useApp();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const [nickname, setNickname] = useState('');
  const [y, setY] = useState(''); const [m, setM] = useState(''); const [d, setD] = useState('');
  const [hh, setHh] = useState(''); const [mm, setMm] = useState(''); const [unknownTime, setUnknownTime] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [skipMbti, setSkipMbti] = useState(false);
  const [quiz, setQuiz] = useState<(0 | 1 | null)[] | null>(null);

  // 단계 전환 애니메이션 + 진행 막대
  const enter = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(1 / STEPS.length)).current;
  const dir = useRef(1);
  useEffect(() => {
    Animated.timing(progress, { toValue: (step + 1) / STEPS.length, duration: motion.base, easing: motion.easeOut, useNativeDriver: false }).start();
    if (reduced) return;
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: motion.base, easing: motion.easeOut, useNativeDriver: true }).start();
  }, [step]);

  const dateFilled = y.length === 4 && !!m && !!d;
  const dateOk = isValidDate(Number(y), Number(m), Number(d));
  const hourOk = hh !== '' && Number(hh) >= 0 && Number(hh) <= 23;
  const minOk = mm === '' || (Number(mm) >= 0 && Number(mm) <= 59);
  const timeOk = unknownTime || (hourOk && minOk);
  const canNext = [nickname.trim().length > 0, dateOk && timeOk, !!gender && !!blood, !!mbti || skipMbti][step];

  const answer = (i: number, v: 0 | 1) => {
    const next = [...(quiz ?? [null, null, null, null])] as (0 | 1 | null)[];
    next[i] = v;
    setQuiz(next);
    if (next.every(x => x !== null)) setMbti(next.map((x, k) => QUIZ[k].axis[x!]).join('') as MBTI);
  };

  const finish = () => {
    setGenerating(true);
    const birth = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const time = `${hh.padStart(2, '0')}:${(mm || '0').padStart(2, '0')}`;
    const user: User = {
      id: `local-${Date.now().toString(36)}`,
      nickname: nickname.trim(),
      birthDate: birth,
      birthTime: unknownTime ? null : time,
      gender: gender!, bloodType: blood!,
      ...(mbti && !skipMbti ? { mbti } : { mbti: guessMbti(birth, unknownTime ? null : time), mbtiUnknown: true }),
      interests: [],
      createdAt: new Date().toISOString(),
    };
    setTimeout(() => saveUser(user), 3200);
  };

  const go = (to: number) => { dir.current = to > step ? 1 : -1; setStep(to); };
  const next = () => (step === STEPS.length - 1 ? finish() : go(step + 1));

  if (generating) return <MoonLoader title={`${nickname.trim()}님만의\n운세 프로필을 만들고 있어요`} messages={LOADING_MSGS} />;

  const cur = STEPS[step];
  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [18 * dir.current, 0] });
  const barW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.top}>
          <PressableScale onPress={() => go(Math.max(0, step - 1))} hitSlop={10} style={[s.back, { opacity: step ? 1 : 0 }]} disabled={!step} scaleTo={0.9} accessibilityLabel="이전 단계">
            <Icon name="chevronLeft" size={24} />
          </PressableScale>
          <Text style={s.count}>{step + 1} / {STEPS.length}</Text>
          {step === 0 ? (
            // 이미 계정이 있으면(앱을 다시 설치한 경우 등) 로그인해서 프로필·포인트를 되찾는다.
            // 로그인한 상태라면 다른 계정으로 바꿀 수 있게 로그아웃
            account ? (
              <PressableScale onPress={() => signOut()} hitSlop={10} scaleTo={0.94} accessibilityLabel="다른 계정으로 로그인"><Text style={s.skip}>로그아웃</Text></PressableScale>
            ) : (
              <PressableScale onPress={() => router.push('/login')} hitSlop={10} scaleTo={0.94} accessibilityLabel="이미 계정이 있어요, 로그인"><Text style={s.skip}>로그인</Text></PressableScale>
            )
          ) : <View style={{ width: 44 }} />}
        </View>
        <View style={s.progress}><Animated.View style={[s.progressBar, { width: barW }]} /></View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: enter, transform: [{ translateX }] }}>
            <Text style={txt.title}>{cur.q}</Text>
            {cur.hint ? <Text style={[txt.small, { marginTop: 6 }]}>{cur.hint}</Text> : null}

            <View style={{ marginTop: 28 }}>
              {cur.key === 'name' && (
                <TextField value={nickname} onChangeText={setNickname} placeholder="이름 또는 닉네임" maxLength={12} autoFocus returnKeyType="next" onSubmitEditing={() => canNext && next()} />
              )}

              {cur.key === 'birth' && (
                <>
                  <Text style={s.label}>생년월일</Text>
                  <View style={s.row}>
                    <TextField containerStyle={{ flex: 1.5 }} value={y} onChangeText={t => setY(t.replace(/\D/g, ''))} placeholder="1995" keyboardType="number-pad" maxLength={4} autoFocus suffix="년" invalid={dateFilled && !dateOk} />
                    <TextField containerStyle={{ flex: 1 }} value={m} onChangeText={t => setM(t.replace(/\D/g, ''))} placeholder="3" keyboardType="number-pad" maxLength={2} suffix="월" invalid={dateFilled && !dateOk} />
                    <TextField containerStyle={{ flex: 1 }} value={d} onChangeText={t => setD(t.replace(/\D/g, ''))} placeholder="15" keyboardType="number-pad" maxLength={2} suffix="일" invalid={dateFilled && !dateOk} />
                  </View>
                  {dateFilled && !dateOk ? <Text style={s.error}>1900년 이후의 실제 날짜를 입력해 주세요.</Text> : null}

                  <Text style={[s.label, { marginTop: 24 }]}>태어난 시간</Text>
                  <View style={[s.row, unknownTime && { opacity: 0.35 }]} pointerEvents={unknownTime ? 'none' : 'auto'}>
                    <TextField containerStyle={{ flex: 1 }} value={hh} onChangeText={t => setHh(t.replace(/\D/g, ''))} placeholder="14" keyboardType="number-pad" maxLength={2} suffix="시" invalid={hh !== '' && !hourOk} />
                    <TextField containerStyle={{ flex: 1 }} value={mm} onChangeText={t => setMm(t.replace(/\D/g, ''))} placeholder="30" keyboardType="number-pad" maxLength={2} suffix="분" invalid={!minOk} />
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <CheckRow checked={unknownTime} label="태어난 시간을 몰라요" onPress={() => setUnknownTime(!unknownTime)} />
                  </View>
                  <Text style={txt.caption}>24시간 기준 · 오후 2시는 14시. 시간을 알면 사주의 시주까지 봐요.</Text>
                </>
              )}

              {cur.key === 'basic' && (
                <>
                  <Text style={s.label}>성별</Text>
                  <View style={s.row}>
                    <OptionChip style={{ flex: 1 }} label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
                    <OptionChip style={{ flex: 1 }} label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
                  </View>
                  <Text style={[s.label, { marginTop: 24 }]}>혈액형</Text>
                  <View style={s.row}>
                    {(['A', 'B', 'O', 'AB'] as BloodType[]).map(b => (
                      <OptionChip key={b} style={{ flex: 1 }} label={`${b}형`} selected={blood === b} onPress={() => setBlood(b)} />
                    ))}
                  </View>
                </>
              )}

              {cur.key === 'mbti' && (quiz ? (
                <View style={{ gap: 18 }}>
                  {QUIZ.map((qz, i) => (
                    <View key={qz.q}>
                      <Text style={s.quizQ}>{i + 1}. {qz.q}</Text>
                      <View style={{ gap: 8, marginTop: 8 }}>
                        {qz.a.map((a, k) => (
                          <OptionChip key={a} compact label={a} selected={quiz[i] === k} onPress={() => answer(i, k as 0 | 1)} />
                        ))}
                      </View>
                    </View>
                  ))}
                  {mbti ? (
                    <View style={s.result}>
                      <Text style={txt.small}>나의 MBTI는</Text>
                      <Text style={s.resultType}>{mbti} · {MBTI_INFO[mbti].nickname}</Text>
                    </View>
                  ) : null}
                  <PressableScale onPress={() => setQuiz(null)} hitSlop={8}><Text style={s.link}>목록에서 직접 고를게요</Text></PressableScale>
                </View>
              ) : (
                <>
                  <View style={s.grid}>
                    {MBTI_LIST.map(t => (
                      <OptionChip key={t} style={s.mbtiCell} label={t} sub={MBTI_INFO[t].nickname} selected={mbti === t} onPress={() => { setMbti(t); setSkipMbti(false); }} />
                    ))}
                  </View>
                  <PressableScale onPress={() => { setQuiz([null, null, null, null]); setMbti(null); setSkipMbti(false); }} style={s.quizBtn} scaleTo={0.97}>
                    <Text style={s.quizBtnText}>MBTI를 몰라요 · 4문항으로 찾기</Text>
                  </PressableScale>
                  <PressableScale onPress={() => { setSkipMbti(v => !v); setMbti(null); }} style={[s.mbtiSkip, skipMbti && s.skipOn]} scaleTo={0.97} accessibilityState={{ selected: skipMbti }}>
                    <Text style={[s.skipText, skipMbti && { color: colors.white }]}>{skipMbti ? '✓ ' : ''}잘 모르겠어요 · 나중에 할게요</Text>
                  </PressableScale>
                  {skipMbti ? <Text style={[txt.small, { marginTop: 8 }]}>괜찮아요. 사주로 비슷한 성향을 추정해 두고 "(추정)"으로 표시할게요. 마이 탭에서 언제든 바꿀 수 있어요.</Text> : null}
                </>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <PrimaryButton label={step === STEPS.length - 1 ? '내 운세 보러 가기' : '다음'} onPress={next} disabled={!canNext} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 13, color: colors.inkMute, fontWeight: '600', fontVariant: ['tabular-nums'] },
  skip: { fontSize: 14, color: colors.inkMute, fontWeight: '600', paddingHorizontal: 8 },
  progress: { height: 3, backgroundColor: colors.line, marginHorizontal: 24, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: 3, backgroundColor: colors.navy, borderRadius: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSub, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mbtiCell: { width: '23%' },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  mbtiSkip: { marginTop: 10, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  skipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  skipText: { fontSize: 14, fontWeight: '600', color: colors.inkSub },
  quizBtn: { marginTop: 16, height: 48, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  quizBtnText: { fontSize: 14, fontWeight: '600', color: colors.purple },
  quizQ: { fontSize: 15, fontWeight: '700', color: colors.ink },
  result: { alignItems: 'center', padding: 16, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft },
  resultType: { fontSize: 20, fontWeight: '700', color: colors.purple, marginTop: 4 },
  link: { fontSize: 13, color: colors.inkMute, textAlign: 'center', textDecorationLine: 'underline' },
});
