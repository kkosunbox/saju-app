export { default } from '@/screens/AnalysisDetailScreen';

// 웹 정적 렌더링: 관점별 HTML을 미리 생성한다.
export function generateStaticParams() {
  return ['saju', 'thai', 'mbti', 'blood'].map(source => ({ source }));
}
