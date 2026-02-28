import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { TabProvider } from '../context/TabContext';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseConfig';
import Auth from './auth'; 
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // TÈO ĐÃ NẠP FONT CHỮ TẬP VIẾT VÀO ĐÂY NÈ
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    'HP001': require('../assets/fonts/HP001.ttf'), 
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || loadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <TabProvider>
        {session && session.user ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <Auth />
        )}
      </TabProvider>
    </ThemeProvider>
  );
}