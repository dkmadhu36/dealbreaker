import { Stack } from 'expo-router';
import { GAME_COLORS } from '@/constants/game';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: GAME_COLORS.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
