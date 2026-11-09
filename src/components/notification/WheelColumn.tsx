import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, PanResponder, Platform, Pressable, ScrollViewInstance, StyleSheet, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { profileType } from '../../theme/profileDesign';

export const WHEEL_ITEM_H = 40;
export const WHEEL_VISIBLE = 5; // 가운데 1줄 + 위아래 2줄씩
const PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);
const web = Platform.OS === 'web';

/**
 * iOS 타이머처럼 굴려서 고르는 한 줄 휠. 가운데 줄이 고른 값이고, 멀어질수록 작고 흐려진다.
 * 손을 떼면 가장 가까운 줄에 붙는다 (웹은 스크롤이 멈추면 맞춘다). 줄을 눌러도 그 값으로 굴러간다.
 * 웹은 마우스로 끌어도 굴러가고(던지면 조금 더 간다), 끄는 동안 글자가 선택되지 않는다.
 */
export default function WheelColumn({ items, index, onChange, width, accessibilityLabel }: {
  items: string[];
  index: number;
  onChange(index: number): void;
  width: number;
  accessibilityLabel: string;
}) {
  const ref = useRef<ScrollViewInstance>(null);
  const [y] = useState(() => new Animated.Value(index * WHEEL_ITEM_H));
  const last = useRef(index); // 지나가는 줄마다 톡 — 같은 줄에선 한 번만
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragging = useRef(false);
  const offset = useRef(index * WHEEL_ITEM_H); // 지금 스크롤 위치 (웹 드래그의 출발점)
  const [grabbing, setGrabbing] = useState(false);
  const maxOffset = (items.length - 1) * WHEEL_ITEM_H;
  const latest = useRef({ index, onChange, maxOffset });
  useEffect(() => { latest.current = { index, onChange, maxOffset }; });

  // 웹: 마우스 드래그로 굴린다. 조금(4px) 움직여야 잡으니 줄을 누르는 건 그대로 된다
  const drag = useMemo(() => {
    if (!web) return null;
    let start = 0;
    const clampY = (v: number) => Math.max(0, Math.min(latest.current.maxOffset, v));
    const release = (dy: number, vy: number) => {
      setGrabbing(false);
      dragging.current = false;
      // 던진 속도(px/ms)만큼 조금 더 굴러간 자리의 줄에 붙인다
      const i = Math.round(clampY(start - dy - vy * 160) / WHEEL_ITEM_H);
      ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true });
      if (i !== latest.current.index) latest.current.onChange(i);
    };
    const moved = (_: unknown, g: { dx: number; dy: number }) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx);
    return PanResponder.create({
      onMoveShouldSetPanResponder: moved,
      onMoveShouldSetPanResponderCapture: moved,
      onPanResponderGrant: () => {
        clearTimeout(settle.current);
        start = offset.current;
        dragging.current = true;
        setGrabbing(true);
      },
      onPanResponderMove: (_, g) => ref.current?.scrollTo({ y: clampY(start - g.dy), animated: false }),
      onPanResponderRelease: (_, g) => release(g.dy, g.vy),
      onPanResponderTerminate: (_, g) => release(g.dy, 0),
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  // 밖에서 값이 바뀌면 (범위 밖이라 되돌릴 때 등) 그 줄로 굴린다
  useEffect(() => {
    if (dragging.current) return;
    last.current = index;
    ref.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: true });
  }, [index]);
  useEffect(() => () => clearTimeout(settle.current), []);

  const nearest = (offset: number) => Math.max(0, Math.min(items.length - 1, Math.round(offset / WHEEL_ITEM_H)));
  const commit = (offset: number) => {
    dragging.current = false;
    const i = nearest(offset);
    if (web) ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true });
    if (i !== index) onChange(i);
  };
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
    useNativeDriver: !web,
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y0 = e.nativeEvent.contentOffset.y;
      offset.current = y0;
      const i = nearest(y0);
      if (i !== last.current) { last.current = i; Haptics.selectionAsync().catch(() => {}); }
      // 휠·트랙패드로 굴렸을 때만 멈춘 뒤 맞춘다 (드래그는 놓을 때 맞춘다)
      if (web && !dragging.current) { clearTimeout(settle.current); settle.current = setTimeout(() => commit(y0), 120); }
    },
  });

  return (
    <View style={[{ width, height: WHEEL_ITEM_H * WHEEL_VISIBLE }, web && (grabbing ? webGrabbing : webGrab)]} {...drag?.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={accessibilityLabel} accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        const next = index + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        if (next >= 0 && next < items.length) onChange(next);
      }}
    >
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * WHEEL_ITEM_H }}
        contentContainerStyle={{ paddingVertical: PAD }}
        scrollEventThrottle={16}
        nestedScrollEnabled
        onScroll={onScroll}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onMomentumScrollEnd={e => commit(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={e => { if (!e.nativeEvent.velocity?.y) commit(e.nativeEvent.contentOffset.y); }}
        onLayout={() => ref.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: false })}
      >
        {items.map((label, i) => {
          const center = i * WHEEL_ITEM_H;
          const range = [center - WHEEL_ITEM_H * 2, center - WHEEL_ITEM_H, center, center + WHEEL_ITEM_H, center + WHEEL_ITEM_H * 2];
          const opacity = y.interpolate({ inputRange: range, outputRange: [0.18, 0.45, 1, 0.45, 0.18], extrapolate: 'clamp' });
          const scale = y.interpolate({ inputRange: range, outputRange: [0.84, 0.92, 1, 0.92, 0.84], extrapolate: 'clamp' });
          return (
            <Pressable key={label} onPress={() => { if (i !== index) onChange(i); }} importantForAccessibility="no" accessibilityElementsHidden>
              <Animated.Text style={[s.item, { opacity, transform: [{ scale }] }]} numberOfLines={1} selectable={false}>{label}</Animated.Text>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

// 웹 전용 스타일 — 끄는 동안 글자 선택·드래그 고스트를 막고 손 모양 커서를 보여 준다
const webGrab = { userSelect: 'none', cursor: 'grab', touchAction: 'pan-x' } as unknown as ViewStyle;
const webGrabbing = { userSelect: 'none', cursor: 'grabbing', touchAction: 'pan-x' } as unknown as ViewStyle;

const s = StyleSheet.create({
  item: { ...profileType(18, '600', WHEEL_ITEM_H, -0.4, colors.ink), height: WHEEL_ITEM_H, textAlign: 'center', userSelect: 'none' },
});
