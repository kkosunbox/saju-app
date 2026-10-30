import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, PlatformColor, StyleSheet, type ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Logo, LogoBubble, LOGO_FACE } from './Mascot';
import { useReducedMotion, motion } from '../utils/motion';

/**
 * 네이티브 런치 스크린의 배경색 리소스를 그대로 쓴다(app.json 의 expo-splash-screen backgroundColor #3DB9FE).
 * iOS 런치 스크린은 그 값을 Display P3로 칠해서, 같은 hex를 JS에서 그리면 한 톤 흐려 보인다.
 * Platform.select 는 모든 값을 미리 만들어서 쓰지 않는다 — 웹엔 PlatformColor 가 없다
 */
export const SPLASH_BG: ColorValue = Platform.OS === 'ios'
  ? PlatformColor('SplashScreenBackground')
  : Platform.OS === 'android' ? PlatformColor('@color/splashscreen_background') : '#3DB9FE';
/** 런치 스크린 그림 크기 (app.json imageWidth) */
const IMAGE = 220;
/** 워드마크 배율 — 상자 65×55 의 K배 */
const K = 2.2;
/** 첫 화면이 그려진 뒤(그동안 워드마크가 보인다) 이만큼 더 머물렀다 걷힌다 */
const HOLD_MS = 200;

// 마스코트가 날아가 앉을 자리. 워드마크는 레터링+말풍선(상자 y 0~36, x 1~65)의 가운데가 화면 가운데에 오게 놓는다
const LOGO_CX = 33;
const LOGO_CY = 18;
/**
 * 그림에서 마스코트가 실제로 칠해진 부분 (assets/splash-icon.png 1200², assets/images/mascot.png 360×332).
 * 런치 스크린 그림은 워드마크 속 마스코트(mascot.png)를 키워 만든 것이라, 말풍선에 앉으면 실제 로고와 크기·모양이 같다
 */
const SPLASH_ART = { x: 317, y: 331, w: 614, h: 542, size: 1200 };
const FACE_ART = { x: 0, y: 30, w: 343, h: 302, iw: 360, ih: 332 };
const FLY = (() => {
  const fs = Math.min((LOGO_FACE.width * K) / FACE_ART.iw, (LOGO_FACE.height * K) / FACE_ART.ih);
  const faceX = LOGO_FACE.left * K + (LOGO_FACE.width * K - FACE_ART.iw * fs) / 2 + (FACE_ART.x + FACE_ART.w / 2) * fs;
  const faceY = LOGO_FACE.top * K + (LOGO_FACE.height * K - FACE_ART.ih * fs) / 2 + (FACE_ART.y + FACE_ART.h / 2) * fs;
  const px = IMAGE / SPLASH_ART.size;
  const ox = (SPLASH_ART.x + SPLASH_ART.w / 2 - SPLASH_ART.size / 2) * px;
  const oy = (SPLASH_ART.y + SPLASH_ART.h / 2 - SPLASH_ART.size / 2) * px;
  const scale = (FACE_ART.w * fs) / (SPLASH_ART.w * px);
  return { x: faceX - LOGO_CX * K - ox * scale, y: faceY - LOGO_CY * K - oy * scale, scale };
})();
/** 말풍선이 부풀어 오르는 기준점 (상자 안 말풍선 가운데) */
const BUBBLE_ORIGIN = `${(54 / 65) * 100}% ${(10 / 55) * 100}%`;

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * 앱 시작 화면 (네이티브 전용). 라이트·다크와 상관없이 아이콘과 같은 하늘색.
 * 네이티브 런치 스크린과 같은 자리에 같은 그림을 그린 뒤 그걸 내리고 이어받는다:
 * 하늘이 아이콘처럼 아래로 밝아지는 동안 워드마크가 떠오르고, 가운데 마스코트가 움찔했다가
 * 곧장 날아가며 작아져 워드마크의 말풍선 안으로 쏙 들어가 앉는다 — 마스코트가 둘 보이지 않게 로고가 마스코트를 받는다.
 * 말풍선에 닿기 전에 로고 속 크기가 되어 그대로 앉고, 앉은 뒤엔 튕기거나 크기가 바뀌지 않는다.
 * 부팅이 끝나면 화면 전체가 앞으로 번지듯 걷히고 그 아래 첫 화면이 드러난다.
 * 동작 줄이기에선 처음부터 완성된 워드마크를 보여 주고 서서히 사라진다.
 */
export default function LaunchSplash({ ready, settled, onIntroDone }: { ready: boolean; settled: boolean; onIntroDone(): void }) {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const [sky] = useState(() => new Animated.Value(0));
  const [squash] = useState(() => new Animated.Value(1)); // 뛰기 전 움찔
  const [fly] = useState(() => new Animated.Value(0)); // 0 가운데 → 1 말풍선 안
  const [word] = useState(() => new Animated.Value(0));
  const [bubble] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [handedOff, setHandedOff] = useState(false);
  // 시작 직후엔 JS가 첫 화면을 그리느라 바빠 연출이 늦게 시작되기도 해서, 시각이 아니라 연출이 끝났는지로 기다린다
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => { if (introDone) onIntroDone(); }, [introDone]);
  const hidden = useRef(false);

  // 마스코트 그림까지 그려진 뒤에 네이티브 화면을 내린다 — 먼저 내리면 빈 하늘이 한 프레임 비친다
  const handOff = () => {
    if (hidden.current) return;
    hidden.current = true;
    SplashScreen.hide();
    if (reduced) {
      [sky, fly, word, bubble].forEach(v => v.setValue(1));
      setIntroDone(true);
      return;
    }
    Animated.timing(sky, { toValue: 1, duration: 700, easing: motion.easeInOut, useNativeDriver: true }).start();
    setHandedOff(true);
  };
  useEffect(() => {
    const t = setTimeout(handOff, 800); // 그림 로드 이벤트를 놓쳐도 갇히지 않게
    return () => clearTimeout(t);
  }, []);

  // 마스코트는 글꼴 등록이 끝나 앱이 한숨 돌린 뒤에 뛴다 — 시작 직후엔 메인 스레드가 잠깐씩 멈춰 비행이 끊기거나 통째로 건너뛰어진다.
  // 글꼴이 늦어도 오래 세워 두지 않는다
  const [hopReady, setHopReady] = useState(false);
  useEffect(() => {
    if (!handedOff) return;
    const t = setTimeout(() => setHopReady(true), settled ? 150 : 1200);
    return () => clearTimeout(t);
  }, [handedOff, settled]);
  useEffect(() => {
    if (!hopReady) return;
    const t = (v: Animated.Value, toValue: number, duration: number, easing = motion.easeInOut) =>
      Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });
    const hop = Animated.parallel([
      // 레터링은 화면 가운데(마스코트 뒤)에 있으니 마스코트가 떠난 뒤에 떠오른다
      Animated.sequence([Animated.delay(560), t(word, 1, 460, motion.easeOut)]),
      Animated.sequence([
        t(squash, 0.86, 150, motion.easeOut),
        Animated.parallel([
          t(squash, 1, 240, motion.easeOut),
          t(fly, 1, 720, Easing.inOut(Easing.cubic)),
          // 마스코트가 도착하기 직전에 말풍선이 넘치지 않게 열린다
          Animated.sequence([Animated.delay(250), t(bubble, 1, 280, Easing.out(Easing.cubic))]),
        ]),
      ]),
    ]);
    hop.start(() => setIntroDone(true));
    return () => hop.stop();
  }, [hopReady]);

  useEffect(() => {
    if (!ready || !introDone) return;
    let exit: Animated.CompositeAnimation | null = null;
    const t = setTimeout(() => {
      exit = Animated.timing(fade, { toValue: 0, duration: reduced ? 260 : 380, easing: motion.easeInOut, useNativeDriver: true });
      exit.start(({ finished }) => finished && setGone(true));
    }, reduced ? 0 : HOLD_MS);
    return () => { clearTimeout(t); exit?.stop(); };
  }, [ready, introDone]);

  if (gone) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) }] }]} pointerEvents={ready ? 'none' : 'auto'}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: sky }]}>
        <LinearGradient colors={['#15ABFE', '#3DB9FE', '#9ADAFF']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={s.logo}>
        {/* 떠오르는 건 레터링만 — 말풍선·얼굴까지 같이 반투명하면 내려앉는 마스코트가 비쳐 보인다 */}
        <Animated.View style={{ opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Logo height={55 * K} color="#FFFFFF" face={false} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: BUBBLE_ORIGIN, opacity: bubble.interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>
          <LogoBubble height={55 * K} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={{
          transform: [
            { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [0, FLY.x] }) },
            // 말풍선까지 곧장 날아간다
            { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, FLY.y] }) },
            // 말풍선에 닿기 전에 로고 속 크기가 된다 — 큰 채로 내려앉으면 말풍선 밖으로 삐져나온다
            { scale: fly.interpolate({ inputRange: [0, 0.5, 0.8, 1], outputRange: [1, FLY.scale * 1.8, FLY.scale, FLY.scale] }) },
            { scaleX: squash.interpolate({ inputRange: [0.86, 1], outputRange: [1.08, 1] }) },
            { scaleY: squash },
          ],
        }}
      >
        <Image source={require('../../assets/splash-icon.png')} style={s.image} resizeMode="contain" onLoadEnd={handOff} />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_BG, zIndex: 100 },
  image: { width: IMAGE, height: IMAGE },
  logo: { position: 'absolute', left: '50%', top: '50%', marginLeft: -LOGO_CX * K, marginTop: -LOGO_CY * K, width: 65 * K, height: 55 * K },
});
