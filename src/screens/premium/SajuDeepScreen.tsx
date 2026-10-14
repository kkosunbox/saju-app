import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Disclaimer from '../../components/Disclaimer';
import ReportArea from '../../components/premium/Report';
import { Bullet, Divider, HeadRow, Hero, InfoRows, Para, Pill, SubHead, Tip, ViewRow, heroTxt } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { ELS, axisVerdict, crossAxes, elName, mainStem, sajuFull, stage12, tenGod, thaiDay, SrcKey } from '../../services/premium/engine';
import {
  BRANCH_SEAT, EL_BODY, EL_HEX, EL_JOB, EL_LUCK, GROUP_DESC, GROUP_KO, HIDDEN, SINSAL, STAGE12, STAGE12_INFO, STEM_PERSONA, TG, TG_H, TG_INFO,
} from '../../services/premium/data';
import { BRANCHES, ELEMENT_INFO, STEMS, TenGodGroup } from '../../data/sajuData';
import { THAI_DAYS } from '../../data/thaiData';
import { MBTI_INFO } from '../../data/mbtiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { analysisTheme, colors } from '../../theme/colors';
import { fonts, txt } from '../../theme/typography';
import { Pillar } from '../../services/fortune/sajuService';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { sajuDeepSpec } from '../../services/share/shareSpecs';

const EK = (e: keyof typeof ELEMENT_INFO) => ELEMENT_INFO[e].ko;

function Cell({ p, stem }: { p: Pillar | null; stem: boolean }) {
  if (!p) return <View style={[s.pc, { backgroundColor: colors.line }]}><Text style={{ fontSize: 20, fontWeight: '700', color: colors.inkMute }}>?</Text></View>;
  const o = stem ? STEMS[p.stem] : BRANCHES[p.branch];
  return (
    <View style={[s.pc, { backgroundColor: EL_HEX[o.element] }]}>
      <Text style={s.pcBig}>{o.hanja}</Text>
      <Text style={s.pcSmall}>{o.ko}{stem ? '' : ' · ' + (o as typeof BRANCHES[number]).animal}</Text>
    </View>
  );
}

/** 오행 · 십성 막대 */
function Meter({ label, color, value, max, labelW = 46, h = 10 }: { label: string; color: string; value: number; max: number; labelW?: number; h?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ width: labelW, fontSize: 14, fontWeight: '700', color }}>{label}</Text>
      <View style={{ flex: 1, height: h, borderRadius: h / 2, backgroundColor: colors.line, overflow: 'hidden' }}>
        <View style={{ width: `${(value / max) * 100}%`, height: h, borderRadius: h / 2, backgroundColor: color }} />
      </View>
      <Text style={{ width: 18, textAlign: 'right', fontWeight: '700', color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function SajuDeepScreen() {
  const { user: u, today } = useApp();
  if (!u) return null;
  const item = ITEMS.sajuDeep();
  const F = sajuFull(u); const ch = F.ch; const me = STEMS[F.ds]; const per = STEM_PERSONA[F.ds]; const g = F.grp;
  const mx = Math.max(...ELS.map(e => F.elc[e]), 1); const gmx = Math.max(...Object.values(g), 1);
  const dayName = `${me.ko}${BRANCHES[ch.day.branch].ko}일주`; const seat = BRANCH_SEAT[ch.day.branch];
  const gk = Object.keys(g) as TenGodGroup[];
  const strongG = gk.reduce((a, b) => (g[b] > g[a] ? b : a)); const zeroG = gk.filter(k => g[k] === 0);
  const L = EL_LUCK[F.yong];
  const weakEl = ELS.reduce((a, b) => (F.elc[b] < F.elc[a] ? b : a)), strongEl = ELS.reduce((a, b) => (F.elc[b] > F.elc[a] ? b : a));
  const ax = crossAxes(u, F); const spouseN = g[F.spouseGrp];
  const dayTG = tenGod(F.ds, mainStem(ch.day.branch));

  const money = [
    g.wealth === 0 ? '사주에 재성(재물의 별)이 드러나 있지 않아요. 돈 자체를 쫓기보다 실력과 전문성을 쌓을 때 재물이 따라오는 구조예요. 기술·자격·브랜드처럼 "나 자체"가 자산이 되는 길이 잘 맞아요.' : g.wealth <= 2 ? '재성이 적당히 자리 잡고 있어 꾸준히 벌고 모으는 힘이 있어요. 큰 한 방보다 꾸준한 흐름을 만드는 쪽이 유리해요.' : '재성이 많아 돈의 흐름을 읽는 감각이 뛰어나요. 기회가 자주 보이는 만큼 벌이는 일도 많아지니, 지출 관리가 재물운의 관건이에요.',
    F.tgc[5] > F.tgc[4] ? '정재(正財)가 편재보다 강해 월급·저축·적금처럼 예측 가능한 재물과 인연이 깊어요.' : F.tgc[4] > F.tgc[5] ? '편재(偏財)가 정재보다 강해 사업·영업·투자처럼 움직이는 돈에 감각이 있어요. 다만 기복도 함께 오니 안전판을 꼭 마련하세요.' : '',
    g.output >= 2 && g.wealth >= 1 ? '식상이 재성을 살려주는 "식상생재" 구조예요. 재능과 아이디어가 그대로 수입으로 이어지기 쉬워 부업·콘텐츠·기술 판매에도 잘 맞아요.' : '',
    g.peer >= 3 ? '비겁이 많아 돈이 모이는 만큼 나가기도 쉬워요. 동업·보증·지인과의 돈거래는 특히 신중하게 하세요.' : '',
  ].filter(Boolean);
  const workType = g.officer >= 2 && g.resource >= 1 ? ['조직형 리더', '체계 안에서 인정받으며 올라가는 타입이에요. 공공기관·대기업·전문 조직에서 자리를 잡기 좋아요.']
    : g.output >= 2 && g.wealth >= 1 ? ['사업·프리랜서형', '내 아이디어로 판을 벌일 때 가장 빛나요. 창업·프리랜서·부업에서 강점을 보여요.']
      : g.resource >= 2 || F.tgc[2] >= 2 ? ['전문가형', '한 분야를 깊게 파서 대체 불가능한 사람이 되는 타입이에요. 자격·기술·연구 분야가 잘 맞아요.']
        : F.tgc[3] >= 2 ? ['창작·기획형', '틀에 얽매이지 않는 창의력이 무기예요. 기획·콘텐츠·예술·마케팅에서 빛나요.']
          : ['균형형', '어느 환경에서도 적응하는 타입이에요. 조직에서 경력을 쌓다 전문 분야로 독립하는 흐름이 자연스러워요.'];
  const love = [
    `배우자 자리(일지)에 ${BRANCHES[ch.day.branch].ko}(${BRANCHES[ch.day.branch].hanja})가 있어요. ${seat[0]} 이런 내면은 ${seat[1]}와 잘 어울려요.`,
    spouseN === 0 ? `${u.gender === 'female' ? '관성' : '재성'}(배우자의 별)이 원국에 드러나지 않아 연애보다 내 일과 성장에 집중하는 시기가 길 수 있어요. 대운·세운에서 이 기운이 들어올 때 인연이 강하게 찾아와요.` : spouseN >= 3 ? '배우자의 별이 많아 인연이 자주 찾아오는 사주예요. 선택지가 많을수록 기준을 분명히 하는 것이 행복의 열쇠예요.' : '배우자의 별이 안정적으로 자리 잡고 있어 좋은 인연을 알아보는 눈이 있어요.',
    `일지 12운성이 "${STAGE12[F.dayStage]}"이에요. 관계 안에서 ${STAGE12_INFO[F.dayStage].split(' · ')[1]}의 모습을 보여요.`,
    F.sinsal.includes('dohwa') ? '도화의 기운이 있어 이성에게 매력이 잘 전달돼요. 인기는 장점으로 살리고, 관계의 경계는 분명히 하세요.' : '',
  ].filter(Boolean);
  const people = [
    g.peer >= 3 ? '비겁이 많아 친구·동료가 많고 의리를 중시해요. 다만 경쟁 관계가 생기기 쉬워 양보 한 번이 관계를 지켜줘요.' : g.peer === 0 ? '비겁이 적어 혼자 해결하려는 경향이 있어요. 믿을 만한 동료 한두 명을 곁에 두면 일이 훨씬 수월해져요.' : '사람과의 거리 조절을 잘하는 편이에요.',
    g.resource >= 2 ? '인성이 있어 윗사람·스승·선배의 도움을 받는 복이 있어요.' : '',
    F.sinsal.includes('gwiin') ? '천을귀인이 있어 결정적인 순간에 귀인이 나타나요.' : '',
  ].filter(Boolean);
  const study = [
    g.resource >= 2 ? '인성이 강해 배우고 흡수하는 힘이 뛰어나요. 자격증·학위·시험에서 좋은 결과를 내기 쉬워요.' : g.resource === 0 ? '인성이 약해 책상 공부보다 직접 부딪히며 배우는 쪽이 잘 맞아요.' : '필요한 공부를 효율적으로 해내는 타입이에요.',
    F.sinsal.includes('munchang') ? '문창귀인이 있어 글·말·기획 능력이 남달라요.' : '',
    F.tgc[2] >= 1 ? '식신의 힘으로 좋아하는 분야를 깊게 파면 전문가 수준에 이르러요.' : '',
  ].filter(Boolean);
  const strongText: Record<TenGodGroup, string> = { peer: '자기 주관과 독립심이 삶의 중심이 돼요.', output: '표현하고 만들어내는 재능이 삶을 이끌어요.', wealth: '현실 감각과 결과를 만드는 힘이 강해요.', officer: '책임감과 명예를 중요하게 여기는 삶이에요.', resource: '배우고 생각하는 힘이 삶의 바탕이 돼요.' };

  const basis = (
    <>
      <SubHead title="01 · 오행과 십성 분포" caption="타고난 다섯 기운과 열 가지 관계" />
      <Card>
        <View style={{ gap: 10 }}>{ELS.map(e => <Meter key={e} label={elName(e)} color={EL_HEX[e]} value={F.elc[e]} max={mx} />)}</View>
        <Para mt={12}>{elName(strongEl)} 기운이 가장 강하고 {elName(weakEl)} 기운이 {F.elc[weakEl] ? '가장 약해요' : '비어 있어요'}. {F.elc[weakEl] === 0 ? '비어 있는 기운은 평생 채워가야 할 숙제이자, 채웠을 때 운이 크게 열리는 열쇠예요.' : '고르게 분포된 편이라 큰 치우침 없이 균형을 잡기 쉬워요.'}</Para>
        <Divider my={16} />
        <View style={{ gap: 10 }}>
          {gk.map(k => (
            <View key={k}>
              <View style={s.between}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 }}>{GROUP_KO[k]} <Text style={[txt.caption, { fontWeight: '500' }]}>{GROUP_DESC[k]}</Text></Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.purple }}>{g[k]}</Text>
              </View>
              <View style={s.track}><View style={[s.fill, { width: `${(g[k] / gmx) * 100}%` }]} /></View>
            </View>
          ))}
        </View>
        <Para mt={12}>{GROUP_KO[strongG]}이(가) 가장 강해요. {strongText[strongG]}{zeroG.length ? ` 반면 ${zeroG.map(k => GROUP_KO[k]).join('·')}이(가) 비어 있어, 이 영역은 의식적으로 채워갈수록 삶이 단단해져요.` : ''}</Para>
      </Card>

      <SubHead title="02 · 신강·신약" caption="나를 돕는 기운과 빼는 기운의 균형" />
      <Card>
        <LinearGradient colors={['#9FB0CF', '#D8CFBF', '#D3A08E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.gauge}><View style={[s.gaugeDot, { left: `${Math.round(F.ratio * 100)}%` }]} /></LinearGradient>
        <View style={[s.between, { marginTop: 6 }]}><Text style={txt.caption}>신약</Text><Text style={txt.caption}>중화</Text><Text style={txt.caption}>신강</Text></View>
        <Text style={[txt.h3, { marginTop: 12 }]}>{F.strength} ({Math.round(F.ratio * 100)}%)</Text>
        <Para>{F.strength === '신강' ? '나를 돕는 기운이 강한 사주예요. 에너지가 넘치고 주관이 뚜렷해 스스로 길을 개척하는 힘이 있어요. 넘치는 힘을 밖으로 쓰는 일(표현·사업·책임 있는 자리)에서 운이 열려요.' : F.strength === '신약' ? '나를 빼는 기운이 상대적으로 강한 사주예요. 섬세하고 주변을 잘 살피며, 좋은 사람과 환경을 만날 때 크게 성장해요. 배움과 협력, 충분한 휴식이 운을 키워줘요.' : '돕는 기운과 빼는 기운이 고르게 맞선 중화 사주예요. 어느 쪽으로도 크게 치우치지 않아 상황 적응력이 뛰어나요.'}</Para>
      </Card>

      <SubHead title="03 · 용신과 개운법" caption="나에게 가장 필요한 기운과 생활 속 활용법" />
      <View style={s.grid3}>
        {([['용신', '가장 필요한 기운', F.yong], ['희신', '용신을 돕는 기운', F.hee], ['기신', '조심할 기운', F.gi]] as const).map(([l, d, e]) => (
          <Card key={l} style={s.cell3}>
            <Text style={txt.caption}>{l}</Text>
            <View style={[s.eld, { backgroundColor: EL_HEX[e] }]}><Text style={{ fontFamily: fonts.serif, color: colors.white, fontWeight: '600', fontSize: 18 }}>{ELEMENT_INFO[e].hanja}</Text></View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{elName(e)}</Text>
            <Text style={[txt.caption, { marginTop: 2, textAlign: 'center' }]}>{d}</Text>
          </Card>
        ))}
      </View>
      <View style={{ marginTop: 12 }}>
        <InfoRows rows={[['色', '행운의 색', L.color], ['數', '행운의 숫자', L.num], ['愼', '좋은 방향', L.dir], ['桃', '기운이 오르는 계절', L.season], ['食', '추천 음식', L.food], ['物', '곁에 두면 좋은 물건', L.items], ['行', '추천 활동', L.act]]} />
      </View>
      <Para mt={10}>{elName(F.gi)} 기운은 용신을 누르는 기운이에요. {EL_LUCK[F.gi].color} 계열을 지나치게 많이 쓰거나, 컨디션이 떨어질 때는 이 기운의 활동({EL_LUCK[F.gi].act.split(', ')[0]})을 줄여보세요.</Para>

      <SubHead title="04 · 일주론" caption={dayName + ' · 나를 가장 잘 보여주는 기둥'} />
      <Hero style={{ marginTop: 0 }}>
        <Text style={heroTxt.eyebrow}>{dayName} ({me.hanja}{BRANCHES[ch.day.branch].hanja}日柱)</Text>
        <Text style={[heroTxt.summ, { fontSize: 19 }]}>{per.emoji} {per.img} 위에 {BRANCHES[ch.day.branch].animal}가 앉은 모습</Text>
        <Text style={[heroTxt.body, { fontSize: 14.5, lineHeight: 23, marginTop: 10 }]}>{me.ko}{EK(me.element)}({me.hanja})는 {per.core}을 가진 기운이에요. 아래 {BRANCHES[ch.day.branch].ko}({BRANCHES[ch.day.branch].hanja})는 {EK(BRANCHES[ch.day.branch].element)} 기운으로, 일간에게 {TG[dayTG]}이 돼요. {TG_INFO[dayTG].trait} {seat[0]}</Text>
      </Hero>
      <Card style={{ marginTop: 12 }}>
        <Text style={txt.h3}>겉모습과 속마음</Text>
        <Para>겉으로는 {per.core}이 먼저 보여요. 처음 만난 사람들이 먼저 느끼는 건 "{per.str[0]}"라는 점이에요. 하지만 속마음을 들여다보면 {seat[0]} 이 모습은 가까운 사람에게만 보여줘요.</Para>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Text style={txt.h3}>일주의 12운성 · {STAGE12[F.dayStage]}</Text>
        <Para>일지에서 일간의 힘은 "{STAGE12[F.dayStage]}" 단계예요. {STAGE12_INFO[F.dayStage]}. {[0, 2, 3, 4].includes(F.dayStage) ? '스스로 서는 힘이 강해 독립적인 삶에 잘 어울려요.' : [5, 6, 7, 8].includes(F.dayStage) ? '안으로 다지는 힘이 강해 깊이 있는 일, 신중한 판단에 강해요.' : '변화와 가능성의 기운이라 새로운 환경에서 빠르게 적응해요.'}</Para>
      </Card>

      <SubHead title="05 · 타고난 성격" caption="강점과 보완점" />
      <Card>
        <Text style={[s.label, { color: colors.success }]}>강점</Text>
        {[...per.str, ...F.topTG.slice(0, 2).map(x => TG_INFO[x.i].trait.split('.')[0] + '.')].map((t, i) => <Bullet key={i} color={colors.success}>{t}</Bullet>)}
        <Text style={[s.label, { color: colors.thai, marginTop: 14 }]}>보완하면 좋은 점</Text>
        {[per.watch, ...F.topTG.slice(0, 2).map(x => TG_INFO[x.i].care)].map((t, i) => <Bullet key={i} color="#C27A2C">{t}</Bullet>)}
      </Card>
      <View style={{ gap: 10, marginTop: 12 }}>
        {F.topTG.map(x => (
          <Card key={x.i}>
            <View style={s.between}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 }}>{TG[x.i]}({TG_H[x.i]}) · {TG_INFO[x.i].key}</Text>
              <Pill>{`${x.c}개`}</Pill>
            </View>
            <Para>{TG_INFO[x.i].trait}</Para>
            <Text style={[txt.small, { marginTop: 6 }]}>재능 · {TG_INFO[x.i].talent}</Text>
          </Card>
        ))}
      </View>

      <SubHead title="06 · 신살" caption="사주에 깃든 특별한 별" />
      {F.sinsal.length ? (
        <View style={{ gap: 10 }}>
          {F.sinsal.map(k => {
            const v = SINSAL[k];
            return (
              <Card key={k}>
                <View style={s.between}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{v.name} <Text style={txt.caption}>{v.h}</Text></Text>
                  <Pill tone={v.tone === 'good' ? 'ok' : v.tone === 'care' ? 'care' : 'default'}>{({ good: '길신', mix: '양면', care: '주의' } as Record<string, string>)[v.tone]}</Pill>
                </View>
                <Para>{v.desc}</Para>
              </Card>
            );
          })}
        </View>
      ) : <Card><Para mt={0}>두드러진 신살이 없는 담백한 사주예요. 특정 기운에 휘둘리지 않고 노력한 만큼 결과가 정직하게 돌아와요.</Para></Card>}

      <SubHead title="07 · 재물운" caption="타고난 돈의 그릇" />
      <Card>
        {money.map((t, i) => <Para key={i} mt={i ? 10 : 0}>{t}</Para>)}
        <Tip title="재물 개운">{L.color} 지갑이나 소품, {L.dir} 방향 정리, {EK(F.yong)} 기운의 활동({L.act.split(', ')[0]})이 재물 흐름을 돕는다고 봐요.</Tip>
      </Card>

      <SubHead title="08 · 직업·적성" caption="잘 맞는 일과 일하는 방식" />
      <Card>
        <Text style={txt.h3}>{workType[0]}</Text>
        <Para>{workType[1]}</Para>
        <Text style={[s.label, { color: colors.purpleSoft, marginTop: 14 }]}>추천 분야</Text>
        <View style={s.chips}>{[...per.work.split(' · '), ...EL_JOB[F.yong]].slice(0, 8).map(j => <Pill key={j}>{j}</Pill>)}</View>
        <Para mt={12}>용신인 {elName(F.yong)}과 관련된 업종({EL_JOB[F.yong].slice(0, 3).join(', ')})에서 일하면 타고난 기운이 보완돼 일이 덜 지치고 오래 갈 수 있어요.</Para>
      </Card>

      <SubHead title="09 · 연애·결혼운" caption="배우자 자리와 인연의 별" />
      <Card>{love.map((t, i) => <Para key={i} mt={i ? 10 : 0}>{t}</Para>)}</Card>

      <SubHead title="10 · 인간관계" />
      <Card>{people.map((t, i) => <Para key={i} mt={i ? 10 : 0}>{t}</Para>)}</Card>

      <SubHead title="11 · 건강 관리 포인트" caption="전통 오행 이론 기준 · 의학적 진단이 아니에요" />
      <Card>
        <Para mt={0}>가장 약한 {elName(weakEl)} 기운은 전통적으로 {EL_BODY[weakEl]}와 연결된다고 봐요. 이 부분의 피로 신호에 조금 더 귀 기울여 주세요.</Para>
        <Para mt={10}>가장 강한 {elName(strongEl)} 기운은 넘치면 {EL_BODY[strongEl].split(' · ')[0]} 쪽에 부담을 준다고 봐요. 과로·과식처럼 한쪽으로 몰리는 생활을 피하는 것이 좋아요.</Para>
        <Para mt={10}>불편한 증상이 있다면 운세가 아닌 의료 전문가와 상담해 주세요.</Para>
      </Card>

      <SubHead title="12 · 학업·자기계발" />
      <Card>{study.map((t, i) => <Para key={i} mt={i ? 10 : 0}>{t}</Para>)}</Card>

      <SubHead title="13 · 4가지 관점 교차 분석" caption="사주 · 태국 점성술 · MBTI · 혈액형이 같은 말을 할 때" />
      <Card style={{ gap: 18 }}>
        {ax.map(a => {
          const { pos, neg, verdict } = axisVerdict(a);
          return (
            <View key={a.name}>
              <View style={s.between}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{a.name}</Text>
                <Pill>{verdict + (verdict !== '균형' ? ' · ' + Math.max(pos, neg) + '/4' : '')}</Pill>
              </View>
              <View style={s.axrow}>
                <Text style={txt.caption}>{a.neg}</Text>
                <View style={s.axline}>
                  <View style={s.axmid} />
                  {(['saju', 'thai', 'mbti', 'blood'] as SrcKey[]).map((k, ki) => (
                    <View key={k} style={[s.axdot, { left: `${50 + a.v[k] * 34 + (ki - 1.5) * 7}%`, borderColor: analysisTheme[k].color }]} accessibilityLabel={analysisTheme[k].label}>
                      <Text style={{ fontFamily: fonts.serif, fontSize: 11, fontWeight: '600', color: analysisTheme[k].color }}>{analysisTheme[k].emoji}</Text>
                    </View>
                  ))}
                </View>
                <Text style={txt.caption}>{a.pos}</Text>
              </View>
            </View>
          );
        })}
        <Para mt={0}>네 가지 관점을 겹쳐 보면 {u.nickname}님은 {ax.map(a => { const v = axisVerdict(a); return v.verdict === '균형' ? '균형 잡힌' : v.verdict; }).join(' · ')} 성향이 또렷해요. 여러 관점이 같은 방향을 가리키는 성향일수록 "진짜 나"에 가까운 모습이에요.</Para>
      </Card>
      <Card style={{ marginTop: 12, paddingVertical: 4, paddingHorizontal: 16 }}>
        {([['saju', `${per.core} (${me.ko}${EK(me.element)})`], ['thai', THAI_DAYS[thaiDay(u)].trait], ['mbti', `${MBTI_INFO[u.mbti].nickname} · ${MBTI_INFO[u.mbti].strength}`], ['blood', BLOOD_INFO[u.bloodType].trait]] as [SrcKey, string][]).map(([k, t], i) => (
          <View key={k} style={i ? s.topLine : null}><ViewRow k={k}>{t}</ViewRow></View>
        ))}
      </Card>
      <Tip title="평생 기억할 한 문장">{per.core}을 믿되, {elName(F.yong)}의 기운으로 균형을 채울 때 가장 멀리 갑니다.</Tip>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>양력 기준 근사 만세력으로 계산했어요. 절입 시각·음력 보정은 업데이트 예정이에요.</Text>
    </>
  );

  return (
    <Screen title="상세 사주 해석" back right={<ShareIconButton item={item} spec={sajuDeepSpec(u)} />}>
      <HeadRow item={item} caption={`양력 ${u.birthDate.replace(/-/g, '.')} ${u.birthTime || '(시간 모름)'}`} />
      <Text style={[txt.title, { marginTop: 10 }]}>{u.nickname}님은{'\n'}{per.img} 같은 사람이에요</Text>
      <Text style={[txt.body, { marginTop: 6 }]}>{dayName} · {F.strength} · 용신 {elName(F.yong)}</Text>
      <Card style={{ marginTop: 16, paddingVertical: 14, paddingHorizontal: 10 }}>
        <View style={s.pgrid}>
          {F.pillars.map(([l, p]) => {
            const isMe = l === '일주';
            return (
              <View key={l} style={[s.pcol, isMe && s.pcolMe]}>
                <Text style={[s.pl, isMe && { color: colors.purple }]}>{l}{isMe ? ' · 나' : ''}</Text>
                <Text style={s.tgl}>{p ? (isMe ? '일간' : TG[tenGod(F.ds, p.stem)]) : '-'}</Text>
                <Cell p={p} stem />
                <Cell p={p} stem={false} />
                <Text style={s.tgl}>{p ? TG[tenGod(F.ds, mainStem(p.branch))] : '-'}</Text>
                <Text style={s.hid}>{p ? HIDDEN[p.branch].map(x => STEMS[x].hanja).join(' ') : ''}</Text>
                <Text style={s.st12}>{p ? STAGE12[stage12(F.ds, p.branch)] : ''}</Text>
              </View>
            );
          })}
        </View>
        <View style={s.legend}><Text style={s.legendT}>위·아래 작은 글씨: 십성</Text><Text style={s.legendT}>회색: 지장간</Text><Text style={s.legendT}>보라: 12운성</Text></View>
      </Card>
      <ReportArea rk={{ key: item.key, kind: 'sajuDeep', user: u, today }} item={item} basis={basis} />
      <ShareCta item={item} spec={sajuDeepSpec(u)} />
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  pgrid: { flexDirection: 'row', gap: 8 },
  pcol: { flex: 1, gap: 6, padding: 6, borderRadius: 14 },
  pcolMe: { backgroundColor: colors.lavenderSoft, borderWidth: 1.5, borderColor: colors.lavender },
  pl: { fontSize: 11, fontWeight: '700', color: colors.inkMute, textAlign: 'center' },
  tgl: { fontSize: 11, fontWeight: '700', color: colors.inkSub, textAlign: 'center' },
  hid: { fontSize: 11, color: colors.inkMute, textAlign: 'center', letterSpacing: 1 },
  st12: { fontSize: 11, fontWeight: '700', color: colors.purpleSoft, textAlign: 'center' },
  pc: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, minHeight: 68 },
  pcBig: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '600', lineHeight: 28, color: colors.white },
  pcSmall: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 12, rowGap: 4, marginTop: 10 },
  legendT: { fontSize: 11.5, color: colors.inkMute },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 6 },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.purpleSoft },
  gauge: { height: 10, borderRadius: 5, marginTop: 6 },
  gaugeDot: { position: 'absolute', top: -5, width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: colors.card, borderWidth: 3, borderColor: colors.navy },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  eld: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  label: { fontSize: 12, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  axrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  axline: { flex: 1, height: 30, borderRadius: 15, backgroundColor: colors.cream },
  axmid: { position: 'absolute', left: '50%', top: 6, bottom: 6, width: 1, backgroundColor: colors.lineStrong },
  axdot: { position: 'absolute', top: 3, width: 24, height: 24, marginLeft: -12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});

