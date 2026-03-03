import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, PanResponder, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Import kho tập đọc đại ca xài tool nạp vào
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';

const { width, height } = Dimensions.get('window');

// 5 màu siêu chói lóa cho 5 sợi dây nối
const LINE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function BaiTapScreen() {
  const { colors } = useTheme();
  
  // Nạp font chữ tiểu học nét thanh nét đậm
  const [fontsLoaded] = useFonts({
    'HP001': require('../../assets/fonts/HP001.ttf'), 
  });

  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [rightItems, setRightItems] = useState<any[]>([]);
  
  // Lưu tọa độ của các dấu chấm để dò xem bé có kéo trúng không
  const dotLayouts = useRef<{ [key: string]: { x: number, y: number, word: string, type: 'left' | 'right' } }>({});
  
  // Đường đang vẽ dở dang
  const [currentPath, setCurrentPath] = useState<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  
  // Những đường đã nối thành công
  const [completedPaths, setCompletedPaths] = useState<any[]>([]);
  const [score, setScore] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      startNewGame();
    }, [])
  );

  const startNewGame = () => {
    if (!TAP_DOC_DATA || TAP_DOC_DATA.length < 5) {
      Alert.alert('Thiếu dữ liệu', 'Đại ca nạp thêm hình vào kho Tập Đọc cho đủ 5 tấm rồi chơi nha!');
      return;
    }
    
    // Bốc ngẫu nhiên 5 món
    let shuffled = [...TAP_DOC_DATA].sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 5);

    // Bày ra mâm trái (ảnh) và mâm phải (chữ) rồi xáo trộn thứ tự
    setLeftItems([...selected].sort(() => 0.5 - Math.random()));
    setRightItems([...selected].sort(() => 0.5 - Math.random()));
    
    setCompletedPaths([]);
    setCurrentPath(null);
    setScore(null);
    dotLayouts.current = {};
  };

  // Cỗ máy bắt chuyển động ngón tay / chuột của Tèo (Đã gắn bùa trị trình duyệt Web)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, // Bắt buộc chặn trên web
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,  // Bắt buộc chặn trên web
      
      // Khi bé vừa đặt ngón tay/chuột xuống
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        // Dò xem bé có đang bấm trúng cái dấu chấm nào không (bán kính 40px cho dễ bấm)
        for (const key in dotLayouts.current) {
          const dot = dotLayouts.current[key];
          const dist = Math.sqrt(Math.pow(pageX - dot.x, 2) + Math.pow(pageY - dot.y, 2));
          if (dist < 40) {
            // Đã chọn trúng, gán màu cho sợi dây
            setCurrentPath({
              points: [{ x: pageX, y: pageY }],
              color: LINE_COLORS[completedPaths.length % LINE_COLORS.length],
              startKey: key,
            });
            break;
          }
        }
      },
      
      // Khi bé kéo lê tạo đường cong uốn lượn
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        setCurrentPath((prev) => {
          if (!prev) return null;
          return { ...prev, points: [...prev.points, { x: pageX, y: pageY }] };
        });
      },
      
      // Khi bé nhấc tay/thả chuột ra
      onPanResponderRelease: (evt, gestureState) => {
        const { pageX, pageY } = evt.nativeEvent;
        setCurrentPath((prevPath) => {
          if (!prevPath) return null;
          
          let hitKey = null;
          // Dò xem nhả tay có trúng dấu chấm đích không
          for (const key in dotLayouts.current) {
            const dot = dotLayouts.current[key];
            const dist = Math.sqrt(Math.pow(pageX - dot.x, 2) + Math.pow(pageY - dot.y, 2));
            const startDot = dotLayouts.current[prevPath.startKey];
            
            // Phải trúng chấm, và phải nối từ trái sang phải hoặc ngược lại (không cho nối ảnh với ảnh)
            if (dist < 50 && dot.type !== startDot.type) {
              hitKey = key;
              break;
            }
          }

          if (hitKey) {
            // Nối thành công, chốt vào danh sách
            const newCompleted = [...completedPaths, { ...prevPath, endKey: hitKey }];
            setCompletedPaths(newCompleted);
            
            // Nếu đủ 5 sợi dây thì chấm điểm
            if (newCompleted.length === 5) {
              let dung = 0;
              newCompleted.forEach(p => {
                const s = dotLayouts.current[p.startKey];
                const e = dotLayouts.current[p.endKey];
                if (s.word === e.word) dung += 2; // Đúng 1 câu được 2 điểm
              });
              setScore(dung);
            }
          }
          return null; // Dọn đường nháp để vẽ sợi khác
        });
      }
    })
  ).current;

  // Hàm chuyển mảng tọa độ thành chuỗi để SVG vẽ nét cong mượt mà
  const buildSvgPath = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return '';
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return d;
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nối Từ Cùng Bé ✏️</Text>
      </View>

      {/* KHÓA MÕM TRÌNH DUYỆT: Không cho bôi đen, không cho cuộn trang khi vẽ */}
      <View 
        style={[
          styles.gameArea,
          Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } as any : {}
        ]} 
        {...panResponder.panHandlers}
      >
        
        {/* Lớp Kính Vẽ SVG đè lên trên cùng để sợi chỉ luôn hiện rõ */}
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%">
            {/* Vẽ những đường cong bé đã nối xong */}
            {completedPaths.map((p, index) => (
              <Path key={index} d={buildSvgPath(p.points)} stroke={p.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {/* Vẽ đường bé đang kéo dở dang */}
            {currentPath && (
              <Path d={buildSvgPath(currentPath.points)} stroke={currentPath.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </Svg>
        </View>

        {/* CỘT TRÁI: DANH SÁCH ẢNH */}
        <View style={styles.column}>
          {leftItems.map((item, index) => {
            const dotKey = `left_${index}`;
            return (
              <View key={dotKey} style={styles.itemRow}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
                {/* Lấy tọa độ thực tế của cái chấm trên màn hình */}
                <View 
                  style={styles.dot} 
                  onLayout={(e) => {
                    dotLayouts.current[dotKey] = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y, word: item.word, type: 'left' };
                  }} 
                  ref={(ref) => {
                    ref?.measure((x, y, w, h, px, py) => {
                      dotLayouts.current[dotKey] = { x: px + w/2, y: py + h/2, word: item.word, type: 'left' };
                    });
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* CỘT PHẢI: DANH SÁCH CHỮ (FONT HP001) */}
        <View style={styles.column}>
          {rightItems.map((item, index) => {
            const dotKey = `right_${index}`;
            return (
              <View key={dotKey} style={[styles.itemRow, { justifyContent: 'flex-start' }]}>
                {/* Lấy tọa độ dấu chấm */}
                <View 
                  style={[styles.dot, { marginRight: 20 }]} 
                  onLayout={(e) => {
                    dotLayouts.current[dotKey] = { x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y, word: item.word, type: 'right' };
                  }}
                  ref={(ref) => {
                    ref?.measure((x, y, w, h, px, py) => {
                      dotLayouts.current[dotKey] = { x: px + w/2, y: py + h/2, word: item.word, type: 'right' };
                    });
                  }}
                />
                <View style={styles.wordBox}>
                  <Text style={styles.wordText}>{item.word}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </View>

      {/* BẢNG CHẤM ĐIỂM KHI NỐI XONG 5 CÂU */}
      {score !== null && (
        <View style={styles.resultModal}>
          <Text style={styles.resultText}>Điểm của bé: {score}/10 {score === 10 ? '🎉' : '👏'}</Text>
          <TouchableOpacity style={styles.replayBtn} onPress={startNewGame}>
            <Text style={styles.replayBtnText}>Chơi lại 🔄</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#FDE047', borderBottomWidth: 3, borderBottomColor: '#FACC15' },
  title: { fontSize: 28, fontWeight: '900', color: '#854D0E' },
  
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  column: {
    width: '45%',
    justifyContent: 'space-around',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 100, 
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 20,
    backgroundColor: 'white'
  },
  wordBox: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  wordText: {
    fontSize: 50, // Tèo cho bự bự một chút để bé dễ đọc nét thanh nét đậm
    fontFamily: 'HP001', 
    color: '#1F2937',
    textTransform: 'lowercase',
  },
  dot: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#9CA3AF',
    borderWidth: 3,
    borderColor: '#4B5563',
    elevation: 3,
  },
  
  resultModal: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  resultText: { fontSize: 35, fontWeight: 'bold', color: '#EF4444', marginBottom: 20 },
  replayBtn: { backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15 },
  replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});