export { default } from '@/screens/AnalysisDetailScreen';

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return ['saju', 'thai', 'mbti', 'blood'].map((source) => ({ source }));
}
