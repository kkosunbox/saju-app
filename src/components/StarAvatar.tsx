import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';

/**
 * 연예인 궁합 실루엣 — 성별마다 다섯 장 (배경 없이 투명, 원 안에 들어오게 줄여 둔 것).
 * 실루엣·배경 그림은 둘 다 원으로 자르지 않은 정사각이고, 원은 바깥 View 한 곳에서만 자른다.
 * 그림마다 따로 원으로 자르면 가장자리 안티앨리어싱이 겹쳐 실루엣 테두리에 배경이 비친다.
 */
const SILHOUETTES = {
  male: [
    require('../../assets/figma/content/star/male-1.webp'),
    require('../../assets/figma/content/star/male-2.webp'),
    require('../../assets/figma/content/star/male-3.webp'),
    require('../../assets/figma/content/star/male-4.webp'),
    require('../../assets/figma/content/star/male-5.webp'),
  ],
  female: [
    require('../../assets/figma/content/star/female-1.webp'),
    require('../../assets/figma/content/star/female-2.webp'),
    require('../../assets/figma/content/star/female-3.webp'),
    require('../../assets/figma/content/star/female-4.webp'),
    require('../../assets/figma/content/star/female-5.webp'),
  ],
};
/** 실루엣 뒤 노을 배경 다섯 장 (원형) */
const BACKGROUNDS = [
  require('../../assets/figma/content/star/bg-1.webp'),
  require('../../assets/figma/content/star/bg-2.webp'),
  require('../../assets/figma/content/star/bg-3.webp'),
  require('../../assets/figma/content/star/bg-4.webp'),
  require('../../assets/figma/content/star/bg-5.webp'),
];

/**
 * 이름 해시 (FNV-1a + 마무리 섞기) — 같은 이름이면 기기·날짜와 상관없이 늘 같은 실루엣.
 * djb2는 한글 이름에서 5로 나눈 나머지가 한쪽으로 몰려 (윤아·예리·나린·전여빈·한소희가 모두 같은 칸) 쓰지 않는다.
 */
const hash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

/**
 * 이름·성별로 고정된 실루엣과 배경. 실루엣은 해시 % 5, 배경은 해시를 5로 나눈 몫 % 5로 따로 골라
 * 같은 실루엣이어도 배경이 다를 수 있다 (25가지). 성별을 모르면 해시로 남녀도 정한다.
 */
export function silhouetteOf(name: string, gender?: 'male' | 'female' | null) {
  const h = hash(name.trim());
  return {
    figure: SILHOUETTES[gender ?? (Math.floor(h / 25) % 2 ? 'male' : 'female')][h % 5],
    background: BACKGROUNDS[Math.floor(h / 5) % 5],
  };
}

/** 원형 실루엣 아바타 (연예인 궁합의 나 · 연예인) */
export default function StarAvatar({ name, gender, size, style, imageStyle }: {
  name: string;
  gender?: 'male' | 'female' | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}) {
  const { figure, background } = silhouetteOf(name, gender);
  const fill = [{ position: 'absolute' as const, width: size, height: size }, imageStyle];
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
      <Image source={background} style={fill} contentFit="cover" accessible={false} />
      <Image source={figure} style={fill} contentFit="cover" accessible={false} />
    </View>
  );
}
