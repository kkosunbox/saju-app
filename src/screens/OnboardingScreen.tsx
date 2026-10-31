import React, { useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import BrandMark, { LogoMark } from '../components/BrandMark';
import Mascot from '../components/Mascot';
import TodayShareCard, { TODAY_W } from '../components/TodayShareCard';
import type { TodayCardData } from '../services/share/shareSpecs';
import { todayISO } from '../utils/date';
import { analysisTheme, colors } from '../theme/colors';
import { fonts, radius, SCREEN_PX, txt } from '../theme/typography';
import { COPY } from '../content/copy';
import { webSafeTop } from '../utils/webThemeColor';

const PAGES = [
  { title: '오늘, 어떤 운을\nPICK하시겠어요?', body: COPY.pickMe, art: 'sheet' },
  { title: '네 가지 관점으로\n나를 읽어요', body: '사주 · 점성술 · MBTI · 타로를 겹쳐 읽어요.', art: 'four' },
  { title: '뽑은 결과는\n친구와 나눠요', body: '친구 결과와 나란히 비교하고, 스토리에도 올려 보세요.', art: 'story' },
] as const;

type Art = (typeof PAGES)[number]['art'];
const SOURCES = ['saju', 'thai', 'mbti', 'tarot'] as const;
const SAMPLE_CARD: TodayCardData = {
  nickname: '운픽',
  total: 82,
  title: '막힘없는 해결사',
  line: '막혀 있던 일이 풀리는 날이에요',
  topPercent: 12,
  pose: 'crown',
  scores: [['연애', '78'], ['재물', '64'], ['직장', '88'], ['관계', '71']],
};
/** 스토리 카드(311×553)를 무대(높이 300) 안에 들어가게 */
const STORY_SCALE = 0.48;

export function Illustration({ kind }: { kind: Art }) {
  if (kind === 'sheet') {
    return (
      <View style={[a.stage, { backgroundColor: colors.accentSoft }]}>
        <LogoMark size={150} />
      </View>
    );
  }
  if (kind === 'story') {
    // 실제로 공유되는 오늘의 운세 스토리 카드를 예시 값으로 줄여 보여 준다
    return (
      <View style={[a.stage, { backgroundColor: colors.accentSoft }]}>
        <View style={a.story}>
          <View style={a.storyScale}><TodayShareCard data={SAMPLE_CARD} today={todayISO()} /></View>
        </View>
      </View>
    );
  }
  const r = 78;
  return (
    <View style={[a.stage, { backgroundColor: colors.accentSoft }]}>
      <View style={a.center}><LogoMark size={40} /></View>
      {SOURCES.map((k, i) => {
        const ang = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const t = analysisTheme[k];
        return (
          <View key={k} style={[a.orb, { backgroundColor: t.bg, transform: [{ translateX: Math.cos(ang) * r }, { translateY: Math.sin(ang) * r }] }]}>
            <Mascot name={k === 'tarot' ? 'soon-tarot' : `pose-${k}`} size={34} />
            <Text style={[a.orbLabel, { color: t.color }]}>{t.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  // 웹(아이폰 Safari)에서 상단 띠가 로고를 덮지 않게 위 여백을 띠 높이 이상으로
  const safeTop = webSafeTop(useSafeAreaInsets().top);
  // 웹에서는 앱이 휴대폰 폭으로 가운데 놓이므로 창 폭이 아니라 실제 영역 폭으로 넘긴다
  const win = useWindowDimensions().width;
  const [w, setW] = useState(0);
  const width = w || win;
  const [page, setPage] = useState(0);
  const list = useRef<FlatList<(typeof PAGES)[number]>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const last = page === PAGES.length - 1;

  const next = () => {
    if (last) return completeOnboarding();
    list.current?.scrollToOffset({ offset: (page + 1) * width, animated: true });
    setPage(page + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, paddingTop: safeTop }} edges={['left', 'right', 'bottom']}>
      <View style={s.top}>
        <BrandMark />
        {!last ? (
          <PressableScale onPress={completeOnboarding} hitSlop={12} scaleTo={0.94}><Text style={s.skip}>건너뛰기</Text></PressableScale>
        ) : null}
      </View>
      <Animated.FlatList
        ref={list}
        onLayout={e => setW(e.nativeEvent.layout.width)}
        style={{ flex: 1 }}
        data={PAGES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={p => p.title}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 24 }}>
            <Illustration kind={item.art} />
            <Text style={[txt.title, { fontSize: 28, lineHeight: 38, marginTop: 32 }]}>{item.title}</Text>
            <Text style={[txt.body, { marginTop: 10 }]}>{item.body}</Text>
          </View>
        )}
      />
      <View style={s.bottom}>
        <View style={s.dots}>
          {PAGES.map((_, i) => {
            const w = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [6, 22, 6], extrapolate: 'clamp' });
            const bg = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [colors.lavender, colors.navy, colors.lavender], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[s.dot, { width: w, backgroundColor: bg }]} />;
          })}
        </View>
        <PrimaryButton label={last ? '시작하기' : '다음'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // 홈 상단 바와 같은 높이 · 로고 크기
  top: { height: 56, paddingHorizontal: SCREEN_PX, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontSize: 14, color: colors.inkMute, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});

const a = StyleSheet.create({
  story: { width: TODAY_W * STORY_SCALE, aspectRatio: 9 / 16, transform: [{ rotate: '3deg' }], borderRadius: 20 * STORY_SCALE, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  storyScale: { width: TODAY_W, transform: [{ scale: STORY_SCALE }], transformOrigin: 'top left' },
  stage: { height: 300, marginTop: 12, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.moon, opacity: 0.12 },
  moon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.moon, overflow: 'hidden' },
  moonCut: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#1A1E2B', left: 38, top: -16 },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: '#fff', opacity: 0.8 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.lavender, borderStyle: 'dashed' },
  center: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  orbLabel: { position: 'absolute', bottom: -20, fontSize: 12, fontWeight: '700', width: 90, textAlign: 'center' },
  mini: { width: 200, paddingVertical: 24, borderRadius: radius.xl, alignItems: 'center' },
  miniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  miniScore: { fontFamily: fonts.serif, color: '#fff', fontSize: 48, fontWeight: '500', letterSpacing: -1 },
  miniChip: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
});
