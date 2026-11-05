import { ImageSourcePropType } from 'react-native';

/**
 * 친구에게 선물하는 부적 (Figma 운픽_14_3) — mark는 고르는 칸의 한자 색, ink는 종이에 적히는 색(소원·칩).
 * 장난 부적(텅장·똥촉)은 어두운 종이라 dark로 날짜·제목을 흰색으로 쓰고, 한자는 seal 색으로 쓴다.
 */
export interface GiftTalisman { key: string; hanja: string; label: string; wish: string; mark: string; ink: string; seal?: string; dark?: boolean; paper: ImageSourcePropType }

export const GIFT_TALISMANS: readonly GiftTalisman[] = [
  { key: 'luck', hanja: '福', label: '행운', wish: '오늘 하루 좋은 일만 생긴다.', mark: '#E54D4D', ink: '#BC3827', paper: require('../../assets/figma/talisman/gift-luck.webp') },
  { key: 'pass', hanja: '合', label: '합격', wish: '원하는 합격 소식이 찾아온다.', mark: '#FCBD51', ink: '#C84400', paper: require('../../assets/figma/talisman/gift-pass.webp') },
  { key: 'health', hanja: '康', label: '건강', wish: '몸과 마음이 활력으로 차오른다.', mark: '#5FB884', ink: '#357F44', paper: require('../../assets/figma/talisman/gift-health.webp') },
  { key: 'wealth', hanja: '財', label: '재물', wish: '기분 좋은 재물이 들어온다.', mark: '#4EBBF6', ink: '#013A9D', paper: require('../../assets/figma/talisman/gift-wealth.webp') },
  { key: 'love', hanja: '緣', label: '연애', wish: '설레는 좋은 인연이 찾아온다.', mark: '#E04B63', ink: '#D52340', paper: require('../../assets/figma/talisman/gift-love.webp') },
  { key: 'success', hanja: '成', label: '성공', wish: '목표한 일을 멋지게 이뤄낸다.', mark: '#D7A438', ink: '#AF6203', paper: require('../../assets/figma/talisman/gift-success.webp') },
  { key: 'cheer', hanja: '力', label: '응원', wish: '어떤 일이든 해낼 힘이 생긴다.', mark: '#399AD0', ink: '#0076D5', paper: require('../../assets/figma/talisman/gift-cheer.webp') },
  { key: 'peace', hanja: '安', label: '평안', wish: '마음 편안하고 무탈한 하루가 된다.', mark: '#2881FE', ink: '#0227C1', paper: require('../../assets/figma/talisman/gift-peace.webp') },
  { key: 'broke', hanja: '空', label: '텅장', wish: '돈은 스쳐 가고, 텅장된다.', mark: '#E0774B', ink: '#FFB191', seal: '#CD460D', dark: true, paper: require('../../assets/figma/talisman/gift-broke.webp') },
  { key: 'jinx', hanja: '運', label: '똥촉', wish: '너가 고른 건 다 꽝이다.', mark: '#FF8E4C', ink: '#FFBB98', seal: '#C84400', dark: true, paper: require('../../assets/figma/talisman/gift-jinx.webp') },
];
