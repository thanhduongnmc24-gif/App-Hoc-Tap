import React from 'react';
import { Stack } from 'expo-router';
// Nhớ kiểm tra lại đường dẫn tới ThemeContext cho chuẩn nha anh hai
import { ThemeProvider } from '../context/ThemeContext'; 

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Bay thẳng vào thư mục (tabs) luôn, không đăng nhập đăng xuất gì sất */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Nếu anh hai có màn hình lỗi hay modal gì ngoài tabs thì cứ thêm ở đây */}
        <Stack.Screen name="+not-found" options={{ title: 'Ôi hỏng!' }} />
      </Stack>
    </ThemeProvider>
  );
}