const SANS = "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
// react-native-web 기본 글꼴보다 우선하되, 글꼴을 지정한 요소와 중첩 텍스트는 건드리지 않는다.
// 한국어는 낱말 단위로 줄바꿈하고, 너무 긴 영문·숫자만 예외로 끊는다.
export const GLOBAL_CSS =
  `[class*="css-text-"]:not([class*="r-fontFamily"]):not([class*="textHasAncestor"]),[class*="css-textinput-"]:not([class*="r-fontFamily"]){font-family:${SANS};letter-spacing:-.2px}` +
  '[class*="css-text-"]{word-break:keep-all;overflow-wrap:anywhere;text-wrap:pretty}' +
  // iOS 사파리에서 꾹 누르면(마스코트 뽑기 등) 이미지 미리보기·저장 메뉴가 뜨거나 글자가 선택되지 않게
  'img{-webkit-touch-callout:none;-webkit-user-drag:none;-webkit-user-select:none;user-select:none}' +
  '[role="button"]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}' +
  // 부팅 중 미리 그린 랜딩(_layout.tsx)은 검색엔진·처음 온 사람용 — 온보딩을 마친 사람에겐 가린다
  'html[data-returning] #boot-landing{visibility:hidden}';

export const PRETENDARD_STYLESHEET = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css';
