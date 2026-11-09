import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import Card from './Card';
import HScroll from './HScroll';
import { useReducedMotion } from '../utils/motion';
import { colors } from '../theme/colors';
import { txt } from '../theme/typography';

const CARD_W = 240;
const GAP = 12;
const STEP = CARD_W + GAP;
/** 한 장 넘어간 뒤 머무는 시간. 사용자가 직접 넘기면 그때부터 다시 센다 */
const HOLD = 3000;

/**
 * 리뷰 카드 줄 — 몇 초마다 한 장씩 저절로 넘어가고, 손가락(웹은 마우스로 끌기)으로도 넘긴다.
 * 끝이 없게 목록을 세 벌 깔고 가운데 벌에서 시작해, 넘기기 전에 가운데 벌의 같은 자리로 몰래 옮긴다.
 * 동작 줄이기 설정에서는 저절로 넘어가지 않는다.
 */
export default function ReviewCarousel({ reviews, sidePad }: { reviews: readonly string[]; sidePad: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<ScrollViewInstance>(null);
  const loopW = reviews.length * STEP;
  const x = useRef(0);
  const placed = useRef(false);
  const autoUntil = useRef(0);
  const lastMove = useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    x.current = e.nativeEvent.contentOffset.x;
    // 자동으로 넘기는 중이 아닌데 움직였으면 사용자가 넘긴 것
    if (Date.now() > autoUntil.current) lastMove.current = Date.now();
  };

  useEffect(() => {
    if (reduced) return;
    lastMove.current = Date.now();
    const id = setInterval(() => {
      const el = ref.current;
      if (!el || !placed.current || Date.now() - lastMove.current < HOLD) return;
      let from = x.current;
      if (from < loopW || from >= loopW * 2) {
        from = loopW + (((from - loopW) % loopW) + loopW) % loopW;
        autoUntil.current = Date.now() + 100;
        el.scrollTo({ x: from, animated: false });
      }
      autoUntil.current = Date.now() + 900;
      el.scrollTo({ x: (Math.floor(from / STEP + 0.01) + 1) * STEP, animated: true });
      lastMove.current = Date.now();
    }, 250);
    return () => clearInterval(id);
  }, [reduced, loopW]);

  return (
    <HScroll
      scrollRef={ref}
      style={{ marginHorizontal: -sidePad }}
      contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onContentSizeChange={() => {
        if (placed.current) return;
        placed.current = true;
        autoUntil.current = Date.now() + 100;
        ref.current?.scrollTo({ x: loopW, animated: false });
      }}
    >
      {[0, 1, 2].flatMap(n => reviews.map((t, i) => (
        <Card key={`${n}-${i}`} style={s.card}>
          <Text style={s.stars} accessibilityLabel="별점 5점">★★★★★</Text>
          <Text style={s.text}>{t}</Text>
        </Card>
      )))}
    </HScroll>
  );
}

const s = StyleSheet.create({
  card: { width: CARD_W, padding: 16, gap: 8 },
  stars: { fontSize: 13, letterSpacing: 1, color: colors.money },
  text: { ...txt.body, color: colors.ink },
});
