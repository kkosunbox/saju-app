import React, { useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileRelationship, RELATIONSHIP_LABEL, User } from '../../types';
import { inputOf, ProfileInput } from '../../services/server/profileApi';
import { ApiError } from '../../api/client';
import { placeLabel } from '../../services/server/birthPlaceApi';
import { MBTI_INFO, MBTI_LIST } from '../../data/mbtiData';
import { BirthDateField, CalendarType, JasiSide, SijinGrid, checkBirth, fmtTime, sijinLabel, sijinOf, sijinTime } from '../BirthFields';
import BirthPlaceSearch from '../BirthPlaceSearch';
import FigmaAsset from './FigmaAsset';
import { LinearGradient } from 'expo-linear-gradient';
import { profileLine, profileType } from '../../theme/profileDesign';
import MbtiQuiz from '../MbtiQuiz';
import OptionChip from '../OptionChip';
import PressableScale from '../PressableScale';
import PrimaryButton from '../PrimaryButton';
import TextField from '../TextField';
import { colors, gradients } from '../../theme/colors';
import { txt } from '../../theme/typography';

type EditField = 'mbti' | 'time' | 'place';
type TimeMode = 'unknown' | 'sijin' | 'exact';
const validTime = (value: string) => /^\d{4}$/.test(value) && Number(value.slice(0, 2)) < 24 && Number(value.slice(2)) < 60;

function ChangeField({ label, value, onPress, expanded }: { label: string; value: string; onPress(): void; expanded: boolean }) {
  return (
    <PressableScale style={s.summary} onPress={onPress} scaleTo={0.98} accessibilityLabel={`${label} ${value}, 변경`} accessibilityState={{ expanded }}>
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.change}>{expanded ? '접기' : '변경'}</Text>
    </PressableScale>
  );
}

export interface ProfileFormProps {
  /** 고칠 프로필 (새로 만들 때는 없음 — 빈 칸으로 시작) */
  initial?: User | null;
  /** 새로 만들 때 이름 칸 기본값 */
  initialNickname?: string;
  title: string;
  hint: string;
  submitLabel?: string;
  /** 관계를 고르게 할지 (내 프로필 목록에 추가 · 수정할 때) */
  relationship?: ProfileRelationship;
  /** 관계 고르기에서 뺄 값 (예: 다른 사람 프로필에서 '나') */
  hideRelationships?: ProfileRelationship[];
  onSubmit(input: ProfileInput): Promise<void>;
  onClose(): void;
  /** 입력 칸 위에 덧붙이는 내용 (링크로 물어보기 등) */
  header?: React.ReactNode;
  /** 맨 아래 덧붙이는 내용 (지우기 · 대표 프로필로 정하기 등) */
  footer?: React.ReactNode;
}

const RELATIONSHIPS: ProfileRelationship[] = ['self', 'lover', 'spouse', 'parent', 'child', 'sibling', 'friend', 'work', 'other'];

/** 프로필 입력 · 수정 폼 — 내 프로필 수정, 프로필 추가, 요청 링크로 받은 사람의 입력이 함께 쓴다 */
export default function ProfileForm({ initial, initialNickname, title, hint, submitLabel = '저장하기', relationship: initialRelationship, hideRelationships = [], onSubmit, onClose, header, footer }: ProfileFormProps) {
  const user = initial ?? null;
  const [relationship, setRelationship] = useState<ProfileRelationship | undefined>(initialRelationship);
  const [nickname, setNickname] = useState(user?.nickname ?? initialNickname ?? '');
  const [gender, setGender] = useState<User['gender']>(user?.gender ?? 'female');
  const [mbti, setMbti] = useState(user ? (user.mbtiUnknown ? null : user.mbti) : null);
  const [calendar, setCalendar] = useState<CalendarType>(user?.calendarType ?? 'solar');
  const [leap, setLeap] = useState(!!user?.isLeapMonth);
  const [birth, setBirth] = useState((user?.birthDateInput ?? user?.birthDate ?? '').replace(/\D/g, ''));
  const chip = user?.birthTime ? sijinOf(user.birthTime) : null;
  const [timeMode, setTimeMode] = useState<TimeMode>(!user?.birthTime ? 'unknown' : chip ? 'sijin' : 'exact');
  const [sijin, setSijin] = useState<number | null>(chip?.sijin ?? null);
  const [jasi, setJasi] = useState<JasiSide | null>(chip?.jasi ?? null);
  const [exact, setExact] = useState(user?.birthTime?.replace(':', '') ?? '');
  const [place, setPlace] = useState(user?.birthPlace ?? null);
  const [open, setOpen] = useState<EditField | null>(null);
  const [quiz, setQuiz] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const date = checkBirth(birth, calendar);
  const timeOk = timeMode === 'unknown' || (timeMode === 'exact' ? validTime(exact) : sijin !== null && (sijin !== 0 || !!jasi));
  const valid = !!nickname.trim() && date.ok && timeOk;
  const completion = [!!nickname.trim(), date.ok, timeOk].filter(Boolean).length / 3;
  const timeValue = timeMode === 'unknown' ? '모름' : timeMode === 'exact' ? fmtTime(exact) || '시간을 입력해 주세요' : sijin !== null ? sijinLabel(sijin, jasi) : '시간을 골라 주세요';
  const toggle = (field: EditField) => setOpen(current => current === field ? null : field);
  const close = () => { if (!savingRef.current) onClose(); };

  const save = async () => {
    if (!valid || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    Keyboard.dismiss();
    const input: ProfileInput = {
      ...(user ? inputOf(user) : {}),
      ...(relationship ? { relationship } : {}),
      nickname: nickname.trim(), gender, mbti,
      calendarType: calendar, birthDate: date.iso, isLeapMonth: calendar === 'lunar' && leap,
      birthTime: timeMode === 'unknown' ? null : timeMode === 'exact' ? fmtTime(exact) : sijinTime(sijin!, jasi),
      birthPlaceId: place?.id ?? null,
    };
    try {
      await onSubmit(input);
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : '';
      setError(code === 'INVALID_BIRTH_DATE' ? '없는 날짜예요. 음력이면 윤달 여부도 확인해 주세요.'
        : code === 'INVALID_BIRTH_PLACE' ? '태어난 지역을 다시 골라 주세요.'
          : '저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.screen} behavior="padding">
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.heading}>
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            <PressableScale onPress={close} disabled={saving} hitSlop={10} style={s.close} accessibilityLabel="닫기"><FigmaAsset name="close" /></PressableScale>
          </View>
          <Text style={s.hint}>{hint}</Text>
          <View style={s.progress}><LinearGradient colors={gradients.border} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.progressFill, { width: `${completion * 100}%` }]} /></View>
          {header}
          <View pointerEvents={saving ? 'none' : 'auto'} style={s.fields}>
            {initialRelationship ? (
              <View>
                <Text style={s.label}>나와의 관계</Text>
                <View style={s.grid}>
                  {RELATIONSHIPS.filter(r => !hideRelationships.includes(r) || r === relationship).map(r => (
                    <OptionChip key={r} compact style={s.relation} label={RELATIONSHIP_LABEL[r]} selected={relationship === r} onPress={() => setRelationship(r)} />
                  ))}
                </View>
              </View>
            ) : null}
            <View>
              <Text style={s.label}>이름</Text>
              <TextField variant="profile" accessibilityLabel="이름 또는 닉네임" value={nickname} onChangeText={setNickname} maxLength={12} placeholder="이름 또는 닉네임" />
            </View>
            <View>
              <Text style={s.label}>성별</Text>
              <View style={s.row}>
                <OptionChip variant="profile" style={s.choice} label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
                <OptionChip variant="profile" style={s.choice} label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
              </View>
            </View>
            <View>
              <Text style={s.label}>MBTI (선택)</Text>
              <ChangeField label="MBTI" value={mbti ? `${mbti} · ${MBTI_INFO[mbti].nickname}` : '모름 · 사주로 추정해요'} onPress={() => toggle('mbti')} expanded={open === 'mbti'} />
              {open === 'mbti' && <View style={s.expanded}>
                <View style={s.grid}>{MBTI_LIST.map(type => <OptionChip key={type} style={s.mbti} label={type} sub={MBTI_INFO[type].nickname} selected={mbti === type} onPress={() => { setMbti(type); setOpen(null); }} />)}</View>
                <PrimaryButton label="MBTI를 몰라요 · 4문항으로 찾기" variant="soft" onPress={() => setQuiz(true)} />
                <PrimaryButton label="잘 모르겠어요 · 사주로 추정" variant="text" onPress={() => { setMbti(null); setOpen(null); }} />
              </View>}
            </View>
            <View>
              <BirthDateField variant="profile" label={<Text style={[s.label, { marginBottom: 0 }]}>생년월일</Text>} digits={birth} onChange={setBirth} calendar={calendar} onCalendar={setCalendar} leap={leap} onLeap={setLeap} />
            </View>
            <View>
              <Text style={s.label}>태어난 시간 (선택)</Text>
              <ChangeField label="태어난 시간" value={timeValue} onPress={() => toggle('time')} expanded={open === 'time'} />
              {open === 'time' && <View style={s.expanded}>
                <SijinGrid sijin={timeMode === 'sijin' ? sijin : null} jasi={jasi} onPick={value => { setTimeMode('sijin'); setSijin(value); if (value !== 0) { setJasi(null); setOpen(null); } }} onJasi={value => { setJasi(value); setOpen(null); }} />
                <View style={s.row}>
                  <OptionChip compact style={s.choice} label="몰라요" selected={timeMode === 'unknown'} onPress={() => { setTimeMode('unknown'); setOpen(null); }} />
                  <OptionChip compact style={s.choice} label="정확한 시각 입력" selected={timeMode === 'exact'} onPress={() => setTimeMode('exact')} />
                </View>
                {timeMode === 'exact' && <>
                  <TextField accessibilityLabel="출생시간 직접 입력" value={fmtTime(exact)} placeholder="14:30" keyboardType="number-pad" maxLength={5} invalid={exact.length === 4 && !validTime(exact)} onChangeText={value => {
                    const digits = value.replace(/\D/g, '').slice(0, 4);
                    setExact(digits);
                    if (validTime(digits)) { Keyboard.dismiss(); setOpen(null); }
                  }} />
                  <Text style={txt.caption}>24시간 기준이에요. 오후 2시 30분은 14:30.</Text>
                </>}
              </View>}
            </View>
            <View>
              <Text style={s.label}>태어난 지역 (선택)</Text>
              <ChangeField label="태어난 지역" value={place ? placeLabel(place) : '몰라요 · 서울로 볼게요'} onPress={() => toggle('place')} expanded={open === 'place'} />
              {open === 'place' && <View style={s.expanded}><BirthPlaceSearch selected={place} onPick={value => { setPlace(value); setOpen(null); Keyboard.dismiss(); }} /></View>}
            </View>
          </View>
          {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
          <PrimaryButton size="medium" label={saving ? '저장 중이에요' : submitLabel} onPress={save} disabled={!valid || saving} style={{ marginTop: 29 }} />
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
      {quiz && <SafeAreaView style={s.quiz}><MbtiQuiz onClose={() => setQuiz(false)} onDone={type => { setMbti(type); setQuiz(false); setOpen(null); }} /></SafeAreaView>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  heading: { height: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { ...profileType(18, '800', 21), flex: 1, marginTop: 1 },
  hint: { ...profileType(13, '400', 16, -0.65), marginTop: 11 },
  close: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 6, borderRadius: 30, backgroundColor: profileLine, marginTop: 24, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 30 },
  fields: { gap: 24 },
  label: { ...profileType(14, '600', 17, -0.56, colors.ink), marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  choice: { flex: 1 },
  summary: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: profileLine, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9 },
  summaryValue: { ...profileType(13, '500', 18.2), flex: 1 },
  change: profileType(13, '600', 18.2, 0, colors.purpleSoft),
  expanded: { marginTop: 12, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mbti: { width: '23%' },
  relation: { width: '31%' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 20, marginTop: 24 },
  quiz: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.cream },
});
