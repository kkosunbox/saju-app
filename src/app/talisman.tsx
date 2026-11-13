import Screen from '@/screens/content/TalismanScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 무료 콘텐츠는 대표 프로필로만 본다 (고르지 않음). 뽑은 결과는 뽑은 때의 정보로 그린다
export default withContentScope(Screen, 'talisman');
