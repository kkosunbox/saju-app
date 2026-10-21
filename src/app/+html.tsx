import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SANS = "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
// react-native-web 기본 글꼴보다 우선하되, 글꼴을 지정한 요소와 중첩 텍스트는 건드리지 않는다.
// 한국어는 낱말 단위로 줄바꿈하고, 너무 긴 영문·숫자만 예외로 끊는다.
const GLOBAL_CSS =
  `[class*="css-text-"]:not([class*="r-fontFamily"]):not([class*="textHasAncestor"]),[class*="css-textinput-"]:not([class*="r-fontFamily"]){font-family:${SANS};letter-spacing:-.2px}` +
  '[class*="css-text-"]{word-break:keep-all;overflow-wrap:anywhere;text-wrap:pretty}' +
  // iOS 사파리에서 꾹 누르면(마스코트 뽑기 등) 이미지 미리보기·저장 메뉴가 뜨거나 글자가 선택되지 않게
  'img{-webkit-touch-callout:none;-webkit-user-drag:none;-webkit-user-select:none;user-select:none}' +
  '[role="button"]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';

/** 웹 정적 렌더링(SEO)용 HTML 셸. 화면별 메타는 expo-router/head 의 <Head>로 추가한다. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* maximum-scale=1: iOS 사파리가 16px보다 작은 입력창(상담 14px)에 포커스할 때 화면을 확대하지 않게. 손가락 확대는 iOS가 그대로 허용한다 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>운Pick · 오늘의 운, 하나만 Pick!</title>
        <meta name="description" content="사주 · 점성술 · MBTI · 혈액형을 겹쳐 읽는 오늘의 운세. 오늘의 운, 하나만 Pick!" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta property="og:title" content="운Pick · 오늘의 운, 하나만 Pick!" />
        <meta property="og:description" content="사주부터 MBTI까지, 오늘의 나를 PICK하다." />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
