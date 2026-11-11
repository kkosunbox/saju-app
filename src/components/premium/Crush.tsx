/** 프리미엄: 그 사람의 속마음 (궁합 결과 화면 안) — 온도·가능성·흐름·날짜는 서버 계산값, 풀이 글은 AI */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Card from '../Card';
import ScoreRing from '../ScoreRing';
import { ActRow, Bullet, Hero, Para, SoftCard, SubHead, heroTxt } from './Kit';
import { Closing } from './SajuParts';
import { PartPending, ReadingBanner } from './Reading';
import { ReadingPart, useReadingSections } from './ReadingGate';
import { parseISO, weekdayOf } from '../../utils/date';
import { WEEK } from '../../services/premium/helpers';
import { CompatibilityResult } from '../../types';
import { CrushReport } from '../../types/premium';
import { CrushReading, ReadingView } from '../../types/reading';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

export default function CrushView({ r, R, reading, onRetry, shareAction }: {
  r: CompatibilityResult; R: CrushReport; reading: ReadingView<CrushReading> | null; onRetry(): void; shareAction?: React.ReactNode;
}) {
  const writing = reading?.status === 'writing';
  const { heart, approach } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  // C방식: 아직 안 쓴 파트의 섹션은 숨기고 그 자리에 로딩 카드 하나
  const S = useReadingSections(reading, 'crush');
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}><SubHead variant="figma" title={`${r.target.nickname}님의 속마음`} caption="두 사람의 사주와 성향으로 본 마음의 경향" /></View>
        {shareAction}
      </View>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      <ReadingPart s={S} part="heart" lead>
      <Hero style={{ marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ScoreRing score={R.temp} size={100} stroke={8} label="마음 온도" />
        <View style={{ flex: 1 }}>
          <Text style={heroTxt.eyebrow}>나를 이렇게 느껴요 · {R.tg}</Text>
          <Text style={s.heroSummary}>{heart?.headline ?? R.oneLine}</Text>
        </View>
      </Hero>
      <View style={s.chance}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>연인으로 발전할 가능성</Text>
        <Text style={{ ...sansW('600'), fontSize: 22, color: colors.love }}>{R.chance}%</Text>
      </View>
      {heart ? <Card style={{ marginTop: 12 }}><Para mt={0}>{heart.summary}</Para></Card> : null}

      <SubHead variant="figma" title="01 · 그 사람에게 나는" />
      <Card>
        <Text style={txt.h3}>{R.tg} — 이런 사람으로 느끼기 쉬워요</Text>
        {heart ? <Para>{heart.feel}</Para> : pending(3)}
        <Text style={[s.label, { marginTop: 14 }]}>나에게 끌리는 이유</Text>
        {heart ? <Para mt={4}>{heart.pull}</Para> : pending(2)}
        <Text style={[s.label, { marginTop: 14 }]}>망설이기 쉬운 이유</Text>
        {heart ? <Para mt={4}>{heart.hesitate}</Para> : pending(2)}
      </Card>

      <SubHead variant="figma" title="02 · 그 사람의 호감 신호" caption={r.target.mbti ? `${r.target.mbti} 성향이 마음을 보일 때` : '그 사람이 마음을 보일 때'} />
      <Card style={{ gap: 10 }}>{heart ? heart.signals.map(t => <ActRow variant="figma" key={t} icon="sparkle">{t}</ActRow>) : pending(4)}</Card>
      </ReadingPart>

      <ReadingPart s={S} part="approach" lead>

      <SubHead variant="figma" title="03 · 관계의 속도" />
      <Card>
        <Text style={txt.h3}>{R.pace[0]}</Text>
        {approach ? <Para>{approach.pace}</Para> : pending(3)}
        <Text style={[txt.h3, { marginTop: 16 }]}>오해가 생기기 쉬운 지점</Text>
        {approach ? <Para>{approach.misunderstand}</Para> : pending(3)}
      </Card>

      <SubHead variant="figma" title="04 · 앞으로 3개월 관계 흐름" />
      <FlowChart flow={R.flow} />
      {approach ? <Card style={{ marginTop: 10 }}>{approach.flow.map((t, i) => <Bullet key={i} color={colors.love}>{`${R.flow[i]?.label} · ${dropLeadMonth(t)}`}</Bullet>)}</Card> : null}

      <SubHead variant="figma" title="05 · 연락하기 좋은 날" caption="앞으로 3주 중 두 사람의 연애 흐름이 겹치는 날" />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {R.contact.map(c => (
          <View key={c.iso} style={s.day}>
            <Text style={s.dayDate}>{parseISO(c.iso).m}/{parseISO(c.iso).d}</Text>
            <Text style={s.dayWeek}>{WEEK[weekdayOf(c.iso)]}요일</Text>
          </View>
        ))}
      </View>
      <Card style={{ marginTop: 10 }}>
        <Text style={txt.caption}>마음을 표현하기 가장 좋은 날 · 앞으로 60일 중</Text>
        <Text style={{ ...sansW('600'), fontSize: 20, color: colors.love, marginTop: 4 }}>{R.confess.label}</Text>
        <Text style={[txt.small, { marginTop: 4 }]}>{R.confess.time}</Text>
        {approach ? <Para mt={10}>{approach.contact}</Para> : pending(2)}
      </Card>

      <SubHead variant="figma" title="06 · 이렇게 다가가 보세요" />
      <Card style={{ gap: 10 }}>
        {approach ? (
          <>
            {approach.dos.map(t => <ActRow variant="figma" key={t}>{t}</ActRow>)}
            {approach.donts.map(t => <ActRow variant="figma" key={t} ok={false}>{t}</ActRow>)}
          </>
        ) : pending(5)}
      </Card>
      {approach ? (
        <>
          <Card style={{ marginTop: 10 }}>
            <Text style={txt.h3}>잘 통하는 대화 주제</Text>
            <View style={{ marginTop: 6 }}>{approach.topics.map(t => <Bullet key={t}>{t}</Bullet>)}</View>
          </Card>
          <SoftCard style={{ marginTop: 10 }}>
            <Text style={[txt.h3, { color: colors.purple }]}>이렇게 먼저 연락해 보세요</Text>
            <View style={{ gap: 8, marginTop: 10 }}>{approach.messages.map(m => <Text key={m} style={{ ...sansW('400'), fontSize: 14, lineHeight: 22, letterSpacing: -0.5, color: colors.ink }}>{m}</Text>)}</View>
          </SoftCard>
          <Closing title="마지막 한마디" top={3} style={{ minHeight: 92 }}>{approach.closing}</Closing>
        </>
      ) : null}
      </ReadingPart>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>재미로 보는 콘텐츠예요. 상대의 진짜 마음은 대화로 확인해 주세요.</Text>
    </>
  );
}

/** 앞에 "11월 · "을 붙이니, 이미 쓴 풀이가 "11월은 …"으로 시작하면 그 달 이름은 뗀다 */
const dropLeadMonth = (t: string) => t.replace(/^\s*\d{1,2}월(은|는|에는)\s+/, '');

/**
 * 앞으로 3개월 관계 흐름 — 달마다 칸 가운데 점을 이은 선 그래프 (피그마 카드 327×130).
 * 가장 높은 달은 빨간 말풍선, 나머지는 회색. 점수 차는 작아도 보이게 1점에 최대 8px, 위아래 폭은 20px까지.
 */
const CH = { h: 130, top: 53, base: 88, label: 92, maxDrop: 20 };
const FLOW_RED = colors.love;
const FLOW_GREY = isDark ? colors.lavender : '#E2E5EA';
function FlowChart({ flow }: { flow: { label: string; v: number }[] }) {
  const [w, setW] = useState(0);
  const mx = Math.max(...flow.map(f => f.v)), mn = Math.min(...flow.map(f => f.v));
  const k = mx === mn ? 0 : Math.min(8, CH.maxDrop / (mx - mn));
  const col = w / Math.max(flow.length, 1);
  const pts = flow.map((f, i) => ({ ...f, x: col * (i + 0.5), y: CH.top + (mx - f.v) * k, top: f.v === mx }));
  // 이웃한 두 점 사이를 가로 방향 접선으로 부드럽게
  const curve = pts.map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`;
    const q = pts[i - 1], dx = (p.x - q.x) / 2;
    return `C${q.x + dx} ${q.y} ${p.x - dx} ${p.y} ${p.x} ${p.y}`;
  }).join(' ');
  const first = pts[0], last = pts[pts.length - 1];
  return (
    <Card style={s.flowCard}>
      <View style={StyleSheet.absoluteFill} onLayout={e => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={flow.map(f => `${f.label} ${f.v}점`).join(', ')}>
        {w > 0 && pts.length ? (
          <>
            <Svg width={w} height={CH.h} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="crushFlowArea" x1="0" y1={Math.min(...pts.map(p => p.y))} x2="0" y2={CH.base} gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor={FLOW_RED} stopOpacity={0.24} />
                  <Stop offset="1" stopColor={FLOW_RED} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={`${curve} L${last.x} ${CH.base} L${first.x} ${CH.base} Z`} fill="url(#crushFlowArea)" />
              {pts.map(p => <Line key={p.label} x1={p.x} y1={p.y + 5} x2={p.x} y2={CH.base} stroke={isDark ? colors.inkMute : '#C9C9C9'} strokeWidth={1} strokeDasharray="2 2" />)}
              <Path d={curve} stroke={FLOW_RED} strokeWidth={2} fill="none" strokeLinecap="round" />
              {pts.map(p => <Circle key={p.label} cx={p.x} cy={p.y} r={3.5} fill={colors.white} stroke={FLOW_RED} strokeOpacity={p.top ? 1 : 0.55} strokeWidth={2} />)}
            </Svg>
            {pts.map(p => (
              <View key={p.label} style={[s.flowTag, { left: p.x - col / 2, width: col, top: p.y - 30 }]}>
                <View style={[s.flowBubble, { backgroundColor: p.top ? FLOW_RED : FLOW_GREY }]}>
                  <Text style={[s.flowScore, p.top ? { color: colors.white } : { ...sansW('500'), fontWeight: '500', color: colors.ink }]}>{p.v}</Text>
                </View>
                <View style={[s.flowTail, { borderTopColor: p.top ? FLOW_RED : FLOW_GREY }]} />
              </View>
            ))}
            {pts.map((p, i) => <Text key={p.label} style={[s.flowMonth, { left: col * i, width: col }]}>{p.label}</Text>)}
          </>
        ) : null}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  flowCard: { height: CH.h, padding: 0 },
  flowTag: { position: 'absolute', alignItems: 'center' },
  flowBubble: { height: 18, minWidth: 36, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  flowScore: { ...sansW('700'), fontSize: 14, lineHeight: 18, fontWeight: '700', letterSpacing: -0.56, fontVariant: ['tabular-nums'] },
  flowTail: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  flowMonth: { ...sansW('400'), position: 'absolute', top: CH.label, textAlign: 'center', fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  heroSummary: { ...heroTxt.summ, ...sansW('600') },
  chance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  day: { flex: 1, minHeight: 63, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: isDark ? colors.loveBg : '#FFE7E7' },
  dayDate: { ...sansW('700'), fontSize: 18, lineHeight: 21, fontWeight: '700', letterSpacing: -0.72, color: colors.blood },
  dayWeek: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
});
