import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, PanResponder, Alert, Platform, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { Video, ResizeMode, Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';
import { GIOI_VIDEOS, TOT_VIDEOS, CAN_CO_GAN_VIDEOS } from '../../constants/kho_video';

const { width } = Dimensions.get('window');

// Lược bỏ bớt mảng CHỮ CÁI cho gọn khung code, giữ nguyên bản chất
const VOWEL_TONES: Record<string, string[]> = {
  'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'], 'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'], 'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'], 'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'], 'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'], 'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'], 'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
};

const CONSONANTS = [
  { letter: 'b', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'c', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, { letter: 'ch', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'd', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }, { letter: 'đ', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'g', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, { letter: 'gh', vowels: ['e', 'ê', 'i'] }, 
  { letter: 'gi', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'u', 'ư'] }, { letter: 'h', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'k', vowels: ['e', 'ê', 'i', 'y'] }, { letter: 'kh', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'l', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }, { letter: 'm', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'n', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }, { letter: 'ng', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] },
  { letter: 'ngh', vowels: ['e', 'ê', 'i'] }, { letter: 'nh', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'p', vowels: ['a', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư'] }, { letter: 'ph', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'qu', vowels: ['a', 'e', 'ê', 'i', 'y', 'ơ'] }, { letter: 'r', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 's', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] }, { letter: 't', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'th', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] }, { letter: 'tr', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'v', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }, { letter: 'x', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }
];

const GhepVanGame = ({ onBack }: { onBack: () => void }) => {
  const { colors } = useTheme();
  const [selectedLetter, setSelectedLetter] = useState<string>(CONSONANTS[0].letter);
  const activeData = CONSONANTS.find(c => c.letter === selectedLetter);
  const rightScrollRef = useRef<ScrollView>(null);

  const handleSelectLetter = (letter: string) => { setSelectedLetter(letter); rightScrollRef.current?.scrollTo({ y: 0, animated: true }); };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: '#BAE6FD', borderBottomColor: '#7DD3FC' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#0284C7" /></TouchableOpacity>
        <Text style={[styles.title, { color: '#0369A1' }]}>📖 Bé Ghép Vần 📖</Text>
      </View>
      <View style={styles.gv_mainContent}>
        <View style={[styles.gv_leftColumn, { borderRightColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gv_leftScroll}>
            {CONSONANTS.map((item) => {
              const isActive = selectedLetter === item.letter;
              return (
                <TouchableOpacity key={item.letter} style={[ styles.gv_consonantBtn, { backgroundColor: isActive ? '#38BDF8' : colors.card, borderColor: isActive ? '#0284C7' : colors.border } ]} onPress={() => handleSelectLetter(item.letter)} activeOpacity={0.7} >
                  <Text style={[ styles.gv_consonantText, { color: isActive ? 'white' : colors.text } ]}>{item.letter}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.gv_rightColumn}>
          <ScrollView ref={rightScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.gv_rightScroll}>
            {activeData && activeData.vowels.map((vowel) => (
              <View key={vowel} style={styles.gv_vowelGroup}>
                <View style={styles.gv_vowelHeader}><Text style={styles.gv_vowelHeaderText}>{vowel}</Text></View>
                <View style={styles.gv_wordRow}>
                  {VOWEL_TONES[vowel].map((tonedVowel, idx) => (
                    <View key={idx} style={styles.gv_wordBox}><Text style={[styles.gv_wordText, { color: colors.text }]} numberOfLines={1}>{activeData.letter + tonedVowel}</Text></View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const TapDocGame = ({ onBack }: { onBack: () => void }) => {
  const { colors } = useTheme();
  const [childName, setChildName] = useState('Bé yêu');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [allData, setAllData] = useState<any[]>([]);
  const unseenItems = useRef<any[]>([]);

  useFocusEffect(useCallback(() => { fetchChildName(); loadAllData(); }, []));

  const fetchChildName = async () => { try { const saved = await AsyncStorage.getItem('childName'); if (saved) setChildName(saved); } catch (e) {} };

  const loadAllData = async () => {
    try {
      const storedBlacklist = await AsyncStorage.getItem('@blacklist_media');
      const blacklist = storedBlacklist ? JSON.parse(storedBlacklist) : [];
      const storedRenamed = await AsyncStorage.getItem('@renamed_media');
      const renamed = storedRenamed ? JSON.parse(storedRenamed) : {};

      const base = TAP_DOC_DATA.map((item, i) => ({ id: `default_tap_doc_${i}`, image: item.image, word: renamed[`default_tap_doc_${i}`] || item.word })).filter(item => !blacklist.includes(item.id));
      let customTapDoc: any[] = [];
      const storedData = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.tap_doc && parsed.tap_doc.length > 0) {
          customTapDoc = parsed.tap_doc.filter((i:any) => !blacklist.includes(i.id)).map((item: any) => ({ image: { uri: item.uri }, word: renamed[item.id] || item.name }));
        }
      }
      const combinedData = [...base, ...customTapDoc];
      setAllData(combinedData);
      if (combinedData.length > 0 && !currentItem) { unseenItems.current = [...combinedData]; pickNext(combinedData, [...combinedData]); }
    } catch (e) {}
  };

  const pickNext = (fullList: any[], currentUnseen: any[]) => {
    if (fullList.length === 0) return;
    if (currentUnseen.length === 0) currentUnseen = [...fullList];
    const r = Math.floor(Math.random() * currentUnseen.length);
    setCurrentItem(currentUnseen[r]);
    currentUnseen.splice(r, 1);
    unseenItems.current = currentUnseen;
  };

  const handleSpeak = async () => {
    if (currentItem && currentItem.word) {
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(currentItem.word)}&tl=vi&client=tw-ob`;
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status: any) => { if (status.isLoaded && status.didJustFinish) sound.unloadAsync(); });
      } catch (error) {}
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: '#86EFAC', borderBottomColor: '#4ADE80' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#166534" /></TouchableOpacity>
        <Text style={[styles.title, { color: '#166534' }]}>📖 {childName} Tập Đọc 📖</Text>
      </View>
      <View style={styles.td_mainContent}>
        {allData.length === 0 ? (
          <View style={styles.td_emptyContainer}><Ionicons name="images-outline" size={80} color="#9CA3AF" /><Text style={styles.td_emptyText}>Kho ảnh đang trống trơn!</Text></View>
        ) : currentItem ? (
          <>
            <View style={[styles.td_imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Image source={typeof currentItem.image === 'string' ? {uri: currentItem.image} : currentItem.image} style={styles.td_imageSquare} resizeMode="cover" /></View>
            <View style={[styles.td_wordContainer, { flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={[styles.td_wordText, { color: colors.text, marginRight: 20 }]}>{currentItem.word}</Text>
              <TouchableOpacity style={{ backgroundColor: '#38BDF8', padding: 15, borderRadius: 50, elevation: 5, borderWidth: 3, borderColor: '#0284C7' }} onPress={handleSpeak} activeOpacity={0.7}><Ionicons name="volume-high" size={45} color="white" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.td_nextBtn} onPress={() => pickNext(allData, unseenItems.current)} activeOpacity={0.8}><Text style={styles.td_nextBtnText}>Đổi Hình Khác 🎲</Text><Ionicons name="arrow-forward-circle" size={32} color="white" style={{ marginLeft: 10 }} /></TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const LINE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const BaiTapGame = ({ onBack }: { onBack: () => void }) => {
  const { colors } = useTheme();
  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [rightItems, setRightItems] = useState<any[]>([]);
  const dotLayouts = useRef<{ [key: string]: { x: number, y: number, word: string, type: 'left' | 'right' } }>({});
  const dotRefs = useRef<{ [key: string]: View | null }>({});
  const gameAreaRef = useRef<View>(null);
  
  const currentPathRef = useRef<{ points: {x: number, y: number}[], color: string, startKey: string } | null>(null);
  const completedPathsRef = useRef<any[]>([]);
  const [currentPathState, setCurrentPathState] = useState<any>(null);
  const [completedPathsState, setCompletedPathsState] = useState<any[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const [randomVideo, setRandomVideo] = useState<any>(null); 
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const unseenGioi = useRef([...GIOI_VIDEOS]);
  const unseenTot = useRef([...TOT_VIDEOS]);
  const unseenCanCoGan = useRef([...CAN_CO_GAN_VIDEOS]);

  useFocusEffect(useCallback(() => { startNewGame(); }, []));

  const startNewGame = async () => {
    let customTapDoc: any[] = [];
    try {
      const storedBlacklist = await AsyncStorage.getItem('@blacklist_media');
      const blacklist = storedBlacklist ? JSON.parse(storedBlacklist) : [];
      const storedRenamed = await AsyncStorage.getItem('@renamed_media');
      const renamed = storedRenamed ? JSON.parse(storedRenamed) : {};

      const base = TAP_DOC_DATA.map((item, i) => ({ id: `default_tap_doc_${i}`, image: item.image, word: renamed[`default_tap_doc_${i}`] || item.word })).filter(item => !blacklist.includes(item.id));
      const storedData = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.tap_doc) customTapDoc = parsed.tap_doc.filter((i:any) => !blacklist.includes(i.id)).map((item: any) => ({ image: { uri: item.uri }, word: renamed[item.id] || item.name }));
      }
      const combinedData = [...base, ...customTapDoc];

      if (combinedData.length < 5) {
        Alert.alert('Thiếu dữ liệu', 'Đại ca nạp thêm hình vào Cài Đặt hoặc gỡ bớt trong sổ đen ra (cần ít nhất 5 tấm) rồi chơi nha!');
        return;
      }
      let shuffled = [...combinedData].sort(() => 0.5 - Math.random());
      let selected = shuffled.slice(0, 5);
      setLeftItems([...selected].sort(() => 0.5 - Math.random()));
      setRightItems([...selected].sort(() => 0.5 - Math.random()));
      
      completedPathsRef.current = []; currentPathRef.current = null;
      setCompletedPathsState([]); setCurrentPathState(null); setScore(null);
      dotLayouts.current = {}; setShowVideoPopup(false); setRandomVideo(null);
      setTimeout(() => { measureAllDots(); }, 300);
    } catch (e) {}
  };

  const measureAllDots = () => {
    if (!gameAreaRef.current) return;
    Object.keys(dotRefs.current).forEach(key => {
      const node = dotRefs.current[key];
      if (node) { node.measureLayout(gameAreaRef.current as any, (l, t, w, h) => { if (dotLayouts.current[key]) { dotLayouts.current[key].x = l + w / 2; dotLayouts.current[key].y = t + h / 2; } }, () => {}); }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true, onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        for (const key in dotLayouts.current) {
          const dot = dotLayouts.current[key];
          if (Math.sqrt(Math.pow(locationX - dot.x, 2) + Math.pow(locationY - dot.y, 2)) < 60) { 
            const newPath = { points: [{ x: dot.x, y: dot.y }], color: LINE_COLORS[completedPathsRef.current.length % LINE_COLORS.length], startKey: key };
            currentPathRef.current = newPath; setCurrentPathState(newPath); break;
          }
        }
      },
      onPanResponderMove: (evt) => {
        if (currentPathRef.current) {
          currentPathRef.current = { ...currentPathRef.current, points: [...currentPathRef.current.points, { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }] };
          setCurrentPathState(currentPathRef.current);
        }
      },
      onPanResponderRelease: (evt) => {
        if (currentPathRef.current) {
          const prevPath = currentPathRef.current; currentPathRef.current = null; setCurrentPathState(null);
          let hitKey = null;
          for (const key in dotLayouts.current) {
            const dot = dotLayouts.current[key]; const startDot = dotLayouts.current[prevPath.startKey];
            if (Math.sqrt(Math.pow(evt.nativeEvent.locationX - dot.x, 2) + Math.pow(evt.nativeEvent.locationY - dot.y, 2)) < 70 && startDot && dot.type !== startDot.type) { hitKey = key; break; }
          }
          if (hitKey) {
            const hitDot = dotLayouts.current[hitKey];
            const filteredPaths = completedPathsRef.current.filter(p => p.startKey !== prevPath.startKey && p.endKey !== prevPath.startKey && p.startKey !== hitKey && p.endKey !== hitKey );
            const newCompleted = [...filteredPaths, { ...prevPath, points: [...prevPath.points, { x: hitDot.x, y: hitDot.y }], endKey: hitKey }];
            completedPathsRef.current = newCompleted; setCompletedPathsState(newCompleted);
            if (newCompleted.length === 5) {
              let dung = 0;
              newCompleted.forEach(p => { const s = dotLayouts.current[p.startKey]; const e = dotLayouts.current[p.endKey]; if (s && e && s.word === e.word) dung += 2; });
              setScore(dung);
              let origVidArr: any[] = []; let unseenRef: any;
              if (dung >= 9) { origVidArr = GIOI_VIDEOS; unseenRef = unseenGioi; } else if (dung >= 6) { origVidArr = TOT_VIDEOS; unseenRef = unseenTot; } else { origVidArr = CAN_CO_GAN_VIDEOS; unseenRef = unseenCanCoGan; }
              if (origVidArr.length > 0) {
                  if (unseenRef.current.length === 0) unseenRef.current = [...origVidArr];
                  const rIdx = Math.floor(Math.random() * unseenRef.current.length);
                  setRandomVideo(unseenRef.current[rIdx]); unseenRef.current.splice(rIdx, 1);
              } else setRandomVideo(null); 
              setTimeout(() => { if (origVidArr.length > 0) setShowVideoPopup(true); }, 1000); 
            }
          }
        }
      }
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: '#FDE047', borderBottomColor: '#FACC15' }]}><TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#854D0E" /></TouchableOpacity><Text style={[styles.title, { color: '#854D0E' }]}>Nối Từ Cùng Bé ✏️</Text></View>
      <View ref={gameAreaRef} onLayout={() => setTimeout(measureAllDots, 100)} style={styles.bt_gameArea}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            {completedPathsState.map((p, index) => <Path key={index} d={p.points.map((pt:any, i:number) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')} stroke={p.color} strokeWidth="6" fill="none" strokeLinecap="round" />)}
            {currentPathState && <Path d={currentPathState.points.map((pt:any, i:number) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')} stroke={currentPathState.color} strokeWidth="6" fill="none" strokeLinecap="round" />}
          </Svg>
        </View>
        <View style={styles.bt_column} pointerEvents="none">
          {leftItems.map((item, index) => {
            const dotKey = `left_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'left' };
            return ( <View key={dotKey} style={styles.bt_itemRow}><Image source={typeof item.image === 'string' ? {uri: item.image} : item.image} style={styles.bt_image} resizeMode="cover" /><View ref={(r) => { dotRefs.current[dotKey] = r; }} style={styles.bt_dot} onLayout={measureAllDots} /></View> );
          })}
        </View>
        <View style={styles.bt_column} pointerEvents="none">
          {rightItems.map((item, index) => {
            const dotKey = `right_${index}`;
            if (!dotLayouts.current[dotKey]) dotLayouts.current[dotKey] = { x: 0, y: 0, word: item.word, type: 'right' };
            return ( <View key={dotKey} style={[styles.bt_itemRow, { justifyContent: 'flex-start' }]}><View ref={(r) => { dotRefs.current[dotKey] = r; }} style={[styles.bt_dot, { marginRight: 10 }]} onLayout={measureAllDots} /><View style={styles.bt_wordBox}><Text style={styles.bt_wordText}>{item.word}</Text></View></View> );
          })}
        </View>
        <View style={[StyleSheet.absoluteFill, { zIndex: 99 }, Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } as any : {}]} {...panResponder.panHandlers} />
      </View>
      {score !== null && (
        <View style={styles.bt_resultModal}>
          <Text style={styles.bt_resultText}>Điểm của bé: {score}/10 {score === 10 ? '🎉' : '👏'}</Text>
          <TouchableOpacity style={styles.bt_replayBtn} onPress={startNewGame}><Text style={styles.bt_replayBtnText}>Chơi lại 🔄</Text></TouchableOpacity>
        </View>
      )}
      <Modal visible={showVideoPopup && randomVideo !== null} transparent={true} animationType="fade">
        <View style={styles.bt_videoOverlay}>
          <View style={styles.bt_videoWrapper}>
            <Video source={randomVideo} style={styles.bt_smallVideo} resizeMode={ResizeMode.CONTAIN} shouldPlay onPlaybackStatusUpdate={(status) => { if (status.isLoaded && status.didJustFinish) setShowVideoPopup(false); }} />
            <TouchableOpacity style={styles.bt_skipVideoBtn} onPress={() => setShowVideoPopup(false)}><Text style={styles.bt_skipVideoText}>X</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function TiengVietHubScreen() {
  const { colors } = useTheme();
  const [currentView, setCurrentView] = useState<'menu' | 'ghep_van' | 'tap_doc' | 'bai_tap'>('menu');
  const [fontsLoaded] = useFonts({ 'HP001': require('../../assets/fonts/HP001.ttf') });
  if (!fontsLoaded) return null;
  if (currentView === 'ghep_van') return <GhepVanGame onBack={() => setCurrentView('menu')} />;
  if (currentView === 'tap_doc') return <TapDocGame onBack={() => setCurrentView('menu')} />;
  if (currentView === 'bai_tap') return <BaiTapGame onBack={() => setCurrentView('menu')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: '#FBCFE8', borderBottomColor: '#F9A8D4' }]}><Text style={[styles.title, { color: '#BE185D' }]}>Siêu Thị Tiếng Việt 🛒</Text></View>
      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#38BDF8', backgroundColor: '#F0F9FF' }]} onPress={() => setCurrentView('ghep_van')}><Text style={styles.menuIcon}>🅰️</Text><View><Text style={[styles.menuTitle, { color: '#0284C7' }]}>Bé Ghép Vần</Text><Text style={{ color: '#0EA5E9', fontSize: 16 }}>Ghép phụ âm và nguyên âm</Text></View></TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#4ADE80', backgroundColor: '#F0FDF4' }]} onPress={() => setCurrentView('tap_doc')}><Text style={styles.menuIcon}>📖</Text><View><Text style={[styles.menuTitle, { color: '#166534' }]}>Bé Tập Đọc</Text><Text style={{ color: '#22C55E', fontSize: 16 }}>Nhìn hình đoán chữ</Text></View></TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#FACC15', backgroundColor: '#FEFCE8' }]} onPress={() => setCurrentView('bai_tap')}><Text style={styles.menuIcon}>✏️</Text><View><Text style={[styles.menuTitle, { color: '#854D0E' }]}>Nối Từ Cùng Bé</Text><Text style={{ color: '#EAB308', fontSize: 16 }}>Nối hình ảnh với chữ</Text></View></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 }, title: { fontSize: 30, fontWeight: '900' }, backBtn: { position: 'absolute', left: 20, zIndex: 10 },
  menuContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }, menuCard: { width: '90%', maxWidth: 400, flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 20, borderRadius: 25, borderWidth: 4, elevation: 5 }, menuIcon: { fontSize: 60, marginRight: 20 }, menuTitle: { fontSize: 26, fontWeight: '900' },
  gv_mainContent: { flex: 1, flexDirection: 'row' }, gv_leftColumn: { width: 100, borderRightWidth: 2, backgroundColor: 'rgba(0,0,0,0.02)' }, gv_leftScroll: { padding: 10, paddingBottom: 30 }, gv_consonantBtn: { height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderRadius: 15, marginBottom: 10, elevation: 3 }, gv_consonantText: { fontSize: 55, fontFamily: 'HP001', lineHeight: 85 }, gv_rightColumn: { flex: 1, backgroundColor: 'transparent' }, gv_rightScroll: { padding: 15, paddingBottom: 50 }, gv_vowelGroup: { backgroundColor: 'white', borderRadius: 20, padding: 10, marginBottom: 20, borderWidth: 2, borderColor: '#E2E8F0', elevation: 2 }, gv_vowelHeader: { backgroundColor: '#F1F5F9', paddingVertical: 5, borderRadius: 10, marginBottom: 10, alignItems: 'center' }, gv_vowelHeaderText: { fontSize: 60, fontFamily: 'HP001', color: '#0284C7' }, gv_wordRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }, gv_wordBox: { paddingHorizontal: 15, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' }, gv_wordText: { fontSize: 60, fontFamily: 'HP001' },
  td_mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }, td_imageCard: { width: width * 0.4, height: width * 0.4, borderRadius: 25, borderWidth: 4, overflow: 'hidden', elevation: 8, marginBottom: 30, alignItems: 'center', justifyContent: 'center' }, td_imageSquare: { width: '100%', height: '100%' }, td_wordContainer: { backgroundColor: 'rgba(255, 255, 255, 0.6)', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, marginBottom: 40, borderWidth: 2, borderColor: '#E5E7EB' }, td_wordText: { fontSize: 100, textTransform: 'lowercase', fontFamily: 'HP001' }, td_nextBtn: { flexDirection: 'row', backgroundColor: '#3B82F6', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 5 }, td_nextBtnText: { color: 'white', fontSize: 24, fontWeight: 'bold' }, td_emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 20 }, td_emptyText: { fontSize: 24, fontWeight: 'bold', color: '#4B5563', marginTop: 15, marginBottom: 10 },
  bt_gameArea: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#F9FAFB' }, bt_column: { width: '40%', justifyContent: 'space-around', zIndex: 10 }, bt_itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: 180 }, bt_image: { width: 160, height: 160, borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB', marginRight: 10, backgroundColor: 'white' }, bt_wordBox: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15, borderWidth: 2, borderColor: '#E5E7EB' }, bt_wordText: { fontSize: 50, fontFamily: 'HP001', color: '#1F2937', textTransform: 'lowercase' }, bt_dot: { width: 25, height: 25, borderRadius: 15, backgroundColor: '#9CA3AF', borderWidth: 3, borderColor: '#4B5563', elevation: 3 }, bt_resultModal: { position: 'absolute', top: '40%', left: '10%', right: '10%', backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10, zIndex: 999 }, bt_resultText: { fontSize: 35, fontWeight: 'bold', color: '#EF4444', marginBottom: 20 }, bt_replayBtn: { backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15 }, bt_replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }, bt_videoOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }, bt_videoWrapper: { width: width * 0.5, height: width * 0.5 * (9/16), backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', elevation: 10 }, bt_smallVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, bt_skipVideoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.3)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 }, bt_skipVideoText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
