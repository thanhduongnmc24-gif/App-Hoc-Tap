import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Bật LayoutAnimation cho Android để lúc xổ ngăn kéo xuống nó mượt mà
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// BỘ TỪ ĐIỂN VẦN VÀ THANH ĐIỆU
const VOWEL_TONES: Record<string, string[]> = {
  'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
};

// LUẬT CHÍNH TẢ CHO TỪNG PHỤ ÂM
const CONSONANTS = [
  { letter: 'b', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'c', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, // c không đi với e, ê, i
  { letter: 'd', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'đ', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'g', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, // g đi với a, o, u
  { letter: 'gh', vowels: ['e', 'ê', 'i'] }, // gh đi với e, ê, i
  { letter: 'h', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'k', vowels: ['e', 'ê', 'i'] }, // k đi với e, ê, i
  { letter: 'l', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'm', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'n', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'ng', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] },
  { letter: 'ngh', vowels: ['e', 'ê', 'i'] },
  { letter: 'nh', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'ph', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'r', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 's', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 't', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'th', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'tr', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'v', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'x', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] }
];

export default function TiengVietScreen() {
  const { colors } = useTheme();
  // State lưu trữ chữ cái đang được xổ xuống
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);

  const toggleExpand = (letter: string) => {
    // Kích hoạt hiệu ứng trượt êm ái trước khi cập nhật state
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Nếu bấm lại chữ đang mở thì đóng lại, nếu bấm chữ khác thì mở chữ mới (tự đóng chữ cũ)
    setExpandedLetter(expandedLetter === letter ? null : letter);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📖 Bé Ghép Vần 📖</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {CONSONANTS.map((item) => {
          const isExpanded = expandedLetter === item.letter;

          return (
            <View key={item.letter} style={styles.cardContainer}>
              {/* NÚT PHỤ ÂM GỐC */}
              <TouchableOpacity 
                style={[
                  styles.mainCard, 
                  { backgroundColor: isExpanded ? '#BAE6FD' : colors.card, borderColor: '#38BDF8' }
                ]}
                onPress={() => toggleExpand(item.letter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.mainLetter, { color: isExpanded ? '#0284C7' : colors.text }]}>
                  {item.letter}
                </Text>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={32} 
                  color={isExpanded ? '#0284C7' : '#94A3B8'} 
                />
              </TouchableOpacity>

              {/* NGĂN KÉO CHỨA CÁC TỪ GHÉP (Chỉ hiện khi isExpanded = true) */}
              {isExpanded && (
                <View style={[styles.drawer, { backgroundColor: colors.card, borderColor: '#E2E8F0' }]}>
                  {item.vowels.map((vowel) => (
                    <View key={vowel} style={styles.wordRow}>
                      {/* Vòng lặp lấy 6 thanh điệu của nguyên âm đang xét để ghép với phụ âm */}
                      {VOWEL_TONES[vowel].map((tonedVowel, idx) => {
                        const word = item.letter + tonedVowel;
                        return (
                          <View key={idx} style={styles.wordBox}>
                            <Text style={[styles.wordText, { color: colors.text }]}>{word}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#BAE6FD', borderBottomWidth: 3, borderBottomColor: '#7DD3FC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0369A1' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  cardContainer: { marginBottom: 15 },
  
  // Thanh phụ âm bự chà bá
  mainCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderWidth: 3, 
    borderRadius: 20, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 4
  },
  
  mainLetter: { 
    fontSize: 55, 
    fontFamily: 'HP001' // Font chữ tiểu học chuẩn chỉ
  },

  // Ngăn kéo thả xuống
  drawer: {
    marginTop: -10, // Kéo lùi lên xíu để có cảm giác dính liền vào thẻ chính
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'white'
  },

  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },

  wordBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  wordText: {
    fontSize: 40, 
    fontFamily: 'HP001'
  }
});