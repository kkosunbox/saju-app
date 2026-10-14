export { default } from '@/screens/premium/ThemeScreen';

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return ['love', 'money', 'career'].map((kind) => ({ kind }));
}
