import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import Ico from '../../components/Ico';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import { ContentEntry, UPCOMING, loadNotify, toggleNotify } from '../../services/content/registry';
import { Coin, Pill, PriceTag, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { BUNDLE, ITEMS, bundleFor, fmtP } from '../../services/premium/catalog';
import { shareInvite } from '../../services/share/linkShare';
import { PremiumKey, defaultItem, openPremium } from '../../navigation/premium';
import { colors } from '../../theme/colors';
import { fonts, radius, txt } from '../../theme/typography';
import { COPY } from '../../content/copy';
import { Period } from '../../types';

type Entry = [PremiumKey, string, string, string];
const PERIODS: [Period, string, string][] = [['daily', '今', '오늘'], ['weekly', '週', '주간'], ['monthly', '月', '월간'], ['yearly', '年', '연간']];
const LIST: [string, Entry[]][] = [
  ['나의 인생 지도', [['life', '圖', '평생운', '초년 · 중년 · 말년 · 10년 대운'], ['sajuDeep', '命', '상세 사주 해석', '원국 · 오행 · 나의 본성']]],
  ['올해와 이달', [['newyear', '年', '신년운세', '올해 · 새해 미리보기 · 분기 전략'], ['monthly', '月', '월별 상세운세', '달력 · 좋은 날 · 이달의 미션']]],
  ['테마 운세', [['theme-love', '緣', '연애·결혼', '연애 스타일 · 인연의 해'], ['theme-money', '財', '재물', '돈 성향 · 재물 흐름'], ['theme-career', '業', '직업·적성', '맞는 일 · 커리어 상승기']]],
  ['도구', [['lucky', '日', '길일 찾기', '이사 · 계약 · 고백 · 면접']]],
];

/** 콘텐츠 탭 — 무료로 즐기고(공유) → 궁금한 건 프리미엄으로 */
export default function ContentScreen() {
  const nav = useNavigation();
  const { user, today } = useApp();
  const { points, owned, openUnlock, toast } = usePremium();
  const [notify, setNotify] = useState<string[]>([]);
  const [peek, setPeek] = useState<ContentEntry | null>(null);
  useEffect(() => { loadNotify().then(setNotify); }, []);
  if (!user) return null;
  const bOwned = owned(BUNDLE.key);
  const bundle = bOwned ? BUNDLE : bundleFor(owned);

  const invite = async () => {
    const r = await shareInvite(user.nickname);
    if (r === 'copied') toast('초대 링크를 복사했어요. 친구에게 보내 보세요');
    else if (r === 'failed') toast('초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요');
  };

  const FREE: [string, string, string, () => void][] = [
    ['性', '찰떡 MBTI', '나와 가장 잘 맞는 유형', () => nav.navigate('MbtiMatch')],
    ['命', '사주 캐릭터', '60가지 중 나는 누구?', () => nav.navigate('Character')],
    ['符', '오늘의 부적', '매일 바뀌는 행운 카드', () => nav.navigate('Talisman')],
    ['前', '전생 테스트', '나는 전생에 누구였을까?', () => nav.navigate('PastLife')],
    ['和', '친구 궁합 초대', '링크 하나로 궁합 보기', invite],
  ];

  return (
    <Screen largeTitle="콘텐츠" subtitle={COPY.content} right={undefined}>
      <PressableScale onPress={() => nav.navigate('Wallet')} style={s.points} scaleTo={0.98}>
        <Coin size={18} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.purple }}>{fmtP(points)}</Text>
        <Text style={[txt.small, { flex: 1 }]}>· 출석하고 매일 10P 받기</Text>
        <Icon name="chevronRight" size={16} color={colors.inkMute} />
      </PressableScale>

      <SubHead title="운세" caption="오늘부터 올해까지, 기간별 흐름" />
      <View style={s.periods}>
        {PERIODS.map(([p, ch, t]) => (
          <PressableScale key={p} onPress={() => nav.navigate('Fortune', { period: p })} style={s.period} scaleTo={0.96} accessibilityLabel={`${t} 운세`}>
            <Text style={s.periodH}>{ch}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 4 }}>{t}</Text>
          </PressableScale>
        ))}
      </View>

      <SubHead title="무료로 즐기기" caption={COPY.friend} />
      <View style={s.grid}>
        {FREE.map(([ch, t, d, go]) => (
          <PressableScale key={t} onPress={go} style={s.free} scaleTo={0.97} accessibilityLabel={t}>
            <View style={s.freeHead}>
              <Ico ch={ch} size={40} />
              <View style={s.freeTag}><Text style={s.freeTagText}>무료</Text></View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 12 }}>{t}</Text>
            <Text style={[txt.small, { marginTop: 2 }]}>{d}</Text>
          </PressableScale>
        ))}
      </View>

      <SubHead title="지금 가장 많이 보는" caption="새로 나온 프리미엄 콘텐츠" />
      <View style={{ gap: 10 }}>
        <PressableScale onPress={() => nav.navigate('Spouse')} style={s.hot} scaleTo={0.98}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}><View style={s.newTag}><Text style={s.newText}>NEW</Text></View><PriceTag item={ITEMS.spouse()} /></View>
            <Text style={s.hotTitle}>미래 배우자 리포트</Text>
            <Text style={s.hotDesc}>어떤 사람을, 언제, 어디서 만나게 될까?</Text>
          </View>
          <Text style={s.hotHanja}>緣</Text>
        </PressableScale>
        <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Compatibility' })} style={s.hot} scaleTo={0.98}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}><View style={s.newTag}><Text style={s.newText}>NEW</Text></View><Pill><Text style={{ fontSize: 12, fontWeight: '800', color: colors.purple }}>150P</Text></Pill></View>
            <Text style={s.hotTitle}>그 사람의 속마음</Text>
            <Text style={s.hotDesc}>궁합을 본 뒤 상대의 마음 온도와 연락하기 좋은 날까지</Text>
          </View>
          <Text style={s.hotHanja}>心</Text>
        </PressableScale>
      </View>

      {bundle && (
        <Card style={s.bundle}>
          <View style={s.bundleTag}><Text style={s.bundleTagText}>{bOwned ? '보유 중' : '21% 할인'}</Text></View>
          <Text style={[txt.h3, { marginTop: 4 }]}>인생 패키지</Text>
          <Text style={[txt.small, { marginTop: 2 }]}>{bundle.desc}</Text>
          {bOwned ? null : (
            <View style={[s.between, { marginTop: 14 }]}>
              <Text style={{ fontSize: 13, color: colors.inkMute, textDecorationLine: 'line-through' }}>{fmtP(bundle.orig!)}</Text>
              <PrimaryButton label={`${fmtP(bundle.cost)}로 모두 열기`} icon={<Coin size={16} />} onPress={() => openUnlock(bundle)} style={{ width: 210 }} />
            </View>
          )}
        </Card>
      )}

      {LIST.map(([g, items]) => (
        <View key={g}>
          <SubHead title={g} />
          <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
            {items.map(([k, e, t, d], i) => (
              <PressableScale key={k} onPress={() => openPremium(nav, k)} style={[s.lrow, i > 0 && s.line]} scaleTo={0.98} accessibilityLabel={t}>
                <Ico ch={e} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t}</Text>
                  <Text style={txt.small}>{d}</Text>
                </View>
                <PriceTag item={defaultItem(k as Exclude<PremiumKey, 'lounge'>, today)} />
              </PressableScale>
            ))}
          </Card>
        </View>
      ))}
      <SubHead title="곧 오픈" caption="먼저 알림 받고 가장 먼저 보세요" />
      <View style={s.grid}>
        {UPCOMING.filter(c => c.status === 'soon').map(c => (
          <PressableScale key={c.key} onPress={() => setPeek(c)} style={s.soon} scaleTo={0.97} accessibilityLabel={`${c.title} 곧 오픈`}>
            <View style={s.freeHead}>
              <Text style={s.soonH}>{c.hanja}</Text>
              {notify.includes(c.key) ? <Icon name="bell" size={14} color={colors.seal} /> : <Text style={[s.soonTier, c.tier === 'free' && { color: colors.success }]}>{c.tier === 'free' ? '무료' : `${c.cost}P`}</Text>}
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 8 }} numberOfLines={1}>{c.title}</Text>
            <Text style={[txt.caption, { marginTop: 2 }]} numberOfLines={1}>{c.hook}</Text>
          </PressableScale>
        ))}
      </View>
      <Disclaimer compact />
      <BottomSheet visible={!!peek} onClose={() => setPeek(null)}>
        {peek ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ico ch={peek.hanja} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={txt.caption}>곧 오픈 · {peek.tier === 'free' ? '무료' : `${peek.cost}P`}</Text>
                <Text style={txt.h2}>{peek.title}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: '600', color: colors.purple, marginTop: 16 }}>“{peek.hook}”</Text>
            <Text style={[txt.body, { marginTop: 8, fontSize: 14 }]}>{peek.desc}</Text>
            <PrimaryButton
              label={notify.includes(peek.key) ? '알림 신청됨 · 취소하기' : '오픈하면 알려주세요'}
              variant={notify.includes(peek.key) ? 'soft' : 'solid'}
              icon={<Icon name="bell" size={18} color={notify.includes(peek.key) ? colors.purple : colors.white} />}
              onPress={async () => { const on = !notify.includes(peek.key); setNotify(await toggleNotify(peek.key)); toast(on ? '오픈하면 가장 먼저 알려드릴게요' : '알림을 취소했어요'); }}
              style={{ marginTop: 20 }}
            />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const s = StyleSheet.create({
  periods: { flexDirection: 'row', gap: 8 },
  period: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  periodH: { fontFamily: fonts.serif, fontSize: 22, fontWeight: '700', color: colors.purple },
  points: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  free: { width: '48%', flexGrow: 1, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  freeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  freeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.okBg },
  freeTagText: { fontSize: 11, fontWeight: '700', color: colors.success },
  hot: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: radius.xl, backgroundColor: colors.heroBg },
  hotTitle: { fontFamily: fonts.display, fontSize: 19, fontWeight: '700', color: colors.white, marginTop: 10 },
  hotDesc: { fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  hotHanja: { fontFamily: fonts.serif, fontSize: 44, color: colors.moon, marginLeft: 12 },
  newTag: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.seal },
  newText: { fontSize: 11, fontWeight: '800', color: colors.white },
  bundle: { marginTop: 24, borderWidth: 1.5, borderColor: colors.purpleSoft },
  bundleTag: { position: 'absolute', top: -9, left: 16, backgroundColor: colors.seal, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  bundleTagText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  soon: { width: '48%', flexGrow: 1, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  soonH: { fontFamily: fonts.serif, fontSize: 24, fontWeight: '700', color: colors.inkMute },
  soonTier: { fontSize: 11, fontWeight: '800', color: colors.purpleSoft },
});
