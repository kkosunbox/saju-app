import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '../../components/PressableScale';
import { colors } from '../../theme/colors';
import { SCREEN_PX } from '../../theme/typography';

const SPEED = 0.025; // px/ms — 천천히 흘러간다
const FADE = 28; // 좌우 끝에서 화면 바탕으로 스며드는 폭
const FADE_COLORS = [colors.cream, `${colors.cream}00`] as const;

/**
 * 예시 고민 한 줄 — 옆으로 천천히 흘러가고, 끌어서 넘길 수 있다(웹은 마우스로도). 누르면 고른다.
 * 같은 줄을 두 번 이어 붙여 끝없이 돈다. 동작 줄이기를 켜 두면 멈춰 있고 끌어서만 넘긴다.
 */
export default function WorryMarquee({ items, onPick, reverse }: { items: string[]; onPick(q: string): void; reverse?: boolean }) {
  const x = useRef(new Animated.Value(0)).current;
  const off = useRef(0);
  const width = useRef(0);
  const dragFrom = useRef<number | null>(null);
  const dragEnd = useRef(0);

  useEffect(() => {
    let still = false;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { still = v; }).catch(() => {});
    let last = Date.now();
    let raf = requestAnimationFrame(function tick() {
      const now = Date.now();
      const w = width.current;
      if (w && dragFrom.current === null && !still) off.current -= (reverse ? -1 : 1) * SPEED * (now - last);
      last = now;
      // 언제나 (-w, 0] 안에 둔다 — 두 번째 줄이 첫 줄 자리를 이어받는다
      if (w) { off.current %= w; if (off.current > 0) off.current -= w; }
      x.setValue(off.current);
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [reverse, x]);

  // 옆으로 끌 때만 잡는다 — 그냥 누르면 칩이 눌리고, 위아래로 끌면 화면이 스크롤된다
  const pan = useMemo(() => {
    const sideways = (_: unknown, g: { dx: number; dy: number }) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy);
    const release = () => { dragFrom.current = null; dragEnd.current = Date.now(); };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: sideways,
      onMoveShouldSetPanResponder: sideways,
      onPanResponderGrant: () => { dragFrom.current = off.current; },
      onPanResponderMove: (_, g) => { off.current = (dragFrom.current ?? off.current) + g.dx; },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  // 웹은 끌고 놓을 때도 클릭이 와서, 방금 끈 손은 고른 것으로 치지 않는다
  const pick = (q: string) => { if (dragFrom.current === null && Date.now() - dragEnd.current > 300) onPick(q); };

  const row = (copy: boolean) => (
    <View
      style={s.row}
      onLayout={copy ? undefined : e => { width.current = e.nativeEvent.layout.width; }}
      accessibilityElementsHidden={copy} importantForAccessibility={copy ? 'no-hide-descendants' : 'auto'}
    >
      {items.map(q => (
        <PressableScale key={q} onPress={() => pick(q)} style={s.chip} scaleTo={0.96} accessibilityLabel={`예시 고민: ${q}`}>
          <Text style={s.chipT} numberOfLines={1}>{q}</Text>
        </PressableScale>
      ))}
    </View>
  );

  return (
    <View style={[s.clip, Platform.OS === 'web' && WEB_DRAG]} {...pan.panHandlers}>
      <Animated.View style={[s.track, { transform: [{ translateX: x }] }]}>
        {row(false)}
        {row(true)}
      </Animated.View>
      {/* 좌우 끝이 뚝 잘리지 않게 바탕색으로 흐려 준다 */}
      <LinearGradient pointerEvents="none" colors={FADE_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fade, { left: 0 }]} />
      <LinearGradient pointerEvents="none" colors={FADE_COLORS} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={[s.fade, { right: 0 }]} />
    </View>
  );
}

// 웹: 끄는 동안 글자가 선택되지 않고 손 모양 커서
const WEB_DRAG = { userSelect: 'none', cursor: 'grab' } as object;

const s = StyleSheet.create({
  clip: { marginHorizontal: -SCREEN_PX, overflow: 'hidden' },
  track: { flexDirection: 'row' },
  fade: { position: 'absolute', top: 0, bottom: 0, width: FADE },
  row: { flexDirection: 'row', gap: 16, paddingRight: 16 },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card },
  chipT: { fontSize: 14, lineHeight: 22, fontWeight: '500', color: colors.ink, letterSpacing: 0.1 },
});
