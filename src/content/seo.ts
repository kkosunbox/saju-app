/**
 * 웹 검색·공유 미리보기용 경로별 메타 — src/components/SiteHead.tsx 가 그린다.
 * 검색에 올리는 건 랜딩(/)과 약관(public/terms.html · privacy.html)뿐이고,
 * 나머지는 프로필이 있어야 열리거나 개인 화면이라 noindex.
 */
import { BRAND } from '@/components/BrandMark';

/** 운영 웹 주소 — canonical · og:url · sitemap 의 절대 주소 */
export const SITE_URL = 'https://woonpick.com';

/** 정식 이름은 운Pick이지만 '운픽'으로 찾는 사람도 많아 제목·설명에 함께 적는다 */
export const SITE_NAME = `${BRAND.name}(${BRAND.ko})`;
export const SITE_TITLE = `${SITE_NAME} · ${BRAND.slogan}`;
export const SITE_DESCRIPTION = `${SITE_NAME}은 사주 · 별자리 · MBTI · 혈액형을 겹쳐 읽는 오늘의 운세예요. 1분이면 나오고, 가입하지 않아도 돼요.`;

export interface PageMeta {
  title: string;
  description?: string;
  /** 검색에 올리는 주소 (SITE_URL 기준 경로). 없으면 noindex */
  canonical?: string;
}

const LANDING: PageMeta = { title: SITE_TITLE, description: SITE_DESCRIPTION, canonical: '/' };

/** 정확히 같은 경로 */
const EXACT: Record<string, PageMeta> = {
  '/': LANDING,
  '/onboarding': LANDING,
  '/legal/terms': { title: '서비스 이용약관', canonical: '/terms' },
  '/legal/privacy': { title: '개인정보처리방침', canonical: '/privacy' },
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

export function pageMeta(pathname: string): PageMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return EXACT[path] ?? PREFIX.find(([p]) => path.startsWith(p))?.[1] ?? { title: '페이지를 찾을 수 없어요' };
}
