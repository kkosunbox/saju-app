import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PressableScale from '../../components/PressableScale';
import { colors } from '../../theme/colors';
import { useScreenLive } from '../../utils/motion';

const SPEED = 0.025; // px/ms — 천천히 흘러간다
const NATIVE = Platform.OS !== 'web';
// 끌고 놓은 시각은 손을 뗄 때만 잰다 (렌더 중 호출로 오인하지 않게 밖에 둔다)
const now = () => Date.now();
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
  const run = useRef<(() => void) | null>(null);
  const live = useScreenLive();

  // 한 바퀴씩 네이티브 애니메이션으로 흘린다 — JS가 매 프레임 값을 넣으면 메인 스레드가 계속 밀린다.
  // 화면이 안 보이거나 앱이 비활성이면 멈추고, 멈춘 자리에서 다시 흐른다
  useEffect(() => {
    if (!live) return;
    let still = false;
    let stopped = false;
    let running = false;
    const step = () => {
      const w = width.current;
      if (stopped || running || still || !w || dragFrom.current !== null) return;
      // 앞으로는 (-w, 0]에서 -w까지, 거꾸로는 [-w, 0)에서 0까지 — 두 번째 줄이 첫 줄 자리를 이어받는다
      let from = off.current % w;
      if (reverse ? from >= 0 : from > 0) from -= w;
      const to = reverse ? 0 : -w;
      x.setValue(from);
      running = true;
      Animated.timing(x, { toValue: to, duration: Math.abs(to - from) / SPEED, easing: Easing.linear, useNativeDriver: NATIVE }).start(({ finished }) => {
        running = false;
        if (!finished) return;
        off.current = reverse ? -w : 0;
        step();
      });
    };
    run.current = step;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { still = v; if (!v) step(); }).catch(() => step());
    return () => {
      stopped = true;
      run.current = null;
      x.stopAnimation(v => { off.current = v; });
    };
  }, [live, reverse, x]);

  // 옆으로 끌 때만 잡는다 — 그냥 누르면 칩이 눌리고, 위아래로 끌면 화면이 스크롤된다
  const pan = useMemo(() => {
    const sideways = (_: unknown, g: { dx: number; dy: number }) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy);
    const release = () => { dragFrom.current = null; dragEnd.current = now(); run.current?.(); };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: sideways,
      onMoveShouldSetPanResponder: sideways,
      onPanResponderGrant: () => {
        dragFrom.current = off.current;
        x.stopAnimation(v => { off.current = v; dragFrom.current = v; });
      },
      onPanResponderMove: (_, g) => {
        // 끄는 동안에도 (-w, 0] 안에 둔다 — 동작 줄이기로 멈춰 있어도 끝없이 넘길 수 있게
        const w = width.current;
        let v = (dragFrom.current ?? off.current) + g.dx;
        if (w) { v %= w; if (v > 0) v -= w; }
        off.current = v;
        x.setValue(v);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  // 웹은 끌고 놓을 때도 클릭이 와서, 방금 끈 손은 고른 것으로 치지 않는다
  const pick = (q: string) => { if (dragFrom.current === null && now() - dragEnd.current > 300) onPick(q); };

  const row = (copy: boolean) => (
    <View
      style={s.row}
      onLayout={copy ? undefined : e => { width.current = e.nativeEvent.layout.width; run.current?.(); }}
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
  clip: { overflow: 'hidden' },
  track: { flexDirection: 'row' },
  fade: { position: 'absolute', top: 0, bottom: 0, width: FADE },
  row: { flexDirection: 'row', gap: 16, paddingRight: 16 },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card },
  chipT: { fontSize: 14, lineHeight: 22, fontWeight: '500', color: colors.ink, letterSpacing: 0.1 },
});
