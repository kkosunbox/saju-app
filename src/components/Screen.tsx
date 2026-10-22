import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle, RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation/compat';
import { useTabBack } from '../navigation/tabBack';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { colors, gradients } from '../theme/colors';
import { SCREEN_PX, txt } from '../theme/typography';

interface Props {
  children: React.ReactNode;
  title?: string;        // 상단 바 제목 (뒤로 가기 옆, 왼쪽 정렬)
  largeTitle?: string;   // 탭 화면 제목 — 디자인이 바뀌어 상단 바 제목과 같은 자리에 같은 크기로 쓴다
  subtitle?: string;     // 예전 큰 제목 아래 한 줄. 지금 디자인에는 자리가 없어 보여주지 않는다
  back?: boolean;
  scroll?: boolean;
  right?: React.ReactNode;
  contentStyle?: ViewStyle;
  bg?: string;
  /** 상단을 옅은 하늘색 그라디언트로 (콘텐츠 · 상담 대화) */
  sky?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  footer?: React.ReactNode; // 하단 고정 버튼 영역
  onBack?: () => void;      // 뒤로 가기를 화면 안 단계로 돌릴 때 (예: 결과 → 입력)
  /**
   * 상단 바를 본문 위에 띄운다: 맨 위에서는 바 배경이 투명해 본문이 바 자리까지 보이고(콘텐츠의 동전 마스코트),
   * 스크롤을 내리면 바 배경이 나타나 그 아래로 지나가는 본문을 가린다
   */
  floatingBar?: boolean;
}

export default function Screen({ children, title, largeTitle, back, scroll = true, right, contentStyle, bg = colors.cream, sky, refreshControl, footer, onBack, floatingBar }: Props) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const floating = floatingBar && scroll;
  const tabBack = useTabBack();
  // 탭 화면(큰 제목)에도 뒤로 가기: 화면 안 단계 → 이전에 보던 탭 → 홈
  const showBack = back || !!largeTitle || !!onBack;
  const goBack = onBack ?? (largeTitle && !back ? tabBack : () => nav.goBack());
  const heading = title ?? largeTitle;
  const bar = (heading || showBack || right) && (
    <View style={[s.bar, floating && [s.floatBar, { top: insets.top }]]}>
      {showBack ? (
        <PressableScale onPress={goBack} hitSlop={10} style={s.iconBtn} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
          <Icon name="chevronLeft" size={24} strokeWidth={2} />
        </PressableScale>
      ) : null}
      <Text style={s.title} numberOfLines={1} accessibilityRole="header">{heading}</Text>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {sky ? <LinearGradient pointerEvents="none" colors={gradients.skySoft} locations={[0, 0.64]} style={s.sky} /> : null}
      {floating ? null : bar}
      {scroll ? (
        <Animated.ScrollView
          contentContainerStyle={[s.content, floating && { paddingTop: BAR_H + 8 }, contentStyle]} showsVerticalScrollIndicator={false} refreshControl={refreshControl} keyboardShouldPersistTaps="handled"
          onScroll={floating ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }) : undefined} scrollEventThrottle={16}
        >
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {floating ? (
        // 바 배경: 화면 맨 위 그라디언트와 같은 그림을 바 높이만큼 잘라, 스크롤을 내리면 나타나게 한다
        <Animated.View pointerEvents="none" style={[s.barBg, { height: insets.top + BAR_H, opacity: scrollY.interpolate({ inputRange: [0, 16], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          {sky ? <LinearGradient colors={gradients.skySoft} locations={[0, 0.64]} style={s.sky} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />}
        </Animated.View>
      ) : null}
      {floating ? bar : null}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const BAR_H = 56;

const s = StyleSheet.create({
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  bar: { height: BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_PX },
  floatBar: { position: 'absolute', left: 0, right: 0 },
  barBg: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  iconBtn: { width: 32, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { ...txt.h2, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 12 },
});
