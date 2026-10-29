import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, PlatformColor, StyleSheet, type ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Logo } from './Mascot';
import { useReducedMotion, motion } from '../utils/motion';

/**
 * 네이티브 런치 스크린의 배경색 리소스를 그대로 쓴다(app.json 의 expo-splash-screen backgroundColor #3DB9FE).
 * iOS 런치 스크린은 그 값을 Display P3로 칠해서, 같은 hex를 JS에서 그리면 한 톤 흐려 보인다.
 * Platform.select 는 모든 값을 미리 만들어서 쓰지 않는다 — 웹엔 PlatformColor 가 없다
 */
export const SPLASH_BG: ColorValue = Platform.OS === 'ios'
  ? PlatformColor('SplashScreenBackground')
  : Platform.OS === 'android' ? PlatformColor('@color/splashscreen_background') : '#3DB9FE';
const IMAGE = 220;
/** 들어오는 연출이 끝나고 워드마크를 읽을 만큼 머문 뒤에 걷힌다 */
const HOLD_MS = 350;

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 앱 시작 화면 (네이티브 전용). 라이트·다크와 상관없이 아이콘과 같은 하늘색.
 * 네이티브 런치 스크린과 같은 자리에 같은 그림을 그린 뒤 그걸 내리고 이어받는다:
 * 하늘이 아이콘처럼 아래로 밝아지고, 마스코트가 둥실 뜨고, 워드마크가 올라온다.
 * 부팅이 끝나면 마스코트가 살짝 움츠렸다 커지며 화면 전체가 앞으로 번지듯 걷히고 그 아래 첫 화면이 드러난다.
 * 동작 줄이기에선 흔들림 없이 서서히 사라진다.
 */
export default function LaunchSplash({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const [sky] = useState(() => new Animated.Value(0));
  const [float] = useState(() => new Animated.Value(0));
  const [word] = useState(() => new Animated.Value(0));
  const [zoom] = useState(() => new Animated.Value(1));
  const [fade] = useState(() => new Animated.Value(1));
  // 시작 직후엔 JS가 첫 화면을 그리느라 바빠 연출이 늦게 시작되기도 해서, 시각이 아니라 연출이 끝났는지로 기다린다
  const [introDone, setIntroDone] = useState(false);
  const hidden = useRef(false);

  // 마스코트 그림까지 그려진 뒤에 네이티브 화면을 내린다 — 먼저 내리면 빈 하늘이 한 프레임 비친다
  const handOff = () => {
    if (hidden.current) return;
    hidden.current = true;
    SplashScreen.hide();
    if (reduced) { sky.setValue(1); word.setValue(1); setIntroDone(true); return; }
    Animated.parallel([
      Animated.timing(sky, { toValue: 1, duration: 700, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(word, { toValue: 1, duration: 520, delay: 160, easing: motion.easeOut, useNativeDriver: true }),
    ]).start(() => setIntroDone(true));
  };
  useEffect(() => {
    const t = setTimeout(handOff, 800); // 그림 로드 이벤트를 놓쳐도 갇히지 않게
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduced || ready) return;
    const a = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -8, duration: 1200, easing: motion.easeInOut, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1200, easing: motion.easeInOut, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [reduced, ready, float]);

  useEffect(() => {
    if (!ready || !introDone) return;
    let exit: Animated.CompositeAnimation | null = null;
    const t = setTimeout(() => {
      exit = reduced
        ? Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true })
        : Animated.parallel([
          Animated.timing(float, { toValue: 0, duration: 200, easing: motion.easeOut, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(zoom, { toValue: 0.9, duration: 150, easing: motion.easeOut, useNativeDriver: true }),
            Animated.timing(zoom, { toValue: 1.4, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.timing(word, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(fade, { toValue: 0, duration: 360, delay: 160, easing: motion.easeInOut, useNativeDriver: true }),
        ]);
      exit.start(({ finished }) => finished && setGone(true));
    }, HOLD_MS);
    return () => { clearTimeout(t); exit?.stop(); };
  }, [ready, introDone]);

  if (gone) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }] }]} pointerEvents={ready ? 'none' : 'auto'}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sky }]}>
        <LinearGradient colors={['#15ABFE', '#3DB9FE', '#9ADAFF']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: float }, { scale: zoom }] }}>
        <Image source={require('../../assets/splash-icon.png')} style={s.image} resizeMode="contain" onLoadEnd={handOff} />
      </Animated.View>
      <Animated.View style={[s.word, { opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <Logo height={60} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_BG, zIndex: 100 },
  image: { width: IMAGE, height: IMAGE },
  // 마스코트(그림 아래쪽 1/4은 여백) 바로 아래
  word: { position: 'absolute', top: '50%', marginTop: IMAGE / 2 - 30 },
});
