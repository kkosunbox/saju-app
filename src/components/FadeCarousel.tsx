import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { motion, useReducedMotion, useScreenLive } from '../utils/motion';

const ROTATE_MS = 4000;
const FADE_MS = 600;
/** 옆으로 이만큼 밀면 다음 · 이전 장으로 */
const SWIPE_PX = 40;

interface Props<T> {
  items: T[];
  keyOf(item: T): string;
  /** 점 버튼의 읽기 이름 */
  labelOf(item: T): string;
  /** 한 장 — 누르면 onPress (지금 보이는 장만 눌린다) */
  renderSlide(item: T, onPress: () => void): React.ReactNode;
  /**
   * 장마다 다른 바탕(하늘색 등). 글 · 그림과 따로 바꾼다 — 사라지는 바탕은 그대로 두고 그 위로 새 바탕만 서서히 덮어,
   * 중간 색이 두 색을 섞은 색(흰 바탕이 비치지 않음)이 되게 한다. 그래야 섞어 칠한 상태바 색과 이음매 없이 맞는다
   */
  renderBackdrop?(item: T): React.ReactNode;
  onPressItem(item: T): void;
  /** 바뀌는 동안 매 프레임 — from 장에서 to 장으로 t(0~1)만큼 넘어갔다 */
  onBlend?(from: number, to: number, t: number): void;
  onIndexChange?(index: number): void;
  style?: StyleProp<ViewStyle>;
  dotsStyle?: StyleProp<ViewStyle>;
  dotTargetStyle?: StyleProp<ViewStyle>;
  dotStyle: StyleProp<ViewStyle>;
  dotOnStyle: StyleProp<ViewStyle>;
}

/**
 * 제자리에서 서서히 바뀌는 배너 (홈 맨 위). 옆으로 미는 대신 지금 장이 사라지며 다음 장이 나타난다 —
 * 바탕색이 장마다 달라도 한 자리에서 섞여 바뀌어, 웹 Safari 상태바 색도 같이 섞어 칠할 수 있다.
 * 가만히 두면 4초마다 다음 장, 옆으로 밀면 그 방향으로, 점을 누르면 그 장으로.
 */
export default function FadeCarousel<T>({ items, keyOf, labelOf, renderSlide, renderBackdrop, onPressItem, onBlend, onIndexChange, style, dotsStyle, dotTargetStyle, dotStyle, dotOnStyle }: Props<T>) {
  const n = items.length;
  const reduced = useReducedMotion();
  const live = useScreenLive();
  // [사라지는 장, 나타나는 장] — 다 바뀌면 둘이 같다
  const [pair, setPair] = useState<[number, number]>([0, 0]);
  const [fade] = useState(() => new Animated.Value(1));
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const nextAt = useRef(0);
  /** 다음 자동 전환을 지금부터 4초 뒤로 미룬다 */
  const holdRotation = useCallback(() => { nextAt.current = Date.now() + ROTATE_MS; }, []);
  const cur = pair[1];

  const blend = useRef(onBlend);
  const indexChange = useRef(onIndexChange);
  useEffect(() => { blend.current = onBlend; indexChange.current = onIndexChange; });
  useEffect(() => { indexChange.current?.(cur); }, [cur]);

  // 투명도가 바뀔 때마다 두 장 사이 위치를 알린다 (상태바 색 섞기)
  const pairRef = useRef(pair);
  useEffect(() => { pairRef.current = pair; }, [pair]);
  useEffect(() => {
    const id = fade.addListener(({ value }) => blend.current?.(pairRef.current[0], pairRef.current[1], value));
    return () => fade.removeListener(id);
  }, [fade]);

  const goTo = useCallback((to: number) => {
    const target = ((to % n) + n) % n;
    holdRotation();
    if (target === pairRef.current[1]) return;
    running.current?.stop();
    // 바뀌는 중에 또 넘기면, 지금 보이는 장에서 새 장으로 이어 간다
    const from = pairRef.current[1];
    pairRef.current = [from, target];
    setPair([from, target]);
    fade.setValue(0);
    const anim = Animated.timing(fade, { toValue: 1, duration: reduced ? 0 : FADE_MS, easing: motion.easeInOut, useNativeDriver: false });
    running.current = anim;
    anim.start(({ finished }) => {
      if (!finished) return;
      running.current = null;
      setPair([target, target]);
    });
  }, [fade, n, reduced, holdRotation]);

  useEffect(() => {
    if (n < 2 || !live) return;
    holdRotation();
    const timer = setInterval(() => {
      if (Date.now() >= nextAt.current) goTo(pairRef.current[1] + 1);
    }, 200);
    return () => clearInterval(timer);
  }, [n, live, goTo, holdRotation]);

  // 옆으로 밀기 — 세로 스크롤과 누르기는 그대로 두고, 가로로 확실히 밀 때만 잡는다
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => n > 1 && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderGrant: () => { nextAt.current = Number.POSITIVE_INFINITY; },
    onPanResponderRelease: (_, g) => {
      holdRotation();
      if (Math.abs(g.dx) >= SWIPE_PX || Math.abs(g.vx) > 0.4) goTo(pairRef.current[1] + (g.dx < 0 ? 1 : -1));
    },
    onPanResponderTerminate: holdRotation,
  }), [goTo, n, holdRotation]);

  const [from, to] = pair;
  return (
    <View style={style} {...pan.panHandlers}>
      {renderBackdrop ? items.map((item, k) => {
        if (k !== to && k !== from) return null;
        return (
          <Animated.View key={`bg-${keyOf(item)}`} pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: k === to && from !== to ? fade : 1, zIndex: k === to ? 1 : 0 }]}>
            {renderBackdrop(item)}
          </Animated.View>
        );
      }) : null}
      {items.map((item, k) => {
        const shown = k === to || k === from;
        if (!shown) return null;
        const opacity = from === to ? 1 : k === to ? fade : fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        return (
          <Animated.View
            key={keyOf(item)}
            style={[StyleSheet.absoluteFill, { opacity, zIndex: k === to ? 3 : 2 }]}
            pointerEvents={k === to ? 'box-none' : 'none'}
            accessibilityElementsHidden={k !== to}
            importantForAccessibility={k === to ? 'auto' : 'no-hide-descendants'}
          >
            {renderSlide(item, () => onPressItem(item))}
          </Animated.View>
        );
      })}
      {n > 1 ? (
        <View style={[s.dots, dotsStyle]} pointerEvents="box-none">
          {items.map((b, k) => (
            <Pressable
              key={keyOf(b)}
              style={[s.dotTarget, dotTargetStyle]}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={`${k + 1}번째 배너 · ${labelOf(b)}`}
              accessibilityState={{ selected: k === to }}
              onPress={() => goTo(k)}
            >
              <View style={k === to ? dotOnStyle : dotStyle} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  dots: { position: 'absolute', left: 0, right: 0, zIndex: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dotTarget: { alignItems: 'center', justifyContent: 'center' },
});
