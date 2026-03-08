import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder, Platform } from 'react-native';
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
  
  // Tạo 3 đáp án ngẫu nhiên (có 1 đáp án đúng)
  let options = [correctAns];
  while (options.length < 3) {
    let wrongAns = Math.floor(Math.random() * (limit + 2));
    if (!options.includes(wrongAns)) options.push(wrongAns);
  }
  // Trộn lên
  options.sort(() => Math.random() - 0.5);
  
  return { num1, num2, correctAns, options };
};

// ==========================================
// GAME 1: BẮN BONG BÓNG 🎈
// ==========================================
const BongBongGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [isVictory, setIsVictory] = useState(false);

  // Tạo thêm 3 bóng sai nữa cho màn hình nó xôm
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
      }, 2500);
    }
  };

  return (
    <View style={styles.gameContainer}>
      {isVictory && <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={2000} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#EF4444" />
      </TouchableOpacity>
      
      <View style={styles.problemBoard}>
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
            <Text style={styles.bubbleText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==========================================
// GAME 2: ẾCH XANH VƯỢT SÔNG 🐸
// ==========================================
const EchXanhGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [isVictory, setIsVictory] = useState(false);
  const frogAnim = useRef(new Animated.Value(0)).current;

  const handleJump = (ans: number) => {
    if (ans === problem.correctAns) {
      // Ếch nhảy xuống lá sen
      Animated.sequence([
        Animated.timing(frogAnim, { toValue: 150, duration: 300, useNativeDriver: true }),
        Animated.spring(frogAnim, { toValue: 120, friction: 3, useNativeDriver: true })
      ]).start(() => {
        setIsVictory(true);
        setTimeout(() => {
          setIsVictory(false);
          frogAnim.setValue(0); // Ếch về bờ
          setProblem(generateMathProblem(maxLimit));
        }, 2000);
      });
    } else {
      // Nhảy hụt (lắc lư nhẹ)
      Animated.sequence([
        Animated.timing(frogAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(frogAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(frogAnim, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    }
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#E0F2FE' }]}>
      {isVictory && <ConfettiCannon count={100} origin={{x: -10, y: 0}} fallSpeed={2000} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#0284C7" />
      </TouchableOpacity>

      <View style={styles.riverHeader}>
        <Text style={styles.frogQuestion}>Ếch cần nhảy vào số: {problem.num1} + {problem.num2}</Text>
      </View>

      <Animated.Text style={[styles.frogEmoji, { transform: [{ translateY: frogAnim }] }]}>
        🐸
      </Animated.Text>

      <View style={styles.riverBottom}>
        {problem.options.map((ans, index) => (
          <TouchableOpacity key={index} style={styles.lilyPad} onPress={() => handleJump(ans)}>
            <Text style={styles.lilyEmoji}>🍃</Text>
            <Text style={styles.lilyPadText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==========================================
// GAME 3: VUA KHỈ HẢO NGỌT (KÉO THẢ) 🐒🍌
// ==========================================
const BananaItem = ({ option, onDrop }: { option: number, onDrop: (ans: number) => void }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        // Nếu bé kéo quả chuối bay ngược lên trên hơn 120 pixel -> Tính là đút cho khỉ
        if (gesture.dy < -120) {
          onDrop(option);
          // Giấu quả chuối về chỗ cũ âm thầm sau 0.5s
          setTimeout(() => pan.setValue({ x: 0, y: 0 }), 500);
        } else {
          // Trượt tay -> Chuối bật nảy về chỗ cũ
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

  const handleDrop = (ans: number) => {
    if (ans === problem.correctAns) {
      setIsVictory(true);
      setTimeout(() => {
        setIsVictory(false);
        setProblem(generateMathProblem(maxLimit));
      }, 2000);
    }
  };

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#FEF3C7' }]}>
      {isVictory && <ConfettiCannon count={100} origin={{x: -10, y: 0}} fallSpeed={2000} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#D97706" />
      </TouchableOpacity>

      <View style={styles.monkeyArea}>
        <Text style={styles.monkeyEmoji}>{isVictory ? '🐵' : '🐒'}</Text>
        <View style={styles.monkeyBelly}>
          <Text style={styles.monkeyProblem}>{problem.num1} + {problem.num2}</Text>
        </View>
        <Text style={styles.guideText}>(Bé vuốt chuối lên mớm cho khỉ nha)</Text>
      </View>

      <View style={styles.bananaArea}>
        {problem.options.map((ans, index) => (
          <BananaItem key={index} option={ans} onDrop={handleDrop} />
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
  
  // State cực kỳ quan trọng: Quyết định đang ở menu hay ở game nào.
  // Nhờ state này mà khi bé nhảy qua tab khác xong quay lại, game vẫn nằm y nguyên đó!
  const [currentGame, setCurrentGame] = useState<'menu' | 'bongbong' | 'echxanh' | 'vuakhi'>('menu');

  useFocusEffect(
    useCallback(() => {
      // Mỗi lần focus lại tab, Tèo CHỈ cập nhật giới hạn toán mới nhất (lỡ bố mẹ đổi trong Cài đặt),
      // TUYỆT ĐỐI KHÔNG reset currentGame về 'menu' để bảo toàn trạng thái game.
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

  // Bộ định tuyến mini
  if (currentGame === 'bongbong') return <BongBongGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'echxanh') return <EchXanhGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'vuakhi') return <VuaKhiGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;

  // MÀN HÌNH MENU CHỌN TRÒ CHƠI
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
  // Styles Menu Chung
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#FEF08A', borderBottomWidth: 3, borderBottomColor: '#FDE047' },
  title: { fontSize: 28, fontWeight: '900', color: '#B45309' },
  menuContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  menuCard: { width: '90%', maxWidth: 400, flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 20, borderRadius: 25, borderWidth: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  menuIcon: { fontSize: 60, marginRight: 20 },
  menuTitle: { fontSize: 26, fontWeight: '900' },

  // Styles Game Chung
  gameContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 99 },

  // Bong Bong Styles
  problemBoard: { alignSelf: 'center', marginTop: 40, backgroundColor: 'white', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 30, borderWidth: 5, borderColor: '#3B82F6', elevation: 8 },
  problemText: { fontSize: 45, fontWeight: '900', color: '#1E3A8A' },
  bubbleArea: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', padding: 20 },
  bubble: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', margin: 15, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3 },
  bubbleText: { fontSize: 40, fontWeight: '900', color: 'white' },

  // Ech Xanh Styles
  riverHeader: { alignSelf: 'center', marginTop: 40, backgroundColor: 'white', padding: 15, borderRadius: 20, borderWidth: 4, borderColor: '#059669' },
  frogQuestion: { fontSize: 24, fontWeight: 'bold', color: '#065F46' },
  frogEmoji: { fontSize: 100, alignSelf: 'center', marginTop: 30, zIndex: 10 },
  riverBottom: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 50 },
  lilyPad: { alignItems: 'center' },
  lilyEmoji: { fontSize: 80, marginBottom: -40 },
  lilyPadText: { fontSize: 35, fontWeight: '900', color: 'white', zIndex: 2, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },

  // Vua Khi Styles
  monkeyArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  monkeyEmoji: { fontSize: 120 },
  monkeyBelly: { backgroundColor: '#FCD34D', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: -20, borderWidth: 3, borderColor: '#B45309' },
  monkeyProblem: { fontSize: 35, fontWeight: '900', color: '#78350F' },
  guideText: { fontSize: 16, color: '#92400E', marginTop: 10, fontWeight: 'bold', fontStyle: 'italic' },
  bananaArea: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 50 },
  bananaWrapper: { alignItems: 'center', padding: 10 },
  bananaEmoji: { fontSize: 70 },
  bananaText: { fontSize: 30, fontWeight: '900', color: '#B45309', marginTop: -15, backgroundColor: 'white', borderRadius: 15, paddingHorizontal: 10, borderWidth: 2, borderColor: '#F59E0B' }
});