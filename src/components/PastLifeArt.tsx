import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import MascotShadow from './MascotShadow';
import type { PastLife } from '../types/content';
import { resolvePastLifeArt } from '../data/pastLifeArt';

/** Result, reveal and share card use the same bundled occupation/era artwork. */
export default function PastLifeArt({ result, size, onDisplay }: {
  result: Pick<PastLife, 'role' | 'era'>;
  size: number;
  onDisplay?: () => void;
}) {
  const art = resolvePastLifeArt(result);
  return (
    <View style={{ width: size, height: size }}>
      <MascotShadow size={size} style={{ left: size * 0.15, top: size * 0.86, opacity: 0.75 }} />
      <Image key={art.key} source={art.source} style={{ width: size, height: size }} contentFit="contain" transition={0} onDisplay={onDisplay} accessible={false} />
    </View>
  );
}
