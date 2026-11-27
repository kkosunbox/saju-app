import React, { useEffect, useId, useState } from 'react';
import { Image, type ImageSourcePropType, Platform, StyleSheet, type StyleProp, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useReducedMotion } from '../../utils/motion';
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
import SolidIcon from '../../components/SolidIcon';
import { dayStemMascot, type MascotBox } from './dayStemMascots';
import { STEMS } from '../../data/sajuData';
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
const CLOUDS = require('../../../assets/figma/day-stem/clouds.webp');
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
  const tone = toneOf(d);
  const hero = <Hero d={d} nickname={u.nickname} tone={tone} />;
  return (
    <Screen key="result" title={TITLE} back contentStyle={s.content} right={<ShareIconButton spec={spec} />}>
      {/* 말풍선은 칩 아래 내용 위에 떠 있어서 자리를 차지하지 않는다 */}
      <View style={{ zIndex: 10, marginBottom: 12 }}>
        <ProfileSwitch />
        <ProfileHintBubble text="프로필을 추가해서 다른 사람 것도 확인해 보세요" style={{ marginTop: 2 }} />
      </View>
      <FriendCompare route="DayStem" spec={spec} />
      {drawn ? <Reveal>{hero}</Reveal> : hero}

      <CompareCard d={d} tone={tone} />

      <Section title={`${d.stemName}, ${d.image}의 기운`} />
      <View style={s.card}>
        <Text style={s.body}>{d.story}</Text>
        <View style={s.list}>
          {d.strengths.map(line => <Bullet key={line} text={line} color={tone.accent} />)}
        </View>
      </View>

      <Section title="MBTI로 보는 나만의 성향" />
      <View style={[s.card, s.glance]}>
        <View style={s.glanceHead}>
          <SolidIcon name="book" size={20} color={tone.accent} />
          <Text accessibilityRole="header" style={s.glanceTitle}>한눈에 보는 {d.mbti} × {d.stemName}</Text>
        </View>
        {d.meet.map((p, i) => <Text key={i} style={[s.body, { marginTop: i > 0 ? 10 : 6 }]}>{p}</Text>)}
      </View>

      <Section title="상황별 나" />
      <View style={s.scenes}>
        {[['연애할 때', d.love], ['일할 때', d.work], ['친구로서', d.friend]].map(([title, body], i) => (
          <Scene key={title} n={i + 1} title={title} body={body} color={tone.accent} last={i === 2} />
        ))}
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

/** 일간별 색 — 히어로 바탕(위→아래)·구름 테두리빛·태그, 본문 포인트(점·번호·아이콘).
 * 피그마(경금)처럼 짙은 보석색 바탕에 구름은 테두리만 은은하게 빛나도록 */
type Tone = { top: string; bottom: string; cloud: string; tag: string; accent: string };
const TONES: Tone[] = [
  { top: '#001A12', bottom: '#00281B', cloud: '#23855C', tag: '#D8F6E3', accent: '#2E9A60' }, // 갑목
  { top: '#0B1A04', bottom: '#142A07', cloud: '#5F9230', tag: '#E7F5D3', accent: '#5B9430' }, // 을목
  { top: '#280606', bottom: '#3B0D08', cloud: '#C44A2C', tag: '#FFE1D8', accent: '#DE5536' }, // 병화
  { top: '#24041A', bottom: '#370827', cloud: '#C13F76', tag: '#FFDFEA', accent: '#D24C78' }, // 정화
  { top: '#221403', bottom: '#332006', cloud: '#B47D2A', tag: '#FBEBCD', accent: '#B07A26' }, // 무토
  { top: '#1D1208', bottom: '#2B1B0D', cloud: '#A0774A', tag: '#F5E6D5', accent: '#A47648' }, // 기토
  { top: '#000B30', bottom: '#001444', cloud: '#55307E', tag: '#FEE0F6', accent: '#735CB2' }, // 경금 (피그마 원본)
  { top: '#0D0A2A', bottom: '#17123F', cloud: '#6E58B8', tag: '#EAE3FF', accent: '#7F66C6' }, // 신금
  { top: '#000E2E', bottom: '#001A48', cloud: '#2A62B4', tag: '#DBE8FF', accent: '#2D6BCB' }, // 임수
  { top: '#001A22', bottom: '#002934', cloud: '#20879C', tag: '#D5F2F6', accent: '#1A8DA2' }, // 계수
];

function stemIndex(d: DayStemMbti) {
  return Math.max(0, STEMS.findIndex(x => x.hanja === d.hanja[0]));
}
function toneOf(d: DayStemMbti): Tone {
  return TONES[stemIndex(d)];
}

/** 피그마 마스코트(101 칸)에서 캐릭터가 차지하는 자리 — 그림마다 여백이 달라도 캐릭터가 이 칸에 맞게(아래·가운데 기준) 키운다 */
const MASCOT = 101;
const GLOW = 150;
const CHAR = { left: 3, top: 11, right: 92.4, bottom: 92 };
function mascotFit([l, t, r, b]: MascotBox) {
  const w = CHAR.right - CHAR.left;
  const h = CHAR.bottom - CHAR.top;
  const size = Math.min(w / (r - l), h / (b - t));
  return {
    position: 'absolute' as const,
    width: size,
    height: size,
    left: (CHAR.left + CHAR.right) / 2 - size * (l + r) / 2,
    top: CHAR.bottom - size * b,
  };
}

/** 피그마(히어로 폭 327) 기준 — 화면이 넓어지면 마스코트·구름을 폭에 맞춰 키운다 (최대 1.5배) */
const HERO_W = 327;
const MAX_SCALE = 1.5;

function Hero({ d, nickname, tone }: { d: DayStemMbti; nickname: string; tone: Tone }) {
  const mascot = dayStemMascot(d.mbti, d.label.endsWith('남') ? 'male' : 'female', stemIndex(d));
  const [w, setW] = useState(0);
  const k = w ? Math.min(MAX_SCALE, Math.max(1, w / HERO_W)) : 1;
  // 마스코트는 오른쪽 여백 20을 지키고, 세로 중심(32 + 101/2)은 그대로 둔 채 가운데를 기준으로 키운다
  const place = w ? { left: w - 20 - (MASCOT * (k + 1)) / 2, right: undefined, top: 32 } : null;
  const room = { marginRight: MASCOT * k };  // 태그는 넓어져서 마스코트가 내려올 때만 비켜 준다
  return (
    <LinearGradient colors={[tone.top, tone.bottom]} style={s.hero} onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Image source={CLOUDS} style={[s.clouds, { tintColor: tone.cloud }, w ? { height: (w * 195) / HERO_W } : null]} resizeMode="stretch" />
      <View style={s.heroLogo}><Logo height={20} /></View>
      {mascot ? <Mascot source={mascot.source} box={mascot.box} glow={tone.cloud} style={[place, { transform: [{ scale: k }] }]} /> : null}
      <Text style={s.eyebrow}>{nickname}님은</Text>
      <Text accessibilityRole="header" style={[s.heroTitle, room]} numberOfLines={2}>{d.title}</Text>
      <Text style={[s.heroSub, room, { color: tone.tag }]}>{d.isYang ? '양' : '음'}의 {d.stemName.slice(1)} · {d.image}</Text>
      <View style={[s.tags, k > 1 && room]}>{d.tags.map(tag => <View key={tag} style={[s.tag, { borderColor: tone.tag }]}><Text style={[s.tagText, { color: tone.tag }]}>{tag}</Text></View>)}</View>
    </LinearGradient>
  );
}

/** 마스코트 — 뒤에 일간 색 빛무리, 발밑에 옅은 그림자, 천천히 둥실 */
function Mascot({ source, box, glow, style }: { source: ImageSourcePropType; box: MascotBox; glow: string; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    y.value = withRepeat(withTiming(-3, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(y);
  }, [reduced, y]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const shadow = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 + y.value / 30 }], opacity: 1 + y.value / 12 }));
  const gid = useId().replace(/:/g, '');
  return (
    <View style={[s.mascot, style]} pointerEvents="none">
      <Svg width={GLOW} height={GLOW} style={s.glow}>
        <Defs>
          <RadialGradient id={`g${gid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glow} stopOpacity={0.9} />
            <Stop offset="0.5" stopColor={glow} stopOpacity={0.35} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#g${gid})`} />
      </Svg>
      <Animated.View style={[s.shadow, shadow]}>
        <Svg width={60} height={10}>
          <Defs>
            <RadialGradient id={`s${gid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#000000" stopOpacity={0.45} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={30} cy={5} rx={30} ry={5} fill={`url(#s${gid})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, float]}>
        <Image source={source} style={mascotFit(box)} resizeMode="contain" accessibilityIgnoresInvertColors />
      </Animated.View>
    </View>
  );
}

/** MBTI ⊕ 일간 */
function CompareCard({ d, tone }: { d: DayStemMbti; tone: Tone }) {
  return (
    <View style={s.compare}>
      <View style={s.compareCol}>
        <Text style={s.compareSub}>{MBTI_INFO[d.mbti].nickname}</Text>
        <Text style={s.compareMain}>{d.mbti}</Text>
      </View>
      <SolidIcon name="addRound" size={20} color={tone.accent} />
      <View style={s.compareCol}>
        <Text style={s.compareSub}>{d.image}</Text>
        <Text style={s.compareMain}>{d.stemName}({d.hanja})</Text>
      </View>
    </View>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={s.bulletRow}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.bullet}>{text}</Text>
    </View>
  );
}

function Scene({ n, title, body, color, last }: { n: number; title: string; body: string; color: string; last: boolean }) {
  return (
    <View style={[s.scene, !last && s.sceneLine]}>
      <View style={[s.num, { backgroundColor: color }]}><Text style={s.numText}>{n}</Text></View>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={s.sceneTitle}>{title}</Text>
        <Text style={[s.bodyTight, { marginTop: 2 }]}>{body}</Text>
      </View>
    </View>
  );
}

function Section({ title }: { title: string }) {
  return (
    <View style={s.section}>
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
  hero: { borderRadius: radius.lg, overflow: 'hidden', minHeight: 195, paddingTop: 45, paddingBottom: 22, paddingLeft: 20, paddingRight: 20 },
  clouds: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 195 },
  heroLogo: { position: 'absolute', left: 12, top: 6 },
  mascot: { position: 'absolute', right: 20, top: 32, width: MASCOT, height: MASCOT },
  glow: { position: 'absolute', left: (MASCOT - GLOW) / 2, top: (MASCOT - GLOW) / 2 - 2 },
  shadow: { position: 'absolute', left: (MASCOT - 60) / 2 + 2, top: 88 },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', ...TIGHT },
  heroTitle: { ...sansW('700'), fontSize: 30, lineHeight: 36, letterSpacing: -1.5, color: colors.white, marginTop: 8, ...TIGHT },
  heroSub: { ...sansW('600'), fontSize: 14, lineHeight: 18, letterSpacing: -0.7, marginTop: 8, ...TIGHT },
  tags: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 5, borderWidth: 0.5 },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, opacity: 0.8, ...TIGHT },

  compare: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingVertical: 11, borderRadius: radius.lg, backgroundColor: colors.card },
  compareCol: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  compareSub: { ...sansW('400'), fontSize: 12, lineHeight: 18, letterSpacing: -0.6, color: INK, textAlign: 'center', ...TIGHT },
  compareMain: { ...sansW('700'), fontSize: 16, lineHeight: 19, letterSpacing: -0.64, color: isDark ? colors.ink : '#222222', textAlign: 'center', ...TIGHT },

  section: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, marginBottom: 16 },
  sectionText: { ...sansW('800'), fontSize: 16, lineHeight: 19, letterSpacing: -0.64, color: INK, flexShrink: 0, ...TIGHT },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, ...TIGHT },
  bodyTight: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, ...TIGHT },
  list: { marginTop: 8, gap: 2 },
  bulletRow: { flexDirection: 'row' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 8 },
  bullet: { ...sansW('400'), fontSize: 13, lineHeight: 22, letterSpacing: -0.65, color: INK, flex: 1, ...TIGHT },
  glance: { borderRadius: 8 },
  glanceHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glanceTitle: { ...sansW('700'), fontSize: 14, lineHeight: 17, letterSpacing: -0.56, color: isDark ? colors.ink : '#222222', flexShrink: 1, ...TIGHT },
  scenes: { borderRadius: radius.lg, borderWidth: 1, borderColor: isDark ? colors.line : '#E8E8E8', overflow: 'hidden' },
  scene: { flexDirection: 'row', gap: 12, paddingVertical: 10, paddingLeft: 16, paddingRight: 16 },
  sceneLine: { borderBottomWidth: 1, borderBottomColor: isDark ? colors.line : '#E8E8E8' },
  num: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  numText: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: colors.white, ...TIGHT },
  sceneTitle: { ...sansW('700'), fontSize: 13, lineHeight: 16, letterSpacing: -0.52, color: isDark ? colors.ink : '#222222', ...TIGHT },
});
