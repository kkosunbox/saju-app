import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import CharacterArt from './CharacterArt';
import { characterScene, CHARACTER_SCENE_HEIGHT } from '../data/characterScene';

// Generated plates contain scenery only. Character artwork remains a separate, unchanged layer.
const BACKGROUNDS = {
  wood: require('../../assets/images/character-worlds/wood-clearing.webp'),
  fire: require('../../assets/images/character-worlds/fire-dawn.webp'),
  earth: require('../../assets/images/character-worlds/earth-dunes.webp'),
  metal: require('../../assets/images/character-worlds/metal-garden.webp'),
  water: require('../../assets/images/character-worlds/water-shore.webp'),
};
type Props = { hanja?: string; name?: string; size: number };

/** 배경의 바닥선에 발을 맞춘다. 배경 이미지 파일에는 캐릭터를 합성하지 않는다. */
export default function CharacterScene({ hanja, name, size, style }: Props & { style?: StyleProp<ViewStyle> }) {
  const shadowId = `contact-${useId().replace(/:/g, '')}`;
  const scene = characterScene(hanja, name);
  if (!scene) return null;
  const height = size * CHARACTER_SCENE_HEIGHT;
  return (
    <View style={[{ width: size * 2, height, overflow: 'hidden', backgroundColor: scene.palette.background }, style]}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Image source={BACKGROUNDS[scene.element]} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} transition={0} />
        <Svg width={size * 0.85} height={size * 0.12} style={{ position: 'absolute', alignSelf: 'center', bottom: height * 0.14 - size * 0.06 }}>
          <Defs>
            <RadialGradient id={shadowId}>
              <Stop offset="0" stopColor={scene.palette.ink} stopOpacity={0.20} />
              <Stop offset="0.5" stopColor={scene.palette.ink} stopOpacity={0.08} />
              <Stop offset="1" stopColor={scene.palette.ink} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={`url(#${shadowId})`} />
        </Svg>
      </View>
      <CharacterArt hanja={hanja} name={name} size={size} style={{ position: 'absolute', alignSelf: 'center', bottom: height * 0.14 }} />
    </View>
  );
}

/** 작은 영역은 풍경을 축소하지 않고 원래 캐릭터를 또렷하게 보여 준다. */
export function CharacterAvatar({ hanja, name, size }: Props) {
  const scene = characterScene(hanja, name);
  if (!scene) return null;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: scene.palette.soft, borderWidth: 1, borderColor: scene.palette.floor, alignItems: 'center', justifyContent: 'center' }}>
    <CharacterArt hanja={hanja} name={name} size={size * 0.88} />
  </View>;
}
