import React, { useState } from 'react';
import { RouteProp, useRoute } from '@/navigation/compat';
import { TabParamList } from '../navigation/types';
import CrushView from '../components/premium/Crush';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import OptionChip from '../components/OptionChip';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import ScoreRing from '../components/ScoreRing';
import ScoreBar from '../components/ScoreBar';
import SectionHeader from '../components/SectionHeader';
import Icon from '../components/Icon';
import Seal from '../components/Seal';
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { PriceCard } from '../components/premium/Kit';
import ReportArea from '../components/premium/Report';
import CompatDeep from '../components/premium/CompatDeep';
import { ITEMS } from '../services/premium/catalog';
import { generateReport, reportAvailable } from '../services/report/reportService';
import { compatApi } from '../services/server/compatApi';
import { ApiError } from '../api/client';
import { BloodType, CompatibilityResult, Gender, MBTI, PartnerInput } from '../types';
import { MBTI_LIST } from '../data/mbtiData';
import { isValidDate } from '../utils/date';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { fonts, radius, shadow, txt } from '../theme/typography';
import ShareCta from '../components/ShareCta';
import { compatSpec, crushSpec } from '../services/share/shareSpecs';
import { shareInvite } from '../services/share/linkShare';

const BARS: { k: 'love' | 'personality' | 'conversation' | 'money'; l: string; c: string; e: string }[] = [
  { k: 'love', l: '연애 궁합', c: colors.love, e: '緣' },
  { k: 'personality', l: '성격 궁합', c: colors.purpleSoft, e: '和' },
  { k: 'conversation', l: '대화 궁합', c: colors.work, e: '言' },
  { k: 'money', l: '금전 궁합', c: colors.money, e: '財' },
];
const POINT_SOURCE = ['saju', 'mbti', 'blood'] as const;

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
  const { user, today } = useApp();
  const { owned, toast } = usePremium();
  const [name, setName] = useState('');
  const [y, setY] = useState(''); const [m, setM] = useState(''); const [d, setD] = useState('');
  const [hh, setHh] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showMbti, setShowMbti] = useState(false);

  const sendInvite = async () => {
    if (!user) return;
    const r = await shareInvite(user.nickname);
    if (r === 'copied') toast('초대 링크를 복사했어요. 상대에게 보내 보세요');
    else if (r === 'failed') toast('초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
  };
  const dateFilled = y.length === 4 && !!m && !!d;
  const dateOk = isValidDate(+y, +m, +d);
  const hourOk = hh === '' || (+hh >= 0 && +hh <= 23);
  const ok = !!name.trim() && dateOk && !!gender && !!mbti && !!blood && hourOk;

  const [busy, setBusy] = useState(false);
  /** 서버가 계산하고 내 궁합 기록에 저장한다 (상대 정보는 기록을 지우면 함께 삭제). */
  const run = async (partner: PartnerInput) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      setResult(await compatApi.create(user.id, partner));
    } catch (e) {
      toast(e instanceof ApiError && e.code === 'INVALID_BIRTH_DATE' ? '상대의 생년월일을 확인해 주세요' : '궁합을 보지 못했어요. 잠시 후 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
  };
  const analyze = () => {
    if (!ok) return;
    run({
      nickname: name.trim(),
      birthDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      birthTime: hh ? `${hh.padStart(2, '0')}:00` : null,
      gender: gender!, mbti: mbti!, bloodType: blood!,
    });
  };

  const { params } = useRoute<RouteProp<TabParamList, 'Compatibility'>>();
  // 친구 초대를 수락하면 서버가 계산한 결과가 바로 넘어온다 (파라미터가 바뀐 렌더에서 바로 반영)
  const [seenResult, setSeenResult] = useState<CompatibilityResult | undefined>();
  if (params?.result !== seenResult) {
    setSeenResult(params?.result);
    if (params?.result) setResult(params.result);
  }

  if (!user) return null;

  if (result) {
    return (
      <Screen largeTitle="우리 둘의 궁합" onBack={() => setResult(null)}>
        <View style={[s.heroWrap, shadow.hero]}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.hero}>
            <View style={s.pair}>
              <Avatar name={user.nickname} light />
              <Icon name="heart" size={18} color="rgba(255,255,255,0.7)" filled />
              <Avatar name={result.target.nickname} />
            </View>
            <Text style={s.pairNames}>{user.nickname} · {result.target.nickname}</Text>
            <View style={{ marginVertical: 16 }}><ScoreRing score={result.total} size={128} label="종합 궁합" /></View>
            <Text style={s.heroSummary}>{result.summary}</Text>
          </LinearGradient>
        </View>

        <SectionHeader title="분야별 궁합" />
        <Card style={{ gap: 18 }}>
          {BARS.map((b, i) => (
            <View key={b.k} style={{ gap: 8 }}>
              <View style={s.barHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Seal ch={b.e} /><Text style={s.barLabel}>{b.l}</Text></View>
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
            const t = analysisTheme[POINT_SOURCE[i] ?? 'saju'];
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
          <Text style={[txt.small, { marginTop: 20 }]}>초대 링크로 본 궁합이라 상대의 생년월일을 몰라요. 심층 궁합·속마음은 상대 정보를 직접 넣어 볼 수 있어요.</Text>
        ) : null}

        {result.source !== 'invite' && result.id != null && (() => {
          const item = ITEMS.compat(result.id, result.target.nickname);
          const rk = { key: item.key, kind: 'compat' as const, user, today, compat: result };
          if (!owned(item.key)) return <PriceCard item={item} onUnlocked={() => { if (reportAvailable()) generateReport(rk); }} />;
          return (
            <>
              <SectionHeader title="심층 궁합 리포트" caption="두 사람의 네 가지 관점을 하나로 엮은 풀이" />
              <ReportArea rk={rk} item={item} basis={<CompatDeep u={user} r={result} today={today} />} />
            </>
          );
        })()}

        {result.source !== 'invite' && result.id != null && (() => {
          const item = ITEMS.crush(result.id, result.target.nickname);
          if (!owned(item.key)) return <PriceCard item={item} />;
          return (
            <>
              <CrushView u={user} r={result} today={today} />
              <ShareCta spec={crushSpec(user, result, today)} />
            </>
          );
        })()}

        <PrimaryButton label="다른 사람과 궁합 보기" variant="soft" onPress={() => setResult(null)} style={{ marginTop: 24 }} />
        <Disclaimer compact />
      </Screen>
    );
  }

  return (
    <Screen
      largeTitle="궁합"
      subtitle="상대의 정보로 네 가지 관점의 궁합을 봐요"
      footer={<PrimaryButton label={busy ? '궁합 보는 중…' : '궁합 보기'} onPress={analyze} disabled={!ok || busy} />}
    >
      {/* 두 사람의 책력 — 내 낙관 · 和 · 아직 비어 있는 상대 낙관 */}
      <View style={s.pairSheet}>
        <View style={s.pairCol}>
          <View style={[s.pairSeal, { backgroundColor: colors.seal }]}><Text style={s.pairSealText}>{user.nickname.slice(0, 1)}</Text></View>
          <Text style={s.pairName}>{user.nickname}</Text>
          <Text style={txt.caption}>{user.mbti} · {user.bloodType}형</Text>
        </View>
        <View style={s.pairMid}>
          <View style={s.pairLine} />
          <Text style={s.pairHan}>和</Text>
          <View style={s.pairLine} />
        </View>
        <View style={s.pairCol}>
          <View style={[s.pairSeal, s.pairEmpty]}><Text style={[s.pairSealText, { color: colors.inkMute }]}>{name.trim() ? name.trim().slice(0, 1) : '?'}</Text></View>
          <Text style={s.pairName}>{name.trim() || '그 사람'}</Text>
          <Text style={txt.caption}>{mbti && blood ? `${mbti} · ${blood}형` : '정보를 채워 주세요'}</Text>
        </View>
      </View>
      <PressableScale onPress={sendInvite} style={s.inviteRow} scaleTo={0.98} accessibilityLabel="상대에게 링크로 궁합 신청 받기">
        <Text style={s.inviteHan}>信</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>생일을 모른다면, 링크로 신청받기</Text>
          <Text style={txt.caption}>상대가 링크를 열면 둘의 궁합이 바로 나와요</Text>
        </View>
        <Icon name="share" size={18} color={colors.purple} />
      </PressableScale>

      <Card style={s.form}>

        <View>
          <Label>상대 이름</Label>
          <TextField value={name} onChangeText={setName} placeholder="이름 또는 닉네임" maxLength={12} />
        </View>

        <View>
          <Label>생년월일 (양력)</Label>
          <View style={s.row}>
            <TextField containerStyle={{ flex: 1.5 }} value={y} onChangeText={t => setY(t.replace(/\D/g, ''))} placeholder="1994" keyboardType="number-pad" maxLength={4} suffix="년" invalid={dateFilled && !dateOk} />
            <TextField containerStyle={{ flex: 1 }} value={m} onChangeText={t => setM(t.replace(/\D/g, ''))} placeholder="7" keyboardType="number-pad" maxLength={2} suffix="월" invalid={dateFilled && !dateOk} />
            <TextField containerStyle={{ flex: 1 }} value={d} onChangeText={t => setD(t.replace(/\D/g, ''))} placeholder="2" keyboardType="number-pad" maxLength={2} suffix="일" invalid={dateFilled && !dateOk} />
          </View>
          {dateFilled && !dateOk ? <Text style={s.error}>실제 있는 날짜인지 확인해 주세요.</Text> : null}
        </View>

        <View>
          <Label>태어난 시 (선택)</Label>
          <TextField value={hh} onChangeText={t => setHh(t.replace(/\D/g, ''))} placeholder="모르면 비워두세요" keyboardType="number-pad" maxLength={2} suffix="시" invalid={!hourOk} />
        </View>

        <View>
          <Label>성별</Label>
          <View style={s.row}>
            <OptionChip style={{ flex: 1 }} compact label="여성" selected={gender === 'female'} onPress={() => setGender('female')} />
            <OptionChip style={{ flex: 1 }} compact label="남성" selected={gender === 'male'} onPress={() => setGender('male')} />
          </View>
        </View>

        <View>
          <Label>MBTI</Label>
          <PressableScale onPress={() => setShowMbti(v => !v)} style={[s.select, showMbti && { borderColor: colors.purple }]} scaleTo={0.98}>
            <Text style={[s.selectText, !mbti && { color: colors.inkMute }]}>{mbti ?? '선택하기'}</Text>
            <View style={{ transform: [{ rotate: showMbti ? '-90deg' : '90deg' }] }}><Icon name="chevronRight" size={18} color={colors.inkMute} /></View>
          </PressableScale>
          {showMbti && (
            <View style={[s.grid, { marginTop: 8 }]}>
              {MBTI_LIST.map(t => (
                <OptionChip key={t} compact style={s.mbtiCell} label={t} selected={mbti === t} onPress={() => { setMbti(t); setShowMbti(false); }} />
              ))}
            </View>
          )}
        </View>

        <View>
          <Label>혈액형</Label>
          <View style={s.row}>
            {(['A', 'B', 'O', 'AB'] as BloodType[]).map(b => <OptionChip key={b} style={{ flex: 1 }} compact label={`${b}형`} selected={blood === b} onPress={() => setBlood(b)} />)}
          </View>
        </View>
      </Card>
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  pairSheet: { flexDirection: 'row', alignItems: 'center', marginTop: 4, padding: 18, borderRadius: radius.xl, backgroundColor: colors.loveBg, borderWidth: 1, borderColor: colors.love + '40' },
  pairCol: { flex: 1, alignItems: 'center', gap: 4 },
  pairSeal: { width: 54, height: 54, borderRadius: 6, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  pairEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.inkMute, transform: [{ rotate: '5deg' }] },
  pairSealText: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: '#FBF4E8' },
  pairName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 6 },
  pairMid: { width: 64, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 34 },
  pairLine: { flex: 1, height: 1, backgroundColor: colors.love, opacity: 0.5 },
  pairHan: { fontFamily: fonts.serif, fontSize: 20, fontWeight: '700', color: colors.love },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginBottom: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong },
  inviteHan: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.purpleSoft, width: 28, textAlign: 'center' },
  form: { gap: 20, padding: 20 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.inkSub, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mbtiCell: { width: '23.8%' },
  select: { height: 52, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 17, fontWeight: '500', color: colors.ink },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F5F8A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { fontFamily: fonts.serif, color: colors.white, fontWeight: '600', fontSize: 16 },
  heroWrap: { borderRadius: radius.xl, backgroundColor: colors.heroBg },
  hero: { borderRadius: radius.xl, padding: 24, alignItems: 'center' },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pairNames: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 8 },
  heroSummary: { fontFamily: fonts.serif, color: colors.white, fontSize: 18, fontWeight: '600', letterSpacing: -0.4, textAlign: 'center' },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  barScore: { fontFamily: fonts.serif, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  point: { paddingLeft: 24 },
  pointBand: { position: 'absolute', left: 10, top: 18, bottom: 18, width: 3, borderRadius: 2 },
  pointTitle: { fontSize: 13, fontWeight: '800' },
});
