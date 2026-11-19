/**
 * AI 답이 쓰이는 것처럼 — 안의 글과 덩어리가 화면 순서대로 주르륵 나타난다.
 * <Stream active> 안의 StreamText는 한 글자씩, StreamBlock(카드·버튼 등)은 차례가 오면 나타난다.
 * 한 개의 커서가 앞에서부터 나아가고, 각 조각은 처음 그려질 때(화면 순서) 자기 자리를 받는다.
 * active가 아니거나(지난 대화를 다시 열 때) 움직임 줄이기를 켜 두면 처음부터 다 보인다.
 */
import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, StyleProp, Text, TextProps, TextStyle, ViewStyle } from 'react-native';
import { useReducedMotion } from '../utils/motion';

class Store {
  /** 지금까지 나아간 커서 (글자 단위) */
  budget: number;
  /** 다음 조각이 받을 자리 */
  next = 0;
  listeners = new Set<() => void>();
  constructor(live: boolean) { this.budget = live ? 0 : Infinity; }
  get live() { return this.budget !== Infinity; }
  /** 화면 순서대로 자리를 받는다 — 다 쓴 뒤 생긴 조각은 바로 보인다 */
  register(len: number) {
    if (!this.live) return 0;
    const at = this.next;
    this.next += len;
    return at;
  }
  advance(chars: number) {
    this.budget += chars;
    const finished = this.budget >= this.next;
    if (finished) this.budget = Infinity;
    this.listeners.forEach(f => f());
    return finished;
  }
  subscribe = (f: () => void) => { this.listeners.add(f); return () => { this.listeners.delete(f); }; };
}

const Ctx = createContext<Store | null>(null);
/** 초당 글자 수 — 너무 느리면 긴 답이 지루하다 */
const CHARS_PER_SEC = 140;
/** 덩어리 하나가 차지하는 쉼 (글자 수로) */
const BLOCK_PAUSE = 14;
/** 글 하나가 끝나고 다음으로 넘어가기 전 쉼 */
const TEXT_PAUSE = 6;


const noop = () => () => {};

export function Stream({ active, children, onDone }: { active: boolean; children: React.ReactNode; onDone?: () => void }) {
  const reduced = useReducedMotion();
  // 처음 그릴 때만 본다 — 다 쓴 뒤 다시 그려도 다시 쓰지 않는다
  const [store] = useState(() => new Store(active && !reduced));
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!store.live) return;
    let last = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const finished = store.advance(((now - last) * CHARS_PER_SEC) / 1000);
      last = now;
      if (finished) { clearInterval(t); done.current?.(); }
    }, 33);
    return () => clearInterval(t);
  }, [store]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

/** 자리를 받고, 커서가 그 자리에서 얼마나 나아갔는지 (0 ~ len) */
function useProgress(len: number) {
  const store = useContext(Ctx);
  const [at] = useState(() => store?.register(len) ?? 0);
  const subscribe = store ? store.subscribe : noop;
  const get = () => (store ? Math.max(0, Math.min(len, Math.floor(store.budget - at))) : len);
  return useSyncExternalStore(subscribe, get, get);
}

/** 한 글자씩 써지는 글 — Stream 밖에서는 보통 Text */
export function StreamText({ children, ...rest }: Omit<TextProps, 'children'> & { children: string; style?: StyleProp<TextStyle> }) {
  const shown = useProgress(children.length + TEXT_PAUSE);
  if (shown <= 0) return null;
  return <Text {...rest}>{shown >= children.length ? children : children.slice(0, shown)}</Text>;
}

/** 차례가 오면 살짝 떠오르며 나타나는 덩어리 (안의 StreamText는 그 뒤로 이어서 써진다) */
export function StreamBlock({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const shown = useProgress(BLOCK_PAUSE) > 0;
  const [a] = useState(() => new Animated.Value(0));
  const store = useContext(Ctx);
  const [instant] = useState(() => !store?.live);
  useEffect(() => {
    if (shown && !instant) Animated.timing(a, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [shown, instant, a]);
  if (!shown) {
    // 안의 글도 지금 자리를 받아야 순서가 맞는다 — 보이지 않게 그려 둔다
    return <Animated.View style={[style, { display: 'none' }]}>{children}</Animated.View>;
  }
  if (instant) return <Animated.View style={style}>{children}</Animated.View>;
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}
