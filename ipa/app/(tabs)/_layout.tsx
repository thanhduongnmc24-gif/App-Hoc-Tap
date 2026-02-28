import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native'; 
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();
  
  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <Tabs screenOptions={{ 
          headerShown: false,
          tabBarStyle: { 
            backgroundColor: colors.card, 
            borderTopColor: colors.border,
            height: 60, 
            paddingBottom: 5 
          },
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: colors.subText,
          tabBarLabelStyle: { fontSize: 13, fontWeight: 'bold' }
        }}>
        
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Học Toán', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "calculator" : "calculator-outline"} size={28} color={color} /> 
            ) 
          }} 
        />

        {/* TAB TIẾNG VIỆT MỚI TONE-SUR-TON */}
        <Tabs.Screen 
          name="tiengviet" 
          options={{ 
            title: 'Tiếng Việt', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "book" : "book-outline"} size={28} color={color} /> 
            ) 
          }} 
        />

        <Tabs.Screen 
          name="settings" 
          options={{ 
            title: 'Cài đặt', 
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} /> 
            ) 
          }} 
        />
      </Tabs>
    </View>
  );
}