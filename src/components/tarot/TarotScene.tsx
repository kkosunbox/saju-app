import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion, useScreenLive } from '../../utils/motion';

const ROOM = require('../../../assets/tarot/reader-room.webp');
const FIGURE = require('../../../assets/tarot/reader-figure.webp');
const ROOM_POSITION = { top: '42%', left: '50%' } as const;
const SCENE_HEIGHT = 270;
const COMPACT_HEIGHT = 172;
const FIGURE_RATIO = 1.5;
const EMBERS = [
  { left: '17%', top: '70%', size: 2 },
  { left: '24%', top: '50%', size: 3 },
  { left: '76%', top: '48%', size: 2 },
  { left: '82%', top: '64%', size: 3 },
  { left: '90%', top: '31%', size: 2 },
] as const;

export default function TarotScene({ recede, onReady }: {
  recede: Animated.Value;
  onReady: () => void;
}) {
  const live = useScreenLive();
  const reduced = useReducedMotion();
  const [breath] = useState(() => new Animated.Value(0));
  const [sceneWidth, setSceneWidth] = useState(0);
  const loaded = useRef(new Set<'room' | 'figure'>());
  const figureWidth = Math.min(sceneWidth, SCENE_HEIGHT * FIGURE_RATIO);
  const figureHeight = figureWidth / FIGURE_RATIO;
  const insetY = (SCENE_HEIGHT - figureHeight) * 0.54;
  const compactWidth = Math.min(sceneWidth, COMPACT_HEIGHT * FIGURE_RATIO);
  const compactFigureHeight = compactWidth / FIGURE_RATIO;
  const compactCenterY = (COMPACT_HEIGHT - compactFigureHeight) * 0.54 + compactFigureHeight / 2;
  const markLoaded = (layer: 'room' | 'figure') => {
    if (loaded.current.has(layer)) return;
    loaded.current.add(layer);
    if (loaded.current.size === 2) onReady();
  };

  useEffect(() => {
    if (reduced || !live) {
      breath.setValue(0);
      return;
    }
    const frame = (toValue: number, duration: number) => Animated.timing(breath, {
      toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false,
    });
    const loop = Animated.loop(Animated.sequence([frame(1, 2800), frame(0, 3400)]));
    loop.start();
    return () => loop.stop();
  }, [breath, live, reduced]);

  return (
    <Animated.View
      style={[s.scene, { height: recede.interpolate({ inputRange: [0, 1], outputRange: [SCENE_HEIGHT, COMPACT_HEIGHT] }) }]}
      pointerEvents="none"
      aria-hidden
    >
      <View style={s.widthMeasure} onLayout={({ nativeEvent }) => setSceneWidth(nativeEvent.layout.width)} />
      <Animated.View style={[StyleSheet.absoluteFill, {
        transform: [
          { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1.025, 1.04] }) },
          { translateX: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
        ],
      }]}>
        <Image source={ROOM} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={ROOM_POSITION} accessible={false} draggable={false} onLoad={() => markLoaded('room')} onError={() => markLoaded('room')} />
      </Animated.View>
      {figureWidth > 0 ? (
        <Animated.View testID="tarot-oracle-figure" style={{
          position: 'absolute',
          left: (sceneWidth - figureWidth) / 2,
          top: insetY,
          width: figureWidth,
          height: figureHeight,
          transform: [
            { translateY: recede.interpolate({ inputRange: [0, 1], outputRange: [0, compactCenterY - insetY - figureHeight / 2] }) },
            { scale: recede.interpolate({ inputRange: [0, 1], outputRange: [1, compactWidth / figureWidth] }) },
          ],
        }}>
          <Image source={FIGURE} style={StyleSheet.absoluteFill} contentFit="fill" accessible={false} draggable={false} onLoad={() => markLoaded('figure')} onError={() => markLoaded('figure')} />
        </Animated.View>
      ) : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: recede.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, {
          opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.27, 0.8] }),
          transform: [{ translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [3, -10] }) }],
        }]}>
          {EMBERS.map(({ left, top, size }) => <View key={left} style={[s.ember, { left, top, width: size, height: size }]} />)}
        </Animated.View>
      </Animated.View>
      <LinearGradient colors={['rgba(20,14,29,0)', 'rgba(20,14,29,0.12)', '#140E1D']} locations={[0, 0.8, 1]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  scene: { overflow: 'hidden', backgroundColor: '#251728' },
  widthMeasure: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  ember: { position: 'absolute', borderRadius: 4, backgroundColor: '#FFD08A', boxShadow: '0 0 10px 2px rgba(255,180,92,0.64)' },
});
