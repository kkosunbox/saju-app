import type { MascotPose } from './resultMascot';

/** 원본 좌표계의 몸통 실루엣 범위. 384px WebP도 같은 비율을 사용한다. 몸통에서 떨어진 소품·희미한 점과, 몸통에 겹친 소품(클로버 줄기·체크리스트)은 제외한다. */
const ARTWORK = {
  original: { width: 360, height: 332, left: 38, right: 333, bottom: 310 },
  crown: { width: 1188, height: 1184, left: 120, right: 1112, bottom: 1160 },
  hearts: { width: 1188, height: 1184, left: 68, right: 1044, bottom: 1112 },
  clover: { width: 1184, height: 1184, left: 96, right: 1136, bottom: 1128 },
  checklist: { width: 1184, height: 1184, left: 80, right: 1084, bottom: 1010 },
  breeze: { width: 1184, height: 1184, left: 124, right: 972, bottom: 1020 },
  question: { width: 1184, height: 1184, left: 124, right: 1104, bottom: 1028 },
  rain: { width: 1184, height: 1184, left: 128, right: 1040, bottom: 1028 },
  sleepy: { width: 1184, height: 1184, left: 100, right: 1036, bottom: 1008 },
} as const;

/** 모든 포즈에서 몸통 너비 89, 중심 54, 바닥 93을 유지한다 (108×100 좌표). 왕관·구름 같은 소품은 칸 밖으로 나갈 수 있다. */
export function getMascotFrame(variant: MascotPose | 'original', size: number) {
  const art = ARTWORK[variant];
  const scale = (size * 0.89) / (art.right - art.left);
  return {
    width: art.width * scale,
    height: art.height * scale,
    left: size * 0.54 - ((art.left + art.right) / 2) * scale,
    top: size * 0.93 - art.bottom * scale,
  };
}

/**
 * 광내기·터치 때 몸통에 잠깐 맺히는 흰 광택 (108×100 좌표). 포즈마다 몸통 윤곽에서 같은 깊이에 놓고,
 * 왕관·수면모자는 피해 몸통 위에, 체크리스트 포즈의 아래 테두리는 연필 아래로 내린다.
 */
export const MASCOT_GLOSS: Record<MascotPose | 'original', { top: string; rim: string; dot: [number, number] }> = {
  original: { top: 'M67 12C72 13 72 20 70 27', rim: 'M19 66C16.5 76 23 82.5 31.5 86.5', dot: [66, 33] },
  crown: { top: 'M66 16C70.5 16.5 70.5 22.5 68.5 29.5', rim: 'M19.5 66C17 75.5 23.5 82.5 32 86', dot: [64.5, 36] },
  hearts: { top: 'M66 16C70.5 16.5 70.5 22.5 68.5 29.5', rim: 'M19.5 66C17 75.5 23.5 82.5 32.5 85.5', dot: [64.5, 36] },
  clover: { top: 'M66 14.5C71 15.5 71 22 69 28.5', rim: 'M19.5 66C17 75.5 23 82.5 32 86', dot: [65, 35] },
  checklist: { top: 'M65.5 16.5C70.5 17 70.5 23.5 68.5 29.5', rim: 'M20.5 73C20.5 82.5 28.5 87.5 38 89', dot: [64.5, 36] },
  breeze: { top: 'M65.5 17.5C70 17.5 70 24 68.5 30', rim: 'M19.5 66C17 75.5 23.5 82 32.5 85.5', dot: [64, 36.5] },
  question: { top: 'M66.5 14.5C71 15 71 22 69.5 28.5', rim: 'M19.5 66C17 75.5 23.5 82.5 32 86', dot: [65, 35] },
  rain: { top: 'M63.5 24C67 24.5 66.5 30.5 64.5 36.5', rim: 'M19.5 66C16.5 76 23 82.5 32 86', dot: [60.5, 43.5] },
  sleepy: { top: 'M73.5 19.5C77 22 75 29.5 71.5 35.5', rim: 'M19 66C16.5 76 23 82.5 32 86', dot: [66, 40.5] },
};
