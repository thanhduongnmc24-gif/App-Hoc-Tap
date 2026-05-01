import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator, Modal, Image, TextInput, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import kho mặc định để gom chung vào quản lý
import { GIOI_IMAGES, TOT_IMAGES, CAN_CO_GAN_IMAGES, THU_THACH_IMAGES } from '../../constants/kho_anh';
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';
const KHO_ANH_TO_MAU: any[] = []; 

const { width } = Dimensions.get('window');

type MathType = 'cong' | 'tru' | 'ca_hai';
type MediaType = 'to_mau' | 'tinh_diem' | 'tap_doc' | 'thu_thach';

interface CustomMedia {
  id: string;
  uri: any; 
  name: string;
  category: MediaType;
  type: 'image' | 'video';
  isDefault?: boolean; 
}

const CATEGORY_NAMES = {
  to_mau: '🎨 Ảnh Tô Màu',
  tinh_diem: '💯 Ảnh Tính Điểm',
  tap_doc: '📚 Ảnh Tập Đọc',
  thu_thach: '🎲 Ảnh Thử Thách',
};

// Hàm gán ID và build danh sách mặc định
const buildDefaultMedia = (category: MediaType): CustomMedia[] => {
  if (category === 'tinh_diem') {
    let arr: CustomMedia[] = [];
    GIOI_IMAGES.forEach((img, i) => arr.push({ id: `default_tinh_diem_gioi_${i}`, uri: img, name: `Giỏi ${i+1}`, category, type: 'image', isDefault: true }));
    TOT_IMAGES.forEach((img, i) => arr.push({ id: `default_tinh_diem_tot_${i}`, uri: img, name: `Tốt ${i+1}`, category, type: 'image', isDefault: true }));
    CAN_CO_GAN_IMAGES.forEach((img, i) => arr.push({ id: `default_tinh_diem_can_${i}`, uri: img, name: `Cố gắng ${i+1}`, category, type: 'image', isDefault: true }));
    return arr;
  }
  if (category === 'tap_doc') {
    return (TAP_DOC_DATA || []).map((item, i) => ({ id: `default_tap_doc_${i}`, uri: item.image, name: item.word, category, type: 'image', isDefault: true }));
  }
  if (category === 'thu_thach') {
    return (THU_THACH_IMAGES || []).map((img, i) => ({ id: `default_thu_thach_${i}`, uri: img, name: `Thử thách ${i+1}`, category, type: 'image', isDefault: true }));
  }
  if (category === 'to_mau') {
    return (KHO_ANH_TO_MAU || []).map((img, i) => ({ id: `default_to_mau_${i}`, uri: img, name: `Tô màu ${i+1}`, category, type: 'image', isDefault: true }));
  }
  return [];
};

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme(); 
  const [maxLimit, setMaxLimit] = useState(10);
  const [mathType, setMathType] = useState<MathType>('ca_hai'); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isDarkMode = theme === 'dark';

  const [mediaData, setMediaData] = useState<Record<MediaType, CustomMedia[]>>({ to_mau: [], tinh_diem: [], tap_doc: [], thu_thach: [] });
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [renamed, setRenamed] = useState<Record<string, string>>({});
  
  const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);
  const [selectedItem, setSelectedItem] = useState<CustomMedia | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchSettings();
    loadCustomMedia();
  }, []);

  const fetchSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('@settings_toan');
      if (storedSettings) {
        const { max_limit, loai_phep_tinh } = JSON.parse(storedSettings);
        setMaxLimit(max_limit || 10);
        setMathType((loai_phep_tinh as MathType) || 'ca_hai');
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const updateSettings = async (newLimit: number, newType: MathType) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('@settings_toan', JSON.stringify({ max_limit: newLimit, loai_phep_tinh: newType }));
    } catch (error) {} finally { setSaving(false); }
  };

  const loadCustomMedia = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
      if (storedData) setMediaData(JSON.parse(storedData));
      
      const storedBlacklist = await AsyncStorage.getItem('@blacklist_media');
      if (storedBlacklist) setBlacklist(JSON.parse(storedBlacklist));

      const storedRenamed = await AsyncStorage.getItem('@renamed_media');
      if (storedRenamed) setRenamed(JSON.parse(storedRenamed));
    } catch (error) {}
  };

  const handleAddMedia = async () => {
    if (!activeCategory) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      if (Platform.OS !== 'web') Alert.alert("Cấp quyền", "Anh hai cho Tèo xin quyền vào kho ảnh nha!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: false, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let finalUri = asset.uri;

      if (Platform.OS !== 'web') {
        const fileName = asset.uri.split('/').pop() || `file_${Date.now()}`;
        try {
          // Xử lý mượt mà, lỗi thì fallback thẳng về asset.uri không cần hiện thông báo
          // @ts-ignore
          if (FileSystem.documentDirectory) {
            // @ts-ignore
            const newPath = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.copyAsync({ from: asset.uri, to: newPath });
            finalUri = newPath; 
          }
        } catch (error) {
          finalUri = asset.uri; 
        }
      }

      const newItem: CustomMedia = {
        id: `custom_${Date.now()}`, uri: finalUri, name: `Ảnh tự thêm ${Date.now().toString().slice(-4)}`,
        category: activeCategory, type: asset.type === 'video' ? 'video' : 'image', isDefault: false
      };
      const updatedData = { ...mediaData, [activeCategory]: [...mediaData[activeCategory], newItem] };
      await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedData));
      setMediaData(updatedData);
    }
  };

  const handleRename = async () => {
    if (!selectedItem || !editName.trim()) return;
    const newName = editName.trim();
    if (selectedItem.isDefault) {
       const newRenamed = { ...renamed, [selectedItem.id]: newName };
       await AsyncStorage.setItem('@renamed_media', JSON.stringify(newRenamed));
       setRenamed(newRenamed);
    } else {
       const updatedCategoryList = mediaData[selectedItem.category].map(item => item.id === selectedItem.id ? { ...item, name: newName } : item);
       const updatedData = { ...mediaData, [selectedItem.category]: updatedCategoryList };
       await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedData));
       setMediaData(updatedData);
    }
    setSelectedItem({ ...selectedItem, name: newName });
    if (Platform.OS !== 'web') Alert.alert('Thành công', 'Đã đổi tên mượt mà!');
  };

  const handleToggleVisibility = async (val: boolean) => {
    if (!selectedItem) return;
    let newBlacklist = [...blacklist];
    if (val) {
      newBlacklist = newBlacklist.filter(id => id !== selectedItem.id); // Bật -> Xóa khỏi sổ đen
    } else {
      if (!newBlacklist.includes(selectedItem.id)) newBlacklist.push(selectedItem.id); // Tắt -> Thêm vào sổ đen
    }
    await AsyncStorage.setItem('@blacklist_media', JSON.stringify(newBlacklist));
    setBlacklist(newBlacklist);
  };

  const handleDelete = async () => {
    if (!selectedItem || selectedItem.isDefault) return;
    const executeDelete = async () => {
      try {
        if (Platform.OS !== 'web' && selectedItem.uri.includes(FileSystem.documentDirectory as string)) {
            await FileSystem.deleteAsync(selectedItem.uri, { idempotent: true });
        }
        const updatedCategoryList = mediaData[selectedItem.category].filter(item => item.id !== selectedItem.id);
        const updatedData = { ...mediaData, [selectedItem.category]: updatedCategoryList };
        await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedData));
        setMediaData(updatedData);
        setSelectedItem(null); 
      } catch (error) {}
    };
    if (Platform.OS !== 'web') {
        Alert.alert("Xóa", "Anh hai chắc xóa luôn file này chứ?", [ { text: "Hủy", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: executeDelete } ]);
    } else {
        if (window.confirm("Chắc xóa chưa đại ca?")) executeDelete();
    }
  };

  const getCombinedList = (cat: MediaType) => {
    const defaults = buildDefaultMedia(cat).map(item => ({ ...item, name: renamed[item.id] || item.name }));
    const customs = (mediaData[cat] || []).map(item => ({ ...item, name: renamed[item.id] || item.name }));
    return [...defaults, ...customs];
  };

  if (loading) return <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Cài Đặt</Text></View>

      <View style={[styles.section, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 2 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>🎁</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: '#166534', marginBottom: 0 }]}>Kho Dữ Liệu Của Bé</Text>
            <Text style={{ color: '#15803D', fontSize: 12 }}>Quản lý ảnh mặc định & tự thêm</Text>
          </View>
        </View>

        <View style={styles.mediaGrid}>
          {(Object.keys(CATEGORY_NAMES) as MediaType[]).map((key) => {
             const totalCount = getCombinedList(key).length;
             return (
              <TouchableOpacity key={key} style={styles.mediaCategoryBtn} onPress={() => setActiveCategory(key)}>
                <Text style={styles.mediaCategoryTitle}>{CATEGORY_NAMES[key]}</Text>
                <View style={styles.mediaBadge}><Text style={styles.mediaBadgeText}>{totalCount}</Text></View>
              </TouchableOpacity>
             );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao diện</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}><Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={isDarkMode ? "#818CF8" : "#F59E0B"} /><Text style={[styles.rowText, { color: colors.text }]}>Chế độ tối</Text></View>
          <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: "#D1D5DB", true: "#818CF8" }} thumbColor={isDarkMode ? "#4F46E5" : "#F3F4F6"} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Phạm vi con số</Text>
        <View style={styles.limitContainer}>
          <Text style={[styles.limitLabel, { color: colors.text }]}>Bé làm toán từ 1 đến:</Text>
          <TextInput style={styles.limitInput} keyboardType="number-pad" value={maxLimit ? String(maxLimit) : ''}
            onChangeText={(text) => { const val = parseInt(text.replace(/[^0-9]/g, ''), 10); setMaxLimit(isNaN(val) ? 0 : val); }}
            onEndEditing={() => { let finalLimit = maxLimit < 5 ? 5 : maxLimit; setMaxLimit(finalLimit); updateSettings(finalLimit, mathType); }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Loại phép tính</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'cong' && styles.typeBtnActive]} onPress={() => { setMathType('cong'); updateSettings(maxLimit, 'cong'); }}><Text style={styles.typeEmoji}>➕</Text><Text style={[styles.typeText, mathType === 'cong' && styles.typeTextActive]}>Phép Cộng</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'tru' && styles.typeBtnActive]} onPress={() => { setMathType('tru'); updateSettings(maxLimit, 'tru'); }}><Text style={styles.typeEmoji}>➖</Text><Text style={[styles.typeText, mathType === 'tru' && styles.typeTextActive]}>Phép Trừ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'ca_hai' && styles.typeBtnActive]} onPress={() => { setMathType('ca_hai'); updateSettings(maxLimit, 'ca_hai'); }}><Text style={styles.typeEmoji}>🎲</Text><Text style={[styles.typeText, mathType === 'ca_hai' && styles.typeTextActive]}>Cả Hai</Text></TouchableOpacity>
        </View>
      </View>

      <Modal visible={activeCategory !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveCategory(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeCategory ? CATEGORY_NAMES[activeCategory] : ''}</Text>
            <TouchableOpacity onPress={() => setActiveCategory(null)} style={styles.closeBtn}><Ionicons name="close-circle" size={32} color="#6B7280" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.galleryGrid}>
            <TouchableOpacity style={styles.addMediaBtn} onPress={handleAddMedia}>
              <Ionicons name="add" size={40} color="#4F46E5" /><Text style={{color: '#4F46E5', fontWeight: 'bold'}}>Thêm mới</Text>
            </TouchableOpacity>
            {activeCategory && getCombinedList(activeCategory).map((item) => {
              const isHidden = blacklist.includes(item.id);
              return (
                <TouchableOpacity key={item.id} style={[styles.thumbContainer, isHidden && { opacity: 0.3 }]} onPress={() => { setSelectedItem(item); setEditName(item.name); }}>
                  <Image source={typeof item.uri === 'string' ? { uri: item.uri } : item.uri} style={styles.thumbImage} />
                  {item.type === 'video' && <Ionicons name="play-circle" size={30} color="white" style={styles.videoIcon} />}
                  <View style={styles.thumbLabelBox}><Text style={styles.thumbLabelText} numberOfLines={1}>{item.name}</Text></View>
                  {isHidden && <View style={styles.hiddenBadge}><Ionicons name="eye-off" size={20} color="white" /></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={selectedItem !== null} transparent={true} animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.detailCloseBtn}><Ionicons name="close-circle" size={35} color="#EF4444" /></TouchableOpacity>
            {selectedItem && (
              <>
                <Image source={typeof selectedItem.uri === 'string' ? { uri: selectedItem.uri } : selectedItem.uri} style={styles.detailImage} resizeMode="contain" />
                
                <View style={styles.detailRow}>
                  <Text style={styles.inputLabel}>Tên (Dùng đọc / hiển thị):</Text>
                  <View style={styles.renameRow}>
                    <TextInput style={styles.nameInput} value={editName} onChangeText={setEditName} />
                    <TouchableOpacity style={styles.saveNameBtn} onPress={handleRename}><Text style={styles.saveNameText}>Lưu</Text></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>Hiển thị trong lúc học/chơi</Text>
                  <Switch value={!blacklist.includes(selectedItem.id)} onValueChange={handleToggleVisibility} />
                </View>

                {!selectedItem.isDefault && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash" size={20} color="white" /><Text style={styles.deleteBtnText}>Xóa file này</Text>
                  </TouchableOpacity>
                )}
                {selectedItem.isDefault && (
                   <Text style={{ color: 'gray', marginTop: 10, fontStyle: 'italic' }}>Ảnh mặc định không thể xóa, chỉ có thể Tắt hiển thị.</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '900' },
  section: { borderRadius: 20, padding: 16, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  limitLabel: { fontSize: 16, fontWeight: 'bold', marginRight: 15 },
  limitInput: { fontSize: 24, fontWeight: '900', color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, borderWidth: 2, borderColor: '#818CF8', minWidth: 100, textAlign: 'center' },
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  typeBtn: { width: '30%', paddingVertical: 12, borderRadius: 15, borderWidth: 2, alignItems: 'center', backgroundColor: 'white' },
  typeBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeEmoji: { fontSize: 24, marginBottom: 5 },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  typeTextActive: { color: '#4F46E5' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mediaCategoryBtn: { width: '48%', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#BBF7D0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mediaCategoryTitle: { fontSize: 14, fontWeight: 'bold', color: '#166534', flex: 1 },
  mediaBadge: { backgroundColor: '#22C55E', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  mediaBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeBtn: { padding: 5 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  addMediaBtn: { width: (width - 40) / 3, height: (width - 40) / 3, backgroundColor: '#E0E7FF', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#818CF8' },
  thumbContainer: { width: (width - 40) / 3, height: (width - 40) / 3, borderRadius: 15, overflow: 'hidden', backgroundColor: 'black' },
  thumbImage: { width: '100%', height: '100%', opacity: 0.8 },
  videoIcon: { position: 'absolute', top: '50%', left: '50%', transform: [{translateX: -15}, {translateY: -15}] },
  thumbLabelBox: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 5 },
  thumbLabelText: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
  hiddenBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailBox: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
  detailCloseBtn: { position: 'absolute', top: -15, right: -15, backgroundColor: 'white', borderRadius: 20 },
  detailImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 20, backgroundColor: '#E5E7EB' },
  detailRow: { width: '100%', marginBottom: 15 },
  inputLabel: { fontWeight: 'bold', color: '#4B5563', marginBottom: 5 },
  renameRow: { flexDirection: 'row', width: '100%' },
  nameInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F9FAFB' },
  saveNameBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10, marginLeft: 10 },
  saveNameText: { color: 'white', fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  deleteBtn: { flexDirection: 'row', backgroundColor: '#EF4444', width: '100%', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});
