import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Mascot from './Mascot';
import MascotPolish from './MascotPolish';
import { AnimatedCircle } from './ScoreRing';
import { colors, isDark } from '../theme/colors';
import { useReducedMotion, motion } from '../utils/motion';
import { haptic } from '../utils/haptic';
import { useMascotPlay } from './useMascotPlay';

const SIZE = 103;
const RING = 136;
const R = RING / 2 - 4;
const C = 2 * Math.PI * R;
const HOLD_MS = 900;
const HINT_H = 36; // 안내 알약 + 위 여백

/**
 * 홈의 말풍선 아래 마스코트. 평소엔 둥실 떠 있고,
 * sealed 이면 꾹 누르는 동안 둘레 링이 차오르며 젤리처럼 눌리고, 다 차면 튀어 올라 onDrawn.
 * busy 이면(풀이를 기다리는 중) 천으로 닦고 광을 낸다.
 * 풀이 완료 뒤엔 누를 때마다 마스코트가 튕기고 은은한 후광이 퍼진다.
 * 동작 줄이기·스크린리더에선 한 번 누르면 바로 뽑힌다.
 */
export default function DrawMascot({ sealed, busy = false, luckyColor = colors.success, onDrawn }: { sealed: boolean; busy?: boolean; luckyColor?: string; onDrawn(): void }) {
  const reduced = useReducedMotion();
  const playful = !sealed && !busy;
  const play = useMascotPlay(playful, reduced, luckyColor);
  const [y] = useState(() => new Animated.Value(0));
  const [p] = useState(() => new Animated.Value(0)); // 누른 정도 0..1
  const [jump] = useState(() => new Animated.Value(0)); // 튀어 오름 0..1..0
  const [holding, setHolding] = useState(false);
  // 안내 자리: 뽑고 나면 서서히 접혀 아래 화면이 살짝 올라온다 (이미 뽑은 날엔 처음부터 접힌 채)
  const showHint = sealed || busy;
  const [hintO] = useState(() => new Animated.Value(showHint ? 1 : 0));
  useEffect(() => {
    Animated.timing(hintO, { toValue: showHint ? 1 : 0, duration: reduced ? 0 : 420, delay: showHint || reduced ? 0 : 350, easing: motion.easeInOut, useNativeDriver: false }).start();
  }, [showHint, reduced, hintO]);
  const done = useRef(false);
  const ticks = useRef(0);
  useEffect(() => { if (sealed) done.current = false; }, [sealed]); // 뽑은 기록을 지우면 다시 뽑을 수 있게

  useEffect(() => {
    if (reduced || busy) { y.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -6, duration: 1400, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced, busy, y]);

  // 차오르는 동안 네 번 똑딱
  useEffect(() => {
    const id = p.addListener(({ value }) => {
      const n = Math.floor(value * 4);
      if (n > ticks.current && n < 4) haptic.tick();
      ticks.current = n;
    });
    return () => p.removeListener(id);
  }, [p]);

  const burst = () => {
    if (done.current) return;
    done.current = true;
    setHolding(false);
    haptic.pop();
    onDrawn();
    if (reduced) return;
    jump.setValue(0);
    Animated.sequence([
      Animated.timing(jump, { toValue: 1, duration: 180, easing: motion.easeOut, useNativeDriver: false }),
      Animated.spring(jump, { toValue: 0, speed: 14, bounciness: 14, useNativeDriver: false }),
    ]).start();
    Animated.timing(p, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const pressIn = () => {
    if (!sealed || reduced) return;
    setHolding(true);
    p.stopAnimation(v => {
      Animated.timing(p, { toValue: 1, duration: HOLD_MS * (1 - v), useNativeDriver: false }).start(({ finished }) => { if (finished) burst(); });
    });
  };
  const pressOut = () => {
    if (!sealed || done.current || reduced) return;
    setHolding(false);
    p.stopAnimation();
    Animated.timing(p, { toValue: 0, duration: 260, easing: motion.easeOut, useNativeDriver: false }).start();
  };

  // 눌리는 동안 납작해지고, 튀어 오를 땐 길쭉해졌다 돌아온다
  const scaleX = Animated.add(p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }), jump.interpolate({ inputRange: [0, 1], outputRange: [0, -0.08] }));
  const scaleY = Animated.add(p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] }), jump.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }));
  const lift = jump.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const dash = p.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });

  const body = (
    <Animated.View style={{ transform: [{ translateY: lift }, { scaleX }, { scaleY }] }}>
      <Animated.View style={play.style}>
        <MascotPolish busy={busy} reduced={reduced} size={SIZE}>
          <Mascot size={SIZE} />
        </MascotPolish>
      </Animated.View>
    </Animated.View>
  );

  return (
    <Animated.View style={[s.wrap, { transform: [{ translateY: y }] }]}>
      {/*
        뽑기 전후로 같은 Pressable을 그대로 둔다. 마스코트를 다시 그리면 옛 뷰가 떨어지는 순간
        Animated 값에 붙은 뷰가 없어져 진행 중이던 애니메이션이 멈추고, 눌린 모양(납작) 그대로 굳는다.
      */}
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={playful ? play.play : sealed && reduced ? burst : undefined}
        disabled={busy}
        // 역할은 늘 button — 웹은 역할에 따라 태그(<button>/<div>)가 바뀌어, 바꾸면 안쪽이 다시 그려진다
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        accessibilityLabel={sealed ? '오늘의 운세 뽑기' : busy ? '오늘의 운세를 준비하는 마스코트' : '행운을 모으는 마스코트'}
        accessibilityHint={sealed ? '마스코트를 꾹 누르면 오늘의 운세가 나와요' : playful ? '누르면 마스코트가 튕기고 은은한 빛이 퍼져요' : undefined}
        accessibilityActions={sealed ? [{ name: 'activate' }] : undefined}
        onAccessibilityAction={sealed ? burst : undefined}
        style={s.hit}
      >
        {sealed ? (
          <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={RING} height={RING} pointerEvents="none">
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={isDark ? colors.white : colors.accent} strokeOpacity={isDark ? 0.55 : 0.45} strokeWidth={4} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
            <AnimatedCircle
              cx={RING / 2} cy={RING / 2} r={R}
              stroke={colors.accent} strokeWidth={5} fill="none" strokeLinecap="round"
              strokeDasharray={`${C} ${C}`} strokeDashoffset={dash}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
          </Animated.View>
        ) : null}
        {play.aura}
        {body}
      </Pressable>
      <Animated.View style={[s.hintSlot, { height: hintO.interpolate({ inputRange: [0, 1], outputRange: [0, HINT_H] }) }]} pointerEvents="none" importantForAccessibility={showHint ? 'auto' : 'no-hide-descendants'} accessibilityElementsHidden={!showHint}>
        <Animated.View style={[s.hint, { opacity: hintO }]}>
          <Text style={s.hintText}>{busy ? '행운을 반짝반짝 닦는 중…' : !sealed ? '반짝! 오늘의 운세 준비 완료' : reduced ? '눌러서 뽑기' : holding ? '조금만 더…' : '꾹 눌러서 뽑기'}</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  // 뽑은 뒤(안내 접힘) 말풍선 ↔ 마스코트 ↔ 점수 링 여백이 같게
  wrap: { alignSelf: 'center', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  hit: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  hintSlot: { overflow: 'hidden', alignItems: 'center' },
  hint: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.navy },
  hintText: { fontSize: 12, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
