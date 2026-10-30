import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Screen from '../../components/Screen';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import { ShareIconButton } from '../../components/ShareCta';
import FriendCompare from '../../components/FriendCompare';
import MemoryReveal from '../../components/MemoryReveal';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';
import Mascot, { Logo } from '../../components/Mascot';
import Icon from '../../components/Icon';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { pastLifeSpec } from '../../services/share/shareSpecs';
import { pastLifeStory } from '../../content/pastLife';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

export default function PastLifeScreen() {
  const { user: u } = useApp();
  const q = useFreeContent('past-life');
  const draw = useOpened('past-life');
  const [drawn, setDrawn] = useState(false);
  if (!u) return null;
  if (!q.data || !draw.ready) return <LoadingScreen title="전생 테스트" error={q.error} onRetry={q.refetch} />;
  const P = q.data;
  const story = pastLifeStory(P);
  const spec = pastLifeSpec(u, P);

  if (!draw.opened) {
    return (
      <Screen title="전생 테스트" back>
        <View style={s.introMeta}><Text style={s.kicker}>전생 기록서</Text><Text style={txt.caption}>무료 · 결과 전체 공개</Text></View>
        <Text style={s.introTitle}>처음인 것 같은데,{ '\n' }어쩐지 익숙한 나.</Text>
        <Text style={s.introBody}>{u.nickname}님의 타고난 기운을 한 편의 전생 이야기로 엮었어요. 오래전의 하루와 지금 남아 있는 성향을 만나 보세요.</Text>
        <View style={s.index}>
          <Index number="01" title="어느 시대, 어떤 사람" />
          <Index number="02" title="지금의 나에게 남은 흔적" />
          <Index number="03" title="다시 만날 인연과 이번 생의 과제" />
        </View>
        <View style={s.reveal}>
          <MemoryReveal nickname={u.nickname} era={P.era} role={P.role} line={story.line} onDone={() => { setDrawn(true); draw.open(); }} />
        </View>
        <Text style={s.note}>사주와 성향을 모티브로 만든 창작 콘텐츠예요.</Text>
      </Screen>
    );
  }

  const record = (
    <View style={s.hero}>
      <Image source={require('../../../assets/figma/past-life/hero.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <View style={s.heroLogo}><Logo height={LOGO_H} /></View>
      <Mascot name="pastLife" size={71} />
      <Text style={s.eyebrow}>{u.nickname}님의 오래전 이야기</Text>
      <Text style={s.era}>{P.era}</Text>
      <Text accessibilityRole="header" style={s.name}>{P.role}</Text>
      <Text style={s.recordLine}>{story.line}</Text>
      <View style={s.tags}>{story.keywords.map(word => <View key={word} style={s.tag}><Text style={s.tagText}>{word}</Text></View>)}</View>
    </View>
  );

  return (
    // key: 기록을 연 뒤 새 화면처럼 맨 위부터 보이게
    <Screen key="result" title="전생 테스트" back contentStyle={s.content} right={<ShareIconButton spec={spec} />}>
      <FriendCompare route="PastLife" spec={spec} />
      {drawn ? <Reveal>{record}</Reveal> : record}

      <Section number="01" title={P.era} />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>당신이 살았을 하루</Text>
        <Text style={s.body}>{story.everyday}</Text>
        <View style={s.memory}>
          <View style={s.memoryHead}>
            <Image source={require('../../../assets/figma/saju/mascot.png')} style={s.memoryIcon} contentFit="contain" accessible={false} />
            <Text style={s.memoryLabel}>기억 속 한 장면</Text>
          </View>
          <Text style={s.quote}>“{P.scene}”</Text>
        </View>
      </View>

      <Section number="02" title="그때의 재능, 지금의 성향" />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>시간을 건너 남은 것</Text>
        <Text style={s.trait}>{P.carried}</Text>
        <Text style={s.traitBody}>{story.echo}</Text>
      </View>

      <Section number="03" title="반복하던 마음에서 한 걸음 더" />
      <View style={s.card}>
        <Text accessibilityRole="header" style={s.cardTitle}>이번 생에서는 조금 다르게</Text>
        <Text style={s.trait}>{P.karma}</Text>
        <Text style={s.traitBody}>{story.practice}</Text>
      </View>

      <Section title="다시 만나는 인연" />
      <View style={[s.card, s.bond]}>
        <View style={s.bondHead}>
          <Image source={require('../../../assets/figma/past-life/user.svg')} style={s.bondIcon} contentFit="contain" accessible={false} />
          <Text style={[s.cardTitle, s.bondTitle]}>낯설지 않은 사람, {P.bond}</Text>
        </View>
        <Text style={s.body}>{story.connection}</Text>
        <Text style={s.bondNote}>띠는 이야기의 단서예요. 실제 인연은 함께 쌓는 시간 속에서 알아가세요.</Text>
      </View>

      <ShareActions spec={spec} title="우리, 전생에도 알던 사이일까?" outlined marginTop={16} />

      <View style={[s.card, s.basis]}>
        <Text accessibilityRole="header" style={s.cardTitle}>이 기록은 어떻게 만들었나요?</Text>
        <Text style={s.body}>태어난 해의 띠로 시대와 장소를, 사주 일간의 오행과 MBTI 성향으로 신분을 정해요. 사주의 일주에서 장면과 재능, 과제와 인연의 단서를 가져와 이야기를 덧붙였어요. 처음 펼칠 때의 프로필로 간직하는 창작 이야기예요. 실제 전생이나 역사적 사실을 확인한 결과는 아니에요.</Text>
      </View>

      <PressableScale onPress={() => router.push('/spouse')} style={s.cta} scaleTo={0.98}>
        <View style={s.ctaCopy}><Text style={s.ctaTitle}>이번 생에는 누구를 만날까?</Text><Text style={s.ctaSub}>미래 배우자 이야기 · 첫 화면 무료</Text></View>
        <Icon name="chevronRight" size={16} color={colors.inkMute} />
      </PressableScale>
    </Screen>
  );
}

/** 결과의 장 제목 — 하늘색 번호 + 제목 (Figma 운픽_23) */
function Section({ number, title }: { number?: string; title: string }) {
  return (
    <View style={s.section}>
      {number ? <Text style={[s.sectionText, s.sectionNumber]}>{number}</Text> : null}
      <Text accessibilityRole="header" style={s.sectionText}>{title}</Text>
    </View>
  );
}

function Index({ number, title }: { number: string; title: string }) {
  return <View style={s.indexRow}><Text style={s.indexNumber}>{number}</Text><Text style={txt.bodyStrong}>{title}</Text></View>;
}

// Figma 운픽_23 — 본문 글자는 검정(#000), 다크 모드에서는 ink
const INK = isDark ? colors.ink : '#000000';
const CHIP = '#FFF386';
// 로고 레터링+말풍선이 Figma에서 36×20 — Logo 는 65×55 틀이라 너비 36에 맞춘 높이
const LOGO_H = 36 / 65 * 55;
// Figma 높이(줄 높이 자동 = 글자 크기 × 1.19)와 맞추려고 안드로이드 글꼴 여백을 뺀다
const TIGHT = Platform.OS === 'android' ? { includeFontPadding: false } : {};
const s = StyleSheet.create({
  introMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  kicker: { ...sansW('600'), color: colors.inkMute, fontSize: 12, letterSpacing: 1.2 },
  introTitle: { ...txt.title, fontSize: 29, lineHeight: 40, marginTop: 20 },
  introBody: { ...txt.body, fontSize: 15, lineHeight: 25, marginTop: 14 },
  index: { marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, gap: 14 },
  indexRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  indexNumber: { ...txt.caption, color: colors.inkMute, fontVariant: ['tabular-nums'] },
  reveal: { marginTop: 28 },
  note: { ...txt.caption, textAlign: 'center', marginTop: 16, marginBottom: 12 },

  // 결과 (Figma 운픽_23): 상단 바 바로 아래(y 100)부터, 맨 아래 여백 60
  content: { paddingTop: 0, paddingBottom: 60 },
  hero: { minHeight: 300, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 50, paddingBottom: 33, paddingHorizontal: 16, backgroundColor: '#141A3A' },
  heroLogo: { position: 'absolute', left: 16, top: 12 },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 14, textAlign: 'center', ...TIGHT },
  era: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: CHIP, marginTop: 8, textAlign: 'center', ...TIGHT },
  // Figma 줄 높이 18은 24px 글자에 너무 낮아 29로 두고, 위아래 간격(12 · 11)을 6 · 6으로 줄여 줄 위치를 맞춘다
  name: { ...sansW('700'), fontSize: 24, lineHeight: 29, letterSpacing: -1.2, color: colors.white, marginTop: 6, textAlign: 'center', ...TIGHT },
  recordLine: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.white, marginTop: 6, textAlign: 'center', ...TIGHT },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 11, flexWrap: 'wrap' },
  // Figma 테두리 0.5는 바깥에 그려 크기에 안 들어가므로 안쪽 여백에서 그만큼 뺀다 (18 높이)
  tag: { paddingHorizontal: 3.5, paddingVertical: 1.5, borderRadius: 5, borderWidth: 0.5, borderColor: CHIP },
  tagText: { ...sansW('600'), fontSize: 12, lineHeight: 14, letterSpacing: 0, color: CHIP, opacity: 0.8, ...TIGHT },

  section: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, marginBottom: 16 },
  sectionText: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: -0.9, color: INK, flexShrink: 1, ...TIGHT },
  sectionNumber: { color: colors.accent, flexShrink: 0 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 19, letterSpacing: -0.8, color: INK, marginBottom: 8, ...TIGHT },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, ...TIGHT },
  memory: { marginTop: 8, padding: 12, borderRadius: 6, backgroundColor: colors.surface },
  memoryHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memoryIcon: { width: 19, height: 18 },
  memoryLabel: { ...sansW('600'), fontSize: 13, lineHeight: 16, letterSpacing: -0.65, color: colors.accent, ...TIGHT },
  quote: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, marginTop: 4, ...TIGHT },
  trait: { ...sansW('700'), fontSize: 13, lineHeight: 24, letterSpacing: -0.65, color: colors.inkMute, ...TIGHT },
  // Figma는 본문 첫 줄만 줄 높이 24 — 그만큼(위 3) 띄운다
  traitBody: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: INK, marginTop: 3, ...TIGHT },
  bond: { backgroundColor: isDark ? colors.moneyBg : '#FFFAF1' },
  bondHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  bondIcon: { width: 20, height: 20 },
  bondTitle: { marginBottom: 0, flexShrink: 1 },
  bondNote: { ...sansW('400'), fontSize: 12, lineHeight: 17, letterSpacing: -0.6, color: colors.inkMute, marginTop: 8, ...TIGHT },
  basis: { marginTop: 16 },
  cta: { marginTop: 16, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaCopy: { flex: 1 },
  ctaTitle: { ...sansW('600'), fontSize: 14, lineHeight: 16, letterSpacing: -0.56, color: isDark ? colors.ink : '#222222', ...TIGHT },
  ctaSub: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, marginTop: 4, ...TIGHT },
});
