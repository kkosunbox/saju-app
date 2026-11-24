import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, StyleSheet, Text, View, ViewStyle, TextStyle, StyleProp, RefreshControlProps, type NativeScrollEvent, type NativeSyntheticEvent, type ViewInstance } from 'react-native';
import { KeyboardAvoidingView, KeyboardEvents } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation/compat';
import PressableScale from './PressableScale';
import Icon from './Icon';
import AskUnalPopup from './AskUnalPopup';
import type { ChatSource } from '../services/server/consultApi';
import { colors, gradients } from '../theme/colors';
import { SCREEN_PX, txt } from '../theme/typography';
import { useWebTopBar } from '../utils/webThemeColor';
import { useSharedView } from '../context/SharedViewContext';
import { TopBarProbe, TOP_BAR_H, useTopBarInsets } from '../utils/topBarRegion';

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
  /** 뒤로 가기 자리에 둘 버튼 (예: 운알톡 대화의 대화 목록 메뉴). 주면 뒤로 가기 대신 이걸 보여 준다 */
  left?: React.ReactNode;
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
  /**
   * 끝까지 읽을 즈음 운알이가 튀어나와 이 화면 내용으로 바로 물어보게 한다 (운알톡이 이 화면을 기억하고 이야기한다).
   * 공유 링크로 연 화면에서는 띄우지 않는다
   */
  talk?: ChatSource;
}

/** 본문 끝 표시가 없는 화면: 페이지 끝에서 이만큼 남았을 때 운알이를 띄운다 */
const TALK_END_PX = 160;
/** 본문 끝 표시가 화면 아래에서 이만큼 올라오면 (다 읽었다고 보고) 운알이를 띄운다 */
const TALK_MARK_PX = 40;

/** 본문 끝 표시를 Screen에 알려 주는 통로 */
const TalkEndContext = createContext<((ref: ViewInstance | null) => void) | null>(null);

/**
 * 운알이 알림의 기준점 — 풀이 본문이 끝나는 자리에 둔다 (공유 카드 · 추천 배너 · 안내 문구 앞).
 * 이 자리가 화면에 들어오면 알림이 뜬다. 없으면 페이지 끝 근처에서 뜬다
 */
export function TalkEnd() {
  const register = useContext(TalkEndContext);
  return <View ref={register} collapsable={false} pointerEvents="none" style={{ height: 0 }} />;
}

export default function Screen({ children, title, titleStyle, largeTitle, back, scroll = true, scrollEnabled = true, right, left, contentStyle, bg = colors.cream, sky, refreshControl, footer, onBack, floatingBar, talk }: Props) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  // 상단 바 자리: 보통은 안전 영역과 같고, 상태 표시가 모서리에 있는 화면(iPhone Duo)에서는 그 옆까지 올라가 그 쪽만 비켜 선다
  const barInsets = useTopBarInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const floating = floatingBar && scroll;
  const webKeyboard = useWebKeyboardInset();
  const keyboard = useKeyboardShown() || webKeyboard > 0;
  // 하단 버튼은 홈 인디케이터·화면 라운딩을 피해 올린다. 탭 화면(largeTitle)은 아래 탭 바가 이미 피해 주고, 키보드가 떠 있으면 키보드 바로 위에 붙인다
  const footerBottom = largeTitle || keyboard ? 12 : Math.max(insets.bottom, 12);
  // 하단 버튼도 탭 바도 없으면 본문 끝이 안드로이드 내비게이션 바(edge-to-edge)·홈 인디케이터에 가리지 않게 그만큼 더 띄운다
  const scrollBottom = footer || largeTitle ? 0 : insets.bottom;
  // 웹: 상단 바 색을 화면 맨 위 그라디언트에 맞춘다. 그라디언트는 스크롤해도 제자리라 한 번만 맞추면 된다
  useWebTopBar(sky ? [[0, gradients.skySoft[0]], [SKY_H * SKY_FADE, gradients.skySoft[1]]] : null);
  // 탭 화면(큰 제목)은 뒤로 가기 없이 제목만. 화면 안 단계가 있을 때(onBack)만 둔다.
  // 공유 링크(/r/{token})로 연 화면은 돌아갈 곳이 없으니 뒤로 가기를 두지 않는다
  const sharedView = !!useSharedView();
  // 운알이 — 한 번 끝 근처에 닿으면 계속 보여 준다 (닫기는 운알이가 맡는다)
  const asksTalk = !!talk && scroll && !sharedView;
  const [nearEnd, setNearEnd] = useState(false);
  // 본문 끝 표시 — 있으면 그게 화면에 들어올 때, 없으면 페이지 끝 근처에서 (아래 배너까지 내려가야 뜨지 않게)
  const talkMark = useRef<ViewInstance | null>(null);
  const measuring = useRef(false);
  const [registerTalkMark] = useState(() => (ref: ViewInstance | null) => { talkMark.current = ref; });
  const onTalkScroll = ({ nativeEvent: n }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (nearEnd || n.contentSize.height <= n.layoutMeasurement.height) return;
    const mark = talkMark.current;
    if (!mark) {
      if (n.contentOffset.y + n.layoutMeasurement.height >= n.contentSize.height - TALK_END_PX) setNearEnd(true);
      return;
    }
    // 한 번 재는 동안에는 다시 재지 않는다 (스크롤 이벤트마다 재지 않게)
    if (measuring.current) return;
    measuring.current = true;
    mark.measureInWindow((_x, y) => {
      measuring.current = false;
      if (y > 0 && y <= Dimensions.get('window').height - TALK_MARK_PX) setNearEnd(true);
    });
  };
  const showBack = (back || !!onBack) && !sharedView && !left;
  const goBack = onBack ?? (() => nav.goBack());
  const heading = title ?? largeTitle;
  const bar = (heading || showBack || right || left) && (
    <View style={[s.bar, { paddingLeft: Math.max(SCREEN_PX, barInsets.left), paddingRight: Math.max(SCREEN_PX, barInsets.right) }, floating && [s.floatBar, { top: barInsets.top }]]}>
      {showBack ? (
        <PressableScale onPress={goBack} hitSlop={10} style={s.iconBtn} accessibilityLabel="뒤로 가기" scaleTo={0.9}>
          <Icon name="chevronLeft" size={24} strokeWidth={2} />
        </PressableScale>
      ) : null}
      {left ?? null}
      <Text style={[s.title, titleStyle]} numberOfLines={1} accessibilityRole="header">{heading}</Text>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );

  return (
    <TalkEndContext.Provider value={asksTalk ? registerTalkMark : null}>
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: barInsets.top }}>
      <TopBarProbe />
      {sky ? <LinearGradient pointerEvents="none" colors={gradients.skySoft} locations={[0, SKY_FADE]} style={s.sky} /> : null}
      {floating ? null : bar}
      {/* 키보드가 뜨면 본문과 하단 버튼을 키보드 위로 올린다 (이메일 입력 중에도 '다음'을 바로 누르게). 모바일 웹은 KeyboardAvoidingView가 아무것도 하지 않아 가려진 만큼 직접 띄운다 */}
      <KeyboardAvoidingView style={[{ flex: 1 }, webKeyboard ? { paddingBottom: webKeyboard } : null]} behavior="padding">
      {scroll ? (
        <Animated.ScrollView
          contentContainerStyle={[s.content, floating && { paddingTop: BAR_H + 8 }, contentStyle]} showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled} refreshControl={refreshControl} keyboardShouldPersistTaps="handled"
          onScroll={floating
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false, listener: asksTalk ? onTalkScroll : undefined })
            : asksTalk ? onTalkScroll : undefined} scrollEventThrottle={16}
        >
          {children}
          {scrollBottom ? <View style={{ height: scrollBottom }} /> : null}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
      {/* 운알이는 본문 아래에서 튀어나온다 — 키보드가 뜨면 함께 올라간다 */}
      {asksTalk && talk ? <AskUnalPopup source={talk} visible={nearEnd} bottom={footer ? 4 : footerBottom} bg={bg} /> : null}
      {footer ? <View style={[s.footer, { paddingBottom: footerBottom }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
      {floating ? (
        // 바 배경: 화면 맨 위 그라디언트와 같은 그림을 바 높이만큼 잘라, 스크롤을 내리면 나타나게 한다
        <Animated.View pointerEvents="none" style={[s.barBg, { height: barInsets.top + BAR_H, opacity: scrollY.interpolate({ inputRange: [0, 16], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          {sky ? <LinearGradient colors={gradients.skySoft} locations={[0, SKY_FADE]} style={s.sky} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />}
        </Animated.View>
      ) : null}
      {floating ? bar : null}
    </View>
    </TalkEndContext.Provider>
  );
}

/** 키보드가 떠 있는지. 올라오기 시작할 때 바꿔 버튼 여백이 키보드와 같이 움직이게 한다 (안드로이드도 keyboard-controller가 시작 시점을 알려 준다) */
export function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subs = [
      KeyboardEvents.addListener('keyboardWillShow', () => setShown(true)),
      KeyboardEvents.addListener('keyboardWillHide', () => setShown(false)),
    ];
    return () => subs.forEach(sub => sub.remove());
  }, []);
  return shown;
}

/**
 * 모바일 웹: 화면 아래를 가린 키보드 높이. Safari·Chrome은 키보드가 떠도 레이아웃 높이를 그대로 두고 보이는 영역(visualViewport)만 줄여
 * 하단 버튼이 키보드 밑에 숨는다. 키보드에 밀려 페이지가 올라간 만큼(offsetTop)도 뺀다
 */
export function useWebKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = Platform.OS === 'web' && typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const update = () => {
      const hidden = Math.round(window.innerHeight - vv.height - vv.offsetTop);
      // 주소창이 접히고 펴지는 정도의 차이는 키보드로 보지 않는다
      setInset(hidden > 80 ? hidden : 0);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  return inset;
}

const BAR_H = TOP_BAR_H;
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
