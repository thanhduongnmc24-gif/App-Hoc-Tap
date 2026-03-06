import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabaseConfig';
import ConfettiCannon from 'react-native-confetti-cannon';

// Lấy kho ảnh từ Tập Đọc sang làm mồi nhử
import { TAP_DOC_DATA } from '../../constants/kho_tap_doc';

type Piece = {
  id: number;
  row: number;
  col: number;
  flipped: boolean;
  isError: boolean;
  num1: number;
  num2: number;
};

export default function LatHinhScreen() {
  const { colors } = useTheme();
  
  const { width } = useWindowDimensions();

  const BOARD_BORDER = 4;
  const BOARD_WIDTH = Platform.OS === 'web' ? Math.min(width * 0.85, 500) : width * 0.85;
  // Tèo gọt cái thớt thành hình vuông hoàn hảo luôn để mảnh ghép ra hình vuông 2x2
  const BOARD_HEIGHT = BOARD_WIDTH; 
  
  const INNER_BOARD_WIDTH = BOARD_WIDTH - BOARD_BORDER * 2;
  const INNER_BOARD_HEIGHT = BOARD_HEIGHT - BOARD_BORDER * 2;
  
  // Chia đôi cả rộng và cao để ra 4 ô vuông 2x2
  const PIECE_WIDTH = INNER_BOARD_WIDTH / 2;
  const PIECE_HEIGHT = INNER_BOARD_HEIGHT / 2;

  const [maxLimit, setMaxLimit] = useState(10);
  const [currentImage, setCurrentImage] = useState<any>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  
  const [activePieceId, setActivePieceId] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [stickers, setStickers] = useState<string[]>([]);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let limit = 10;
    if (user) {
      const { data } = await supabase.from('be_hoc_toan_data').select('max_limit').eq('user_id', user.id).single();
      if (data?.max_limit) limit = data.max_limit;
    }
    setMaxLimit(limit);

    try {
      const savedStickers = await AsyncStorage.getItem('sticker_book');
      if (savedStickers) {
        setStickers(JSON.parse(savedStickers));
      }
    } catch (e) {
      console.log('Lỗi đọc kho sticker', e);
    }

    if (!currentImage) {
      startNewGame(limit);
    }
  };

  const generateQuestion = (limit: number) => {
    let num1 = Math.floor(Math.random() * (limit - 1)) + 1;
    let num2 = Math.floor(Math.random() * (limit - num1)) + 1;
    if (limit <= 1) { num1 = 0; num2 = 1; }
    return { num1, num2 };
  };

  const startNewGame = (limit: number = maxLimit) => {
    if (!TAP_DOC_DATA || TAP_DOC_DATA.length === 0) return;
    
    const randImg = TAP_DOC_DATA[Math.floor(Math.random() * TAP_DOC_DATA.length)];
    setCurrentImage(randImg);
    setIsVictory(false);
    setUserAnswer('');
    setActivePieceId(null);

    const newPieces: Piece[] = [];
    let idCounter = 0;
    // Tèo đổi lưới từ 3x2 thành 2x2 (2 hàng, 2 cột = 4 mảnh)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const { num1, num2 } = generateQuestion(limit);
        newPieces.push({ id: idCounter++, row, col, flipped: false, isError: false, num1, num2 });
      }
    }
    setPieces(newPieces);
  };

  const handlePiecePress = (id: number) => {
    const piece = pieces.find(p => p.id === id);
    if (piece && !piece.flipped) {
      setUserAnswer('');
      setActivePieceId(id);
    }
  };

  const handleKeyPress = (val: string) => {
    if (userAnswer.length < 3) {
      setUserAnswer(prev => prev + val);
    }
  };

  const handleDelete = () => {
    setUserAnswer(prev => prev.slice(0, -1));
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer) return;
    
    const activePiece = pieces.find(p => p.id === activePieceId);
    if (!activePiece) return;

    const correctAnswer = activePiece.num1 + activePiece.num2;
    const isCorrect = parseInt(userAnswer, 10) === correctAnswer;

    if (isCorrect) {
      setActivePieceId(null);
      const updatedPieces = pieces.map(p => p.id === activePieceId ? { ...p, flipped: true, isError: false } : p);
      setPieces(updatedPieces);

      const allFlipped = updatedPieces.every(p => p.flipped);
      if (allFlipped) {
        setIsVictory(true);
        if (!stickers.includes(currentImage.word)) {
          const newStickers = [...stickers, currentImage.word];
          setStickers(newStickers);
          await AsyncStorage.setItem('sticker_book', JSON.stringify(newStickers));
        }
      }
    } else {
      setActivePieceId(null);
      setPieces(pieces.map(p => p.id === activePieceId ? { ...p, isError: true } : p));
    }
  };

  const activePiece = pieces.find(p => p.id === activePieceId);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Lật Hình Giải Đố 🧩</Text>
        <TouchableOpacity style={styles.stickerBtn} onPress={() => setShowStickerBook(true)}>
          <Ionicons name="images" size={24} color="#B45309" />
          <Text style={styles.stickerBtnText}>Sổ Sticker ({stickers.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.boardContainer}>
        {isVictory && <ConfettiCannon count={150} origin={{x: -10, y: 0}} fallSpeed={2500} />}
        
        {currentImage && (
          <View style={[styles.board, isVictory && styles.boardVictory, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
            {pieces.map((piece) => (
              <TouchableOpacity
                key={piece.id}
                activeOpacity={0.8}
                onPress={() => handlePiecePress(piece.id)}
                style={[
                  styles.pieceWrapper,
                  { 
                    width: PIECE_WIDTH, 
                    height: PIECE_HEIGHT,
                    backgroundColor: piece.flipped ? 'transparent' : piece.isError ? '#FECACA' : '#E5E7EB',
                    borderColor: piece.isError ? '#EF4444' : 'white',
                  }
                ]}
              >
                {piece.flipped ? (
                  <Image 
                    source={currentImage.image} 
                    style={{ 
                      width: INNER_BOARD_WIDTH, 
                      height: INNER_BOARD_HEIGHT, 
                      position: 'absolute', 
                      top: 0,  // <-- ĐÓNG ĐINH GÓC TRÊN
                      left: 0, // <-- ĐÓNG ĐINH GÓC TRÁI
                      transform: [
                        { translateX: -(piece.col * PIECE_WIDTH) },
                        { translateY: -(piece.row * PIECE_HEIGHT) }
                      ]
                    }} 
                  />
                ) : (
                  <Ionicons 
                    name={piece.isError ? "alert-circle" : "help-circle"} 
                    size={60} // Tèo tăng size icon lên tí xíu cho cân đối với ô vuông bự
                    color={piece.isError ? "#EF4444" : "#9CA3AF"} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isVictory && (
          <View style={styles.victoryPanel}>
            <Text style={styles.victoryText}>Chúc mừng bé thu thập được:</Text>
            <Text style={styles.victoryWord}>{currentImage?.word}</Text>
            <TouchableOpacity style={styles.replayBtn} onPress={() => startNewGame()}>
              <Text style={styles.replayBtnText}>Chơi Ảnh Khác 🔄</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {activePieceId !== null && activePiece && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setActivePieceId(null)}>
                <Ionicons name="close" size={30} color="#EF4444" />
              </TouchableOpacity>
              
              <Text style={styles.questionText}>Bé tính thử xem:</Text>
              <View style={styles.mathBox}>
                <Text style={styles.mathText}>{activePiece.num1} + {activePiece.num2} = </Text>
                <View style={styles.answerBox}>
                  <Text style={styles.answerText}>{userAnswer || '?'}</Text>
                </View>
              </View>

              <View style={styles.numpadContainer}>
                {[ [1,2,3], [4,5,6], [7,8,9] ].map((row, rIndex) => (
                  <View key={rIndex} style={styles.numpadRow}>
                    {row.map(num => (
                      <TouchableOpacity key={num} style={styles.numpadBtn} onPress={() => handleKeyPress(num.toString())}>
                        <Text style={styles.numpadText}>{num}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <View style={styles.numpadRow}>
                  <TouchableOpacity style={[styles.numpadBtn, { backgroundColor: '#FCA5A5' }]} onPress={handleDelete}>
                    <Ionicons name="backspace" size={28} color="#991B1B" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.numpadBtn} onPress={() => handleKeyPress('0')}>
                    <Text style={styles.numpadText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.numpadBtn, { backgroundColor: '#10B981' }]} onPress={handleSubmitAnswer}>
                    <Text style={[styles.numpadText, { color: 'white' }]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* SỔ TAY STICKER */}
      <Modal visible={showStickerBook} animationType="fade">
        <View style={styles.stickerBookContainer}>
          <View style={styles.stickerHeader}>
            <Text style={styles.stickerTitle}>🏆 Bộ Sưu Tập Của Bé 🏆</Text>
            <TouchableOpacity onPress={() => setShowStickerBook(false)} style={styles.closeStickerBtn}>
              <Ionicons name="close-circle" size={40} color="#EF4444" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.stickerGrid}>
            {TAP_DOC_DATA.map((item, index) => {
              const isUnlocked = stickers.includes(item.word);
              return (
                <View key={index} style={[styles.stickerItem, !isUnlocked && styles.stickerLocked]}>
                  {isUnlocked ? (
                    <>
                      <Image source={item.image} style={styles.stickerImg} />
                      <Text style={styles.stickerName}>{item.word}</Text>
                    </>
                  ) : (
                    <Ionicons name="lock-closed" size={50} color="#9CA3AF" />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF08A', borderBottomWidth: 3, borderBottomColor: '#FDE047' },
  title: { fontSize: 26, fontWeight: '900', color: '#B45309' },
  stickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#F59E0B' },
  stickerBtnText: { marginLeft: 5, fontWeight: 'bold', color: '#B45309' },
  
  boardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  board: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    borderWidth: 4, 
    borderColor: '#4B5563', 
    borderRadius: 10, 
    overflow: 'hidden', 
    backgroundColor: 'white' 
  },
  boardVictory: { borderColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  
  pieceWrapper: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    borderWidth: 1 
  },
  
  victoryPanel: { marginTop: 20, alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 20, borderWidth: 3, borderColor: '#FCD34D', elevation: 5 },
  victoryText: { fontSize: 20, color: '#4B5563', fontWeight: 'bold' },
  victoryWord: { fontSize: 40, fontWeight: '900', color: '#EF4444', marginVertical: 10, textTransform: 'uppercase' },
  replayBtn: { backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15, marginTop: 10 },
  replayBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  // Numpad Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxWidth: 400, backgroundColor: '#F3F4F6', borderRadius: 25, padding: 20, alignItems: 'center', borderWidth: 4, borderColor: '#60A5FA' },
  closeBtn: { position: 'absolute', top: 10, right: 15 },
  questionText: { fontSize: 22, fontWeight: 'bold', color: '#374151', marginBottom: 15 },
  mathBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  mathText: { fontSize: 45, fontWeight: '900', color: '#1F2937' },
  answerBox: { width: 80, height: 60, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#3B82F6' },
  answerText: { fontSize: 40, fontWeight: 'bold', color: '#2563EB' },
  numpadContainer: { width: '100%' },
  numpadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  numpadBtn: { width: '31%', aspectRatio: 1.2, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  numpadText: { fontSize: 30, fontWeight: 'bold', color: '#1F2937' },

  // Sticker Book Modal
  stickerBookContainer: { flex: 1, backgroundColor: '#FFFBEB' },
  stickerHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FDE047', borderBottomWidth: 3, borderBottomColor: '#FACC15', position: 'relative' },
  stickerTitle: { fontSize: 26, fontWeight: '900', color: '#B45309' },
  closeStickerBtn: { position: 'absolute', right: 20 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 15 },
  stickerItem: { width: 140, height: 160, backgroundColor: 'white', margin: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FCD34D', elevation: 4 },
  stickerLocked: { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
  stickerImg: { width: 100, height: 100, borderRadius: 10, marginBottom: 10 },
  stickerName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textTransform: 'capitalize' }
});