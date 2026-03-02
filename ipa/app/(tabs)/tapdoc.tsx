import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from 'expo-router'; // Nếu lỗi expo-router thì anh hai xài cái này, hoặc expo-router tùy setup
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Import kho tập đọc đại ca vừa xài tool tạo ra
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';

const { width } = Dimensions.get('window');

export default function TapDocScreen() {
  const { colors } = useTheme();
  const [childName, setChildName] = useState('Bé yêu');
  
  // State chứa bài học hiện tại đang hiển thị
  const [currentItem, setCurrentItem] = useState<any>(null);

  // Rổ nháp để quản lý việc bốc ngẫu nhiên KHÔNG LẶP LẠI
  // Nếu TAP_DOC_DATA chưa có gì thì để rổ trống
  const unseenItems = useRef(TAP_DOC_DATA ? [...TAP_DOC_DATA] : []);

  useFocusEffect(
    useCallback(() => {
      fetchChildName();
      // Lúc mới vô tab, nếu kho có dữ liệu và chưa có bài nào đang hiện thì bốc liền 1 bài
      if (TAP_DOC_DATA && TAP_DOC_DATA.length > 0 && !currentItem) {
        handleNextItem();
      }
    }, [currentItem])
  );

  const fetchChildName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('childName');
      if (savedName) setChildName(savedName);
    } catch (e) {
      console.log('Không lấy được tên bé', e);
    }
  };

  // Hàm bốc hình ngẫu nhiên không lặp lại
  const handleNextItem = () => {
    if (!TAP_DOC_DATA || TAP_DOC_DATA.length === 0) return;

    // Nếu rổ nháp hết sạch hình, đổ đầy lại từ kho gốc
    if (unseenItems.current.length === 0) {
      unseenItems.current = [...TAP_DOC_DATA];
    }

    // Bốc ngẫu nhiên 1 món từ rổ nháp
    const randomIndex = Math.floor(Math.random() * unseenItems.current.length);
    const selected = unseenItems.current[randomIndex];

    // Cắt món đó ra khỏi rổ để lần sau không bốc trúng nữa
    unseenItems.current.splice(randomIndex, 1);

    // Hiển thị lên màn hình
    setCurrentItem(selected);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📖 {childName} Tập Đọc 📖</Text>
      </View>

      <View style={styles.mainContent}>
        
        {/* NẾU KHO TRỐNG (Đại ca chưa chạy Tool) THÌ HIỆN NHẮC NHỞ */}
        {!TAP_DOC_DATA || TAP_DOC_DATA.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={80} color="#9CA3AF" />
            <Text style={styles.emptyText}>Kho ảnh đang trống trơn!</Text>
            <Text style={styles.emptySubText}>
              Đại ca bỏ ảnh vào thư mục rồi gõ lệnh chạy tool để Tèo nạp dữ liệu nha!
            </Text>
          </View>
        ) : currentItem ? (
          <>
            {/* KHUNG ẢNH TỈ LỆ 1:1 Ở GIỮA */}
            <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image 
                source={currentItem.image} 
                style={styles.imageSquare} 
                resizeMode="cover" 
              />
            </View>

            {/* CHỮ ĐỂ BÉ ĐỌC (TÊN FILE ẢNH) */}
            <View style={styles.wordContainer}>
              <Text style={[styles.wordText, { color: colors.text }]}>
                {currentItem.word}
              </Text>
            </View>

            {/* NÚT ĐỔI BÀI NGẪU NHIÊN */}
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextItem} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>Đổi Hình Khác 🎲</Text>
              <Ionicons name="arrow-forward-circle" size={32} color="white" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </>
        ) : null}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingVertical: 15, 
    alignItems: 'center', 
    backgroundColor: '#86EFAC', 
    borderBottomWidth: 3, 
    borderBottomColor: '#4ADE80' 
  },
  title: { fontSize: 30, fontWeight: '900', color: '#166534' },
  
  mainContent: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20 
  },
  
  // Thiết kế khung ảnh vuông vức 1:1
  imageCard: {
    width: width * 0.4, // Bề rộng bằng 75% màn hình
    height: width * 0.4, // Chiều cao y chang để ra hình vuông
    borderRadius: 25,
    borderWidth: 4,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
    marginBottom: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageSquare: {
    width: '100%',
    height: '100%',
  },

  wordContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
 wordText: {
    fontSize: 100, // Tèo bơm size to lên chút nữa vì font HP001 nét nó hơi thanh
    // fontWeight: '900', // ⬅️ ĐẠI CA NHỚ XÓA HOẶC COMMENT DÒNG NÀY LẠI NHA
    textTransform: 'lowercase', 
    color: '#1F2937',
    fontFamily: 'HP001', // ⬅️ THẦN CHÚ GỌI FONT CHỮ TIỂU HỌC NẰM Ở ĐÂY NÈ!
  },

  nextBtn: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  nextBtnText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },

  // Style cho màn hình báo rỗng
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 15,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  }
});