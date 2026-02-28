import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// BỘ MÁY TỰ ĐỘNG SINH 6 THANH ĐIỆU - KHÔNG BAO GIỜ SÓT CHỮ!
const VOWEL_TONES: Record<string, string[]> = {
  'a': ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  'o': ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  'ô': ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  'ơ': ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  'e': ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  'ê': ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  'i': ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  'y': ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
  'u': ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  'ư': ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
};

// LUẬT CHÍNH TẢ CHUẨN SGK (Quy định phụ âm nào được phép ghép với nguyên âm nào)
const CONSONANTS = [
  { letter: 'b', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'c', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, 
  { letter: 'ch', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'd', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'đ', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'g', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] }, 
  { letter: 'gh', vowels: ['e', 'ê', 'i'] }, 
  { letter: 'gi', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'u', 'ư'] }, // gi không đi với i
  { letter: 'h', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'k', vowels: ['e', 'ê', 'i', 'y'] }, // k chỉ đi với e, ê, i, y
  { letter: 'kh', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'l', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'm', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'n', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'ng', vowels: ['a', 'o', 'ô', 'ơ', 'u', 'ư'] },
  { letter: 'ngh', vowels: ['e', 'ê', 'i'] },
  { letter: 'nh', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'p', vowels: ['a', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư'] }, 
  { letter: 'ph', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'qu', vowels: ['a', 'e', 'ê', 'i', 'y', 'ơ'] }, 
  { letter: 'r', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 's', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 't', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'th', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'tr', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'u', 'ư'] },
  { letter: 'v', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] },
  { letter: 'x', vowels: ['a', 'o', 'ô', 'ơ', 'e', 'ê', 'i', 'y', 'u', 'ư'] }
];

export default function TiengVietScreen() {
  const { colors } = useTheme();
  
  const [selectedLetter, setSelectedLetter] = useState<string>(CONSONANTS[0].letter);
  const activeData = CONSONANTS.find(c => c.letter === selectedLetter);

  const rightScrollRef = useRef<ScrollView>(null);

  const handleSelectLetter = (letter: string) => {
    setSelectedLetter(letter);
    rightScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📖 Bé Ghép Vần 📖</Text>
      </View>

      <View style={styles.mainContent}>
        
        {/* CỘT TRÁI */}
        <View style={[styles.leftColumn, { borderRightColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.leftScroll}>
            {CONSONANTS.map((item) => {
              const isActive = selectedLetter === item.letter;

              return (
                <TouchableOpacity 
                  key={item.letter}
                  style={[
                    styles.consonantBtn, 
                    { backgroundColor: isActive ? '#38BDF8' : colors.card, borderColor: isActive ? '#0284C7' : colors.border }
                  ]}
                  onPress={() => handleSelectLetter(item.letter)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.consonantText, 
                    { color: isActive ? 'white' : colors.text }
                  ]}>
                    {item.letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CỘT PHẢI - MÁY TỰ ĐỘNG CHẠY Ở ĐÂY */}
        <View style={styles.rightColumn}>
          <ScrollView 
            ref={rightScrollRef} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.rightScroll}
          >
            {activeData && activeData.vowels.map((vowel) => (
              <View key={vowel} style={styles.vowelGroup}>
                
                <View style={styles.vowelHeader}>
                  <Text style={styles.vowelHeaderText}>{vowel}</Text>
                </View>
                
                <View style={styles.wordRow}>
                  {VOWEL_TONES[vowel].map((tonedVowel, idx) => {
                    // Máy tự động ghép chữ và thanh điệu
                    const word = activeData.letter + tonedVowel;
                    return (
                      <View key={idx} style={styles.wordBox}>
                        <Text 
                          style={[styles.wordText, { color: colors.text }]}
                          numberOfLines={1} 
                          adjustsFontSizeToFit 
                        >
                          {word}
                        </Text>
                      </View>
                    );
                  })}
                </View>

              </View>
            ))}
          </ScrollView>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#BAE6FD', borderBottomWidth: 3, borderBottomColor: '#7DD3FC' },
  title: { fontSize: 30, fontWeight: '900', color: '#0369A1' },
  
  mainContent: { flex: 1, flexDirection: 'row' },
  
  leftColumn: { 
    width: 100, 
    borderRightWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  leftScroll: { padding: 10, paddingBottom: 30 },
  consonantBtn: {
    height: 80, // Vẫn giữ trần nhà cao 80 cho chữ g, gh, y thòng đuôi thoải mái
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3
  },
  consonantText: {
    fontSize: 55,
    fontFamily: 'HP001',
    lineHeight: 85, 
  },

  rightColumn: { 
    flex: 1, 
    backgroundColor: 'transparent'
  },
  rightScroll: { padding: 15, paddingBottom: 50 },
  vowelGroup: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  vowelHeader: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },
  vowelHeaderText: {
    fontSize: 60, 
    fontFamily: 'HP001',
    color: '#0284C7' 
  },
  
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'center', // 6 chữ lùa ra giữa căng đét
    gap: 10 
  },
  wordBox: {
    paddingHorizontal: 15,
    paddingVertical: 5, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 60, 
    fontFamily: 'HP001'
  }
});