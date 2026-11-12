/**
 * 앱 진입점. expo-router 를 그대로 띄우고, Android 홈 화면 위젯 작업을 등록한다
 * (위젯은 앱이 꺼져 있어도 이 번들을 헤드리스로 불러 그린다 — src/widgets/fortuneWidgetTask.android.tsx).
 */
import 'expo-router/entry';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
  const { fortuneWidgetTaskHandler } = require('./src/widgets/fortuneWidgetTask.android') as typeof import('./src/widgets/fortuneWidgetTask.android');
  registerWidgetTaskHandler(fortuneWidgetTaskHandler);
}
