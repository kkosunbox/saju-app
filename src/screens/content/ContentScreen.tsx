import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import SolidIcon, { SolidIconName } from '../../components/SolidIcon';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import { ContentEntry, UPCOMING, loadNotify, toggleNotify } from '../../services/content/registry';
import { Amount, Coin, CostPill, LineTag, PriceTag, SubHead } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { BUNDLE, ITEMS, bundleFor, fmtN, fmtP, ro } from '../../services/premium/catalog';
import { useInviteShare } from '../../services/share/useInviteShare';
import { PremiumKey, defaultItem, openPremium } from '../../navigation/premium';
import { colors, isDark } from '../../theme/colors';
import { fonts, radius, shadow, txt } from '../../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot, { ArtName, MascotPeek } from '../../components/Mascot';
import PromoCard from '../../components/PromoCard';
import GradientBorder from '../../components/GradientBorder';
import { COPY } from '../../content/copy';
import { Period } from '../../types';

type Entry = [PremiumKey, SolidIconName, string, string];
const PERIODS: [Period, ArtName, string, string][] = isDark
  ? [['daily', 'today', '오늘', '#3A3418'], ['weekly', 'week', '주간', '#2E3A18'], ['monthly', 'month', '월간', '#3A1E24'], ['yearly', 'year', '연간', '#2A2140']]
  : [['daily', 'today', '오늘', '#FFFADD'], ['weekly', 'week', '주간', '#F3FFC6'], ['monthly', 'month', '월간', '#FFE4E8'], ['yearly', 'year', '연간', '#F1EAFF']];
const LIST: [string, Entry[]][] = [
  ['나의 인생 지도', [['life', 'book', '평생운', '초년 · 중년 · 말년 · 10년대운'], ['sajuDeep', 'clipboard', '상세 사주 해석', '원국 · 오행 · 나의 본성']]],
  ['올해와 이달', [['newyear', 'calendar', '신년운세', '올해 · 새해 미리보기 · 분기 전략'], ['monthly', 'calendarMoon', '월별 상세운세', '달력 · 좋은 날 · 이달의 미션']]],
  ['테마 운세', [['theme-love', 'heart', '연애 · 결혼', '연애 스타일 · 인연의 해'], ['theme-money', 'coins', '재물', '돈 성향 · 재물 흐름'], ['theme-career', 'work', '직업 · 적성', '맞는 일 · 커리어 상승기']]],
  ['도구', [['lucky', 'calendarStar', '길일 찾기', '이사 · 계약 · 고백 · 면접']]],
];
/** 아이콘마다 원본 여백이 달라 Figma에서 보이는 크기에 맞춘 값 (book 은 20칸 안에 여백이 있다) */
const ICON_SIZE: Partial<Record<SolidIconName, number>> = { book: 20, coins: 17 };

/** 콘텐츠 탭 — 무료로 즐기고(공유) → 궁금한 건 프리미엄으로 */
export default function ContentScreen() {
  const { sendInvite: invite, inviteShareSheet } = useInviteShare();
  const nav = useNavigation();
  const { user, today } = useApp();
  const { points, owned, openUnlock, toast } = usePremium();
  const [notify, setNotify] = useState<string[]>([]);
  const [peek, setPeek] = useState<ContentEntry | null>(null);
  useEffect(() => { loadNotify().then(setNotify); }, []);
  if (!user) return null;
  const bOwned = owned(BUNDLE.key);
  const bundle = bOwned ? BUNDLE : bundleFor(owned);


  const FREE: [ArtName, string, string, () => void][] = [
    ['talisman', '오늘의 부적', '매일 바뀌는 행운 카드', () => nav.navigate('Talisman')],
    ['tiger', '사주 캐릭터', '60가지 중 나는 누구?', () => nav.navigate('Character')],
    ['mbti', '찰떡 MBTI', '나와 가장 잘 맞는 유형', () => nav.navigate('MbtiMatch')],
    ['pastLife', '전생 테스트', '나는 전생에 누구였을까?', () => nav.navigate('PastLife')],
    ['friends', '친구 궁합 초대', '링크 하나로 궁합보기', invite],
  ];
  const spouseOwned = owned(ITEMS.spouse().key);

  return (
    // 동전 마스코트가 상단 바 자리까지 올라가 있어 바를 본문 위에 띄운다 (스크롤하면 바 배경 아래로 지나간다)
    <Screen largeTitle="콘텐츠" sky floatingBar>
      <Mascot name="coin" size={81} style={s.coinArt} />
      <PressableScale onPress={() => nav.navigate('Wallet')} style={[s.points, shadow.hero]} scaleTo={0.98} accessibilityLabel={`내 알 ${fmtP(points)} · 알 주머니 열기`}>
        <Coin size={32} />
        <Text style={s.pointsV}>{fmtN(points)}</Text>
        <Text style={s.pointsK} numberOfLines={1}>·  출석하고 매일 10알 받기</Text>
      </PressableScale>

      <SubHead title="운세" caption="오늘부터 올해까지, 기간별 흐름" />
      <View style={s.periods}>
        {PERIODS.map(([p, art, t, bg]) => (
          <PressableScale key={p} onPress={() => nav.navigate('Fortune', { period: p })} style={s.period} scaleTo={0.94} accessibilityLabel={`${t} 운세`}>
            <LinearGradient colors={[bg, colors.card]} style={s.periodBox}><Mascot name={art} size={47} /></LinearGradient>
            <Text style={s.periodT}>{t}</Text>
          </PressableScale>
        ))}
      </View>

      <SubHead title="무료로 즐기기" caption={COPY.friend} />
      <View style={s.grid}>
        {FREE.map(([art, t, d, go], i) => (
          <PressableScale key={t} onPress={go} style={[s.free, i === FREE.length - 1 && FREE.length % 2 === 1 && { width: '100%' }]} scaleTo={0.97} accessibilityLabel={t}>
            <View style={s.freeHead}>
              <Mascot name={art} size={40} />
              <LineTag label="무료" />
            </View>
            <Text style={s.freeT}>{t}</Text>
            <Text style={s.freeD}>{d}</Text>
          </PressableScale>
        ))}
      </View>

      <SubHead title="지금 가장 많이 보는" caption="새로 나온 프리미엄 콘텐츠" />
      <View style={{ gap: 16 }}>
        <PromoCard
          tone="gold" isNew title="미래 배우자 리포트" desc="어떤 사람을, 언제, 어디서 만나게 될까?"
          owned={spouseOwned} coin={!spouseOwned} cta={spouseOwned ? '리포트 다시보기 →' : `${ITEMS.spouse().cost} · 리포트 열기 →`}
          onPress={() => nav.navigate('Spouse')}
        />
        <PromoCard
          tone="lime" isNew title="그 사람의 속마음" desc="궁합을 본 뒤 상대의 마음 온도와 연락하기 좋은 날까지"
          coin cta={`${ITEMS.crush(0, '').cost} · 궁합 보러 가기 →`}
          onPress={() => nav.navigate('Tabs', { screen: 'Compatibility' })}
        />
      </View>

      {bundle && (
        <GradientBorder width={1.5} outer={{ marginTop: 16 }} style={s.bundle}>
          <MascotPeek width={112} top={7.5} opacity={0.55} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.bundleT}>인생 패키지</Text>
            <View style={s.bundleTag}><Text style={s.bundleTagText}>{bOwned ? '보유 중' : '21% 할인'}</Text></View>
          </View>
          <Text style={s.bundleD}>{bundle.desc}</Text>
          {bOwned ? null : (
            <>
              <Amount value={bundle.orig!} size={13} style={s.bundleOrig} />
              <PrimaryButton label={`${fmtN(bundle.cost)}${ro(bundle.cost)} 전부 열기`} icon={<Coin size={16} />} onPress={() => openUnlock(bundle)} style={{ marginTop: 12 }} small />
            </>
          )}
        </GradientBorder>
      )}

      {LIST.map(([g, items]) => (
        <View key={g}>
          <SubHead title={g} />
          <Card style={{ paddingVertical: 2, paddingHorizontal: 16 }}>
            {items.map(([k, e, t, d], i) => (
              <PressableScale key={k} onPress={() => openPremium(nav, k)} style={[s.lrow, i > 0 && s.line]} scaleTo={0.98} accessibilityLabel={t}>
                <View style={s.lico}><SolidIcon name={e} size={ICON_SIZE[e] ?? 16} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.lT}>{t}</Text>
                  <Text style={s.lD}>{d}</Text>
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
              <Mascot name={c.art} size={39} />
              {notify.includes(c.key) ? <Icon name="bell" size={14} color={colors.seal} /> : c.tier === 'free' ? <LineTag label="무료" /> : <CostPill cost={c.cost ?? 0} small />}
            </View>
            <Text style={[s.freeT, s.soonT]} numberOfLines={1}>{c.title}</Text>
            <Text style={s.freeD} numberOfLines={1}>{c.hook}</Text>
          </PressableScale>
        ))}
      </View>
      <Disclaimer compact />
      <BottomSheet visible={!!peek} onClose={() => setPeek(null)}>
        {peek ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Mascot name={peek.art} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={txt.caption}>곧 오픈 · {peek.tier === 'free' ? '무료' : `${peek.cost}알`}</Text>
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
      {inviteShareSheet}
    </Screen>
  );
}

const s = StyleSheet.create({
  coinArt: { position: 'absolute', right: 49, top: 0, zIndex: 2 },
  points: { marginTop: -1, flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 24, borderRadius: radius.lg, backgroundColor: colors.heroBg },
  pointsV: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: -0.8 },
  pointsK: { flex: 1, fontSize: 13, color: '#DDDDDD', letterSpacing: -0.6 },
  periods: { flexDirection: 'row', justifyContent: 'space-between' },
  period: { alignItems: 'center', gap: 7 },
  periodBox: { width: 70, height: 70, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  periodT: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  free: { width: '47.5%', flexGrow: 1, minHeight: 118, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  freeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', height: 40 },
  freeT: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5, marginTop: 8 },
  freeD: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.inkMute, letterSpacing: -0.6, marginTop: 2 },
  bundle: { padding: 16, paddingBottom: 14 },
  bundleT: { fontSize: 16, lineHeight: 18, fontWeight: '700', color: '#00A3FF', letterSpacing: -0.8 },
  bundleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: colors.seal },
  bundleTagText: { fontSize: 12, lineHeight: 15, fontWeight: '600', color: colors.seal, letterSpacing: 0 },
  bundleD: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6, marginTop: 8, paddingRight: 80 },
  bundleOrig: { fontSize: 13, color: colors.inkMute, textDecorationLine: 'line-through', marginTop: 4 },
  lico: { width: 38, height: 38, borderRadius: 6, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  lT: { fontSize: 14, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  lD: { fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.6, marginTop: 4 },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderTopWidth: 1, borderTopColor: colors.line },
  soon: { width: '47.5%', flexGrow: 1, minHeight: 118, padding: 15, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  soonT: { fontSize: 13, letterSpacing: -0.8 },
});
