import React, { useCallback, useEffect, useState } from 'react';
import { RouteProp, useFocusEffect, useRoute } from '@/navigation/compat';
import { TabParamList } from '../navigation/types';
import CrushView from '../components/premium/Crush';
import { ImageBackground, Keyboard, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Screen from '../components/Screen';
import Card from '../components/Card';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import { BirthDateField, CalendarType, JasiSide, SijinGrid, checkBirth, sijinLabel, sijinTime } from '../components/BirthFields';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import ScoreBar from '../components/ScoreBar';
import SectionHeader from '../components/SectionHeader';
import Icon from '../components/Icon';
import Mascot, { ART, Logo } from '../components/Mascot';
import SolidIcon, { RelationIcon, SolidIconName } from '../components/SolidIcon';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { BodyState, LockedCard } from '../components/premium/Kit';
import CompatDeep from '../components/premium/CompatDeep';
import { ITEMS } from '../services/premium/catalog';
import { usePremiumContent, useReading } from '../services/server/premiumApi';
import { CompatReading, CrushReading } from '../types/reading';
import { CrushReport, DeepCompatibility } from '../types/premium';
import { compatApi, compatKeys } from '../services/server/compatApi';
import { placeLabel } from '../services/server/birthPlaceApi';
import BirthPlaceSearch from '../components/BirthPlaceSearch';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../api/query';
import BottomSheet from '../components/BottomSheet';
import { ApiError } from '../api/client';
import { BirthPlace, BloodType, CompatibilityResult, Gender, MBTI, PartnerInput, Relationship, User } from '../types';
import { MBTI_INFO, MBTI_LIST } from '../data/mbtiData';
import { RELATIONSHIPS, RELATIONSHIP_INFO } from '../data/relationships';
import { colors, gradients, isDark } from '../theme/colors';
import { radius, txt } from '../theme/typography';
import ShareCta from '../components/ShareCta';
import { compatSpec, crushSpec } from '../services/share/shareSpecs';
import { useInviteShare } from '../services/share/useInviteShare';

const BARS: { k: 'love' | 'personality' | 'conversation' | 'money'; c: string; icon: SolidIconName }[] = [
  { k: 'love', c: colors.love, icon: 'heart' },
  { k: 'personality', c: '#FCBD51', icon: 'happy' },
  { k: 'conversation', c: colors.purpleSoft, icon: 'chat' },
  { k: 'money', c: '#5FB884', icon: 'coins' },
];
/** 두 사람 카드 바탕 — 옅은 하늘이 가운데서 밝아진다 */
const PAIR_SKY = isDark ? [colors.accentSoft, colors.card, colors.accentSoft] as const : ['#D0EEFE', '#EFF9FF', '#CBECFE'] as const;
const BLOOD_TYPES: BloodType[] = ['A', 'B', 'O', 'AB'];

/** 아는 것만: "ENFP · A형" / 하나도 모르면 null */
const traitsOf = (p: PartnerInput): string | null => [p.mbti, p.bloodType && `${p.bloodType}형`].filter(Boolean).join(' · ') || null;

function Label({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

/** 낮은 선택 버튼 (성별 · 혈액형) — 고르면 남색 */
function Pick({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return (
    <PressableScale onPress={onPress} haptic scaleTo={0.95} style={[s.pick, selected && s.pickOn]} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[s.pickText, selected && { color: '#EDEDED' }]}>{label}</Text>
    </PressableScale>
  );
}

function Avatar({ name, me }: { name: string; me?: boolean }) {
  return (
    <View style={[s.avatar, { backgroundColor: me ? '#FFF386' : '#AAD8FF' }]}>
      <Text style={s.avatarText}>{name.slice(0, 1)}</Text>
    </View>
  );
}

/** 종합 점수 — 하늘색 그라디언트 고리(왼쪽 위가 살짝 열린) 안에 숫자 */
function ScoreHalo({ score }: { score: number }) {
  const size = 78, w = 4, r = (size - w) / 2, c = 2 * Math.PI * r;
  return (
    <View style={s.halo} accessible accessibilityLabel={`종합 궁합 ${score}점`}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="halo" x1="0" y1="0" x2="1" y2="0.1">
            {gradients.border.map((g, i) => <Stop key={g} offset={[0, 0.47, 1][i]} stopColor={g} />)}
          </SvgGradient>
        </Defs>
        {/* 12시에서 시계 방향으로 299° — 10시 방향이 비어 있다 */}
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="url(#halo)" strokeWidth={w} fill="none" strokeLinecap="round"
          strokeDasharray={`${c * (299 / 360)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={s.haloScore}>{score}</Text>
      <Text style={s.haloLabel}>종합 궁합</Text>
    </View>
  );
}

export default function CompatibilityScreen() {
  const { sendInvite, inviteShareSheet } = useInviteShare();
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
  // 모르면 null (서울로 계산)
  const [place, setPlace] = useState<BirthPlace | null>(null);
  const [showPlace, setShowPlace] = useState(false);
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
      toast(e instanceof ApiError && e.code === 'INVALID_BIRTH_DATE' ? '상대의 생년월일을 확인해 주세요' : e instanceof ApiError && e.code === 'INVALID_BIRTH_PLACE' ? '상대가 태어난 곳을 다시 골라 주세요' : '궁합을 보지 못했어요. 잠시 후 다시 시도해 주세요');
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
      birthPlace: place,
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
        <ImageBackground source={ART.compatHero} style={s.hero} imageStyle={s.fill} resizeMode="cover">
          <View style={s.heroLogo}><Logo height={19} /></View>
          <View style={s.pair}>
            <Avatar name={user.nickname} me />
            <RelationIcon relationship={result.relationship} />
            <Avatar name={result.target.nickname} />
          </View>
          <Text style={s.pairNames}>{user.nickname} · {result.target.nickname} · {rel.label}</Text>
          <ScoreHalo score={result.total} />
          <Text style={s.heroSummary}>{result.summary}</Text>
        </ImageBackground>

        <SectionHeader title="분야별 궁합" />
        <Card style={{ padding: 12, gap: 16 }}>
          {BARS.map((b, i) => (
            <View key={b.k} style={s.barRow}>
              <View style={s.barIco}><SolidIcon name={b.icon} size={b.icon === 'coins' ? 15 : 17} color={b.c} /></View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={s.barHead}>
                  <Text style={s.barLabel}>{rel.bars[b.k]}</Text>
                  <Text style={[s.barLabel, { color: b.c }]}>{result[b.k]}</Text>
                </View>
                <ScoreBar value={result[b.k]} color={b.c} track={colors.lavender} height={6} delay={300 + i * 90} />
              </View>
            </View>
          ))}
        </Card>

        <ShareCta spec={compatSpec(user, result)} banner />

        <SectionHeader title="관점별 풀이" />
        <View style={{ gap: 16 }}>
          {result.points.map(p => (
            <Card key={p.title} style={s.point}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SolidIcon name="book" size={20} color={colors.accent} />
                {/* 제목 앞 한자 한 글자("命 ")는 떼고 쓴다 */}
                <Text style={s.pointTitle}>{p.title.slice(2)}</Text>
              </View>
              <Text style={s.pointText}>{p.text}</Text>
            </Card>
          ))}
        </View>

        {result.source === 'invite' ? (
          <Text style={[txt.small, { marginTop: 20 }]}>상대의 생년월일은 공개하지 않고, 두 사람의 프로필로 심층 궁합을 볼 수 있어요.</Text>
        ) : null}

        {result.id != null ? (
          <>
            <DeepSection u={user} r={result} id={result.id} />
            {/* 속마음은 연애 리포트라 연인일 때만 */}
            {result.source !== 'invite' && result.relationship === 'lover' ? <CrushSection u={user} r={result} id={result.id} /> : null}
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
      <LinearGradient colors={PAIR_SKY} locations={[0, 0.53, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.pairSheet}>
        <View style={s.pairTile}>
          <View style={[s.pairSeal, { backgroundColor: colors.accent }]}><Text style={[s.pairSealText, { color: colors.white }]}>{user.nickname.slice(0, 1)}</Text></View>
          <Text style={s.pairName} numberOfLines={1}>{user.nickname}</Text>
          <Text style={s.pairSub} numberOfLines={1}>{user.mbti} · {user.bloodType}형</Text>
        </View>
        <View style={s.pairMid}><Mascot name="friends" size={58} /></View>
        <View style={s.pairTile}>
          <View style={[s.pairSeal, s.pairEmpty]}><Text style={s.pairSealText}>{name.trim() ? name.trim().slice(0, 1) : '?'}</Text></View>
          <Text style={s.pairName} numberOfLines={1}>{name.trim() || '그 사람'}</Text>
          <Text style={s.pairSub} numberOfLines={1}>{relationship ? RELATIONSHIP_INFO[relationship].label : '정보를 채워 주세요'}</Text>
        </View>
      </LinearGradient>
      <PressableScale onPress={sendInvite} style={[s.listRow, { marginTop: 16 }]} scaleTo={0.98} accessibilityLabel="상대에게 링크로 궁합 신청 받기">
        <View style={s.rowIco}><Icon name="send" size={18} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>생일을 모른다면, 링크로 신청받기</Text>
          <Text style={s.rowSub}>상대가 링크를 열면 둘의 궁합이 바로 나와요</Text>
        </View>
        <Icon name="chevronRight" size={20} color={colors.inkMute} strokeWidth={2} />
      </PressableScale>

      {saved.data?.length ? (
        <>
          <SectionHeader title="저장된 상대" caption="눌러서 자세히 보기" />
          <View style={{ gap: 8 }}>
            {saved.data.map(r => (
              <PressableScale key={r.id} onPress={() => setResult(r)} style={s.listRow} scaleTo={0.98} accessibilityLabel={`${r.target.nickname}님과 궁합 다시 보기`}>
                <View style={s.rowIco}><Text style={s.savedSealText}>{r.target.nickname.slice(0, 1)}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{r.target.nickname}</Text>
                    {r.isNew ? <Text style={s.newBadge}>NEW</Text> : null}
                  </View>
                  <Text style={s.rowSub} numberOfLines={1}>
                    {RELATIONSHIP_INFO[r.relationship].label}
                    {r.inviteRole === 'inviter' ? ' · 내 링크로 본 궁합' : r.source === 'invite' ? ' · 초대 링크로 본 궁합' : traitsOf(r.target) ? ` · ${traitsOf(r.target)}` : ''}
                    {r.id != null && owned(`compat:${r.id}`) ? ' · 심층 궁합' : ''}
                    {r.id != null && owned(`crush:${r.id}`) ? ' · 속마음' : ''}
                  </Text>
                </View>
                <Text style={s.savedScore}>{r.total}</Text>
                <Icon name="chevronRight" size={20} color={colors.inkMute} strokeWidth={2} />
              </PressableScale>
            ))}
          </View>
        </>
      ) : null}
      <SectionHeader title="새 상대와 궁합 보기" />
      <Card style={s.form}>

        <View>
          <Label>어떤 사이인가요?</Label>
          <View style={s.relGrid}>
            {RELATIONSHIPS.map(x => {
              const on = relationship === x.k;
              return (
                <PressableScale key={x.k} onPress={() => setRelationship(x.k)} haptic scaleTo={0.96} style={[s.relCell, on && s.relOn]} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${x.l} · ${x.hint}`}>
                  <View style={[s.relIco, on && { backgroundColor: '#3B3E48' }]}><RelationIcon relationship={x.k} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.relLabel, on && { color: colors.white }]} numberOfLines={1}>{x.l}</Text>
                    <Text style={[s.relHint, on && { color: colors.white }]} numberOfLines={1}>{x.hint}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View>
          <Label>상대 이름</Label>
          <TextField compact value={name} onChangeText={setName} placeholder="이름 또는 닉네임" maxLength={12} />
        </View>

        <View>
          <BirthDateField compact label={<Text style={[s.fieldLabel, { marginBottom: 0 }]}>생년월일</Text>} digits={birth} onChange={setBirth}
            calendar={calendar} onCalendar={setCalendar} leap={leap} onLeap={setLeap} />
        </View>

        <View>
          <Label>태어난 시간 (선택)</Label>
          <PressableScale onPress={() => setShowTime(v => !v)} style={[s.select, showTime && { borderColor: colors.accent }]} scaleTo={0.98} accessibilityLabel="태어난 시간 고르기">
            <Text style={[s.selectText, sijin === null && { color: colors.inkMute }]}>{sijin === null ? '모르면 비워 두세요' : sijinLabel(sijin, jasi)}</Text>
            <View style={{ transform: [{ rotate: showTime ? '180deg' : '0deg' }] }}><Icon name="chevronDown" size={20} color={colors.inkMute} strokeWidth={2} /></View>
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
          <Label>태어난 곳 (선택)</Label>
          <PressableScale onPress={() => setShowPlace(v => !v)} style={[s.select, showPlace && { borderColor: colors.accent }]} scaleTo={0.98} accessibilityLabel="태어난 곳 고르기">
            <Text style={[s.selectText, !place && { color: colors.inkMute }]} numberOfLines={1}>{place ? placeLabel(place) : '모르면 비워 두세요 · 서울로 봐요'}</Text>
            <View style={{ transform: [{ rotate: showPlace ? '180deg' : '0deg' }] }}><Icon name="chevronDown" size={20} color={colors.inkMute} strokeWidth={2} /></View>
          </PressableScale>
          {showPlace && (
            <View style={{ marginTop: 8 }}>
              <BirthPlaceSearch compact selected={place} onPick={p => { Keyboard.dismiss(); setPlace(p); setShowPlace(false); }} />
            </View>
          )}
        </View>

        <View>
          <Label>성별</Label>
          <View style={s.row}>
            <Pick label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
            <Pick label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
          </View>
        </View>

        <View>
          <Label>MBTI (선택)</Label>
          <PressableScale onPress={() => setShowMbti(v => !v)} style={[s.select, showMbti && { borderColor: colors.accent }]} scaleTo={0.98} accessibilityLabel="MBTI 고르기">
            <Text style={[s.selectText, !mbti && { color: colors.inkMute }]}>{mbti ? `${mbti} · ${MBTI_INFO[mbti].nickname}` : '모르면 비워 두세요'}</Text>
            <View style={{ transform: [{ rotate: showMbti ? '180deg' : '0deg' }] }}><Icon name="chevronDown" size={20} color={colors.inkMute} strokeWidth={2} /></View>
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
          <View style={[s.row, { gap: 11 }]}>
            {BLOOD_TYPES.map(b => <Pick key={b} label={`${b}형`} selected={blood === b} onPress={() => setBlood(blood === b ? null : b)} />)}
            <Pick label="모름" selected={!blood} onPress={() => setBlood(null)} />
          </View>
        </View>
        {!mbti || !blood ? <Text style={[txt.small, { marginTop: -4 }]}>모르는 정보는 빼고 사주로 봐요.</Text> : null}
      </Card>
      <Disclaimer compact />
      {inviteShareSheet}
    </Screen>
  );
}

/** 심층 궁합: 열기 전엔 가격 카드, 열면 서버가 계산한 두 사람 비교 */
function DeepSection({ u, r, id }: { u: User; r: CompatibilityResult; id: number }) {
  const item = ITEMS.compat(id, r.target.nickname, r.relationship, !!r.target.mbti);
  const content = usePremiumContent<DeepCompatibility>({ kind: 'compat', id });
  const { reading, retry } = useReading<CompatReading>(content);
  if (!content.open) return <LockedCard item={item} />;
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
  if (!content.open) return <LockedCard item={item} />;
  if (!content.data) return <BodyState error={content.isError} onRetry={() => content.refetch()} />;
  return (
    <>
      <CrushView r={r} R={content.data.data} reading={reading} onRetry={retry} />
      <ShareCta spec={crushSpec(u, r, content.data.data)} />
    </>
  );
}

const s = StyleSheet.create({
  // 시작 화면
  pairSheet: { flexDirection: 'row', alignItems: 'center', height: 120, paddingHorizontal: 17, borderRadius: radius.lg },
  pairTile: { width: 96, height: 96, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', paddingTop: 11, paddingHorizontal: 6, shadowColor: '#28B2FE', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  pairSeal: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pairEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: colors.surface },
  pairSealText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.72, color: colors.ink },
  pairName: { marginTop: 8, fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
  pairSub: { fontSize: 11, lineHeight: 14, letterSpacing: -0.55, color: colors.inkMute },
  pairMid: { flex: 1, alignItems: 'center' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.card },
  rowIco: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flexShrink: 1, fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
  rowSub: { marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  savedSealText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.64, color: colors.ink },
  savedScore: { fontSize: 20, fontWeight: '600', letterSpacing: -0.8, color: colors.love, fontVariant: ['tabular-nums'] },
  form: { gap: 16, padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', letterSpacing: -0.56, color: colors.ink, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mbtiCell: { flexGrow: 1, flexBasis: '22%' },
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 7, rowGap: 8 },
  relCell: { flexBasis: '45%', flexGrow: 1, height: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 6, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface },
  relOn: { backgroundColor: colors.navy, borderColor: '#E8E8E8' },
  relIco: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  relLabel: { fontSize: 13, fontWeight: '700', letterSpacing: -0.52, color: colors.ink },
  relHint: { fontSize: 11, lineHeight: 18, letterSpacing: -0.55, color: colors.ink },
  select: { height: 36, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 13, fontWeight: '500', color: colors.ink },
  pick: { flex: 1, height: 36, borderRadius: 5, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pickOn: { backgroundColor: colors.navy },
  pickText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.26, color: colors.ink },
  newBadge: { fontSize: 10, fontWeight: '800', color: colors.white, backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden' },
  deleteLink: { fontSize: 13, fontWeight: '600', color: colors.inkMute, textDecorationLine: 'underline' },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  // 히어로 색은 밤하늘 그림 위라 화면 모드와 상관없이 고정
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.white },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#000000', letterSpacing: -0.7 },
  hero: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.heroBg, paddingTop: 26, paddingBottom: 18, paddingHorizontal: 24, alignItems: 'center' },
  // ImageBackground 는 크기를 안 주면 웹에서 그림 원래 크기로 그린다
  fill: { width: '100%', height: '100%' },
  heroLogo: { position: 'absolute', left: 16, top: 12 },
  halo: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', marginTop: 11, marginBottom: 19 },
  haloScore: { fontSize: 32, lineHeight: 34, fontWeight: '600', letterSpacing: -1.6, color: colors.white, fontVariant: ['tabular-nums'] },
  haloLabel: { fontSize: 10, fontWeight: '600', letterSpacing: -0.5, color: colors.white },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairNames: { color: '#DDDDDD', fontSize: 13, lineHeight: 18, letterSpacing: -0.65, marginTop: 6 },
  heroSummary: { color: colors.white, fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: -0.65, textAlign: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barIco: { width: 38, height: 38, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink, fontVariant: ['tabular-nums'] },
  point: { padding: 16, borderRadius: radius.sm },
  pointTitle: { flexShrink: 1, fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
  pointText: { marginTop: 4, fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
});
