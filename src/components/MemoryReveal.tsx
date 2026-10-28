import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Mascot from './Mascot';
import PrimaryButton from './PrimaryButton';
import { haptic } from '../utils/haptic';
import { motion, useReducedMotion } from '../utils/motion';
import { radius, sansW } from '../theme/typography';

const STEPS = ['기억을 거슬러 올라가는 중', '시대의 흔적을 찾는 중', '그때의 이름을 읽는 중'];
const STEP_MS = 520;
const HOLD_MS = 1500;
const SPARKS = 10;

/**
 * 전생 기록 열기 — 버튼 한 번이면 빛이 모였다가 터지며 시대와 신분이 드러난다.
 * 잠깐 보여 준 뒤 onDone. 결과 히어로와 같은 배경이라 그대로 이어진다.
 */
export default function MemoryReveal({ nickname, era, role, line, onDone }: { nickname: string; era: string; role: string; line: string; onDone(): void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'opening' | 'shown'>('idle');
  const [step, setStep] = useState(0);
  const breath = useRef(new Animated.Value(0)).current;
  const charge = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const show = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: 1600, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: 1600, easing: motion.easeInOut, useNativeDriver: true }),
    ]));
    if (!reduced) loop.start();
    return () => { loop.stop(); timers.current.forEach(clearTimeout); };
  }, [reduced]);

  const later = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };

  const open = () => {
    if (phase !== 'idle') return;
    if (reduced) { haptic.done(); onDone(); return; }
    setPhase('opening');
    haptic.tap();
    const charging = STEP_MS * STEPS.length;
    STEPS.forEach((_, i) => i && later(STEP_MS * i, () => { setStep(i); haptic.tick(); }));
    Animated.timing(charge, { toValue: 1, duration: charging, easing: motion.easeInOut, useNativeDriver: true }).start();
    later(charging, () => {
      setPhase('shown');
      haptic.pop();
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 520, easing: motion.easeOut, useNativeDriver: true }),
        ]),
        Animated.timing(burst, { toValue: 1, duration: 900, easing: motion.easeOut, useNativeDriver: true }),
        Animated.timing(show, { toValue: 1, duration: 1100, easing: motion.easeOut, useNativeDriver: true }),
      ]).start();
      later(HOLD_MS + 600, () => { haptic.done(); onDone(); });
    });
  };

  const opening = phase === 'opening';
  const shown = phase === 'shown';
  // 빛무리: 평소엔 숨 쉬듯, 열 때는 점점 커지고 밝아졌다가 터지면 사라진다
  const haloScale = Animated.add(
    breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] }),
    Animated.add(charge.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }), burst.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] })),
  );
  const haloOpacity = Animated.multiply(
    Animated.add(breath.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.22] }), charge.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] })),
    burst.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
  );
  // 터지는 순간 퍼져 나가는 고리
  const ring = { opacity: burst.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.9, 0] }), transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.8] }) }] };
  const mascotOpacity = charge.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const mascotScale = Animated.add(charge.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] }), burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.06, -0.08] }));
  const shake = charge.interpolate({ inputRange: [0, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1], outputRange: [0, 0, -1.5, 1.5, -2, 2, -1, 0] });
  const fadeIn = (from: number, to: number) => show.interpolate({ inputRange: [0, from, to, 1], outputRange: [0, 0, 1, 1] });
  const rise = (from: number, to: number) => show.interpolate({ inputRange: [0, from, to, 1], outputRange: [10, 10, 0, 0] });

  return (
    <View>
      <View style={s.card}>
        <Image source={require('../../assets/figma/past-life/hero.webp')} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <Animated.View style={[StyleSheet.absoluteFill, s.dim, { opacity: show.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }]} />

        <View style={s.stage}>
          <Animated.View style={[s.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
          <Animated.View style={[s.ring, ring]} />
          {shown ? Array.from({ length: SPARKS }, (_, i) => {
            const a = (i / SPARKS) * Math.PI * 2 + 0.3;
            const d = 70 + (i % 3) * 22;
            return (
              <Animated.View key={i} style={[s.spark, {
                opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * d] }) },
                  { scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.4] }) },
                ],
              }]} />
            );
          }) : null}
          <Animated.View style={{ opacity: mascotOpacity, transform: [{ translateX: shake }, { scale: mascotScale }] }}>
            <Mascot name="pastLife" size={71} />
          </Animated.View>
        </View>

        <Text style={s.eyebrow}>{nickname}님의 오래전 이야기</Text>
        {shown ? (
          <View style={s.copy}>
            <Animated.Text style={[s.era, { opacity: fadeIn(0.05, 0.35), transform: [{ translateY: rise(0.05, 0.35) }] }]}>{era}</Animated.Text>
            <Animated.Text accessibilityRole="header" style={[s.name, { opacity: fadeIn(0.15, 0.5), transform: [{ scale: show.interpolate({ inputRange: [0, 0.15, 0.55, 1], outputRange: [1.25, 1.25, 1, 1] }) }] }]}>{role}</Animated.Text>
            <Animated.Text style={[s.line, { opacity: fadeIn(0.45, 0.85), transform: [{ translateY: rise(0.45, 0.85) }] }]}>{line}</Animated.Text>
          </View>
        ) : (
          <View style={s.copy}>
            <Text style={s.sealed}>{opening ? STEPS[step] : '봉인된 기록'}</Text>
            <Text style={s.mystery}>{opening ? '· · ·' : '어느 시대의, 누군가'}</Text>
          </View>
        )}

        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.flash, { opacity: flash }]} />
      </View>

      <View style={s.action}>
        {phase === 'idle' ? <PrimaryButton label="전생 기록 열기 →" onPress={open} /> : null}
      </View>
    </View>
  );
}

const GOLD = '#FFF386';
const s = StyleSheet.create({
  card: { height: 320, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', paddingTop: 36, paddingHorizontal: 16, backgroundColor: '#141A3A' },
  dim: { backgroundColor: 'rgba(8, 10, 28, 0.55)' },
  stage: { width: 180, height: 120, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.9, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  ring: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 1.5, borderColor: GOLD },
  spark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  eyebrow: { ...sansW('400'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: '#DDDDDD', marginTop: 4, textAlign: 'center' },
  copy: { alignItems: 'center', marginTop: 8 },
  sealed: { ...sansW('600'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: GOLD, textAlign: 'center' },
  mystery: { ...sansW('700'), fontSize: 22, lineHeight: 30, letterSpacing: -1, color: 'rgba(255,255,255,0.45)', marginTop: 8, textAlign: 'center' },
  era: { ...sansW('700'), fontSize: 13, lineHeight: 18, letterSpacing: -0.65, color: GOLD, textAlign: 'center' },
  name: { ...sansW('700'), fontSize: 24, lineHeight: 30, letterSpacing: -1.2, color: '#FFFFFF', marginTop: 6, textAlign: 'center' },
  line: { ...sansW('500'), fontSize: 13, lineHeight: 19, letterSpacing: -0.65, color: '#FFFFFF', marginTop: 8, textAlign: 'center' },
  flash: { backgroundColor: '#FFF8D6' },
  action: { height: 52, marginTop: 16 },
});
