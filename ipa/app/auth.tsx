import React, { useState } from 'react';
import { Alert, StyleSheet, View, AppState, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../utils/supabaseConfig';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Theo dõi trạng thái app để làm mới phiên đăng nhập
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Lỗi Đăng Nhập', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Lỗi Đăng Ký', error.message);
    else if (!session) Alert.alert('Thành công', 'Vui lòng kiểm tra hộp thư đến để xác thực email!');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Bọc ScrollView để có thể vuốt lên vuốt xuống thoải mái */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Ionicons name="school" size={80} color="#F59E0B" />
          <Text style={styles.title}>Bé Học Toán</Text>
          <Text style={styles.subtitle}>Cùng Phương Linh học giỏi nhé!</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="nhap.email@cua.anh"
              placeholderTextColor={colors.subText}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="Mật khẩu bí mật"
              placeholderTextColor={colors.subText}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} disabled={loading} onPress={signInWithEmail}>
            <Text style={styles.loginBtnText}>{loading ? 'Đang chờ...' : 'ĐĂNG NHẬP'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupBtn} disabled={loading} onPress={signUpWithEmail}>
            <Text style={styles.signupBtnText}>ĐĂNG KÝ TÀI KHOẢN MỚI</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#B45309', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 5 },
  formContainer: { padding: 25, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16 },
  loginBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  signupBtn: { backgroundColor: 'transparent', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#10B981' },
  signupBtnText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 }
});