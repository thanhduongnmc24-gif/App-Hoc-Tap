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

      {/* 2. TAB TIẾNG VIỆT (TÈO ĐÃ NÂNG CẤP THÀNH SIÊU THỊ TIẾNG VIỆT) */}
      <Tabs.Screen
        name="tiengviet"
        options={{
          title: 'Tiếng Việt',
          tabBarIcon: ({ color }) => <Ionicons name="text" size={28} color={color} />,
        }}
      />

      {/* TÈO ĐÃ ẨN 2 TAB NÀY ĐI BẰNG LỆNH href: null (Đại ca có thể xóa luôn 2 file tapdoc.tsx và baitap.tsx) */}
      <Tabs.Screen
        name="tapdoc"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="baitap"
        options={{ href: null }}
      />

      {/* 5. TAB LẬT HÌNH (RẠP XIẾC) */}
      <Tabs.Screen
        name="lathinh"
        options={{
          title: 'Rạp Xiếc',
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={28} color={color} />,
        }}
      />

      {/* 6. TAB CÀI ĐẶT */}
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