/** 심층 궁합 — 두 사람의 비교·점수·좋은 날은 서버 계산값, 풀이 글은 AI */
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import ScoreBar from '../ScoreBar';
import Segmented from '../Segmented';
import { RelationIcon } from '../SolidIcon';
import { ART } from '../Mascot';
import { Bullet, Para, SoftCard, SubHead, Tip } from './Kit';
import { PartPending, ReadingBanner } from './Reading';
import { CompatibilityResult, User } from '../../types';
import { WEEK, pText, toSajuFull } from '../../services/premium/helpers';
import { DeepCompatibility, SajuFull } from '../../types/premium';
import { CompatReading, ReadingView } from '../../types/reading';
import { TG } from '../../services/premium/data';
import { BRANCHES, ELEMENT_INFO, STEMS } from '../../data/sajuData';
import { parseISO, weekdayOf } from '../../utils/date';
import { RELATIONSHIP_INFO } from '../../data/relationships';
import { isPrivateInvite } from '../../services/server/compatApi';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';

const EK = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;
const AXES = ['에너지', '정보', '판단', '생활'];
// MBTI 축 타일 글자색 — 라이트는 디자인의 진한 초록·갈색, 다크는 밝은 톤
const OK_INK = isDark ? colors.success : '#07883C';
const CARE_INK = isDark ? colors.thai : '#C07F10';

export default function CompatDeep({ u, r, D, reading, onRetry }: {
  u: User; r: CompatibilityResult; D: DeepCompatibility; reading: ReadingView<CompatReading> | null; onRetry(): void;
}) {
  const p = r.target; const A = toSajuFull(D.me), B = D.partner ? toSajuFull(D.partner) : null;
  const privatePartner = isPrivateInvite(r);
  const nmA = u.nickname, nmB = p.nickname;
  const [adviceFor, setAdviceFor] = useState<'me' | 'partner'>('me');
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
  const F = RELATIONSHIP_INFO[r.relationship].fields;
  const scoreRows: [keyof CompatReading['fields'], string, number][] = [
    ['love', F.love, r.love], ['life', F.life, Math.round((r.personality + r.money) / 2)], ['talk', F.talk, r.conversation], ['money', F.money, r.money],
  ];
  const theirMbti = p.mbti;
  const advice = adviceFor === 'me' ? { who: nmA, text: together?.forMe } : { who: nmB, text: together?.forPartner };
  const table: [string, string, string, boolean?][] = [
    ...rows.map(([l, f]): [string, string, string] => [l, f(A), B ? f(B) : '비공개']),
    ['MBTI', u.mbti, privatePartner ? '비공개' : p.mbti ?? '모름', !p.mbti],
    ['혈액형', `${u.bloodType}형`, privatePartner ? '비공개' : p.bloodType ? `${p.bloodType}형` : '모름', !p.bloodType],
  ];

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />
      <Card style={{ marginTop: 16 }}>{bond ? <><Text style={txt.h3}>{bond.headline}</Text><Para>{bond.summary}</Para></> : pending(4)}</Card>

      <SubHead variant="figma" title="두 사람 한눈에" caption={privatePartner ? '상대 프로필은 비공개로 보호해요' : undefined} />
      <View style={s.table}>
        <View style={s.tRow}>
          <View style={s.tL} />
          <View style={s.tHead}><Image source={ART.faceA} style={s.face} /><Text style={s.tV}>{nmA}</Text></View>
          {/* 두 이름 사이 관계 아이콘 — 폭 0인 칸에 겹쳐 둔다 */}
          <View style={s.tMid}><RelationIcon relationship={r.relationship} /></View>
          <View style={s.tHead}><Image source={ART.faceB} style={s.face} /><Text style={s.tV}>{nmB}</Text></View>
        </View>
        {table.map(([l, a, b, unknown]) => (
          <View key={l} style={[s.tRow, s.tLine]}>
            <Text style={[s.tLabel, s.tL]}>{l}</Text>
            <Text style={[s.tV, s.tCol]}>{a}</Text>
            <Text style={[s.tV, s.tCol, unknown && s.tUnknown]}>{b}</Text>
          </View>
        ))}
      </View>

      <SubHead variant="figma" title="사주로 본 인연" />
      {tags.length ? <View style={s.chips}>{tags.map((t, i) => <View key={t} style={[s.tag, { backgroundColor: isDark ? (i % 2 ? colors.mbtiBg : colors.workBg) : (i % 2 ? '#DEF4FF' : '#E7F0FF') }]}><Text style={s.tagText}>{t}</Text></View>)}</View> : null}
      {bond || writing ? <Card style={{ marginTop: tags.length ? 16 : 0, padding: 16 }}>{bond ? <Text style={s.body}>{bond.bond}</Text> : pending(4)}</Card> : null}

      <SubHead variant="figma" title="서로에게 어떤 사람일까" />
      <Card style={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={s.whoLine}><Text style={s.whoName}>{nmA}</Text> 님에게 <Text style={s.whoName}>{nmB}</Text> 님은? <Text style={s.whoTg}>{TG[D.tenGodMeToPartner]}</Text></Text>
          {bond ? <Text style={[s.body, { marginTop: 8 }]}>{bond.partnerToMe}</Text> : pending(2)}
        </View>
        <View>
          <Text style={s.whoLine}><Text style={s.whoName}>{nmB}</Text> 님에게 <Text style={s.whoName}>{nmA}</Text> 님은? <Text style={s.whoTg}>{TG[D.tenGodPartnerToMe]}</Text></Text>
          {bond ? <Text style={[s.body, { marginTop: 8 }]}>{bond.meToPartner}</Text> : pending(2)}
        </View>
        <View>
          <Text style={s.title}>{r.relationship === 'lover' ? '서로 끌리는 이유' : '서로 잘 맞는 이유'}</Text>
          {bond ? <Text style={[s.body, { marginTop: 4 }]}>{bond.attraction}</Text> : pending(2)}
        </View>
      </Card>

      <SubHead variant="figma" title="네 관점으로 본 두 사람" caption="MBTI · 혈액형 · 태국 요일" />
      {theirMbti
        ? (
          <View style={s.axes}>
            {AXES.map((x, i) => {
              const same = u.mbti[i] === theirMbti[i];
              return (
                <View key={x} style={[s.axis, { backgroundColor: isDark ? (same ? colors.okBg : colors.careBg) : (same ? '#E6F6EC' : '#FFF2DB') }]}>
                  <Text style={[s.axisText, { color: same ? OK_INK : CARE_INK }]}>{`${x} ${u.mbti[i]}×${theirMbti[i]}`}</Text>
                </View>
              );
            })}
          </View>
        )
        : <Text style={txt.caption}>{privatePartner ? '상대의 개인 성향 정보는 공개하지 않고, 두 사람의 궁합을 풀이해요.' : `${nmB}님의 MBTI를 몰라 MBTI 비교는 빼고 봤어요.`}</Text>}
      {bond || writing ? <Card style={{ marginTop: 16, padding: 16 }}>{bond ? <Text style={s.body}>{bond.views}</Text> : pending(3)}</Card> : null}

      <SubHead variant="figma" title="분야별 궁합 풀이" />
      <Card style={{ padding: 16, gap: 24 }}>
        {scoreRows.map(([k, t, v]) => {
          const f = fields?.[k];
          return (
            <View key={k}>
              <View style={s.between}><Text style={s.title}>{t}</Text><Text style={[s.title, { fontVariant: ['tabular-nums'] }]}>{v}</Text></View>
              <View style={{ marginTop: 8 }}><ScoreBar value={v} color={colors.accent} track={colors.lavender} height={6} /></View>
              {f ? <><Text style={[s.title, { marginTop: 12 }]}>{f.headline}</Text><Text style={[s.body, { marginTop: 4 }]}>{f.text}</Text><Text style={[s.body, { marginTop: 6, color: colors.purpleSoft }]}>둘이 해 볼 것 · {f.tip}</Text></> : pending(3)}
            </View>
          );
        })}
      </Card>

      <SubHead variant="figma" title="부딪히기 쉬운 순간" />
      {together ? together.frictions.map((f, i) => (
        <Card key={i} style={{ marginTop: i ? 12 : 0, padding: 16 }}>
          <Text style={s.title}>{f.title}</Text>
          <Text style={[s.body, { marginTop: 4 }]}>{f.text}</Text>
          <SoftCard style={{ marginTop: 12, padding: 12, backgroundColor: colors.surface, borderRadius: radius.sm }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.purpleSoft }}>이렇게 말해 보세요</Text>
            <Text style={[s.body, { marginTop: 4 }]}>{f.say}</Text>
          </SoftCard>
        </Card>
      )) : <Card>{pending(5)}</Card>}

      <SubHead variant="figma" title="서로를 위한 조언" />
      <Segmented<'me' | 'partner'> variant="figma" options={[{ key: 'me' as const, label: `${nmA}님께` }, { key: 'partner' as const, label: `${nmB}님께` }]} value={adviceFor} onChange={setAdviceFor} />
      <Card style={{ marginTop: 16, padding: 16 }}>
        <Text style={s.title}>{advice.who}님을 위한 조언</Text>
        {advice.text ? <Text style={[s.body, { marginTop: 4 }]}>{advice.text}</Text> : pending(3)}
      </Card>
      {together ? <Card style={{ marginTop: 12, padding: 16 }}><Text style={[s.title, { marginBottom: 4 }]}>오래 가는 법</Text>{together.lasting.map((t, i) => <Bullet key={i}>{t}</Bullet>)}</Card> : null}

      <SubHead variant="figma" title="앞으로 30일, 둘에게 좋은 날" />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {D.goodDays.map(g => (
          <View key={g.iso} style={s.goodDay}>
            <Text style={s.goodDate}>{parseISO(g.iso).m}/{g.d}</Text>
            <Text style={s.goodWeek}>{WEEK[weekdayOf(g.iso)]}요일</Text>
          </View>
        ))}
      </View>
      {together ? <Card style={{ marginTop: 12, padding: 16 }}>{together.dateIdeas.map((t, i) => <Bullet key={i} color={colors.love}>{t}</Bullet>)}</Card> : null}
      {together ? <Tip title="두 사람에게">{together.closing}</Tip> : null}
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { ...sansW('700'), lineHeight: 17, fontSize: 14, fontWeight: '700', letterSpacing: -0.56, color: colors.ink },
  body: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.ink },
  table: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  tRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  tLine: { minHeight: 43, borderTopWidth: 1, borderTopColor: colors.lineStrong },
  tL: { width: 89, paddingRight: 7, textAlign: 'center' },
  tCol: { flex: 1, textAlign: 'center' },
  tHead: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  tMid: { width: 0, alignItems: 'center', overflow: 'visible' },
  face: { width: 20, height: 20, borderRadius: 10 },
  tLabel: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: isDark ? colors.ink : '#000000' },
  tV: { ...sansW('600'), fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: -0.65, color: isDark ? colors.ink : '#000000' },
  tUnknown: { ...sansW('500'), color: colors.inkMute, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tag: { height: 32, paddingHorizontal: 16, borderRadius: 30, justifyContent: 'center' },
  tagText: { ...sansW('500'), fontSize: 14, fontWeight: '500', color: colors.ink, opacity: 0.8 },
  whoLine: { ...sansW('500'), fontSize: 13, fontWeight: '500', letterSpacing: -0.52, color: colors.inkMute },
  whoName: { ...sansW('600'), fontSize: 18, fontWeight: '600', letterSpacing: -0.9, color: colors.ink },
  whoTg: { ...sansW('700'), fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: -0.65, color: isDark ? colors.purpleSoft : '#3D79D4' },
  axes: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  axis: { flexBasis: '45%', flexGrow: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  axisText: { ...sansW('600'), fontSize: 16, fontWeight: '600', letterSpacing: -0.8 },
  goodDay: { flex: 1, height: 63, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? colors.loveBg : '#FFE7E7', borderRadius: radius.lg },
  goodDate: { ...sansW('700'), fontSize: 18, fontWeight: '700', letterSpacing: -0.72, color: colors.blood },
  goodWeek: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute },
});
