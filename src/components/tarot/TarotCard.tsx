import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { TarotReading } from '../../types';

// Explicit imports allow Metro to bundle the optimized illustrated deck offline.
const CARDS = [
  require('../../../assets/tarot/00.webp'),
  require('../../../assets/tarot/01.webp'),
  require('../../../assets/tarot/02.webp'),
  require('../../../assets/tarot/03.webp'),
  require('../../../assets/tarot/04.webp'),
  require('../../../assets/tarot/05.webp'),
  require('../../../assets/tarot/06.webp'),
  require('../../../assets/tarot/07.webp'),
  require('../../../assets/tarot/08.webp'),
  require('../../../assets/tarot/09.webp'),
  require('../../../assets/tarot/10.webp'),
  require('../../../assets/tarot/11.webp'),
  require('../../../assets/tarot/12.webp'),
  require('../../../assets/tarot/13.webp'),
  require('../../../assets/tarot/14.webp'),
  require('../../../assets/tarot/15.webp'),
  require('../../../assets/tarot/16.webp'),
  require('../../../assets/tarot/17.webp'),
  require('../../../assets/tarot/18.webp'),
  require('../../../assets/tarot/19.webp'),
  require('../../../assets/tarot/20.webp'),
  require('../../../assets/tarot/21.webp'),
];
export default function TarotCard({ reading, hidden = false, width = 200 }: { reading?: TarotReading; hidden?: boolean; width?: number }) {
  const source = hidden || !reading ? require('../../../assets/tarot/back.webp') : CARDS[reading.id] ?? require('../../../assets/tarot/back.webp');
  return <View style={{ width, height: width * 1.5 }} accessibilityLabel={hidden || !reading ? '오늘의 타로 카드 뒷면' : `${reading.name}, 정방향`} accessible>
    <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" accessible={false} />
  </View>;
}
