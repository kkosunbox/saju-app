import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import Disclaimer from '../../components/Disclaimer';
import { Bullet, HeadRow, LockGate, Pill, Rank, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { ITEMS } from '../../services/premium/catalog';
import { LuckyDay, PurposeKey, WEEK, luckyDays, pText, sajuFull } from '../../services/premium/engine';
import { EL_LUCK, PURPOSE, PURPOSE_TIPS, STAGE12, TG, TG_INFO } from '../../services/premium/data';
import { parseISO, weekdayOf } from '../../utils/date';
import { colors } from '../../theme/colors';
import { radius, txt } from '../../theme/typography';
import ShareCta, { ShareIconButton } from '../../components/ShareCta';
import { luckySpec } from '../../services/share/shareSpecs';

const dateLabel = (iso: string) => { const { m, d } = parseISO(iso); return `${m}월 ${d}일 ${WEEK[weekdayOf(iso)]}요일`; };

export default function LuckyScreen() {
  const { user: u, today } = useApp();
  const [pk, setPk] = useState<PurposeKey>('move');
  if (!u) return null;
  const item = ITEMS.lucky(pk, today);
  const F = sajuFull(u);
  const { P, list, bad } = luckyDays(u, today, pk);
  const why = (x: LuckyDay) => [
    x.gw ? '천을귀인이 드는 날이라 도움을 받기 쉬워요' : '',
    x.hit.length ? `${x.hit.join('·')} 키워드가 함께해요` : '',
    `일진 ${pText(x.dp)}이 나에게 ${TG[x.tg]}(${TG_INFO[x.tg].key})이에요`,
    `에너지 단계 ${STAGE12[x.st]}`,
  ].filter(Boolean);

  return (
    <Screen title="길일 찾기" back right={<ShareIconButton item={item} spec={luckySpec(u, today, pk)} />}>
      <HeadRow item={item} caption="앞으로 45일 중에서 골라요" />
      <Text style={[txt.title, { marginTop: 10 }]}>어떤 날을{'\n'}찾고 있나요?</Text>
      <View style={s.grid}>
        {PURPOSE.map(([k, e, l]) => (
          <PressableScale key={k} onPress={() => setPk(k as PurposeKey)} haptic scaleTo={0.95} style={[s.cell, k === pk && s.cellOn]} accessibilityState={{ selected: k === pk }} accessibilityLabel={l}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: k === pk ? colors.white : colors.purpleSoft }}>{e}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 4, color: k === pk ? colors.white : colors.ink }}>{l}</Text>
          </PressableScale>
        ))}
      </View>

      <Card style={s.first}>
        <Rank n={1} first />
        <View style={{ flex: 1 }}>
          <Text style={txt.caption}>무료로 공개하는 1위</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{dateLabel(list[0].iso)}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.purple }}>{list[0].s}</Text>
      </Card>

      <LockGate key={item.key} item={item}>
        <SubHead title={P[2] + '하기 좋은 날 TOP 5'} caption="사주 일진 · 귀인 · 4가지 관점 키워드를 함께 봤어요" />
        <View style={{ gap: 10 }}>
          {list.map((x, i) => (
            <Card key={x.iso}>
              <View style={s.row}>
                <Rank n={i + 1} first={i === 0} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{dateLabel(x.iso)}</Text>
                  <Text style={txt.caption}>{pText(x.dp)}일 · 행운의 시간 {x.c.luckyTime}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: i === 0 ? colors.purple : colors.purpleSoft }}>{x.s}</Text>
              </View>
              <View style={{ marginTop: 8 }}>{why(x).map(t => <Bullet key={t}>{t}</Bullet>)}</View>
              {x.gw ? <Pill tone="ok" style={{ marginTop: 6, alignSelf: 'flex-start' }}>新 귀인일</Pill> : null}
            </Card>
          ))}
        </View>
        <SubHead title="피하면 좋은 날" />
        <Card style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {bad.map((x, i) => (
            <View key={x.iso} style={[s.row, { paddingVertical: 12 }, i ? s.topLine : null]}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.inkMute }}>愼</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{dateLabel(x.iso)}</Text>
                <Text style={txt.small}>{x.clash ? '일지와 충(沖)하는 날이라 변수가 생기기 쉬워요' : '흐름이 잔잔해 큰일을 벌이기엔 아쉬운 날이에요'}</Text>
              </View>
            </View>
          ))}
        </Card>
        <SubHead title={P[2] + ' 당일 팁'} />
        <Card>
          {PURPOSE_TIPS[pk].map(t => <Bullet key={t}>{t}</Bullet>)}
          <Bullet>용신 색({EL_LUCK[F.yong].color})을 소품으로 활용해 보세요</Bullet>
        </Card>
        <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>재미와 참고를 위한 추천이에요. 실제 일정은 상황에 맞게 정해 주세요.</Text>
      </LockGate>
      <ShareCta item={item} spec={luckySpec(u, today, pk)} />
      <Disclaimer compact />
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  cell: { width: '31%', flexGrow: 1, minHeight: 72, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cellOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  first: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topLine: { borderTopWidth: 0.5, borderTopColor: colors.lineStrong },
});
