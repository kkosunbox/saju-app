import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import ScoreRing from '../../components/ScoreRing';
import ScoreBar from '../../components/ScoreBar';
import KeywordChip, { emojiFor } from '../../components/KeywordChip';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, ChipSelect, FortuneCalendar, HeadRow, LockGate, Hero, InfoRows, Para, Seal, SubHead, ViewsCard, heroTxt, scoreColor } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS } from '../../services/premium/catalog';
import { SAMHAP, WEEK, dayPillar, daysInMonth, isClash, kwTag, mainStem, monthPillarOf, pText, pad2, relation, stage12, tenGod, tenName, tgGroup, thaiDay } from '../../services/premium/helpers';
import { MonthPreview, MonthReport, SajuFull } from '../../types/premium';
import { usePremiumContent, usePremiumPreview } from '../../services/server/premiumApi';
import { User } from '../../types';
import { DOHWA, EL_LUCK, FIELD, FIELD_META, GWIIN, MONTH_LINE, PERIOD_TEXT, STAGE12, STAGE12_INFO, TG, TG_INFO, YEOKMA } from '../../services/premium/data';
import { ACTIONS } from '../../data/keywords';
import { STEMS } from '../../data/sajuData';
import { THAI_DAYS, THAI_FRIENDS, WEEKDAY_TO_THAI } from '../../data/thaiData';
import { BLOOD_INFO } from '../../data/bloodData';
import { AXES } from '../../data/mbtiData';
import { CAT_TEXT } from '../../data/categoryText';
import { parseISO, weekdayOf } from '../../utils/date';
import { clamp, pick, seededRandom } from '../../utils/seed';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { monthlySpec } from '../../services/share/shareSpecs';

type FieldKey = 'money' | 'work' | 'love' | 'health' | 'people' | 'study';

export default function MonthlyScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Monthly'>>();
  const { user: u, today } = useApp();
  const t = parseISO(today);
  const [sel, setSel] = useState(params?.y && params?.m ? { y: Number(params.y), m: Number(params.m) } : { y: t.y, m: t.m });
  const ref = { kind: 'monthly', month: `${sel.y}-${pad2(sel.m)}` } as const;
  const content = usePremiumContent<MonthReport>(ref);
  const preview = usePremiumPreview<MonthPreview>(ref, !content.open);
  if (!u?.natal) return null;
  const item = ITEMS.monthly(sel.y, sel.m);
  const R = content.data?.data; const F = content.data?.F;
  const top: MonthPreview | undefined = R ?? preview.data;
  const mp = monthPillarOf(sel.y, sel.m);
  const rel = relation(STEMS[u.natal.chart.day.stem].element, STEMS[mp.stem].element);
  // 살 수 있는 달: 지난달부터 12개월 뒤까지 (서버 카탈로그와 같은 범위)
  const months: [string, string, string][] = [];
  for (let i = -1; i <= 12; i++) {
    const d = new Date(t.y, t.m - 1 + i, 1);
    months.push([`${d.getFullYear()}-${d.getMonth() + 1}`, `${d.getMonth() + 1}월`, d.getFullYear() !== t.y ? String(d.getFullYear()) : i === 0 ? '이번 달' : '']);
  }
  const spec = R ? monthlySpec(u, R, rel) : null;

  return (
    <Screen title="월별 상세운세" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`${sel.y}년 ${sel.m}월 1일 ~ ${daysInMonth(sel.y, sel.m)}일`} />
      <ChipSelect<string> items={months} value={`${sel.y}-${sel.m}`} onChange={v => { const [yy, mm] = v.split('-').map(Number); setSel({ y: yy, m: mm }); }} />
      {top ? (
        <Hero style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ScoreRing key={item.key} score={top.avg} size={104} stroke={8} label="이달 평균" />
          <View style={{ flex: 1 }}>
            <Text style={heroTxt.eyebrow}>{u.nickname}님의 {sel.m}월 · {pText(mp)}월</Text>
            <Text style={heroTxt.summ}>{PERIOD_TEXT.month[rel][0]}</Text>
            <View style={s.chips}>{top.kws.map(k => <KeywordChip key={k} label={k} tone="onDark" />)}</View>
          </View>
        </Hero>
      ) : <BodyState error={preview.isError} />}
      {!content.open ? <LockGate key={item.key} item={item} />
        : R && F ? <MonthlyBody key={item.key} u={u} R={R} F={F} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact />
    </Screen>
  );
}

/** 열람한 본문 (01~09) */
function MonthlyBody({ u, R, F }: { u: User; R: MonthReport; F: SajuFull }) {
  const { today } = useApp();
  const { missions, toggleMission } = usePremium();
  const [calSel, setCalSel] = useState<string | null>(null);
  const sel = { y: R.y, m: R.m };
  const bestSet = new Set(R.best.map(b => b.d));
  const mp = monthPillarOf(sel.y, sel.m);
  const sTG = tenGod(F.ds, mp.stem), bTG = tenGod(F.ds, mainStem(mp.branch)); const sG = tgGroup(sTG); const st = stage12(F.ds, mp.branch);
  const rel = relation(F.meE, STEMS[mp.stem].element);
  const fp = WEEKDAY_TO_THAI[R.first]; const myT = thaiDay(u); const tp = THAI_DAYS[fp];
  const thaiTxt = `이달은 ${tp.label}로 시작해 ${tp.planetKo}의 기운이 문을 열어요. ` + (THAI_FRIENDS[myT].includes(fp) || fp === myT ? '나의 수호 행성과 잘 맞아 초반 흐름이 좋아요.' : tp.color === THAI_DAYS[myT].cautionColor ? '초반에는 서두르지 않는 게 좋아요.' : '새로운 시도를 하기 좋은 출발이에요.');
  const ai = (sel.y * 12 + sel.m) % 4; const ax = AXES[ai]; const fl = (sel.y * 12 + sel.m) % 8 < 4 ? ax[0] : ax[1];
  const mbtiTxt = u.mbti[ai] === fl ? `이달은 '${ax[2]}'에서 ${fl} 흐름이라 내 성향과 잘 맞아요. 평소 방식대로 밀고 가세요.` : `이달은 '${ax[2]}'에서 ${fl} 흐름이라, 평소의 ${u.mbti[ai]} 방식과 반대예요. 반대편 방식을 한 번 써보면 의외의 결과가 나와요.`;
  const bloodTxt = pick(seededRandom(`bm-${u.bloodType}-${sel.y}-${sel.m}`), BLOOD_INFO[u.bloodType].tips);
  const flags: string[] = []; const g0 = SAMHAP(F.ch.year.branch), g1 = SAMHAP(F.ch.day.branch);
  if (DOHWA[g0] === mp.branch || DOHWA[g1] === mp.branch) flags.push('桃 도화월 — 매력이 올라 새로운 만남이 많은 달이에요.');
  if (YEOKMA[g0] === mp.branch || YEOKMA[g1] === mp.branch) flags.push('驛 역마월 — 이동·출장·여행이 많아지는 달이에요.');
  if (GWIIN[F.ds].includes(mp.branch)) flags.push('新 귀인월 — 도움을 주는 사람이 나타나는 달이에요.');
  if (isClash(F.ch.day.branch, mp.branch)) flags.push('沖 일지 충 — 가까운 관계에서 오해가 생기기 쉬워요. 말보다 들어주기.');
  const weeks: { w: number; from: number; to: number; av: number; bd: typeof R.days[number]; kw: string; act: string }[] = [];
  for (let w = 0; w < 5; w++) {
    const ds = R.days.slice(w * 7, w * 7 + 7); if (!ds.length) break;
    const av = Math.round(ds.reduce((a, x) => a + x.total, 0) / ds.length);
    const bd = ds.reduce((a, b) => (b.total > a.total ? b : a));
    const kc: Record<string, number> = {}; ds.forEach(x => (kc[x.c.keywords[0]] = (kc[x.c.keywords[0]] ?? 0) + 1));
    const kw = Object.keys(kc).reduce((a, b) => (kc[b] > kc[a] ? b : a));
    const pool = [...ACTIONS[kwTag(kw)].good, ...R.missions, ...ACTIONS[kwTag(R.kws[(w + 1) % R.kws.length])].good];
    weeks.push({ w, from: ds[0].d, to: ds[ds.length - 1].d, av, bd, kw, act: pool[(w * 3 + sel.m) % pool.length] });
  }
  const band = (v: number) => (v >= 82 ? 'high' : v >= 74 ? 'mid' : 'low') as 'high' | 'mid' | 'low';
  const L = EL_LUCK[F.yong];
  const fieldScore = (k: FieldKey) => k === 'money' ? R.cat.money : k === 'work' ? R.cat.work : k === 'love' ? R.cat.love : k === 'people' ? R.cat.relationship
    : k === 'health' ? clamp((R.cat.work + R.cat.relationship) / 2 - (sG === 'officer' ? 4 : 0), 55, 95) : clamp(R.avg + (sG === 'resource' ? 6 : -2), 55, 95);
  const picked = calSel ? R.days.find(d => d.iso === calSel) : undefined;

  return (
    <>
      <SubHead title="01 · 이달의 사주 기운" caption={'월운(月運) · ' + pText(mp)} />
      <View style={s.grid3}>
        {([['천간', TG[sTG]], ['지지', TG[bTG]], ['12운성', STAGE12[st]]] as const).map(([l, v]) => (
          <Card key={l} style={s.cell3}><Text style={txt.caption}>{l}</Text><Text style={{ fontSize: 17, fontWeight: '700', marginTop: 6, color: colors.purple }}>{v}</Text></Card>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        <Para mt={0}>{PERIOD_TEXT.month[rel][1]} 이달 겉으로 드러나는 기운은 {TG[sTG]}({TG_INFO[sTG].key}), 바탕에 깔린 기운은 {TG[bTG]}({TG_INFO[bTG].key})이에요. 에너지 단계는 "{STAGE12_INFO[st]}"예요.</Para>
        {flags.map(f => <Bullet key={f}>{f}</Bullet>)}
      </Card>

      <SubHead title={`02 · 4가지 관점으로 본 ${R.m}월`} />
      <ViewsCard views={{ saju: `${pText(mp)}월은 나와 ${tenName(rel)} 관계예요. ${MONTH_LINE[sG][1]}`, thai: thaiTxt, mbti: mbtiTxt, blood: bloodTxt }} />

      <SubHead title="03 · 분야별 6대 운세" />
      <View style={{ gap: 10 }}>
        {FIELD_META.map(([k, e, l]) => {
          const v = fieldScore(k as FieldKey);
          const extra = ['money', 'work', 'love', 'people'].includes(k) ? ' ' + CAT_TEXT[k === 'people' ? 'relationship' : (k as 'money' | 'work' | 'love')][band(v)][sel.m % 2] : '';
          return (
            <Card key={k}>
              <View style={s.between}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{e} {l}</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: scoreColor(v) }}>{v}</Text>
              </View>
              <View style={{ marginTop: 10, marginBottom: 2 }}><ScoreBar value={v} color={colors.purpleSoft} /></View>
              <Para>{FIELD[sG][k as FieldKey] + extra}</Para>
            </Card>
          );
        })}
      </View>

      <SubHead title="04 · 주차별 흐름" />
      <View style={{ gap: 10 }}>
        {weeks.map(w => (
          <Card key={w.w}>
            <View style={s.between}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{w.w + 1}주차 <Text style={[txt.caption, { fontWeight: '500' }]}>{R.m}/{w.from} ~ {R.m}/{w.to}</Text></Text>
              <Text style={{ fontWeight: '700', color: scoreColor(w.av) }}>{w.av}</Text>
            </View>
            <Text style={[txt.body, { fontSize: 14, marginTop: 6 }]}>{emojiFor(w.kw)} "{w.kw}"이 이끄는 한 주예요. 가장 좋은 날은 {w.bd.d}일({WEEK[weekdayOf(w.bd.iso)]}).</Text>
            <Text style={[txt.small, { marginTop: 4 }]}>이번 주 실천 · {w.act}</Text>
          </Card>
        ))}
      </View>

      <SubHead title="05 · 운세 달력" caption="날짜를 누르면 그날의 상세 운세가 보여요" />
      <Card style={{ padding: 14 }}>
        <FortuneCalendar days={R.days} first={R.first} today={today} sel={calSel} best={bestSet} onSelect={iso => setCalSel(c => (c === iso ? null : iso))} />
        {picked ? (
          <View style={s.calInfo}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{picked.d}일 {WEEK[weekdayOf(picked.iso)]}요일 · {pText(dayPillar(picked.iso))}일 · {picked.total}점</Text>
            <Text style={{ fontSize: 13, color: colors.inkSub }}>{picked.c.summary}</Text>
            <Text style={{ fontSize: 12, color: colors.inkMute }}>緣 {picked.c.love} · 財 {picked.c.money} · 業 {picked.c.work} · 人 {picked.c.relationship} · 행운의 시간 {picked.c.luckyTime}</Text>
            <Text style={{ fontSize: 12, color: colors.success }}>✓ {picked.c.goodActions[0]}</Text>
            <Text style={{ fontSize: 12, color: colors.danger }}>✕ {picked.c.avoidActions[0]}</Text>
          </View>
        ) : null}
      </Card>

      <SubHead title="06 · 날짜별 운세" caption={`한 달 ${R.n}일 전체`} />
      <Card style={{ paddingVertical: 2, paddingHorizontal: 14 }}>
        {R.days.map((x, i) => {
          const dp = dayPillar(x.iso); const isToday = x.iso === today;
          return (
            <View key={x.iso} style={[s.drow, i ? s.topLine : null, isToday && s.drowToday]}>
              <View style={s.dd}>
                <Text style={{ fontFamily: fonts.serif, fontSize: 16, fontWeight: '600', color: colors.ink }}>{x.d}</Text>
                <Text style={{ fontSize: 11, color: weekdayOf(x.iso) === 0 ? colors.seal : colors.inkMute }}>{WEEK[weekdayOf(x.iso)]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', lineHeight: 20, color: colors.ink }}>{x.c.summary}</Text>
                <Text style={[txt.caption, { marginTop: 2 }]}>{pText(dp)} · {TG[tenGod(F.ds, dp.stem)]} · {emojiFor(x.c.keywords[0])} {x.c.keywords[0]} · {x.c.luckyTime}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: scoreColor(x.total) }}>{x.total}{bestSet.has(x.d) ? ' 吉' : ''}</Text>
            </View>
          );
        })}
      </Card>

      <SubHead title="07 · 좋은 날과 조심할 날" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
        {R.best.map((x, i) => (
          <View key={x.iso} style={[s.lrow, i ? s.topLine : null]}>
            <Seal ch="吉" bg={colors.moneyBg} color={colors.money} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{x.d}일 {WEEK[weekdayOf(x.iso)]}요일</Text>
              <Text style={txt.small}>{x.c.summary} 중요한 약속·결정에 좋아요.</Text>
            </View>
            <Text style={{ color: colors.purple, fontSize: 17, fontWeight: '700' }}>{x.total}</Text>
          </View>
        ))}
        {R.low.map(x => (
          <View key={x.iso} style={[s.lrow, s.topLine]}>
            <Seal ch="愼" bg={colors.line} color={colors.inkMute} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{x.d}일 {WEEK[weekdayOf(x.iso)]}요일</Text>
              <Text style={txt.small}>{x.c.avoidActions[0]}을(를) 피하고, 큰 결정은 하루 미뤄보세요.</Text>
            </View>
            <Text style={{ color: colors.inkMute, fontSize: 17, fontWeight: '700' }}>{x.total}</Text>
          </View>
        ))}
      </Card>

      <SubHead title="08 · 이달의 개운법" />
      <InfoRows labelWidth={90} rows={[['色', '행운의 색', L.color], ['數', '행운의 숫자', L.num], ['食', '추천 음식', L.food], ['行', '추천 활동', L.act]]} />

      <SubHead title="09 · 이달의 미션" caption="이달 키워드에서 뽑은 작은 실천" />
      <Card style={{ gap: 12 }}>
        {R.missions.map((x, i) => {
          const key = `${R.y}-${R.m}-${i}`; const on = !!missions[key];
          return (
            <PressableScale key={key} onPress={() => toggleMission(key)} style={s.mission} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <View style={[s.box, on && s.boxOn]}>{on ? <Icon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}</View>
              <Text style={{ flex: 1, fontSize: 15, color: colors.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{x}</Text>
            </PressableScale>
          );
        })}
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  calInfo: { marginTop: 12, backgroundColor: colors.lavenderSoft, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  drow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  drowToday: { backgroundColor: colors.lavenderSoft, marginHorizontal: -14, paddingHorizontal: 14 },
  dd: { width: 40, alignItems: 'center' },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
});
