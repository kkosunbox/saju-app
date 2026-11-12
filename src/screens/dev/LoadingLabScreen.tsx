/**
 * 로딩 연출 비교 (개발용) — 상세사주 화면을 본뜬 가짜 화면에서, 풀이를 기다리는 연출만 바꿔 본다.
 * 서버 호출 없이 정해진 시간표대로 파트가 하나씩 완성된다.
 * 라우트(src/app/dev/loading.tsx)는 로컬 개발 서버(__DEV__)에서만 이 화면을 연다. 배포 번들에는 들어가지 않는다.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import Segmented from '../../components/Segmented';
import Reveal from '../../components/Reveal';
import { Hero, heroTxt } from '../../components/premium/Kit';
import { Bullet, Para, SajuHeading, SubHead, Tip } from '../../components/premium/SajuParts';
import { PartPending, ProgressCard } from '../../components/premium/Reading';
import {
  FloatingReadingPill, FullReadingLoader, LoaderStep, ScrollMascot, StepReadingLoader, TypeReveal, WritingPlaceholder, ReadingWritingCard,
} from '../../components/premium/ReadingLoaders';
import { colors } from '../../theme/colors';
import { sansW } from '../../theme/typography';

type Mode = 'current' | 'full' | 'steps' | 'stream';
type Part = 'core' | 'structure' | 'fields' | 'flow';

const MODES: { key: Mode; name: string; desc: string }[] = [
  { key: 'current', name: '지금 방식', desc: '본문은 바로 보이고, 위에 진행 카드 · 각 섹션에 회색 막대' },
  { key: 'full', name: 'A. 전체 로딩 화면', desc: '두루마리 마스코트 + 바뀌는 문구 + 진행률. 다 쓰면 본문을 한 번에' },
  { key: 'steps', name: 'B. 단계 체크리스트', desc: '쓰는 파트를 목록으로 보여 주고 하나씩 체크. AI 앱의 "생각 단계" 방식' },
  { key: 'stream', name: 'C. 순차 등장', desc: '본문은 바로, 다 쓴 파트부터 글자가 써지듯. 아래에 떠 있는 진행 알약' },
];

/** 파트가 완성되는 시점 (전체 시간에 대한 비율) — 서버는 파트를 동시에 써서 순서가 섞인다 */
const SCHEDULE: [Part, number][] = [['core', 0.32], ['fields', 0.58], ['structure', 0.8], ['flow', 1]];
const PART_STEP: Record<Part, { label: string; sub: string }> = {
  core: { label: '타고난 성품', sub: '겉모습 · 속마음 · 강점' },
  structure: { label: '오행과 용신', sub: '다섯 기운의 균형 · 신강약' },
  fields: { label: '분야별 운', sub: '연애 · 재물 · 일 · 관계 · 건강' },
  flow: { label: '대운과 개운법', sub: '지금의 10년 · 다음 10년' },
};
const MESSAGES = ['타고난 성품을 읽고 있어요', '오행의 균형을 재고 있어요', '분야별 운을 살피고 있어요', '대운의 흐름을 펼치는 중이에요', '두루마리에 정성껏 적고 있어요'];

function useFakeReading(totalMs: number) {
  const [done, setDone] = useState<Set<Part>>(new Set());
  useEffect(() => {
    const ts = SCHEDULE.map(([p, f]) => setTimeout(() => setDone(d => new Set(d).add(p)), f * totalMs));
    return () => ts.forEach(clearTimeout);
  }, [totalMs]);
  return done;
}

export default function LoadingLabScreen() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [secs, setSecs] = useState<'10' | '30'>('10');
  const [run, setRun] = useState(0);

  // 다시 보기 = 화면을 새로 그려 처음부터
  if (mode) return <Demo key={run} mode={mode} totalMs={Number(secs) * 1000} onBack={() => setMode(null)} onReplay={() => setRun(r => r + 1)} />;

  return (
    <Screen title="로딩 연출 비교" back>
      <Text style={s.lead}>상세사주를 연 직후, AI 풀이를 기다리는 장면만 따로 볼 수 있어요. 서버 없이 정해진 시간표로 4개 파트가 차례로 완성돼요.</Text>
      <View style={{ marginTop: 20 }}>
        <Text style={s.label}>풀이 시간</Text>
        <View style={{ marginTop: 8 }}>
          <Segmented options={[{ key: '10', label: '짧게 10초' }, { key: '30', label: '실제처럼 30초' }]} value={secs} onChange={v => setSecs(v as '10' | '30')} />
        </View>
      </View>
      <View style={{ gap: 12, marginTop: 24 }}>
        {MODES.map(m => (
          <Card key={m.key} onPress={() => setMode(m.key)} accessibilityLabel={`${m.name} 보기`}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{m.name}</Text>
                <Text style={s.desc}>{m.desc}</Text>
              </View>
              <Text style={s.go}>보기 →</Text>
            </View>
          </Card>
        ))}
      </View>
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <ScrollMascot size={96} />
      </View>
    </Screen>
  );
}

function Demo({ mode, totalMs, onBack, onReplay }: { mode: Mode; totalMs: number; onBack(): void; onReplay(): void }) {
  const done = useFakeReading(totalMs);
  const count = done.size;
  const total = SCHEDULE.length;
  const finished = count >= total;
  const meta = MODES.find(m => m.key === mode)!;
  const replay = <PressableScale onPress={onReplay} style={s.replay} scaleTo={0.94}><Text style={s.replayText}>다시 보기</Text></PressableScale>;

  // B는 다 쓰고 나서 "다 썼어요"를 잠깐 보여 준 뒤 본문으로
  const [stepsHold, setStepsHold] = useState(true);
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => setStepsHold(false), 900);
    return () => clearTimeout(t);
  }, [finished]);

  const fullScreen = (mode === 'full' && !finished) || (mode === 'steps' && (!finished || stepsHold));

  if (fullScreen) {
    return (
      <Screen title="상세사주 해석" onBack={onBack} right={replay} scroll={false}>
        {mode === 'full'
          ? <FullReadingLoader title="운픽님의 사주를 풀고 있어요" done={count} total={total} messages={MESSAGES} />
          : <StepReadingLoader title="운픽님의 사주를 풀고 있어요" steps={SCHEDULE.map(([k]): LoaderStep => ({ key: k, ...PART_STEP[k], done: done.has(k) }))} note="화면을 나가셔도 괜찮아요. 완료되면 알려드릴게요." />}
      </Screen>
    );
  }

  const body = <MockSaju mode={mode} done={done} />;
  return (
    <View style={{ flex: 1 }}>
      <Screen title="상세사주 해석" onBack={onBack} right={replay}>
        <View style={s.tag}><Text style={s.tagText}>{meta.name}</Text></View>
        {mode === 'full' || mode === 'steps' ? <Reveal>{body}</Reveal> : body}
        <View style={{ height: 96 }} />
      </Screen>
      {mode === 'stream' ? <FloatingReadingPill done={count} total={total} /> : null}
    </View>
  );
}

/* ---------- 상세사주 화면을 본뜬 본문 ---------- */

const PILLARS: [string, string, [string, string, string], [string, string, string]][] = [
  ['시주', '편재', ['壬', '임', '#3D79D4'], ['子', '자 · 쥐', '#3D79D4']],
  ['일주', '일간', ['戊', '무', '#FCBD51'], ['午', '오 · 말', '#E54D4D']],
  ['월주', '정관', ['乙', '을', '#5FB8A8'], ['卯', '묘 · 토끼', '#5FB8A8']],
  ['년주', '편인', ['丙', '병', '#E54D4D'], ['寅', '인 · 호랑이', '#5FB8A8']],
];
const ELS: [string, string, number][] = [['목(木)', '#5FB884', 3], ['화(火)', '#E54D4D', 2], ['토(土)', '#FE8828', 1], ['금(金)', '#2885FE', 0], ['수(水)', '#1E53A2', 2]];

const TEXT = {
  headline: '단단한 산처럼 묵묵히 곁을 지키는 사람',
  summary: '무오일주는 큰 산 위에 뜬 해예요. 쉽게 흔들리지 않는 중심과 사람을 데우는 온기를 함께 가졌어요. 다만 한번 정한 길을 고집하는 면이 있어 가끔은 주변의 속도에 맞춰 보는 연습이 필요해요.',
  outer: '처음 만난 사람에게는 말수가 적고 차분해 보여요. 하지만 일이 시작되면 누구보다 먼저 책임을 지는 사람이라, 함께 일한 사람일수록 당신을 믿고 기대요.',
  inner: '속으로는 인정받고 싶은 마음이 커요. 티를 내지 않을 뿐, 고마움을 표현해 주는 사람에게 깊이 마음을 열어요.',
  elements: '목(木)이 가장 강하고 금(金)이 비어 있어요. 시작하는 힘은 넘치지만 마무리하고 정리하는 힘이 부족할 수 있어요. 하루를 정리하는 짧은 습관이 기운의 균형을 잡아 줘요.',
  love: '천천히 깊어지는 연애가 잘 맞아요. 처음의 설렘보다 오래 함께할 때 빛나는 사람이에요.',
  money: '꾸준히 쌓는 재물운이에요. 한 번에 크게 버는 길보다 오래 가는 수입원을 만들 때 안정돼요.',
  daeun: '지금의 10년은 씨앗을 심는 시기예요. 바로 열매가 보이지 않아도, 지금 배운 것이 다음 10년의 큰 줄기가 돼요.',
};

function MockSaju({ mode, done }: { mode: Mode; done: Set<Part> }) {
  const writing = done.size < SCHEDULE.length;
  const has = (p: Part) => done.has(p);
  const stream = mode === 'stream';
  /** 모드별 '아직 안 쓴 파트' 자리 */
  /** mt: C안에서 앞 내용과의 간격 (카드 안에 혼자 있으면 0) */
  const pending = (lines = 4, mt = 0) => stream ? <WritingPlaceholder lines={lines} mt={mt} /> : <PartPending writing={writing} lines={lines} />;
  /** 카드 하나가 통째로 아직 안 쓴 자리 — C안은 덮개 카드가 카드를 대신한다 */
  // C안: 실제 화면과 같이 아직 안 쓴 첫 파트 자리에만 체크리스트 로딩 카드 하나 (화면 순서: 성품 → 오행 → 분야 → 대운)
  const firstPending = (['core', 'structure', 'fields', 'flow'] as Part[]).find(k => !done.has(k));
  const [startedAt] = useState(() => Date.now());
  const pendingCard = (part: Part, lines = 6) => stream
    ? (part === firstPending ? <ReadingWritingCard startedAt={startedAt} steps={SCHEDULE.map(([k]) => ({ key: k, ...PART_STEP[k] }))} doneKeys={[...done]} /> : null)
    : <Card>{pending(lines)}</Card>;
  const P = (text: string, mt?: number) => <Prose stream={stream} mt={mt} text={text} />;
  const Show = (children: React.ReactNode) => <Appear stream={stream}>{children}</Appear>;

  return (
    <>
      <Text style={s.profileTitle}>운픽님은{'\n'}큰 산 위의 해 같은 사람이에요</Text>
      <Text style={s.profileMeta}>무오일주 · 신강 · 용신 금(金)</Text>
      <Card style={{ marginTop: 16, paddingVertical: 14, paddingHorizontal: 6 }}>
        <View style={s.pgrid}>
          {PILLARS.map(([l, tg, st, br]) => (
            <View key={l} style={[s.pcol, l === '일주' && s.pcolMe]}>
              <Text style={s.pl}>{l}{l === '일주' ? ' · 나' : ''}</Text>
              <Text style={s.tgl}>{tg}</Text>
              {[st, br].map(([h, k, c]) => (
                <View key={h} style={[s.pc, { backgroundColor: c }]}>
                  <Text style={s.pcBig}>{h}</Text>
                  <Text style={s.pcSmall}>{k}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Card>

      {mode === 'current' && writing ? <ProgressCard title="풀이를 쓰고 있어요" done={done.size} total={SCHEDULE.length} note="보통 30초 안팎이 걸려요. 화면을 나가도 계속 쓰고, 다 쓰면 이 화면에서 언제든 다시 볼 수 있어요." /> : null}

      <Hero style={{ padding: 18 }}>
        <Text style={heroTxt.eyebrow}>무오일주 · 큰 산 위의 해</Text>
        {has('core') ? Show(<>
            <Text style={[heroTxt.summ, { fontSize: 18 }]}>{TEXT.headline}</Text>
            {stream ? <TypeReveal text={TEXT.summary} style={[heroTxt.body, s.heroBody]} /> : <Text style={[heroTxt.body, s.heroBody]}>{TEXT.summary}</Text>}
          </>) : (
          <>
            <Text style={[heroTxt.summ, { fontSize: 18 }]}>묵묵하고 듬직한 중심</Text>
            {writing && !stream ? <View style={{ marginTop: 10, opacity: 0.6 }}><PartPending writing lines={3} /></View> : null}
          </>
        )}
      </Hero>

      <SubHead title="01 · 타고난 성품" caption="겉모습과 속마음, 일주가 그리는 나" />
      {has('core') ? Show(<>
          <Card>
            <SajuHeading title="겉모습" icon="user" />
            {P(TEXT.outer, 7)}
          </Card>
          <Card style={{ marginTop: 16 }}>
            <SajuHeading title="속마음" icon="heart-red" />
            {P(TEXT.inner, 7)}
          </Card>
        </>) : pendingCard('core')}

      <SubHead title="02 · 오행의 균형" caption="타고난 다섯 기운" />
      {/* C안: 풀이를 쓰는 동안은 계산 결과(오행 막대)도 미리 보여 주지 않고 덮개 카드 하나로 */}
      {stream && !has('structure') ? pendingCard('structure') : Show(<Card>
        <View style={{ gap: 10 }}>
          {ELS.map(([l, c, v]) => (
            <View key={l} style={s.meter}>
              <Text style={[s.meterL, { color: c }]}>{l}</Text>
              <View style={s.track}><View style={[s.fill, { width: `${(v / 3) * 100}%`, backgroundColor: c }]} /></View>
              <Text style={s.meterV}>{v}</Text>
            </View>
          ))}
        </View>
        {has('structure') ? (<>
            {P(TEXT.elements, 14)}
            <Text style={[s.label, { marginTop: 20 }]}>기운을 채우는 생활습관</Text>
            <Bullet>하루 끝에 할 일을 세 줄로 정리하기</Bullet>
            <Bullet>흰색·은색 소품을 책상 위에 두기</Bullet>
          </>) : pending(4, 16)}
      </Card>)}

      <SubHead title="06 · 분야별 타고난 운" caption="연애 · 재물 · 일 · 관계 · 건강" />
      {has('fields') ? Show(<>
          <View style={{ gap: 16 }}>
            <Card>
              <SajuHeading title="연애 · 결혼" icon="field-love" small />
              {P(TEXT.love, 12)}
              <Tip title="이렇게 해 보세요" style={{ marginTop: 12 }}>고마운 마음은 그날 바로 말로 전해 보세요.</Tip>
            </Card>
            <Card>
              <SajuHeading title="재물" icon="field-money" small />
              {P(TEXT.money, 12)}
            </Card>
          </View>
        </>) : pendingCard('fields')}

      <SubHead title="07 · 대운의 흐름" caption="10년마다 바뀌는 큰 운 · 순행 4세 시작" />
      {stream && !has('flow') ? pendingCard('flow') : Show(
        <Card>
          <Text style={s.label}>지금의 10년 · 34~43세</Text>
          {has('flow') ? <><Text style={[s.cardTitle, { marginTop: 8 }]}>씨앗을 심는 10년</Text>{P(TEXT.daeun)}</> : pending(3, 12)}
        </Card>
      )}
    </>
  );
}

/** 다 쓴 글 — C는 써지듯, 나머지는 그대로 */
function Prose({ stream, text, mt = 6 }: { stream: boolean; text: string; mt?: number }) {
  return stream ? <TypeReveal text={text} style={[s.body, { marginTop: mt }]} /> : <Para mt={mt}>{text}</Para>;
}
/** 다 쓴 파트 — C는 부드럽게 나타난다 */
function Appear({ stream, children }: { stream: boolean; children: React.ReactNode }) {
  return stream ? <Reveal>{children}</Reveal> : <>{children}</>;
}

const s = StyleSheet.create({
  lead: { ...sansW('400'), fontSize: 14, lineHeight: 21, letterSpacing: -0.6, color: colors.inkSub, marginTop: 8 },
  label: { ...sansW('600'), fontSize: 15, lineHeight: 22, letterSpacing: -0.75, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { ...sansW('700'), fontSize: 16, letterSpacing: -0.8, color: colors.ink },
  desc: { ...sansW('400'), fontSize: 13, lineHeight: 19, letterSpacing: -0.6, color: colors.inkMute, marginTop: 4 },
  go: { ...sansW('600'), fontSize: 13, color: colors.accent },
  replay: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  replayText: { ...sansW('600'), fontSize: 13, color: colors.ink },
  tag: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.accentSoft },
  tagText: { ...sansW('600'), fontSize: 12, color: colors.accent },
  profileTitle: { ...sansW('800'), fontSize: 22, lineHeight: 28, letterSpacing: -1.1, color: colors.ink, marginTop: 10 },
  profileMeta: { ...sansW('500'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkSub, marginTop: 6 },
  cardTitle: { ...sansW('600'), fontSize: 16, lineHeight: 22, letterSpacing: -0.8, color: colors.ink },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  heroBody: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  pgrid: { flexDirection: 'row', gap: 9 },
  pcol: { flex: 1, gap: 4, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 14 },
  pcolMe: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lavender },
  pl: { fontSize: 11, fontWeight: '700', color: colors.inkMute, textAlign: 'center' },
  tgl: { fontSize: 11, fontWeight: '700', color: colors.inkSub, textAlign: 'center', marginBottom: 2 },
  pc: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 60 },
  pcBig: { ...sansW('700'), fontSize: 24, lineHeight: 26, color: colors.white },
  pcSmall: { ...sansW('500'), fontSize: 11, lineHeight: 16, color: colors.white },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meterL: { width: 44, fontSize: 13, fontWeight: '700' },
  meterV: { width: 18, textAlign: 'right', fontWeight: '700', color: colors.ink },
  track: { flex: 1, height: 9, borderRadius: 4.5, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 9, borderRadius: 4.5 },
});
