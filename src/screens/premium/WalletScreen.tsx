import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PressableScale from '../../components/PressableScale';
import { Coin, Hero, Pill, Seal, SubHead, heroTxt } from '../../components/premium/Kit';
import { usePremium } from '../../context/PremiumContext';
import { PACKS, PRICE_TABLE, fmtP } from '../../services/premium/catalog';
import { PointTransaction, TransactionType, pointsApi, pointsKeys } from '../../services/server/pointsApi';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';

const TYPE_LABEL: Record<TransactionType, string> = { charge: '충전', grant: '적립', use: '사용', expire: '소멸', refund: '환불', revoke: '회수', adjust: '조정' };
/** 서버 시각(UTC) → 한국 날짜 */
const kstDate = (iso: string) => new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(0, 10);

export default function WalletScreen() {
  const { account } = useApp();
  const { points, expiringSoon, attendedToday: att, ownedCount, attend, openCharge } = usePremium();
  const { data: history = [] } = useQuery<PointTransaction[]>({ queryKey: [...pointsKeys.transactions, account?.id], queryFn: () => pointsApi.transactions(20), enabled: !!account });
  return (
    <Screen title="내 포인트" back>
      <Hero style={{ marginTop: 4, padding: 22 }}>
        <Text style={heroTxt.eyebrow}>보유 포인트</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Coin size={30} />
          <Text style={{ fontSize: 40, fontWeight: '800', letterSpacing: -1, color: colors.white }}>{points.toLocaleString('ko-KR')}</Text>
        </View>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>1,000원 = 100P · 보유 콘텐츠 {ownedCount}개</Text>
        {expiringSoon > 0 ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>30일 안에 사라지는 포인트 {fmtP(expiringSoon)}</Text> : null}
      </Hero>

      <Card onPress={att ? undefined : attend} style={[s.attend, att && { opacity: 0.6 }]} accessibilityLabel="출석 체크">
        <Seal ch="日" size={42} bg={colors.moneyBg} color={colors.money} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>출석 체크</Text>
          <Text style={txt.small}>{att ? '오늘은 이미 받았어요. 내일 또 만나요' : '매일 한 번 10P를 받을 수 있어요'}</Text>
        </View>
        <Pill>{att ? '완료' : '+10'}</Pill>
      </Card>

      <SubHead title="충전하기" />
      <View style={{ gap: 8 }}>
        {PACKS.map(([w, p, b], i) => (
          <PressableScale key={w} onPress={() => openCharge(i)} style={[s.pack, i === 3 && { borderColor: colors.purpleSoft }]} accessibilityLabel={`${fmtP(p + b)} ${w}원`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Coin size={20} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{fmtP(p)}</Text>
              {b ? <View style={s.bonus}><Text style={s.bonusText}>+{b} 보너스</Text></View> : null}
            </View>
            <Text style={s.won}>{w.toLocaleString('ko-KR')}원</Text>
            {i === 3 ? <View style={s.bestTag}><Text style={s.bestText}>인기</Text></View> : null}
          </PressableScale>
        ))}
      </View>

      <SubHead title="콘텐츠 이용 요금" caption="오늘의 운세와 4가지 분석은 언제나 무료예요" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        {PRICE_TABLE.map(([a, b], i) => (
          <View key={a} style={[s.row, i > 0 && s.line]}>
            <Text style={{ fontSize: 14, color: colors.ink, flex: 1 }}>{a}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: b === '무료' ? colors.success : colors.purple }}>{b}</Text>
          </View>
        ))}
      </Card>

      <SubHead title="이용 내역" />
      <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
        {history.length ? history.map((h, i) => (
          <View key={h.id} style={[s.row, i > 0 && s.line]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{h.label}</Text>
              <Text style={txt.caption}>{kstDate(h.createdAt).replace(/-/g, '.')} · {TYPE_LABEL[h.type]}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: h.amount > 0 ? colors.purple : colors.inkMute }}>{h.amount > 0 ? '+' : ''}{h.amount}P</Text>
          </View>
        )) : <Text style={[txt.body, { paddingVertical: 14 }]}>아직 이용 내역이 없어요.</Text>}
      </Card>
      <Text style={[txt.caption, { textAlign: 'center', marginTop: 16 }]}>충전한 포인트(보너스 포함)는 5년, 출석·공유 등으로 받은 포인트는 1년 동안 쓸 수 있어요. 받은 포인트부터 먼저 쓰여요. 충전 후 7일 안에 하나도 쓰지 않았다면 환불을 요청할 수 있어요.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  attend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  pack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 18, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.lg },
  bonus: { backgroundColor: colors.badgeBg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.xs },
  bonusText: { fontSize: 11, fontWeight: '800', color: colors.badge },
  won: { fontFamily: fonts.serif, fontSize: 15, fontWeight: '600', color: colors.inkSub },
  bestTag: { position: 'absolute', top: -9, right: 16, backgroundColor: colors.seal, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  bestText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, gap: 8 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
});
