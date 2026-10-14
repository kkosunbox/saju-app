import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ScoreRing from '../../components/ScoreRing';
import ScoreBar from '../../components/ScoreBar';
import KeywordChip from '../../components/KeywordChip';
import Disclaimer from '../../components/Disclaimer';
import ReportArea from '../../components/premium/Report';
import { Bullet, ChipSelect, HeadRow, Hero, InfoRows, MonthBars, Para, SubHead, ViewsCard, heroTxt, scoreColor } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS } from '../../services/premium/catalog';
import {
  CATS, Q_TEXT, SAMHAP, elName, isClash, isLiuhe, mainStem, monthPillarOf, pText, sajuFull, samjae, stage12, tenGod, tgGroup, yearData,
} from '../../services/premium/engine';
import { DOHWA, EL_LUCK, FIELD, FIELD_META, GROUP_KO, GWIIN, MONTH_LINE, PERIOD_TEXT, REL_SCORE, STAGE12, STAGE12_INFO, TG, TG_INFO, YEAR_IDIOM, YEOKMA } from '../../services/premium/data';
import { BRANCHES, STEMS } from '../../data/sajuData';
import { clamp } from '../../utils/seed';
import { categoryTheme, colors } from '../../theme/colors';
import { txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { newYearSpec } from '../../services/share/shareSpecs';

type FieldKey = 'money' | 'work' | 'love' | 'health' | 'people' | 'study';

export default function NewYearScreen() {
  const nav = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'NewYear'>>();
  const { user: u, today } = useApp();
  const cy = Number(today.slice(0, 4));
  const [y, setY] = useState(params?.year ?? cy);
  if (!u) return null;
  const item = ITEMS.newyear(y);
  const D = yearData(u, y); const F = sajuFull(u); const idiom = YEAR_IDIOM[D.rel];
  const sTG = tenGod(F.ds, D.yp.stem), bTG = tenGod(F.ds, mainStem(D.yp.branch)); const sG = tgGroup(sTG), bG = tgGroup(bTG); const st = stage12(F.ds, D.yp.branch);
  const sj = samjae(F.ch.year.branch, D.yp.branch); const g0 = SAMHAP(F.ch.year.branch), g1 = SAMHAP(F.ch.day.branch);
  const flags: [string, string, string, FieldKey][] = [];
  if (DOHWA[g0] === D.yp.branch || DOHWA[g1] === D.yp.branch) flags.push(['桃', '도화가 들어오는 해', '매력과 인기가 오르고 새로운 인연이 많아져요. 연애·영업·홍보에 유리해요.', 'love']);
  if (YEOKMA[g0] === D.yp.branch || YEOKMA[g1] === D.yp.branch) flags.push(['驛', '역마가 움직이는 해', '이사·이직·출장·여행처럼 몸이 움직이는 일이 많아요. 변화를 미리 계획하면 기회가 돼요.', 'work']);
  if (GWIIN[F.ds].includes(D.yp.branch)) flags.push(['新', '천을귀인의 해', '결정적인 순간에 도와주는 사람이 나타나요. 부탁하는 것을 망설이지 마세요.', 'people']);
  if (isClash(F.ch.day.branch, D.yp.branch)) flags.push(['沖', '일지 충(沖)', '배우자 자리를 흔드는 기운이에요. 관계·주거에 변화가 생기기 쉬우니 대화를 늘려주세요.', 'love']);
  if (isLiuhe(F.ch.day.branch, D.yp.branch)) flags.push(['人', '일지 합(合)', '가까운 관계가 더 단단해지는 해예요. 약속·계약·결혼 이야기에 좋아요.', 'love']);
  if (sj) flags.push(['災', sj, `${D.myAnimal}띠에게 삼재가 드는 해(${sj})예요. 겁먹을 일은 아니지만 큰 결정은 한 번 더 확인하고, 안전과 건강을 조금 더 챙겨주세요.`, 'health']);
  const spouseYear = (u.gender === 'female' && (sG === 'officer' || bG === 'officer')) || (u.gender === 'male' && (sG === 'wealth' || bG === 'wealth'));
  const fieldTxt = (k: FieldKey) => {
    let t = FIELD[sG][k];
    if (bG !== sG) t += ' ' + FIELD[bG][k].split('.')[0] + '.';
    if (k === 'love' && spouseYear) t += ' 배우자의 별이 들어오는 해라 진지한 만남이나 결혼 이야기가 오가기 쉬워요.';
    flags.filter(f => f[3] === k).forEach(f => (t += ' ' + f[2]));
    return t;
  };
  const fScore = (k: FieldKey) => ({
    money: D.cat.money, work: D.cat.work, love: D.cat.love, people: D.cat.relationship,
    health: clamp((D.cat.work + D.cat.relationship) / 2 + (sj ? -4 : 2), 55, 95),
    study: clamp(REL_SCORE[sG === 'resource' ? 'wealth' : sG] - (sG === 'resource' ? -6 : 2), 60, 95),
  })[k];
  const L = EL_LUCK[F.yong];
  const bestMs = D.best.map(b => b.m).sort((a, b) => a - b).join('·'), lowMs = D.low.map(b => b.m).sort((a, b) => a - b).join('·');
  const goMonth = (m: number) => nav.navigate('Monthly', { y, m });

  const basis = (
    <>
      <SubHead title={`01 · ${y}년 총운`} />
      <Card>
        <Para mt={0}>{y}년은 {pText(D.yp)}의 해예요. {u.nickname}님의 일간 {STEMS[F.ds].ko}({STEMS[F.ds].hanja})에게 올해의 천간은 {TG[sTG]}, 지지는 {TG[bTG]}이 돼요. {PERIOD_TEXT.year[D.rel][0]} — {PERIOD_TEXT.year[D.rel][1]}</Para>
        <Para mt={10}>한 해의 흐름은 {D.qs[0] >= D.qs[3] ? '상반기에 힘이 실리고 하반기에는 거둔 것을 다지는' : '상반기에 준비하고 하반기로 갈수록 힘이 붙는'} 모양이에요. 가장 좋은 달은 {bestMs}월, 쉬어갈 달은 {lowMs}월이에요.</Para>
        <Para mt={10}>올해를 관통하는 키워드는 "{D.kws.join('", "')}"예요. {D.zodiac[0]}의 흐름까지 더해져 {D.zodiac[1]}</Para>
      </Card>

      <SubHead title="02 · 올해의 사주 기운" caption="세운(歲運)과 나의 관계" />
      <View style={s.grid3}>
        {([['천간 십성', TG[sTG], GROUP_KO[sG]], ['지지 십성', TG[bTG], GROUP_KO[bG]], ['12운성', STAGE12[st], STAGE12_INFO[st].split(' · ')[1]]] as const).map(([l, v, d]) => (
          <Card key={l} style={s.cell3}>
            <Text style={txt.caption}>{l}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 6, color: colors.purple }}>{v}</Text>
            <Text style={[txt.caption, { marginTop: 2, textAlign: 'center' }]}>{d}</Text>
          </Card>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        <Para mt={0}>천간 {TG[sTG]}: {TG_INFO[sTG].trait} 올해는 이 기운이 겉으로 드러나 {TG_INFO[sTG].talent.split(',')[0]} 같은 일에서 기회가 보여요.</Para>
        <Para mt={10}>지지 {TG[bTG]}: 한 해의 바탕에 {TG_INFO[bTG].key}의 기운이 깔려요. {TG_INFO[bTG].care}.</Para>
        <Para mt={10}>12운성 {STAGE12[st]}: 올해 나의 에너지는 "{STAGE12_INFO[st]}" 단계예요.</Para>
      </Card>

      <SubHead title="03 · 특별한 기운" caption="신살 · 띠 궁합 · 삼재" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
        {[[D.zodiac[0] === '본명년' ? '本' : '合', `${D.zodiac[0]} · ${D.myAnimal}띠 × ${D.animal}해`, D.zodiac[1]], ...flags.map(f => [f[0], f[1], f[2]]), ...(sj ? [] : [['安', '삼재 아님', `${D.myAnimal}띠는 올해 삼재에 해당하지 않아요.`]])].map(([e, t, d], i) => (
          <View key={t} style={[s.flag, i ? s.topLine : null]}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.purpleSoft }}>{e}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t}</Text>
              <Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{d}</Text>
            </View>
          </View>
        ))}
      </Card>

      <SubHead title={`04 · 4가지 관점으로 본 ${y}년`} />
      <ViewsCard views={D.views} />

      <SubHead title="05 · 분야별 6대 운세" />
      <View style={{ gap: 10 }}>
        {FIELD_META.map(([k, e, l]) => {
          const v = fScore(k as FieldKey);
          return (
            <Card key={k}>
              <View style={s.between}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{e} {l}</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: scoreColor(v) }}>{v}</Text>
              </View>
              <View style={{ marginTop: 10, marginBottom: 2 }}><ScoreBar value={v} color={colors.purpleSoft} /></View>
              <Para>{fieldTxt(k as FieldKey)}</Para>
            </Card>
          );
        })}
      </View>

      <SubHead title="06 · 12개월 상세" caption="막대를 누르면 그 달의 전체 운세로 이동해요" />
      <MonthBars months={D.months} onPress={goMonth} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {D.months.map(x => {
          const mp = monthPillarOf(y, x.m); const mg = tgGroup(tenGod(F.ds, mp.stem)); const best = CATS.reduce((a, b) => (x[a] >= x[b] ? a : b));
          return (
            <Card key={x.m} onPress={() => goMonth(x.m)} accessibilityLabel={`${x.m}월 상세운세`}>
              <View style={s.between}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{x.m}월</Text>
                  <Text style={txt.caption}>{pText(mp)} · {TG[tenGod(F.ds, mp.stem)]}</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: scoreColor(x.total) }}>{x.total}</Text>
              </View>
              <Text style={[txt.bodyStrong, { marginTop: 6 }]}>{MONTH_LINE[mg][0]}</Text>
              <Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{MONTH_LINE[mg][1]} 이달은 {categoryTheme[best].label}이 가장 강해요.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {CATS.map(c => <Text key={c} style={txt.caption}>{categoryTheme[c].emoji} {x[c]}</Text>)}
              </View>
            </Card>
          );
        })}
      </View>

      <SubHead title="07 · 분기 전략" />
      <View style={s.grid2}>
        {D.qs.map((v, i) => {
          const ms = D.months.slice(i * 3, i * 3 + 3); const bm = ms.reduce((a, b) => (b.total > a.total ? b : a));
          return (
            <Card key={i} style={s.cell2}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.purpleSoft }}>{i + 1}분기 · {i * 3 + 1}~{i * 3 + 3}월</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 4, color: scoreColor(v) }}>{v}</Text>
              <Text style={[txt.bodyStrong, { marginTop: 2, fontSize: 14 }]}>{Q_TEXT(v)}</Text>
              <Text style={[txt.small, { marginTop: 4 }]}>핵심 달 {bm.m}월 · {bm.kw[0]}</Text>
            </Card>
          );
        })}
      </View>

      <SubHead title={`08 · ${y}년 개운법`} caption={`용신 ${elName(F.yong)} 기준`} />
      <InfoRows labelWidth={120} rows={[['色', '올해의 행운 색', L.color], ['數', '행운의 숫자', L.num], ['愼', '좋은 방향', L.dir], ['物', '곁에 두면 좋은 물건', L.items], ['行', '올해 습관으로 만들 것', L.act]]} />

      <SubHead title="09 · 주의할 점" />
      <Card>
        {[
          TG_INFO[bTG].care + '.',
          `${lowMs}월에는 큰 결정(계약·투자·이사)을 서두르지 마세요.`,
          sj ? '삼재 기간에는 보증·동업처럼 책임을 나눠 지는 일을 피하는 게 좋아요.' : '',
          flags.some(f => f[1].includes('충')) ? '가까운 사람과의 오해는 바로 대화로 풀어주세요.' : '',
          `${elName(F.gi)} 기운이 강한 시기(${EL_LUCK[F.gi].season})에는 컨디션 관리에 더 신경 쓰세요.`,
        ].filter(Boolean).map((t, i) => <Bullet key={i} color="#C27A2C">{t}</Bullet>)}
      </Card>
    </>
  );

  return (
    <Screen title="신년운세" back right={<ShareIconButton item={item} spec={newYearSpec(u, y)} />}>
      <HeadRow item={item} caption={`${D.myAnimal}띠 · ${u.mbti} · ${u.bloodType}형`} />
      <ChipSelect<number> items={[[cy, cy + '년', '올해'], [cy + 1, cy + 1 + '년', '새해 미리보기']]} value={y} onChange={setY} />
      <Hero style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={heroTxt.eyebrow}>{y}년 {STEMS[D.yp.stem].ko}{BRANCHES[D.yp.branch].ko}년 · {D.animal}의 해</Text>
        <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: 2, marginTop: 10, color: colors.white }}>{idiom[0]}</Text>
        <Text style={{ fontSize: 13, color: colors.moon, marginTop: 2 }}>{idiom[1]} · {idiom[2]}</Text>
        <View style={{ marginTop: 16 }}><ScoreRing key={y} score={D.total} size={108} stroke={8} label="올해 종합" /></View>
        <View style={s.chips}>{D.kws.map(k => <KeywordChip key={k} label={k} tone="onDark" />)}</View>
      </Hero>
      <ReportArea key={item.key} rk={{ key: item.key, kind: 'newyear', user: u, today, year: y }} item={item} basis={basis} />
      <ShareCta item={item} spec={newYearSpec(u, y)} />
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 14 },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell2: { width: '47%', flexGrow: 1, padding: 16 },
  flag: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});

