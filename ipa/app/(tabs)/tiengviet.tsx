import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const CONSONANTS = [
  { letter: 'b', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'c', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, 
  { letter: 'd', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'đ', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'g', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, 
  { letter: 'gh', vowels: ['e', 'ê', 'i'] }, 
  { letter: 'h', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'k', vowels: ['e', 'ê', 'i'] }, 
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
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);

  const toggleExpand = (letter: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedLetter(expandedLetter === letter ? null : letter);
  };

  // Hàm "trải phẳng" giao diện để làm được hiệu ứng Sticky Header
  const renderContent = () => {
    const elements: React.JSX.Element[] = [];
    const stickyIndices: number[] = [];

    CONSONANTS.forEach((item) => {
      const isExpanded = expandedLetter === item.letter;

      // Đánh dấu vị trí của thanh tiêu đề (Header) để bắt nó cố định
      stickyIndices.push(elements.length);

      // 1. THANH TIÊU ĐỀ (Phụ âm gốc)
      elements.push(
        <View 
          key={`header-${item.letter}`} 
          style={{ 
            backgroundColor: colors.bg, 
            paddingBottom: isExpanded ? 0 : 15,
            zIndex: 2 // Đảm bảo luôn nằm đè lên ngăn kéo
          }}
        >
          <TouchableOpacity 
            style={[
              styles.mainCard, 
              { backgroundColor: isExpanded ? '#BAE6FD' : colors.card, borderColor: '#38BDF8' }
            ]}
            onPress={() => toggleExpand(item.letter)}
            activeOpacity={0.9}
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
        </View>
      );

      // 2. NGĂN KÉO TỪ GHÉP (Chỉ hiển thị khi đang mở)
      if (isExpanded) {
        elements.push(
          <View key={`content-${item.letter}`} style={{ paddingBottom: 15, zIndex: 1 }}>
            <View style={[styles.drawer, { backgroundColor: colors.card, borderColor: '#E2E8F0' }]}>
              {item.vowels.map((vowel) => (
                <View key={vowel} style={styles.wordRow}>
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
          </View>
        );
      }
    });

    return { elements, stickyIndices };
  };

  const { elements, stickyIndices } = renderContent();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📖 Bé Ghép Vần 📖</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyIndices} // Tuyệt chiêu cố định header nằm ở đây!
      >
        {elements}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#BAE6FD', borderBottomWidth: 3, borderBottomColor: '#7DD3FC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0369A1' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
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
    fontFamily: 'HP001' 
  },

  drawer: {
    marginTop: -15, 
    paddingTop: 25, 
    paddingBottom: 15,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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