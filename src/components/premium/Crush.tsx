/** 프리미엄: 그 사람의 속마음 (궁합 결과 화면 안) — 온도·가능성·흐름·날짜는 서버 계산값, 풀이 글은 AI */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import ScoreRing from '../ScoreRing';
import { ActRow, Bullet, Hero, Para, SoftCard, SubHead, Tip, heroTxt } from './Kit';
import { PartPending, ReadingBanner } from './Reading';
import { CompatibilityResult } from '../../types';
import { CrushReport } from '../../types/premium';
import { CrushReading, ReadingView } from '../../types/reading';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';

export default function CrushView({ r, R, reading, onRetry }: {
  r: CompatibilityResult; R: CrushReport; reading: ReadingView<CrushReading> | null; onRetry(): void;
}) {
  const mx = Math.max(...R.flow.map(f => f.v));
  const writing = reading?.status === 'writing';
  const { heart, approach } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  return (
    <>
      <SubHead title={`${r.target.nickname}님의 속마음`} caption="두 사람의 사주와 성향으로 본 마음의 경향" />
      <Hero style={{ marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ScoreRing score={R.temp} size={100} stroke={8} label="마음 온도" />
        <View style={{ flex: 1 }}>
          <Text style={heroTxt.eyebrow}>나를 이렇게 느껴요 · {R.tg}</Text>
          <Text style={heroTxt.summ}>{heart?.headline ?? R.oneLine}</Text>
        </View>
      </Hero>
      <View style={s.chance}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>연인으로 발전할 가능성</Text>
        <Text style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: '600', color: colors.love }}>{R.chance}%</Text>
      </View>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      {heart ? <Card style={{ marginTop: 12 }}><Para mt={0}>{heart.summary}</Para></Card> : null}

      <SubHead title="01 · 그 사람에게 나는" />
      <Card>
        <Text style={txt.h3}>{R.tg} — 이런 사람으로 느끼기 쉬워요</Text>
        {heart ? <Para>{heart.feel}</Para> : pending(3)}
        <Text style={[s.label, { marginTop: 14 }]}>나에게 끌리는 이유</Text>
        {heart ? <Para mt={4}>{heart.pull}</Para> : pending(2)}
        <Text style={[s.label, { marginTop: 14 }]}>망설이기 쉬운 이유</Text>
        {heart ? <Para mt={4}>{heart.hesitate}</Para> : pending(2)}
      </Card>

      <SubHead title="02 · 그 사람의 호감 신호" caption={`${r.target.mbti} 성향이 마음을 보일 때`} />
      <Card style={{ gap: 10 }}>{heart ? heart.signals.map(t => <ActRow key={t} icon="sparkle">{t}</ActRow>) : pending(4)}</Card>

      <SubHead title="03 · 관계의 속도" />
      <Card>
        <Text style={txt.h3}>{R.pace[0]}</Text>
        {approach ? <Para>{approach.pace}</Para> : pending(3)}
        <Text style={[txt.h3, { marginTop: 16 }]}>오해가 생기기 쉬운 지점</Text>
        {approach ? <Para>{approach.misunderstand}</Para> : pending(3)}
      </Card>

      <SubHead title="04 · 앞으로 3개월 관계 흐름" />
      <Card style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, height: 150, paddingTop: 20 }}>
        {R.flow.map(f => (
          <View key={f.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: f.v === mx ? colors.love : colors.inkMute }}>{f.v}</Text>
            <View style={{ width: '50%', height: Math.max(12, (f.v - 50) * 1.8), borderRadius: 6, backgroundColor: f.v === mx ? colors.love : colors.loveBg }} />
            <Text style={txt.caption}>{f.label}</Text>
          </View>
        ))}
      </Card>
      {approach ? <Card style={{ marginTop: 10 }}>{approach.flow.map((t, i) => <Bullet key={i} color={colors.love}>{`${R.flow[i]?.label} · ${t}`}</Bullet>)}</Card> : null}

      <SubHead title="05 · 연락하기 좋은 날" caption="앞으로 3주 중 두 사람의 연애 흐름이 겹치는 날" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {R.contact.map(c => (
          <View key={c.iso} style={s.day}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.love }}>{c.label}</Text></View>
        ))}
      </View>
      <Card style={{ marginTop: 10 }}>
        <Text style={txt.caption}>마음을 표현하기 가장 좋은 날 · 앞으로 60일 중</Text>
        <Text style={{ fontFamily: fonts.serif, fontSize: 20, fontWeight: '600', color: colors.love, marginTop: 4 }}>{R.confess.label}</Text>
        <Text style={[txt.small, { marginTop: 4 }]}>{R.confess.time}</Text>
        {approach ? <Para mt={10}>{approach.contact}</Para> : pending(2)}
      </Card>

      <SubHead title="06 · 이렇게 다가가 보세요" />
      <Card style={{ gap: 10 }}>
        {approach ? (
          <>
            {approach.dos.map(t => <ActRow key={t}>{t}</ActRow>)}
            {approach.donts.map(t => <ActRow key={t} ok={false}>{t}</ActRow>)}
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
            <View style={{ gap: 8, marginTop: 10 }}>{approach.messages.map(m => <Text key={m} style={{ fontSize: 14.5, lineHeight: 22, color: colors.ink }}>{m}</Text>)}</View>
          </SoftCard>
          <Tip title="마지막 한마디">{approach.closing}</Tip>
        </>
      ) : null}
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 12 }]}>재미로 보는 콘텐츠예요. 상대의 진짜 마음은 대화로 확인해 주세요.</Text>
    </>
  );
}

const s = StyleSheet.create({
  chance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  day: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.loveBg },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
});
