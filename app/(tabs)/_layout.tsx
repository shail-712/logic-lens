import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="console" />
      <Tabs.Screen name="practice" />
      <Tabs.Screen name="operator" />
    </Tabs>
  );
}
