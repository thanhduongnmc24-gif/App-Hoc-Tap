import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

type Problem = {
  id: number;
  num1: number;
  num2: number;
  userAnswer: string;
};

export default function LearningScreen() {
  const { colors } = useTheme();
  const [maxLimit, setMaxLimit] = useState(10);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  
  const [showResultModal, setShowResultModal] = useState(false);
  const [score, setScore] = useState(0);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      fetchLimit();
    }, [])
  );

  const fetchLimit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('be_hoc_toan_data').select('max_limit').eq('user_id', user.id).single();
      const fetchedLimit = data?.max_limit || 10;
      
      setMaxLimit(prevLimit => {
        if (prevLimit !== fetchedLimit) {
          setProblems(createNewProblems(fetchedLimit));
          return fetchedLimit;
        }
        return prevLimit;
      });

      setProblems(prevProbs => {
        if (prevProbs.length === 0) {
          return createNewProblems(fetchedLimit);
        }
        return prevProbs;
      });
    }
  };

  // NÂNG CẤP: Sinh 10 câu hỏi KHÔNG TRÙNG NHAU
  const createNewProblems = (limit: number) => {
    setIsSubmitted(false);
    const newProblems: Problem[] = [];
    const usedCombos = new Set<string>(); // Sổ tay ghi nhớ các phép tính đã ra
    
    // Đề phòng anh hai đặt limit quá nhỏ không đủ 10 câu khác nhau (VD: limit=4 chỉ có 6 phép cộng khác nhau)
    let maxAttempts = 100;
    let attempts = 0;

    while (newProblems.length < 10 && attempts < maxAttempts) {
      attempts++;
      let num1 = Math.floor(Math.random() * (limit - 1)) + 1;
      let num2 = Math.floor(Math.random() * (limit - num1)) + 1;
      
      if (limit <= 1) { num1 = 0; num2 = 1; }

      // Tạo "chữ ký" của phép tính (VD: "3+4")
      const comboKey = `${num1}+${num2}`;

      // Nếu sổ tay chưa ghi nhận phép tính này thì mới đưa vào đề
      if (!usedCombos.has(comboKey)) {
        usedCombos.add(comboKey);
        newProblems.push({ id: newProblems.length, num1, num2, userAnswer: '' });
      }
    }

    // Cơ chế chống cháy: Lấp đầy các câu thiếu nếu limit nhỏ làm vòng lặp while kiệt sức
    while (newProblems.length < 10) {
      let num1 = Math.floor(Math.random() * (limit - 1)) + 1;
      let num2 = Math.floor(Math.random() * (limit - num1)) + 1;
      if (limit <= 1) { num1 = 0; num2 = 1; }
      newProblems.push({ id: newProblems.length, num1, num2, userAnswer: '' });
    }

    return newProblems;
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
          window.alert('Khoan đã! Phương Linh chưa làm xong hết 10 câu kìa!');
      } else {
          Alert.alert(
            'Khoan đã!', 
            'Phương Linh chưa làm xong hết 10 câu kìa!',
            [{ text: 'Dạ vâng', style: 'default' }]
          ); 
      }
      return;
    }

    let currentScore = 0;
    problems.forEach(p => {
      if (p.num1 + p.num2 === parseInt(p.userAnswer, 10)) {
        currentScore += 1;
      }
    });

    setScore(currentScore);
    setIsSubmitted(true);
    
    setTimeout(() => {
      setShowResultModal(true);
    }, 100);
  };

  const handleReplay = () => {
    setShowResultModal(false);
    setProblems(createNewProblems(maxLimit));
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📚 Bé Học Toán 📚</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.exerciseColumn}>
          <ScrollView 
            ref={scrollViewRef} 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {problems.map((p, index) => {
              const correctAnswer = p.num1 + p.num2;
              const isWrong = isSubmitted && parseInt(p.userAnswer, 10) !== correctAnswer;
              
              return (
                <View key={p.id} style={styles.problemRow}>
                  <Text style={[styles.problemText, { color: colors.text }]}>Câu {index + 1}:</Text>
                  <View style={styles.mathExpression}>
                    <Text style={[styles.mathText, { color: colors.text }]}>{p.num1} + {p.num2} =</Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.answerBox, 
                        activeInputIndex === index && styles.activeAnswerBox,
                        isWrong && styles.wrongAnswerBox, 
                        { backgroundColor: colors.card, borderColor: activeInputIndex === index ? '#1D4ED8' : isWrong ? '#EF4444' : colors.border }
                      ]}
                      onPress={() => setActiveInputIndex(index)}
                    >
                      <Text style={[
                          styles.answerText, 
                          isWrong ? { color: '#EF4444' } : { color: colors.text } 
                      ]}>
                        {p.userAnswer || '?'}
                      </Text>
                    </TouchableOpacity>

                    {isWrong && (
                      <View style={styles.correctionBadge}>
                        <Text style={styles.correctionText}>Đáp án: {correctAnswer}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>🏆 CHẤM ĐIỂM 🏆</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.numpadColumn}>
          {activeInputIndex !== null ? (
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

      <Modal visible={showResultModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 KẾT QUẢ 🎉</Text>
            
            <Text style={styles.scoreText}>{score}</Text>
            
            <Text style={styles.messageText}>
              {score === 10 ? 'Quá đỉnh! Phương Linh đạt điểm tuyệt đối! 🌟' : 
               score >= 7 ? 'Rất giỏi! Bé cố gắng thêm chút nữa nhé! 💪' : 
               'Lần sau mình làm cẩn thận hơn nha bé! 🎈'}
            </Text>
            
            <TouchableOpacity 
              style={styles.replayBtn} 
              onPress={handleReplay}
            >
              <Text style={styles.replayBtnText}>Làm Lại Bài Mới 🔄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 15 }} 
              onPress={() => setShowResultModal(false)}
            >
              <Text style={{ color: 'gray', fontSize: 16 }}>Đóng để xem lại bài</Text>
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
  problemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.5)', padding: 10, borderRadius: 15 },
  problemText: { fontSize: 22, fontWeight: 'bold', width: 90, color: '#4B5563' },
  mathExpression: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-start' },
  mathText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginRight: 15 },
  answerBox: { width: 80, height: 60, borderWidth: 3, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  
  activeAnswerBox: { borderWidth: 4, backgroundColor: '#DBEAFE', shadowColor: '#1D4ED8', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  wrongAnswerBox: { backgroundColor: '#FEF2F2' },
  
  answerText: { fontSize: 32, fontWeight: 'bold' },
  
  correctionBadge: { marginLeft: 15, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#22C55E' },
  correctionText: { color: '#15803D', fontSize: 18, fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#F59E0B', paddingVertical: 15, borderRadius: 20, alignItems: 'center', marginTop: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  submitBtnText: { color: 'white', fontSize: 24, fontWeight: '900' },
  
  numpadContainer: { width: '100%', maxWidth: 350, backgroundColor: '#F3F4F6', padding: 15, borderRadius: 20, borderWidth: 2, borderColor: '#D1D5DB' },
  numpadTitle: { textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#374151' },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  numpadBtn: { width: '30%', aspectRatio: 1.2, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  numpadText: { fontSize: 30, fontWeight: 'bold', color: '#1F2937' },
  placeholderNumpad: { alignItems: 'center', justifyContent: 'center', flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 30, borderRadius: 25, alignItems: 'center', width: 350, borderWidth: 6, borderColor: '#FCD34D' },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#F59E0B', marginBottom: 10 },
  scoreText: { fontSize: 90, fontWeight: '900', color: '#EF4444', marginBottom: 10 },
  messageText: { fontSize: 22, textAlign: 'center', color: '#4B5563', marginBottom: 25, fontWeight: '700' },
  replayBtn: { backgroundColor: '#10B981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});