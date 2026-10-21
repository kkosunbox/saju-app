import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import Disclaimer from '../components/Disclaimer';
import { AlmanacHero, Figure, Ledger, Quote } from '../components/Almanac';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { analysisTheme, colors } from '../theme/colors';
import { fonts, radius, sansW } from '../theme/typography';
import { KEYWORDS } from '../data/keywords';
import { LockCard } from '../components/premium/Kit';
import { ITEMS } from '../services/premium/catalog';
import { BRANCHES, ELEMENT_INFO, Element, STEMS } from '../data/sajuData';
import { THAI_DAYS, ThaiDay, WEEKDAY_TO_THAI } from '../data/thaiData';
import { Pillar } from '../types/content';
import { AXES, MBTI_INFO } from '../data/mbtiData';
import { AstroSystemReading, BloodType, User } from '../types';
import { weekdayOf } from '../utils/date';
import { useMarkOpened } from '../services/content/opened';

const KICKER = { saju: '四柱 · 사주', thai: '星占 · 점성술', mbti: '性向 · MBTI', blood: '血型 · 혈액형' } as const;
const NOTE: Record<string, string> = {
  saju: '한국천문연구원 음양력 자료와 절기 시각으로 세운 만세력이에요. 태어난 시각은 서울 기준으로 보정해요.',
  thai: '서양은 태양 별자리와 오늘의 달, 인도는 달 라시(시데리얼)에서 본 오늘 달의 자리, 태국은 태어난 요일의 수호 행성으로 풀어요.',
  mbti: 'MBTI는 예측이 아닌 성향 분석이에요.',
  blood: '혈액형 성격론은 재미를 위한 콘텐츠예요.',
};

/** 4가지 관점 상세 — 책력 한 장 + 관점별 도해 + 풀이 + 장부형 분석 */
export default function AnalysisDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'AnalysisDetail'>>();
  const { fortune, user, today } = useApp();
  useMarkOpened('fortune');
  const nav = useNavigation();
  if (!fortune || !user) return null;
  const a = fortune.analyses[params.source];
  const t = analysisTheme[params.source];

  return (
    <Screen title={t.label} back>
      <AlmanacHero tone={t} kicker={KICKER[a.source]} seal={t.emoji} eyebrow={t.sub} title={a.headline} today={today} tags={a.tags.map(tag => KEYWORDS[tag].label)}>
        <Quote label="오늘의 풀이" text={a.description} tone={t.color} />
      </AlmanacHero>

      {a.source === 'saju' && user.natal ? <SajuFigure u={user} day={fortune.dayPillar ?? null} tone={t.color} /> : null}
      {a.source === 'thai' && a.systems ? <AstroSystems systems={a.systems} u={user} today={today} tone={t.color} /> : null}
      {a.source === 'thai' && !a.systems && user.natal ? <ThaiFigure u={user} today={today} tone={t.color} /> : null}
      {a.source === 'mbti' ? <MbtiFigure u={user} focus={a.details[2]?.value ?? ''} tone={t.color} /> : null}
      {a.source === 'blood' ? <BloodFigure b={user.bloodType} tone={t.color} /> : null}

      {a.systems ? null : (
        <>
          <SectionHeader title="분석 내용" />
          <Ledger rows={a.details.map(d => [d.label, d.value] as [string, string])} tone={t.color} />
        </>
      )}

      {a.source === 'saju' ? (
        <LockCard mt={12} title="상세 사주 해석 보기" desc="원국표 · 오행 분포 · 나의 본성 · 올해와 이달의 흐름" item={ITEMS.sajuDeep()} onPress={() => nav.navigate('SajuDeep')} />
      ) : null}
      <Text style={s.note}>{NOTE[a.source]}</Text>
      <Disclaimer compact />
    </Screen>
  );
}

/* ---------- 사주: 원국표 + 오행 분포 ---------- */
const EL_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
function SajuFigure({ u, day, tone }: { u: User; day: Pillar | null; tone: string }) {
  const ch = u.natal!.chart;
  const cols: [string, typeof ch.day | null][] = [['시', ch.hour], ['일', ch.day], ['월', ch.month], ['년', ch.year]];
  const cnt = u.natal!.elementCounts; const total = EL_ORDER.reduce((n, e) => n + cnt[e], 0) || 1;
  return (
    <Figure title="나의 사주 원국" caption={day ? `오늘의 일진 ${STEMS[day.stem].hanja}${BRANCHES[day.branch].hanja}` : ''}>
      <View style={s.pillars}>
        {cols.map(([l, p]) => (
          <View key={l} style={[s.pillar, l === '일' && { borderColor: tone, backgroundColor: tone + '12' }]}>
            <Text style={[s.pLabel, l === '일' && { color: tone }]}>{l}주{l === '일' ? ' · 나' : ''}</Text>
            {p ? (
              <>
                <Text style={[s.pHan, { color: ELEMENT_INFO[STEMS[p.stem].element].hex }]}>{STEMS[p.stem].hanja}</Text>
                <Text style={[s.pHan, { color: ELEMENT_INFO[BRANCHES[p.branch].element].hex }]}>{BRANCHES[p.branch].hanja}</Text>
              </>
            ) : <Text style={s.pUnknown}>미상</Text>}
          </View>
        ))}
      </View>
      <Text style={s.subTitle}>오행 분포</Text>
      <View style={s.elBar}>
        {EL_ORDER.filter(e => cnt[e] > 0).map(e => <View key={e} style={{ flex: cnt[e] / total, backgroundColor: ELEMENT_INFO[e].hex }} />)}
      </View>
      <View style={s.elLegend}>
        {EL_ORDER.map(e => (
          <View key={e} style={s.elItem}>
            <Text style={[s.elHan, { color: ELEMENT_INFO[e].hex }]}>{ELEMENT_INFO[e].hanja}</Text>
            <Text style={[s.elCnt, cnt[e] === 0 && { color: colors.danger }]}>{cnt[e]}</Text>
          </View>
        ))}
      </View>
    </Figure>
  );
}

/* ---------- 점성술: 서양 · 인도 · 태국 ---------- */
const ASTRO_CAPTION = { western: '태양 별자리 × 오늘의 달', vedic: '달 라시 × 오늘의 달', thai: '태어난 요일 × 오늘의 행성' } as const;
function AstroSystems({ systems, u, today, tone }: { systems: AstroSystemReading[]; u: User; today: string; tone: string }) {
  return (
    <>
      <SectionHeader title="세 갈래 점성술" />
      {systems.map(x => (
        <Figure key={x.system} title={x.title} caption={ASTRO_CAPTION[x.system]}>
          <Text style={s.astroHead}>{x.headline}</Text>
          <Text style={s.astroDesc}>{x.description}</Text>
          <View style={s.astroTags}>
            {x.tags.map(tag => <Text key={tag} style={[s.astroTag, { color: tone }]}>#{KEYWORDS[tag].label}</Text>)}
          </View>
          {x.system === 'thai' && u.natal ? <View style={{ marginTop: 16 }}><ThaiWeek u={u} today={today} tone={tone} /></View> : null}
          <View style={{ marginTop: 14 }}>
            <Ledger rows={x.details.map(d => [d.label, d.value] as [string, string])} tone={tone} />
          </View>
        </Figure>
      ))}
    </>
  );
}

/* ---------- 태국 점성술: 일주일 띠 ---------- */
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
function ThaiFigure({ u, today, tone }: { u: User; today: string; tone: string }) {
  const mine = u.natal!.thaiBirthDay;
  return (
    <Figure title="일곱 요일의 행성" caption="● 태어난 요일 · ▬ 오늘">
      <ThaiWeek u={u} today={today} tone={tone} />
      <Text style={[s.figNote, { borderLeftColor: tone }]}>{THAI_DAYS[mine].label}생 · 수호 행성 {THAI_DAYS[mine].planetKo} · 행운색 {THAI_DAYS[mine].color}</Text>
    </Figure>
  );
}
function ThaiWeek({ u, today, tone }: { u: User; today: string; tone: string }) {
  const mine = u.natal!.thaiBirthDay;
  const mineIdx = WEEKDAY_TO_THAI.indexOf(mine === 'wedNight' ? 'wedDay' : mine);
  const todayIdx = weekdayOf(today);
  return (
    <View style={s.week}>
      {WEEKDAY_TO_THAI.map((k: ThaiDay, i) => {
        const d = THAI_DAYS[k]; const isMine = i === mineIdx; const isToday = i === todayIdx;
        return (
          <View key={k} style={s.day}>
            <View style={[s.dot, { backgroundColor: isMine ? d.hex : 'transparent', borderColor: d.hex }, isToday && s.todayRing]} />
            <Text style={[s.dayL, (isMine || isToday) && { color: colors.ink, fontWeight: '800' }]}>{WEEK[i]}</Text>
            <Text style={s.planet}>{d.planetKo}</Text>
            {isToday ? <View style={[s.todayMark, { backgroundColor: tone }]} /> : <View style={s.todayMark} />}
          </View>
        );
      })}
    </View>
  );
}

/* ---------- MBTI: 4개 축 ---------- */
function MbtiFigure({ u, focus, tone }: { u: User; focus: string; tone: string }) {
  return (
    <Figure title={`${u.mbti} · ${MBTI_INFO[u.mbti].nickname}${u.mbtiUnknown ? ' (추정)' : ''}`} caption="오늘 강조되는 축 ●">
      <View style={{ gap: 14 }}>
        {AXES.map(([l, r, name], i) => {
          const left = u.mbti[i] === l; const hot = focus.startsWith(name);
          return (
            <View key={name}>
              <View style={s.axisHead}>
                <Text style={[s.axisName, hot && { color: tone }]}>{hot ? '● ' : ''}{name}</Text>
              </View>
              <View style={s.axis}>
                <Text style={[s.axisL, left && { color: tone }]}>{l}</Text>
                <View style={s.axisTrack}>
                  <View style={[s.axisFill, { backgroundColor: tone, [left ? 'left' : 'right']: 0 } as object]} />
                </View>
                <Text style={[s.axisL, !left && { color: tone }]}>{r}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Figure>
  );
}

/* ---------- 혈액형 ---------- */
function BloodFigure({ b, tone }: { b: BloodType; tone: string }) {
  return (
    <Figure title="나의 혈액형">
      <View style={s.bloodRow}>
        {(['A', 'B', 'O', 'AB'] as BloodType[]).map(x => (
          <View key={x} style={[s.blood, x === b ? { backgroundColor: tone, borderColor: tone } : null]}>
            <Text style={[s.bloodT, x === b && { color: '#FBF4E8' }]}>{x}</Text>
            <Text style={[s.bloodS, x === b && { color: 'rgba(251,244,232,0.8)' }]}>형</Text>
          </View>
        ))}
      </View>
    </Figure>
  );
}

const s = StyleSheet.create({
  astroHead: { ...sansW('700'), fontSize: 16, lineHeight: 23, color: colors.ink, letterSpacing: -0.3 },
  astroDesc: { fontSize: 14, lineHeight: 21, color: colors.inkSub, marginTop: 6 },
  astroTags: { flexDirection: 'row', gap: 8, marginTop: 8 },
  astroTag: { fontSize: 12, fontWeight: '700' },
  note: { fontSize: 12, color: colors.inkMute, textAlign: 'center', marginTop: 16 },
  pillars: { flexDirection: 'row', gap: 8 },
  pillar: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cream },
  pLabel: { fontSize: 12, fontWeight: '700', color: colors.inkMute },
  pHan: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 34, fontWeight: '700', marginTop: 2 },
  pUnknown: { fontSize: 12, color: colors.inkMute, marginTop: 24, marginBottom: 20 },
  subTitle: { fontSize: 12, fontWeight: '700', color: colors.inkSub, marginTop: 18, marginBottom: 8 },
  elBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  elLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  elItem: { alignItems: 'center', flex: 1 },
  elHan: { fontFamily: fonts.serif, fontSize: 17, fontWeight: '700' },
  elCnt: { fontSize: 12, fontWeight: '700', color: colors.inkSub, marginTop: 1 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', flex: 1, gap: 5 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  todayRing: { shadowColor: '#000', shadowOpacity: 0, borderWidth: 3, transform: [{ scale: 1.12 }] },
  dayL: { fontSize: 13, fontWeight: '600', color: colors.inkSub },
  planet: { fontSize: 12, color: colors.inkMute },
  todayMark: { width: 14, height: 3, borderRadius: 2 },
  figNote: { marginTop: 16, paddingLeft: 10, borderLeftWidth: 2, fontSize: 13, lineHeight: 19, color: colors.inkSub },
  axisHead: { flexDirection: 'row', justifyContent: 'space-between' },
  axisName: { fontSize: 12, fontWeight: '700', color: colors.inkMute },
  axis: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  axisL: { width: 16, textAlign: 'center', fontFamily: fonts.serif, fontSize: 17, fontWeight: '700', color: colors.inkMute },
  axisTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  axisFill: { position: 'absolute', top: 0, bottom: 0, width: '58%', borderRadius: 4 },
  bloodRow: { flexDirection: 'row', gap: 8 },
  blood: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cream },
  bloodT: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.inkMute },
  bloodS: { fontSize: 12, fontWeight: '600', color: colors.inkMute, marginLeft: 2 },
});
