import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { GameProvider } from '@/stores/GameContext';
import { GAME_COLORS } from '@/constants/game';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: GAME_COLORS.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="lobby" 
            options={{ 
              animation: 'slide_from_bottom',
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="game" 
            options={{ 
              animation: 'fade',
              gestureEnabled: false,
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </GameProvider>
    </SafeAreaProvider>
  );
}
