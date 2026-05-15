import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { GIOI_IMAGES, TOT_IMAGES, CAN_CO_GAN_IMAGES } from '../../constants/kho_anh';
import { GIOI_VIDEOS, TOT_VIDEOS, CAN_CO_GAN_VIDEOS } from '../../constants/kho_video';

// TÈO ĐÃ ĐỔI TÊN IMPORT CHO ĐÚNG VỚI FILE CỦA BA NÈ
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';
// (Lưu ý: Ba nhớ đảm bảo file kho_dong_vat.ts cũng export ra DONG_VAT_DATA giống vậy nha)
//import { DONG_VAT_DATA } from '../../constants/kho_dong_vat';

// Phân loại danh mục
const CATEGORIES = [
  { id: 'tap_doc_image', name: 'Ảnh Tập Đọc', type: 'image', defaults: TAP_DOC_DATA || [] },
  //{ id: 'noi_tu_image', name: 'Ảnh Nối Từ', type: 'image', defaults: DONG_VAT_DATA || [] },
  { id: 'gioi_image', name: 'Ảnh Bé Xuất Sắc', type: 'image', defaults: GIOI_IMAGES || [] },
  { id: 'gioi_video', name: 'Video Bé Xuất Sắc', type: 'video', defaults: GIOI_VIDEOS || [] },
  { id: 'tot_image', name: 'Ảnh Bé Làm Tốt', type: 'image', defaults: TOT_IMAGES || [] },
  { id: 'tot_video', name: 'Video Bé Làm Tốt', type: 'video', defaults: TOT_VIDEOS || [] },
  { id: 'can_co_gan_image', name: 'Ảnh Bé Cố Gắng', type: 'image', defaults: CAN_CO_GAN_IMAGES || [] },
  { id: 'can_co_gan_video', name: 'Video Bé Cố Gắng', type: 'video', defaults: CAN_CO_GAN_VIDEOS || [] },
];

export type CustomMedia = { id: string; uri: string; name: string; categoryId: string; type: string; isActive: boolean; };

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const [userEmail] = useState('Chế độ Offline');
  const [maxLimit, setMaxLimit] = useState('10');
  const [childName, setChildName] = useState('Bé yêu'); 
  const [loading, setLoading] = useState(false);

  const [showMediaManager, setShowMediaManager] = useState(false);
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [customMedia, setCustomMedia] = useState<CustomMedia[]>([]);
  const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);
  const [renamedDefaults, setRenamedDefaults] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLocalData();
  }, []);

  const fetchLocalData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('childName');
      if (savedName) setChildName(savedName);

      const savedLimit = await AsyncStorage.getItem('maxLimit');
      if (savedLimit) setMaxLimit(savedLimit);

      const savedMedia = await AsyncStorage.getItem('customMedia');
      if (savedMedia) setCustomMedia(JSON.parse(savedMedia));

      const savedDisabled = await AsyncStorage.getItem('disabledDefaults');
      if (savedDisabled) setDisabledDefaults(JSON.parse(savedDisabled));

      const savedRenamed = await AsyncStorage.getItem('renamedDefaults');
      if (savedRenamed) setRenamedDefaults(JSON.parse(savedRenamed));
    } catch (e) {
      console.log('Lỗi lấy dữ liệu:', e);
    }
  };

  const saveBaseSettings = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('childName', childName);
      await AsyncStorage.setItem('maxLimit', maxLimit || '10');
      Alert.alert('Thành công', 'Đã lưu cấu hình học tập cho bé!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt.');
    } finally {
      setLoading(false);
    }
  };

  const saveMediaState = async (newCustom: CustomMedia[], newDisabled: string[], newRenamed: Record<string, string>) => {
    await AsyncStorage.setItem('customMedia', JSON.stringify(newCustom));
    await AsyncStorage.setItem('disabledDefaults', JSON.stringify(newDisabled));
    await AsyncStorage.setItem('renamedDefaults', JSON.stringify(newRenamed));
  };

  const toggleDefaultMedia = async (index: number) => {
    const key = `${selectedCat.id}_${index}`;
    let newDisabled = [...disabledDefaults];
    if (newDisabled.includes(key)) {
      newDisabled = newDisabled.filter(k => k !== key); 
    } else {
      newDisabled.push(key); 
    }
    setDisabledDefaults(newDisabled);
    await saveMediaState(customMedia, newDisabled, renamedDefaults);
  };

  const updateDefaultMediaName = async (index: number, newName: string) => {
    const key = `${selectedCat.id}_${index}`;
    const newRenamed = { ...renamedDefaults, [key]: newName };
    setRenamedDefaults(newRenamed);
    await saveMediaState(customMedia, disabledDefaults, newRenamed);
  };

  const toggleCustomMedia = async (id: string) => {
    const newCustom = customMedia.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
    setCustomMedia(newCustom);
    await saveMediaState(newCustom, disabledDefaults, renamedDefaults);
  };

  const updateCustomMediaName = async (id: string, newName: string) => {
    const newCustom = customMedia.map(m => m.id === id ? { ...m, name: newName } : m);
    setCustomMedia(newCustom);
    await saveMediaState(newCustom, disabledDefaults, renamedDefaults);
  };

  const pickAndSaveMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: selectedCat.type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const docDir = (FileSystem as any).documentDirectory;
      
      if (!docDir) {
        Alert.alert('Lỗi', 'Không tìm thấy thư mục lưu trữ trên thiết bị này!');
        return;
      }

      const sourceUri = result.assets[0].uri;
      const filename = sourceUri.split('/').pop() || `media_${Date.now()}`;
      const destUri = `${docDir}${filename}`;

      try {
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });
        
        const newItem: CustomMedia = {
          id: Date.now().toString(),
          uri: destUri,
          name: `Từ vựng mới`, 
          categoryId: selectedCat.id,
          type: selectedCat.type,
          isActive: true
        };
        
        const newCustom = [...customMedia, newItem];
        setCustomMedia(newCustom);
        await saveMediaState(newCustom, disabledDefaults, renamedDefaults);
        Alert.alert('Thành công', 'Đã thêm vào kho! Ba nhớ đổi tên nhé.');
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể lưu file này vào máy.');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Thông báo', 'App đang chạy hoàn toàn trên máy, không cần đăng xuất đâu ba nhé!');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
             <View style={styles.profileIcon}>
                <Ionicons name="school" size={40} color="white" />
             </View>
             <Text style={[styles.email, { color: colors.text }]}>{userEmail}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { marginBottom: 15 }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Tên của bé:</Text>
            <TextInput style={[styles.inputName, { color: colors.text, borderColor: colors.border }]} value={childName} onChangeText={setChildName} />
          </View>
          
          <View style={[styles.row, { marginBottom: 20 }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>Giới hạn toán:</Text>
            <TextInput style={[styles.inputLimit, { color: colors.text, borderColor: colors.border }]} keyboardType="number-pad" value={maxLimit} onChangeText={setMaxLimit} maxLength={3} />
          </View>
          
          <TouchableOpacity style={styles.saveBtn} onPress={saveBaseSettings} disabled={loading}>
            <Text style={styles.saveText}>{loading ? 'Đang lưu...' : 'Lưu Cài Đặt Chung'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Cá nhân hóa hình ảnh/video:</Text>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#10B981' }]} onPress={() => setShowMediaManager(true)}>
            <Ionicons name="images" size={20} color="white" style={{ position: 'absolute', left: 15, top: 15 }} />
            <Text style={styles.saveText}>Mở Kho Tư Liệu Của Bé</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={{ color: colors.text, fontSize: 16 }}>Chế độ tối (Dark Mode)</Text>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showMediaManager} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Quản Lý Tư Liệu</Text>
            <TouchableOpacity onPress={() => setShowMediaManager(false)}>
              <Ionicons name="close-circle" size={36} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 10 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catBtn, selectedCat.id === cat.id && styles.catBtnActive]} 
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={[styles.catBtnText, selectedCat.id === cat.id && { color: 'white' }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.mediaList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tư liệu có sẵn trong App:</Text>
            {selectedCat.defaults.map((item: any, index: number) => {
              const itemKey = `${selectedCat.id}_${index}`;
              const isOff = disabledDefaults.includes(itemKey);
              
              // TÈO ĐÃ TÁCH XỬ LÝ ẢNH Ở ĐÂY ĐỂ TRÁNH LỖI TRẮNG MÀN HÌNH
              const imageSource = item?.image ? item.image : item;
              // Nếu là mảng Tập Đọc/Nối từ, lấy tên mặc định từ thuộc tính word, nếu không thì lấy tên chung chung
              const defaultName = item?.word ? item.word : (selectedCat.id.includes('tap_doc') ? 'Từ vựng ' + (index+1) : `Ảnh/Video số ${index + 1}`);
              const displayName = renamedDefaults[itemKey] || defaultName;
              
              return (
                <View key={itemKey} style={[styles.mediaItem, { backgroundColor: colors.card }]}>
                  <View style={styles.mediaPreview}>
                    {selectedCat.type === 'image' ? (
                      <Image source={imageSource} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="play" size={24} color="white" />
                      </View>
                    )}
                  </View>
                  <View style={styles.mediaInfo}>
                    <TextInput 
                      style={[styles.editNameInput, { color: colors.text, borderColor: colors.border }]} 
                      value={displayName} 
                      onChangeText={(val) => updateDefaultMediaName(index, val)}
                      placeholder="Gõ từ vựng vào đây..."
                    />
                  </View>
                  <Switch value={!isOff} onValueChange={() => toggleDefaultMedia(index)} trackColor={{ true: '#10B981', false: '#D1D5DB' }} />
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Tư liệu Ba tự thêm:</Text>
            {customMedia.filter((m: CustomMedia) => m.categoryId === selectedCat.id).length === 0 ? (
              <Text style={{ color: 'gray', fontStyle: 'italic', marginLeft: 15 }}>Chưa có mục nào được thêm.</Text>
            ) : null}
            
            {customMedia.filter((m: CustomMedia) => m.categoryId === selectedCat.id).map((item: CustomMedia) => (
              <View key={item.id} style={[styles.mediaItem, { backgroundColor: colors.card }]}>
                 <Image source={{ uri: item.uri }} style={styles.thumb} />
                 <View style={styles.mediaInfo}>
                    <TextInput 
                      style={[styles.editNameInput, { color: colors.text, borderColor: colors.border }]} 
                      value={item.name} 
                      onChangeText={(val) => updateCustomMediaName(item.id, val)}
                      placeholder="Gõ từ vựng vào đây..."
                    />
                 </View>
                 <Switch value={item.isActive} onValueChange={() => toggleCustomMedia(item.id)} trackColor={{ true: '#10B981', false: '#D1D5DB' }} />
              </View>
            ))}
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
             <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#F59E0B' }]} onPress={pickAndSaveMedia}>
                <Ionicons name="add-circle" size={24} color="white" style={{ position: 'absolute', left: 15, top: 13 }} />
                <Text style={styles.saveText}>Thêm {selectedCat.type === 'image' ? 'Ảnh' : 'Video'} Mới</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { alignItems: 'center', marginVertical: 20 },
  profileIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  email: { fontSize: 18, fontWeight: '600' },
  section: { padding: 20, borderRadius: 15, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputName: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 18, flex: 1, marginLeft: 15, fontWeight: 'bold' },
  inputLimit: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 18, width: 80, textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  modalContainer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  catScroll: { maxHeight: 60, minHeight: 60, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#E5E7EB', alignSelf: 'center' },
  catBtnActive: { backgroundColor: '#3B82F6' },
  catBtnText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563' },
  mediaList: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  mediaItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  mediaPreview: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden', marginRight: 15 },
  thumb: { width: '100%', height: '100%' },
  mediaInfo: { flex: 1, justifyContent: 'center' },
  editNameInput: { borderWidth: 1, borderRadius: 5, padding: 8, fontSize: 16, marginTop: 5, marginRight: 10, fontWeight: 'bold' }
});