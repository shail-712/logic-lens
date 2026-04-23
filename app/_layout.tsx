import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="analysis" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="interview" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
