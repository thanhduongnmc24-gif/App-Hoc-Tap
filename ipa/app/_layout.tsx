import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { TabProvider } from '../context/TabContext';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  // TÈO ĐÃ NẠP FONT CHỮ TẬP VIẾT VÀO ĐÂY NÈ
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    'HP001': require('../assets/fonts/HP001.ttf'), 
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <TabProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </TabProvider>
    </ThemeProvider>
  );
}