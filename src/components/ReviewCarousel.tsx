import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import Card from './Card';
import HScroll from './HScroll';
import { useReducedMotion } from '../utils/motion';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

const CARD_W = 240;
const GAP = 12;
const STEP = CARD_W + GAP;
/** 흐르는 속도 (px/초) — 글을 읽을 수 있을 만큼 천천히 */
const SPEED = 28;
/** 사용자가 직접 넘긴 뒤 다시 흐르기까지 기다리는 시간 */
const RESUME = 2000;
/** txt.body 줄 높이 */
const LINE = 21;

/**
 * 리뷰 카드 줄 — 멈추지 않고 왼쪽으로 천천히 흐르고, 손가락(웹은 마우스로 끌기)으로도 넘긴다.
 * 넘기면 잠시 멈췄다가 그 자리에서 다시 흐른다.
 * 끝이 없게 목록을 세 벌 깔고 가운데 벌 안에서만 흐르다가, 끝에 닿으면 같은 그림의 앞자리로 몰래 옮긴다.
 * 동작 줄이기 설정에서는 흐르지 않는다.
 */
/** lines: 리뷰 글을 이 줄 수로 자르고 모든 카드를 같은 높이로 맞춘다 */
export default function ReviewCarousel({ reviews, sidePad, lines }: { reviews: readonly string[]; sidePad: number; lines?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<ScrollViewInstance>(null);
  const loopW = reviews.length * STEP;
  /** 흐름이 기억하는 위치 (소수까지) */
  const pos = useRef(0);
  const placed = useRef(false);
  const lastTouch = useRef(0);

  const go = (x: number) => {
    pos.current = x;
    ref.current?.scrollTo({ x, animated: false });
  };

  // 사용자가 잡고 있거나 방금 놓아 관성으로 움직이는 동안은 흐름을 멈추고 그 자리를 따른다
  const touched = () => Date.now() - lastTouch.current < RESUME;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!touched()) return;
    pos.current = e.nativeEvent.contentOffset.x;
    lastTouch.current = Date.now();
  };
  const touch = () => { lastTouch.current = Date.now(); };

  // 웹: 손가락 · 마우스 · 휠로 건드린 순간을 직접 듣는다
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = (ref.current as unknown as { getScrollableNode?(): HTMLElement } | null)?.getScrollableNode?.();
    if (!el) return;
    const evs = ['pointerdown', 'touchstart', 'wheel'] as const;
    evs.forEach(ev => el.addEventListener(ev, touch, { passive: true }));
    return () => evs.forEach(ev => el.removeEventListener(ev, touch));
  }, []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let prev = 0;
    const tick = (now: number) => {
      const dt = prev ? Math.min(now - prev, 64) : 0;
      prev = now;
      if (placed.current && !touched()) {
        let x = pos.current + (SPEED * dt) / 1000;
        if (x >= loopW * 2) x -= loopW;
        else if (x < loopW) x += loopW;
        go(x);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, loopW]);

  return (
    <HScroll
      scrollRef={ref}
      style={{ marginHorizontal: -sidePad }}
      contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}
      onScroll={onScroll}
      onScrollBeginDrag={touch}
      scrollEventThrottle={16}
      onContentSizeChange={() => {
        if (placed.current) return;
        placed.current = true;
        go(loopW);
      }}
    >
      {[0, 1, 2].flatMap(n => reviews.map((t, i) => (
        <Card key={`${n}-${i}`} style={s.card}>
          <Text style={s.stars} accessibilityLabel="별점 5점">★★★★★</Text>
          <Text style={[s.text, lines ? { height: lines * LINE } : null]} numberOfLines={lines}>{t}</Text>
        </Card>
      )))}
    </HScroll>
  );
}

const s = StyleSheet.create({
  card: { width: CARD_W, padding: 16, gap: 8 },
  stars: { fontSize: 13, letterSpacing: 1, color: colors.money },
  text: { ...txt.body, lineHeight: LINE, color: colors.ink },
});
