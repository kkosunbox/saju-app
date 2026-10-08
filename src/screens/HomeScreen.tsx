import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import TodayHero from '../components/TodayHero';
import LuckyStrip from '../components/LuckyStrip';
import AnalysisTile from '../components/AnalysisTile';
import ActionTabs from '../components/ActionTabs';
import SectionHeader from '../components/SectionHeader';
import PressableScale from '../components/PressableScale';
import BrandMark from '../components/BrandMark';
import Icon from '../components/Icon';
import Reveal from '../components/Reveal';
import HomeSkeleton from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import { colors } from '../theme/colors';
import { radius, SCREEN_PX, txt } from '../theme/typography';
import { formatKoreanDate } from '../utils/date';


export default function HomeScreen() {
  const { user, fortune, today, fortuneLoading, refreshFortune } = useApp();

  const top = (
    <View style={s.topBar}>
      <BrandMark />
      <PressableScale onPress={() => fortune && router.push('/share')} style={s.iconBtn} scaleTo={0.9} accessibilityLabel="오늘의 운세 공유하기" disabled={!fortune}>
        <Icon name="share" size={20} color={colors.purple} />
      </PressableScale>
    </View>
  );

  if (!fortune || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        {top}
        <HomeSkeleton />
      </SafeAreaView>
    );
  }
  const f = fortune.combined;
  const a = fortune.analyses;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
      {top}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SCREEN_PX, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={fortuneLoading} onRefresh={() => refreshFortune()} tintColor={colors.purple} />}
      >
        {/* 첫 화면: 인사 → 히어로 한 장에 오늘의 모든 핵심 */}
        <Reveal>
          <Text style={txt.title}>{user.nickname}님의 오늘</Text>
          <Text style={[txt.small, { marginTop: 2, marginBottom: 16 }]}>{formatKoreanDate(today)}</Text>
        </Reveal>
        <Reveal delay={90}>
          <TodayHero
            fortune={f}
            onOpenStory={() => router.push('/combined')}
            onOpenCategory={c => router.push(`/category/${c}`)}
          />
        </Reveal>
        <Reveal delay={180} style={{ marginTop: 12 }}>
          <LuckyStrip f={f} />
        </Reveal>

        {/* 행동 조언 */}
        <SectionHeader title="오늘의 행동" />
        <ActionTabs good={f.goodActions} avoid={f.avoidActions} />

        {/* 4가지 관점 */}
        <SectionHeader title="4가지 관점" caption="오늘의 운세는 이렇게 만들어졌어요" action="종합 보기" onAction={() => router.push('/combined')} />
        <View style={s.grid}>
          <View style={s.gridRow}>
            <AnalysisTile analysis={a.saju} onPress={() => router.push('/analysis/saju')} />
            <AnalysisTile analysis={a.thai} onPress={() => router.push('/analysis/thai')} />
          </View>
          <View style={s.gridRow}>
            <AnalysisTile analysis={a.mbti} onPress={() => router.push('/analysis/mbti')} />
            <AnalysisTile analysis={a.blood} onPress={() => router.push('/analysis/blood')} />
          </View>
        </View>

        <PressableScale onPress={() => router.push('/combined')} style={s.story} accessibilityLabel="네 가지 결과를 엮은 이야기 보기">
          <View style={{ flex: 1 }}>
            <Text style={s.storyTitle}>네 가지 결과를 엮은 이야기</Text>
            <Text style={s.storySub}>공통 키워드 {f.commonKeywords.length || 1}개 · 오늘의 한 문단</Text>
          </View>
          <View style={s.storyArrow}><Icon name="chevronRight" size={18} color={colors.white} strokeWidth={2.2} /></View>
        </PressableScale>

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: SCREEN_PX, paddingRight: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  story: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lavenderSoft, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.lavender },
  storyTitle: { fontSize: 15, fontWeight: '700', color: colors.purple, letterSpacing: -0.3 },
  storySub: { fontSize: 12, color: colors.purpleSoft, marginTop: 3 },
  storyArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
});
