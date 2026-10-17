/** 심층 궁합 — 두 사람의 비교·점수·좋은 날은 서버 계산값, 풀이 글은 AI */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import ScoreBar from '../ScoreBar';
import { Bullet, Para, Pill, SoftCard, SubHead, Tip, scoreColor } from './Kit';
import { PartPending, ReadingBanner } from './Reading';
import { CompatibilityResult, User } from '../../types';
import { WEEK, pText, toSajuFull } from '../../services/premium/helpers';
import { DeepCompatibility, SajuFull } from '../../types/premium';
import { CompatReading, ReadingView } from '../../types/reading';
import { TG } from '../../services/premium/data';
import { BRANCHES, ELEMENT_INFO, STEMS } from '../../data/sajuData';
import { parseISO, weekdayOf } from '../../utils/date';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

const EK = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;
const AXES = ['에너지', '정보', '판단', '생활'];

export default function CompatDeep({ u, r, D, reading, onRetry }: {
  u: User; r: CompatibilityResult; D: DeepCompatibility; reading: ReadingView<CompatReading> | null; onRetry(): void;
}) {
  const p = r.target; const A = toSajuFull(D.me), B = toSajuFull(D.partner);
  const nmA = u.nickname, nmB = p.nickname;
  const writing = reading?.status === 'writing';
  const { bond, fields, together } = reading?.parts ?? {};
  const pending = (lines = 3) => <PartPending writing={writing} lines={lines} />;
  const rows: [string, (x: SajuFull) => string][] = [['일주', x => pText(x.ch.day)], ['일간', x => STEMS[x.ds].ko + EK(x.meE)], ['신강약', x => x.strength], ['용신', x => `${EK(x.yong)}(${ELEMENT_INFO[x.yong].hanja})`], ['띠', x => BRANCHES[x.ch.year.branch].animal + '띠']];
  const tags = [
    D.stemHap ? '천간합' : null,
    D.dayHap ? '일지 육합' : D.daySamhap ? '일지 삼합' : D.dayClash ? '일지 충' : null,
    D.zodiac === 'harmony' ? '띠 육합' : D.zodiac === 'clash' ? '띠 충' : D.zodiacWonjin ? '원진' : null,
    D.partnerHasMyYongsin && D.meHasPartnerYongsin ? '서로의 용신' : D.partnerHasMyYongsin || D.meHasPartnerYongsin ? '용신 보완' : null,
    D.partnerFillsMe.length || D.meFillsPartner.length ? '오행 보완' : null,
  ].filter((t): t is string => !!t);
  const scoreRows: [keyof CompatReading['fields'], string, number][] = [
    ['love', '緣 연애 궁합', r.love], ['life', '家 결혼·생활 궁합', Math.round((r.personality + r.money) / 2)], ['talk', '言 소통 궁합', r.conversation], ['money', '財 금전 궁합', r.money],
  ];

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      <Card style={{ marginTop: 16 }}>{bond ? <><Text style={txt.h3}>{bond.headline}</Text><Para>{bond.summary}</Para></> : pending(4)}</Card>

      <SubHead title="두 사람 한눈에" />
      <Card style={{ paddingVertical: 14, paddingHorizontal: 10 }}>
        <View style={s.cpRow}><Text style={s.cpL} /><Text style={s.cpH}>{nmA}</Text><Text style={s.cpH}>{nmB}</Text></View>
        {rows.map(([l, f]) => <View key={l} style={s.cpRow}><Text style={[txt.caption, s.cpL]}>{l}</Text><Text style={s.cpV}>{f(A)}</Text><Text style={s.cpV}>{f(B)}</Text></View>)}
        <View style={s.cpRow}><Text style={[txt.caption, s.cpL]}>MBTI</Text><Text style={s.cpV}>{u.mbti}</Text><Text style={s.cpV}>{p.mbti}</Text></View>
        <View style={s.cpRow}><Text style={[txt.caption, s.cpL]}>혈액형</Text><Text style={s.cpV}>{u.bloodType}형</Text><Text style={s.cpV}>{p.bloodType}형</Text></View>
      </Card>

      <SubHead title="命 사주로 본 인연" />
      <Card>
        {tags.length ? <View style={s.chips}>{tags.map(t => <Pill key={t}>{t}</Pill>)}</View> : null}
        {bond ? <Para mt={tags.length ? 12 : 0}>{bond.bond}</Para> : pending(4)}
      </Card>

      <SubHead title="對 서로에게 어떤 사람일까" />
      <Card>
        <Text style={s.label}>{nmA}님에게 {nmB}님은 · {TG[D.tenGodMeToPartner]}</Text>
        {bond ? <Para mt={4}>{bond.partnerToMe}</Para> : pending(2)}
        <Text style={[s.label, { marginTop: 14 }]}>{nmB}님에게 {nmA}님은 · {TG[D.tenGodPartnerToMe]}</Text>
        {bond ? <Para mt={4}>{bond.meToPartner}</Para> : pending(2)}
        <Text style={[s.label, { marginTop: 14 }]}>서로 끌리는 이유</Text>
        {bond ? <Para mt={4}>{bond.attraction}</Para> : pending(2)}
      </Card>

      <SubHead title="性 네 관점으로 본 두 사람" caption="MBTI · 혈액형 · 태국 요일" />
      <Card>
        <View style={s.chips}>{AXES.map((x, i) => <Pill key={x} tone={u.mbti[i] === p.mbti[i] ? 'ok' : 'care'}>{`${x} ${u.mbti[i]}×${p.mbti[i]}`}</Pill>)}</View>
        {bond ? <Para mt={12}>{bond.views}</Para> : pending(3)}
      </Card>

      <SubHead title="분야별 궁합 풀이" />
      {scoreRows.map(([k, t, v]) => {
        const f = fields?.[k];
        return (
          <Card key={k} style={{ marginTop: 10 }}>
            <View style={s.between}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t}</Text><Text style={{ fontWeight: '700', color: scoreColor(v) }}>{v}</Text></View>
            <View style={{ marginTop: 8, marginBottom: 2 }}><ScoreBar value={v} color={colors.love} height={5} /></View>
            {f ? <><Text style={[txt.bodyStrong, { marginTop: 8 }]}>{f.headline}</Text><Para>{f.text}</Para><Text style={[txt.small, { marginTop: 6, color: colors.purple }]}>둘이 해 볼 것 · {f.tip}</Text></> : pending(3)}
          </Card>
        );
      })}

      <SubHead title="爭 부딪히기 쉬운 순간" />
      {together ? together.frictions.map((f, i) => (
        <Card key={i} style={{ marginTop: i ? 10 : 0 }}>
          <Text style={txt.h3}>{f.title}</Text>
          <Para>{f.text}</Para>
          <SoftCard style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.purpleSoft }}>이렇게 말해 보세요</Text>
            <Text style={{ fontSize: 14.5, lineHeight: 22, marginTop: 4, color: colors.ink }}>{f.say}</Text>
          </SoftCard>
        </Card>
      )) : <Card>{pending(5)}</Card>}

      <SubHead title="서로를 위한 조언" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {([[nmA, together?.forMe], [nmB, together?.forPartner]] as [string, string | undefined][]).map(([who, t]) => (
          <Card key={who} style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.purpleSoft }}>{who}님께</Text>
            {t ? <Text style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: colors.ink }}>{t}</Text> : pending(3)}
          </Card>
        ))}
      </View>
      {together ? <Card style={{ marginTop: 12 }}><Text style={s.label}>오래 가는 법</Text>{together.lasting.map((t, i) => <Bullet key={i}>{t}</Bullet>)}</Card> : null}

      <Card style={{ marginTop: 12 }}>
        <Text style={txt.h3}>앞으로 30일, 둘에게 좋은 날</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {D.goodDays.map(g => (
            <View key={g.iso} style={s.goodDay}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.love }}>{parseISO(g.iso).m}/{g.d}</Text>
              <Text style={txt.caption}>{WEEK[weekdayOf(g.iso)]}요일</Text>
            </View>
          ))}
        </View>
        {together ? <View style={{ marginTop: 10 }}>{together.dateIdeas.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>)}</View> : null}
      </Card>
      {together ? <Tip title="두 사람에게">{together.closing}</Tip> : null}
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4.5 },
  cpL: { width: 64, textAlign: 'center' },
  cpH: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.purple },
  cpV: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.inkSub },
  goodDay: { flex: 1, alignItems: 'center', backgroundColor: colors.loveBg, borderRadius: radius.md, paddingVertical: 12 },
});
