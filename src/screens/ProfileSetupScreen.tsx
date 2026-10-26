import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MbtiQuiz from '../components/MbtiQuiz';
import BrandMark from '../components/BrandMark';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import MoonLoader from '../components/MoonLoader';
import BirthPlaceSearch from '../components/BirthPlaceSearch';
import { BirthDateField, CalendarType, JasiSide, SijinGrid, checkBirth, fmtTime, sijinLabel, sijinOf, sijinTime } from '../components/BirthFields';
import { colors, gradients } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import { profileLine, profileType } from '../theme/profileDesign';
import { BirthPlace, BloodType, Gender, MBTI } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { motion, useReducedMotion } from '../utils/motion';
import { ApiError } from '../api/client';
import { ProfileInput } from '../services/server/profileApi';
import { placeLabel } from '../services/server/birthPlaceApi';
import { getPendingInvite } from '../services/share/linkShare';

/**
 * 한 화면에 질문이 차례로 쌓인다: 이름 → 생년월일 → 태어난 시간 → 태어난 곳 → 성별 → 혈액형 → MBTI (직업·관심사는 마이에서 나중에).
 * 새 질문이 맨 위에 나타나고, 앞에서 한 답은 아래에 남아 바로 고칠 수 있다.
 * 칸이 큰 질문(시간·태어난 곳·MBTI)은 답하면 한 줄로 접히고, 누르면 다시 펼쳐진다.
 */
const QUESTIONS = [
  { q: () => '어떻게 불러드릴까요?', hint: '운세에서 불러드릴 이름이에요.' },
  { q: (name: string) => `${name}님, 언제 태어났나요?`, hint: '빈칸의 내용을 채워주세요.' },
  { q: () => '몇 시쯤 태어났나요?', hint: '2시간 단위로 골라요. 몰라도 괜찮아요.' },
  { q: () => '어디서 태어났나요?', hint: '시·군이나 도시 이름으로 찾아요. 해외도 돼요.' },
  { q: () => '성별을 알려주세요', hint: '빈칸의 내용을 채워주세요.' },
  { q: () => '혈액형은요?', hint: '빈칸의 내용을 채워주세요.' },
  { q: () => 'MBTI를 골라주세요', hint: '몰라도 괜찮아요. 4문항으로 찾거나, 건너뛰어도 돼요.' },
];
const LAST = QUESTIONS.length - 1;

type TimeMode = 'unknown' | 'sijin' | 'exact';

/** 저장된 시각이 칩이 보내는 시각이면 그 칩으로, 아니면 정확한 시각으로 되살린다 */
function restoreTime(t: string | null | undefined): { mode: TimeMode | null; sijin: number | null; jasi: JasiSide | null; exact: string } {
  if (t === undefined) return { mode: null, sijin: null, jasi: null, exact: '' };
  if (t === null) return { mode: 'unknown', sijin: null, jasi: null, exact: '' };
  const chip = sijinOf(t);
  if (chip) return { mode: 'sijin', ...chip, exact: '' };
  return { mode: 'exact', sijin: null, jasi: null, exact: t.replace(':', '') };
}

const LOADING_MSGS = ['오늘의 운을 고르는 중', '사주 원국을 세우는 중', '태어난 요일의 행성을 찾는 중', 'MBTI 성향을 읽는 중', '네 가지 결과를 엮는 중'];

/** 새로 열린 질문이 위에서 살짝 내려오며 나타난다 */
function Reveal({ children, reduced, style }: { children: React.ReactNode; reduced: boolean; style?: StyleProp<ViewStyle> }) {
  const [a] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (!reduced) Animated.timing(a, { toValue: 1, duration: motion.base, easing: motion.easeOut, useNativeDriver: true }).start();
  }, [a, reduced]);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** 답한 질문을 접어 둔 한 줄 — 누르면 다시 펼쳐 고친다 */
function Summary({ label, value, onPress }: { label: string; value: string; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={s.summary} accessibilityLabel={`${label} ${value}, 바꾸기`}>
      <Text style={s.summaryLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.summaryValue} numberOfLines={1}>{value}</Text>
      <Text style={s.change}>변경</Text>
    </PressableScale>
  );
}

export default function ProfileSetupScreen() {
  const { saveUser, signOut, account, user, editingProfile, cancelProfileEdit, returnToLanding } = useApp();
  // "다시 입력"으로 들어오면 지금 프로필을 채워 둔다 (생일은 입력했던 달력 기준)
  const editing = editingProfile && !!user;
  const savedTime = restoreTime(editing ? user!.birthTime ?? null : undefined);
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  // 몇 번째 질문까지 열렸는지 (수정할 때는 처음부터 다 열린다)
  const [stage, setStage] = useState(editing ? LAST : 0);
  // 접힌 질문 중 다시 펼친 것
  const [open, setOpen] = useState<'time' | 'place' | 'mbti' | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  // 궁합 초대 링크로 들어왔으면 왜 정보를 넣는지 계속 보여 준다 (다 넣으면 홈에서 바로 궁합)
  const [inviter, setInviter] = useState<string | null>(null);
  useEffect(() => { if (!editing) getPendingInvite().then(i => setInviter(i?.inviterNickname ?? null)); }, [editing]);

  const [nickname, setNickname] = useState(editing ? user!.nickname : '');
  const [calendar, setCalendar] = useState<CalendarType>(editing ? user!.calendarType ?? 'solar' : 'solar');
  const [leap, setLeap] = useState(editing ? !!user!.isLeapMonth : false);
  const [birth, setBirth] = useState(editing ? (user!.birthDateInput ?? user!.birthDate).replace(/\D/g, '') : '');
  const [timeMode, setTimeMode] = useState<TimeMode | null>(savedTime.mode);
  const [sijin, setSijin] = useState<number | null>(savedTime.sijin);
  const [jasi, setJasi] = useState<JasiSide | null>(savedTime.jasi);
  const [exact, setExact] = useState(savedTime.exact);
  // undefined = 아직 안 고름, null = 몰라요 (서울로 계산)
  const [place, setPlace] = useState<BirthPlace | null | undefined>(editing ? user!.birthPlace ?? null : undefined);
  const [gender, setGender] = useState<Gender | null>(editing ? user!.gender : null);
  const [blood, setBlood] = useState<BloodType | null>(editing ? user!.bloodType : null);
  const [mbti, setMbti] = useState<MBTI | null>(editing && !user!.mbtiUnknown ? user!.mbti : null);
  const [skipMbti, setSkipMbti] = useState(editing && !!user!.mbtiUnknown);
  const [saveError, setSaveError] = useState<string | null>(null);

  const nameOk = nickname.trim().length > 0;
  const { ok: dateOk, iso: birthISO } = checkBirth(birth, calendar);
  const validExact = (v: string) => v.length === 4 && Number(v.slice(0, 2)) <= 23 && Number(v.slice(2)) <= 59;
  const timeOk = timeMode === 'unknown'
    || (timeMode === 'sijin' && sijin !== null && (sijin !== 0 || !!jasi))
    || (timeMode === 'exact' && validExact(exact));
  const birthTime = timeMode === 'sijin' && sijin !== null
    ? sijinTime(sijin, jasi)
    : timeMode === 'exact' ? fmtTime(exact) : null;
  const answered = [nameOk, dateOk, timeOk, place !== undefined, !!gender, !!blood, !!mbti || skipMbti];
  const allDone = stage === LAST && answered.every(Boolean);
  const curAnswered = answered[stage];

  // 진행 막대는 답한 질문 수만큼 찬다
  const answeredCount = answered.filter(Boolean).length;
  const [progress] = useState(() => new Animated.Value(answeredCount / QUESTIONS.length));
  useEffect(() => {
    Animated.timing(progress, { toValue: answeredCount / QUESTIONS.length, duration: motion.base, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [answeredCount, progress]);

  // 맨 위 질문에 답하면 잠깐 선택을 보여주고 다음 질문을 연다 (이름은 다 썼는지 몰라서 "다음"으로)
  useEffect(() => {
    if (stage < 1 || stage >= LAST || !curAnswered) return;
    const t = setTimeout(() => { Keyboard.dismiss(); setStage(stage + 1); }, stage === 1 ? 450 : 250);
    return () => clearTimeout(t);
  }, [stage, curAnswered]);

  // 새 질문은 맨 위에 생기니 위로 올려 보여준다
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: !reduced }); }, [stage, reduced]);

  const finish = async () => {
    setGenerating(true);
    setSaveError(null);
    const input: ProfileInput = {
      nickname: nickname.trim(),
      calendarType: calendar,
      birthDate: birthISO,
      isLeapMonth: calendar === 'lunar' && leap,
      birthTime,
      birthPlaceId: place?.id ?? null,
      gender: gender!,
      bloodType: blood!,
      // 모르면 서버가 사주로 추정하고 "(추정)"으로 표시한다
      mbti: mbti && !skipMbti ? mbti : null,
      ...(editing ? { interests: user!.interests, concern: user!.concern ?? null, occupation: user!.occupation ?? null } : {}),
    };
    const minimumShow = new Promise(resolve => setTimeout(resolve, editing ? 600 : 1800));
    try {
      await Promise.all([saveUser(input), minimumShow]);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : '';
      setSaveError(
        code === 'INVALID_BIRTH_DATE' ? '없는 날짜예요. 음력이면 윤달 여부도 확인해 주세요.'
          : code === 'INVALID_BIRTH_PLACE' ? '태어난 곳을 다시 골라 주세요.'
          : '저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
      );
      setGenerating(false);
    }
  };

  const next = () => {
    if (allDone) { finish(); return; }
    Keyboard.dismiss();
    setStage(Math.min(LAST, stage + 1));
  };

  if (generating) return <MoonLoader title={editing ? '프로필을 저장하고 있어요' : `${nickname.trim()}님만의\n운세 프로필을 만들고 있어요`} messages={LOADING_MSGS} />;

  const title = allDone
    ? (editing ? '프로필을 확인해 주세요' : '이대로 운세를 볼게요')
    : QUESTIONS[stage].q(nickname.trim());
  const hint = allDone ? '바꿀 항목은 눌러서 고칠 수 있어요.' : QUESTIONS[stage].hint;
  const barW = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // 시간·태어난 곳·MBTI는 답했고 다시 펼치지 않았으면 한 줄로 접는다
  const timeFolded = timeOk && open !== 'time';
  const placeFolded = place !== undefined && open !== 'place';
  const mbtiFolded = (!!mbti || skipMbti) && open !== 'mbti';
  const timeValue = timeMode === 'unknown' ? '몰라요'
    : timeMode === 'exact' ? fmtTime(exact)
      : sijin !== null ? sijinLabel(sijin, jasi) : '';
  const pickSijin = (b: number) => { setTimeMode('sijin'); setSijin(b); if (b !== 0) { setJasi(null); setOpen(null); } };

  const sections = [
    // 0 이름
    <View key="name">
      {stage >= 1 ? <Text style={s.label}>이름</Text> : null}
      <TextField variant="profile" value={nickname} onChangeText={setNickname} placeholder="이름을 입력해주세요" maxLength={12} autoFocus={!editing} returnKeyType="next"
        onSubmitEditing={() => stage === 0 && nameOk && next()} />
    </View>,

    // 1 생년월일
    <Reveal key="birth" reduced={reduced}>
      <BirthDateField variant="profile" label={<Text style={[s.label, { marginBottom: 0 }]}>생년월일</Text>} digits={birth} onChange={setBirth}
        calendar={calendar} onCalendar={setCalendar} leap={leap} onLeap={setLeap} autoFocus={!editing} />
    </Reveal>,

    // 2 태어난 시간
    <Reveal key="time" reduced={reduced}>
      {timeFolded ? <Summary label="태어난 시간" value={timeValue} onPress={() => setOpen('time')} /> : (
        <>
          <Text style={s.label}>태어난 시간</Text>
          <SijinGrid sijin={timeMode === 'sijin' ? sijin : null} jasi={jasi} onPick={pickSijin} onJasi={side => { setJasi(side); setOpen(null); }} />
          <View style={[s.row, { marginTop: 8 }]}>
            <OptionChip compact style={{ flex: 1 }} label="몰라요" selected={timeMode === 'unknown'} onPress={() => { setTimeMode('unknown'); setOpen(null); }} />
            <OptionChip compact style={{ flex: 1 }} label="정확한 시각 입력" selected={timeMode === 'exact'}
              onPress={() => { if (timeMode === 'exact' && validExact(exact)) setOpen(null); else setTimeMode('exact'); }} />
          </View>
          {timeMode === 'exact' ? (
            <View style={{ marginTop: 8 }}>
              <TextField value={fmtTime(exact)} placeholder="14:30" keyboardType="number-pad" maxLength={5} autoFocus invalid={exact.length === 4 && !validExact(exact)}
                onChangeText={t => {
                  const v = t.replace(/\D/g, '').slice(0, 4);
                  setExact(v);
                  if (validExact(v)) { Keyboard.dismiss(); setOpen(null); }
                }} />
              <Text style={[txt.caption, { marginTop: 6 }]}>24시간 기준이에요. 오후 2시 30분은 14:30.</Text>
            </View>
          ) : null}
        </>
      )}
    </Reveal>,

    // 3 태어난 곳
    <Reveal key="place" reduced={reduced}>
      {placeFolded ? (
        <Summary label="태어난 곳" value={place ? placeLabel(place) : '몰라요 · 서울로 볼게요'} onPress={() => setOpen('place')} />
      ) : (
        <>
          <Text style={s.label}>태어난 곳</Text>
          <BirthPlaceSearch selected={place} onPick={p => { Keyboard.dismiss(); setPlace(p); setOpen(null); }} />
        </>
      )}
    </Reveal>,

    // 4 성별
    <Reveal key="gender" reduced={reduced}>
      <Text style={s.label}>성별</Text>
      <View style={s.row}>
        <OptionChip variant="profile" style={{ flex: 1 }} label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
        <OptionChip variant="profile" style={{ flex: 1 }} label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
      </View>
    </Reveal>,

    // 5 혈액형
    <Reveal key="blood" reduced={reduced}>
      <Text style={s.label}>혈액형</Text>
      <View style={s.row}>
        {(['A', 'B', 'O', 'AB'] as BloodType[]).map(b => (
          <OptionChip key={b} variant="profile" style={{ flex: 1 }} label={`${b}형`} selected={blood === b} onPress={() => setBlood(b)} />
        ))}
      </View>
    </Reveal>,

    // 6 MBTI
    <Reveal key="mbti" reduced={reduced}>
      {mbtiFolded ? (
        <Summary label="MBTI" value={skipMbti ? '모름 · 사주로 추정해요' : `${mbti} · ${MBTI_INFO[mbti!].nickname}`} onPress={() => setOpen('mbti')} />
      ) : (
        <>
          <Text style={s.label}>MBTI</Text>
          <View style={s.grid}>
            {MBTI_LIST.map(t => (
              <OptionChip key={t} style={s.mbtiCell} label={t} sub={MBTI_INFO[t].nickname} selected={mbti === t} onPress={() => { setMbti(t); setSkipMbti(false); setOpen(null); }} />
            ))}
          </View>
          <PressableScale onPress={() => setQuizOpen(true)} style={s.quizBtn} scaleTo={0.97}>
            <Text style={s.quizBtnText}>MBTI를 몰라요 · 4문항으로 찾기</Text>
          </PressableScale>
          <PressableScale onPress={() => { setSkipMbti(true); setMbti(null); setOpen(null); }} style={[s.mbtiSkip, skipMbti && s.skipOn]} scaleTo={0.97} accessibilityState={{ selected: skipMbti }}>
            <Text style={[s.skipText, skipMbti && { color: colors.white }]}>{skipMbti ? '✓ ' : ''}잘 모르겠어요 · 나중에 할게요</Text>
          </PressableScale>
          <Text style={[txt.caption, { marginTop: 8 }]}>모르면 사주로 비슷한 성향을 추정해 두고 &quot;(추정)&quot;으로 표시해요. 마이 탭에서 언제든 바꿀 수 있어요.</Text>
        </>
      )}
    </Reveal>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.top}>
            {Platform.OS === 'web' && !editing ? (
              <PressableScale onPress={returnToLanding} style={s.brand} scaleTo={0.94} accessibilityRole="link" accessibilityLabel="운픽 랜딩페이지로 돌아가기">
                <BrandMark />
              </PressableScale>
            ) : <View style={s.brand}><BrandMark /></View>}
            {editing ? (
              <PressableScale onPress={cancelProfileEdit} hitSlop={10} scaleTo={0.94} accessibilityLabel="수정 그만두기"><Text style={s.skip}>닫기</Text></PressableScale>
            ) : account ? (
              // 이미 계정이 있으면(앱을 다시 설치한 경우 등) 로그인해서 프로필·포인트를 되찾는다.
              // 로그인한 상태라면 다른 계정으로 바꿀 수 있게 로그아웃
              <PressableScale onPress={() => signOut()} hitSlop={10} scaleTo={0.94} accessibilityLabel="다른 계정으로 로그인"><Text style={s.skip}>로그아웃</Text></PressableScale>
            ) : (
              <PressableScale onPress={() => router.push('/login')} hitSlop={10} scaleTo={0.94} accessibilityLabel="이미 계정이 있어요, 로그인"><Text style={s.skip}>로그인</Text></PressableScale>
            )}
          </View>
          <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {inviter ? (
              <View style={s.invite}>
                <Text style={s.inviteText}>{inviter}님과의 궁합을 보려면 내 정보를 넣어 주세요. 다 넣으면 바로 결과가 나와요.</Text>
              </View>
            ) : null}
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            {hint ? <Text style={s.hint}>{hint}</Text> : null}
            <View style={s.progress}>
              <Animated.View style={[s.progressBar, { width: barW }]}>
                <LinearGradient colors={gradients.border} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>

            {/* 새 질문이 위에 쌓이도록 열린 것만 거꾸로 */}
            <View style={{ gap: 24 }}>
              {sections.slice(0, stage + 1).reverse()}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(24, insets.bottom) }}>
            {saveError ? <Text style={[s.error, { marginBottom: 10, textAlign: 'center' }]}>{saveError}</Text> : null}
            <PrimaryButton size="medium" label={allDone ? (editing ? '저장하기' : inviter ? '궁합 보기' : '내 운세 보러 가기') : '다음'} onPress={next} disabled={!allDone && !curAnswered} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {quizOpen ? (
        <SafeAreaView style={[StyleSheet.absoluteFill, { backgroundColor: colors.cream }]}>
          <MbtiQuiz onClose={() => setQuizOpen(false)} onDone={t => { setMbti(t); setSkipMbti(false); setOpen(null); setQuizOpen(false); }} />
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  top: { height: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  brand: { height: 41, justifyContent: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skip: profileType(13, '400', 16, -0.65, colors.inkMute),
  title: profileType(18, '800', 21, -0.72),
  hint: { ...profileType(13, '400', 16, -0.65), marginTop: 12 },
  invite: { marginBottom: 20, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.card },
  inviteText: { fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 19 },
  progress: { height: 6, borderRadius: 30, backgroundColor: profileLine, marginVertical: 24, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 30, overflow: 'hidden' },
  label: { ...profileType(14, '600', 17, -0.56, colors.ink), marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mbtiCell: { width: '23%' },
  summary: { flexDirection: 'row', alignItems: 'center', minHeight: 40, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: profileLine, gap: 12 },
  summaryLabel: { ...profileType(13, '500', 18.2), flexShrink: 0 },
  summaryValue: { ...profileType(13, '700', 18.2), flex: 1, textAlign: 'right' },
  change: profileType(13, '700', 18.2, 0, colors.accent),
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  mbtiSkip: { marginTop: 10, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  skipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  skipText: { fontSize: 14, fontWeight: '600', color: colors.inkSub },
  quizBtn: { marginTop: 16, height: 48, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  quizBtnText: { fontSize: 14, fontWeight: '600', color: colors.purple },
});
