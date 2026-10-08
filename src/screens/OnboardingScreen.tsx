import React, { useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import BrandMark from '../components/BrandMark';
import { analysisTheme, colors, gradients } from '../theme/colors';
import { radius, txt } from '../theme/typography';

const PAGES = [
  { title: '오늘의 나는\n어떤 흐름일까?', body: '매일 아침, 나에게 맞춘 하루를 알려드려요.', art: 'moon' },
  { title: '사주부터\nMBTI까지', body: '타고난 기운과 지금의 성향을 함께 봐요.', art: 'orbit' },
  { title: '4가지 관점으로\n나를 분석해요', body: '사주 · 태국 점성술 · MBTI · 혈액형', art: 'four' },
  { title: '오늘의 나에게 맞는\n운세를 확인하세요', body: '네 가지 결과를 하나의 이야기로 엮어드려요.', art: 'story' },
] as const;

type Art = (typeof PAGES)[number]['art'];
const SOURCES = ['saju', 'thai', 'mbti', 'blood'] as const;

function Illustration({ kind }: { kind: Art }) {
  if (kind === 'moon') {
    return (
      <LinearGradient colors={gradients.night} style={a.stage}>
        <View style={a.halo} />
        <View style={a.moon}><View style={a.moonCut} /></View>
        {[[34, 48, 3], [60, 250, 2], [220, 70, 2], [250, 230, 3], [120, 290, 2]].map(([t, l, sz], i) => (
          <View key={i} style={[a.star, { top: t, left: l, width: sz, height: sz }]} />
        ))}
      </LinearGradient>
    );
  }
  if (kind === 'story') {
    return (
      <View style={[a.stage, { backgroundColor: colors.lavenderSoft }]}>
        <LinearGradient colors={gradients.hero} style={a.mini}>
          <Text style={a.miniLabel}>오늘의 종합운</Text>
          <Text style={a.miniScore}>87</Text>
          <Text style={{ color: colors.moon, letterSpacing: 2, fontSize: 12 }}>★★★★☆</Text>
          <View style={a.miniChip}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✨ 새로운 만남</Text></View>
        </LinearGradient>
      </View>
    );
  }
  const r = kind === 'orbit' ? 100 : 78;
  return (
    <View style={[a.stage, { backgroundColor: colors.lavenderSoft }]}>
      {kind === 'orbit' ? <View style={[a.ring, { width: r * 2, height: r * 2, borderRadius: r }]} /> : null}
      <View style={a.center}><Text style={{ fontSize: 22, color: colors.moon }}>☾</Text></View>
      {SOURCES.map((k, i) => {
        const ang = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const t = analysisTheme[k];
        return (
          <View key={k} style={[a.orb, { backgroundColor: kind === 'four' ? t.bg : colors.white, transform: [{ translateX: Math.cos(ang) * r }, { translateY: Math.sin(ang) * r }] }]}>
            <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
            {kind === 'four' ? <Text style={[a.orbLabel, { color: t.color }]}>{t.label}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const { width } = useWindowDimensions();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={s.top}>
        <BrandMark />
        {!last ? (
          <PressableScale onPress={completeOnboarding} hitSlop={12} scaleTo={0.94}><Text style={s.skip}>건너뛰기</Text></PressableScale>
        ) : null}
      </View>
      <Animated.FlatList
        ref={list}
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
            const bg = scrollX.interpolate({ inputRange: [(i - 1) * width, i * width, (i + 1) * width], outputRange: [colors.lavender, colors.purple, colors.lavender], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[s.dot, { width: w, backgroundColor: bg }]} />;
          })}
        </View>
        <PrimaryButton label={last ? '시작하기' : '다음'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontSize: 14, color: colors.inkMute, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});

const a = StyleSheet.create({
  stage: { height: 300, marginTop: 12, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.moon, opacity: 0.12 },
  moon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.moon, overflow: 'hidden' },
  moonCut: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#2A1D5E', left: 38, top: -16 },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: '#fff', opacity: 0.8 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.lavender, borderStyle: 'dashed' },
  center: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  orbLabel: { position: 'absolute', bottom: -20, fontSize: 11, fontWeight: '800', width: 90, textAlign: 'center' },
  mini: { width: 200, paddingVertical: 24, borderRadius: radius.xl, alignItems: 'center' },
  miniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  miniScore: { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: -1.5 },
  miniChip: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
});
