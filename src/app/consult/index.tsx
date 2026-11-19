import { Redirect } from 'expo-router';

/** 예전 운알톡 탭 주소 — 운알톡이 첫 화면(/)이 되었다 */
export default function ConsultRedirect() {
  return <Redirect href="/" />;
}
