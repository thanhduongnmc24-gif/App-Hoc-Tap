import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabaseConfig';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

// ==========================================
// HÀM TẠO ĐỀ TOÁN CHUNG CHO CẢ 3 TRÒ
// ==========================================
const generateMathProblem = (limit: number) => {
  let num1 = Math.floor(Math.random() * limit);
  let num2 = Math.floor(Math.random() * (limit - num1));
  if (limit <= 1) { num1 = 0; num2 = 1; }
  
  const correctAns = num1 + num2;
  
  let options = [correctAns];
  while (options.length < 3) {
    let wrongAns = Math.floor(Math.random() * (limit + 2));
    if (!options.includes(wrongAns)) options.push(wrongAns);
  }
  options.sort(() => Math.random() - 0.5);
  
  return { num1, num2, correctAns, options };
};

// ==========================================
// GAME 1: BẮN BONG BÓNG 🎈 (BẦU TRỜI)
// ==========================================
const BongBongGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [isVictory, setIsVictory] = useState(false);

  const allBubbles = [...problem.options];
  while (allBubbles.length < 6) {
    let wrongAns = Math.floor(Math.random() * (maxLimit + 5));
    if (!allBubbles.includes(wrongAns)) allBubbles.push(wrongAns);
  }
  allBubbles.sort(() => Math.random() - 0.5);

  const bubbleColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const handlePop = (ans: number) => {
    if (ans === problem.correctAns) {
      setIsVictory(true);
      setTimeout(() => {
        setIsVictory(false);
        setProblem(generateMathProblem(maxLimit));
      }, 1500); 
    }
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#87CEEB' }]}> 
      {isVictory && <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={800} fadeOut={true} />}
      
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#1E3A8A" />
      </TouchableOpacity>

      <Text style={styles.sunEmoji}>☀️</Text>
      <Text style={styles.cloudEmoji1}>☁️</Text>
      <Text style={styles.cloudEmoji2}>☁️</Text>
      <Text style={styles.birdEmoji}>🕊️</Text>
      
      <View style={[styles.problemBoard, { zIndex: 10 }]}>
        <Text style={styles.problemText}>{problem.num1} + {problem.num2} = ?</Text>
      </View>

      <View style={styles.bubbleArea}>
        {allBubbles.map((ans, index) => (
          <TouchableOpacity 
            key={index} 
            activeOpacity={0.7}
            style={[styles.bubble, { backgroundColor: bubbleColors[index % bubbleColors.length] }]}
            onPress={() => handlePop(ans)}
          >
            <View style={styles.bubbleReflection} />
            <Text style={styles.bubbleText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==========================================
// GAME 2: ẾCH XANH VƯỢT SÔNG 🐸 (NHẢY SEN / RỚT SÔNG)
// ==========================================
const EchXanhGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [isVictory, setIsVictory] = useState(false);
  
  // Tèo thêm state độ trong suốt để làm hiệu ứng chìm dưới sông
  const frogAnimY = useRef(new Animated.Value(0)).current;
  const frogOpacity = useRef(new Animated.Value(1)).current;

  const handleJump = (ans: number) => {
    if (ans === problem.correctAns) {
      // Nhảy ĐÚNG: Búng lên cao rồi đáp phịch xuống lá sen bự
      Animated.sequence([
        Animated.timing(frogAnimY, { toValue: -40, duration: 150, useNativeDriver: true }),
        Animated.timing(frogAnimY, { toValue: 160, duration: 250, useNativeDriver: true })
      ]).start(() => {
        setIsVictory(true);
        setTimeout(() => {
          setIsVictory(false);
          frogAnimY.setValue(0);
          setProblem(generateMathProblem(maxLimit));
        }, 1500);
      });
    } else {
      // Nhảy SAI: Búng lên cao, hụt lá sen, rớt tõm xuống sông và chìm lỉm
      Animated.sequence([
        Animated.timing(frogAnimY, { toValue: -40, duration: 150, useNativeDriver: true }),
        Animated.timing(frogAnimY, { toValue: 260, duration: 250, useNativeDriver: true }),
        Animated.timing(frogOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start(() => {
        // Chờ 1 chút cho bé thấy cảnh chìm, rồi lóp ngóp bò lên bờ lại
        setTimeout(() => {
          frogAnimY.setValue(0);
          frogOpacity.setValue(1); 
        }, 800);
      });
    }
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#3B82F6' }]}> 
      {isVictory && <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={800} fadeOut={true} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="white" />
      </TouchableOpacity>

      <View style={styles.grassBank}>
        <View style={styles.riverHeader}>
          <Text style={styles.frogQuestion}>Ếch nhảy vào số: {problem.num1} + {problem.num2}</Text>
        </View>

        {/* LÁ SEN ĐÍCH CHÀ BÁ NẰM MÉP SÔNG NÈ ĐẠI CA */}
        <Text style={styles.bigLilyPadDest}>🍃</Text>

        <Animated.Text style={[styles.frogEmoji, { 
          transform: [{ translateY: frogAnimY }],
          opacity: frogOpacity
        }]}>
          🐸
        </Animated.Text>
        
        <Text style={styles.grassDecor1}>🌾</Text>
        <Text style={styles.grassDecor2}>🌿</Text>
      </View>

      <View style={styles.riverBody}>
        <Text style={styles.wave1}>🌊</Text>
        <Text style={styles.wave2}>🌊</Text>
        <Text style={styles.wave3}>🌊</Text>
        <Text style={styles.fishEmoji}>🐠</Text>

        <View style={styles.riverBottom}>
          {problem.options.map((ans, index) => (
            <TouchableOpacity key={index} style={styles.lilyPad} onPress={() => handleJump(ans)}>
              <Text style={styles.lilyEmoji}>🍃</Text>
              <Text style={styles.lilyPadText}>{ans}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// ==========================================
// GAME 3: VUA KHỈ HẢO NGỌT 🐒🍌 (RỪNG RẬM)
// ==========================================
const BananaItem = ({ option, onDrop }: { option: number, onDrop: (ans: number) => void }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dy < -120) {
          onDrop(option);
          setTimeout(() => pan.setValue({ x: 0, y: 0 }), 300);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  return (
    <Animated.View style={[styles.bananaWrapper, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
      <Text style={styles.bananaEmoji}>🍌</Text>
      <Text style={styles.bananaText}>{option}</Text>
    </Animated.View>
  );
};

const VuaKhiGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [isVictory, setIsVictory] = useState(false);
  const [problemId, setProblemId] = useState(0);

  const handleDrop = (ans: number) => {
    if (ans === problem.correctAns) {
      setIsVictory(true);
      setTimeout(() => {
        setIsVictory(false);
        setProblem(generateMathProblem(maxLimit));
        setProblemId(prev => prev + 1); 
      }, 1500); 
    }
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#D9F99D' }]}>
      {isVictory && <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={800} fadeOut={true} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#14532D" />
      </TouchableOpacity>

      <Text style={styles.jungleTree1}>🌴</Text>
      <Text style={styles.jungleTree2}>🌴</Text>
      <Text style={styles.jungleVine1}>🌿</Text>
      <Text style={styles.jungleVine2}>🌿</Text>

      <View style={styles.monkeyArea}>
        <Text style={styles.monkeyEmoji}>{isVictory ? '🐵' : '🐒'}</Text>
        <View style={styles.monkeyBelly}>
          <Text style={styles.monkeyProblem}>{problem.num1} + {problem.num2}</Text>
        </View>
        <Text style={styles.guideText}>(Bé vuốt chuối đút khỉ ăn nha)</Text>
      </View>

      <View style={styles.bananaArea}>
        {problem.options.map((ans, index) => (
          <BananaItem key={`${problemId}-${index}`} option={ans} onDrop={handleDrop} />
        ))}
      </View>
    </View>
  );
};

// ==========================================
// MÀN HÌNH CHÍNH QUẢN LÝ 3 TRÒ CHƠI
// ==========================================
export default function TroChoiHubScreen() {
  const { colors } = useTheme();
  const [maxLimit, setMaxLimit] = useState(10);
  const [currentGame, setCurrentGame] = useState<'menu' | 'bongbong' | 'echxanh' | 'vuakhi'>('menu');

  useFocusEffect(
    useCallback(() => {
      const fetchLimit = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('be_hoc_toan_data').select('max_limit').eq('user_id', user.id).single();
          if (data?.max_limit) setMaxLimit(data.max_limit);
        }
      };
      fetchLimit();
    }, [])
  );

  if (currentGame === 'bongbong') return <BongBongGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'echxanh') return <EchXanhGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'vuakhi') return <VuaKhiGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rạp Xiếc Trò Chơi 🎪</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#EC4899', backgroundColor: '#FDF2F8' }]} onPress={() => setCurrentGame('bongbong')}>
          <Text style={styles.menuIcon}>🎈</Text>
          <Text style={[styles.menuTitle, { color: '#BE185D' }]}>Bắn Bong Bóng</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuCard, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]} onPress={() => setCurrentGame('echxanh')}>
          <Text style={styles.menuIcon}>🐸</Text>
          <Text style={[styles.menuTitle, { color: '#047857' }]}>Ếch Vượt Sông</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuCard, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]} onPress={() => setCurrentGame('vuakhi')}>
          <Text style={styles.menuIcon}>🐒</Text>
          <Text style={[styles.menuTitle, { color: '#B45309' }]}>Vua Khỉ Hảo Ngọt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#FEF08A', borderBottomWidth: 3, borderBottomColor: '#FDE047' },
  title: { fontSize: 28, fontWeight: '900', color: '#B45309' },
  menuContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  menuCard: { width: '90%', maxWidth: 400, flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 20, borderRadius: 25, borderWidth: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  menuIcon: { fontSize: 60, marginRight: 20 },
  menuTitle: { fontSize: 26, fontWeight: '900' },

  gameContainer: { flex: 1, overflow: 'hidden' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 99 },

  // Bong Bong Styles
  sunEmoji: { position: 'absolute', top: 40, right: 30, fontSize: 80, zIndex: 1 },
  cloudEmoji1: { position: 'absolute', top: 120, left: 20, fontSize: 60, opacity: 0.8, zIndex: 1 },
  cloudEmoji2: { position: 'absolute', top: 80, right: 120, fontSize: 50, opacity: 0.7, zIndex: 1 },
  birdEmoji: { position: 'absolute', top: 200, right: 40, fontSize: 40, zIndex: 1 },
  problemBoard: { alignSelf: 'center', marginTop: 80, backgroundColor: 'white', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 30, borderWidth: 5, borderColor: '#3B82F6', elevation: 8 },
  problemText: { fontSize: 45, fontWeight: '900', color: '#1E3A8A' },
  bubbleArea: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', padding: 20, zIndex: 10 },
  bubble: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', margin: 15, borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3 },
  bubbleReflection: { position: 'absolute', top: 10, left: 15, width: 25, height: 15, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, transform: [{ rotate: '-45deg' }] },
  bubbleText: { fontSize: 40, fontWeight: '900', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },

  // Ech Xanh Styles 
  grassBank: { height: '35%', backgroundColor: '#4ADE80', borderBottomWidth: 5, borderBottomColor: '#166534', zIndex: 10 },
  riverHeader: { alignSelf: 'center', marginTop: 40, backgroundColor: 'white', padding: 15, borderRadius: 20, borderWidth: 4, borderColor: '#059669', zIndex: 15 },
  frogQuestion: { fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  
  // Style cho chiếc lá sen đích bự chà bá
  bigLilyPadDest: { position: 'absolute', bottom: -70, alignSelf: 'center', fontSize: 140, zIndex: 5, transform: [{ rotate: '190deg' }] },
  
  frogEmoji: { fontSize: 100, alignSelf: 'center', marginTop: 10, zIndex: 20 },
  grassDecor1: { position: 'absolute', bottom: 10, left: 30, fontSize: 40 },
  grassDecor2: { position: 'absolute', bottom: 10, right: 40, fontSize: 50 },
  riverBody: { flex: 1, backgroundColor: '#3B82F6' },
  wave1: { position: 'absolute', top: 20, left: 50, fontSize: 40, opacity: 0.6 },
  wave2: { position: 'absolute', top: 80, right: 60, fontSize: 50, opacity: 0.5 },
  wave3: { position: 'absolute', top: 140, left: '40%', fontSize: 30, opacity: 0.4 },
  fishEmoji: { position: 'absolute', top: 100, left: 20, fontSize: 30, opacity: 0.8 },
  riverBottom: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 40, zIndex: 10 },
  lilyPad: { alignItems: 'center' },
  lilyEmoji: { fontSize: 80, marginBottom: -40 },
  lilyPadText: { fontSize: 35, fontWeight: '900', color: 'white', zIndex: 2, textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3 },

  // Vua Khi Styles 
  jungleTree1: { position: 'absolute', top: -20, left: -20, fontSize: 120, zIndex: 1 },
  jungleTree2: { position: 'absolute', top: 40, right: -30, fontSize: 100, zIndex: 1 },
  jungleVine1: { position: 'absolute', top: 0, left: 100, fontSize: 80, zIndex: 1 },
  jungleVine2: { position: 'absolute', top: -10, right: 100, fontSize: 70, zIndex: 1 },
  monkeyArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, zIndex: 10 },
  monkeyEmoji: { fontSize: 130 },
  monkeyBelly: { backgroundColor: '#FCD34D', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: -20, borderWidth: 4, borderColor: '#B45309' },
  monkeyProblem: { fontSize: 35, fontWeight: '900', color: '#78350F' },
  guideText: { fontSize: 18, color: '#92400E', marginTop: 15, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.6)', padding: 5, borderRadius: 10 },
  bananaArea: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 50, zIndex: 10 },
  bananaWrapper: { alignItems: 'center', padding: 10 },
  bananaEmoji: { fontSize: 80 },
  bananaText: { fontSize: 35, fontWeight: '900', color: '#B45309', marginTop: -20, backgroundColor: 'white', borderRadius: 15, paddingHorizontal: 15, borderWidth: 3, borderColor: '#F59E0B' }
});