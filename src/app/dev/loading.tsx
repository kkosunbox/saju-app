import { Redirect } from 'expo-router';

/**
 * 개발용: 풀이 로딩 연출 비교 (/dev/loading). 로컬 개발 서버(__DEV__)에서만 열린다.
 * 배포 빌드에서는 __DEV__가 false로 바뀌어 아래 require가 통째로 빠지고, 이 주소는 첫 화면으로 돌려보낸다.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- 배포 번들에서 빠지도록 __DEV__ 안에서만 불러온다
const LoadingLab: React.ComponentType | null = __DEV__ ? require('@/screens/dev/LoadingLabScreen').default : null;

export default function DevLoading() {
  return LoadingLab ? <LoadingLab /> : <Redirect href="/" />;
}
