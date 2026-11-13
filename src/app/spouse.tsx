import Screen from '@/screens/content/SpouseScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 누구 것을 보는지(프로필 · 예전 기록)를 이 화면 안에서 고른다
export default withContentScope(Screen, 'spouse');
