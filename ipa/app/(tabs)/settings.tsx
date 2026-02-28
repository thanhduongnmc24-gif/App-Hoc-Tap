import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [maxLimit, setMaxLimit] = useState('10');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || 'Chưa cập nhật email');
      setUserId(user.id);
      
      const { data, error } = await supabase
        .from('be_hoc_toan_data')
        .select('max_limit')
        .eq('user_id', user.id)
        .single();
        
      if (data) setMaxLimit(data.max_limit.toString());
      if (error && error.code !== 'PGRST116') {
         console.log('Lỗi lấy dữ liệu:', error.message);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) return;
    setLoading(true);
    const limitNum = parseInt(maxLimit) || 10;
    
    const { data: existingData } = await supabase.from('be_hoc_toan_data').select('id').eq('user_id', userId).single();
    
    if (existingData) {
        await supabase.from('be_hoc_toan_data').update({ max_limit: limitNum }).eq('id', existingData.id);
    } else {
        await supabase.from('be_hoc_toan_data').insert([{ user_id: userId, max_limit: limitNum }]);
    }
    
    setLoading(false);
    Alert.alert('Thành công', 'Đã lưu cấu hình bài tập cho bé!');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Lỗi', error.message);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Bọc toàn bộ nội dung trong ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
             <View style={styles.profileIcon}>
                <Ionicons name="settings" size={40} color="white" />
             </View>
             <Text style={[styles.email, { color: colors.text }]}>{userEmail}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { marginBottom: 20 }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Giới hạn phép toán</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              keyboardType="number-pad"
              value={maxLimit}
              onChangeText={setMaxLimit}
              maxLength={3}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={loading}>
            <Text style={styles.saveText}>{loading ? 'Đang lưu...' : 'Lưu Cài Đặt'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={{ color: colors.text, fontSize: 16 }}>Chế độ tối (Dark Mode)</Text>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
          </View>
        </View>

        {/* Cục Spacer này dùng để đẩy nút Đăng xuất xuống sát dưới cùng */}
        <View style={{ flex: 1, minHeight: 40 }} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { alignItems: 'center', marginVertical: 20 },
  profileIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  email: { fontSize: 18, fontWeight: '600' },
  section: { padding: 20, borderRadius: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 18, width: 80, textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});