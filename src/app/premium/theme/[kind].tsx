import Screen from '@/screens/premium/ThemeScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 누구 것을 보는지(프로필 · 예전 기록)를 이 화면 안에서 고른다
export default withContentScope(Screen, 'premium/theme', 'kind');

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return ['love', 'money', 'career'].map((kind) => ({ kind }));
}
