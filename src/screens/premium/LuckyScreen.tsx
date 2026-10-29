import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import SolidIcon, { SolidIconName } from '../../components/SolidIcon';
import Disclaimer from '../../components/Disclaimer';
import { BodyState, Bullet, HeadRow, LockGate, Para, Pill, Rank, SubHead } from '../../components/premium/Kit';
import { PartPending, ReadingBanner } from '../../components/premium/Reading';
import { LuckyReading, ReadingView } from '../../types/reading';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { WEEK, pText } from '../../services/premium/helpers';
import { LuckyDay, LuckyDays, LuckyPreview, PurposeKey, SajuFull } from '../../types/premium';
import { usePremiumContent, usePremiumPreview, useReading } from '../../services/server/premiumApi';
import { EL_LUCK, PURPOSE, PURPOSE_TIPS, STAGE12, TG } from '../../services/premium/data';
import { parseISO, weekdayOf } from '../../utils/date';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import Icon from '../../components/Icon';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { luckySpec } from '../../services/share/shareSpecs';

const dateLabel = (iso: string) => { const { m, d } = parseISO(iso); return `${m}월 ${d}일 ${WEEK[weekdayOf(iso)]}요일`; };

/** 목적 칸 아이콘 — Figma 20×20 틀 안의 그림 크기 */
const PURPOSE_ICON: Record<PurposeKey, [SolidIconName, number]> = {
  move: ['house', 16], contract: ['documentText', 16], confess: ['heartFill', 16], interview: ['work', 13], travel: ['globe', 16], start: ['sprout', 20],
};
const AVOID_RED = '#DD2828';

export default function LuckyScreen() {
  const { user: u, today } = useApp();
  const [pk, setPk] = useState<PurposeKey>('move');
  const ref = { kind: 'lucky', purpose: pk } as const;
  const content = usePremiumContent<LuckyDays>(ref);
  const { reading, retry } = useReading<LuckyReading>(content);
  const preview = usePremiumPreview<LuckyPreview>(ref, !content.open);
  if (!u) return null;
  const item = ITEMS.lucky(pk, today);
  const L = content.data?.data;
  const top = L ? L.list[0] : preview.data?.top;

  return (
    <Screen title="길일 찾기" back right={<ShareIconButton item={item} spec={L ? luckySpec(u, L) : null} />}>
      <HeadRow item={item} caption="앞으로 45일 중에서 골라요" />
      <Text style={[txt.title, { marginTop: 10 }]}>어떤 날을{'\n'}찾고 있나요?</Text>
      <View style={s.grid}>
        {PURPOSE.map(([k, , l]) => {
          const [icon, size] = PURPOSE_ICON[k as PurposeKey];
          return (
            <PressableScale key={k} onPress={() => setPk(k as PurposeKey)} haptic scaleTo={0.95} style={[s.cell, k === pk && s.cellOn]} accessibilityState={{ selected: k === pk }} accessibilityLabel={l}>
              <View style={s.cellIcon}><SolidIcon name={icon} size={size} color={k === pk ? colors.accent : '#999999'} /></View>
              <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 8, color: k === pk ? colors.white : colors.ink }}>{l}</Text>
            </PressableScale>
          );
        })}
      </View>

      <Card style={s.first}>
        <View style={s.crown}><SolidIcon name="crown" size={16} color="#FCBD51" /></View>
        <View style={{ flex: 1 }}>
          <Text style={txt.caption}>무료로 공개하는 1위</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{top ? dateLabel(top.iso) : '…'}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.purple }}>{top?.s ?? ''}</Text>
      </Card>

      {!content.open ? <LockGate key={item.key} item={item} />
        : L && content.data?.F ? <LuckyBody key={item.key} L={L} F={content.data.F} pk={pk} reading={reading} onRetry={retry} />
        : <BodyState error={content.isError} onRetry={() => content.refetch()} />}
      <ShareCta item={item} spec={L ? luckySpec(u, L) : null} />
      <Disclaimer mt={24} />
    </Screen>
  );
}

/** 열람한 본문: 날짜·점수는 서버 계산값, 이유와 팁은 AI 풀이 */
function LuckyBody({ L, F, pk, reading, onRetry }: { L: LuckyDays; F: SajuFull; pk: PurposeKey; reading: ReadingView<LuckyReading> | null; onRetry(): void }) {
  const { P, list, bad } = L;
  const writing = reading?.status === 'writing';
  const R = reading?.parts.days;
  const fallback = (x: LuckyDay) => [
    x.gw ? '천을귀인이 드는 날이라 도움을 받기 쉬워요' : '',
    `일진 ${pText(x.dp)}이 나에게 ${TG[x.tg]}이에요 · 에너지 단계 ${STAGE12[x.st]}`,
  ].filter(Boolean).join(' ');

  return (
    <>
        <ReadingBanner reading={reading} onRetry={onRetry} />
        {R ? <Card style={{ marginTop: 16 }}><Para mt={0}>{R.intro}</Para></Card> : null}
        <SubHead title={P[2] + '하기 좋은 날 TOP 5'} caption="사주 일진 · 귀인 · 4가지 관점 키워드를 함께 봤어요" />
        <View style={{ gap: 10 }}>
          {list.map((x, i) => {
            const t = R?.best[i];
            return (
              <Card key={x.iso}>
                <View style={s.row}>
                  <Rank n={i + 1} first={i === 0} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{dateLabel(x.iso)}</Text>
                    <Text style={txt.caption}>{pText(x.dp)}일 · {TG[x.tg]} · 행운의 시간 {x.c.luckyTime}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: i === 0 ? colors.purple : colors.purpleSoft }}>{x.s}</Text>
                </View>
                {t ? (
                  <>
                    <Para>{t.why}</Para>
                    <Text style={[txt.small, { marginTop: 6, color: colors.purple }]}>이날 해 볼 것 · {t.tip}</Text>
                  </>
                ) : writing ? <PartPending writing lines={2} /> : <Para>{fallback(x)}</Para>}
                {x.gw ? <Pill tone="ok" style={{ marginTop: 8, alignSelf: 'flex-start' }}>貴 귀인일</Pill> : null}
              </Card>
            );
          })}
        </View>
        <SubHead title="피하면 좋은 날" />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {bad.map((x, i) => (
            <View key={x.iso} style={[s.row, { paddingVertical: 12, alignItems: 'flex-start' }, i ? s.topLine : null]}>
              <View style={s.avoid}><Icon name="close" size={12} strokeWidth={3} color={AVOID_RED} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{dateLabel(x.iso)}</Text>
                {R?.avoid[i] ? <Text style={txt.small}>{R.avoid[i]}</Text> : writing ? <PartPending writing lines={1} /> : <Text style={txt.small}>{x.clash ? '일지와 충(沖)하는 날이라 변수가 생기기 쉬워요' : '흐름이 잔잔해 큰일을 벌이기엔 아쉬운 날이에요'}</Text>}
              </View>
            </View>
          ))}
        </Card>
        <SubHead title={P[2] + ' 당일 팁'} />
        <Card>
          {R ? R.tips.map(t => <Bullet key={t}>{t}</Bullet>) : writing ? <PartPending writing lines={3} /> : (
            <>
              {PURPOSE_TIPS[pk].map(t => <Bullet key={t}>{t}</Bullet>)}
              <Bullet>용신 색({EL_LUCK[F.yong].color})을 소품으로 활용해 보세요</Bullet>
            </>
          )}
        </Card>
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>재미와 참고를 위한 추천이에요. 실제 일정은 상황에 맞게 정해 주세요.</Text>
    </>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  cell: { width: '31%', flexGrow: 1, minHeight: 72, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cellOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  cellIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  first: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  crown: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avoid: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FDE9E9', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topLine: { borderTopWidth: 0.5, borderTopColor: colors.lineStrong },
});
