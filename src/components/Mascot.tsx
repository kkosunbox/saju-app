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

/** '운PICK' 레터링 (Figma 로고의 벡터 그대로, 65×55 좌표 — 아래 19는 여백) */
const LOGO_PATHS = [
  'M51.778 34.177C51.765 35.200 50.888 35.816 49.957 35.841C49.021 35.867 48.016 35.233 48.014 34.199L48 24.069C47.999 23.472 48.225 22.974 48.721 22.638C49.45 22.143 50.449 22.169 51.173 22.673C51.584 22.959 51.789 23.403 51.792 23.893L51.807 26.480L56.779 22.498C57.656 21.796 58.884 21.810 59.613 22.703C60.176 23.392 60.095 24.393 59.396 24.962L56.901 26.991L54.796 28.633L59.363 32.591C59.75 32.927 59.979 33.18 59.998 33.716C60.028 34.576 59.690 35.372 58.970 35.746C58.213 36.140 57.286 36.086 56.639 35.507L51.816 31.186L51.778 34.176L51.778 34.177Z',
  'M24.733 31.489L21.647 31.526L21.633 34.232C21.627 35.255 20.821 36.022 19.867 35.994C18.965 36.067 17.999 35.362 18 34.313L18.006 24.129C18.006 22.950 19.050 22.000 20.119 22H24.919C26.235 22 27.471 22.732 28.203 23.875C29.306 25.599 29.251 27.906 28.116 29.595C27.340 30.749 26.101 31.473 24.733 31.49L24.733 31.489ZM24.114 28.097C24.942 28.085 25.383 27.307 25.358 26.577C25.331 25.785 24.737 25.217 23.961 25.219L21.641 25.225V28.133L24.114 28.097Z',
  'M44.504 32.055C45.406 31.691 46.401 31.972 46.811 32.859C47.318 33.955 46.762 35.167 45.639 35.552C44.114 36.074 42.489 36.153 40.922 35.717C38.205 34.961 36.291 32.609 36.033 29.735C35.775 26.861 37.026 24.365 39.353 22.994C41.336 21.826 43.735 21.704 45.854 22.537C46.801 22.91 47.187 23.976 46.862 24.853C46.500 25.830 45.505 26.249 44.53 25.916C43.713 25.638 42.841 25.627 42.032 25.899C40.609 26.377 39.706 27.694 39.761 29.230C39.800 30.319 40.35 31.273 41.274 31.836C42.235 32.419 43.417 32.492 44.503 32.054L44.504 32.055Z',
  'M10.713 25.991L5.284 26C3.944 26.001 2.160 25.433 1.462 24.262C0.534 22.702 1.051 20.730 2.579 19.784C3.432 19.256 4.414 19.005 5.442 19.004L10.710 19C12.831 18.998 14.990 20.221 15 22.488C15.005 23.656 14.387 24.722 13.328 25.302C12.550 25.728 11.663 25.991 10.713 25.991ZM10.632 23.224C11.098 23.101 11.371 22.641 11.154 22.241C10.987 21.932 10.575 21.719 10.204 21.695C8.787 21.603 7.424 21.614 5.998 21.680C5.352 21.711 4.744 22.062 4.829 22.658C4.953 23.540 6.823 23.410 8.076 23.409C8.933 23.409 9.781 23.447 10.632 23.225V23.224Z',
  'M10.027 30.988C10.000 32.023 8.346 32.132 7.176 31.894C6.674 31.792 6.358 31.372 6.348 30.905L6.329 29.934L1.028 29.909C0.310 29.907 -0.014 29.052 0.000 28.482C0.027 27.481 0.669 27.004 1.607 27.004L14.681 27C15.622 27 16.092 27.921 15.984 28.709C15.877 29.496 15.385 29.937 14.614 29.937L10.055 29.936L10.027 30.989V30.988Z',
  'M33.08 35.998C32.059 36.04 31 35.387 31 34.316V23.815C30.999 22.712 31.953 21.966 33.066 22.001C33.983 22.029 34.968 22.656 34.971 23.639L35 34.083C35.002 35.169 34.284 35.947 33.08 35.998Z',
  'M13.412 32.952C13.886 32.924 14.321 33.067 14.606 33.352C14.890 33.637 15.015 34.103 14.998 34.536C14.964 35.439 14.346 36 13.435 36L2.629 35.998C1.753 35.998 1.086 35.311 1.059 34.493L1.001 32.667C0.976 31.890 1.362 31.258 2.151 31.079C3.302 30.817 4.579 31.203 4.621 32.257L4.656 33.114H10.717L13.412 32.953V32.952Z',
];
/** 마스코트 얼굴 뒤 말풍선 — 흰 글자 로고엔 남색, 먹색 글자 로고엔 하늘색 */
const LOGO_BUBBLE = 'M53.191 19.694L52.898 19.647L52.075 19.480L50.020 18.954L49.333 18.794L49.05 18.749C48.726 18.698 48.396 18.697 48.073 18.748L47.737 18.802C46.511 18.997 45.236 20.036 44.357 19.999C44.08 19.987 43.835 19.812 43.742 19.574C43.685 19.425 43.677 19.286 43.742 19.146L43.968 18.668C44.286 17.991 44.492 17.592 44.399 16.752C44.361 16.404 44.238 16.090 44.092 15.771C43.744 15.011 43.327 13.854 43.198 13.054L43.131 12.637L43.088 12.353L43.033 11.795L43 11.301V10.904L43.004 10.488L43.030 10.152L43.090 9.512L43.139 9.205L43.191 8.935C43.471 7.462 44.038 6.093 44.880 4.837C45.486 3.933 46.220 3.145 47.075 2.466L47.377 2.226C47.852 1.849 48.376 1.559 48.921 1.274C49.83 0.797 50.898 0.427 51.906 0.236C52.243 0.172 52.577 0.107 52.922 0.076L53.410 0.033C53.894 -0.008 54.380 -0.012 54.863 0.031L55.436 0.085L55.746 0.128L56.312 0.221L56.568 0.269C57.734 0.530 58.846 0.963 59.879 1.566C60.592 1.982 61.236 2.474 61.834 3.032C62.236 3.408 62.572 3.802 62.906 4.231L63.435 4.994L63.800 5.639C64.082 6.137 64.307 6.652 64.475 7.198L64.673 7.843L64.747 8.161L64.917 9.039L64.966 9.403L64.998 9.827L65 11.096L64.965 11.575L64.920 11.881L64.751 12.770C64.637 13.373 64.419 13.940 64.159 14.493L63.631 15.480C63.404 15.906 63.114 16.293 62.782 16.647L62.305 17.155L61.844 17.586L61.391 17.947L61.088 18.175L60.724 18.407C59.727 19.041 58.659 19.451 57.502 19.680L57.214 19.737L56.480 19.841L56.050 19.883L54.761 19.884L54.190 19.839L53.548 19.749L53.189 19.693L53.191 19.694Z';

/** 밝은 글자색인지 — 다크 모드의 먹색(#EEF0F5)도 흰 글자 로고로 친다 */
function isLight(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150;
}

/**
 * 운PICK 워드마크 — '운PICK' 레터링 + 오른쪽 위 말풍선 속 마스코트 얼굴. color: 레터링 색 (하늘색·어두운 바탕엔 흰색)
 * 상자는 Figma 로고 프레임(65×55)대로 아래에 여백이 있어 레터링이 상자 한가운데 온다 — 옆 글자와 가운데 정렬하면 레터링 기준으로 맞는다.
 * height = 여백까지 포함한 상자 높이.
 */
export function Logo({ height = 55, color = '#FFFFFF' }: { height?: number; color?: string }) {
  const k = height / 55;
  const bubble = isLight(color) ? '#003560' : '#59C3FB';
  return (
    <View style={{ width: 65 * k, height }} accessible accessibilityLabel="운픽">
      <Svg width={65 * k} height={height} viewBox="0 0 65 55" style={{ position: 'absolute' }}>
        {LOGO_PATHS.map(d => <Path key={d.slice(0, 12)} d={d} fill={color} />)}
        <Path d={LOGO_BUBBLE} fill={bubble} />
      </Svg>
      <Image source={ART.mascot} style={{ position: 'absolute', left: 43 * k, top: 0, width: 21 * k, height: 19 * k }} resizeMode="contain" />
    </View>
  );
}
