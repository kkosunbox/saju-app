import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Screen from '../../components/Screen';
import PressableScale from '../../components/PressableScale';
import ShareActions from '../../components/ShareActions';
import FriendCompare from '../../components/FriendCompare';
import ScrollUnroll from '../../components/ScrollUnroll';
import Reveal from '../../components/Reveal';
import { useOpened } from '../../services/content/opened';
import BrandMark from '../../components/BrandMark';
import Mascot from '../../components/Mascot';
import { useApp } from '../../context/AppContext';
import { useFreeContent } from '../../services/server/contentApi';
import LoadingScreen from '../../components/LoadingScreen';
import { pastLifeSpec } from '../../services/share/shareSpecs';
import { pastLifeStory } from '../../content/pastLife';
import { colors } from '../../theme/colors';
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
        <Text style={s.unrollLabel}>당신의 기록이 도착했어요</Text>
        <ScrollUnroll onDone={() => { setDrawn(true); draw.open(); }}>
          <Mascot name="pastLife" size={56} />
          <Text style={s.eyebrow}>{u.nickname}님의 전생 기록</Text>
          <Text style={s.scrollName}>{P.role}</Text>
          <Text style={s.era}>{P.era}</Text>
          <Text style={s.scrollLine}>{story.line}</Text>
        </ScrollUnroll>
        <Text style={s.note}>사주와 성향을 모티브로 만든 창작 콘텐츠예요.</Text>
      </Screen>
    );
  }

  const record = (
    <View style={s.record}>
      <View style={s.recordTop}><BrandMark light size={15} /><Text style={s.recordLabel}>전생 기록서 · 前生</Text></View>
      <View style={s.emblem} accessible={false}>
        <View style={s.orbit} />
        <View style={s.orbitInner} />
        <Mascot name="pastLife" size={88} />
      </View>
      <Text style={s.eyebrow}>{u.nickname}님의 오래전 이야기</Text>
      <Text style={s.era}>{P.era}</Text>
      <Text accessibilityRole="header" style={s.name}>{P.role}</Text>
      <Text style={s.recordLine}>{story.line}</Text>
      <View style={s.tags}>{story.keywords.map(word => <Text key={word} style={s.tag}>{word}</Text>)}</View>
      <View style={s.recordBottom}><Text style={s.recordFoot}>그때의 기질이, 지금의 나에게.</Text><Text style={s.seal}>前</Text></View>
    </View>
  );

  return (
    <Screen title="전생 테스트" back>
      <FriendCompare route="PastLife" spec={spec} />
      {drawn ? <Reveal>{record}</Reveal> : record}

      <Chapter number="01" title="당신이 살았을 하루" subtitle={P.era}>
        <Text style={s.body}>{story.everyday}</Text>
        <View style={s.memory}>
          <Text style={s.memoryLabel}>기억 속 한 장면</Text>
          <Text style={s.quote}>“{P.scene}”</Text>
        </View>
      </Chapter>

      <Chapter number="02" title="시간을 건너 남은 것" subtitle="그때의 재능, 지금의 성향">
        <Text style={s.trait}>{P.carried}</Text>
        <Text style={s.body}>{story.echo}</Text>
      </Chapter>

      <Chapter number="03" title="이번 생에서는 조금 다르게" subtitle="반복하던 마음에서 한 걸음 더">
        <Text style={s.trait}>{P.karma}</Text>
        <Text style={s.body}>{story.practice}</Text>
      </Chapter>

      <View style={s.bond}>
        <Text style={s.kicker}>다시 만나는 인연</Text>
        <Text style={s.bondTitle}>낯설지 않은 사람, {P.bond}</Text>
        <Text style={s.body}>{story.connection}</Text>
        <Text style={s.bondNote}>띠는 이야기의 단서예요. 실제 인연은 함께 쌓는 시간 속에서 알아가세요.</Text>
      </View>

      <ShareActions spec={spec} title="우리, 전생에도 알던 사이일까?" />

      <View style={s.basis}>
        <Text style={txt.h3}>이 기록은 어떻게 만들었나요?</Text>
        <Text style={s.basisBody}>태어난 해의 띠로 시대와 장소를, 사주 일간의 오행과 MBTI 성향으로 신분을 정해요. 사주의 일주에서 장면과 재능, 과제와 인연의 단서를 가져와 이야기를 덧붙였어요.</Text>
        <Text style={s.basisBody}>처음 펼칠 때의 프로필로 간직하는 창작 이야기예요. 실제 전생이나 역사적 사실을 확인한 결과는 아니에요.</Text>
      </View>

      <PressableScale onPress={() => router.push('/spouse')} style={s.cta} scaleTo={0.98}>
        <View style={s.ctaCopy}><Text style={txt.h3}>이번 생에는 누구를 만날까?</Text><Text style={s.ctaSub}>미래 배우자 이야기 · 첫 화면 무료</Text></View>
        <Text style={s.arrow}>→</Text>
      </PressableScale>
    </Screen>
  );
}

function Index({ number, title }: { number: string; title: string }) {
  return <View style={s.indexRow}><Text style={s.indexNumber}>{number}</Text><Text style={txt.bodyStrong}>{title}</Text></View>;
}

function Chapter({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={s.chapter}>
      <View style={s.chapterMeta}><Text style={s.chapterNumber}>{number}</Text><Text style={s.chapterSubtitle}>{subtitle}</Text></View>
      <Text accessibilityRole="header" style={s.chapterTitle}>{title}</Text>
      {children}
    </View>
  );
}

const GOLD = '#D8C393';
const s = StyleSheet.create({
  introMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  kicker: { ...sansW('600'), color: colors.inkMute, fontSize: 12, letterSpacing: 1.2 },
  introTitle: { ...txt.title, fontSize: 29, lineHeight: 40, marginTop: 20 },
  introBody: { ...txt.body, fontSize: 15, lineHeight: 25, marginTop: 14 },
  index: { marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, gap: 14 },
  indexRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  indexNumber: { ...txt.caption, color: colors.inkMute, fontVariant: ['tabular-nums'] },
  unrollLabel: { ...txt.small, marginTop: 28, marginBottom: 18, textAlign: 'center' },
  note: { ...txt.caption, textAlign: 'center', marginTop: 16, marginBottom: 12 },
  record: { backgroundColor: colors.heroBg, borderRadius: radius.lg, padding: 24, alignItems: 'center', marginTop: 4, overflow: 'hidden' },
  recordTop: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  recordLabel: { ...sansW('500'), fontSize: 11, letterSpacing: 1, color: GOLD },
  emblem: { height: 150, width: 150, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  orbit: { position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 1, borderColor: 'rgba(216,195,147,0.28)', transform: [{ scaleX: 0.8 }, { rotate: '35deg' }] },
  orbitInner: { position: 'absolute', width: 116, height: 116, borderRadius: 58, borderWidth: 1, borderColor: 'rgba(216,195,147,0.18)', backgroundColor: 'rgba(216,195,147,0.04)' },
  eyebrow: { ...sansW('500'), color: '#BBC0CF', fontSize: 13, marginTop: 10 },
  name: { ...sansW('700'), color: colors.white, fontSize: 32, lineHeight: 43, letterSpacing: -1.2, marginTop: 6, textAlign: 'center' },
  scrollName: { ...sansW('700'), color: colors.white, fontSize: 28, lineHeight: 38, marginTop: 8, textAlign: 'center' },
  era: { ...sansW('500'), color: GOLD, fontSize: 13, lineHeight: 20, marginTop: 12, textAlign: 'center' },
  recordLine: { ...sansW('400'), color: '#D5D8E2', fontSize: 14, lineHeight: 23, marginTop: 14, textAlign: 'center' },
  scrollLine: { color: '#D5D8E2', fontSize: 14, lineHeight: 23, marginTop: 16, textAlign: 'center' },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 22, flexWrap: 'wrap' },
  tag: { ...sansW('500'), color: GOLD, fontSize: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: 'rgba(216,195,147,0.09)' },
  recordBottom: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderColor: 'rgba(216,195,147,0.18)', gap: 8 },
  recordFoot: { ...sansW('400'), fontSize: 11, color: '#BBC0CF', flexShrink: 1 },
  seal: { ...sansW('600'), fontSize: 16, color: GOLD, borderWidth: 1, borderColor: GOLD, padding: 4 },
  chapter: { marginTop: 32, paddingBottom: 28, borderBottomWidth: 1, borderColor: colors.line },
  chapterMeta: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  chapterNumber: { ...sansW('600'), fontSize: 13, color: colors.inkMute, fontVariant: ['tabular-nums'] },
  chapterSubtitle: { ...txt.caption, flexShrink: 1 },
  chapterTitle: { ...txt.h2, fontSize: 21, lineHeight: 30, marginTop: 10, marginBottom: 16 },
  body: { ...txt.body, fontSize: 15, lineHeight: 27 },
  memory: { marginTop: 20, padding: 18, borderLeftWidth: 2, borderLeftColor: colors.lineStrong, backgroundColor: colors.card },
  memoryLabel: { ...txt.caption, marginBottom: 8 },
  quote: { ...txt.bodyStrong, lineHeight: 25 },
  trait: { ...txt.h3, lineHeight: 25, marginBottom: 10 },
  bond: { marginTop: 28, padding: 22, borderRadius: radius.lg, backgroundColor: colors.card },
  bondTitle: { ...txt.h2, marginTop: 10, marginBottom: 14 },
  bondNote: { ...txt.caption, lineHeight: 20, marginTop: 16 },
  basis: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: colors.line },
  basisBody: { ...txt.small, lineHeight: 22, marginTop: 12 },
  cta: { marginTop: 24, paddingVertical: 20, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaCopy: { flex: 1 },
  ctaSub: { ...txt.small, marginTop: 6 },
  arrow: { fontSize: 24, color: colors.ink },
});
