import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ScoreRing from '../../components/ScoreRing';
import ScoreBar from '../../components/ScoreBar';
import KeywordChip from '../../components/KeywordChip';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, ChipSelect, HeadRow, LockGate, Hero, MonthBars, Para, Tip, heroTxt, scoreColor } from '../../components/premium/Kit';
import { Closing, InfoRows, Para as LuckPara, SajuHeading, SajuIconName, SubHead } from '../../components/premium/SajuParts';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';
import { ITEMS } from '../../services/premium/catalog';
import { CATS, pText } from '../../services/premium/helpers';
import { SajuFull, YearData, YearPreview } from '../../types/premium';
import { Pillar } from '../../types/content';
import { ReadingView, YearReading } from '../../types/reading';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { EL_LUCK } from '../../services/premium/data';
import { BRANCHES, STEMS } from '../../data/sajuData';
import { categoryTheme, colors } from '../../theme/colors';
import { sansW, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { newYearSpec } from '../../services/share/shareSpecs';

type FieldKey = 'money' | 'work' | 'love' | 'health' | 'people' | 'study';

export default function NewYearScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'NewYear'>>();
  const { user: u, today } = useApp();
  const cy = Number(today.slice(0, 4));
  const [y, setY] = useState(Number(params?.year) || cy);
  const ref = { kind: 'newyear', year: y } as const;
  const content = usePremiumContent<YearContent>(ref);
  const { reading, retry } = useReading<YearReading>(content);
  const preview = usePremiumPreview<YearPreview>(ref, !content.open);
  if (!u) return null;
  const item = ITEMS.newyear(y);
  const D = content.data?.data; const F = content.data?.F;
  const top: YearPreview | undefined = D ?? preview.data;
  const idiom = top?.idiom ?? null;
  const spec = D ? newYearSpec(u, D) : null;

  return (
    <Screen title="신년운세" back right={<ShareIconButton item={item} spec={spec} />}>
      <HeadRow item={item} caption={`${top ? top.myAnimal + '띠 · ' : ''}${u.mbti} · ${u.bloodType}형`} />
      <ChipSelect<number> items={[[cy, cy + '년', '올해'], [cy + 1, cy + 1 + '년', '새해 미리보기']]} value={y} onChange={setY} />
      {top && idiom ? (
        <Hero style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={heroTxt.eyebrow}>{y}년 {STEMS[top.yp.stem].ko}{BRANCHES[top.yp.branch].ko}년 · {top.animal}의 해</Text>
          <Text style={{ fontSize: 30, fontWeight: '800', letterSpacing: 2, marginTop: 10, color: colors.white }}>{idiom[0]}</Text>
          <Text style={{ fontSize: 13, color: colors.moon, marginTop: 2 }}>{idiom[1]} · {idiom[2]}</Text>
          <View style={{ marginTop: 16 }}><ScoreRing key={y} score={top.total} size={108} stroke={8} label="올해 종합" /></View>
          <View style={s.chips}>{top.kws.map(k => <KeywordChip key={k} label={k} tone="onDark" />)}</View>
        </Hero>
      ) : <BodyState error={preview.isError} />}
      {!content.open ? <LockGate key={item.key} item={item} />
        : D ? <NewYearBody D={D} F={F ?? null} reading={reading} onRetry={retry} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={spec} />
      <Disclaimer compact mt={24} />
    </Screen>
  );
}

interface YearDetails {
  stemTenGod: string; branchTenGod: string; stage: string;
  flags: { key: string; label: string }[]; samjae: string | null; spouseYear: boolean;
  fields: { key: FieldKey; label: string; score: number }[];
  months: { m: number; pillar: Pillar; tenGod: string }[];
}
type YearContent = YearData & { details: YearDetails };

const FIELD_ICON: Record<FieldKey, SajuIconName> = { money: 'database', work: 'work', love: 'heart', health: 'pulse', people: 'users', study: 'study' };

/** 점수·간지·신살은 서버 계산값, 글은 AI 풀이 */
function NewYearBody({ D, F, reading, onRetry }: { D: YearContent; F: SajuFull | null; reading: ReadingView<YearReading> | null; onRetry(): void }) {
  const nav = useNavigation();
  const y = D.y; const X = D.details;
  const writing = reading?.status === 'writing';
  const { overview, fields, months } = reading?.parts ?? {};
  const goMonth = (m: number) => nav.navigate('Monthly', { y, m });
  const L = F ? EL_LUCK[F.yong] : null;

  return (
    <>
      <ReadingBanner reading={reading} onRetry={onRetry} />

      <SubHead title={`01 · ${y}년 총운`} />
      <Card>
        {overview ? (
          <>
            <Text style={txt.h3}>{overview.headline}</Text>
            <Para>{overview.summary}</Para>
          </>
        ) : <PartPending writing={writing} lines={4} />}
      </Card>

      <SubHead title="02 · 올해의 사주 기운" caption="세운(歲運)과 나의 관계" />
      <View style={s.grid3}>
        {([['천간 십성', X.stemTenGod], ['지지 십성', X.branchTenGod], ['12운성', X.stage]] as const).map(([l, v]) => (
          <Card key={l} style={s.cell3}>
            <Text style={txt.caption}>{l}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 6, color: colors.purple }}>{v}</Text>
          </Card>
        ))}
      </View>
      {overview ? <Card style={{ marginTop: 12 }}><Para mt={0}>{overview.energy}</Para></Card> : writing ? <Card style={{ marginTop: 12 }}><PartPending writing lines={3} /></Card> : null}

      <SubHead title="03 · 특별한 기운" caption="띠 궁합 · 신살 · 합충 · 삼재" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
        {X.flags.map((f, i) => (
          <View key={f.key} style={[s.flag, i ? s.topLine : null]}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.purpleSoft }}>{FLAG_ICON[f.key.startsWith('zodiac') ? 'zodiac' : f.key] ?? '氣'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{f.label}</Text>
              {overview?.flags[i] ? <Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{overview.flags[i]}</Text> : <PartPending writing={writing} lines={2} />}
            </View>
          </View>
        ))}
        {X.samjae ? null : (
          <View style={[s.flag, s.topLine]}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.purpleSoft }}>安</Text>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>삼재 아님</Text><Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{D.myAnimal}띠는 올해 삼재에 해당하지 않아요.</Text></View>
          </View>
        )}
      </Card>

      <SubHead title="04 · 분야별 6대 운세" />
      <View style={{ gap: 10 }}>
        {X.fields.map(f => {
          const t = fields?.[f.key];
          return (
            <Card key={f.key}>
              <View style={s.between}>
                <SajuHeading title={f.label} icon={FIELD_ICON[f.key]} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: scoreColor(f.score) }}>{f.score}</Text>
              </View>
              <View style={{ marginTop: 10, marginBottom: 2 }}><ScoreBar value={f.score} color={colors.purpleSoft} /></View>
              {t ? (
                <>
                  <Text style={[txt.bodyStrong, { marginTop: 8 }]}>{t.headline}</Text>
                  <Para>{t.text}</Para>
                  <Tip title="올해의 전략" style={{ marginTop: 10 }}>{t.strategy}</Tip>
                </>
              ) : <PartPending writing={writing} lines={3} />}
            </Card>
          );
        })}
      </View>

      <SubHead title="05 · 12개월 흐름" caption="막대를 누르면 그 달의 상세운세로 이동해요" captionStyle={{ letterSpacing: -0.91 }} />
      <MonthBars months={D.months} onPress={goMonth} />
      <View style={{ gap: 10, marginTop: 12 }}>
        {D.months.map((x, i) => {
          const mp = X.months[i]; const t = months?.months[i];
          return (
            <Card key={x.m} onPress={() => goMonth(x.m)} accessibilityLabel={`${x.m}월 상세운세`}>
              <View style={s.between}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{x.m}월</Text>
                  <Text style={txt.caption}>{pText(mp.pillar)} · {mp.tenGod}</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: scoreColor(x.total) }}>{x.total}</Text>
              </View>
              {t ? (
                <>
                  <Text style={[txt.bodyStrong, { marginTop: 6 }]}>{t.title}</Text>
                  <Text style={[txt.body, { fontSize: 14, marginTop: 2 }]}>{t.text}</Text>
                </>
              ) : <PartPending writing={writing} lines={2} />}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {CATS.map(c => <Text key={c} style={s.catScore}>{categoryTheme[c].short}운 · {x[c]}</Text>)}
              </View>
            </Card>
          );
        })}
      </View>

      <SubHead title="06 · 분기 전략" />
      <View style={s.grid2}>
        {D.qs.map((v, i) => {
          const t = months?.quarters[i];
          return (
            <Card key={i} style={s.cell2}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.purpleSoft }}>{i + 1}분기 · {i * 3 + 1}~{i * 3 + 3}월</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 4, color: scoreColor(v) }}>{v}</Text>
              {t ? (
                <>
                  <Text style={[txt.bodyStrong, { marginTop: 2, fontSize: 14 }]}>{t.title}</Text>
                  <Text style={[txt.small, { marginTop: 4 }]}>{t.text}</Text>
                </>
              ) : <PartPending writing={writing} lines={2} />}
            </Card>
          );
        })}
      </View>

      <SubHead title={`07 · ${y}년 개운법`} />
      {L ? <InfoRows rowStyle={{ paddingRight: 20 }} rows={[['luck-color', '올해의 행운 색', L.color], ['luck-number', '행운의 숫자', L.num], ['luck-direction', '좋은 방향', L.dir], ['luck-items', '곁에 두면 좋은 물건', L.items]]} /> : null}
      {overview ? (
        <Card style={{ marginTop: 16 }}>
          <LuckPara mt={0}>{overview.luck.text}</LuckPara>
          <Text style={[s.label, { marginTop: 16 }]}>올해 습관으로 만들 것</Text>
          <View style={{ marginTop: 6 }}>{overview.luck.actions.map((t, i) => <Bullet key={i}>{t}</Bullet>)}</View>
        </Card>
      ) : writing ? <Card style={{ marginTop: 12 }}><PartPending writing /></Card> : null}

      <SubHead title="08 · 주의할 점" />
      {overview ? (
        <>
          <Card>{overview.cautions.map((t, i) => <Bullet key={i} color={CAUTION_DOT}>{t}</Bullet>)}</Card>
          <Closing title="올해를 위한 한마디" top={10}>{overview.closing}</Closing>
        </>
      ) : <Card><PartPending writing={writing} lines={3} /></Card>}
    </>
  );
}

const CAUTION_DOT = '#E54D4D';
const FLAG_ICON: Record<string, string> = { zodiac: '合', dohwa: '桃', yeokma: '驛', gwiin: '貴', dayClash: '沖', dayHap: '人', samjae: '災' };

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 14 },
  grid3: { flexDirection: 'row', gap: 8 },
  cell3: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell2: { width: '47%', flexGrow: 1, padding: 16 },
  flag: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14 },
  label: { ...sansW('600'), fontSize: 16, lineHeight: 19, letterSpacing: -0.8, color: colors.ink },
  catScore: { ...sansW('500'), fontSize: 11, lineHeight: 13, letterSpacing: -0.55, color: colors.inkMute },
  topLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});

