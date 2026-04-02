import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

// Định nghĩa các loại phép tính cho rõ ràng
type MathType = 'cong' | 'tru' | 'ca_hai';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme(); 
  const [maxLimit, setMaxLimit] = useState(10);
  const [mathType, setMathType] = useState<MathType>('ca_hai'); // Mặc định là cả hai
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('be_hoc_toan_data')
          .select('max_limit, loai_phep_tinh')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setMaxLimit(data.max_limit || 10);
          setMathType((data.loai_phep_tinh as MathType) || 'ca_hai');
        }
      }
    } catch (error) {
      console.error('Lỗi lấy cài đặt:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newLimit: number, newType: MathType) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('be_hoc_toan_data')
          .update({ 
            max_limit: newLimit, 
            loai_phep_tinh: newType 
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không lưu được cài đặt rồi anh hai ơi!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cài Đặt</Text>
        {saving && <ActivityIndicator size="small" color="#4F46E5" />}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao diện</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={isDarkMode ? "#818CF8" : "#F59E0B"} />
            <Text style={[styles.rowText, { color: colors.text }]}>Chế độ tối</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: "#D1D5DB", true: "#818CF8" }} thumbColor={isDarkMode ? "#4F46E5" : "#F3F4F6"} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Phạm vi con số</Text>
        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderValue, { color: "#4F46E5" }]}>Trong phạm vi: {maxLimit}</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={maxLimit}
            onValueChange={setMaxLimit}
            onSlidingComplete={(val: number) => updateSettings(val, mathType)}
            minimumTrackTintColor="#4F46E5"
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor="#4F46E5"
          />
          <Text style={styles.hint}>Bé sẽ làm toán với các con số từ 1 đến {maxLimit}</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Loại phép tính</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeBtn, mathType === 'cong' && styles.typeBtnActive, { borderColor: colors.border }]}
            onPress={() => { setMathType('cong'); updateSettings(maxLimit, 'cong'); }}
          >
            <Text style={styles.typeEmoji}>➕</Text>
            <Text style={[styles.typeText, mathType === 'cong' && styles.typeTextActive]}>Phép Cộng</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeBtn, mathType === 'tru' && styles.typeBtnActive, { borderColor: colors.border }]}
            onPress={() => { setMathType('tru'); updateSettings(maxLimit, 'tru'); }}
          >
            <Text style={styles.typeEmoji}>➖</Text>
            <Text style={[styles.typeText, mathType === 'tru' && styles.typeTextActive]}>Phép Trừ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeBtn, mathType === 'ca_hai' && styles.typeBtnActive, { borderColor: colors.border }]}
            onPress={() => { setMathType('ca_hai'); updateSettings(maxLimit, 'ca_hai'); }}
          >
            <Text style={styles.typeEmoji}>🎲</Text>
            <Text style={[styles.typeText, mathType === 'ca_hai' && styles.typeTextActive]}>Cả Hai</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
        <Text style={styles.footerText}>Lưu trữ an toàn trên Supabase 🚀</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900' },
  section: { borderRadius: 20, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  sliderContainer: { alignItems: 'center' },
  sliderValue: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  hint: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  typeBtn: { width: '30%', paddingVertical: 12, borderRadius: 15, borderWidth: 2, alignItems: 'center', backgroundColor: 'white' },
  typeBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeEmoji: { fontSize: 24, marginBottom: 5 },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  typeTextActive: { color: '#4F46E5' },
  footer: { marginTop: 20, marginBottom: 40, alignItems: 'center' },
  footerText: { color: '#9CA3AF', fontSize: 14, marginBottom: 5 }
});