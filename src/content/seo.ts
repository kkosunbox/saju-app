/**
 * 웹 검색·공유 미리보기용 경로별 메타 — 정적 HTML에는 src/app/+html.tsx 가, 화면을 옮길 때의 탭 제목은 SiteHead 가 그린다.
 * 검색에 올리는 건 랜딩(/)과 서비스 소개(/g/*, content/guides)뿐이다. 나머지는 프로필이 있어야 열리거나 개인 화면이고,
 * 약관(public/terms.html · privacy.html)은 검색 결과에서 서비스 메뉴 자리를 차지하지 않게 noindex.
 */
import { BRAND } from '@/components/BrandMark';
import { GUIDES, guideSlugOf } from './guides';

/** 운영 웹 주소 — canonical · og:url · sitemap 의 절대 주소 */
export const SITE_URL = 'https://woonpick.com';

/** 정식 이름은 운Pick이지만 '운픽'으로 찾는 사람도 많아 제목·설명에 함께 적는다 */
export const SITE_NAME = `${BRAND.name}(${BRAND.ko})`;
/** 검색 결과 제목은 앞부분만 보이므로 찾는 말(사주·점성술·MBTI·혈액형)을 브랜드 바로 뒤에 둔다 */
export const SITE_TITLE = `${SITE_NAME} · 사주·점성술·MBTI·혈액형 운세`;
export const SITE_DESCRIPTION = `소름 돋게 정확한 운세 풀이, ${SITE_NAME}. 사주·점성술·MBTI·혈액형, 4가지 관점으로 더 깊이 읽어보는 나. 오늘의 운세부터 궁합·신년 운세까지 가입 없이 1분이면 봐요.`;
/** 카카오톡 등 공유 미리보기는 검색어보다 한눈에 끌리는 문구로 */
const SHARE_TITLE = `${BRAND.name} · 소름 돋게 정확한 운세 풀이`;
const SHARE_DESCRIPTION = '사주 · 점성술 · MBTI · 혈액형, 4가지 관점으로 더 깊이 읽어보는 나';

export interface PageMeta {
  title: string;
  description?: string;
  /** 검색에 올리는 주소 (SITE_URL 기준 경로). 없으면 noindex */
  canonical?: string;
  /** 공유 미리보기(og · twitter)만 다르게 할 때 */
  shareTitle?: string;
  shareDescription?: string;
}

const LANDING: PageMeta = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  canonical: '/',
  shareTitle: SHARE_TITLE,
  shareDescription: SHARE_DESCRIPTION,
};

/** 정확히 같은 경로 */
const EXACT: Record<string, PageMeta> = {
  '/': LANDING,
  '/onboarding': LANDING,
  '/legal/terms': { title: '서비스 이용약관' },
  '/legal/privacy': { title: '개인정보처리방침' },
  '/compatibility': { title: '궁합' },
  '/consult': { title: '고민 상담' },
  '/content': { title: '콘텐츠' },
  '/my': { title: '마이' },
  '/combined': { title: '오늘의 운세 · 종합풀이' },
  '/fortune': { title: '오늘의 운세' },
  '/character': { title: '사주 캐릭터' },
  '/past-life': { title: '전생' },
  '/mbti-match': { title: '찰떡 MBTI' },
  '/talisman': { title: '오늘의 부적' },
  '/spouse': { title: '미래 배우자' },
  '/wallet': { title: '내 알' },
  '/charge': { title: '알 충전' },
  '/subscribe': { title: '정기 구독' },
  '/inquiry': { title: '문의하기' },
  '/share': { title: '스토리 카드' },
  '/profile-setup': { title: '내 정보 입력' },
  '/profile-edit': { title: '프로필 수정' },
  '/login': { title: '로그인' },
  '/login/email': { title: '이메일 로그인' },
  '/signup': { title: '회원가입' },
  '/signup-terms': { title: '약관 동의' },
  '/find-password': { title: '비밀번호 찾기' },
  '/consult/history': { title: '상담 기록' },
  '/premium/saju': { title: '상세 사주 해석' },
  '/premium/life': { title: '평생운 · 10년 대운' },
  '/premium/new-year': { title: '신년 운세' },
  '/premium/monthly': { title: '월별 운세' },
  '/premium/lucky': { title: '길일 찾기' },
};

/** 앞부분이 같은 경로 (동적 경로) */
const PREFIX: [string, PageMeta][] = [
  ['/invite/', { title: '궁합 초대', description: '친구가 운Pick에서 궁합을 보자고 초대했어요.' }],
  ['/consult/', { title: '고민 상담' }],
  ['/premium/theme/', { title: '테마 운세' }],
  ['/analysis/', { title: '관점별 분석' }],
  ['/category/', { title: '분야별 운세' }],
  ['/login/social/', { title: '로그인' }],
  ['/oauth/', { title: '로그인' }],
  ['/auth/', { title: '로그인' }],
];

function pageMeta(pathname: string): PageMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const guide = guideSlugOf(path);
  if (guide) return { title: GUIDES[guide].title, description: GUIDES[guide].description, canonical: path };
  return EXACT[path] ?? PREFIX.find(([p]) => path.startsWith(p))?.[1] ?? { title: '페이지를 찾을 수 없어요' };
}

/** <head>에 넣을 값 — url 이 없으면 noindex */
export function headMeta(pathname: string) {
  const meta = pageMeta(pathname);
  const title = meta.title === SITE_TITLE ? SITE_TITLE : `${meta.title} · ${BRAND.name}`;
  const description = meta.description ?? SITE_DESCRIPTION;
  return {
    title,
    description,
    shareTitle: meta.shareTitle ?? title,
    shareDescription: meta.shareDescription ?? description,
    url: meta.canonical ? SITE_URL + meta.canonical : undefined,
  };
}
