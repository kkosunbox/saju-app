import React from 'react';
import { Image } from 'expo-image';
import { View } from 'react-native';

// Downloaded Figma vectors retain their original root dimensions; slot sizes
// include the transparent inset around the profile user and coins glyphs.
const assets = {
  sparkle: [require('../../../assets/figma/my-page/profile-sparkles.svg'), 16, 16],
  blood: [require('../../../assets/figma/my-page/blood.svg'), 16, 16],
  calendar: [require('../../../assets/figma/my-page/calendar.svg'), 16, 16],
  time: [require('../../../assets/figma/my-page/time.svg'), 16, 16],
  pin: [require('../../../assets/figma/my-page/pin.svg'), 16, 16],
  user: [require('../../../assets/figma/my-page/profile-user.svg'), 11.2, 12],
  mail: [require('../../../assets/figma/my-page/account-mail.svg'), 16, 16],
  system: [require('../../../assets/figma/my-page/system.svg'), 16, 16],
  sun: [require('../../../assets/figma/my-page/sun.svg'), 16, 16],
  moon: [require('../../../assets/figma/my-page/moon.svg'), 16, 16],
  bell: [require('../../../assets/figma/my-page/bell.svg'), 16, 16],
  coins: [require('../../../assets/figma/my-page/coins.svg'), 9, 12.0001],
  premium: [require('../../../assets/figma/my-page/wallet-sparkles.svg'), 16, 16],
  login: [require('../../../assets/figma/my-page/login-user.svg'), 20, 20],
  chevron: [require('../../../assets/figma/my-page/chevron-left-20.svg'), 20, 20],
  smallChevron: [require('../../../assets/figma/my-page/chevron-left-16.svg'), 16, 16],
  close: [require('../../../assets/figma/my-page/close.svg'), 24, 24],
  toggleOn: [require('../../../assets/figma/my-page/toggle-on.svg'), 40, 24],
  toggleOff: [require('../../../assets/figma/my-page/toggle-off.png'), 40, 24],
} as const;
export type ProfileAssetName = keyof typeof assets;

export default function FigmaAsset({ name, tint }: { name: ProfileAssetName; tint?: string }) {
  const [source, width, height] = assets[name];
  const chevron = name === 'chevron' || name === 'smallChevron';
  const slot = name === 'user' || name === 'coins' ? 16 : width;
  return (
    <View style={{ width: slot, height: name === 'user' || name === 'coins' ? 16 : height, alignItems: 'center', justifyContent: 'center', ...(name === 'toggleOff' ? { backgroundColor: '#D0D0D0', borderRadius: 12 } : {}), transform: chevron ? [{ scaleX: -1 }] : name === 'system' ? [{ scaleY: -1 }] : [] }}>
      <Image source={source} style={{ width, height, transform: name === 'user' ? [{ translateY: 0.4 }] : name === 'coins' ? [{ translateX: -0.5 }] : [] }} contentFit="contain" tintColor={tint} />
    </View>
  );
}
