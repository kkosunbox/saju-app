import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { useReducedMotion } from '../utils/motion';

interface Props { title: string; messages?: string[]; variant?: 'night' | 'light' }

/**
 * 신비롭지만 조용한 로딩: 천천히 숨 쉬는 달빛 + 느리게 도는 네 개의 점(4가지 관점) + 교차 페이드 문구.
 * 빠른 회전·번쩍임 없이 8초 주기의 느린 움직임만 사용.
 */
export default function MoonLoader({ title, messages = [], variant = 'night' }: Props) {
  const reduced = useReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [i, setI] = useState(0);
  const dark = variant === 'night';

  useEffect(() => {
    if (reduced) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const b = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true }));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [reduced]);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setI(v => (v + 1) % messages.length);
        Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, 1400);
    return () => clearInterval(t);
  }, [messages.length]);

  const glowScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.34] });
  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const bgCut = dark ? '#261954' : colors.cream;

  const body = (
    <View style={s.center}>
      <View style={s.stage}>
        <Animated.View style={[s.glow, { backgroundColor: colors.moon, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
        <Animated.View style={[s.orbit, { borderColor: dark ? 'rgba(255,255,255,0.12)' : colors.line, transform: [{ rotate }] }]}>
          {['#8E7FD0', '#E0A458', '#5BB8B4', '#E07A88'].map((c, k) => (
            <View key={c} style={[s.orb, { backgroundColor: c }, [{ top: -4, left: 76 }, { right: -4, top: 76 }, { bottom: -4, left: 76 }, { left: -4, top: 76 }][k]]} />
          ))}
        </Animated.View>
        <View style={s.moon}>
          <View style={[s.cut, { backgroundColor: bgCut }]} />
        </View>
      </View>
      <Text style={[s.title, { color: dark ? colors.white : colors.ink }]}>{title}</Text>
      {messages.length ? (
        <Animated.Text style={[s.msg, { opacity: fade, color: dark ? 'rgba(255,255,255,0.6)' : colors.inkMute }]}>{messages[i]}</Animated.Text>
      ) : null}
    </View>
  );

  return dark ? (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>{body}</LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>{body}</View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stage: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  orbit: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1 },
  orb: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  moon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.moon, overflow: 'hidden' },
  cut: { position: 'absolute', width: 72, height: 72, borderRadius: 36, left: 24, top: -10 },
  title: { fontSize: 19, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center', marginTop: 36 },
  msg: { fontSize: 13, marginTop: 10, textAlign: 'center' },
});
