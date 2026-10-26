import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * 마스코트(무지개빛 젤리 캐릭터)와 콘텐츠 일러스트. 원본은 Figma '사주앱' 파일.
 * 화면에 쓰는 크기의 2~3배로 줄여 assets/images 에 넣었다.
 */
export const ART = {
  mascot: require('../../assets/images/mascot.png'),
  shadow: require('../../assets/images/mascot-shadow.png'), // 어두운 카드 오른쪽 아래의 검은 실루엣
  cloud: require('../../assets/images/mascot-cloud.png'),
  coin: require('../../assets/images/mascot-coin.png'),
  headphone: require('../../assets/images/mascot-headphone.png'),
  'pose-saju': require('../../assets/images/pose-saju.png'),
  'pose-thai': require('../../assets/images/pose-thai.png'),
  'pose-mbti': require('../../assets/images/pose-mbti.png'),
  'pose-blood': require('../../assets/images/pose-blood.png'),
  talisman: require('../../assets/images/talisman.png'),
  tiger: require('../../assets/images/tiger.png'),
  mbti: require('../../assets/images/icon-mbti.png'),
  pastLife: require('../../assets/images/icon-pastlife.png'),
  friends: require('../../assets/images/icon-friends.png'),
  today: require('../../assets/images/period-today.png'),
  week: require('../../assets/images/period-week.png'),
  month: require('../../assets/images/period-month.png'),
  year: require('../../assets/images/period-year.png'),
  compatHero: require('../../assets/images/compat-hero.webp'), // 궁합 결과 상단 밤하늘 카드 (연인)
  compatHeroFriend: require('../../assets/images/compat-hero-friend.webp'),
  compatHeroFamily: require('../../assets/images/compat-hero-family.webp'),
  compatHeroWork: require('../../assets/images/compat-hero-work.webp'),
  shareBanner: require('../../assets/images/share-card-banner.webp'), // 카드로 공유하기 배너 바탕
  crush: require('../../assets/images/crush-mascot.webp'), // 잠긴 리포트 카드 오른쪽 아래
  faceA: require('../../assets/images/compat-face-a.webp'), // 두 사람 비교표의 나
  faceB: require('../../assets/images/compat-face-b.webp'), // 두 사람 비교표의 상대
  // 콘텐츠 탭 "곧 오픈" 카드 그림
  'soon-reunion': require('../../assets/images/soon-reunion.webp'),
  'soon-loveTiming': require('../../assets/images/soon-lovetiming.webp'),
  'soon-jobTiming': require('../../assets/images/soon-jobtiming.webp'),
  'soon-friendRank': require('../../assets/images/soon-friendrank.webp'),
  'soon-marryAge': require('../../assets/images/soon-marryage.webp'),
  'soon-tarot': require('../../assets/images/soon-tarot.webp'),
  'soon-dream': require('../../assets/images/soon-dream.webp'),
  'soon-boss': require('../../assets/images/soon-boss.webp'),
  'soon-exam': require('../../assets/images/soon-exam.webp'),
  'soon-baby': require('../../assets/images/soon-baby.webp'),
  'soon-pet': require('../../assets/images/soon-pet.webp'),
  'soon-name': require('../../assets/images/soon-name.webp'),
  // 콘텐츠 탭 프리미엄 카드 그림 (나의 인생 지도 · 올해와 이달 · 테마 운세)
  'premium-life': require('../../assets/images/premium-life.webp'),
  'premium-sajuDeep': require('../../assets/images/premium-sajudeep.webp'),
  'premium-newyear': require('../../assets/images/premium-newyear.webp'),
  'premium-monthly': require('../../assets/images/premium-monthly.webp'),
  'premium-love': require('../../assets/images/premium-love.webp'),
  'premium-money': require('../../assets/images/premium-money.webp'),
  'premium-career': require('../../assets/images/premium-career.webp'),
  'premium-lucky': require('../../assets/images/premium-lucky.webp'),
} as const;
export type ArtName = keyof typeof ART;

/** 원본 비율 (가로/세로) — 높이만 정하면 가로를 맞춘다 */
const RATIO: Partial<Record<ArtName, number>> = {
  mascot: 1305 / 1205, shadow: 991 / 1184, cloud: 1536 / 878, coin: 683 / 532,
  'pose-saju': 581 / 535, 'pose-thai': 573 / 501, 'pose-mbti': 550 / 535, 'pose-blood': 612 / 499,
  mbti: 718 / 683, pastLife: 718 / 683, friends: 1254 / 766,
  today: 519 / 508, week: 519 / 508, month: 519 / 508, year: 519 / 508,
  compatHero: 984 / 679, shareBanner: 984 / 204, crush: 336 / 411,
  'soon-loveTiming': 268 / 233, 'soon-jobTiming': 244 / 233, 'soon-friendRank': 269 / 232, 'soon-marryAge': 256 / 233, 'soon-tarot': 276 / 238, 'soon-dream': 268 / 233, 'soon-boss': 268 / 233, 'soon-exam': 277 / 264, 'soon-baby': 268 / 232, 'soon-pet': 277 / 264, 'soon-name': 268 / 232,
  'premium-life': 362 / 265, 'premium-sajuDeep': 350 / 333, 'premium-newyear': 384 / 307, 'premium-monthly': 384 / 307,
  'premium-love': 371 / 297, 'premium-money': 375 / 307, 'premium-career': 358 / 307, 'premium-lucky': 359 / 307,
};

/**
 * 어두운 카드 오른쪽 끝에서 안쪽을 바라보며 들여다보는 마스코트 (Figma의 마스코트 스크린샷 자리).
 * 그림을 좌우로 뒤집어 잘린 쪽을 카드 오른쪽 끝에 붙이고, 아래는 카드 밖으로 잘린다 — 카드에 overflow: 'hidden' 필요.
 * width·top은 Figma에서 그 그림 칸의 너비와 카드 위로부터의 거리 그대로. 높이가 내용 따라 달라지는 카드는 top 대신 bottom으로 아래에 붙인다.
 */
export function MascotPeek({ width, top, bottom, right = 0, opacity }: { width: number; top?: number; bottom?: number; right?: number; opacity: number }) {
  return <Mascot name="shadow" size={width / RATIO.shadow!} style={{ position: 'absolute', right, top, bottom, opacity, transform: [{ scaleX: -1 }] }} />;
}

export default function Mascot({ name = 'mascot', size, style }: { name?: ArtName; size: number; style?: StyleProp<ImageStyle> }) {
  const r = RATIO[name] ?? 1;
  return <Image source={ART[name]} style={[{ width: size * r, height: size }, style]} resizeMode="contain" accessibilityIgnoresInvertColors />;
}

/** '운픽' 레터링 (Figma 로고의 벡터 그대로, 54×33 좌표) */
const LOGO_PATHS = [
  'M5.505 26.359C5.507 26.725 5.649 27.141 5.913 27.382C6.21 27.651 6.661 27.845 7.109 27.846L23.221 27.869C23.885 27.869 24.485 28.223 24.77 28.765C25.057 29.31 25.093 29.895 24.958 30.498C24.797 31.217 24.164 31.879 23.334 31.881L5.843 31.91C3.764 31.913 1.995 31.149 1.19 29.197C.835 28.334.716 27.428.674 26.486C.634 25.61.632 24.759.668 23.882C.696 23.237.847 22.615 1.185 22.074C1.677 21.285 2.689 20.804 3.616 20.804L11.296 20.801L23.407 20.796C23.962 20.796 24.523 21.046 24.859 21.469C25.541 22.326 25.511 23.637 24.803 24.462C24.419 24.91 23.815 25.059 23.238 25.059L15.252 25.063C15.26 25.864 14.85 26.552 14.095 26.792C13.472 27.002 12.809 26.995 12.189 26.801C11.452 26.521 11.011 25.868 11.067 25.063L5.498 25.066L5.504 26.359Z',
  'M43.381 20.829H29.72C28.727 20.828 28.009 20.039 27.858 19.169C27.791 18.778 27.795 18.452 27.857 18.078C28.018 17.108 28.809 16.341 29.814 16.305L30.68 16.273L30.677 12.094L29.964 12.088C29.281 12.083 28.61 11.783 28.237 11.226C27.933 10.774 27.875 10.344 27.869 9.783C27.858 8.725 28.644 7.603 29.838 7.602L43.556 7.591C44.198 7.591 44.703 7.998 45.068 8.437C45.558 9.357 45.563 10.522 44.908 11.351C44.405 11.987 43.597 12.137 42.79 12.073L42.785 16.286L43.591 16.309C44.209 16.326 44.825 16.745 45.115 17.316C45.537 18.146 45.511 19.189 44.994 19.974C44.663 20.475 44.051 20.829 43.38 20.829ZM38.228 16.287L38.226 12.103L37.887 12.096L35.287 12.114L35.279 16.29Z',
  'M47.74 31.067C47.652 30.542 47.666 30.042 47.669 29.53L47.684 27.512C47.688 26.942 47.273 26.473 46.644 26.472L37.995 26.465H37.46L30.135 26.458C29.505 26.458 28.914 26.199 28.534 25.729C28.131 25.23 28.048 24.645 28.075 24.006C28.124 22.862 28.989 21.904 30.2 21.905L48.954 21.915C51.182 21.917 53.153 23.477 53.149 25.721L53.141 30.525C53.139 31.356 52.717 32.144 52.012 32.565C51.214 33.04 50.265 33.1 49.389 32.87C48.513 32.64 47.892 31.985 47.74 31.067Z',
  'M51.888 20.565C51.202 20.859 50.574 20.875 49.89 20.769C48.788 20.6 48.022 19.776 47.898 18.636L47.923 11.464L47.981 8.226C47.997 7.317 48.643 6.568 49.445 6.243C50.472 5.827 51.886 5.969 52.65 6.696C53.12 7.144 53.387 7.785 53.384 8.447L53.372 11.526L53.317 18.391C53.309 19.356 52.755 20.193 51.889 20.565Z',
];

/** 운픽 워드마크 — 마스코트 얼굴 + 레터링. color: 레터링 색 (하늘색·어두운 바탕엔 흰색) */
export function Logo({ height = 33, color = '#FFFFFF' }: { height?: number; color?: string }) {
  const k = height / 33;
  return (
    <View style={{ width: 54 * k, height }} accessible accessibilityLabel="운픽">
      <Svg width={54 * k} height={height} viewBox="0 0 54 33" style={{ position: 'absolute' }}>
        {LOGO_PATHS.map(d => <Path key={d.slice(0, 12)} d={d} fill={color} />)}
      </Svg>
      <Image source={ART.mascot} style={{ position: 'absolute', left: 0, top: 0, width: 26 * k, height: 24 * k }} resizeMode="contain" />
    </View>
  );
}
