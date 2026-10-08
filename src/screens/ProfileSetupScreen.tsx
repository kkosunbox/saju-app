import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import MoonLoader from '../components/MoonLoader';
import Icon from '../components/Icon';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';
import { BloodType, Gender, Interest, MBTI, User } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { isValidDate } from '../utils/date';
import { motion, useReducedMotion } from '../utils/motion';

const STEPS = [
  { key: 'name', q: '이름을 알려주세요', hint: '운세에서 불러드릴 이름이에요.' },
  { key: 'birth', q: '생일을 알려주세요', hint: '양력 기준으로 입력해 주세요.' },
  { key: 'time', q: '태어난 시간을 알려주세요', hint: '사주의 시주와 태국 점성술에 쓰여요.' },
  { key: 'gender', q: '성별을 선택해주세요', hint: '' },
  { key: 'mbti', q: 'MBTI를 선택해주세요', hint: '' },
  { key: 'blood', q: '혈액형을 선택해주세요', hint: '' },
  { key: 'extra', q: '조금 더 알려주시겠어요?', hint: '선택 사항이에요. 운세 문장이 더 나에게 맞춰져요.' },
] as const;

const INTERESTS: { k: Interest; l: string }[] = [
  { k: 'love', l: '❤️ 연애' }, { k: 'money', l: '💰 재물' }, { k: 'work', l: '💼 일' },
  { k: 'relationship', l: '🤝 관계' }, { k: 'health', l: '🌿 건강' }, { k: 'study', l: '📖 공부' },
];

const LOADING_MSGS = ['사주 원국을 세우는 중', '태어난 요일의 행성을 찾는 중', 'MBTI 성향을 읽는 중', '네 가지 결과를 엮는 중'];

export default function ProfileSetupScreen() {
  const { saveUser } = useApp();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const [nickname, setNickname] = useState('');
  const [y, setY] = useState(''); const [m, setM] = useState(''); const [d, setD] = useState('');
  const [hh, setHh] = useState(''); const [mm, setMm] = useState(''); const [unknownTime, setUnknownTime] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [concern, setConcern] = useState('');

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
  const canNext = [nickname.trim().length > 0, dateOk, timeOk, !!gender, !!mbti, !!blood, true][step];

  const finish = () => {
    setGenerating(true);
    const user: User = {
      id: `local-${Date.now().toString(36)}`,
      nickname: nickname.trim(),
      birthDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      birthTime: unknownTime ? null : `${hh.padStart(2, '0')}:${(mm || '0').padStart(2, '0')}`,
      gender: gender!, mbti: mbti!, bloodType: blood!,
      occupation: occupation.trim() || undefined,
      interests, concern: concern.trim() || undefined,
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
          {step === STEPS.length - 1 ? (
            <PressableScale onPress={finish} hitSlop={10} scaleTo={0.94}><Text style={s.skip}>건너뛰기</Text></PressableScale>
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
                  <View style={s.row}>
                    <TextField containerStyle={{ flex: 1.5 }} value={y} onChangeText={t => setY(t.replace(/\D/g, ''))} placeholder="1995" keyboardType="number-pad" maxLength={4} autoFocus suffix="년" invalid={dateFilled && !dateOk} />
                    <TextField containerStyle={{ flex: 1 }} value={m} onChangeText={t => setM(t.replace(/\D/g, ''))} placeholder="3" keyboardType="number-pad" maxLength={2} suffix="월" invalid={dateFilled && !dateOk} />
                    <TextField containerStyle={{ flex: 1 }} value={d} onChangeText={t => setD(t.replace(/\D/g, ''))} placeholder="15" keyboardType="number-pad" maxLength={2} suffix="일" invalid={dateFilled && !dateOk} />
                  </View>
                  {dateFilled && !dateOk ? <Text style={s.error}>1900년 이후의 실제 날짜를 입력해 주세요.</Text> : null}
                </>
              )}

              {cur.key === 'time' && (
                <>
                  <View style={[s.row, unknownTime && { opacity: 0.35 }]} pointerEvents={unknownTime ? 'none' : 'auto'}>
                    <TextField containerStyle={{ flex: 1 }} value={hh} onChangeText={t => setHh(t.replace(/\D/g, ''))} placeholder="14" keyboardType="number-pad" maxLength={2} suffix="시" invalid={hh !== '' && !hourOk} />
                    <TextField containerStyle={{ flex: 1 }} value={mm} onChangeText={t => setMm(t.replace(/\D/g, ''))} placeholder="30" keyboardType="number-pad" maxLength={2} suffix="분" invalid={!minOk} />
                  </View>
                  <Text style={[txt.caption, { marginTop: 8 }]}>24시간 기준이에요. 오후 2시는 14시로 입력해 주세요.</Text>
                  <OptionChip compact label="태어난 시간을 몰라요" selected={unknownTime} onPress={() => setUnknownTime(!unknownTime)} style={{ marginTop: 20 }} />
                </>
              )}

              {cur.key === 'gender' && (
                <View style={s.row}>
                  <OptionChip style={{ flex: 1, minHeight: 64 }} label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
                  <OptionChip style={{ flex: 1, minHeight: 64 }} label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
                </View>
              )}

              {cur.key === 'mbti' && (
                <View style={s.grid}>
                  {MBTI_LIST.map(t => (
                    <OptionChip key={t} style={s.mbtiCell} label={t} sub={MBTI_INFO[t].nickname} selected={mbti === t} onPress={() => setMbti(t)} />
                  ))}
                </View>
              )}

              {cur.key === 'blood' && (
                <View style={s.row}>
                  {(['A', 'B', 'O', 'AB'] as BloodType[]).map(b => (
                    <OptionChip key={b} style={{ flex: 1, minHeight: 64 }} label={`${b}형`} selected={blood === b} onPress={() => setBlood(b)} />
                  ))}
                </View>
              )}

              {cur.key === 'extra' && (
                <View style={{ gap: 22 }}>
                  <View>
                    <Text style={s.fieldLabel}>직업</Text>
                    <TextField value={occupation} onChangeText={setOccupation} placeholder="예: 디자이너, 학생" maxLength={20} />
                  </View>
                  <View>
                    <Text style={s.fieldLabel}>관심 분야</Text>
                    <View style={s.grid}>
                      {INTERESTS.map(i => (
                        <OptionChip key={i.k} compact style={s.interestCell} label={i.l} selected={interests.includes(i.k)} onPress={() => setInterests(v => (v.includes(i.k) ? v.filter(x => x !== i.k) : [...v, i.k]))} />
                      ))}
                    </View>
                  </View>
                  <View>
                    <Text style={s.fieldLabel}>요즘 고민</Text>
                    <TextField value={concern} onChangeText={setConcern} placeholder="예: 이직을 고민하고 있어요" multiline maxLength={100} />
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
          <PrimaryButton label={step === STEPS.length - 1 ? '내 운세 프로필 만들기' : '다음'} onPress={next} disabled={!canNext} />
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
  progressBar: { height: 3, backgroundColor: colors.purple, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mbtiCell: { width: '23.4%' },
  interestCell: { width: '31.6%' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.inkSub, marginBottom: 8 },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
});
