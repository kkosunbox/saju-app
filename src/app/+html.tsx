import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// 웹 정적 렌더링(SEO)용 HTML 셸. 화면별 메타는 expo-router/head의 <Head>로 추가한다.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>오늘나 — 4가지 관점으로 보는 나의 오늘</title>
        <meta name="description" content="사주 · 태국 점성술 · MBTI · 혈액형을 종합한 개인 맞춤 운세" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
