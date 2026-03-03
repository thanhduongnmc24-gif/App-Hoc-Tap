import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, PanResponder, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from 'expo-font';

import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';

const LINE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function BaiTapScreen() {
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    'HP001': require('../../assets/fonts/HP001.ttf'), 
  });

  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [rightItems, setRightItems] = useState<any[]>([]);
  
  const dotLayouts = useRef<{ [key: string]: { x: number, y: number, word: string, type: 'left' | 'right' } }>({});
  const dotRefs = useRef<{ [key: string]: View | null }>({});
  const gameAreaRef = useRef<View>(null);
  
  // Bùa chống "mất trí nhớ": Dùng Ref cho state vẽ vời để PanResponder không bị kẹt closure
  const currentPathRef = useRef<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  const completedPathsRef = useRef<any[]>([]);
  
  // State để render giao diện
  const [currentPathState, setCurrentPathState] = useState<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  const [completedPathsState, setCompletedPathsState] = useState<any[]>([]);
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
    
    let shuffled = [...TAP_DOC_DATA].sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 5);

    setLeftItems([...selected].sort(() => 0.5 - Math.random()));
    setRightItems([...selected].sort(() => 0.5 - Math.random()));
    
    // Reset lại toàn bộ trí nhớ của Ref và State
    completedPathsRef.current = [];
    currentPathRef.current = null;
    setCompletedPathsState([]);
    setCurrentPathState(null);
    setScore(null);
    dotLayouts.current = {};
    
    setTimeout(() => {
      measureAllDots();
    }, 300);
  };

  const measureAllDots = () => {
    if (!gameAreaRef.current) return;
    Object.keys(dotRefs.current).forEach(key => {
      const node = dotRefs.current[key];
      if (node) {
        // Đo tọa độ các dấu chấm dựa trên hệ quy chiếu chung là gameArea
        node.measureLayout(
          gameAreaRef.current as any,
          (left, top, width, height) => {
            if (dotLayouts.current[key]) {
              dotLayouts.current[key].x = left + width / 2;
              dotLayouts.current[key].y = top + height / 2;
            }
          },
          () => {
            console.log('Đo tọa độ xịt cho', key);
          }
        );
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: (evt) => {
        // Sử dụng tọa độ Local (chuẩn xác hoàn toàn với gameArea)
        const { locationX, locationY } = evt.nativeEvent;
        for (const key in dotLayouts.current) {
          const dot = dotLayouts.current[key];
          const dist = Math.sqrt(Math.pow(locationX - dot.x, 2) + Math.pow(locationY - dot.y, 2));
          if (dist < 50) { 
            const color = LINE_COLORS[completedPathsRef.current.length % LINE_COLORS.length];
            const newPath = {
              points: [{ x: dot.x, y: dot.y }],
              color,
              startKey: key,
            };
            currentPathRef.current = newPath;
            setCurrentPathState(newPath);
            break;
          }
        }
      },
      
      onPanResponderMove: (evt) => {
        if (currentPathRef.current) {
          const { locationX, locationY } = evt.nativeEvent;
          currentPathRef.current = {
            ...currentPathRef.current,
            points: [...currentPathRef.current.points, { x: locationX, y: locationY }]
          };
          setCurrentPathState(currentPathRef.current);
        }
      },
      
      onPanResponderRelease: (evt) => {
        if (currentPathRef.current) {
          const { locationX, locationY } = evt.nativeEvent;
          const prevPath = currentPathRef.current;
          
          // Nhấc tay là dọn luôn cọ vẽ
          currentPathRef.current = null;
          setCurrentPathState(null);
          
          let hitKey = null;
          for (const key in dotLayouts.current) {
            const dot = dotLayouts.current[key];
            const dist = Math.sqrt(Math.pow(locationX - dot.x, 2) + Math.pow(locationY - dot.y, 2));
            const startDot = dotLayouts.current[prevPath.startKey];
            
            if (dist < 60 && startDot && dot.type !== startDot.type) {
              hitKey = key;
              break;
            }
          }

          if (hitKey) {
            const hitDot = dotLayouts.current[hitKey];
            const snappedPoints = [...prevPath.points, { x: hitDot.x, y: hitDot.y }];
            
            const newCompleted = [...completedPathsRef.current, { ...prevPath, points: snappedPoints, endKey: hitKey }];
            
            // Lưu vào Ref để chống mất trí nhớ, rồi mới bơm vào State để render SVG
            completedPathsRef.current = newCompleted;
            setCompletedPathsState(newCompleted);
            
            if (newCompleted.length === 5) {
              let dung = 0;
              newCompleted.forEach(p => {
                const s = dotLayouts.current[p.startKey];
                const e = dotLayouts.current[p.endKey];
                if (s && e && s.word === e.word) dung += 2; 
              });
              setScore(dung);
            }
          }
        }
      }
    })
  ).current;

  const buildSvgPath = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Nối Từ Cùng Bé ✏️</Text>
      </View>

      <View 
        ref={gameAreaRef}
        onLayout={() => {
          setTimeout(measureAllDots, 100);
        }}
        style={styles.gameArea} 
      >
        
        {/* Lớp Kính Vẽ SVG (nằm dưới lớp bắt chạm) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            {completedPathsState.map((p, index) => (
              <Path key={index} d={buildSvgPath(p.points)} stroke={p.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPathState && (
              <Path d={buildSvgPath(currentPathState.points)} stroke={currentPathState.color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </Svg>
        </View>

        {/* CỘT TRÁI (Khóa chạm để không bị nhiễu tọa độ) */}
        <View style={styles.column} pointerEvents="none">
          {leftItems.map((item, index) => {
            const dotKey = `left_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'left' };
            
            return (
              <View key={dotKey} style={styles.itemRow}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
                <View 
                  ref={(r) => { dotRefs.current[dotKey] = r; }}
                  style={styles.dot} 
                  onLayout={measureAllDots} 
                />
              </View>
            );
          })}
        </View>

        {/* CỘT PHẢI (Khóa chạm để không bị nhiễu tọa độ) */}
        <View style={styles.column} pointerEvents="none">
          {rightItems.map((item, index) => {
            const dotKey = `right_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'right' };
            
            return (
              <View key={dotKey} style={[styles.itemRow, { justifyContent: 'flex-start' }]}>
                <View 
                  ref={(r) => { dotRefs.current[dotKey] = r; }}
                  style={[styles.dot, { marginRight: 20 }]} 
                  onLayout={measureAllDots}
                />
                <View style={styles.wordBox}>
                  <Text style={styles.wordText}>{item.word}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* LỚP BẮT CHẠM TÀNG HÌNH ĐÈ LÊN TRÊN CÙNG */}
        {/* Lớp này che phủ toàn bộ gameArea, bắt tọa độ nội bộ locationX/Y cực chuẩn trên cả Web và App */}
        <View 
            style={[
              StyleSheet.absoluteFill, 
              { zIndex: 99 },
              Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } as any : {}
            ]} 
            {...panResponder.panHandlers}
        />
      </View>

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
    zIndex: 10,
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
    fontSize: 50, 
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
    zIndex: 999,
  },
  resultText: { fontSize: 35, fontWeight: 'bold', color: '#EF4444', marginBottom: 20 },
  replayBtn: { backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15 },
  replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});