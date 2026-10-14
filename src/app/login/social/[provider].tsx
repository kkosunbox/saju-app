export { default } from '@/screens/auth/SocialLoginScreen';

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return ['kakao', 'naver', 'apple', 'google'].map((provider) => ({ provider }));
}
