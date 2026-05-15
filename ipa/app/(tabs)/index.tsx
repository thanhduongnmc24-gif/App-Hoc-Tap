import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Image, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av'; 

// Import kho ảnh và kho video mặc định
import { GIOI_IMAGES, TOT_IMAGES, CAN_CO_GAN_IMAGES } from '../../constants/kho_anh';
import { GIOI_VIDEOS, TOT_VIDEOS, CAN_CO_GAN_VIDEOS } from '../../constants/kho_video';

const { width } = Dimensions.get('window');

type Problem = { id: number; num1: number; num2: number; operator: '+' | '-'; userAnswer: string; };

export default function LearningScreen() {
  const { colors } = useTheme();
  const [maxLimit, setMaxLimit] = useState(10);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [randomImage, setRandomImage] = useState<any>(null); 
  const [randomVideo, setRandomVideo] = useState<any>(null); 
  const [childName, setChildName] = useState('Bé yêu');
  const [showVideoPopup, setShowVideoPopup] = useState(false);

  // Lưu trữ cấu hình tư liệu
  const [customMedia, setCustomMedia] = useState<any[]>([]);
  const [disabledDefaults, setDisabledDefaults] = useState<string[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const unseenVideos = useRef<any[]>([]); // Gộp chung rổ video cho dễ quản lý

  useFocusEffect(
    useCallback(() => {
      fetchLocalData();
    }, [])
  );

  const fetchLocalData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('childName');
      if (savedName) setChildName(savedName);

      const savedLimitStr = await AsyncStorage.getItem('maxLimit');
      const fetchedLimit = savedLimitStr ? parseInt(savedLimitStr, 10) : 10;
      setMaxLimit(fetchedLimit);
      setProblems(prev => prev.length === 0 ? createNewProblems(fetchedLimit) : prev);

      // Nạp cấu hình kho tư liệu
      const savedMedia = await AsyncStorage.getItem('customMedia');
      if (savedMedia) setCustomMedia(JSON.parse(savedMedia));

      const savedDisabled = await AsyncStorage.getItem('disabledDefaults');
      if (savedDisabled) setDisabledDefaults(JSON.parse(savedDisabled));
    } catch (e) {
      console.log('Không lấy được dữ liệu offline', e);
    }
  };

  const createNewProblems = (limit: number) => {
    setIsSubmitted(false);
    let additions: Problem[] = [];
    let subtractions: Problem[] = [];
    const usedCombos = new Set<string>();
    const safeLimit = Math.max(limit, 2);

    let attempts = 0;
    while (additions.length < 5 && attempts < 100) {
      attempts++;
      let num1 = Math.floor(Math.random() * (safeLimit - 1)) + 1; 
      let num2 = Math.floor(Math.random() * (safeLimit - num1)) + 1; 
      const comboKey = `${num1}+${num2}`;
      if (!usedCombos.has(comboKey)) {
        usedCombos.add(comboKey);
        additions.push({ id: 0, num1, num2, operator: '+', userAnswer: '' });
      }
    }
    while (additions.length < 5) additions.push({ id: 0, num1: 1, num2: 1, operator: '+', userAnswer: '' });

    let hasZero = false; 
    attempts = 0;
    while (subtractions.length < 5 && attempts < 100) {
      attempts++;
      let num1 = Math.floor(Math.random() * safeLimit) + 1; 
      if (hasZero && num1 === 1) continue; 
      let num2 = hasZero ? Math.floor(Math.random() * (num1 - 1)) + 1 : Math.floor(Math.random() * num1) + 1;
      const comboKey = `${num1}-${num2}`;
      if (!usedCombos.has(comboKey)) {
        usedCombos.add(comboKey);
        subtractions.push({ id: 0, num1, num2, operator: '-', userAnswer: '' });
        if (num1 === num2) hasZero = true;
      }
    }
    while (subtractions.length < 5) subtractions.push({ id: 0, num1: 2, num2: 1, operator: '-', userAnswer: '' });

    const combined = [...additions, ...subtractions];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.map((prob, index) => ({ ...prob, id: index }));
  };

  const handleKeyPress = (val: string) => {
    if (activeInputIndex === null) return;
    setIsSubmitted(false);
    setProblems(prev => {
      const newProbs = [...prev];
      if (newProbs[activeInputIndex].userAnswer.length < 3) newProbs[activeInputIndex].userAnswer += val;
      return newProbs;
    });
  };

  const handleDelete = () => {
    if (activeInputIndex === null) return;
    setIsSubmitted(false);
    setProblems(prev => {
      const newProbs = [...prev];
      newProbs[activeInputIndex].userAnswer = newProbs[activeInputIndex].userAnswer.slice(0, -1);
      return newProbs;
    });
  };

  // LỌC TƯ LIỆU THEO HỆ THỐNG MỚI
  const getFilteredMedia = (catId: string, defaultsArray: any[], type: 'image' | 'video') => {
    // 1. Lọc hàng mặc định bị tắt
    const activeDefaults = defaultsArray.map((item, index) => ({ item, index }))
      .filter(({ index }) => !disabledDefaults.includes(`${catId}_${index}`))
      .map(({ item }) => item);
    
    // 2. Lấy hàng anh hai tự thêm đang bật
    const activeCustom = customMedia
      .filter(m => m.categoryId === catId && m.type === type && m.isActive)
      .map(m => ({ uri: m.uri }));

    return [...activeDefaults, ...activeCustom];
  };

  const handleSubmit = () => {
    setActiveInputIndex(null);
    if (!problems.every(p => p.userAnswer !== '')) {
      Alert.alert('Khoan đã!', `${childName} chưa làm xong kìa!`, [{ text: 'Dạ vâng' }]); 
      return;
    }

    let currentScore = 0;
    problems.forEach(p => {
      const expected = p.operator === '+' ? p.num1 + p.num2 : p.num1 - p.num2;
      if (expected === parseInt(p.userAnswer, 10)) currentScore += 1;
    });

    setScore(currentScore);
    setIsSubmitted(true);
    
    let catIdImage = '';
    let catIdVideo = '';
    let defaultImgArr: any[] = [];
    let defaultVidArr: any[] = [];

    if (currentScore >= 9) {
      catIdImage = 'gioi_image'; catIdVideo = 'gioi_video';
      defaultImgArr = GIOI_IMAGES; defaultVidArr = GIOI_VIDEOS;
    } else if (currentScore >= 6) {
      catIdImage = 'tot_image'; catIdVideo = 'tot_video';
      defaultImgArr = TOT_IMAGES; defaultVidArr = TOT_VIDEOS;
    } else {
      catIdImage = 'can_co_gan_image'; catIdVideo = 'can_co_gan_video';
      defaultImgArr = CAN_CO_GAN_IMAGES; defaultVidArr = CAN_CO_GAN_VIDEOS;
    }

    // Trộn chung kho
    const finalImages = getFilteredMedia(catIdImage, defaultImgArr, 'image');
    const finalVideos = getFilteredMedia(catIdVideo, defaultVidArr, 'video');

    if (finalImages.length > 0) {
        setRandomImage(finalImages[Math.floor(Math.random() * finalImages.length)]);
    } else { setRandomImage(null); }

    if (finalVideos.length > 0) {
        if (unseenVideos.current.length === 0) unseenVideos.current = [...finalVideos];
        // Đề phòng trường hợp ba mới đổi cấu hình, rổ nháp bị lạc quẻ
        const validUnseen = unseenVideos.current.filter(vid => finalVideos.includes(vid));
        if (validUnseen.length === 0) unseenVideos.current = [...finalVideos];

        const rIndex = Math.floor(Math.random() * unseenVideos.current.length);
        setRandomVideo(unseenVideos.current[rIndex]);
        unseenVideos.current.splice(rIndex, 1);
    } else {
        setRandomVideo(null); 
    }
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => { if (finalVideos.length > 0) setShowVideoPopup(true); }, 1000); 
  };

  const Numpad = () => (
    <View style={styles.numpadContainer}>
      <Text style={styles.numpadTitle}>Nhập Kết Quả</Text>
      <View style={styles.numpadRow}>
        {[1, 2, 3].map(num => (
          <TouchableOpacity key={num} style={styles.numpadBtn} onPress={() => handleKeyPress(num.toString())}>
            <Text style={styles.numpadText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.numpadRow}>
        {[4, 5, 6].map(num => (
          <TouchableOpacity key={num} style={styles.numpadBtn} onPress={() => handleKeyPress(num.toString())}>
            <Text style={styles.numpadText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.numpadRow}>
        {[7, 8, 9].map(num => (
          <TouchableOpacity key={num} style={styles.numpadBtn} onPress={() => handleKeyPress(num.toString())}>
            <Text style={styles.numpadText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.numpadRow}>
        <TouchableOpacity style={[styles.numpadBtn, { backgroundColor: '#FCA5A5' }]} onPress={handleDelete}>
          <Ionicons name="backspace" size={28} color="#991B1B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.numpadBtn} onPress={() => handleKeyPress('0')}>
          <Text style={styles.numpadText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.numpadBtn, { backgroundColor: '#10B981' }]} onPress={() => setActiveInputIndex(null)}>
          <Text style={[styles.numpadText, { color: 'white' }]}>OK</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitBtnRight} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.submitBtnRightText}>🏆 CHẤM ĐIỂM 🏆</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ScoreBoard = () => (
    <View style={styles.scoreBoardContainer}>
      {score === 10 && <ConfettiCannon count={200} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut autoStart />}
      <Text style={styles.modalTitle}>🎉 KẾT QUẢ 🎉</Text>
      <Text style={styles.scoreText}>{score}</Text>
      {randomImage && <Image source={randomImage} style={styles.funnyImage} />}
      <Text style={styles.messageText}>
        {score >= 9 ? `Xuất sắc! ${childName} quá đỉnh! 🌟` : 
         score >= 6 ? `Giỏi lắm ${childName}! Ráng đúng hết nha! 💪` : 
         `${childName} ơi cẩn thận hơn nha bé! 🎈`}
      </Text>
      <TouchableOpacity style={styles.replayBtn} onPress={() => {
        setProblems(createNewProblems(maxLimit));
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        setShowVideoPopup(false);
      }}>
        <Text style={styles.replayBtnText}>Làm Lại Bài Mới 🔄</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📚 {childName} Học Toán 📚</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.exerciseColumn}>
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {problems.map((p, index) => {
              const correct = p.operator === '+' ? p.num1 + p.num2 : p.num1 - p.num2;
              const isWrong = isSubmitted && parseInt(p.userAnswer, 10) !== correct;
              return (
                <View key={p.id} style={styles.problemRow}>
                  <Text style={[styles.problemText, { color: colors.text }]}>Câu {index + 1}:</Text>
                  <View style={styles.mathExpression}>
                    <Text style={[styles.mathText, { color: colors.text }]}>{p.num1} {p.operator} {p.num2} =</Text>
                    <TouchableOpacity 
                      style={[styles.answerBox, activeInputIndex === index && styles.activeAnswerBox, isWrong && styles.wrongAnswerBox, { backgroundColor: colors.card, borderColor: activeInputIndex === index ? '#1D4ED8' : isWrong ? '#EF4444' : colors.border }]}
                      onPress={() => { if (!isSubmitted) setActiveInputIndex(index); }} disabled={isSubmitted} 
                    >
                      <Text style={[styles.answerText, isWrong ? { color: '#EF4444' } : { color: colors.text }]}>{p.userAnswer || '?'}</Text>
                    </TouchableOpacity>
                    {isWrong && <View style={styles.correctionBadge}><Text style={styles.correctionText}>{correct}</Text></View>}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.numpadColumn}>
          {isSubmitted ? <ScoreBoard /> : activeInputIndex !== null ? <Numpad /> : (
             <View style={styles.placeholderNumpad}>
                <Ionicons name="calculator-outline" size={80} color={colors.border} />
                <Text style={{ color: 'gray', marginTop: 10, fontSize: 18, textAlign: 'center' }}>Chạm vào ô dấu "?" để mở bàn phím</Text>
             </View>
          )}
        </View>
      </View>

      <Modal visible={showVideoPopup && randomVideo !== null} transparent animationType="fade">
        <View style={styles.videoOverlay}>
          <View style={styles.videoWrapper}>
            <Video source={randomVideo} style={styles.smallVideo} resizeMode={ResizeMode.CONTAIN} shouldPlay onPlaybackStatusUpdate={(s) => { if (s.isLoaded && s.didJustFinish) setShowVideoPopup(false); }} />
            <TouchableOpacity style={styles.skipVideoBtn} onPress={() => setShowVideoPopup(false)}><Text style={styles.skipVideoText}>X</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#FEF08A', borderBottomWidth: 3, borderBottomColor: '#FDE047' },
  title: { fontSize: 30, fontWeight: '900', color: '#B45309' },
  mainContent: { flex: 1, flexDirection: 'row', padding: 15 },
  exerciseColumn: { flex: 3, paddingRight: 15 },
  numpadColumn: { flex: 2, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 2, borderLeftColor: '#E5E7EB', paddingLeft: 15 },
  scrollContent: { paddingBottom: 50 },
  problemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.5)', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 15 },
  problemText: { fontSize: 22, fontWeight: 'bold', width: 105, color: '#4B5563' },
  mathExpression: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' },
  mathText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginRight: 15 },
  answerBox: { width: 80, height: 60, borderWidth: 3, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  activeAnswerBox: { borderWidth: 4, backgroundColor: '#DBEAFE', shadowColor: '#1D4ED8', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  wrongAnswerBox: { backgroundColor: '#FEF2F2' },
  answerText: { fontSize: 32, fontWeight: 'bold' },
  correctionBadge: { marginLeft: 15, backgroundColor: '#DCFCE7', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#22C55E' },
  correctionText: { color: '#15803D', fontSize: 24, fontWeight: '900' }, 
  numpadContainer: { width: '100%', maxWidth: 350, backgroundColor: '#F3F4F6', padding: 15, borderRadius: 20, borderWidth: 2, borderColor: '#D1D5DB' },
  numpadTitle: { textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#374151' },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  numpadBtn: { width: '30%', aspectRatio: 1.2, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  numpadText: { fontSize: 30, fontWeight: 'bold', color: '#1F2937' },
  placeholderNumpad: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  submitContainer: { width: '100%', alignItems: 'center', paddingTop: 15 },
  submitBtnRight: { width: '100%', backgroundColor: '#F59E0B', paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  submitBtnRightText: { color: 'white', fontSize: 24, fontWeight: '900' },
  scoreBoardContainer: { width: '100%', maxWidth: 350, backgroundColor: 'white', padding: 20, borderRadius: 25, alignItems: 'center', borderWidth: 5, borderColor: '#FCD34D', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#F59E0B', marginBottom: 5 },
  scoreText: { fontSize: 70, fontWeight: '900', color: '#EF4444', marginBottom: 10 },
  funnyImage: { width: 150, height: 150, borderRadius: 15, marginBottom: 15 },
  messageText: { fontSize: 20, textAlign: 'center', color: '#4B5563', marginBottom: 20, fontWeight: '700' },
  replayBtn: { backgroundColor: '#10B981', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 15, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  replayBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  videoOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  videoWrapper: { width: width * 0.5, height: width * 0.5 * (9/16), backgroundColor: '#000', borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 10 },
  smallVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  skipVideoBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.3)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  skipVideoText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});