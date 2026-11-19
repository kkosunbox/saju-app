import { Tabs } from 'expo-router';

/** 홈이 첫 화면. 뒤로 가기를 누르면 직전에 보던 탭으로 (backBehavior="history") */
export default function TabsLayout() {
  return (
    <Tabs backBehavior="history" screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="content" />
      <Tabs.Screen name="consult" />
      <Tabs.Screen name="compatibility" />
      <Tabs.Screen name="talks" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
