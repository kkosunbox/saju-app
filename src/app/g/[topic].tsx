import { Redirect, useLocalSearchParams } from 'expo-router';
import GuideScreen from '@/screens/GuideScreen';
import { GUIDE_SLUGS, guideSlugOf } from '@/content/guides';

export default function GuideRoute() {
  const { topic } = useLocalSearchParams<{ topic: string }>();
  const slug = guideSlugOf(`/g/${topic}`);
  return slug ? <GuideScreen slug={slug} /> : <Redirect href="/" />;
}

// 웹 정적 렌더링: 경로별 HTML을 미리 만든다.
export function generateStaticParams() {
  return GUIDE_SLUGS.map((topic) => ({ topic }));
}
