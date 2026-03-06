import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Image, PanResponder, TouchableOpacity, Alert, Platform, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Video, ResizeMode } from 'expo-av'; 

// Import kho tập đọc
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';
// Import kho video để thưởng cho bé
import { GIOI_VIDEOS, TOT_VIDEOS, CAN_CO_GAN_VIDEOS } from '../../constants/kho_video';

const { width } = Dimensions.get('window');

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
  
  const currentPathRef = useRef<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  const completedPathsRef = useRef<any[]>([]);
  
  const [currentPathState, setCurrentPathState] = useState<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  const [completedPathsState, setCompletedPathsState] = useState<any[]>([]);
  const [score, setScore] = useState<number | null>(null);

  // State và Ref cho Rạp chiếu phim mini
  const [randomVideo, setRandomVideo] = useState<any>(null); 
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const unseenGioi = useRef([...GIOI_VIDEOS]);
  const unseenTot = useRef([...TOT_VIDEOS]);
  const unseenCanCoGan = useRef([...CAN_CO_GAN_VIDEOS]);

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
    
    completedPathsRef.current = [];
    currentPathRef.current = null;
    setCompletedPathsState([]);
    setCurrentPathState(null);
    setScore(null);
    dotLayouts.current = {};
    
    // Tắt video nếu đang bật
    setShowVideoPopup(false);
    setRandomVideo(null);
    
    setTimeout(() => {
      measureAllDots();
    }, 300);
  };

  const measureAllDots = () => {
    if (!gameAreaRef.current) return;
    Object.keys(dotRefs.current).forEach(key => {
      const node = dotRefs.current[key];
      if (node) {
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
        const { locationX, locationY } = evt.nativeEvent;
        for (const key in dotLayouts.current) {
          const dot = dotLayouts.current[key];
          const dist = Math.sqrt(Math.pow(locationX - dot.x, 2) + Math.pow(locationY - dot.y, 2));
          if (dist < 60) { 
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
          
          currentPathRef.current = null;
          setCurrentPathState(null);
          
          let hitKey = null;
          for (const key in dotLayouts.current) {
            const dot = dotLayouts.current[key];
            const dist = Math.sqrt(Math.pow(locationX - dot.x, 2) + Math.pow(locationY - dot.y, 2));
            const startDot = dotLayouts.current[prevPath.startKey];
            
            if (dist < 70 && startDot && dot.type !== startDot.type) { 
              hitKey = key;
              break;
            }
          }

          if (hitKey) {
            const hitDot = dotLayouts.current[hitKey];
            const snappedPoints = [...prevPath.points, { x: hitDot.x, y: hitDot.y }];
            
            // LUẬT CHUNG THỦY 1-1: Dọn dẹp mớ bòng bong
            // Lọc ra những đường cũ KHÔNG dính dáng gì đến 2 cái chấm mà bé vừa nối
            const filteredPaths = completedPathsRef.current.filter(
              p => p.startKey !== prevPath.startKey && p.endKey !== prevPath.startKey && 
                   p.startKey !== hitKey && p.endKey !== hitKey
            );
            
            // Đưa sợi dây mới tinh tươm vào danh sách đã lọc dọn
            const newCompleted = [...filteredPaths, { ...prevPath, points: snappedPoints, endKey: hitKey }];
            
            completedPathsRef.current = newCompleted;
            setCompletedPathsState(newCompleted);
            
            // Chỉ khi nào đếm đủ 5 sợi dây trên màn hình thì mới chốt sổ chấm điểm
            if (newCompleted.length === 5) {
              let dung = 0;
              newCompleted.forEach(p => {
                const s = dotLayouts.current[p.startKey];
                const e = dotLayouts.current[p.endKey];
                if (s && e && s.word === e.word) dung += 2; 
              });
              setScore(dung);

              let originalVideoArray;
              let unseenRef: React.MutableRefObject<any[]>;

              if (dung >= 9) {
                originalVideoArray = GIOI_VIDEOS;
                unseenRef = unseenGioi;
              } else if (dung >= 6) {
                originalVideoArray = TOT_VIDEOS;
                unseenRef = unseenTot;
              } else {
                originalVideoArray = CAN_CO_GAN_VIDEOS;
                unseenRef = unseenCanCoGan;
              }

              if (originalVideoArray && originalVideoArray.length > 0) {
                  if (unseenRef.current.length === 0) {
                      unseenRef.current = [...originalVideoArray];
                  }
                  const randomIndex = Math.floor(Math.random() * unseenRef.current.length);
                  const randVid = unseenRef.current[randomIndex];
                  unseenRef.current.splice(randomIndex, 1);
                  setRandomVideo(randVid);
              } else {
                  setRandomVideo(null); 
              }
              
              setTimeout(() => {
                if (originalVideoArray && originalVideoArray.length > 0) {
                  setShowVideoPopup(true);
                }
              }, 1000); 
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

        {/* CỘT TRÁI (Khóa chạm) */}
        <View style={styles.column} pointerEvents="none">
          {leftItems.map((item, index) => {
            const dotKey = `left_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'left' };
            
            return (
              <View key={dotKey} style={styles.itemRow}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
                <View ref={(r) => { dotRefs.current[dotKey] = r; }} style={styles.dot} onLayout={measureAllDots} />
              </View>
            );
          })}
        </View>

        {/* CỘT PHẢI (Khóa chạm) */}
        <View style={styles.column} pointerEvents="none">
          {rightItems.map((item, index) => {
            const dotKey = `right_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'right' };
            
            return (
              <View key={dotKey} style={[styles.itemRow, { justifyContent: 'flex-start' }]}>
                {/* Giảm marginRight của chấm để nhường chỗ cho khoảng trống ở giữa */}
                <View ref={(r) => { dotRefs.current[dotKey] = r; }} style={[styles.dot, { marginRight: 10 }]} onLayout={measureAllDots} />
                <View style={styles.wordBox}>
                  <Text style={styles.wordText}>{item.word}</Text>
                </View>
              </View>
            );
          })}
        </View>

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

      <Modal visible={showVideoPopup && randomVideo !== null} transparent={true} animationType="fade">
        <View style={styles.videoOverlay}>
          <View style={styles.videoWrapper}>
            <Video
              source={randomVideo} 
              style={styles.smallVideo}
              resizeMode={ResizeMode.CONTAIN} 
              shouldPlay
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded && status.didJustFinish) {
                  setShowVideoPopup(false);
                }
              }}
            />
            <TouchableOpacity style={styles.skipVideoBtn} onPress={() => setShowVideoPopup(false)}>
              <Text style={styles.skipVideoText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    padding: 10, 
    backgroundColor: '#F9FAFB',
  },
  column: {
    width: '40%', 
    justifyContent: 'space-around',
    zIndex: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 180, 
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 10, 
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
  replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  videoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: width * 0.5,   
    height: width * 0.5 * (9/16), 
    backgroundColor: '#000', 
    borderRadius: 20,
    overflow: 'hidden', 
    elevation: 10, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10,
  },
  smallVideo: {
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  skipVideoBtn: {
    position: 'absolute',
    top: 10, 
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.3)', 
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
  },
  skipVideoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});