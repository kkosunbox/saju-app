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
import Icon from '../../components/Icon';
import SolidIcon, { type SolidIconName } from '../../components/SolidIcon';
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
        <View style={s.stemHead}>
          <View style={[s.stemSeal, { backgroundColor: d.colorHex }]}><Text style={s.stemSealText}>{d.hanja.slice(0, 1)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.stemName}>{d.stemName} · {d.image}</Text>
            <Text style={s.stemSub}>{d.isYang ? '양' : '음'}의 {ELEMENT_KO[d.element]} 기운</Text>
          </View>
        </View>
        <Text style={s.story}>{d.story}</Text>
        <View style={s.divider} />
        <Text style={s.label}>타고난 강점</Text>
        {d.strengths.map(line => (
          <View key={line} style={s.checkRow}>
            <View style={[s.checkDot, { backgroundColor: tint(d.colorHex) }]}><Icon name="check" size={12} color={d.colorHex} /></View>
            <Text style={s.checkText}>{line}</Text>
          </View>
        ))}
      </View>

      <Section number="02" title={`${d.mbti}와 ${d.label}`} />
      <View style={{ gap: 8 }}>
        {meetBlocks(d).map(b => <TraitBlock key={b.letter} {...b} color={d.colorHex} />)}
      </View>

      <Section number="03" title="상황별 나" />
      <View style={{ gap: 8 }}>
        <Scene icon="heartFill" color={colors.love} bg={colors.loveBg} title="연애할 때" body={d.love} />
        <Scene icon="work" color={colors.accent} bg={colors.accentSoft} title="일할 때" body={d.work} />
        <Scene icon="friend" color={colors.money} bg={colors.moneyBg} title="친구로서" body={d.friend} />
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

const ELEMENT_KO = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' } as const;
/** 오행 색을 옅게 깐 바탕 */
const tint = (hex: string) => `${hex}${isDark ? '33' : '1F'}`;

/** MBTI 한 글자 → 우리말 이름과 이 덩어리가 말하는 장면 */
const LETTER: Record<string, [string, string]> = {
  E: ['외향', '사람을 대할 때'], I: ['내향', '사람을 대할 때'],
  N: ['직관', '생각하는 방식'], S: ['감각', '생각하는 방식'],
  T: ['사고', '결정할 때'], F: ['감정', '결정할 때'],
  J: ['판단', '하루를 보내는 방식'], P: ['인식', '하루를 보내는 방식'],
};

/** 2번 섹션 덩어리 — 서버가 MBTI 네 글자 순서대로 준다 (예전 결과는 세 문단이라 글자 없이 그린다) */
function meetBlocks(d: DayStemMbti): { letter: string; word?: string; scene?: string; text: string }[] {
  if (d.meet.length !== 4) return d.meet.map((text, i) => ({ letter: String(i), text }));
  return d.meet.map((text, i) => {
    const letter = d.mbti[i];
    return { letter, word: LETTER[letter][0], scene: LETTER[letter][1], text };
  });
}

/** 첫 문장은 굵게 (한눈에 읽히게), 나머지는 풀이 */
function splitLead(text: string): [string, string] {
  const m = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  return m ? [m[1], m[2]] : [text, ''];
}

function TraitBlock({ letter, word, scene, text, color }: { letter: string; word?: string; scene?: string; text: string; color: string }) {
  const [lead, rest] = splitLead(text);
  return (
    <View style={s.card}>
      {word ? (
        <View style={s.blockHead}>
          <View style={[s.letter, { backgroundColor: tint(color) }]}><Text style={[s.letterText, { color: isDark ? colors.ink : color }]}>{letter}</Text></View>
          <Text style={s.blockLabel}>{word} · {scene}</Text>
        </View>
      ) : null}
      <Text style={s.lead}>{lead}</Text>
      {rest ? <Text style={s.rest}>{rest}</Text> : null}
    </View>
  );
}

function Scene({ icon, color, bg, title, body }: { icon: SolidIconName; color: string; bg: string; title: string; body: string }) {
  const [lead, rest] = splitLead(body);
  return (
    <View style={s.card}>
      <View style={s.blockHead}>
        <View style={[s.sceneIcon, { backgroundColor: bg }]}><SolidIcon name={icon} size={16} color={color} /></View>
        <Text accessibilityRole="header" style={s.sceneTitle}>{title}</Text>
      </View>
      <Text style={s.lead}>{lead}</Text>
      {rest ? <Text style={s.rest}>{rest}</Text> : null}
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
  stemHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stemSeal: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  stemSealText: { ...sansW('800'), fontSize: 24, lineHeight: 28, color: colors.white, ...TIGHT },
  stemName: { ...sansW('700'), fontSize: 17, lineHeight: 22, letterSpacing: -0.8, color: INK, ...TIGHT },
  stemSub: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.5, color: colors.inkMute, marginTop: 2, ...TIGHT },
  story: { ...sansW('400'), fontSize: 14, lineHeight: 22, letterSpacing: -0.6, color: INK, marginTop: 14, ...TIGHT },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong, marginVertical: 14 },
  label: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.4, color: colors.inkMute, marginBottom: 8, ...TIGHT },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkText: { ...sansW('500'), fontSize: 14, lineHeight: 20, letterSpacing: -0.6, color: INK, flex: 1, ...TIGHT },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  letter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  letterText: { ...sansW('800'), fontSize: 15, lineHeight: 18, ...TIGHT },
  blockLabel: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.4, color: colors.inkMute, ...TIGHT },
  sceneIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sceneTitle: { ...sansW('700'), fontSize: 15, lineHeight: 20, letterSpacing: -0.6, color: INK, ...TIGHT },
  lead: { ...sansW('700'), fontSize: 15, lineHeight: 22, letterSpacing: -0.7, color: INK, ...TIGHT },
  rest: { ...sansW('400'), fontSize: 14, lineHeight: 22, letterSpacing: -0.6, color: isDark ? colors.inkSub : '#4F4F4F', marginTop: 6, ...TIGHT },
});
