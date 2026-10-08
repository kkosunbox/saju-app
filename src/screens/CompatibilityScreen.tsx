import React, { useState } from 'react';
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
import Disclaimer from '../components/Disclaimer';
import { useApp } from '../context/AppContext';
import { fortuneApi } from '../api/fortune';
import { storage } from '../services/storage/storageService';
import { BloodType, CompatibilityResult, Gender, MBTI } from '../types';
import { MBTI_LIST } from '../data/mbtiData';
import { isValidDate } from '../utils/date';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { radius, shadow, txt } from '../theme/typography';

const BARS: { k: 'love' | 'personality' | 'conversation' | 'money'; l: string; c: string; e: string }[] = [
  { k: 'love', l: '연애 궁합', c: colors.love, e: '❤️' },
  { k: 'personality', l: '성격 궁합', c: colors.purpleSoft, e: '🫶' },
  { k: 'conversation', l: '대화 궁합', c: colors.work, e: '💬' },
  { k: 'money', l: '금전 궁합', c: colors.money, e: '💰' },
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
  const { user } = useApp();
  const [name, setName] = useState('');
  const [y, setY] = useState(''); const [m, setM] = useState(''); const [d, setD] = useState('');
  const [hh, setHh] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [mbti, setMbti] = useState<MBTI | null>(null);
  const [blood, setBlood] = useState<BloodType | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [showMbti, setShowMbti] = useState(false);

  const dateFilled = y.length === 4 && !!m && !!d;
  const dateOk = isValidDate(+y, +m, +d);
  const hourOk = hh === '' || (+hh >= 0 && +hh <= 23);
  const ok = !!name.trim() && dateOk && !!gender && !!mbti && !!blood && hourOk;

  const analyze = async () => {
    if (!user || !ok) return;
    const r = await fortuneApi.analyzeCompatibility(user, {
      nickname: name.trim(),
      birthDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      birthTime: hh ? `${hh.padStart(2, '0')}:00` : null,
      gender: gender!, mbti: mbti!, bloodType: blood!,
    });
    await storage.saveCompatibility(r);
    setResult(r);
  };

  if (!user) return null;

  if (result) {
    return (
      <Screen largeTitle="우리 둘의 궁합">
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
                <Text style={s.barLabel}>{b.e}  {b.l}</Text>
                <Text style={[s.barScore, { color: b.c }]}>{result[b.k]}</Text>
              </View>
              <ScoreBar value={result[b.k]} color={b.c} height={8} delay={300 + i * 90} />
            </View>
          ))}
        </Card>

        <SectionHeader title="관점별 풀이" />
        <View style={{ gap: 10 }}>
          {result.points.map((p, i) => {
            const t = analysisTheme[POINT_SOURCE[i] ?? 'saju'];
            return (
              <Card key={p.title} style={s.point}>
                <View style={[s.pointBand, { backgroundColor: t.color }]} />
                <Text style={[s.pointTitle, { color: t.color }]}>{p.title}</Text>
                <Text style={[txt.body, { marginTop: 6 }]}>{p.text}</Text>
              </Card>
            );
          })}
        </View>

        <PrimaryButton label="다른 사람과 궁합 보기" variant="soft" onPress={() => setResult(null)} style={{ marginTop: 24 }} />
        <Disclaimer compact />
      </Screen>
    );
  }

  return (
    <Screen
      largeTitle="궁합"
      subtitle="상대의 정보로 네 가지 관점의 궁합을 봐요"
      footer={<PrimaryButton label="궁합 보기" onPress={analyze} disabled={!ok} />}
    >
      <Card style={s.form}>
        <View style={s.me}>
          <Avatar name={user.nickname} light />
          <Text style={txt.bodyStrong}>{user.nickname}님과</Text>
          <Text style={txt.small}>{user.mbti} · {user.bloodType}형</Text>
        </View>

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
          <PressableScale onPress={() => setShowMbti(v => !v)} style={[s.select, showMbti && { borderColor: colors.purpleSoft }]} scaleTo={0.98}>
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
  form: { gap: 20, padding: 20 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.inkSub, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mbtiCell: { width: '23.8%' },
  select: { height: 54, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  error: { color: colors.danger, fontSize: 12, marginTop: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  heroWrap: { borderRadius: radius.xl, backgroundColor: colors.purple },
  hero: { borderRadius: radius.xl, padding: 24, alignItems: 'center' },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pairNames: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 8 },
  heroSummary: { color: colors.white, fontSize: 18, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  barScore: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  point: { paddingLeft: 24 },
  pointBand: { position: 'absolute', left: 10, top: 18, bottom: 18, width: 3, borderRadius: 2 },
  pointTitle: { fontSize: 13, fontWeight: '800' },
});
