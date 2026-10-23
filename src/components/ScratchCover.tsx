import React, { useEffect, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Mask, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { haptic } from '../utils/haptic';

const BRUSH = 38;
const COLS = 8, ROWS = 12;
const DONE_AT = 0.45; // 이만큼 긁으면 나머지는 저절로 걷힌다

/**
 * 긁어서 보는 덮개 — 아래 카드 위에 겹쳐 두고, 손가락이 지나간 자리만 뚫린다.
 * 긁힌 칸이 절반 가까이 되면 덮개가 사라지며 onDone. reveal 을 바꾸면(버튼) 바로 걷힌다.
 */
export default function ScratchCover({ width, height, radius = 16, title, hint, reveal, onDone }: {
  width: number; height: number; radius?: number; title: string; hint: string; reveal?: boolean; onDone(): void;
}) {
  const [strokes, setStrokes] = useState<string[]>([]);
  const cells = useRef(new Set<number>());
  const [fade] = useState(() => new Animated.Value(1));
  const finished = useRef(false);
  const [touched, setTouched] = useState(false);
  const plate = useRef<View>(null);

  // 웹에서 마우스로 긁으면 끌기가 글자 선택으로 번져 화면 글자가 칠해진다 — 누르는 순간 선택을 막는다
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = plate.current as unknown as HTMLElement | null;
    if (!el) return;
    const noSelect = (e: Event) => e.preventDefault();
    el.addEventListener('mousedown', noSelect);
    el.addEventListener('dragstart', noSelect);
    return () => {
      el.removeEventListener('mousedown', noSelect);
      el.removeEventListener('dragstart', noSelect);
    };
  }, []);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    haptic.done();
    Animated.timing(fade, { toValue: 0, duration: 380, useNativeDriver: true }).start(() => onDone());
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (reveal) finish(); }, [reveal]);

  const mark = (x: number, y: number) => {
    const c = Math.floor((x / width) * COLS), r = Math.floor((y / height) * ROWS);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    const k = r * COLS + c;
    if (!cells.current.has(k)) {
      cells.current.add(k);
      if (cells.current.size % 6 === 0) haptic.tick();
      if (cells.current.size / (COLS * ROWS) >= DONE_AT) finish();
    }
  };

  // 손가락 위치는 덮개 기준(locationX/Y)으로 받는다 — 맨 위의 빈 판이 응답자
  const touch = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const { locationX: x, locationY: y } = e.nativeEvent;
      setTouched(true);
      setStrokes(s => [...s, `M${x.toFixed(1)} ${y.toFixed(1)} l0.1 0`]);
      mark(x, y);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const { locationX: x, locationY: y } = e.nativeEvent;
      setStrokes(s => s.length ? [...s.slice(0, -1), `${s[s.length - 1]} L${x.toFixed(1)} ${y.toFixed(1)}`] : s);
      mark(x, y);
    },
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, userSelect: 'none' }]}>
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          <LinearGradient id="scratchFoil" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E9C25A" />
            <Stop offset="0.5" stopColor="#F7E39A" />
            <Stop offset="1" stopColor="#D9A93C" />
          </LinearGradient>
          <Mask id="scratchMask" x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse">
            <Rect x="0" y="0" width={width} height={height} fill="#FFFFFF" />
            {strokes.map((d, i) => <Path key={i} d={d} stroke="#000000" strokeWidth={BRUSH} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
          </Mask>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} rx={radius} fill="url(#scratchFoil)" mask="url(#scratchMask)" />
        {touched ? null : (
          <>
            <SvgText x={width / 2} y={height / 2 - 6} fontSize={84} fontWeight="700" fill="#B9861F" fillOpacity={0.35} textAnchor="middle">符</SvgText>
            <SvgText x={width / 2} y={height / 2 + 44} fontSize={17} fontWeight="700" fill="#5A4110" textAnchor="middle">{title}</SvgText>
          </>
        )}
      </Svg>
      {touched ? null : (
        <View pointerEvents="none" style={s.hint}><Text style={s.hintText}>{hint}</Text></View>
      )}
      {/* 손가락 위치를 덮개 기준으로 받으려고 맨 위에 빈 판 하나 */}
      <View ref={plate} style={StyleSheet.absoluteFill} {...touch} accessible accessibilityRole="button" accessibilityLabel={`${title}. ${hint}`} accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={finish} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  hint: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  hintText: { fontSize: 13, fontWeight: '700', color: '#5A4110', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)', overflow: 'hidden' },
});
