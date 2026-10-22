import React, { useCallback, useEffect, useState } from 'react';
import { RouteProp, useFocusEffect, useRoute } from '@/navigation/compat';
import { TabParamList } from '../navigation/types';
import CrushView from '../components/premium/Crush';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import { BirthDateField, CalendarType, JasiSide, SijinGrid, checkBirth, sijinLabel, sijinTime } from '../components/BirthFields';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import ScoreRing from '../components/ScoreRing';
import ScoreBar from '../components/ScoreBar';
import SectionHeader from '../components/SectionHeader';
import Icon from '../components/Icon';
import Mascot from '../components/Mascot';
import Seal from '../components/Seal';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { BodyState, PriceCard } from '../components/premium/Kit';
import CompatDeep from '../components/premium/CompatDeep';
import { ITEMS } from '../services/premium/catalog';
import { usePremiumContent, useReading } from '../services/server/premiumApi';
import { CompatReading, CrushReading } from '../types/reading';
import { CrushReport, DeepCompatibility } from '../types/premium';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../api/query';
import BottomSheet from '../components/BottomSheet';
import { ApiError } from '../api/client';
import { BloodType, CompatibilityResult, Gender, MBTI, PartnerInput, Relationship, User } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { RELATIONSHIPS, RELATIONSHIP_INFO } from '../data/relationships';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt } from '../theme/typography';
import ShareCta from '../components/ShareCta';
import { compatSpec, crushSpec } from '../services/share/shareSpecs';
import { shareInvite } from '../services/share/linkShare';

const BARS: { k: 'love' | 'personality' | 'conversation' | 'money'; c: string; e: string }[] = [
  { k: 'love', c: colors.love, e: '緣' },
  { k: 'personality', c: colors.purpleSoft, e: '和' },
  { k: 'conversation', c: colors.work, e: '言' },
  { k: 'money', c: colors.money, e: '財' },
];
/** 풀이 카드 색: 띠는 사주에서 나오므로 사주 색 (kind가 없는 예전 결과는 순서대로) */
const POINT_THEME = { saju: 'saju', zodiac: 'saju', mbti: 'mbti', blood: 'blood' } as const;
const POINT_SOURCE = ['saju', 'mbti', 'blood'] as const;
const BLOOD_TYPES: BloodType[] = ['A', 'B', 'O', 'AB'];

/** 아는 것만: "ENFP · A형" / 하나도 모르면 null */
const traitsOf = (p: PartnerInput): string | null => [p.mbti, p.bloodType && `${p.bloodType}형`].filter(Boolean).join(' · ') || null;

function Label({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function Avatar({ name, light }: { name: string; light?: boolean }) {
  return (
    <View style={[s.avatar, light && { backgroundColor: colors.moon }]}>
      <Text style={[s.avatarText, light && { color: colors.purpleDeep }]}>{name.slice(0, 1)}</Text>
    </View>
  );
}

export default function CompatibilityScreen() {
  const { user } = useApp();
  const { toast, owned } = usePremium();
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [calendar, setCalendar] = useState<CalendarType>('solar');
  const [leap, setLeap] = useState(false);
  // 태어난 시간은 선택 — 고르지 않으면 모름
  const [sijin, setSijin] = useState<number | null>(null);
  const [jasi, setJasi] = useState<JasiSide | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showMbti, setShowMbti] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // 저장된 상대 = 궁합 기록 (상대마다 하나, 최근에 본 순)
  const saved = useQuery({ queryKey: [...compatKeys.list, user?.id, user?.version], queryFn: () => compatApi.list(user!.id), enabled: !!user });
  // 내 링크로 상대가 본 궁합이 언제든 들어오니 탭에 올 때마다 새로
  const { refetch } = saved;
  useFocusEffect(useCallback(() => { if (user) refetch(); }, [user, refetch]));

  const sendInvite = async () => {
    if (!user) return;
    const r = await shareInvite(user.nickname);
    if (r === 'copied') toast('초대 링크를 복사했어요. 상대에게 보내 보세요');
    else if (r === 'failed') toast('초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
  };
  const { ok: dateOk, iso: birthISO } = checkBirth(birth, calendar);
  const timeOk = sijin !== 0 || !!jasi;
  // MBTI·혈액형은 모르면 비워 둔다 (궁합에서 빠진다)
  const ok = !!relationship && !!name.trim() && dateOk && !!gender && timeOk;
  // 버튼이 왜 안 눌리는지 — 하나라도 채우기 시작하면 남은 칸을 알려 준다
  const missing = [
    !relationship && '어떤 사이',
    !name.trim() && '이름',
    !dateOk && '생년월일',
    !gender && '성별',
    !timeOk && '자시의 자정 전·후',
  ].filter(Boolean) as string[];
  const started = !!relationship || !!name.trim() || !!birth || !!gender;

  // 생년월일을 다 쓰면 키보드를 내려 아래 칸이 보이게
  useEffect(() => { if (dateOk) Keyboard.dismiss(); }, [dateOk]);

  const [busy, setBusy] = useState(false);
  /** 서버가 계산하고 내 궁합 기록에 저장한다 (상대 정보는 기록을 지우면 함께 삭제). */
  const run = async (partner: PartnerInput & { relationship: Relationship; calendarType: CalendarType; isLeapMonth: boolean }) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      setResult(await compatApi.create(user.id, partner));
      queryClient.invalidateQueries({ queryKey: compatKeys.list });
    } catch (e) {
      toast(e instanceof ApiError && e.code === 'INVALID_BIRTH_DATE' ? '상대의 생년월일을 확인해 주세요' : '궁합을 보지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
  };
  const analyze = () => {
    if (!ok) return;
    run({
      relationship: relationship!,
      nickname: name.trim(),
      calendarType: calendar,
      birthDate: birthISO,
      isLeapMonth: calendar === 'lunar' && leap,
      birthTime: sijin === null ? null : sijinTime(sijin, jasi),
      gender: gender!, mbti, bloodType: blood,
    });
  };

  const removeResult = async () => {
    setConfirmDelete(false);
    if (result?.id == null) return;
    try {
      await compatApi.remove(result.id);
      queryClient.invalidateQueries({ queryKey: compatKeys.list });
      setResult(null);
      toast('상대 정보를 지웠어요');
    } catch {
      toast('지우지 못했어요. 잠시 후 다시 시도해 주세요');
    }
  };

  const { params } = useRoute<RouteProp<TabParamList, 'Compatibility'>>();
  // 친구 초대를 수락하면 서버가 계산한 결과가 바로 넘어온다 (파라미터가 바뀐 렌더에서 바로 반영)
  const [seenResult, setSeenResult] = useState<CompatibilityResult | undefined>();
  if (params?.result !== seenResult) {
    setSeenResult(params?.result);
    if (params?.result) setResult(params.result);
  }
  // 내 링크로 상대가 본 궁합을 열면 '새 결과'를 끈다 (홈 알림·목록의 NEW)
  const newId = result?.isNew ? result.id : undefined;
  useEffect(() => {
    if (newId == null) return;
    compatApi.markSeen(newId).then(() => queryClient.invalidateQueries({ queryKey: compatKeys.list })).catch(() => {});
  }, [newId]);

  if (!user) return null;

  if (result) {
    const rel = RELATIONSHIP_INFO[result.relationship];
    return (
      <Screen largeTitle="우리 둘의 궁합" onBack={() => setResult(null)}>
        <View style={[s.heroWrap, shadow.hero]}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
            <View style={s.pair}>
              <Avatar name={user.nickname} light />
              {result.relationship === 'lover' ? <Icon name="heart" size={18} color="rgba(255,255,255,0.7)" filled /> : <Text style={s.pairRel}>{rel.han}</Text>}
              <Avatar name={result.target.nickname} />
            </View>
            <Text style={s.pairNames}>{user.nickname} · {result.target.nickname} · {rel.label}</Text>
            <View style={{ marginVertical: 16 }}><ScoreRing score={result.total} size={128} label="종합 궁합" /></View>
            <Text style={s.heroSummary}>{result.summary}</Text>
          </LinearGradient>
        </View>

        <SectionHeader title="분야별 궁합" />
        <Card style={{ gap: 18 }}>
          {BARS.map((b, i) => (
            <View key={b.k} style={{ gap: 8 }}>
              <View style={s.barHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Seal ch={b.k === 'love' ? rel.seal : b.e} /><Text style={s.barLabel}>{rel.bars[b.k]}</Text></View>
                <Text style={[s.barScore, { color: b.c }]}>{result[b.k]}</Text>
              </View>
              <ScoreBar value={result[b.k]} color={b.c} height={8} delay={300 + i * 90} />
            </View>
          ))}
        </Card>

        <ShareCta spec={compatSpec(user, result)} />

        <SectionHeader title="관점별 풀이" />
        <View style={{ gap: 10 }}>
          {result.points.map((p, i) => {
            const t = analysisTheme[p.kind ? POINT_THEME[p.kind] : POINT_SOURCE[i] ?? 'saju'];
            return (
              <Card key={p.title} style={s.point}>
                <View style={[s.pointBand, { backgroundColor: t.color }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Seal ch={p.title.slice(0, 1)} color={t.color} /><Text style={[s.pointTitle, { color: t.color }]}>{p.title.slice(2)}</Text></View>
                <Text style={[txt.body, { marginTop: 6 }]}>{p.text}</Text>
              </Card>
            );
          })}
        </View>

        {result.source === 'invite' ? (
          <Text style={[txt.small, { marginTop: 20 }]}>{result.inviteRole === 'inviter' ? '내 링크로 상대가 본 궁합이라' : '초대 링크로 본 궁합이라'} 상대의 생년월일을 몰라요. {result.relationship === 'lover' ? '심층 궁합·속마음은' : '심층 궁합은'} 상대 정보를 직접 넣어 볼 수 있어요.</Text>
        ) : null}

        {result.source !== 'invite' && result.id != null ? (
          <>
            <DeepSection u={user} r={result} id={result.id} />
            {/* 속마음은 연애 리포트라 연인일 때만 */}
            {result.relationship === 'lover' ? <CrushSection u={user} r={result} id={result.id} /> : null}
          </>
        ) : null}

        <PrimaryButton label="다른 사람과 궁합 보기" variant="soft" onPress={() => setResult(null)} style={{ marginTop: 24 }} />
        {result.id != null ? (
          <PressableScale onPress={() => setConfirmDelete(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 16 }}>
            <Text style={s.deleteLink}>{result.target.nickname}님 정보 지우기</Text>
          </PressableScale>
        ) : null}
        <Disclaimer compact />
        <BottomSheet visible={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <Text style={[txt.h2, { textAlign: 'center' }]}>{result.target.nickname}님 정보를 지울까요?</Text>
          <Text style={[txt.small, { textAlign: 'center', marginTop: 8 }]}>상대 정보와 궁합 결과가 바로 지워져요.{'\n'}열어 둔 {result.relationship === 'lover' ? '심층 궁합·속마음도' : '심층 궁합도'} 다시 볼 수 없어요.</Text>
          <PrimaryButton label="지우기" onPress={removeResult} style={{ marginTop: 20 }} />
          <PrimaryButton label="취소" variant="soft" onPress={() => setConfirmDelete(false)} style={{ marginTop: 8 }} />
        </BottomSheet>
      </Screen>
    );
  }

  return (
    <Screen
      largeTitle="궁합"
      subtitle="상대의 정보로 네 가지 관점의 궁합을 봐요"
      footer={(
        <>
          {started && missing.length ? <Text style={[txt.caption, { textAlign: 'center', marginBottom: 8 }]}>남은 칸 · {missing.join(', ')}</Text> : null}
          <PrimaryButton label={busy ? '궁합 보는 중…' : '궁합 보기'} onPress={analyze} disabled={!ok || busy} />
        </>
      )}
    >
      {/* 두 사람 — 나 · 마스코트 · 아직 비어 있는 상대 */}
      <View style={s.pairSheet}>
        <View style={s.pairCol}>
          <View style={[s.pairSeal, { backgroundColor: colors.accent }]}><Text style={s.pairSealText}>{user.nickname.slice(0, 1)}</Text></View>
          <Text style={s.pairName}>{user.nickname}</Text>
          <Text style={txt.caption}>{user.mbti} · {user.bloodType}형</Text>
        </View>
        <View style={s.pairMid}>
          <Mascot name="friends" size={30} />
        </View>
        <View style={s.pairCol}>
          <View style={[s.pairSeal, s.pairEmpty]}><Text style={[s.pairSealText, { color: colors.inkMute }]}>{name.trim() ? name.trim().slice(0, 1) : '?'}</Text></View>
          <Text style={s.pairName}>{name.trim() || '그 사람'}</Text>
          <Text style={txt.caption}>{relationship ? RELATIONSHIP_INFO[relationship].label : '정보를 채워 주세요'}</Text>
        </View>
      </View>
      <PressableScale onPress={sendInvite} style={s.inviteRow} scaleTo={0.98} accessibilityLabel="상대에게 링크로 궁합 신청 받기">
        <View style={s.inviteIco}><Icon name="send" size={18} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>생일을 모른다면, 링크로 신청받기</Text>
          <Text style={txt.caption}>상대가 링크를 열면 둘의 궁합이 여기로 와요</Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.inkMute} />
      </PressableScale>

      {saved.data?.length ? (
        <>
          <Text style={s.savedHead}>저장된 상대</Text>
          <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
            {saved.data.map((r, i) => (
              <PressableScale key={r.id} onPress={() => setResult(r)} style={[s.savedRow, i > 0 && s.savedLine]} scaleTo={0.98} accessibilityLabel={`${r.target.nickname}님과 궁합 다시 보기`}>
                <View style={s.savedSeal}><Text style={s.savedSealText}>{r.target.nickname.slice(0, 1)}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{r.target.nickname}</Text>
                    {r.isNew ? <Text style={s.newBadge}>NEW</Text> : null}
                  </View>
                  <Text style={txt.caption}>
                    {RELATIONSHIP_INFO[r.relationship].label}
                    {r.inviteRole === 'inviter' ? ' · 내 링크로 본 궁합' : r.source === 'invite' ? ' · 초대 링크로 본 궁합' : traitsOf(r.target) ? ` · ${traitsOf(r.target)}` : ''}
                    {r.id != null && owned(`compat:${r.id}`) ? ' · 심층 궁합' : ''}
                    {r.id != null && owned(`crush:${r.id}`) ? ' · 속마음' : ''}
                  </Text>
                </View>
                <Text style={s.savedScore}>{r.total}</Text>
                <Icon name="chevronRight" size={16} color={colors.inkMute} />
              </PressableScale>
            ))}
          </Card>
          <Text style={s.savedHead}>새 상대와 궁합 보기</Text>
        </>
      ) : null}
      <Card style={s.form}>

        <View>
          <Label>어떤 사이인가요?</Label>
          <View style={s.grid}>
            {RELATIONSHIPS.map(x => (
              <OptionChip key={x.k} compact style={s.relCell} label={x.l} sub={x.hint} selected={relationship === x.k} onPress={() => setRelationship(x.k)} />
            ))}
          </View>
        </View>

        <View>
          <Label>상대 이름</Label>
          <TextField value={name} onChangeText={setName} placeholder="이름 또는 닉네임" maxLength={12} />
        </View>

        <View>
          <BirthDateField label={<Text style={[s.fieldLabel, { marginBottom: 0 }]}>생년월일</Text>} digits={birth} onChange={setBirth}
            calendar={calendar} onCalendar={setCalendar} leap={leap} onLeap={setLeap} />
        </View>

        <View>
          <Label>태어난 시간 (선택)</Label>
          <PressableScale onPress={() => setShowTime(v => !v)} style={[s.select, showTime && { borderColor: colors.purple }]} scaleTo={0.98} accessibilityLabel="태어난 시간 고르기">
            <Text style={[s.selectText, sijin === null && { color: colors.inkMute }]}>{sijin === null ? '모르면 비워 두세요' : sijinLabel(sijin, jasi)}</Text>
            <View style={{ transform: [{ rotate: showTime ? '-90deg' : '90deg' }] }}><Icon name="chevronRight" size={18} color={colors.inkMute} /></View>
          </PressableScale>
          {showTime && (
            <View style={{ marginTop: 8, gap: 8 }}>
              <SijinGrid sijin={sijin} jasi={jasi}
                onPick={b => { setSijin(b); if (b !== 0) { setJasi(null); setShowTime(false); } }}
                onJasi={side => { setJasi(side); setShowTime(false); }} />
              <OptionChip compact label="몰라요" selected={sijin === null} onPress={() => { setSijin(null); setJasi(null); setShowTime(false); }} />
            </View>
          )}
        </View>

        <View>
          <Label>성별</Label>
          <View style={s.row}>
            <OptionChip style={{ flex: 1 }} compact label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
            <OptionChip style={{ flex: 1 }} compact label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
          </View>
        </View>

        <View>
          <Label>MBTI (선택)</Label>
          <PressableScale onPress={() => setShowMbti(v => !v)} style={[s.select, showMbti && { borderColor: colors.purple }]} scaleTo={0.98}>
            <Text style={[s.selectText, !mbti && { color: colors.inkMute }]}>{mbti ? `${mbti} · ${MBTI_INFO[mbti].nickname}` : '모르면 비워 두세요'}</Text>
            <View style={{ transform: [{ rotate: showMbti ? '-90deg' : '90deg' }] }}><Icon name="chevronRight" size={18} color={colors.inkMute} /></View>
          </PressableScale>
          {showMbti && (
            <View style={[s.grid, { marginTop: 8 }]}>
              {MBTI_LIST.map(t => (
                <OptionChip key={t} compact style={s.mbtiCell} label={t} sub={MBTI_INFO[t].nickname} selected={mbti === t} onPress={() => { setMbti(t); setShowMbti(false); }} />
              ))}
              <OptionChip compact style={{ width: '100%' }} label="몰라요" selected={!mbti} onPress={() => { setMbti(null); setShowMbti(false); }} />
            </View>
          )}
        </View>

        <View>
          <Label>혈액형 (선택)</Label>
          <View style={s.row}>
            {BLOOD_TYPES.map(b => <OptionChip key={b} style={{ flex: 1 }} compact label={`${b}형`} selected={blood === b} onPress={() => setBlood(blood === b ? null : b)} />)}
            <OptionChip style={{ flex: 1 }} compact label="몰라요" selected={!blood} onPress={() => setBlood(null)} />
          </View>
        </View>
        {!mbti || !blood ? <Text style={[txt.caption, { marginTop: -8 }]}>모르는 정보는 빼고 사주로 봐요.</Text> : null}
      </Card>
      <Disclaimer compact />
    </Screen>
  );
}

/** 심층 궁합: 열기 전엔 가격 카드, 열면 서버가 계산한 두 사람 비교 */
function DeepSection({ u, r, id }: { u: User; r: CompatibilityResult; id: number }) {
  const item = ITEMS.compat(id, r.target.nickname, r.relationship, !!r.target.mbti);
  const content = usePremiumContent<DeepCompatibility>({ kind: 'compat', id });
  const { reading, retry } = useReading<CompatReading>(content);
  if (!content.open) return <PriceCard item={item} />;
  return (
    <>
      <SectionHeader title="심층 궁합 리포트" caption="두 사람의 네 가지 관점을 하나로 엮은 풀이" />
      {content.data ? <CompatDeep u={u} r={r} D={content.data.data} reading={reading} onRetry={retry} /> : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
    </>
  );
}

/** 그 사람의 속마음 */
function CrushSection({ u, r, id }: { u: User; r: CompatibilityResult; id: number }) {
  const item = ITEMS.crush(id, r.target.nickname);
  const content = usePremiumContent<CrushReport>({ kind: 'crush', id });
  const { reading, retry } = useReading<CrushReading>(content);
  if (!content.open) return <PriceCard item={item} />;
  if (!content.data) return <BodyState error={content.isError} onRetry={() => content.refetch()} />;
  return (
    <>
      <CrushView r={r} R={content.data.data} reading={reading} onRetry={retry} />
      <ShareCta spec={crushSpec(u, r, content.data.data)} />
    </>
  );
}

const s = StyleSheet.create({
  savedHead: { fontSize: 13, fontWeight: '700', color: colors.inkSub, marginTop: 20, marginBottom: 8 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  savedLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  savedSeal: { width: 34, height: 34, borderRadius: 6, backgroundColor: colors.lavenderSoft, alignItems: 'center', justifyContent: 'center' },
  savedSealText: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: colors.purple },
  newBadge: { fontSize: 10, fontWeight: '800', color: colors.white, backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' },
  savedScore: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.love },
  deleteLink: { fontSize: 13, fontWeight: '600', color: colors.inkMute, textDecorationLine: 'underline' },
  pairSheet: { flexDirection: 'row', alignItems: 'center', marginTop: 4, padding: 18, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  pairCol: { flex: 1, alignItems: 'center', gap: 4 },
  pairSeal: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  pairEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: colors.cream },
  pairSealText: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.white },
  pairName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 6 },
  pairMid: { width: 64, alignItems: 'center', marginBottom: 34 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card },
  inviteIco: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 20, padding: 20 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.inkSub, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mbtiCell: { flexGrow: 1, flexBasis: '22%' },
  relCell: { width: '48.9%' },
  select: { height: 52, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 17, fontWeight: '500', color: colors.ink },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { fontFamily: fonts.serif, color: colors.white, fontWeight: '600', fontSize: 16 },
  heroWrap: { borderRadius: radius.xl, backgroundColor: colors.heroBg },
  hero: { borderRadius: radius.xl, padding: 24, alignItems: 'center' },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pairRel: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  pairNames: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 8 },
  heroSummary: { fontFamily: fonts.serif, color: colors.white, fontSize: 18, fontWeight: '600', letterSpacing: -0.4, textAlign: 'center' },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  barScore: { fontFamily: fonts.serif, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  point: { paddingLeft: 24 },
  pointBand: { position: 'absolute', left: 10, top: 18, bottom: 18, width: 3, borderRadius: 2 },
  pointTitle: { fontSize: 13, fontWeight: '800' },
});
