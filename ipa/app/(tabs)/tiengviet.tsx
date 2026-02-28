import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

// TỪ ĐIỂN CHUẨN LỚP 1 - CHỈ CHỨA NHỮNG TỪ CÓ NGHĨA
// Anh hai có thể dễ dàng thêm bớt từ vựng cho bé Phương Linh ngay trong danh sách này!
const DICTIONARY = [
  { 
    letter: 'b', 
    groups: [
      { vowel: 'a', words: ['ba', 'bà', 'bá', 'bả', 'bạ'] },
      { vowel: 'o', words: ['bo', 'bò', 'bó', 'bỏ', 'bọ'] },
      { vowel: 'ô', words: ['bô', 'bồ', 'bố', 'bổ', 'bộ'] },
      { vowel: 'ơ', words: ['bơ', 'bờ', 'bớ', 'bở', 'bợ'] },
      { vowel: 'e', words: ['be', 'bè', 'bé', 'bẻ', 'bẹ'] },
      { vowel: 'ê', words: ['bê', 'bề', 'bế', 'bể', 'bệ'] },
      { vowel: 'i', words: ['bi', 'bì', 'bí', 'bỉ', 'bị'] },
      { vowel: 'u', words: ['bu', 'bù', 'bú', 'bủ', 'bụ'] },
      { vowel: 'ư', words: ['bư', 'bừ', 'bứ', 'bử', 'bự'] }
    ]
  },
  { 
    letter: 'c', 
    groups: [
      { vowel: 'a', words: ['ca', 'cà', 'cá', 'cả'] },
      { vowel: 'o', words: ['co', 'cò', 'có', 'cỏ', 'cọ'] },
      { vowel: 'ô', words: ['cô', 'cồ', 'cố', 'cổ', 'cỗ', 'cộ'] },
      { vowel: 'ơ', words: ['cơ', 'cờ', 'cớ', 'cở', 'cỡ'] },
      { vowel: 'u', words: ['cu', 'cù', 'cú', 'củ', 'cũ', 'cụ'] },
      { vowel: 'ư', words: ['cư', 'cừ', 'cứ', 'cử', 'cữ', 'cự'] }
    ]
  },
  { 
    letter: 'ch', 
    groups: [
      { vowel: 'a', words: ['cha', 'chà', 'chá', 'chả', 'chạ'] },
      { vowel: 'o', words: ['cho', 'chò', 'chó', 'chỏ', 'chọ'] },
      { vowel: 'ô', words: ['chô', 'chồ', 'chỗ', 'chộ'] },
      { vowel: 'ơ', words: ['chơ', 'chờ', 'chớ', 'chợ'] },
      { vowel: 'e', words: ['che', 'chè', 'ché', 'chẻ'] },
      { vowel: 'ê', words: ['chê', 'chề', 'chế', 'chể', 'chệ'] },
      { vowel: 'i', words: ['chi', 'chì', 'chí', 'chỉ', 'chị'] },
      { vowel: 'u', words: ['chu', 'chù', 'chú', 'chủ', 'chũ', 'chụ'] },
      { vowel: 'ư', words: ['chư', 'chừ', 'chứ', 'chữ', 'chự'] }
    ]
  },
  { 
    letter: 'd', 
    groups: [
      { vowel: 'a', words: ['da', 'dà', 'dá', 'dạ'] },
      { vowel: 'o', words: ['do', 'dò', 'dó', 'dỏ', 'dọ'] },
      { vowel: 'ô', words: ['dô', 'dồ', 'dố', 'dỗ', 'dộ'] },
      { vowel: 'ơ', words: ['dơ', 'dờ', 'dớ', 'dở', 'dợ'] },
      { vowel: 'e', words: ['de', 'dè', 'dé', 'dẻ'] },
      { vowel: 'ê', words: ['dê', 'dề', 'dế', 'dễ'] },
      { vowel: 'i', words: ['di', 'dì', 'dí', 'dỉ', 'dị'] },
      { vowel: 'u', words: ['du', 'dù', 'dú', 'dủ', 'dụ'] },
      { vowel: 'ư', words: ['dư', 'dừ', 'dứ', 'dữ', 'dự'] }
    ]
  },
  { 
    letter: 'đ', 
    groups: [
      { vowel: 'a', words: ['đa', 'đà', 'đá', 'đả', 'đã', 'đạ'] },
      { vowel: 'o', words: ['đo', 'đò', 'đó', 'đỏ', 'đọ'] },
      { vowel: 'ô', words: ['đô', 'đồ', 'đố', 'đổ', 'đỗ', 'độ'] },
      { vowel: 'ơ', words: ['đơ', 'đờ', 'đớ', 'đỡ', 'đợ'] },
      { vowel: 'e', words: ['đe', 'đè', 'đé', 'đẻ', 'đẽ'] },
      { vowel: 'ê', words: ['đê', 'đề', 'đế', 'để'] },
      { vowel: 'i', words: ['đi', 'đì', 'đĩ', 'đị'] },
      { vowel: 'u', words: ['đu', 'đù', 'đú', 'đủ'] },
      { vowel: 'ư', words: ['đư', 'đừ', 'đứ', 'đữ', 'đự'] }
    ]
  },
  { 
    letter: 'g', 
    groups: [
      { vowel: 'a', words: ['ga', 'gà', 'gá', 'gả', 'gạ'] },
      { vowel: 'o', words: ['go', 'gò', 'gó', 'gõ', 'gọ'] },
      { vowel: 'ô', words: ['gô', 'gồ', 'gỗ', 'gộ'] },
      { vowel: 'ơ', words: ['gơ', 'gờ', 'gỡ', 'gợ'] },
      { vowel: 'u', words: ['gu', 'gù'] },
      { vowel: 'ư', words: ['gừ', 'gữ'] }
    ]
  },
  { 
    letter: 'gh', 
    groups: [
      { vowel: 'e', words: ['ghe', 'ghè', 'ghé', 'ghẻ', 'ghẹ'] },
      { vowel: 'ê', words: ['ghê', 'ghề', 'ghế', 'ghệ'] },
      { vowel: 'i', words: ['ghi', 'ghì', 'ghị'] }
    ]
  },
  { 
    letter: 'gi', 
    groups: [
      { vowel: 'a', words: ['gia', 'già', 'giá', 'giả', 'giã', 'giạ'] },
      { vowel: 'o', words: ['gio', 'giò', 'gió', 'giỏ'] },
      { vowel: 'ô', words: ['giô', 'giồ', 'giố', 'giỗ', 'giộ'] },
      { vowel: 'ơ', words: ['giơ', 'giờ', 'giớ', 'giở'] },
      { vowel: 'e', words: ['gie', 'giẻ'] },
      { vowel: 'u', words: ['giu', 'giù', 'giú', 'giủ', 'giụ'] },
      { vowel: 'ư', words: ['giữ', 'giự'] }
    ]
  },
  { 
    letter: 'h', 
    groups: [
      { vowel: 'a', words: ['ha', 'hà', 'há', 'hả', 'hạ'] },
      { vowel: 'o', words: ['ho', 'hò', 'hó', 'hỏ', 'họ'] },
      { vowel: 'ô', words: ['hô', 'hồ', 'hố', 'hổ', 'hỗ', 'hộ'] },
      { vowel: 'ơ', words: ['hơ', 'hờ', 'hớ', 'hở'] },
      { vowel: 'e', words: ['he', 'hè', 'hé', 'hẻ'] },
      { vowel: 'ê', words: ['hê', 'hề', 'hế', 'hệ'] },
      { vowel: 'i', words: ['hi', 'hì', 'hí', 'hỉ', 'hĩ', 'hị'] },
      { vowel: 'y', words: ['hy', 'hỷ'] },
      { vowel: 'u', words: ['hu', 'hù', 'hú', 'hủ', 'hũ'] },
      { vowel: 'ư', words: ['hư', 'hừ', 'hứ', 'hử', 'hữ'] }
    ]
  },
  { 
    letter: 'k', 
    groups: [
      { vowel: 'e', words: ['ke', 'kè', 'ké', 'kẻ'] },
      { vowel: 'ê', words: ['kê', 'kề', 'kế', 'kể'] },
      { vowel: 'i', words: ['ki', 'kì', 'kí', 'kỉ', 'kĩ', 'kị'] },
      { vowel: 'y', words: ['ký', 'kỷ', 'kỹ', 'kỵ'] }
    ]
  },
  { 
    letter: 'kh', 
    groups: [
      { vowel: 'a', words: ['kha', 'khà', 'khá', 'khả'] },
      { vowel: 'o', words: ['kho', 'khò', 'khó', 'khỏ', 'khọ'] },
      { vowel: 'ô', words: ['khô', 'khồ', 'khố', 'khổ'] },
      { vowel: 'ơ', words: ['khơ', 'khờ', 'khớ', 'khở'] },
      { vowel: 'e', words: ['khe', 'khè', 'khé', 'khẻ'] },
      { vowel: 'ê', words: ['khê', 'khề', 'khế', 'khể'] },
      { vowel: 'i', words: ['khi', 'khì', 'khí', 'khỉ'] },
      { vowel: 'u', words: ['khu', 'khù', 'khú', 'khủ'] },
      { vowel: 'ư', words: ['khư', 'khừ', 'khứ', 'khử', 'khự'] }
    ]
  },
  { 
    letter: 'l', 
    groups: [
      { vowel: 'a', words: ['la', 'là', 'lá', 'lả', 'lã', 'lạ'] },
      { vowel: 'o', words: ['lo', 'lò', 'ló', 'lỏ', 'lõ', 'lọ'] },
      { vowel: 'ô', words: ['lô', 'lồ', 'lố', 'lỗ', 'lộ'] },
      { vowel: 'ơ', words: ['lơ', 'lờ', 'lớ', 'lở', 'lỡ', 'lợ'] },
      { vowel: 'e', words: ['le', 'lè', 'lé', 'lẻ', 'lẽ', 'lẹ'] },
      { vowel: 'ê', words: ['lê', 'lề', 'lế', 'lể', 'lễ', 'lệ'] },
      { vowel: 'i', words: ['li', 'lì', 'lí', 'lỉ', 'lĩ', 'lị'] },
      { vowel: 'y', words: ['ly', 'lỳ', 'lý'] },
      { vowel: 'u', words: ['lu', 'lù', 'lú', 'lủ', 'lũ'] },
      { vowel: 'ư', words: ['lư', 'lừ', 'lứ', 'lữ', 'lự'] }
    ]
  },
  { 
    letter: 'm', 
    groups: [
      { vowel: 'a', words: ['ma', 'mà', 'má', 'mả', 'mã', 'mạ'] },
      { vowel: 'o', words: ['mo', 'mò', 'mó', 'mỏ', 'mõ', 'mọ'] },
      { vowel: 'ô', words: ['mô', 'mồ', 'mố', 'mổ', 'mỗ', 'mộ'] },
      { vowel: 'ơ', words: ['mơ', 'mờ', 'mớ', 'mở', 'mỡ'] },
      { vowel: 'e', words: ['me', 'mè', 'mé', 'mẻ', 'mẹ'] },
      { vowel: 'ê', words: ['mê', 'mề', 'mế', 'mể'] },
      { vowel: 'i', words: ['mi', 'mì', 'mí', 'mỉ', 'mĩ', 'mị'] },
      { vowel: 'u', words: ['mu', 'mù', 'mú', 'mủ', 'mũ', 'mụ'] },
      { vowel: 'ư', words: ['mư', 'mừ', 'mứ'] }
    ]
  },
  { 
    letter: 'n', 
    groups: [
      { vowel: 'a', words: ['na', 'nà', 'ná', 'nả', 'nã', 'nạ'] },
      { vowel: 'o', words: ['no', 'nò', 'nó', 'nỏ', 'nõ', 'nọ'] },
      { vowel: 'ô', words: ['nô', 'nồ', 'nố', 'nổ', 'nỗ', 'nộ'] },
      { vowel: 'ơ', words: ['nơ', 'nờ', 'nớ', 'nở', 'nợ'] },
      { vowel: 'e', words: ['ne', 'nè', 'né', 'nẻ'] },
      { vowel: 'ê', words: ['nê', 'nề', 'nế', 'nể', 'nệ'] },
      { vowel: 'i', words: ['ni', 'nì', 'ní', 'nỉ', 'nị'] },
      { vowel: 'u', words: ['nu', 'nù', 'nú', 'nủ', 'nụ'] },
      { vowel: 'ư', words: ['nư', 'nừ', 'nứ', 'nữ', 'nự'] }
    ]
  },
  { 
    letter: 'ng', 
    groups: [
      { vowel: 'a', words: ['nga', 'ngà', 'ngá', 'ngả', 'ngã', 'ngạ'] },
      { vowel: 'o', words: ['ngo', 'ngò', 'ngó', 'ngỏ', 'ngõ', 'ngọ'] },
      { vowel: 'ô', words: ['ngô', 'ngồ', 'ngố'] },
      { vowel: 'ơ', words: ['ngơ', 'ngờ', 'ngớ', 'ngợ'] },
      { vowel: 'u', words: ['ngu', 'ngủ', 'ngũ', 'ngụ'] },
      { vowel: 'ư', words: ['ngư', 'ngừ', 'ngứ', 'ngữ', 'ngự'] }
    ]
  },
  { 
    letter: 'ngh', 
    groups: [
      { vowel: 'e', words: ['nghe', 'nghè', 'nghé'] },
      { vowel: 'ê', words: ['nghê', 'nghề', 'nghế', 'nghễ', 'nghệ'] },
      { vowel: 'i', words: ['nghi', 'nghì', 'nghỉ', 'nghĩ', 'nghị'] }
    ]
  },
  { 
    letter: 'nh', 
    groups: [
      { vowel: 'a', words: ['nha', 'nhà', 'nhá', 'nhả', 'nhã', 'nhạ'] },
      { vowel: 'o', words: ['nho', 'nhò', 'nhó', 'nhỏ', 'nhọ'] },
      { vowel: 'ô', words: ['nhô', 'nhồ', 'nhố', 'nhổ', 'nhỗ'] },
      { vowel: 'ơ', words: ['nhơ', 'nhờ', 'nhớ', 'nhở', 'nhỡ'] },
      { vowel: 'e', words: ['nhe', 'nhè', 'nhé', 'nhẻ', 'nhẽ', 'nhẹ'] },
      { vowel: 'ê', words: ['nhê', 'nhề', 'nhế', 'nhệ'] },
      { vowel: 'i', words: ['nhi', 'nhì', 'nhí', 'nhỉ', 'nhĩ', 'nhị'] },
      { vowel: 'u', words: ['nhu', 'nhù', 'nhú', 'nhủ', 'nhũ', 'nhụ'] },
      { vowel: 'ư', words: ['như', 'nhừ', 'nhứ', 'nhữ', 'nhự'] }
    ]
  },
  { 
    letter: 'p', 
    groups: [
      { vowel: 'a', words: ['pa'] },
      { vowel: 'i', words: ['pi'] },
      { vowel: 'u', words: ['pu'] }
    ]
  },
  { 
    letter: 'ph', 
    groups: [
      { vowel: 'a', words: ['pha', 'phà', 'phá', 'phả'] },
      { vowel: 'o', words: ['pho', 'phò', 'phó'] },
      { vowel: 'ô', words: ['phô', 'phố', 'phổ'] },
      { vowel: 'ơ', words: ['phơ', 'phờ', 'phớ', 'phở'] },
      { vowel: 'e', words: ['phe', 'phè', 'phé'] },
      { vowel: 'ê', words: ['phê', 'phề', 'phế'] },
      { vowel: 'i', words: ['phi', 'phì', 'phí', 'phỉ'] },
      { vowel: 'u', words: ['phu', 'phù', 'phú', 'phủ', 'phụ'] }
    ]
  },
  { 
    letter: 'qu', 
    groups: [
      { vowel: 'a', words: ['qua', 'quà', 'quá', 'quả', 'quạ'] },
      { vowel: 'e', words: ['que', 'què', 'qué'] },
      { vowel: 'ê', words: ['quê', 'quề'] },
      { vowel: 'i', words: ['qui', 'quí', 'quì', 'quỉ', 'quĩ', 'quị'] },
      { vowel: 'y', words: ['quy', 'quý', 'quỳ', 'quỷ', 'quỹ'] },
      { vowel: 'ơ', words: ['quơ', 'quờ', 'quở'] }
    ]
  },
  { 
    letter: 'r', 
    groups: [
      { vowel: 'a', words: ['ra', 'rà', 'rá', 'rả', 'rã', 'rạ'] },
      { vowel: 'o', words: ['ro', 'rò', 'ró', 'rỏ', 'rõ'] },
      { vowel: 'ô', words: ['rô', 'rồ', 'rố', 'rổ', 'rộ'] },
      { vowel: 'ơ', words: ['rơ', 'rờ', 'rớ', 'rở'] },
      { vowel: 'e', words: ['re', 'rè', 'ré', 'rẻ'] },
      { vowel: 'ê', words: ['rê', 'rề', 'rế', 'rể', 'rễ'] },
      { vowel: 'i', words: ['ri', 'rì', 'rí', 'rỉ', 'rị'] },
      { vowel: 'u', words: ['ru', 'rù', 'rú', 'rủ', 'rũ'] }
    ]
  },
  { 
    letter: 's', 
    groups: [
      { vowel: 'a', words: ['sa', 'sà', 'sá', 'sả', 'sạ'] },
      { vowel: 'o', words: ['so', 'sò', 'só', 'sỏ', 'sọ'] },
      { vowel: 'ô', words: ['sô', 'sồ', 'số', 'sổ', 'sộ'] },
      { vowel: 'ơ', words: ['sơ', 'sờ', 'sớ', 'sở', 'sợ'] },
      { vowel: 'e', words: ['se', 'sè', 'sé', 'sẻ', 'sẹ'] },
      { vowel: 'ê', words: ['sê', 'sề', 'sế', 'sể', 'sệ'] },
      { vowel: 'i', words: ['si', 'sì', 'sí', 'sỉ', 'sĩ', 'sị'] },
      { vowel: 'u', words: ['su', 'sù', 'sú', 'sủ', 'sụ'] },
      { vowel: 'ư', words: ['sư', 'sừ', 'sứ', 'sử', 'sự'] }
    ]
  },
  { 
    letter: 't', 
    groups: [
      { vowel: 'a', words: ['ta', 'tà', 'tá', 'tả', 'tã', 'tạ'] },
      { vowel: 'o', words: ['to', 'tò', 'tó', 'tỏ', 'tõ'] },
      { vowel: 'ô', words: ['tô', 'tồ', 'tố', 'tổ'] },
      { vowel: 'ơ', words: ['tơ', 'tờ', 'tớ', 'tở'] },
      { vowel: 'e', words: ['te', 'tè', 'té', 'tẻ'] },
      { vowel: 'ê', words: ['tê', 'tề', 'tế', 'tể', 'tệ'] },
      { vowel: 'i', words: ['ti', 'tì', 'tí', 'tỉ', 'tĩ', 'tị'] },
      { vowel: 'y', words: ['ty', 'tỳ', 'tỷ', 'tỵ'] },
      { vowel: 'u', words: ['tu', 'tù', 'tú', 'tủ', 'tụ'] },
      { vowel: 'ư', words: ['tư', 'từ', 'tứ', 'tử', 'tự'] }
    ]
  },
  { 
    letter: 'th', 
    groups: [
      { vowel: 'a', words: ['tha', 'thà', 'thá', 'thả', 'thã'] },
      { vowel: 'o', words: ['tho', 'thò', 'thó', 'thỏ', 'thọ'] },
      { vowel: 'ô', words: ['thô', 'thồ', 'thố', 'thổ'] },
      { vowel: 'ơ', words: ['thơ', 'thờ', 'thớ', 'thở'] },
      { vowel: 'e', words: ['the', 'thè', 'thé', 'thẻ'] },
      { vowel: 'ê', words: ['thê', 'thề', 'thế', 'thể'] },
      { vowel: 'i', words: ['thi', 'thì', 'thí', 'thỉ', 'thị'] },
      { vowel: 'u', words: ['thu', 'thù', 'thú', 'thủ', 'thụ'] },
      { vowel: 'ư', words: ['thư', 'thừ', 'thứ', 'thử'] }
    ]
  },
  { 
    letter: 'tr', 
    groups: [
      { vowel: 'a', words: ['tra', 'trà', 'trá', 'trả', 'trã', 'trạ'] },
      { vowel: 'o', words: ['tro', 'trò', 'tró', 'trỏ', 'trọ'] },
      { vowel: 'ô', words: ['trô', 'trồ', 'trố', 'trổ', 'trộ'] },
      { vowel: 'ơ', words: ['trơ', 'trờ', 'trớ', 'trở', 'trợ'] },
      { vowel: 'e', words: ['tre', 'trè', 'tré', 'trẻ'] },
      { vowel: 'ê', words: ['trê', 'trề', 'trế', 'trể', 'trệ'] },
      { vowel: 'i', words: ['tri', 'trì', 'trí', 'trỉ', 'trị'] },
      { vowel: 'u', words: ['tru', 'trù', 'trú', 'trụ'] },
      { vowel: 'ư', words: ['trư', 'trừ', 'trứ', 'trữ', 'trự'] }
    ]
  },
  { 
    letter: 'v', 
    groups: [
      { vowel: 'a', words: ['va', 'và', 'vá', 'vả', 'vã', 'vạ'] },
      { vowel: 'o', words: ['vo', 'vò', 'vó', 'vỏ', 'võ'] },
      { vowel: 'ô', words: ['vô', 'vồ', 'vố', 'vổ', 'vỗ', 'vộ'] },
      { vowel: 'ơ', words: ['vơ', 'vờ', 'vớ', 'vở', 'vợ'] },
      { vowel: 'e', words: ['ve', 'vè', 'vé', 'vẻ', 'vẽ'] },
      { vowel: 'ê', words: ['vê', 'về', 'vế', 'vể', 'vệ'] },
      { vowel: 'i', words: ['vi', 'vì', 'ví', 'vỉ', 'vĩ', 'vị'] },
      { vowel: 'u', words: ['vu', 'vù', 'vú', 'vũ', 'vụ'] },
      { vowel: 'ư', words: ['vư', 'vừ'] }
    ]
  },
  { 
    letter: 'x', 
    groups: [
      { vowel: 'a', words: ['xa', 'xà', 'xá', 'xả', 'xã', 'xạ'] },
      { vowel: 'o', words: ['xo', 'xò', 'xó', 'xỏ', 'xọ'] },
      { vowel: 'ô', words: ['xô', 'xồ', 'xố', 'xổ', 'xỗ', 'xộ'] },
      { vowel: 'ơ', words: ['xơ', 'xờ', 'xớ', 'xở'] },
      { vowel: 'e', words: ['xe', 'xè', 'xé', 'xẻ'] },
      { vowel: 'ê', words: ['xê', 'xề', 'xế', 'xể', 'xệ'] },
      { vowel: 'i', words: ['xi', 'xì', 'xí', 'xỉ', 'xĩ', 'xị'] },
      { vowel: 'u', words: ['xu', 'xù', 'xú', 'xủ'] },
      { vowel: 'ư', words: ['xư', 'xừ', 'xứ', 'xử', 'xự'] }
    ]
  }
];

export default function TiengVietScreen() {
  const { colors } = useTheme();
  
  const [selectedLetter, setSelectedLetter] = useState<string>(DICTIONARY[0].letter);
  const activeData = DICTIONARY.find(c => c.letter === selectedLetter);

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
            {DICTIONARY.map((item) => {
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

        {/* CỘT PHẢI */}
        <View style={styles.rightColumn}>
          <ScrollView 
            ref={rightScrollRef} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.rightScroll}
          >
            {activeData && activeData.groups.map((group) => (
              <View key={group.vowel} style={styles.vowelGroup}>
                
                <View style={styles.vowelHeader}>
                  <Text style={styles.vowelHeaderText}>{group.vowel}</Text>
                </View>
                
                <View style={styles.wordRow}>
                  {group.words.map((word, idx) => (
                    <View key={idx} style={styles.wordBox}>
                      <Text 
                        style={[styles.wordText, { color: colors.text }]}
                        numberOfLines={1} 
                        adjustsFontSizeToFit 
                      >
                        {word}
                      </Text>
                    </View>
                  ))}
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
    height: 60, 
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
    lineHeight: 65, 
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
    fontSize: 50, 
    fontFamily: 'HP001',
    color: '#0284C7' 
  },
  
  // Tự động phân bổ đều các chữ trên một hàng ngang
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    gap: 10 // Tạo xíu khoảng cách giữa các chữ cho dễ nhìn
  },
  wordBox: {
    paddingHorizontal: 15,
    paddingVertical: 5, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 50, 
    fontFamily: 'HP001'
  }
});