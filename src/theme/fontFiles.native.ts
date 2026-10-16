/** 네이티브 글꼴 파일 (굵기별). 웹은 +html.tsx 의 웹폰트를 쓰므로 fontFiles.ts 는 비어 있다. */
export const FONT_FILES = {
  'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  // 패키지 index 를 쓰면 9개 굵기(각 14MB)가 모두 번들에 들어가서 쓰는 파일만 직접 가져온다
  'NotoSerifKR-Bold': require('@expo-google-fonts/noto-serif-kr/700Bold/NotoSerifKR_700Bold.ttf'),
};
