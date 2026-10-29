import Head from 'expo-router/head';
import { usePathname } from 'expo-router';
import { headMeta } from '../content/seo';

/**
 * 웹: 화면을 옮길 때 브라우저 탭 제목을 바꾼다.
 * 설명 · canonical · 공유 미리보기(og) · noindex 는 +html.tsx 가 정적 HTML에 넣는다 —
 * SDK 58의 정적 렌더링은 expo-router/head 태그를 HTML에 넣지 않아 여기서 그려도 검색엔진·공유 봇에 닿지 않는다.
 */
export default function SiteHead() {
  return (
    <Head>
      <title>{headMeta(usePathname()).title}</title>
    </Head>
  );
}
