/** 심층 궁합 — 두 사람의 사주 · 성향을 겹쳐 본 상세 데이터 (AI 리포트의 계산 근거) */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../Card';
import ScoreBar from '../ScoreBar';
import { Para, Pill, SoftCard, SubHead, scoreColor } from './Kit';
import { CompatibilityResult, User, BloodType } from '../../types';
import {
  ELS, SAMHAP, WEEK, isClash, isLiuhe, isStemHap, isWonjin, isoOf, partnerUser, pText, quickTotal, sajuFull, tenGod, thaiDay, zodiacRel, SajuFull, daysInMonth,
} from '../../services/premium/engine';
import { EL_LUCK, TG, TG_REL } from '../../services/premium/data';
import { BRANCHES, ELEMENT_INFO, GENERATES, STEMS } from '../../data/sajuData';
import { THAI_DAYS, THAI_FRIENDS } from '../../data/thaiData';
import { parseISO, weekdayOf } from '../../utils/date';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';

const EK = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;
const AX: [string, number, string, string, string][] = [
  ['에너지', 0, '에너지를 쓰는 속도가 비슷해 함께 있는 시간이 편해요.', '한 사람은 밖에서, 한 사람은 안에서 충전해요.', '약속 전에 "오늘은 조용히 쉬고 싶어"처럼 컨디션을 먼저 말해 주세요.'],
  ['대화', 1, '관심사와 말하는 방식이 비슷해 대화가 잘 이어져요.', '한 사람은 사실을, 한 사람은 가능성을 먼저 봐요.', '"구체적으로는?" "그래서 결국?"을 서로 물어봐 주세요.'],
  ['결정', 2, '결정하는 기준이 같아 의견 충돌이 적어요.', '한 사람은 논리로, 한 사람은 마음으로 판단해요.', '결론을 말하기 전에 상대의 감정과 이유를 한 번씩 확인해 주세요.'],
  ['생활', 3, '생활 리듬이 비슷해 일상을 맞추기 쉬워요.', '한 사람은 계획을, 한 사람은 즉흥을 좋아해요.', '큰 일정은 미리 정하고, 작은 일정은 여유를 남겨 두세요.'],
];
const BLOOD_FIGHT: Record<BloodType, string> = { A: '서운함을 속으로 삼키는', B: '감정을 바로 드러내는', O: '정면으로 풀려는', AB: '잠시 거리를 두는' };

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card style={{ marginTop: 10 }}><Text style={txt.h3}>{title}</Text>{children}</Card>;
}

export default function CompatDeep({ u, r, today }: { u: User; r: CompatibilityResult; today: string }) {
  const p = partnerUser(r); const A = sajuFull(u), B = sajuFull(p); const a = u.mbti, b = p.mbti;
  const nmA = u.nickname, nmB = p.nickname;
  const stemHap = isStemHap(A.ds, B.ds), dayHap = isLiuhe(A.ch.day.branch, B.ch.day.branch), dayClash = isClash(A.ch.day.branch, B.ch.day.branch);
  const daySam = SAMHAP(A.ch.day.branch) === SAMHAP(B.ch.day.branch) && A.ch.day.branch !== B.ch.day.branch;
  const zr = zodiacRel(A.ch.year.branch, B.ch.year.branch), won = isWonjin(A.ch.year.branch, B.ch.year.branch);
  const tgAB = tenGod(A.ds, B.ds), tgBA = tenGod(B.ds, A.ds);
  const fillAB = ELS.filter(e => A.elc[e] === 0 && B.elc[e] >= 2), fillBA = ELS.filter(e => B.elc[e] === 0 && A.elc[e] >= 2);
  const yongMatch = B.elc[A.yong] >= 2, yongMatchB = A.elc[B.yong] >= 2;
  const same = AX.filter(x => a[x[1]] === b[x[1]]), diff = AX.filter(x => a[x[1]] !== b[x[1]]);

  const sajuRows: [string, string, string][] = [
    [stemHap ? '緣' : '', '일간의 관계', stemHap ? `${STEMS[A.ds].hanja}${STEMS[B.ds].hanja}합 — 천간합이에요. 처음부터 서로에게 강하게 끌리는, 사주에서 가장 대표적인 인연의 조합이에요.` : `${STEMS[A.ds].ko}(${EK(A.meE)})와 ${STEMS[B.ds].ko}(${EK(B.meE)}) — ${GENERATES[A.meE] === B.meE || GENERATES[B.meE] === A.meE ? '한쪽이 다른 쪽을 살려주는 상생 관계예요.' : A.meE === B.meE ? '같은 기운이라 서로를 잘 이해해요.' : '서로를 다듬어 주는 상극 관계라 긴장감과 자극이 공존해요.'}`],
    [dayHap || daySam ? '家' : dayClash ? '沖' : '', '배우자 자리(일지)', dayHap ? '일지가 육합을 이뤄요. 함께 사는 생활의 궁합이 좋아 시간이 갈수록 편해지는 사이예요.' : daySam ? '일지가 삼합의 한 무리예요. 같은 목표를 향해 힘을 모으기 좋아요.' : dayClash ? '일지가 충(沖)이에요. 생활 방식이 달라 처음엔 부딪히지만, 서로의 빈틈을 채워주는 역동적인 관계이기도 해요.' : '일지끼리 특별한 합·충이 없어 무난하게 맞춰갈 수 있어요.'],
    [zr === 'harmony' ? '人' : zr === 'clash' || won ? '怨' : '', `띠 궁합 · ${BRANCHES[A.ch.year.branch].animal}×${BRANCHES[B.ch.year.branch].animal}`, zr === 'harmony' ? '띠가 육합이라 집안·주변 사람들과도 잘 어울리는 조합이에요.' : zr === 'clash' ? '띠가 충이라 성향이 정반대예요. 다름을 인정하면 오히려 서로를 크게 넓혀줘요.' : won ? '원진 관계라 사소한 일로 서운함이 쌓이기 쉬워요. 감정이 쌓이기 전에 바로 풀어주세요.' : zr === 'same' ? '같은 띠라 생각과 리듬이 닮았어요.' : '띠끼리는 무난한 관계예요.'],
    ['補', '오행 보완', fillAB.length || fillBA.length ? `${fillAB.length ? `${nmB}님이 ${nmA}님에게 없는 ${fillAB.map(e => EK(e)).join('·')} 기운을 채워줘요. ` : ''}${fillBA.length ? `${nmA}님은 ${nmB}님에게 없는 ${fillBA.map(e => EK(e)).join('·')} 기운을 채워줘요.` : ''}` : '서로 비어 있는 기운을 직접 채워주지는 않지만, 각자의 균형을 해치지도 않아요.'],
    [yongMatch || yongMatchB ? '新' : '', '용신 궁합', yongMatch && yongMatchB ? '서로가 서로의 용신을 가지고 있어요. 함께 있을수록 둘 다 운이 좋아지는 최고의 조합이에요.' : yongMatch ? `${nmB}님이 ${nmA}님의 용신(${EK(A.yong)})을 많이 가지고 있어, ${nmA}님에게 특히 좋은 인연이에요.` : yongMatchB ? `${nmA}님이 ${nmB}님의 용신(${EK(B.yong)})을 많이 가지고 있어, ${nmB}님에게 특히 좋은 인연이에요.` : '용신으로는 무난한 관계예요.'],
  ];
  const loveTxt = [r.love >= 85 ? '끌림이 강하고 설렘이 오래가는 조합이에요.' : r.love >= 75 ? '편안함 속에 설렘이 이어지는 조합이에요.' : '처음의 설렘보다 시간이 쌓일수록 깊어지는 조합이에요.', stemHap ? '천간합이 있어 첫 만남부터 강한 끌림을 느끼기 쉬워요.' : '', a[2] !== b[2] ? '감정 표현 방식이 달라 한쪽은 말로, 한쪽은 행동으로 사랑을 보여요. 서로의 방식을 알아주면 오해가 사라져요.' : '애정 표현 방식이 비슷해 서로의 마음을 쉽게 알아채요.'].filter(Boolean).join(' ');
  const lifeTxt = [dayHap || daySam ? '함께 사는 생활의 궁합이 좋아요.' : dayClash ? '생활 습관이 달라 초기 조율이 필요해요. 집안일·돈 관리 규칙을 미리 정해두면 좋아요.' : '생활 리듬을 맞추는 데 큰 어려움이 없어요.', a[3] === b[3] ? '계획을 세우는 방식이 같아 여행·이사 같은 큰일도 순조로워요.' : '계획형과 즉흥형의 조합이라, 큰일은 계획형이 맡고 작은 즐거움은 즉흥형이 맡으면 좋아요.'].join(' ');
  const moneyTxt = [(A.grp.wealth >= 2) !== (B.grp.wealth >= 2) ? '한 사람은 돈 감각이, 한 사람은 다른 강점이 있어 역할을 나누기 좋아요. 재정 관리는 재성이 강한 쪽이 맡는 걸 추천해요.' : A.grp.wealth >= 2 ? '둘 다 돈 감각이 있어 함께 재테크 목표를 세우면 시너지가 커요.' : '둘 다 돈보다 다른 가치를 중시해요. 고정 지출과 저축 규칙을 정해두면 안정돼요.', r.money >= 80 ? '금전 궁합 점수가 높아 경제적인 목표를 함께 이루기 좋아요.' : ''].filter(Boolean).join(' ');
  const fightTxt = [diff.length ? `부딪히기 쉬운 지점은 ${diff.map(x => x[0]).join('·')}이에요.` : '성향이 닮아 큰 충돌은 적지만, 같은 약점을 공유할 수 있어요.', dayClash || won ? '감정이 쌓이기 전에 그날 바로 대화하는 규칙을 만들어 보세요.' : '싸우더라도 하루를 넘기지 않으면 금세 회복되는 관계예요.', `${u.bloodType}형은 ${BLOOD_FIGHT[u.bloodType]} 편이고, ${p.bloodType}형은 ${BLOOD_FIGHT[p.bloodType]} 편이에요.`].join(' ');
  const { y, m, d: d0 } = parseISO(today); const n = daysInMonth(y, m);
  const ds: { iso: string; d: number; s: number }[] = [];
  for (let d = d0; d <= n; d++) { const iso = isoOf(y, m, d); ds.push({ iso, d, s: quickTotal(u, iso) + quickTotal(p, iso) }); }
  const good = ds.sort((x, z) => z.s - x.s).slice(0, 3).sort((x, z) => x.d - z.d);
  const mt = thaiDay(u), yt = thaiDay(p);
  const rows: [string, (x: SajuFull) => string][] = [['일주', x => pText(x.ch.day)], ['일간', x => STEMS[x.ds].ko + EK(x.meE)], ['신강약', x => x.strength], ['용신', x => `${EK(x.yong)}(${ELEMENT_INFO[x.yong].hanja})`], ['띠', x => BRANCHES[x.ch.year.branch].animal + '띠']];

  return (
    <>
      <SubHead title="심층 궁합" caption="두 사람의 사주 · 성향을 겹쳐 본 결과" />
      <Card style={{ paddingVertical: 14, paddingHorizontal: 10 }}>
        <View style={s.cpRow}><Text style={s.cpL} /><Text style={s.cpH}>{nmA}</Text><Text style={s.cpH}>{nmB}</Text></View>
        {rows.map(([l, f]) => <View key={l} style={s.cpRow}><Text style={[txt.caption, s.cpL]}>{l}</Text><Text style={s.cpV}>{f(A)}</Text><Text style={s.cpV}>{f(B)}</Text></View>)}
        <View style={s.cpRow}><Text style={[txt.caption, s.cpL]}>MBTI</Text><Text style={s.cpV}>{a}</Text><Text style={s.cpV}>{b}</Text></View>
        <View style={s.cpRow}><Text style={[txt.caption, s.cpL]}>혈액형</Text><Text style={s.cpV}>{u.bloodType}형</Text><Text style={s.cpV}>{p.bloodType}형</Text></View>
      </Card>
      <Sec title="命 사주로 본 인연">
        <View style={{ marginTop: 6 }}>
          {sajuRows.map(([e, t, d], i) => (
            <View key={t} style={[{ paddingVertical: 12 }, i ? s.topLine : null]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{e ? e + ' ' : ''}{t}</Text>
              <Text style={[txt.body, { fontSize: 14, marginTop: 4 }]}>{d}</Text>
            </View>
          ))}
        </View>
      </Sec>
      <Sec title="對 서로에게 어떤 사람일까">
        <Para>{nmA}님에게 {nmB}님은 <Text style={{ fontWeight: '700', color: colors.purple }}>{TG[tgAB]}</Text> — {TG_REL[tgAB]}.</Para>
        <Para mt={8}>{nmB}님에게 {nmA}님은 <Text style={{ fontWeight: '700', color: colors.purple }}>{TG[tgBA]}</Text> — {TG_REL[tgBA]}.</Para>
      </Sec>
      <Sec title="性 MBTI 4가지 축">
        {AX.map(x => {
          const sm = a[x[1]] === b[x[1]];
          return (
            <View key={x[0]} style={[{ paddingVertical: 10 }, s.topLine]}>
              <View style={s.between}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{x[0]} · {a[x[1]]} × {b[x[1]]}</Text>
                <Pill tone={sm ? 'ok' : 'care'}>{sm ? '닮음' : '다름'}</Pill>
              </View>
              <Text style={[txt.body, { fontSize: 14, marginTop: 4 }]}>{sm ? x[2] : x[3] + ' ' + x[4]}</Text>
            </View>
          );
        })}
      </Sec>
      <Sec title="星 태국 점성술 · 血 혈액형">
        <Para>{THAI_DAYS[mt].label}생({THAI_DAYS[mt].planetKo})과 {THAI_DAYS[yt].label}생({THAI_DAYS[yt].planetKo}) — {THAI_FRIENDS[mt].includes(yt) || THAI_FRIENDS[yt].includes(mt) ? '수호 행성끼리 사이가 좋아 서로에게 행운을 가져다줘요.' : mt === yt ? '같은 요일에 태어나 기질이 닮았어요.' : '수호 행성이 달라 서로에게 새로운 세계를 보여줘요.'}</Para>
        <Para mt={8}>{r.points[2]?.text}</Para>
      </Sec>

      <SubHead title="분야별 궁합 풀이" />
      {([['緣 연애 궁합', r.love, loveTxt], ['家 결혼·생활 궁합', Math.round((r.personality + r.money) / 2), lifeTxt], ['言 소통 궁합', r.conversation, same.find(x => x[0] === '대화') ? '말이 잘 통해 대화만으로도 관계가 깊어져요. 서로의 관심사를 공유하는 시간을 꾸준히 가져 보세요.' : '보는 관점이 달라 대화가 자극이 돼요. 설명을 조금 더 친절하게 하면 서로 배우는 게 많아요.'], ['財 금전 궁합', r.money, moneyTxt], ['爭 갈등과 화해', Math.round((r.personality + r.conversation) / 2), fightTxt]] as [string, number, string][]).map(([t, v, d]) => (
        <Card key={t} style={{ marginTop: 10 }}>
          <View style={s.between}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t}</Text><Text style={{ fontWeight: '700', color: scoreColor(v) }}>{v}</Text></View>
          <View style={{ marginTop: 8, marginBottom: 2 }}><ScoreBar value={v} color={colors.love} height={5} /></View>
          <Para>{d}</Para>
        </Card>
      ))}
      {diff.length ? (
        <SoftCard style={{ marginTop: 10 }}>
          <Text style={[txt.h3, { color: colors.purple }]}>이렇게 말해 보세요</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {diff.map(x => <Text key={x[0]} style={{ fontSize: 14.5, lineHeight: 22, color: colors.ink }}><Text style={{ color: colors.purpleSoft, fontSize: 12, fontWeight: '700' }}>{x[0]}  </Text>{x[4]}</Text>)}
          </View>
        </SoftCard>
      ) : null}

      <SubHead title="서로를 위한 조언" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {([[nmA, nmB, A, b], [nmB, nmA, B, a]] as [string, string, SajuFull, string][]).map(([me, you, X, ym]) => (
          <Card key={me} style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.purpleSoft }}>{me}님께</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, marginTop: 6, color: colors.ink }}>{you}님은 {ym[2] === 'F' ? '공감과 다정한 말' : '구체적인 행동과 해결'}에서 사랑을 느껴요. {X.strength === '신강' ? '가끔은 주도권을 내려놓고 맞춰주세요.' : '내 마음을 조금 더 분명히 표현해 주세요.'}</Text>
          </Card>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        <Text style={txt.h3}>이번 달 둘에게 좋은 날</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {good.map(g => (
            <View key={g.iso} style={s.goodDay}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.love }}>{g.d}일</Text>
              <Text style={txt.caption}>{WEEK[weekdayOf(g.iso)]}요일</Text>
            </View>
          ))}
        </View>
        <Text style={[txt.small, { marginTop: 12 }]}>함께하면 좋은 것 · {EL_LUCK[A.yong].act.split(', ')[0]}, {EL_LUCK[B.yong].act.split(', ')[0]}</Text>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4.5 },
  cpL: { width: 64, textAlign: 'center' },
  cpH: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.purple },
  cpV: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.ink },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  goodDay: { flex: 1, alignItems: 'center', backgroundColor: colors.loveBg, borderRadius: radius.md, paddingVertical: 12 },
});
