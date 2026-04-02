import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Image, Modal, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av'; 

// Import kho ảnh và kho video
import { GIOI_IMAGES, TOT_IMAGES, CAN_CO_GAN_IMAGES, ALL_IMAGES } from '../../constants/kho_anh';
import { GIOI_VIDEOS, TOT_VIDEOS, CAN_CO_GAN_VIDEOS } from '../../constants/kho_video';

// Khai báo cây thước đo chiều rộng màn hình
const { width } = Dimensions.get('window');

type Problem = {
  id: number;
  num1: number;
  num2: number;
  operator: '+' | '-';
  userAnswer: string;
};

export default function LearningScreen() {
  const { colors } = useTheme();
  const [maxLimit, setMaxLimit] = useState(10);
  const [mathType, setMathType] = useState('ca_hai'); // Lưu loại phép tính
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  
  const [score, setScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [randomImage, setRandomImage] = useState(GIOI_IMAGES[0]); 
  const [randomVideo, setRandomVideo] = useState<any>(null); 
  
  const [childName, setChildName] = useState('Bé yêu');
  const [showVideoPopup, setShowVideoPopup] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // 3 CÁI RỔ NHÁP ĐỂ CHỨA VIDEO CHƯA CHIẾU (CHỐNG LẶP LẠI)
  const unseenGioi = useRef([...GIOI_VIDEOS]);
  const unseenTot = useRef([...TOT_VIDEOS]);
  const unseenCanCoGan = useRef([...CAN_CO_GAN_VIDEOS]);

  useEffect(() => {
    const preloadAssets = async () => {
      try {
        await Asset.loadAsync(ALL_IMAGES);
      } catch (e) {
        console.warn('Lỗi tải trước tài nguyên:', e);
      }
    };
    preloadAssets();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
      fetchChildName(); 
    }, [])
  );

  const fetchChildName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('childName');
      if (savedName) {
        setChildName(savedName);
      }
    } catch (e) {
      console.log('Không lấy được tên bé', e);
    }
  };

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('be_hoc_toan_data')
        .select('max_limit, loai_phep_tinh')
        .eq('user_id', user.id)
        .single();
      
      const fetchedLimit = data?.max_limit || 10;
      const fetchedType = data?.loai_phep_tinh || 'ca_hai';
      
      setMathType(fetchedType);
      setMaxLimit(fetchedLimit);
      
      // Luôn tạo đề mới dựa trên cài đặt mới nhất từ mây
      setProblems(createNewProblems(fetchedLimit, fetchedType));
    }
  };

  // BỘ NÃO RA ĐỀ PHIÊN BẢN V3 (Có đọc Cài Đặt) CỦA TÈO
  const createNewProblems = (limit: number, type: string) => {
    setIsSubmitted(false);
    let additions: Problem[] = [];
    let subtractions: Problem[] = [];
    const usedCombos = new Set<string>();

    const safeLimit = Math.max(limit, 2);

    // Tính toán số lượng câu mỗi loại dựa trên cài đặt
    let numAdd = 0;
    let numSub = 0;
    
    if (type === 'cong') { numAdd = 10; }
    else if (type === 'tru') { numSub = 10; }
    else { numAdd = 5; numSub = 5; } // Mặc định là cả hai

    // --- BƯỚC 1: TẠO PHÉP CỘNG ---
    let attempts = 0;
    while (additions.length < numAdd && attempts < 100) {
      attempts++;
      let num1 = Math.floor(Math.random() * (safeLimit - 1)) + 1; 
      let num2 = Math.floor(Math.random() * (safeLimit - num1)) + 1; 
      
      const comboKey = `${num1}+${num2}`;
      if (!usedCombos.has(comboKey)) {
        usedCombos.add(comboKey);
        additions.push({ id: 0, num1, num2, operator: '+', userAnswer: '' });
      }
    }
    while (additions.length < numAdd) {
      let num1 = Math.floor(Math.random() * (safeLimit - 1)) + 1;
      let num2 = Math.floor(Math.random() * (safeLimit - num1)) + 1;
      additions.push({ id: 0, num1, num2, operator: '+', userAnswer: '' });
    }

    // --- BƯỚC 2: TẠO PHÉP TRỪ ---
    let hasZeroResultProblem = false; // Công tắc thần thánh giới hạn 1 câu = 0
    attempts = 0;

    while (subtractions.length < numSub && attempts < 100) {
      attempts++;
      let num1 = Math.floor(Math.random() * safeLimit) + 1; 
      
      if (hasZeroResultProblem && num1 === 1) {
         continue; 
      }

      let num2;
      if (hasZeroResultProblem) {
         num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      } else {
         num2 = Math.floor(Math.random() * num1) + 1;
      }
      
      const comboKey = `${num1}-${num2}`;
      if (!usedCombos.has(comboKey)) {
        usedCombos.add(comboKey);
        subtractions.push({ id: 0, num1, num2, operator: '-', userAnswer: '' });
        
        if (num1 === num2) {
           hasZeroResultProblem = true;
        }
      }
    }

    while (subtractions.length < numSub) {
      let num1 = Math.floor(Math.random() * safeLimit) + 1;
      if (hasZeroResultProblem && num1 === 1) {
         num1 = 2; 
      }

      let num2;
      if (hasZeroResultProblem) {
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      } else {
        num2 = Math.floor(Math.random() * num1) + 1;
      }

      subtractions.push({ id: 0, num1, num2, operator: '-', userAnswer: '' });
      if (num1 === num2) {
        hasZeroResultProblem = true;
      }
    }

    // --- BƯỚC 3: GỘP LẠI VÀ XÓC ĐĨA ---
    const combined = [...additions, ...subtractions];
    
    // Trộn ngẫu nhiên bài toán
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    // --- BƯỚC 4: ĐÁNH LẠI ID CHO REACT KHỎI LA LÀNG ---
    return combined.map((prob, index) => ({ ...prob, id: index }));
  };

  const handleKeyPress = (val: string) => {
    if (activeInputIndex === null) return;
    setIsSubmitted(false);
    
    setProblems(prev => {
      const newProbs = [...prev];
      if (newProbs[activeInputIndex].userAnswer.length < 3) {
        newProbs[activeInputIndex].userAnswer += val;
      }
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

  const handleNumpadOK = () => {
    setActiveInputIndex(null);
  };

  const handleSubmit = () => {
    setActiveInputIndex(null);

    const isCompleted = problems.every(p => p.userAnswer !== '');
    if (!isCompleted) {
      if (Platform.OS === 'web') {
          window.alert(`Khoan đã! ${childName} chưa làm xong hết 10 câu kìa!`);
      } else {
          Alert.alert('Khoan đã!', `${childName} chưa làm xong hết 10 câu kìa!`, [{ text: 'Dạ vâng', style: 'default' }]); 
      }
      return;
    }

    let currentScore = 0;
    problems.forEach(p => {
      const expectedAnswer = p.operator === '+' ? p.num1 + p.num2 : p.num1 - p.num2;
      if (expectedAnswer === parseInt(p.userAnswer, 10)) {
        currentScore += 1;
      }
    });

    setScore(currentScore);
    setIsSubmitted(true);
    
    let selectedImageArray;
    let originalVideoArray;
    let unseenRef: React.MutableRefObject<any[]>;

    if (currentScore >= 9) {
      selectedImageArray = GIOI_IMAGES;
      originalVideoArray = GIOI_VIDEOS;
      unseenRef = unseenGioi;
    } else if (currentScore >= 6) {
      selectedImageArray = TOT_IMAGES;
      originalVideoArray = TOT_VIDEOS;
      unseenRef = unseenTot;
    } else {
      selectedImageArray = CAN_CO_GAN_IMAGES;
      originalVideoArray = CAN_CO_GAN_VIDEOS;
      unseenRef = unseenCanCoGan;
    }

    if (selectedImageArray && selectedImageArray.length > 0) {
        const randImg = selectedImageArray[Math.floor(Math.random() * selectedImageArray.length)];
        setRandomImage(randImg);
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
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    setTimeout(() => {
      if (originalVideoArray && originalVideoArray.length > 0) {
        setShowVideoPopup(true);
      }
    }, 1000); 
  };

  const handleReplay = () => {
    setProblems(createNewProblems(maxLimit, mathType));
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setShowVideoPopup(false); 
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
        <TouchableOpacity style={[styles.numpadBtn, { backgroundColor: '#10B981' }]} onPress={handleNumpadOK}>
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
      {score === 10 && (
        <ConfettiCannon count={200} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut={true} autoStart={true} />
      )}
      <Text style={styles.modalTitle}>🎉 KẾT QUẢ 🎉</Text>
      <Text style={styles.scoreText}>{score}</Text>
      {randomImage && <Image source={randomImage} style={styles.funnyImage} />}
      <Text style={styles.messageText}>
        {score >= 9 ? `Xuất sắc! ${childName} quá đỉnh! 🌟` : 
         score >= 6 ? `Giỏi lắm ${childName}! Ráng đúng hết nha! 💪` : 
         `${childName} ơi cẩn thận hơn nha bé! 🎈`}
      </Text>
      <TouchableOpacity style={styles.replayBtn} onPress={handleReplay}>
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
              const correctAnswer = p.operator === '+' ? p.num1 + p.num2 : p.num1 - p.num2;
              const isWrong = isSubmitted && parseInt(p.userAnswer, 10) !== correctAnswer;
              
              return (
                <View key={p.id} style={styles.problemRow}>
                  <Text style={[styles.problemText, { color: colors.text }]}>Câu {index + 1}:</Text>
                  <View style={styles.mathExpression}>
                    <Text style={[styles.mathText, { color: colors.text }]}>{p.num1} {p.operator} {p.num2} =</Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.answerBox, 
                        activeInputIndex === index && styles.activeAnswerBox,
                        isWrong && styles.wrongAnswerBox, 
                        { backgroundColor: colors.card, borderColor: activeInputIndex === index ? '#1D4ED8' : isWrong ? '#EF4444' : colors.border }
                      ]}
                      onPress={() => { if (!isSubmitted) setActiveInputIndex(index); }}
                      disabled={isSubmitted} 
                    >
                      <Text style={[styles.answerText, isWrong ? { color: '#EF4444' } : { color: colors.text }]}>
                        {p.userAnswer || '?'}
                      </Text>
                    </TouchableOpacity>

                    {isWrong && (
                      <View style={styles.correctionBadge}>
                        <Text style={styles.correctionText}>{correctAnswer}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.numpadColumn}>
          {isSubmitted ? (
             <ScoreBoard />
          ) : activeInputIndex !== null ? (
             <Numpad />
          ) : (
             <View style={styles.placeholderNumpad}>
                <Ionicons name="calculator-outline" size={80} color={colors.border} />
                <Text style={{ color: 'gray', marginTop: 10, fontSize: 18, textAlign: 'center' }}>
                  Chạm vào ô dấu "?" để mở bàn phím
                </Text>
             </View>
          )}
        </View>
      </View>

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