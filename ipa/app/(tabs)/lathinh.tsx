import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabaseConfig';
import { Video, ResizeMode } from 'expo-av';

// Nhập khẩu nguyên cái sở thú tự động từ cỗ máy tao_data.js
import { KHO_DONG_VAT } from '../../constants/kho_dong_vat';

const { width } = Dimensions.get('window');

// ==========================================
// HÀM TẠO ĐỀ TOÁN CHUNG
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
// GAME 1: CHO ĐỘNG VẬT ĂN 🐰🥣
// ==========================================
const ChoDongVatAnGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  
  // Tèo sắm một cái rổ để chứa những con vật chưa được lên tivi
  const unseenAnimalsRef = useRef<any[]>([]);

  // Tuyệt chiêu "bốc thăm không hoàn lại"
  const getNextAnimal = useCallback(() => {
    // Nếu kho rỗng thì chịu thua
    if (!KHO_DONG_VAT || KHO_DONG_VAT.length === 0) return null;
    
    // Nếu rổ đã cạn (đã diễn hết một vòng), lùa hết thú vào lại rổ và xóc lên
    if (unseenAnimalsRef.current.length === 0) {
      unseenAnimalsRef.current = [...KHO_DONG_VAT].sort(() => Math.random() - 0.5);
    }
    
    // Bốc 1 em ra khỏi rổ
    return unseenAnimalsRef.current.pop();
  }, []);

  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [videoState, setVideoState] = useState<'idle' | 'eating' | 'crying'>('idle');
  
  // Khởi tạo con vật đầu tiên từ cái rổ
  const [currentAnimal, setCurrentAnimal] = useState(() => getNextAnimal());

  const handleAnswer = (ans: number) => {
    if (videoState !== 'idle' || !currentAnimal) return;

    if (ans === problem.correctAns) {
      setVideoState('eating');
    } else {
      setVideoState('crying');
    }
  };

  const handleVideoFinish = (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      if (videoState === 'eating') {
        // Ăn xong: Chuyển đề toán mới, bốc thú CÒN LẠI TRONG RỔ lên diễn
        setProblem(generateMathProblem(maxLimit));
        setCurrentAnimal(getNextAnimal());
        setVideoState('idle');
      } else if (videoState === 'crying') {
        setVideoState('idle');
      }
    }
  };

  if (!currentAnimal) {
    return (
      <View style={[styles.gameContainer, { backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back-circle" size={50} color="#D97706" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#B45309', textAlign: 'center', padding: 20 }}>
          Đại ca ơi, rạp xiếc chưa có con vật nào! Đại ca hãy quăng hình và video vào trạm nhập hàng rồi chạy tool nha!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#FEF3C7' }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back-circle" size={50} color="#D97706" />
      </TouchableOpacity>

      <View style={styles.animalScreen}>
        {videoState === 'idle' ? (
          <Image 
            source={currentAnimal.image} 
            style={styles.animalMedia} 
            resizeMode="cover" 
          />
        ) : (
          <Video
            source={videoState === 'eating' ? currentAnimal.videoAn : currentAnimal.videoKhoc}
            style={styles.animalMedia}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            onPlaybackStatusUpdate={handleVideoFinish}
          />
        )}
      </View>

      <View style={styles.problemBoard}>
        <Text style={styles.problemText}>{problem.num1} + {problem.num2} = ?</Text>
      </View>

      <View style={styles.answerArea}>
        {problem.options.map((ans, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.foodItem}
            activeOpacity={0.7}
            onPress={() => handleAnswer(ans)}
          >
            {/* Tèo đổi sang cái bát đồ ăn chung chung nè */}
            <Text style={styles.foodEmoji}>🥣</Text>
            <Text style={styles.foodText}>{ans}</Text>
          </TouchableOpacity>
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
  
  const [currentGame, setCurrentGame] = useState<'menu' | 'cho_an' | 'game2' | 'game3'>('menu');

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

  if (currentGame === 'cho_an') return <ChoDongVatAnGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Rạp Xiếc Trò Chơi 🎪</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]} onPress={() => setCurrentGame('cho_an')}>
          <Text style={styles.menuIcon}>🐰</Text>
          <View>
            <Text style={[styles.menuTitle, { color: '#B45309' }]}>Cho Động Vật Ăn</Text>
            <Text style={{ color: '#D97706', fontSize: 16 }}>Cho thú cưng ăn nào!</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuCard, { borderColor: '#9CA3AF', backgroundColor: '#F3F4F6', opacity: 0.7 }]} disabled>
          <Text style={styles.menuIcon}>🚧</Text>
          <View>
            <Text style={[styles.menuTitle, { color: '#4B5563' }]}>Trò Chơi Số 2</Text>
            <Text style={{ color: '#6B7280', fontSize: 16 }}>Đang xây dựng...</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuCard, { borderColor: '#9CA3AF', backgroundColor: '#F3F4F6', opacity: 0.7 }]} disabled>
          <Text style={styles.menuIcon}>🚧</Text>
          <View>
            <Text style={[styles.menuTitle, { color: '#4B5563' }]}>Trò Chơi Số 3</Text>
            <Text style={{ color: '#6B7280', fontSize: 16 }}>Đang xây dựng...</Text>
          </View>
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
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 99, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 30 },

  animalScreen: { 
    width: '100%', 
    aspectRatio: 16/9, 
    backgroundColor: '#000', 
    marginTop: 0,
    borderBottomWidth: 5,
    borderBottomColor: '#B45309',
    elevation: 10
  },
  animalMedia: {
    width: '100%',
    height: '100%'
  },
  problemBoard: { 
    alignSelf: 'center', 
    marginTop: 40, 
    backgroundColor: 'white', 
    paddingHorizontal: 50, 
    paddingVertical: 20, 
    borderRadius: 30, 
    borderWidth: 5, 
    borderColor: '#3B82F6', 
    elevation: 8 
  },
  problemText: { fontSize: 50, fontWeight: '900', color: '#1E3A8A' },
  answerArea: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingBottom: 30,
    paddingHorizontal: 10
  },
  foodItem: { 
    alignItems: 'center', 
    padding: 10 
  },
  foodEmoji: { fontSize: 80 },
  foodText: { 
    fontSize: 40, 
    fontWeight: '900', 
    color: '#B45309', 
    marginTop: -20, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    borderWidth: 4, 
    borderColor: '#F59E0B',
    elevation: 5
  }
});