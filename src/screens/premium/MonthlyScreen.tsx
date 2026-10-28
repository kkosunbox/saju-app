import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { RouteProp, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import ScoreRing from '../../components/ScoreRing';
import ScoreBar from '../../components/ScoreBar';
import KeywordChip, { emojiFor } from '../../components/KeywordChip';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, ChipSelect, FortuneCalendar, HeadRow, LockGate, Hero, Para, heroTxt, scoreColor } from '../../components/premium/Kit';
import { Closing, InfoRows, SajuHeading, SajuIconName, SubHead } from '../../components/premium/SajuParts';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS } from '../../services/premium/catalog';
import { WEEK, dayPillar, daysInMonth, monthPillarOf, pText, pad2 } from '../../services/premium/helpers';
import { MonthPreview, MonthReport, SajuFull } from '../../types/premium';
import { Pillar } from '../../types/content';
import { MonthReading, ReadingView } from '../../types/reading';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { EL_LUCK } from '../../services/premium/data';
import { ELEMENT_INFO } from '../../data/sajuData';
import { parseISO, weekdayOf } from '../../utils/date';
import { colors, isDark } from '../../theme/colors';
import { radius, sansW, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { monthlySpec } from '../../services/share/shareSpecs';

export default function MonthlyScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Monthly'>>();
  const { user: u, today } = useApp();
  const t = parseISO(today);
  const [sel, setSel] = useState(params?.y && params?.m ? { y: Number(params.y), m: Number(params.m) } : { y: t.y, m: t.m });
  const ref = { kind: 'monthly', month: `${sel.y}-${pad2(sel.m)}` } as const;
  const content = usePremiumContent<MonthContent>(ref);
  const { reading, retry } = useReading<MonthReading>(content);
  const preview = usePremiumPreview<MonthPreview>(ref, !content.open);
  if (!u?.natal) return null;
  const item = ITEMS.monthly(sel.y, sel.m);
  const R = content.data?.data; const F = content.data?.F;
  const top: MonthPreview | undefined = R ?? preview.data;
  const mp = monthPillarOf(sel.y, sel.m);
  // 살 수 있는 달: 지난달부터 12개월 뒤까지 (서버 카탈로그와 같은 범위)
  const months: [string, string, string][] = [];
  for (let i = -1; i <= 12; i++) {
    const d = new Date(t.y, t.m - 1 + i, 1);
    months.push([`${d.getFullYear()}-${d.getMonth() + 1}`, `${d.getMonth() + 1}월`, d.getFullYear() !== t.y ? String(d.getFullYear()) : i === 0 ? '이번 달' : '']);
  }
  const spec = R ? monthlySpec(u, R) : null;

  return (
    <Screen title="월별 상세운세" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`${sel.y}년 ${sel.m}월 1일 ~ ${daysInMonth(sel.y, sel.m)}일`} />
      <ChipSelect<string> items={months} value={`${sel.y}-${sel.m}`} onChange={v => { const [yy, mm] = v.split('-').map(Number); setSel({ y: yy, m: mm }); }} />
      {top ? (
        <Hero style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ScoreRing key={item.key} score={top.avg} size={104} stroke={8} label="이달 평균" />
          <View style={{ flex: 1 }}>
            <Text style={heroTxt.eyebrow}>{u.nickname}님의 {sel.m}월 · {pText(mp)}월</Text>
            {/* 결제 전에 보여준 문장 그대로 (AI 한 줄은 본문 01에) */}
            <Text style={heroTxt.summ}>{top.line.headline}</Text>
            <Text style={s.heroSub}>{top.line.sub}</Text>
            <View style={s.chips}>{top.kws.map(k => <KeywordChip key={k} label={k} tone="onDark" />)}</View>
          </View>
        </Hero>
      ) : <BodyState error={preview.isError} />}
      {!content.open ? <LockGate key={item.key} item={item} />
        : R && F ? <MonthlyBody key={item.key} R={R} F={F} reading={reading} onRetry={retry} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} banner style={{ marginTop: 16 }} />
      <Disclaimer compact mt={24} />
    </Screen>
  );
}

interface MonthDetails {
  pillar: Pillar; stemTenGod: string; branchTenGod: string; stage: string;
  flags: { key: string; label: string }[];
  weeks: { from: number; to: number; avg: number; bestDay: number; keyword: string }[];
}
type MonthContent = MonthReport & { details: MonthDetails };

const FIELDS: ['love' | 'money' | 'work' | 'relationship', SajuIconName, string][] = [['love', 'heart', '연애운'], ['money', 'database', '재물운'], ['work', 'work', '일·학업운'], ['relationship', 'people', '인간관계']];

/** 섹션 제목 — 이 화면 디자인은 설명 자간이 -0.07em */
function Head(p: { title: string; caption?: string }) {
  return <SubHead {...p} captionStyle={{ letterSpacing: -0.91 }} />;
}

/** 좋은 날 ✓ · 조심할 날 − 표시 (흰 칸 안의 16 아이콘) */
function DayMark({ good }: { good?: boolean }) {
  return <View style={s.dayMark}><Image source={good ? require('../../../assets/figma/monthly/good-day.svg') : require('../../../assets/figma/monthly/low-day.svg')} style={{ width: 16, height: 16 }} contentFit="contain" /></View>;
}

/** 점수·간지·날짜는 서버 계산값, 글은 AI 풀이 */
function MonthlyBody({ R, F, reading, onRetry }: { R: MonthContent; F: SajuFull; reading: ReadingView<MonthReading> | null; onRetry(): void }) {
  const { today } = useApp();
  const { missions, toggleMission } = usePremium();
  const [calSel, setCalSel] = useState<string | null>(null);
  const X = R.details;
  const bestSet = new Set(R.best.map(b => b.d));
  const L = EL_LUCK[F.yong];
  const picked = calSel ? R.days.find(d => d.iso === calSel) : undefined;
  const writing = reading?.status === 'writing';
  const { overview, days } = reading?.parts ?? {};
  const missionList = overview?.missions ?? (writing ? [] : R.missions);

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />

      <Head title={`01 · ${R.m}월 총운`} />
      <Card>{overview ? <><Text style={txt.h3}>{overview.headline}</Text><Para>{overview.summary}</Para></> : <PartPending writing={writing} lines={4} />}</Card>

      <Head title="02 · 이달의 사주 기운" caption={'월운(月運) · ' + pText(X.pillar)} />
      <View style={s.grid3}>
        {([['천간', X.stemTenGod], ['지지', X.branchTenGod], ['12운성', X.stage]] as const).map(([l, v]) => (
          <Card key={l} style={s.cell3}><Text style={txt.caption}>{l}</Text><Text style={{ fontSize: 17, fontWeight: '700', marginTop: 6, color: colors.purple }}>{v}</Text></Card>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        {overview ? <Para mt={0}>{overview.energy}</Para> : <PartPending writing={writing} lines={3} />}
        {X.flags.map(f => <Bullet key={f.key}>{f.label}</Bullet>)}
      </Card>

      <Head title="03 · 분야별 운세" />
      <View style={{ gap: 10 }}>
        {FIELDS.map(([k, e, l]) => {
          const v = R.cat[k]; const t = overview?.fields[k];
          return (
            <Card key={k}>
              <View style={s.between}>
                <SajuHeading title={l} icon={e} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: scoreColor(v) }}>{v}</Text>
              </View>
              <View style={{ marginTop: 10, marginBottom: 2 }}><ScoreBar value={v} color={colors.purpleSoft} /></View>
              {t ? (
                <>
                  <Text style={[txt.bodyStrong, { marginTop: 8 }]}>{t.headline}</Text>
                  <Para>{t.text}</Para>
                  <Text style={[txt.small, { marginTop: 6, color: colors.purple }]}>이달 해 볼 것 · {t.tip}</Text>
                </>
              ) : <PartPending writing={writing} lines={2} />}
            </Card>
          );
        })}
      </View>

      <Head title="04 · 주차별 흐름" />
      <View style={{ gap: 10 }}>
        {X.weeks.map((w, i) => {
          const t = days?.weeks[i];
          return (
            <Card key={w.from}>
              <View style={s.between}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{i + 1}주차 <Text style={[txt.caption, { fontWeight: '500' }]}>{R.m}/{w.from} ~ {R.m}/{w.to} · {emojiFor(w.keyword)} {w.keyword}</Text></Text>
                <Text style={{ fontWeight: '700', color: scoreColor(w.avg) }}>{w.avg}</Text>
              </View>
              {t ? (
                <>
                  <Text style={[txt.bodyStrong, { marginTop: 6 }]}>{t.title}</Text>
                  <Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{t.text}</Text>
                </>
              ) : <PartPending writing={writing} lines={2} />}
            </Card>
          );
        })}
      </View>

      <Head title="05 · 운세 달력" caption="날짜를 누르면 그날의 운세가 보여요" />
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

      <Head title="06 · 좋은 날과 조심할 날" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
        {R.best.map((x, i) => (
          <View key={x.iso} style={[s.lrow, i ? s.topLine : null]}>
            <DayMark good />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{x.d}일 {WEEK[weekdayOf(x.iso)]}요일 · {pText(dayPillar(x.iso))}일</Text>
              {days ? <Text style={txt.small}>{days.bestDays[i]}</Text> : writing ? <PartPending writing lines={2} /> : <Text style={txt.small}>{x.c.summary}</Text>}
            </View>
            <Text style={{ color: colors.purple, fontSize: 17, fontWeight: '700' }}>{x.total}</Text>
          </View>
        ))}
        {R.low.map((x, i) => (
          <View key={x.iso} style={[s.lrow, s.topLine]}>
            <DayMark />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{x.d}일 {WEEK[weekdayOf(x.iso)]}요일 · {pText(dayPillar(x.iso))}일</Text>
              {days ? <Text style={txt.small}>{days.lowDays[i]}</Text> : writing ? <PartPending writing lines={2} /> : <Text style={txt.small}>{x.c.avoidActions[0]}을(를) 피하고, 큰 결정은 하루 미뤄보세요.</Text>}
            </View>
            <Text style={{ color: colors.inkMute, fontSize: 17, fontWeight: '700' }}>{x.total}</Text>
          </View>
        ))}
      </Card>

      <Head title="07 · 이달의 개운법" caption={`용신 ${ELEMENT_INFO[F.yong].ko}(${ELEMENT_INFO[F.yong].hanja}) 기준`} />
      <InfoRows rowStyle={{ paddingRight: 20 }} rows={[['luck-color', '행운의 색', L.color], ['luck-number', '행운의 숫자', L.num], ['luck-food', '추천 음식', L.food], ['luck-activity', '추천 활동', L.act]]} />

      <Head title="08 · 이달의 미션" caption="이달 기운에 맞춘 작은 실천" />
      <View style={{ paddingLeft: 4 }}>
        {missionList.length ? missionList.map((x, i) => {
          const key = `${R.y}-${R.m}-${i}`; const on = !!missions[key];
          return (
            <PressableScale key={key} onPress={() => toggleMission(key)} style={s.mission} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <View style={[s.box, on && s.boxOn]}>{on ? <Icon name="check" size={11} color={colors.accent} strokeWidth={2.6} /> : null}</View>
              <Text style={[s.missionText, on && s.missionOn]}>{x}</Text>
            </PressableScale>
          );
        }) : <PartPending writing={writing} lines={3} />}
      </View>
      {overview ? <Closing title="이달을 위한 한마디" style={{ marginTop: 32 }}>{overview.closing}</Closing> : null}
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  heroSub: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  calInfo: { marginTop: 12, backgroundColor: colors.lavenderSoft, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  dayMark: { width: 31, height: 31, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  // 미션: 카드 없이 32 높이 줄, 한 것은 하늘색 굵게
  mission: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  box: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: isDark ? colors.lineStrong : '#E8E8E8', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: isDark ? colors.surface : '#E7F0FF', borderColor: isDark ? colors.surface : '#E7F0FF' },
  missionText: { flex: 1, ...sansW('600'), fontSize: 12, lineHeight: 18, letterSpacing: -0.48, color: colors.inkMute, paddingVertical: 7 },
  missionOn: { ...sansW('700'), color: colors.accent },
});
