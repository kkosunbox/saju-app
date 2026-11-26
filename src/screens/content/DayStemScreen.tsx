import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import OptionChip from '../../components/OptionChip';
import MbtiQuiz from '../../components/MbtiQuiz';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import ProfileSwitch from '../../components/premium/ProfileSwitch';
import ProfileHintBubble from '../../components/premium/ProfileHintBubble';
import FriendCompare from '../../components/FriendCompare';
import Reveal from '../../components/Reveal';
import { Logo } from '../../components/Mascot';
import { useOpened } from '../../services/content/opened';
import { useApp } from '../../context/AppContext';
import { useContentScope } from '../../context/ContentScopeContext';
import { useFreeContent } from '../../services/server/contentApi';
import { inputOf } from '../../services/server/profileApi';
import LoadingScreen from '../../components/LoadingScreen';
import { QuickReadingLoader } from '../../components/premium/ReadingLoaders';
import { dayStemSpec } from '../../services/share/shareSpecs';
import { DAY_STEM_TITLE } from '../../content/dayStem';
import { MBTI_INFO, MBTI_LIST } from '../../data/mbtiData';
import type { MBTI } from '../../types';
import type { DayStemMbti } from '../../types/content';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

const TITLE = DAY_STEM_TITLE;
const LOADING_MSGS = ['태어난 날의 일간을 찾고 있어요', '오행의 기운을 살펴보고 있어요', 'MBTI와 엮어 보고 있어요'];

/** 무료: 일간오행 × MBTI (예: ENFJ × 무토남) */
export default function DayStemScreen() {
  const { user: u, saveProfile } = useApp();
  const scope = useContentScope();
  const q = useFreeContent('day-stem');
  const draw = useOpened('day-stem');
  const [drawn, setDrawn] = useState(false);
  // 처음 열 때는 버튼 없이 잠깐 로딩 화면을 보여 준 뒤 결과를 펼친다 (MBTI를 고르기 전에는 뽑지 않는다)
  const ready = !!q.data && draw.ready;
  const pending = ready && !draw.opened && !!u && !(u.mbtiUnknown && scope?.profile);
  const open = draw.open;
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => { setDrawn(true); open(); }, 2700);
    return () => clearTimeout(t);
  }, [pending, open]);
  if (!u) return null;
  if (pending && q.data) {
    return (
      <Screen title={TITLE} back scroll={false}>
        <QuickReadingLoader title={`${q.data.mbti} × ${q.data.label}\n풀어 보는 중이에요`} messages={LOADING_MSGS} />
      </Screen>
    );
  }
  if (!q.data || !draw.ready) return <LoadingScreen title={TITLE} error={q.error} onRetry={q.refetch} />;
  const d = q.data;

  // MBTI를 사주로 추정한 프로필 — 사주 × 사주가 되지 않게 실제 MBTI부터 받는다 (고르면 프로필에도 저장)
  if (u.mbtiUnknown && scope?.profile) {
    const profile = scope.profile;
    return <MbtiGate onSave={async mbti => { await saveProfile({ ...inputOf(profile), mbti }, profile.profileId); }} />;
  }

  const spec = dayStemSpec(u, d);
  const hero = <Hero d={d} nickname={u.nickname} />;
  return (
    <Screen key="result" title={TITLE} back contentStyle={s.content} right={<ShareIconButton spec={spec} />}>
      {/* 말풍선은 칩 아래 내용 위에 떠 있어서 자리를 차지하지 않는다 */}
      <View style={{ zIndex: 10, marginBottom: 12 }}>
        <ProfileSwitch />
        <ProfileHintBubble text="프로필을 추가해서 다른 사람 것도 확인해 보세요" style={{ marginTop: 2 }} />
      </View>
      <FriendCompare route="DayStem" spec={spec} />
      {drawn ? <Reveal>{hero}</Reveal> : hero}

      <Section number="01" title={`${d.stemName}, ${d.image}의 기운`} />
      <View style={s.card}>
        <View style={s.chips}>
          <Chip label={`${d.isYang ? '양' : '음'}의 ${d.stemName.slice(1)}`} color={d.colorHex} />
          <Chip label={`상징 · ${d.image}`} color={d.colorHex} />
        </View>
        <Text style={[s.body, { marginTop: 10 }]}>{d.story}</Text>
        <View style={s.list}>
          {d.strengths.map(line => <Text key={line} style={s.bullet}>· {line}</Text>)}
        </View>
      </View>

      <Section number="02" title={`${d.mbti}와 ${d.label}`} />
      <View style={s.card}>
        {d.meet.map((p, i) => <Text key={i} style={[s.body, i > 0 && { marginTop: 10 }]}>{p}</Text>)}
      </View>

      <Section number="03" title="상황별 나" />
      <View style={{ gap: 8 }}>
        <Scene title="연애할 때" body={d.love} />
        <Scene title="일할 때" body={d.work} />
        <Scene title="친구로서" body={d.friend} />
      </View>

      <ShareActions spec={spec} title="그 사람은 무슨 조합일까?" sub="내 조합을 보내고, 상대의 MBTI × 일간도 받아 보세요" pose="question" outlined marginTop={16} />
    </Screen>
  );
}

/** MBTI 고르기 — 모르면 4문항으로 찾는다 */
function MbtiGate({ onSave }: { onSave: (mbti: MBTI) => Promise<void> }) {
  const [picked, setPicked] = useState<MBTI | null>(null);
  const [quiz, setQuiz] = useState(false);
  const [saving, setSaving] = useState(false);
  if (quiz) {
    return (
      <SafeAreaView style={s.quiz}>
        <MbtiQuiz onClose={() => setQuiz(false)} onDone={type => { setPicked(type); setQuiz(false); }} />
      </SafeAreaView>
    );
  }
  return (
    <Screen title={TITLE} back>
      <ProfileSwitch style={{ marginBottom: 12 }} />
      <Text style={s.gateTitle}>MBTI를 골라 주세요</Text>
      <View style={s.grid}>
        {MBTI_LIST.map(t => <OptionChip key={t} style={s.mbti} label={t} sub={MBTI_INFO[t].nickname} selected={picked === t} onPress={() => setPicked(t)} />)}
      </View>
      <PrimaryButton label="MBTI를 몰라요 · 4문항으로 찾기" variant="soft" onPress={() => setQuiz(true)} style={{ marginTop: 16 }} />
      <PrimaryButton
        label={saving ? '저장 중…' : picked ? `${picked}로 보기 →` : 'MBTI를 골라 주세요'}
        disabled={!picked || saving}
        onPress={async () => { if (!picked) return; setSaving(true); try { await onSave(picked); } finally { setSaving(false); } }}
        style={{ marginTop: 8 }}
      />
    </Screen>
  );
}

function Hero({ d, nickname }: { d: DayStemMbti; nickname: string }) {
  return (
    <View style={[s.hero, { backgroundColor: d.colorHex }]}>
      <View style={s.heroLogo}><Logo height={30} /></View>
      <Text style={s.heroHanja}>{d.hanja}</Text>
      <Text style={s.eyebrow}>{nickname}님은</Text>
      <Text accessibilityRole="header" style={s.heroTitle}>{d.title}</Text>
      <View style={s.tags}>{d.tags.map(tag => <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>)}</View>
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return <View style={[s.chip, { borderColor: color }]}><Text style={[s.chipText, { color: isDark ? colors.ink : color }]}>{label}</Text></View>;
}

function Scene({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.card}>
      <View style={s.sceneHead}>
        <Text accessibilityRole="header" style={[s.cardTitle, { marginBottom: 0 }]}>{title}</Text>
      </View>
      <Text style={[s.body, { marginTop: 8 }]}>{body}</Text>
    </View>
  );
}

function Section({ number, title }: { number?: string; title: string }) {
  return (
    <View style={s.section}>
      {number ? <Text style={[s.sectionText, s.sectionNumber]}>{number}</Text> : null}
      <Text accessibilityRole="header" style={s.sectionText}>{title}</Text>
    </View>
  );
}

const INK = isDark ? colors.ink : '#000000';
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  gateTitle: { ...txt.title, fontSize: 24, lineHeight: 32, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  mbti: { width: '23%' },
  quiz: { flex: 1, backgroundColor: colors.cream },

  content: { paddingTop: 0, paddingBottom: 60 },
  hero: { borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 44, paddingBottom: 28, paddingHorizontal: 16 },
  heroLogo: { position: 'absolute', left: 16, top: 12 },
  heroHanja: { ...sansW('800'), fontSize: 56, lineHeight: 64, color: 'rgba(255,255,255,0.92)', letterSpacing: 4, ...TIGHT },
  eyebrow: { ...sansW('500'), fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.85)', marginTop: 10, ...TIGHT },
  heroTitle: { ...sansW('700'), fontSize: 26, lineHeight: 32, letterSpacing: -1.2, color: colors.white, marginTop: 4, textAlign: 'center', ...TIGHT },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, color: colors.white, ...TIGHT },

  section: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, marginBottom: 16 },
  sectionText: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: INK, flexShrink: 1, ...TIGHT },
  sectionNumber: { color: colors.accent, flexShrink: 0 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 19, letterSpacing: -0.8, color: INK, marginBottom: 8, ...TIGHT },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.65, color: INK, ...TIGHT },
  small: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.6, color: colors.inkMute, marginTop: 8, ...TIGHT },
  bullet: { ...sansW('400'), fontSize: 13, lineHeight: 21, letterSpacing: -0.65, color: INK, ...TIGHT },
  list: { marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  chipText: { ...sansW('600'), fontSize: 12, lineHeight: 15, ...TIGHT },
  sceneHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
});
