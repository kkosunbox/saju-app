import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { BRAND } from '@/components/BrandMark';
import { SITE_URL } from '@/content/seo';

const SANS = "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
// react-native-web 기본 글꼴보다 우선하되, 글꼴을 지정한 요소와 중첩 텍스트는 건드리지 않는다.
// 한국어는 낱말 단위로 줄바꿈하고, 너무 긴 영문·숫자만 예외로 끊는다.
const GLOBAL_CSS =
  `[class*="css-text-"]:not([class*="r-fontFamily"]):not([class*="textHasAncestor"]),[class*="css-textinput-"]:not([class*="r-fontFamily"]){font-family:${SANS};letter-spacing:-.2px}` +
  '[class*="css-text-"]{word-break:keep-all;overflow-wrap:anywhere;text-wrap:pretty}' +
  // iOS 사파리에서 꾹 누르면(마스코트 뽑기 등) 이미지 미리보기·저장 메뉴가 뜨거나 글자가 선택되지 않게
  'img{-webkit-touch-callout:none;-webkit-user-drag:none;-webkit-user-select:none;user-select:none}' +
  '[role="button"]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}' +
  // 부팅 중 미리 그린 랜딩(_layout.tsx)은 검색엔진·처음 온 사람용 — 온보딩을 마친 사람에겐 가린다
  'html[data-returning] #boot-landing{visibility:hidden}';

// 그리기 전에 읽어야 랜딩이 번쩍이지 않는다 (storageService 의 onulna:onboarded)
const RETURNING_JS = "try{if(localStorage.getItem('onulna:onboarded')==='1')document.documentElement.setAttribute('data-returning','')}catch(e){}";

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  alternateName: [BRAND.ko, 'woonpick'],
  url: `${SITE_URL}/`,
  inLanguage: 'ko-KR',
});

/**
 * 웹 정적 렌더링(SEO)용 HTML 셸 — 모든 경로에 같은 태그만 둔다.
 * 경로별 제목 · 설명 · canonical · noindex 는 SiteHead(expo-router/head).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        {/* maximum-scale=1: iOS 사파리가 16px보다 작은 입력창(상담 14px)에 포커스할 때 화면을 확대하지 않게. 손가락 확대는 iOS가 그대로 허용한다 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: RETURNING_JS }} />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#121418" media="(prefers-color-scheme: dark)" />
        <meta name="application-name" content={BRAND.name} />
        <meta name="apple-mobile-web-app-title" content={BRAND.name} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={BRAND.name} />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:image" content={`${SITE_URL}/og-v4.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${BRAND.name} — ${BRAND.slogan}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE_URL}/og-v4.png`} />
        {/* 네이버 서치어드바이저 소유확인 (Google은 DNS TXT 레코드) */}
        <meta name="naver-site-verification" content="c6e00275211265c4ab02d8421ae1bfa179e70866" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 화면에 쓰인 글자 범위만 받는 dynamic subset */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
