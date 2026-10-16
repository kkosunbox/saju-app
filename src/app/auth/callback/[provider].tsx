// 일부 콘솔에 등록된 다른 콜백 경로도 같은 화면으로 받는다
export { default } from '@/screens/auth/OAuthCallbackScreen';

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return ['kakao', 'naver', 'google'].map((provider) => ({ provider }));
}
