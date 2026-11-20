import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ScoreBar from '../../components/ScoreBar';
import PrimaryButton from '../../components/PrimaryButton';
import ProfileSwitch from '../../components/premium/ProfileSwitch';
import LoadingScreen from '../../components/LoadingScreen';
import { ShareIconButton } from '../../components/ShareCta';
import { CharacterAvatar } from '../../components/CharacterScene';
import { Bullet, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { useStarDetail } from '../../services/server/starApi';
import { starSpec } from '../../services/share/shareSpecs';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

const THREAD = '#FF5A7A';
const BARS: ['love' | 'personality' | 'conversation' | 'life', string][] = [['love', '연애'], ['personality', '성격'], ['conversation', '대화'], ['life', '생활']];

/** 무료: 천생연분 스타 한 명과의 궁합 — 점수 · 왜 잘 맞는지 · 함께라면 */
export default function StarDetailScreen() {
  const nav = useNavigation();
  const { params } = useRoute<{ params: { id?: string } }>();
  const id = params?.id && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const { user: u } = useApp();
  const q = useStarDetail(id);
  if (!u) return null;
  const d = q.data;
  if (!d) return <LoadingScreen title="스타 궁합" error={q.error ?? (id == null ? new Error('스타를 찾을 수 없어요') : undefined)} onRetry={q.refetch} />;
  const spec = starSpec(u, d, d.me);

  return (
    <Screen title="스타 궁합" back right={<ShareIconButton spec={spec} />}>
      <ProfileSwitch style={{ marginBottom: 12 }} />
      <LinearGradient colors={['#141826', '#26203A', '#3A2338']} style={s.hero}>
        <View style={s.pair}>
          <View style={s.side}>
            <CharacterAvatar hanja={d.me.hanja} size={64} />
            <Text style={s.who} numberOfLines={1}>{u.nickname}</Text>
            <Text style={s.char} numberOfLines={1}>{d.me.character}</Text>
          </View>
          <View style={s.mid}>
            <Text style={s.midLabel}>오늘의 궁합</Text>
            <Text style={s.score}>{d.score}<Text style={s.unit}>점</Text></Text>
            <View style={s.threadLine} />
          </View>
          <View style={s.side}>
            <CharacterAvatar hanja={d.hanja} size={64} />
            <Text style={s.who} numberOfLines={1}>{d.name}</Text>
            <Text style={s.char} numberOfLines={1}>{d.character}</Text>
          </View>
        </View>
        <Text style={s.summary}>{d.summary}</Text>
        <View style={s.bond}><Text style={s.bondText}>{d.bond}</Text></View>
        <Text style={s.today}>{d.todayLine}</Text>
      </LinearGradient>

      <Card style={{ marginTop: 16 }}>
        {BARS.map(([k, label]) => (
          <View key={k} style={s.barRow}>
            <Text style={s.barLabel}>{label}</Text>
            <View style={{ flex: 1 }}><ScoreBar value={d.scores[k]} color={THREAD} track={isDark ? colors.lineStrong : '#F1E3E6'} /></View>
            <Text style={s.barValue}>{d.scores[k]}</Text>
          </View>
        ))}
      </Card>

      <SubHead title="왜 잘 맞을까?" caption="두 사람의 사주가 만나는 자리" />
      <Card>
        {d.reasons.map(r => <Bullet key={r} color={THREAD} textStyle={txt.body}>{r}</Bullet>)}
      </Card>

      <SubHead title="함께라면 이런 하루" caption="상상은 자유니까요" />
      <Card>
        {d.together.map(t => <Bullet key={t} color={THREAD} textStyle={txt.body}>{t}</Bullet>)}
      </Card>

      <PrimaryButton label="다른 스타와도 궁합 보기" onPress={() => (nav.canGoBack() ? nav.goBack() : nav.navigate('StarMatch'))} style={{ marginTop: 24 }} />
      {/* 이 스타의 이름·양력 생일·성별을 채운 궁합 상대 추가 화면으로 (저장은 거기서 궁합을 볼 때) */}
      <PrimaryButton variant="soft" label="궁합 상대로 추가" onPress={() => nav.navigate('Compatibility', { star: { nickname: d.name, birthDate: d.birthDate, gender: d.gender } })} style={{ marginTop: 8 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: radius.lg, paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center' },
  pair: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch', justifyContent: 'space-between' },
  side: { alignItems: 'center', width: 100 },
  who: { ...sansW('700'), fontSize: 14, lineHeight: 19, color: '#FFFFFF', marginTop: 8, letterSpacing: -0.5 },
  char: { ...sansW('500'), fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  mid: { flex: 1, alignItems: 'center', paddingTop: 4 },
  midLabel: { ...sansW('600'), fontSize: 11, lineHeight: 15, color: '#FFD3DC', letterSpacing: -0.3 },
  score: { ...sansW('800'), fontSize: 34, lineHeight: 40, color: '#FFFFFF', letterSpacing: -1.2 },
  unit: { ...sansW('700'), fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  threadLine: { alignSelf: 'stretch', height: 2, borderRadius: 1, backgroundColor: THREAD, marginTop: 6 },
  summary: { ...sansW('700'), fontSize: 17, lineHeight: 24, letterSpacing: -0.6, color: '#FFFFFF', marginTop: 18, textAlign: 'center' },
  bond: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: 'rgba(255,90,122,0.2)' },
  bondText: { ...sansW('600'), fontSize: 12, lineHeight: 16, color: '#FFD3DC', letterSpacing: -0.4 },
  today: { ...sansW('500'), fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)', marginTop: 14, textAlign: 'center', letterSpacing: -0.4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  barLabel: { ...sansW('600'), width: 32, fontSize: 13, lineHeight: 18, color: colors.inkSub },
  barValue: { ...sansW('700'), width: 28, fontSize: 14, lineHeight: 18, color: colors.ink, textAlign: 'right' },
});
