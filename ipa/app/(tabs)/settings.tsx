import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator, Modal, Image, TextInput, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
// IMPORT BỘ PHÁT VIDEO ĐỂ XEM THỬ
import { Video, ResizeMode } from 'expo-av';

import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';
import { THU_THACH_IMAGES, GIOI_IMAGES, TOT_IMAGES } from '../../constants/kho_anh';
import { GIOI_VIDEOS, TOT_VIDEOS } from '../../constants/kho_video';

const { width } = Dimensions.get('window');

type MathType = 'cong' | 'tru' | 'ca_hai';
// TÈO THÊM DANH MỤC VIDEO VÀO ĐÂY
type MediaType = 'to_mau' | 'tinh_diem' | 'tap_doc' | 'thu_thach' | 'video_chuc_mung';

interface MediaItem {
  id: string;
  uri: any;
  name: string;
  category: MediaType;
  type: 'image' | 'video';
  isDefault: boolean;
}

const CATEGORY_NAMES = {
  to_mau: '🎨 Ảnh Tô Màu',
  tinh_diem: '💯 Ảnh Tính Điểm',
  video_chuc_mung: '🎬 Video Chúc Mừng',
  tap_doc: '📚 Ảnh Tập Đọc',
  thu_thach: '🎲 Ảnh Thử Thách',
};

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme(); 
  const [maxLimit, setMaxLimit] = useState(10);
  const [mathType, setMathType] = useState<MathType>('ca_hai'); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDarkMode = theme === 'dark';

  const [customMedia, setCustomMedia] = useState<Record<MediaType, MediaItem[]>>({ to_mau: [], tinh_diem: [], video_chuc_mung: [], tap_doc: [], thu_thach: [] });
  const [deletedDefaults, setDeletedDefaults] = useState<string[]>([]);
  const [renamedDefaults, setRenamedDefaults] = useState<Record<string, string>>({});
  
  const [activeCategory, setActiveCategory] = useState<MediaType | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editName, setEditName] = useState('');

  const getFullUri = (uri: string) => {
    if (!uri) return '';
    if (Platform.OS === 'web' || uri.startsWith('http') || uri.startsWith('file://') || uri.startsWith('data:') || uri.startsWith('blob:')) return uri;
    const fsAny = FileSystem as any;
    return `${fsAny.documentDirectory}${uri}`;
  };

  useEffect(() => {
    fetchSettings();
    loadAllMediaState();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('be_hoc_toan_data').select('max_limit, loai_phep_tinh').eq('user_id', user.id).single();
        if (data) { setMaxLimit(data.max_limit || 10); setMathType((data.loai_phep_tinh as MathType) || 'ca_hai'); }
      }
    } catch (error) {} finally { setLoading(false); }
  };

  const updateSettings = async (newLimit: number, newType: MathType) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('be_hoc_toan_data').update({ max_limit: newLimit, loai_phep_tinh: newType }).eq('user_id', user.id);
    } catch (error) {} finally { setSaving(false); }
  };

  const loadAllMediaState = async () => {
    try {
      const storedCustom = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
      const storedDeleted = await AsyncStorage.getItem('@deleted_defaults');
      const storedRenamed = await AsyncStorage.getItem('@renamed_defaults');

      if (storedCustom) setCustomMedia(JSON.parse(storedCustom));
      if (storedDeleted) setDeletedDefaults(JSON.parse(storedDeleted));
      if (storedRenamed) setRenamedDefaults(JSON.parse(storedRenamed));
    } catch (error) {}
  };

  const getCombinedMedia = (category: MediaType): MediaItem[] => {
    let defaults: MediaItem[] = [];
    
    if (category === 'tap_doc') {
      defaults = (TAP_DOC_DATA || []).map((item, idx) => ({ id: `default_tapdoc_${idx}`, uri: item.image, name: item.word, category, type: 'image' as const, isDefault: true }));
    } else if (category === 'thu_thach') {
      defaults = (THU_THACH_IMAGES || []).map((img, idx) => ({ id: `default_thuthach_${idx}`, uri: img, name: `Thử Thách ${idx + 1}`, category, type: 'image' as const, isDefault: true }));
    } else if (category === 'tinh_diem') {
      const imgsGioi = (GIOI_IMAGES || []).map((img, idx) => ({ id: `default_tinhdiem_ig_${idx}`, uri: img, name: `Ảnh Giỏi ${idx + 1}`, category, type: 'image' as const, isDefault: true }));
      const imgsTot = (TOT_IMAGES || []).map((img, idx) => ({ id: `default_tinhdiem_it_${idx}`, uri: img, name: `Ảnh Tốt ${idx + 1}`, category, type: 'image' as const, isDefault: true }));
      defaults = [...imgsGioi, ...imgsTot];
    } else if (category === 'video_chuc_mung') {
      const vidsGioi = (GIOI_VIDEOS || []).map((vid, idx) => ({ id: `default_video_vg_${idx}`, uri: vid, name: `Video Giỏi ${idx + 1}`, category, type: 'video' as const, isDefault: true }));
      const vidsTot = (TOT_VIDEOS || []).map((vid, idx) => ({ id: `default_video_vt_${idx}`, uri: vid, name: `Video Tốt ${idx + 1}`, category, type: 'video' as const, isDefault: true }));
      defaults = [...vidsGioi, ...vidsTot];
    }

    const filteredDefaults = defaults.filter(item => !deletedDefaults.includes(item.id));
    const renamedFilteredDefaults = filteredDefaults.map(item => ({ ...item, name: renamedDefaults[item.id] || item.name }));

    return [...renamedFilteredDefaults, ...(customMedia[category] || [])];
  };

  const handleAddMedia = async () => {
    if (!activeCategory) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) return;

    // Phân loại: Nếu đang ở mục video thì ưu tiên chọn video, còn lại chọn ảnh
    const isVideoCategory = activeCategory === 'video_chuc_mung';
    
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: isVideoCategory ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: false, 
      quality: 0.8 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      let finalUri: string = asset.uri;

      if (Platform.OS !== 'web') {
        const fsAny = FileSystem as any;
        const extension = isVideoCategory ? '.mp4' : '.jpg';
        const fileName = asset.uri.split('/').pop() || `file_${Date.now()}${extension}`;
        const newPath = `${fsAny.documentDirectory}${fileName}`;
        try {
          await fsAny.copyAsync({ from: asset.uri, to: newPath });
          finalUri = fileName; 
        } catch (error) { return; }
      }

      const newItem: MediaItem = {
        id: `custom_${Date.now()}`,
        uri: finalUri,
        name: isVideoCategory ? `Video Mới` : `Ảnh Mới`,
        category: activeCategory,
        type: isVideoCategory ? 'video' : 'image',
        isDefault: false
      };

      const updatedCustom = { ...customMedia, [activeCategory]: [...(customMedia[activeCategory] || []), newItem] };
      setCustomMedia(updatedCustom);
      await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedCustom));
    }
  };

  const handleRename = async () => {
    if (!selectedItem || !editName.trim()) return;

    if (selectedItem.isDefault) {
      const newRenamed = { ...renamedDefaults, [selectedItem.id]: editName.trim() };
      setRenamedDefaults(newRenamed);
      await AsyncStorage.setItem('@renamed_defaults', JSON.stringify(newRenamed));
    } else {
      const updatedList = customMedia[selectedItem.category].map(item => item.id === selectedItem.id ? { ...item, name: editName.trim() } : item);
      const updatedCustom = { ...customMedia, [selectedItem.category]: updatedList };
      setCustomMedia(updatedCustom);
      await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedCustom));
    }
    
    setSelectedItem({ ...selectedItem, name: editName.trim() });
    if (Platform.OS !== 'web') Alert.alert('Thành công', 'Đã đổi tên mượt mà!');
    else window.alert('Đã đổi tên mượt mà!'); 
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const executeDelete = async () => {
      if (selectedItem.isDefault) {
        const newDeleted = [...deletedDefaults, selectedItem.id];
        setDeletedDefaults(newDeleted);
        await AsyncStorage.setItem('@deleted_defaults', JSON.stringify(newDeleted));
      } else {
        if (Platform.OS !== 'web') {
            const fsAny = FileSystem as any;
            try { await fsAny.deleteAsync(getFullUri(selectedItem.uri as string), { idempotent: true }); } catch (e) {}
        }
        const updatedList = customMedia[selectedItem.category].filter(item => item.id !== selectedItem.id);
        const updatedCustom = { ...customMedia, [selectedItem.category]: updatedList };
        setCustomMedia(updatedCustom);
        await AsyncStorage.setItem('@kho_du_lieu_cua_be', JSON.stringify(updatedCustom));
      }
      setSelectedItem(null); 
    };

    if (Platform.OS !== 'web') {
        Alert.alert("Xóa Dữ Liệu", selectedItem.isDefault ? "Ẩn hình/video mặc định này khỏi trò chơi?" : "Chắc chắn xóa file này khỏi máy?", [
          { text: "Hủy", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: executeDelete }
        ]);
    } else {
        if (window.confirm("Chắc chắn xóa/ẩn file này?")) executeDelete();
    }
  };

  if (loading) return <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const combinedMediaList = activeCategory ? getCombinedMedia(activeCategory) : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cài Đặt</Text>
        {saving && <ActivityIndicator size="small" color="#4F46E5" />}
      </View>

      <View style={[styles.section, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 2 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>🎁</Text>
          <View>
            <Text style={[styles.sectionTitle, { color: '#166534', marginBottom: 0 }]}>Kho Dữ Liệu Của Bé</Text>
            <Text style={{ color: '#15803D', fontSize: 12 }}>Quản lý ảnh/video mặc định & tải lên</Text>
          </View>
        </View>

        <View style={styles.mediaGrid}>
          {(Object.keys(CATEGORY_NAMES) as MediaType[]).map((key) => {
             const totalItems = getCombinedMedia(key).length;
             return (
              <TouchableOpacity key={key} style={styles.mediaCategoryBtn} onPress={() => setActiveCategory(key)}>
                <Text style={styles.mediaCategoryTitle}>{CATEGORY_NAMES[key]}</Text>
                <View style={styles.mediaBadge}><Text style={styles.mediaBadgeText}>{totalItems}</Text></View>
              </TouchableOpacity>
            )
          })}
        </View>
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
        <View style={styles.limitContainer}>
          <Text style={[styles.limitLabel, { color: colors.text }]}>Bé làm toán từ 1 đến:</Text>
          <TextInput
            style={styles.limitInput} keyboardType="number-pad" value={maxLimit ? String(maxLimit) : ''}
            onChangeText={(text) => { const val = parseInt(text.replace(/[^0-9]/g, ''), 10); setMaxLimit(isNaN(val) ? 0 : val); }}
            onEndEditing={() => { let finalLimit = maxLimit < 5 ? 5 : maxLimit; setMaxLimit(finalLimit); updateSettings(finalLimit, mathType); }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Loại phép tính</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'cong' && styles.typeBtnActive, { borderColor: colors.border }]} onPress={() => { setMathType('cong'); updateSettings(maxLimit, 'cong'); }}><Text style={styles.typeEmoji}>➕</Text><Text style={[styles.typeText, mathType === 'cong' && styles.typeTextActive]}>Cộng</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'tru' && styles.typeBtnActive, { borderColor: colors.border }]} onPress={() => { setMathType('tru'); updateSettings(maxLimit, 'tru'); }}><Text style={styles.typeEmoji}>➖</Text><Text style={[styles.typeText, mathType === 'tru' && styles.typeTextActive]}>Trừ</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, mathType === 'ca_hai' && styles.typeBtnActive, { borderColor: colors.border }]} onPress={() => { setMathType('ca_hai'); updateSettings(maxLimit, 'ca_hai'); }}><Text style={styles.typeEmoji}>🎲</Text><Text style={[styles.typeText, mathType === 'ca_hai' && styles.typeTextActive]}>Cả Hai</Text></TouchableOpacity>
        </View>
      </View>

      <Modal visible={activeCategory !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setActiveCategory(null); setSelectedItem(null); }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeCategory ? CATEGORY_NAMES[activeCategory] : ''}</Text>
            <TouchableOpacity onPress={() => { setActiveCategory(null); setSelectedItem(null); }} style={styles.closeBtn}><Ionicons name="close-circle" size={32} color="#6B7280" /></TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.galleryGrid}>
            <TouchableOpacity style={styles.addMediaBtn} onPress={handleAddMedia}>
              <Ionicons name={activeCategory === 'video_chuc_mung' ? "videocam" : "image"} size={40} color="#4F46E5" />
              <Text style={{color: '#4F46E5', fontWeight: 'bold', marginTop: 5}}>Thêm mới</Text>
            </TouchableOpacity>
            
            {combinedMediaList.map((item) => (
              <TouchableOpacity key={item.id} style={styles.thumbContainer} onPress={() => { setSelectedItem(item); setEditName(item.name); }}>
                {/* NẾU LÀ VIDEO THÌ HIỆN ICON THAY VÌ ẢNH ĐỂ KHÔNG BỊ CRASH */}
                {item.type === 'video' ? (
                  <View style={[styles.thumbImage, { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="film-outline" size={40} color="#9CA3AF" />
                  </View>
                ) : (
                  <Image source={typeof item.uri === 'number' ? item.uri : { uri: getFullUri(item.uri as string) }} style={styles.thumbImage} />
                )}
                {item.type === 'video' && <Ionicons name="play-circle" size={30} color="white" style={styles.videoIcon} />}
                {item.isDefault && <View style={styles.defaultBadge}><Ionicons name="star" size={12} color="white"/></View>}
                <View style={styles.thumbLabelBox}><Text style={styles.thumbLabelText} numberOfLines={1}>{item.name}</Text></View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedItem !== null && (
            <View style={[StyleSheet.absoluteFill, styles.detailOverlay]}>
              <View style={styles.detailBox}>
                <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.detailCloseBtn}><Ionicons name="close-circle" size={35} color="#EF4444" /></TouchableOpacity>
                
                {/* NẾU LÀ VIDEO THÌ DÙNG BỘ PHÁT VIDEO, CÒN ẢNH THÌ DÙNG IMAGE */}
                {selectedItem.type === 'video' ? (
                  <Video
                    source={typeof selectedItem.uri === 'number' ? selectedItem.uri : { uri: getFullUri(selectedItem.uri as string) }}
                    style={styles.detailImage}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping
                  />
                ) : (
                  <Image source={typeof selectedItem.uri === 'number' ? selectedItem.uri : { uri: getFullUri(selectedItem.uri as string) }} style={styles.detailImage} resizeMode="contain" />
                )}

                <Text style={styles.inputLabel}>Tên hiển thị (dùng làm đáp án đọc):</Text>
                
                <View style={styles.renameRow}>
                  <TextInput style={styles.nameInput} value={editName} onChangeText={setEditName} placeholder="Nhập tên..." />
                  <TouchableOpacity style={styles.saveNameBtn} onPress={handleRename}><Text style={styles.saveNameText}>Lưu</Text></TouchableOpacity>
                </View>
                
                <TouchableOpacity style={[styles.deleteBtn, selectedItem.isDefault ? {backgroundColor: '#F59E0B'} : null]} onPress={handleDelete}>
                  <Ionicons name={selectedItem.isDefault ? "eye-off" : "trash"} size={20} color="white" />
                  <Text style={styles.deleteBtnText}>{selectedItem.isDefault ? "Ẩn khỏi game" : "Xóa file này"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </Modal>

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
  defaultBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#F59E0B', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  thumbLabelBox: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 5 },
  thumbLabelText: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
  detailOverlay: { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 },
  detailBox: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  detailCloseBtn: { position: 'absolute', top: -15, right: -15, backgroundColor: 'white', borderRadius: 20 },
  detailImage: { width: 250, height: 250, borderRadius: 10, marginBottom: 20, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  inputLabel: { alignSelf: 'flex-start', fontWeight: 'bold', color: '#4B5563', marginBottom: 5 },
  renameRow: { flexDirection: 'row', width: '100%', marginBottom: 20 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F9FAFB' },
  saveNameBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 10, marginLeft: 10 },
  saveNameText: { color: 'white', fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', backgroundColor: '#EF4444', width: '100%', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});