import type { Element } from '../types/content';

/** 생성 원본 좌표계의 실제 실루엣 범위. 384px WebP도 같은 비율을 사용한다. 투명 여백·희미한 점은 제외한다. */
const ARTWORK = {
  original: { width: 360, height: 332, left: 38, right: 333, bottom: 310 },
  wood: { width: 1254, height: 1254, left: 132, right: 1134, bottom: 1153 },
  fire: { width: 1254, height: 1254, left: 144, right: 1118, bottom: 1157 },
  earth: { width: 1254, height: 1254, left: 137, right: 1139, bottom: 1086 },
  metal: { width: 1254, height: 1254, left: 130, right: 1135, bottom: 1104 },
  water: { width: 1254, height: 1254, left: 116, right: 1169, bottom: 1109 },
} as const;

/** 모든 상태에서 몸통 너비 89, 중심 54, 바닥 93을 유지한다 (108×100 좌표). */
export function getMascotFrame(variant: Element | 'original', size: number) {
  const art = ARTWORK[variant];
  const scale = (size * 0.89) / (art.right - art.left);
  return {
    width: art.width * scale,
    height: art.height * scale,
    left: size * 0.54 - ((art.left + art.right) / 2) * scale,
    top: size * 0.93 - art.bottom * scale,
  };
}
