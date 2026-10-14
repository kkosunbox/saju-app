import React, { useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import PrimaryButton from '../components/PrimaryButton';
import PressableScale from '../components/PressableScale';
import BrandMark, { LogoMark } from '../components/BrandMark';
import { analysisTheme, colors } from '../theme/colors';
import { fonts, radius, txt } from '../theme/typography';
import { COPY } from '../content/copy';

const PAGES = [
  { title: '오늘, 어떤 운을\nPICK하시겠어요?', body: COPY.pickMe, art: 'sheet' },
  { title: '네 가지 관점으로\n나를 읽어요', body: '사주 · 태국 점성술 · MBTI · 혈액형을 겹쳐 읽어요.', art: 'four' },
  { title: '뽑은 결과는\n친구와 나눠요', body: '친구 결과와 나란히 비교하고, 스토리에도 올려 보세요.', art: 'story' },
] as const;

type Art = (typeof PAGES)[number]['art'];
const SOURCES = ['saju', 'thai', 'mbti', 'blood'] as const;

function Illustration({ kind }: { kind: Art }) {
  if (kind === 'sheet') {
    return (
      <View style={[a.stage, { backgroundColor: colors.lavenderSoft }]}>
        <LogoMark size={150} />
      </View>
    );
  }
  if (kind === 'story') {
    return (
      <View style={[a.stage, { backgroundColor: colors.lavenderSoft }]}>
        <View style={a.paper}>
          <View style={a.paperIn}>
            <Text style={a.paperKind}>— 전생 테스트</Text>
            <Text style={a.paperHead}>발해의{'\n'}서당 훈장</Text>
            <View style={a.paperSeal}><Text style={a.paperSealText}>前</Text></View>
            <View style={{ flex: 1 }} />
            <View style={a.paperBars}>{[44, 28, 60, 20].map((w, i) => <View key={i} style={[a.paperBar, { width: w }]} />)}</View>
            <Text style={a.paperHook}>너는 전생에 누구였을까?</Text>
          </View>
        </View>
      </View>
    );
  }
  const r = 78;
  return (
    <View style={[a.stage, { backgroundColor: colors.lavenderSoft }]}>
      <View style={a.center}><LogoMark size={28} fg={'#F4EDDF'} /></View>
      {SOURCES.map((k, i) => {
        const ang = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const t = analysisTheme[k];
        return (
          <View key={k} style={[a.orb, { backgroundColor: t.bg, transform: [{ translateX: Math.cos(ang) * r }, { translateY: Math.sin(ang) * r }] }]}>
            <Text style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: '600', color: t.color }}>{t.emoji}</Text>
            <Text style={[a.orbLabel, { color: t.color }]}>{t.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
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
  top: { height: 52, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontSize: 14, color: colors.inkMute, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});

const a = StyleSheet.create({
  paper: { width: 150, height: 250, backgroundColor: '#F4EDDF', padding: 6, transform: [{ rotate: '3deg' }], shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  paperIn: { flex: 1, borderWidth: 0.5, borderColor: '#CDBFA6', padding: 10 },
  paperKind: { fontSize: 10, fontWeight: '800', color: '#A8402B', letterSpacing: 1 },
  paperHead: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 24, fontWeight: '700', color: '#1C1A17', marginTop: 8 },
  paperSeal: { position: 'absolute', right: 10, top: 22, width: 26, height: 26, borderRadius: 2, backgroundColor: '#B5432E', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  paperSealText: { fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: '#FBF4E8' },
  paperBars: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderWidth: 0.5, borderStyle: 'dashed', borderColor: '#CDBFA6', padding: 5 },
  paperBar: { height: 5, borderRadius: 3, backgroundColor: '#1C1A17' },
  paperHook: { fontFamily: fonts.serif, fontSize: 11, fontWeight: '700', color: '#1C1A17', marginTop: 8 },
  stage: { height: 300, marginTop: 12, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.moon, opacity: 0.12 },
  moon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.moon, overflow: 'hidden' },
  moonCut: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#1A1E2B', left: 38, top: -16 },
  star: { position: 'absolute', borderRadius: 2, backgroundColor: '#fff', opacity: 0.8 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: colors.lavender, borderStyle: 'dashed' },
  center: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineStrong },
  orbLabel: { position: 'absolute', bottom: -20, fontSize: 11, fontWeight: '800', width: 90, textAlign: 'center' },
  mini: { width: 200, paddingVertical: 24, borderRadius: radius.xl, alignItems: 'center' },
  miniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  miniScore: { fontFamily: fonts.serif, color: '#fff', fontSize: 48, fontWeight: '500', letterSpacing: -1 },
  miniChip: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
});
