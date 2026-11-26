import Screen from '@/screens/content/DayStemScreen';
import { withContentScope } from '@/context/ContentScopeContext';

// 뽑은 결과는 뽑은 때의 정보로 그린다 (MBTI를 사주로 추정한 프로필은 실제 MBTI를 받은 뒤에 뽑는다)
export default withContentScope(Screen, 'day-stem');
