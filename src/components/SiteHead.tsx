import Head from 'expo-router/head';
import { usePathname } from 'expo-router';
import { BRAND } from './BrandMark';
import { pageMeta, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../content/seo';

/**
 * 웹: 경로별 제목 · 설명 · canonical · 공유 미리보기(og) · noindex.
 * 정적 렌더링 때도 그려져 HTML에 들어간다. 모든 경로에 같은 태그(og:image 등)는 +html.tsx.
 */
export default function SiteHead() {
  const meta = pageMeta(usePathname());
  const title = meta.title === SITE_TITLE ? SITE_TITLE : `${meta.title} · ${BRAND.name}`;
  const description = meta.description ?? SITE_DESCRIPTION;
  const url = meta.canonical ? SITE_URL + meta.canonical : undefined;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {url ? <link rel="canonical" href={url} /> : null}
      {url ? <meta property="og:url" content={url} /> : null}
      {url ? null : <meta name="robots" content="noindex, follow" />}
    </Head>
  );
}
