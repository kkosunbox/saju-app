import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@/navigation/compat';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import Disclaimer from '../../components/Disclaimer';
import BottomSheet from '../../components/BottomSheet';
import { ContentEntry, UPCOMING, loadNotify, toggleNotify } from '../../services/content/registry';
import { CostPill, LineTag, PriceTag } from '../../components/premium/Kit';
import { useApp } from '../../context/AppContext';
import { usePremium } from '../../context/PremiumContext';
import { BUNDLE, ITEMS, bundleFor, fmtN } from '../../services/premium/catalog';
import { useInviteShare } from '../../services/share/useInviteShare';
import { PremiumKey, defaultItem, openPremium } from '../../navigation/premium';
import { colors, isDark } from '../../theme/colors';
import { fonts, radius, sansW, txt } from '../../theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot, { ArtName, MascotPeek } from '../../components/Mascot';
import { StarMatchArt } from '../../components/home/HomeDesignAssets';
import { TrackedPromoCard } from '../../components/PromoSlot';
import GradientBorder from '../../components/GradientBorder';
import { Period } from '../../types';
import { HeadTitle } from '../../components/SectionHeader';
import { PointPill } from '../../components/HeaderPoints';
import { parseISO } from '../../utils/date';
import ContentBanners, { Banner } from './ContentBanners';
import LifeMapCards from '../../components/home/LifeMapCards';

/** [화면, 그림, 제목, 설명, 그림 높이(Figma에서 보이는 크기)] */
type Entry = [PremiumKey, ArtName, string, string, number];
/** 오늘의 운세는 운알톡에서 — 여기는 기간 운세만 */
const PERIODS: [Period, ArtName, string, string][] = isDark
  ? [['weekly', 'week', '주간', '#2E3A18'], ['monthly', 'month', '월간', '#3A1E24'], ['yearly', 'year', '연간', '#2A2140']]
  : [['weekly', 'week', '주간', '#F3FFC6'], ['monthly', 'month', '월간', '#FFE6EA'], ['yearly', 'year', '연간', '#F6EEFC']];
/** [제목, 부제목, 카드] */
const LIST: [string, string, Entry[]][] = [
  ['올해와 이달', '올해 큰 흐름부터 이달의 좋은 날까지', [['newyear', 'premium-newyear', '신년운세', '올해 · 새해 미리보기 · 분기 전략', 37], ['monthly', 'premium-monthly', '월별 상세운세', '달력 · 좋은 날 · 이달의 미션', 37]]],
  ['테마 운세', '연애 · 재물 · 일, 궁금한 것만 깊이', [
    ['theme-love', 'premium-love', '연애 · 결혼', '연애 스타일 · 인연의 해', 35], ['theme-money', 'premium-money', '재물', '돈 성향 · 재물 흐름', 37],
    ['theme-career', 'premium-career', '직업 · 적성', '맞는 일 · 커리어 상승기', 38], ['lucky', 'premium-lucky', '길일 찾기', '이사 · 계약 · 고백 · 면접', 35],
  ]],
];

/** 설명이 긴 카드는 Figma에서 자간을 더 좁혔다 (신년운세 -0.1em) */
const TIGHT_D: Partial<Record<PremiumKey, number>> = { newyear: -1.2 };
const CARD_H = 118;
/** Coming Soon 접힌 상태에서 보이는 카드 수 (세 줄) */
const SOON_FOLD = 6;

/** 섹션 높이와 다음 컴포넌트까지의 간격은 화면의 Figma 수치로 고정한다. */
function ContentHeading({ title, caption, roomy = false, tight = false, top = 32 }: { title: string; caption?: string; roomy?: boolean; tight?: boolean; top?: number }) {
  // Coming Soon 은 라틴 글자라 Figma에서 카드까지 19
  return (
    <View style={{ marginTop: top, marginBottom: roomy ? 20 : tight ? 12 : title === 'Coming Soon' ? 19 : 16 }}>
      <HeadTitle title={title} caption={caption} variant="figma" titleStyle={[s.sectionTitle, title === 'Coming Soon' && { letterSpacing: -0.72 }]} />
      {title === '무료로 즐기기' ? <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0 }}><Icon name="chevronRight" size={20} color={colors.inkMute} /></View> : null}
    </View>
  );
}

/** 콘텐츠 탭 (피그마 422:2369) — 기간별 운세 → 인생 지도 → 무료로 즐기기 → 지금 가장 많이 보는 → 올해와 이달 → 테마 운세 → Coming Soon */
export default function ContentScreen() {
  const { sendInvite: invite, inviteShareSheet } = useInviteShare();
  const nav = useNavigation();
  const { user, today } = useApp();
  const { owned, openUnlock, toast } = usePremium();
  const [notify, setNotify] = useState<string[]>([]);
  const [peek, setPeek] = useState<ContentEntry | null>(null);
  const [soonAll, setSoonAll] = useState(false);
  useEffect(() => { loadNotify().then(setNotify); }, []);
  if (!user) return null;
  const bundle = owned(BUNDLE.key) ? null : bundleFor(owned);


  const FREE: [ArtName | 'star', string, string, () => void][] = [
    ['soon-tarot', '오늘의 타로', '오늘 나에게 온 카드 한 장', () => nav.navigate('AnalysisDetail', { source: 'tarot' })],
    ['talisman', '오늘의 부적', '매일 바뀌는 행운 카드', () => nav.navigate('Talisman')],
    ['mbti', '찰떡 MBTI', '나와 가장 잘 맞는 유형', () => nav.navigate('MbtiMatch')],
    ['tiger', '사주 캐릭터', '60가지 중 나는 누구?', () => nav.navigate('Character')],
    ['pastLife', '전생 테스트', '나는 전생에 누구였을까?', () => nav.navigate('PastLife')],
    ['star', '천생연분 스타', '오늘 나와 천생연분인 스타는?', () => nav.navigate('StarMatch')],
    ['friends', '친구 궁합 초대', '링크 하나로 궁합보기', invite],
  ];
  const spouseOwned = owned(ITEMS.spouse().key);
  const soon = UPCOMING.filter(c => c.status === 'soon');
  const nextYear = parseISO(today).y + 1;
  // 배너: 새해 → 평생운 → 미래 배우자 → 운알톡
  const BANNERS: Banner[] = [
    { key: 'newyear', bg: require('../../../assets/figma/content/banner-newyear.webp'), title: [[`${nextYear}년, `, '#68F7F0'], ['나에게 어떤 일이 생길까?']], sub: `${nextYear}년 운세 확인하기 →`, go: () => nav.navigate('NewYear', { year: nextYear }) },
    { key: 'life', bg: require('../../../assets/figma/content/banner-life.webp'), title: [['내 인생은 앞으로 '], ['어떻게 펼쳐질까?', '#E5DCFF']], sub: '나의 평생운 확인하기 →', go: () => openPremium(nav, 'life') },
    { key: 'spouse', bg: require('../../../assets/figma/content/banner-spouse.webp'), title: [['나의 미래'], [' 배우자는?', '#F3C5DD']], sub: '나의 미래 배우자 확인하기 →', go: () => nav.navigate('Spouse') },
    {
      key: 'consult',
      bg: require('../../../assets/figma/content/banner-consult.webp'),
      title: [['마음의 소리, ', '#0098EB'], ['운알이와 대화해볼래요?']],
      sub: '운알이와 비밀대화 하러가기 →',
      textColor: '#000000',
      go: () => nav.navigate('Consult'),
    },
  ];
  // 테마 운세 뒤에 잇는 카드 — 피그마는 반려동물 궁합 · 미래의 배우자를 테마 운세로 옮겼다.
  // 피그마에 없는 우리 아이 사주 · 궁합도 빠지지 않게 같은 줄에 둔다 (화면으로 바로 간다)
  const tile = (src: number) => <Image source={src} style={s.extraArt} contentFit="contain" accessible={false} />;
  const EXTRA: [string, React.ReactNode, string, string, React.ReactNode, () => void][] = [
    ['pet', tile(require('../../../assets/figma/content/tile-pet.webp')), '반려동물 궁합', '댕냥이와 나의 궁합은?', <CostPill key="pet" cost={ITEMS.pet(0, '').cost} small variant="figma" />, () => nav.navigate('Pet')],
    ['spouse', tile(require('../../../assets/figma/content/tile-spouse.webp')), '미래의 배우자', '나의 미래 배우자는 누구?', <PriceTag key="spouse" item={ITEMS.spouse()} small variant="figma" />, () => nav.navigate('Spouse')],
    // 아이마다 따로 사서 보유 표시 대신 가격만
    ['child', <Mascot key="child" name="soon-baby" size={39} />, '우리 아이 사주', '기질 · 재능 · 공부 방식', <CostPill key="child" cost={ITEMS.child(0, '').cost} small variant="figma" />, () => nav.navigate('Child')],
    ['compat', <Mascot key="compat" name="friends" size={39} />, '궁합', '그 사람과 나, 잘 맞을까?', <LineTag key="compat" label="무료" variant="figma" />, () => nav.navigate('Compatibility')],
  ];
  const extraCard = ([k, art, title, desc, price, go]: (typeof EXTRA)[number]) => (
    <PressableScale key={k} onPress={go} style={s.soon} scaleTo={0.97} accessibilityLabel={title}>
      <View style={s.freeHead}>
        <View style={s.artBox}>{art}</View>
        <View style={s.price}>{price}</View>
      </View>
      <Text style={[s.freeT, s.soonT]} numberOfLines={1}>{title}</Text>
      <View style={s.bleed}><Text style={[s.freeD, s.premiumD]} numberOfLines={1}>{desc}</Text></View>
    </PressableScale>
  );
  // Coming Soon 은 세 줄만 보이고 '더보기'로 펼친다
  const soonShown = soonAll ? soon : soon.slice(0, SOON_FOLD);
  const folded = !soonAll && soon.length > SOON_FOLD;

  return (
    <Screen largeTitle="콘텐츠" sky titleStyle={s.screenTitle} right={<PointPill attendHint quiet />}>
      {/* 배너는 상단 바 아래 16 (Figma 100) — 바 아래 기본 여백보다 8 위 */}
      <View style={{ marginTop: -8 }}><ContentBanners items={BANNERS} /></View>

      <ContentHeading title="기간별 운세" caption="이번 주부터 올해까지, 흐름 한눈에" roomy top={24} />
      <View style={s.periods}>
        {PERIODS.map(([p, art, t, bg]) => (
          <PressableScale key={p} onPress={() => nav.navigate('Fortune', { period: p })} style={s.period} scaleTo={0.94} accessibilityLabel={`${t} 운세`}>
            <LinearGradient colors={[bg, colors.card]} style={s.periodBox}><Mascot name={art} size={47} /></LinearGradient>
            <Text style={s.periodT}>{t}</Text>
          </PressableScale>
        ))}
      </View>

      <ContentHeading title="나의 인생 지도" caption="타고난 사주로 그려 보는 내 삶의 큰 그림" tight />
      <LifeMapCards />

      {bundle && (
        <GradientBorder width={1} outer={{ marginTop: 16 }} style={s.bundle}>
          <MascotPeek width={112} top={7.5} opacity={0.55} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 18 }}>
            <Text style={s.bundleT}>인생 패키지</Text>
            <View style={s.bundleTag}><Text style={s.bundleTagText}>21% 할인</Text></View>
          </View>
          <Text style={s.bundleD}>{bundle.desc}</Text>
          <Text style={s.bundleOrig}>{fmtN(bundle.orig!)}알</Text>
          <PrimaryButton label={`${fmtN(bundle.cost)}알로 전부 열기`} icon={<Mascot size={14} />} onPress={() => openUnlock(bundle)} style={s.bundleButton} labelStyle={s.bundleButtonText} small />
        </GradientBorder>
      )}

      <ContentHeading title="무료로 즐기기" caption="매일 새로 뽑는 소소한 재미" roomy />
      <View style={s.grid}>
        {FREE.map(([art, t, d, go], i) => (
          <PressableScale key={t} onPress={go} style={[s.free, i === FREE.length - 1 && FREE.length % 2 === 1 && { width: '100%' }]} scaleTo={0.97} accessibilityLabel={t}>
            <View style={s.freeHead}>
              {art === 'star' ? <StarMatchArt /> : <Mascot name={art} size={i === 3 ? 44 : 39} />}
              <LineTag label="무료" variant="figma" />
            </View>
            <Text style={s.freeT}>{t}</Text>
            <Text style={[s.freeD, { color: isDark ? colors.inkMute : '#555555' }]}>{d}</Text>
          </PressableScale>
        ))}
      </View>

      <ContentHeading title="지금 가장 많이 보는" caption="새로 나온 프리미엄 콘텐츠" />
      <View style={{ gap: 16 }}>
        <TrackedPromoCard
          screen="content" item="spouse"
          tone="pink" variant="recommendation" title="미래 배우자 리포트" desc="어떤 사람을, 언제, 어디서 만나게 될까?"
          owned={spouseOwned} coin={!spouseOwned} cta={spouseOwned ? '리포트 다시보기 →' : `${ITEMS.spouse().cost}알 · 리포트 열기 →`}
          base={require('../../../assets/figma/content/promo-spouse-base.webp')}
          onPress={() => nav.navigate('Spouse')}
        />
        <TrackedPromoCard
          screen="content" item="pet"
          tone="lime" variant="recommendation" title="반려동물 궁합" desc="댕냥이와 나는 어떤 사이? 성격부터 함께 놀기 좋은 날까지"
          coin cta={`${ITEMS.pet(0, '').cost}알 · 미리보기 무료 →`} base={require('../../../assets/figma/content/promo-pet-base.webp')}
          onPress={() => nav.navigate('Pet')}
        />
      </View>

      {LIST.map(([g, caption, items]) => (
        <View key={g}>
          <ContentHeading title={g} caption={caption} />
          <View style={s.grid}>
            {items.map(([k, art, t, d, h]) => (
              <PressableScale key={k} onPress={() => openPremium(nav, k)} style={s.soon} scaleTo={0.97} accessibilityLabel={t}>
                <View style={s.freeHead}>
                  <View style={s.artBox}><Mascot name={art} size={h} /></View>
                  <View style={s.price}><PriceTag item={defaultItem(k as Exclude<PremiumKey, 'lounge'>, today)} small variant="figma" /></View>
                </View>
                <Text style={[s.freeT, s.soonT]} numberOfLines={1}>{t}</Text>
                <View style={s.bleed}><Text style={[s.freeD, s.premiumD, TIGHT_D[k] != null && { letterSpacing: TIGHT_D[k] }, k === 'newyear' && { fontSize: 12 }]} numberOfLines={1}>{d}</Text></View>
              </PressableScale>
            ))}
            {g === '테마 운세' ? EXTRA.map(extraCard) : null}
          </View>
        </View>
      ))}
      <ContentHeading title="Coming Soon" caption="먼저 알림 받고 가장 먼저 보세요" />
      <View style={[s.grid, folded && { marginBottom: 27 }]}>
          {soonShown.map(c => (
            <PressableScale key={c.key} onPress={() => setPeek(c)} style={s.soon} scaleTo={0.97} accessibilityLabel={`${c.title} 곧 오픈`}>
              <View style={s.freeHead}>
                <Mascot name={c.art} size={39} />
                <View style={s.price}>{notify.includes(c.key) ? <Icon name="bell" size={14} color={colors.seal} /> : c.tier === 'free' ? <LineTag label="무료" variant="figma" /> : <View style={{ opacity: 0.5 }}><CostPill cost={c.cost ?? 0} small variant="figma" /></View>}</View>
              </View>
              <View style={s.bleed}><Text style={[s.freeT, s.soonT]} numberOfLines={1}>{c.title}</Text></View>
              <View style={s.bleed}><Text style={[s.freeD, s.soonD]} numberOfLines={1}>{c.hook}</Text></View>
            </PressableScale>
          ))}
          {folded ? (
            <>
              {/* 피그마: 마지막 줄 아래쪽 39를 흰색으로 덮고(375×63, 위 반은 그라데이션) 목록 끝에 '더보기' 알약 */}
              <LinearGradient pointerEvents="none" colors={[`${colors.cream}00`, colors.cream]} locations={[0, 0.5]} style={s.soonFade} />
              <View style={s.moreRow} pointerEvents="box-none">
                <PressableScale onPress={() => setSoonAll(true)} style={s.more} scaleTo={0.95} accessibilityLabel="Coming Soon 더보기">
                  <Text style={s.moreText}>더보기</Text>
                  <Icon name="chevronDown" size={12} color={colors.inkMute} strokeWidth={2} />
                </PressableScale>
              </View>
            </>
          ) : null}
      </View>
      <Disclaimer mt={32} />
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
  screenTitle: { ...sansW('600'), fontSize: 18, lineHeight: 21, letterSpacing: 0, color: isDark ? colors.ink : '#000000', includeFontPadding: false },
  sectionTitle: { letterSpacing: 0 },
  // 주간 · 월간 · 연간 세 칸이 줄을 똑같이 나눠 채운다
  periods: { flexDirection: 'row', gap: 12 },
  period: { flex: 1, alignItems: 'center', gap: 7 },
  periodBox: { alignSelf: 'stretch', height: 70, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  periodT: { ...sansW('700'), fontSize: 14, lineHeight: 17, includeFontPadding: false, color: colors.ink, letterSpacing: -0.56 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  free: { width: '47.5%', flexGrow: 1, minHeight: 118, padding: 15, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.cream, borderWidth: 1, borderColor: isDark ? colors.lineStrong : '#E8E8E8' },
  freeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', height: 40 },
  freeT: { ...sansW('700'), fontSize: 14, lineHeight: 17, includeFontPadding: false, color: colors.ink, letterSpacing: -0.56, marginTop: 7 },
  freeD: { ...sansW('500'), fontSize: 13, lineHeight: 18, includeFontPadding: false, color: colors.inkMute, letterSpacing: -0.65, marginTop: 4 },
  bundle: { padding: 15, paddingBottom: 15 },
  bundleT: { ...sansW('700'), fontSize: 16, lineHeight: 18, color: '#00A3FF', letterSpacing: -0.8 },
  bundleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: colors.seal },
  bundleTagText: { ...sansW('600'), fontSize: 12, lineHeight: 15, color: colors.seal, letterSpacing: 0 },
  // 보유 중 — Figma 칩: 0.5 테두리 · 좌우 4
  bundleD: { ...sansW('400'), fontSize: 13, lineHeight: 18, color: colors.ink, letterSpacing: -0.65, marginTop: 8, paddingRight: 64 },
  bundleOrig: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: colors.inkMute, textDecorationLine: 'line-through', marginTop: 4 },
  bundleButton: { marginTop: 12, marginHorizontal: -4 },
  bundleButtonText: { ...sansW('500'), fontSize: 14, lineHeight: 17, letterSpacing: 0 },
  price: { position: 'absolute', right: -4, top: -4 },
  artBox: { height: 40, justifyContent: 'center' },
  // 긴 제목·설명은 Figma처럼 오른쪽 여백까지 써서 156칸 카드에 한 줄로 넣는다 (웹 Text는 max-width 100%라 감싼 View에서 넓힌다)
  bleed: { marginRight: -12 },
  // 글꼴을 스타일시트에 둬야 웹에서 전역 자간 -0.2px에 덮이지 않는다
  premiumD: { ...sansW('500'), letterSpacing: -0.65 },
  // 반려동물 · 배우자 그림은 Figma에서 41×39 칸
  extraArt: { width: 41, height: 39 },
  soon: { width: '47.5%', flexGrow: 1, minHeight: CARD_H, padding: 15, borderRadius: radius.lg, backgroundColor: colors.cream, borderWidth: 1, borderColor: isDark ? colors.lineStrong : '#E8E8E8' },
  soonD: { ...sansW('500'), letterSpacing: -0.65 },
  // 더보기 — 피그마 4×12 패딩 · 테두리 #E8E8E8 · 그림자 0 2 8 25% · 둥근 24, 글자 12/500 #777 -0.04em
  soonFade: { position: 'absolute', left: -24, right: -24, bottom: -24, height: 63 },
  moreRow: { position: 'absolute', left: 0, right: 0, bottom: -27, alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 24, borderWidth: 1, borderColor: isDark ? colors.lineStrong : '#E8E8E8', backgroundColor: colors.cream, boxShadow: '0px 2px 8px rgba(0,0,0,0.25)' },
  moreText: { ...sansW('500'), fontSize: 12, lineHeight: 17, color: colors.inkMute, letterSpacing: -0.48, includeFontPadding: false },
  soonT: { ...sansW('700'), fontSize: 13, lineHeight: 16, marginTop: 8, letterSpacing: -0.78 }, // 글꼴을 스타일시트에 둬야 웹에서 자간이 전역 -0.2px에 덮이지 않는다
});
