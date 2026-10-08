import { Tabs } from 'expo-router';
import BottomNavigation from '@/components/BottomNavigation';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={p => <BottomNavigation {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="fortune" />
      <Tabs.Screen name="compatibility" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
