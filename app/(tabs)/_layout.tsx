import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';
import { COLORS } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: COLORS.bgPrimary },
      }}
    >
      <Tabs.Screen name="console" options={{ title: 'CONSOLE' }} />
      <Tabs.Screen name="practice" options={{ title: 'PRACTICE' }} />
      <Tabs.Screen name="operator" options={{ title: 'OPERATOR' }} />
    </Tabs>
  );
}

