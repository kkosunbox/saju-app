import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View, ViewStyle, TextStyle, StyleProp, RefreshControlProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import { colors, gradients } from '../theme/colors';
import { SCREEN_PX, txt } from '../theme/typography';
import { useWebTopBar } from '../utils/webThemeColor';

interface Props {
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  title?: string;        // 상단 바 제목 (뒤로 가기 옆, 왼쪽 정렬)
  largeTitle?: string;   // 탭 화면 제목 — 디자인이 바뀌어 상단 바 제목과 같은 자리에 같은 크기로 쓴다
  subtitle?: string;     // 예전 큰 제목 아래 한 줄. 지금 디자인에는 자리가 없어 보여주지 않는다
  back?: boolean;
  scroll?: boolean;
  /** 스크롤은 두되 잠시 멈춘다 (예: 금박을 긁는 동안) */
  scrollEnabled?: boolean;
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

export default function Screen({ children, title, titleStyle, largeTitle, back, scroll = true, scrollEnabled = true, right, contentStyle, bg = colors.cream, sky, refreshControl, footer, onBack, floatingBar }: Props) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const floating = floatingBar && scroll;
  const keyboard = useKeyboardShown();
  // 하단 버튼은 홈 인디케이터·화면 라운딩을 피해 올린다. 탭 화면(largeTitle)은 아래 탭 바가 이미 피해 주고, 키보드가 떠 있으면 키보드 바로 위에 붙인다
  const footerBottom = largeTitle || keyboard ? 12 : Math.max(insets.bottom, 12);
  // 웹: 상단 바 색을 화면 맨 위 그라디언트에 맞춘다. 그라디언트는 스크롤해도 제자리라 한 번만 맞추면 된다
  useWebTopBar(sky ? [[0, gradients.skySoft[0]], [SKY_H * SKY_FADE, gradients.skySoft[1]]] : null);
  // 탭 화면(큰 제목)은 뒤로 가기 없이 제목만. 화면 안 단계가 있을 때(onBack)만 둔다
  const showBack = back || !!onBack;
  const goBack = onBack ?? (() => nav.goBack());
  const heading = title ?? largeTitle;
  const bar = (heading || showBack || right) && (
    <View style={[s.bar, floating && [s.floatBar, { top: insets.top }]]}>
      {showBack ? (
        <PressableScale onPress={goBack} hitSlop={10} style={s.iconBtn} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
          <Icon name="chevronLeft" size={24} strokeWidth={2} />
        </PressableScale>
      ) : null}
      <Text style={[s.title, titleStyle]} numberOfLines={1} accessibilityRole="header">{heading}</Text>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {sky ? <LinearGradient pointerEvents="none" colors={gradients.skySoft} locations={[0, SKY_FADE]} style={s.sky} /> : null}
      {floating ? null : bar}
      {/* 키보드가 뜨면 본문과 하단 버튼을 키보드 위로 올린다 (이메일 입력 중에도 '다음'을 바로 누르게) */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? (
        <Animated.ScrollView
          contentContainerStyle={[s.content, floating && { paddingTop: BAR_H + 8 }, contentStyle]} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled} refreshControl={refreshControl} keyboardShouldPersistTaps="handled"
          onScroll={floating ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }) : undefined} scrollEventThrottle={16}
        >
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[s.footer, { paddingBottom: footerBottom }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
      {floating ? (
        // 바 배경: 화면 맨 위 그라디언트와 같은 그림을 바 높이만큼 잘라, 스크롤을 내리면 나타나게 한다
        <Animated.View pointerEvents="none" style={[s.barBg, { height: insets.top + BAR_H, opacity: scrollY.interpolate({ inputRange: [0, 16], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          {sky ? <LinearGradient colors={gradients.skySoft} locations={[0, SKY_FADE]} style={s.sky} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />}
        </Animated.View>
      ) : null}
      {floating ? bar : null}
    </SafeAreaView>
  );
}

/** 키보드가 떠 있는지. iOS는 올라오기 시작할 때 바꿔 버튼 여백이 키보드와 같이 움직이게 한다 */
function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const subs = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setShown(true)),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setShown(false)),
    ];
    return () => subs.forEach(sub => sub.remove());
  }, []);
  return shown;
}

const BAR_H = 56;
const SKY_H = 150;
const SKY_FADE = 0.64;

const s = StyleSheet.create({
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: SKY_H },
  bar: { height: BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SCREEN_PX },
  floatBar: { position: 'absolute', left: 0, right: 0 },
  barBg: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  iconBtn: { width: 32, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { ...txt.h2, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  content: { paddingHorizontal: SCREEN_PX, paddingTop: 8, paddingBottom: 40 },
  footer: { paddingHorizontal: SCREEN_PX, paddingTop: 8 },
});
