export { default } from '@/screens/CategoryDetailScreen';

// 웹 정적 렌더링: 카테고리별 HTML을 미리 생성한다.
export function generateStaticParams() {
  return ['love', 'money', 'work', 'relationship'].map(category => ({ category }));
}
