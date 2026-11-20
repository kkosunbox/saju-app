import Screen from '@/screens/content/StarDetailScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 천생연분 스타 목록과 같은 프로필로 본다
export default withContentScope(Screen, 'celebrity-match');
