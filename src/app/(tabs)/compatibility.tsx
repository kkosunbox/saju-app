import Screen from '@/screens/CompatibilityScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 나로 볼 프로필을 다른 콘텐츠처럼 이 화면 안에서 고른다
export default withContentScope(Screen, 'compatibility');
