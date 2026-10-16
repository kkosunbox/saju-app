import { Platform } from 'react-native';
import OnboardingScreen from '@/screens/OnboardingScreen';
import LandingScreen from '@/screens/LandingScreen';

/** 첫 화면: 앱은 온보딩 슬라이드, 웹은 서비스 소개 랜딩 */
export default Platform.OS === 'web' ? LandingScreen : OnboardingScreen;
