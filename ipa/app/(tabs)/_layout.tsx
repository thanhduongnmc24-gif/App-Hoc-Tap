import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F59E0B', 
        tabBarInactiveTintColor: 'gray',  
        tabBarStyle: { 
          backgroundColor: colors.card,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          height: 65, 
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerShown: false, 
      }}>
      
      {/* 1. TAB TOÁN HỌC */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Toán',
          tabBarIcon: ({ color }) => <Ionicons name="calculator" size={28} color={color} />,
        }}
      />

      {/* 2. TAB TIẾNG VIỆT */}
      <Tabs.Screen
        name="tiengviet"
        options={{
          title: 'Tiếng Việt',
          tabBarIcon: ({ color }) => <Ionicons name="text" size={28} color={color} />,
        }}
      />

      {/* 3. TAB TẬP ĐỌC */}
      <Tabs.Screen
        name="tapdoc"
        options={{
          title: 'Tập Đọc',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={28} color={color} />,
        }}
      />

      {/* 4. TAB BÀI TẬP (MỚI THÊM NÈ ĐẠI CA) */}
      <Tabs.Screen
        name="baitap"
        options={{
          title: 'Bài Tập',
          tabBarIcon: ({ color }) => <Ionicons name="pencil" size={28} color={color} />,
        }}
      />

      {/* 5. TAB CÀI ĐẶT */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài Đặt',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={28} color={color} />,
        }}
      />

    </Tabs>
  );
}