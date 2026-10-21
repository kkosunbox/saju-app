import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
import { BloodType, Gender, MBTI } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { formatKoreanDate, isValidDate } from '../utils/date';
import { motion, useReducedMotion } from '../utils/motion';
import { ApiError } from '../api/client';
import { ProfileInput } from '../services/server/profileApi';

/**
 * 한 화면에 질문이 차례로 쌓인다: 이름 → 생년월일 → 태어난 시간 → 성별 → 혈액형 → MBTI (직업·관심사는 마이에서 나중에).
 * 새 질문이 맨 위에 나타나고, 앞에서 한 답은 아래에 남아 바로 고칠 수 있다.
 * 칸이 큰 질문(시간·MBTI)은 답하면 한 줄로 접히고, 누르면 다시 펼쳐진다.
 */
const QUESTIONS = [
  { q: () => '어떻게 불러드릴까요?', hint: '운세에서 불러드릴 이름이에요.' },
  { q: (name: string) => `${name}님, 언제 태어났나요?`, hint: '8자리 숫자를 입력해 주세요.' },
  { q: () => '몇 시쯤 태어났나요?', hint: '2시간 단위로 골라요. 몰라도 괜찮아요.' },
  { q: () => '성별을 알려주세요', hint: '' },
  { q: () => '혈액형은요?', hint: '' },
  { q: () => 'MBTI를 골라주세요', hint: '몰라도 괜찮아요. 4문항으로 찾거나, 건너뛰어도 돼요.' },
];
const LAST = QUESTIONS.length - 1;

/** MBTI 간이 테스트 — 축마다 한 문항 */
const QUIZ: { q: string; a: [string, string]; axis: [string, string] }[] = [
  { q: '주말에 충전하는 방법은?', a: ['친구들과 밖에서 놀기', '집에서 혼자 쉬기'], axis: ['E', 'I'] },
  { q: '새로운 일을 배울 때 나는?', a: ['순서와 사례부터 익힌다', '큰 그림과 원리부터 본다'], axis: ['S', 'N'] },
  { q: '친구가 고민을 털어놓으면?', a: ['해결책을 같이 찾는다', '먼저 마음을 공감해 준다'], axis: ['T', 'F'] },
  { q: '여행을 떠날 때 나는?', a: ['일정을 미리 짜둔다', '가서 끌리는 대로 다닌다'], axis: ['J', 'P'] },
];

/**
 * 시진 — 서버는 서울 평균태양시(KST −32분)로 시주를 정하니, 시계 기준 경계는 :30.
 * 칩을 고르면 그 시진의 가운데 시각을 보낸다. 자시는 날짜가 갈리므로 자정 전·후를 한 번 더 묻는다.
 */
const SIJIN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'].map((n, b) => {
  const hm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const start = (b * 120 + 1410) % 1440;
  return { label: `${n}시`, range: `${hm(start)}~${hm(start + 120)}`, time: hm(b * 120 + 30) };
});
const JASI_TIME = { before: '23:45', after: '00:30' } as const;

type TimeMode = 'unknown' | 'sijin' | 'exact';

/** 저장된 시각이 칩이 보내는 시각이면 그 칩으로, 아니면 정확한 시각으로 되살린다 */
function restoreTime(t: string | null | undefined): { mode: TimeMode | null; sijin: number | null; jasi: 'before' | 'after' | null; exact: string } {
  if (t === undefined) return { mode: null, sijin: null, jasi: null, exact: '' };
  if (t === null) return { mode: 'unknown', sijin: null, jasi: null, exact: '' };
  if (t === JASI_TIME.before || t === JASI_TIME.after) return { mode: 'sijin', sijin: 0, jasi: t === JASI_TIME.before ? 'before' : 'after', exact: '' };
  const b = SIJIN.findIndex(x => x.time === t);
  if (b > 0) return { mode: 'sijin', sijin: b, jasi: null, exact: '' };
  return { mode: 'exact', sijin: null, jasi: null, exact: t.replace(':', '') };
}

/** 숫자만 받아 "1995. 03. 15" / "14:30" 모양으로 */
const fmtDate = (v: string) => v.slice(0, 4) + (v.length > 4 ? `. ${v.slice(4, 6)}` : '') + (v.length > 6 ? `. ${v.slice(6)}` : '');
const fmtTime = (v: string) => v.slice(0, 2) + (v.length > 2 ? `:${v.slice(2)}` : '');

const LOADING_MSGS = ['오늘의 운을 고르는 중', '사주 원국을 세우는 중', '태어난 요일의 행성을 찾는 중', 'MBTI 성향을 읽는 중', '네 가지 결과를 엮는 중'];

/** 새로 열린 질문이 위에서 살짝 내려오며 나타난다 */
function Reveal({ children, reduced, style }: { children: React.ReactNode; reduced: boolean; style?: StyleProp<ViewStyle> }) {
  const [a] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (!reduced) Animated.timing(a, { toValue: 1, duration: motion.base, easing: motion.easeOut, useNativeDriver: true }).start();
  }, []);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** 답한 질문을 접어 둔 한 줄 — 누르면 다시 펼쳐 고친다 */
function Summary({ label, value, onPress }: { label: string; value: string; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={s.summary} accessibilityLabel={`${label} ${value}, 바꾸기`}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue} numberOfLines={1}>{value}</Text>
      <Text style={s.change}>변경</Text>
    </PressableScale>
  );
}

/** MBTI 4문항 — 이것만 잠깐 따로 띄웠다가 결과를 들고 돌아간다 */
function MbtiQuiz({ onDone, onClose }: { onDone(t: MBTI): void; onClose(): void }) {
  const [ans, setAns] = useState<(0 | 1 | null)[]>([null, null, null, null]);
  const result = ans.every(x => x !== null) ? ans.map((x, k) => QUIZ[k].axis[x!]).join('') as MBTI : null;
  // 결과가 나오면 아래로 내려 보여준다
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { if (result) scroll.current?.scrollToEnd({ animated: true }); }, [result]);
  return (
    <>
      <View style={s.top}>
        <PressableScale onPress={onClose} hitSlop={10} style={s.back} scaleTo={0.9} accessibilityLabel="MBTI 찾기 그만두기">
          <Icon name="chevronLeft" size={24} />
        </PressableScale>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={txt.title}>4문항으로 MBTI 찾기</Text>
        <Text style={[txt.small, { marginTop: 6 }]}>나와 더 가까운 쪽을 골라주세요.</Text>
        <View style={{ gap: 18, marginTop: 28 }}>
          {QUIZ.map((qz, i) => (
            <View key={qz.q}>
              <Text style={s.quizQ}>{i + 1}. {qz.q}</Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {qz.a.map((a, k) => (
                  <OptionChip key={a} compact label={a} selected={ans[i] === k} onPress={() => setAns(prev => prev.map((x, j) => (j === i ? k as 0 | 1 : x)))} />
                ))}
              </View>
            </View>
          ))}
          {result ? (
            <View style={s.result}>
              <Text style={txt.small}>나의 MBTI는</Text>
              <Text style={s.resultType}>{result} · {MBTI_INFO[result].nickname}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <PrimaryButton label="이걸로 할게요" onPress={() => result && onDone(result)} disabled={!result} />
      </View>
    </>
  );
}

export default function ProfileSetupScreen() {
  const { saveUser, signOut, account, user, editingProfile, cancelProfileEdit } = useApp();
  // "다시 입력"으로 들어오면 지금 프로필을 채워 둔다 (생일은 입력했던 달력 기준)
  const editing = editingProfile && !!user;
  const savedTime = restoreTime(editing ? user!.birthTime ?? null : undefined);
  const reduced = useReducedMotion();
  // 몇 번째 질문까지 열렸는지 (수정할 때는 처음부터 다 열린다)
  const [stage, setStage] = useState(editing ? LAST : 0);
  // 접힌 질문 중 다시 펼친 것
  const [open, setOpen] = useState<'time' | 'mbti' | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [nickname, setNickname] = useState(editing ? user!.nickname : '');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(editing ? user!.calendarType ?? 'solar' : 'solar');
  const [leap, setLeap] = useState(editing ? !!user!.isLeapMonth : false);
  const [birth, setBirth] = useState(editing ? (user!.birthDateInput ?? user!.birthDate).replace(/\D/g, '') : '');
  const [timeMode, setTimeMode] = useState<TimeMode | null>(savedTime.mode);
  const [sijin, setSijin] = useState<number | null>(savedTime.sijin);
  const [jasi, setJasi] = useState<'before' | 'after' | null>(savedTime.jasi);
  const [exact, setExact] = useState(savedTime.exact);
  const [gender, setGender] = useState<Gender | null>(editing ? user!.gender : null);
  const [blood, setBlood] = useState<BloodType | null>(editing ? user!.bloodType : null);
  const [mbti, setMbti] = useState<MBTI | null>(editing && !user!.mbtiUnknown ? user!.mbti : null);
  const [skipMbti, setSkipMbti] = useState(editing && !!user!.mbtiUnknown);
  const [saveError, setSaveError] = useState<string | null>(null);

  const nameOk = nickname.trim().length > 0;
  const [y, m, d] = [Number(birth.slice(0, 4)), Number(birth.slice(4, 6)), Number(birth.slice(6, 8))];
  const dateFilled = birth.length === 8;
  // 음력은 날짜 범위만 보고, 실제로 있는 날인지는 서버가 확인한다 (INVALID_BIRTH_DATE)
  const dateOk = dateFilled && (calendar === 'lunar'
    ? y >= 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 30
    : isValidDate(y, m, d));
  const birthISO = `${birth.slice(0, 4)}-${birth.slice(4, 6)}-${birth.slice(6, 8)}`;
  const validExact = (v: string) => v.length === 4 && Number(v.slice(0, 2)) <= 23 && Number(v.slice(2)) <= 59;
  const timeOk = timeMode === 'unknown'
    || (timeMode === 'sijin' && sijin !== null && (sijin !== 0 || !!jasi))
    || (timeMode === 'exact' && validExact(exact));
  const birthTime = timeMode === 'sijin' && sijin !== null
    ? (sijin === 0 ? JASI_TIME[jasi ?? 'after'] : SIJIN[sijin].time)
    : timeMode === 'exact' ? fmtTime(exact) : null;
  const answered = [nameOk, dateOk, timeOk, !!gender, !!blood, !!mbti || skipMbti];
  const allDone = stage === LAST && answered.every(Boolean);
  const curAnswered = answered[stage];

  // 진행 막대는 답한 질문 수만큼 찬다
  const answeredCount = answered.filter(Boolean).length;
  const [progress] = useState(() => new Animated.Value(answeredCount / QUESTIONS.length));
  useEffect(() => {
    Animated.timing(progress, { toValue: answeredCount / QUESTIONS.length, duration: motion.base, easing: motion.easeOut, useNativeDriver: false }).start();
  }, [answeredCount]);

  // 맨 위 질문에 답하면 잠깐 선택을 보여주고 다음 질문을 연다 (이름은 다 썼는지 몰라서 "다음"으로)
  useEffect(() => {
    if (stage < 1 || stage >= LAST || !curAnswered) return;
    const t = setTimeout(() => { Keyboard.dismiss(); setStage(stage + 1); }, stage === 1 ? 450 : 250);
    return () => clearTimeout(t);
  }, [stage, curAnswered]);

  // 새 질문은 맨 위에 생기니 위로 올려 보여준다
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: !reduced }); }, [stage]);

  const finish = async () => {
    setGenerating(true);
    setSaveError(null);
    const input: ProfileInput = {
      nickname: nickname.trim(),
      calendarType: calendar,
      birthDate: birthISO,
      isLeapMonth: calendar === 'lunar' && leap,
      birthTime,
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
          : code === 'PROFILE_EDIT_LIMIT_EXCEEDED' ? '생년월일·시간 같은 정보는 하루 2번까지 바꿀 수 있어요. 내일 다시 시도해 주세요.'
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

  // 시간·MBTI는 답했고 다시 펼치지 않았으면 한 줄로 접는다
  const timeFolded = timeOk && open !== 'time';
  const mbtiFolded = (!!mbti || skipMbti) && open !== 'mbti';
  const timeValue = timeMode === 'unknown' ? '몰라요'
    : timeMode === 'exact' ? fmtTime(exact)
      : sijin === 0 ? `자시 · 자정 ${jasi === 'before' ? '전' : '후'}`
        : sijin !== null ? `${SIJIN[sijin].label} (${SIJIN[sijin].range})` : '';
  const pickSijin = (b: number) => { setTimeMode('sijin'); setSijin(b); if (b !== 0) { setJasi(null); setOpen(null); } };

  const sections = [
    // 0 이름
    <View key="name">
      {stage >= 1 ? <Text style={s.label}>이름</Text> : null}
      <TextField value={nickname} onChangeText={setNickname} placeholder="이름 또는 닉네임" maxLength={12} autoFocus={!editing} returnKeyType="next"
        onSubmitEditing={() => stage === 0 && nameOk && next()} />
    </View>,

    // 1 생년월일
    <Reveal key="birth" reduced={reduced}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <Text style={[s.label, { marginBottom: 0 }]}>생년월일</Text>
        <View style={s.seg} accessibilityRole="radiogroup">
          {(['solar', 'lunar'] as const).map(c => (
            <PressableScale key={c} onPress={() => { setCalendar(c); if (c === 'solar') setLeap(false); }} scaleTo={0.96} style={[s.segItem, calendar === c && s.segOn]}
              accessibilityRole="radio" accessibilityState={{ selected: calendar === c }}>
              <Text style={[s.segText, calendar === c && { color: colors.ink }]}>{c === 'solar' ? '양력' : '음력'}</Text>
            </PressableScale>
          ))}
        </View>
      </View>
      <TextField value={fmtDate(birth)} onChangeText={t => setBirth(t.replace(/\D/g, '').slice(0, 8))} placeholder="1995. 03. 15" keyboardType="number-pad" maxLength={12}
        autoFocus={!editing} style={s.bigInput} invalid={dateFilled && !dateOk} accessibilityLabel={`생년월일 8자리${calendar === 'lunar' ? ', 음력' : ''}`} />
      {dateFilled && !dateOk ? <Text style={s.error}>1900년 이후의 실제 날짜를 입력해 주세요.</Text>
        : dateOk ? <Text style={s.ok}>✓ {calendar === 'solar' ? formatKoreanDate(birthISO) : `음력 ${y}년 ${m}월 ${d}일${leap ? ' (윤달)' : ''}`}</Text>
          : null}
      {calendar === 'lunar' ? (
        <View style={{ marginTop: 8 }}>
          <CheckRow checked={leap} label="윤달이에요" onPress={() => setLeap(!leap)} />
        </View>
      ) : null}
    </Reveal>,

    // 2 태어난 시간
    <Reveal key="time" reduced={reduced}>
      {timeFolded ? <Summary label="태어난 시간" value={timeValue} onPress={() => setOpen('time')} /> : (
        <>
          <Text style={s.label}>태어난 시간</Text>
          <View style={s.grid}>
            {SIJIN.map((x, b) => (
              <OptionChip key={x.label} compact style={s.sijinCell} label={x.label} sub={x.range} selected={timeMode === 'sijin' && sijin === b} onPress={() => pickSijin(b)} />
            ))}
          </View>
          {timeMode === 'sijin' && sijin === 0 ? (
            <>
              <Text style={[txt.caption, { marginTop: 12, marginBottom: 8 }]}>자시는 자정을 사이에 두고 날짜가 바뀌어요. 언제였나요?</Text>
              <View style={s.row}>
                <OptionChip compact style={{ flex: 1 }} label="자정 전" sub="23:30~24:00" selected={jasi === 'before'} onPress={() => { setJasi('before'); setOpen(null); }} />
                <OptionChip compact style={{ flex: 1 }} label="자정 후" sub="00:00~01:30" selected={jasi === 'after'} onPress={() => { setJasi('after'); setOpen(null); }} />
              </View>
            </>
          ) : null}
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

    // 3 성별
    <Reveal key="gender" reduced={reduced}>
      <Text style={s.label}>성별</Text>
      <View style={s.row}>
        <OptionChip style={{ flex: 1 }} label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
        <OptionChip style={{ flex: 1 }} label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
      </View>
    </Reveal>,

    // 4 혈액형
    <Reveal key="blood" reduced={reduced}>
      <Text style={s.label}>혈액형</Text>
      <View style={s.row}>
        {(['A', 'B', 'O', 'AB'] as BloodType[]).map(b => (
          <OptionChip key={b} style={{ flex: 1 }} label={`${b}형`} selected={blood === b} onPress={() => setBlood(b)} />
        ))}
      </View>
    </Reveal>,

    // 5 MBTI
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
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.top}>
            <View style={{ width: 44 }} />
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
          <View style={s.progress}><Animated.View style={[s.progressBar, { width: barW }]} /></View>

          <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Text style={txt.title}>{title}</Text>
            {hint ? <Text style={[txt.small, { marginTop: 6 }]}>{hint}</Text> : null}

            {/* 새 질문이 위에 쌓이도록 열린 것만 거꾸로 */}
            <View style={{ marginTop: 28, gap: 28 }}>
              {sections.slice(0, stage + 1).reverse()}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
            {saveError ? <Text style={[s.error, { marginBottom: 10, textAlign: 'center' }]}>{saveError}</Text> : null}
            <PrimaryButton label={allDone ? (editing ? '저장하기' : '내 운세 보러 가기') : '다음'} onPress={next} disabled={!allDone && !curAnswered} />
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
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { fontSize: 14, color: colors.inkMute, fontWeight: '600', paddingHorizontal: 8 },
  progress: { height: 3, backgroundColor: colors.line, marginHorizontal: 24, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: 3, backgroundColor: colors.navy, borderRadius: 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.inkSub, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mbtiCell: { width: '23%' },
  sijinCell: { flexGrow: 1, flexBasis: '30%' },
  bigInput: { fontSize: 20, letterSpacing: 0.5 },
  ok: { color: colors.success, fontSize: 12, fontWeight: '600', marginTop: 8 },
  seg: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.sm, padding: 3, gap: 2 },
  segItem: { paddingHorizontal: 14, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.lineStrong },
  segText: { fontSize: 13, fontWeight: '600', color: colors.inkMute },
  summary: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.lineStrong, gap: 10 },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  summaryValue: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink, textAlign: 'right' },
  change: { fontSize: 13, fontWeight: '600', color: colors.purpleSoft },
  error: { color: colors.danger, fontSize: 12, marginTop: 8 },
  mbtiSkip: { marginTop: 10, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  skipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  skipText: { fontSize: 14, fontWeight: '600', color: colors.inkSub },
  quizBtn: { marginTop: 16, height: 48, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  quizBtnText: { fontSize: 14, fontWeight: '600', color: colors.purple },
  quizQ: { fontSize: 15, fontWeight: '700', color: colors.ink },
  result: { alignItems: 'center', padding: 16, borderRadius: radius.lg, backgroundColor: colors.lavenderSoft },
  resultType: { fontSize: 20, fontWeight: '700', color: colors.purple, marginTop: 4 },
});
