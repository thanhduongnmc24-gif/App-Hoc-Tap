import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, PanResponder, ScrollView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabaseConfig';
import { Video, ResizeMode, Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';

// TÈO LOẠI BỎ HOÀN TOÀN SKIA VÌ KHÔNG CẦN THIẾT
// CHUYỂN SANG DÙNG SVG THUẦN TÚY 100% - NHẸ MƯỢT, KHÔNG LỖI, CÓ HIỆU ỨNG NEON GLOW XỊN
import Svg, { Path } from 'react-native-svg';

import { KHO_DONG_VAT } from '../../constants/kho_dong_vat';
import { LOTTIE_ANIMALS } from '../../constants/kho_lottie';
import { THU_THACH_IMAGES } from '../../constants/kho_anh';

const { width } = Dimensions.get('window');
const KHO_ANH_TO_MAU: any[] = [];
const BUBBLE_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#000000', '#FFFFFF'];

// ==========================================
// HÀM TẠO ĐỀ TOÁN (GAME 1)
// ==========================================
const generateMathProblem = (limit: number) => {
  const safeLimit = Math.max(limit, 3);
  const correctAns = Math.floor(Math.random() * (safeLimit - 1)) + 2; 
  const num1 = Math.floor(Math.random() * (correctAns - 1)) + 1;
  const num2 = correctAns - num1;
  
  let options = [correctAns];
  while (options.length < 3) {
    let wrongAns = Math.floor(Math.random() * safeLimit) + 1; 
    if (!options.includes(wrongAns)) options.push(wrongAns);
  }
  options.sort(() => Math.random() - 0.5);
  return { num1, num2, correctAns, options };
};

// ==========================================
// GAME 1: CHO ĐỘNG VẬT ĂN
// ==========================================
const ChoDongVatAnGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const unseenAnimalsRef = useRef<any[]>([]);

  const getNextAnimal = useCallback(() => {
    if (!KHO_DONG_VAT || KHO_DONG_VAT.length === 0) return null;
    if (unseenAnimalsRef.current.length === 0) {
      unseenAnimalsRef.current = [...KHO_DONG_VAT].sort(() => Math.random() - 0.5);
    }
    return unseenAnimalsRef.current.pop();
  }, []);

  const [problem, setProblem] = useState(() => generateMathProblem(maxLimit));
  const [videoState, setVideoState] = useState<'idle' | 'eating' | 'crying'>('idle');
  const [currentAnimal, setCurrentAnimal] = useState(() => getNextAnimal());

  const handleAnswer = (ans: number) => {
    if (videoState !== 'idle' || !currentAnimal) return;
    if (ans === problem.correctAns) setVideoState('eating');
    else setVideoState('crying');
  };

  const handleVideoFinish = (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      if (videoState === 'eating') {
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
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#D97706" /></TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#B45309', textAlign: 'center', padding: 20 }}>Rạp xiếc chưa có thú! Đại ca nạp thú vào kho nha!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#FEF3C7' }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#D97706" /></TouchableOpacity>
      <View style={styles.animalScreen}>
        {videoState === 'idle' ? (
          <Image source={currentAnimal.image} style={styles.animalMedia} resizeMode="cover" />
        ) : (
          <Video source={videoState === 'eating' ? currentAnimal.videoAn : currentAnimal.videoKhoc} style={styles.animalMedia} resizeMode={ResizeMode.COVER} shouldPlay onPlaybackStatusUpdate={handleVideoFinish} />
        )}
      </View>
      <View style={styles.problemBoard}><Text style={styles.problemText}>{problem.num1} + {problem.num2} = ?</Text></View>
      <View style={styles.answerArea}>
        {problem.options.map((ans, index) => (
          <TouchableOpacity key={index} style={styles.foodItem} activeOpacity={0.7} onPress={() => handleAnswer(ans)}>
            <Text style={styles.foodEmoji}>🥣</Text><Text style={styles.foodText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==========================================
// GAME 2: BẬP BÊNH TOÁN HỌC
// ==========================================
const DraggableItem = ({ item, onDrop, isAnimal = false }: { item: any, onDrop: (i: any) => void, isAnimal?: boolean }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const playPickSound = async () => {
    try { const { sound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg' }); await sound.playAsync(); sound.setOnPlaybackStatusUpdate((s:any) => { if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); }); } catch (error) {}
  };

  const playDropSound = async () => {
    try { const { sound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg' }); await sound.playAsync(); sound.setOnPlaybackStatusUpdate((s:any) => { if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); }); } catch (error) {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { playPickSound(); Animated.spring(scale, { toValue: 1.2, useNativeDriver: false }).start(); },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
        if (gesture.dy < -60) { playDropSound(); onDrop(item); } 
        else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    })
  ).current;

  return (
    <Animated.View style={[{ transform: [...pan.getTranslateTransform(), { scale }] }]} {...panResponder.panHandlers}>
      {isAnimal ? (
        <View style={styles.dragAnimalBox}>
          <LottieView source={item.lottieAnim} autoPlay loop style={styles.lottieAnimal} />
          <View style={styles.animalBadge}><Text style={styles.animalBadgeText}>{item.val}</Text></View>
        </View>
      ) : (
        <View style={[styles.block3D, { backgroundColor: item.color.bg, borderColor: item.color.border, transform: [{ rotate: item.rot }], marginLeft: item.marginLeft, marginTop: item.marginTop }]}>
          <Text style={styles.block3DText}>{item.val}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const BLOCK_COLORS = [ { bg: '#FCA5A5', border: '#B91C1C' }, { bg: '#93C5FD', border: '#1D4ED8' }, { bg: '#86EFAC', border: '#15803D' }, { bg: '#FDE047', border: '#A16207' }, { bg: '#D8B4FE', border: '#7E22CE' } ];

const BapBenhGame = ({ maxLimit, onBack }: { maxLimit: number, onBack: () => void }) => {
  const initGame = () => {
    const targetLimit = maxLimit > 20 ? 20 : Math.max(maxLimit, 5);
    const target = Math.floor(Math.random() * (targetLimit - 4)) + 5; 
    const sessionKey = Date.now(); 
    const selectedLottie = LOTTIE_ANIMALS && LOTTIE_ANIMALS.length > 0 ? LOTTIE_ANIMALS[Math.floor(Math.random() * LOTTIE_ANIMALS.length)] : null;
    const animal = { id: `a1_${sessionKey}`, lottieAnim: selectedLottie, val: target };
    let blocks = [];
    for(let i = 1; i <= 9; i++) {
      let val = i >= target ? Math.floor(Math.random() * (target - 1)) + 1 : i;
      const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
      blocks.push({ id: `b${i}_${sessionKey}`, val: val, color, rot: `${Math.floor(Math.random() * 40 - 20)}deg`, marginLeft: Math.floor(Math.random() * 5), marginTop: Math.floor(Math.random() * 5) });
    }
    blocks.sort(() => Math.random() - 0.5); 
    return { animal, blocks, target };
  };

  const [gameState, setGameState] = useState(initGame());
  const [animalPlaced, setAnimalPlaced] = useState(false);
  const [placedBlocks, setPlacedBlocks] = useState<any[]>([]);
  const [isVictory, setIsVictory] = useState(false);
  const leftWeight = animalPlaced ? gameState.target : 0;
  const rightWeight = placedBlocks.reduce((sum, b) => sum + b.val, 0);
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const winScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let targetTilt = leftWeight > rightWeight ? -15 : rightWeight > leftWeight ? 15 : 0; 
    Animated.spring(tiltAnim, { toValue: targetTilt, friction: 4, tension: 30, useNativeDriver: true }).start();

    if (leftWeight === rightWeight && leftWeight > 0 && !isVictory) {
      setIsVictory(true);
      Animated.sequence([ Animated.timing(winScaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }), Animated.spring(winScaleAnim, { toValue: 1, friction: 2, useNativeDriver: true }) ]).start();
      timeout = setTimeout(() => { setAnimalPlaced(false); setPlacedBlocks([]); setIsVictory(false); setGameState(initGame()); }, 3000);
    }
    return () => { if (timeout) clearTimeout(timeout); };
  }, [leftWeight, rightWeight]);

  const handleDropAnimal = () => setAnimalPlaced(true);
  const handleDropBlock = (block: any) => { setGameState(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== block.id) })); setPlacedBlocks(prev => [...prev, block]); };
  const handleRemoveBlock = (block: any) => { setPlacedBlocks(prev => prev.filter(b => b.id !== block.id)); setGameState(prev => ({ ...prev, blocks: [...prev.blocks, block] })); };

  const rotateInterpolate = tiltAnim.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] });

  if (!gameState.animal.lottieAnim) return ( <View style={[styles.gameContainer, { backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' }]}><TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#0284C7" /></TouchableOpacity><Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0369A1', textAlign: 'center', padding: 20 }}>Thiếu file Lottie thú nhún!</Text></View> );

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#E0F2FE' }]}>
      {isVictory && <ConfettiCannon count={200} origin={{x: -10, y: 0}} fallSpeed={1000} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#0284C7" /></TouchableOpacity>
      {isVictory && <Text style={styles.winTextHoanHo}>HOAN HÔ! CÂN BẰNG RỒI! 🎉</Text>}
      <View style={styles.seesawArea}>
        <View style={styles.fulcrumBase} />
        <View style={styles.fulcrum} />
        <Animated.View style={[styles.seesawBoard, { transform: [{ rotate: rotateInterpolate }, { scale: winScaleAnim }] }]}>
          <View style={styles.panContainerLeft}>
            <View style={styles.pan}>
              {animalPlaced && (
                <View style={styles.animalOnPan}><LottieView source={gameState.animal.lottieAnim} autoPlay loop style={styles.lottieAnimal} /><View style={styles.animalBadge}><Text style={styles.animalBadgeText}>{gameState.animal.val}</Text></View></View>
              )}
            </View>
            <View style={styles.panRopeLeft} /><View style={styles.panRopeRight} />
          </View>
          <View style={styles.panContainerRight}>
            <View style={styles.pan}>
              <View style={styles.blocksOnPan}>
                {placedBlocks.map(b => (
                  <TouchableOpacity key={b.id} activeOpacity={0.7} onPress={() => handleRemoveBlock(b)}>
                    <View style={[styles.block3D, { backgroundColor: b.color.bg, borderColor: b.color.border, transform: [{ rotate: b.rot }], margin: 2 }]}><Text style={styles.block3DText}>{b.val}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.panRopeLeft} /><View style={styles.panRopeRight} />
          </View>
        </Animated.View>
      </View>
      <View style={styles.controlPanel}>
        <Text style={styles.instructionText}>(Bé đưa thú lên cân, lỡ ném sai khối thì chạm vào khối trên cân để lấy lại nha!)</Text>
        <View style={styles.inventoryArea}>
          <View style={styles.animalInventory}>
            {!animalPlaced && <DraggableItem item={gameState.animal} onDrop={handleDropAnimal} isAnimal={true} />}
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.blockInventory}>
              {gameState.blocks.map(b => <DraggableItem key={b.id} item={b} onDrop={handleDropBlock} isAnimal={false} />)}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// GAME 3: ĐẬP THÚ NHÚN (WHACK-A-MOLE)
// ==========================================
const HOLE_COUNT = 9;
const MOLE_EMOJIS = ['🐹', '🐱', '🐶', '🐰', '🐼']; 
const MAX_MISSES = 5; 

const DapThuGame = ({ onBack }: { onBack: () => void }) => {
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [activeEmoji, setActiveEmoji] = useState('🐹');
  const [hitEffect, setHitEffect] = useState<{ id: number, x: number, y: number } | null>(null);
  const [hammerPos, setHammerPos] = useState<{x: number, y: number} | null>(null);
  const hammerAnim = useRef(new Animated.Value(0)).current;

  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const gameOverRef = useRef(false);
  const activeHoleRef = useRef<number | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = useCallback(() => {
    setScore(0); setMisses(0); setGameOver(false);
    scoreRef.current = 0; missesRef.current = 0; gameOverRef.current = false;
    activeHoleRef.current = null;
    runGameLoop();
  }, []);

  const runGameLoop = () => {
    if (gameOverRef.current) return;
    const currentScore = scoreRef.current;
    const stayTime = Math.max(350, 1000 - currentScore * 40); 
    const waitTime = Math.max(150, 500 - currentScore * 15); 
    const randomHole = Math.floor(Math.random() * HOLE_COUNT);
    setActiveHole(randomHole);
    activeHoleRef.current = randomHole;
    setActiveEmoji(MOLE_EMOJIS[Math.floor(Math.random() * MOLE_EMOJIS.length)]);

    gameLoopRef.current = setTimeout(() => {
        if (activeHoleRef.current !== null) {
            setActiveHole(null); activeHoleRef.current = null;
            missesRef.current += 1; setMisses(missesRef.current);
            if (missesRef.current >= MAX_MISSES) {
                gameOverRef.current = true; setGameOver(true); return; 
            }
        }
        gameLoopRef.current = setTimeout(runGameLoop, waitTime);
    }, stayTime);
  };

  useEffect(() => {
    startGame(); 
    return () => { if (gameLoopRef.current) clearTimeout(gameLoopRef.current); };
  }, [startGame]);

  const playBonkSound = async () => {
    try { const { sound } = await Audio.Sound.createAsync({ uri: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg' }); await sound.playAsync(); sound.setOnPlaybackStatusUpdate((s:any) => { if (s.isLoaded && s.didJustFinish) sound.unloadAsync(); }); } catch (error) {}
  };

  const handleWhack = (index: number, event: any) => {
    if (gameOverRef.current) return;
    const { pageX, pageY } = event.nativeEvent;
    setHammerPos({ x: pageX, y: pageY });
    hammerAnim.setValue(0);
    Animated.sequence([ Animated.timing(hammerAnim, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(hammerAnim, { toValue: 0, duration: 150, delay: 50, useNativeDriver: true }) ]).start(() => setHammerPos(null));

    if (index === activeHoleRef.current) {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
      setActiveHole(null); activeHoleRef.current = null;
      scoreRef.current += 1; setScore(scoreRef.current);
      setHitEffect({ id: Date.now(), x: pageX, y: pageY }); 
      const waitTime = Math.max(150, 500 - scoreRef.current * 15);
      gameLoopRef.current = setTimeout(runGameLoop, waitTime);
    }
  };

  const hammerRotate = hammerAnim.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '-45deg'] });

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#D1FAE5' }]}>
      {hitEffect && <ConfettiCannon key={hitEffect.id} count={30} origin={{ x: hitEffect.x, y: hitEffect.y }} fallSpeed={2000} explosionSpeed={300} fadeOut />}
      {hammerPos && <Animated.Text style={{ position: 'absolute', left: hammerPos.x - 30, top: hammerPos.y - 100, fontSize: 90, zIndex: 9999, transform: [{ rotate: hammerRotate }], textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 5 }}>🔨</Animated.Text>}
      <View style={styles.whackHeader}>
        <TouchableOpacity style={styles.whackBackBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#047857" /></TouchableOpacity>
        <View style={styles.scoreBoardTop}>
          <View style={styles.scoreBoard}><Text style={styles.scoreText}>Điểm: {score}</Text></View>
          <View style={styles.healthBar}>
            {Array.from({ length: MAX_MISSES - misses }).map((_, i) => <Text key={`heart-${i}`} style={styles.heartIcon}>❤️</Text>)}
            {Array.from({ length: misses }).map((_, i) => <Text key={`lost-${i}`} style={styles.heartIcon}>🖤</Text>)}
          </View>
        </View>
      </View>
      <View style={styles.whackGrid}>
        {Array.from({ length: HOLE_COUNT }).map((_, index) => (
          <TouchableOpacity key={index} activeOpacity={1} style={styles.holeContainer} onPress={(e) => handleWhack(index, e)}>
            <View style={styles.holeDirt} />
            {activeHole === index && <Animated.View style={styles.moleWrapper}><Text style={styles.moleEmoji}>{activeEmoji}</Text></Animated.View>}
            <View style={styles.holeFront} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.whackInstruction}>Đập thú đang ngoi lên kìa!</Text>
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverBox}>
            <Text style={styles.gameOverTitle}>BẠN ĐÃ THUA!</Text><Text style={styles.gameOverScore}>Điểm: {score}</Text>
            <TouchableOpacity style={styles.replayBtn} onPress={startGame}><Ionicons name="refresh-circle" size={40} color="white" /><Text style={styles.replayBtnText}>Chơi Lại</Text></TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ==========================================
// GAME 4: THỬ THÁCH VUI NHỘN
// ==========================================
const ThuThachGame = ({ onBack }: { onBack: () => void }) => {
  const [allThuThach, setAllThuThach] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [currentImg, setCurrentImg] = useState<any>(null);
  const [lastImgId, setLastImgId] = useState<string | null>(null);
  
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      let custom: any[] = [];
      try {
        const stored = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.thu_thach) custom = parsed.thu_thach.map((item:any, index:number) => ({ id: 'custom_'+index, image: {uri: item.uri} }));
        }
      } catch (e) {}
      const base = THU_THACH_IMAGES.map((img, index) => ({ id: 'base_'+index, image: img }));
      setAllThuThach([...base, ...custom]);
    };
    load();
  }, []));

  const startSpin = () => {
    if (isSpinning || allThuThach.length === 0) return;
    setIsSpinning(true); setShowCard(true);
    let speed = 50;  
    let spins = 0;
    const maxSpins = 25; 

    const spin = () => {
      spins++;
      setCurrentImg(allThuThach[Math.floor(Math.random() * allThuThach.length)]);
      if (spins < maxSpins) {
        speed += 15; 
        timeoutRef.current = setTimeout(spin, speed);
      } else {
        let finalIdx = Math.floor(Math.random() * allThuThach.length);
        while (allThuThach.length > 1 && allThuThach[finalIdx].id === lastImgId) finalIdx = Math.floor(Math.random() * allThuThach.length);
        const finalImage = allThuThach[finalIdx];
        setCurrentImg(finalImage); setLastImgId(finalImage.id); setIsSpinning(false);
        Animated.sequence([ Animated.timing(bounceAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }), Animated.spring(bounceAnim, { toValue: 1, friction: 3, useNativeDriver: true }) ]).start();
      }
    };
    spin(); 
  };

  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' }]}>
      {!isSpinning && showCard && <ConfettiCannon count={100} origin={{x: width / 2, y: 0}} fallSpeed={2000} />}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#EA580C" /></TouchableOpacity>
      <Text style={styles.thuThachTitle}>🎲 Thử Thách Vui Nhộn 🎲</Text>
      <View style={styles.cardStage}>
        {showCard && currentImg ? (
          <Animated.View style={[styles.challengeCard, { transform: [{ scale: bounceAnim }] }]}>
            <Image source={currentImg.image} style={styles.challengeImg} resizeMode="contain" />
            {isSpinning && <View style={styles.spinningOverlay} />}
          </Animated.View>
        ) : (
          <View style={[styles.challengeCard, styles.cardPlaceholder]}>
             <Text style={{ fontSize: 100 }}>❓</Text><Text style={{ fontSize: 20, color: '#EA580C', fontWeight: 'bold', marginTop: 10 }}>Bé sẵn sàng chưa?</Text>
          </View>
        )}
      </View>
      <View style={styles.thuThachControls}>
        {!showCard ? (
           <TouchableOpacity style={[styles.spinBtn, { backgroundColor: '#F97316', borderColor: '#C2410C' }]} onPress={startSpin}><Text style={styles.spinBtnText}>🚀 BẮT ĐẦU</Text></TouchableOpacity>
        ) : (
           <TouchableOpacity style={[styles.spinBtn, { backgroundColor: isSpinning ? '#CBD5E1' : '#10B981', borderColor: isSpinning ? '#94A3B8' : '#047857' }]} onPress={startSpin} disabled={isSpinning}>
             <Text style={[styles.spinBtnText, { color: isSpinning ? 'gray' : 'white' }]}>{isSpinning ? 'Đang chọn thẻ...' : '🎲 ĐỔI THỬ THÁCH KHÁC'}</Text>
           </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// =========================================================
// GAME 5: BÉ TẬP VẼ - DÙNG SVG THUẦN TÚY KHÔNG GÂY LỖI NATIVE
// =========================================================
const VeTranhGame = ({ onBack }: { onBack: () => void }) => {
  const [allToMau, setAllToMau] = useState<any[]>([]);
  const [mode, setMode] = useState<'menu' | 'select_bg' | 'drawing'>('menu');
  const [selectedBg, setSelectedBg] = useState<any>(null);

  // Trạng thái vẽ
  const [paths, setPaths] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [currentColor, setCurrentColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [penType, setPenType] = useState<'thuong' | 'kim_tuyen'>('thuong');

  useFocusEffect(useCallback(() => {
    const load = async () => {
      let custom: any[] = [];
      try {
        const stored = await AsyncStorage.getItem('@kho_du_lieu_cua_be');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.to_mau) custom = parsed.to_mau.map((item:any) => ({ uri: item.uri }));
        }
      } catch (e) {}
      setAllToMau([...KHO_ANH_TO_MAU, ...custom]);
    };
    load();
  }, []));

  const undoLastPath = () => setPaths((prev) => prev.slice(0, -1));
  const clearAllPaths = () => setPaths([]);

  if (mode === 'menu') {
    return (
      <View style={[styles.gameContainer, { backgroundColor: '#FDF4FF', justifyContent: 'center', alignItems: 'center' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Ionicons name="arrow-back-circle" size={50} color="#C026D3" /></TouchableOpacity>
        <Text style={styles.drawMenuTitle}>Bé Thích Vẽ Gì Nào? 🎨</Text>
        <TouchableOpacity style={[styles.drawModeBtn, { backgroundColor: '#E879F9' }]} onPress={() => { setSelectedBg(null); setMode('drawing'); }}><Text style={styles.drawModeText}>⬜ Tự do sáng tạo</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.drawModeBtn, { backgroundColor: '#60A5FA' }]} onPress={() => setMode('select_bg')}><Text style={styles.drawModeText}>🖼️ Tô màu theo mẫu</Text></TouchableOpacity>
      </View>
    );
  }

  if (mode === 'select_bg') {
    return (
      <View style={[styles.gameContainer, { backgroundColor: '#EFF6FF' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('menu')}><Ionicons name="arrow-back-circle" size={50} color="#3B82F6" /></TouchableOpacity>
        <Text style={[styles.drawMenuTitle, { marginTop: 80, color: '#1D4ED8' }]}>Chọn hình để tô màu nha</Text>
        {allToMau.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, fontSize: 18, color: 'gray' }}>Anh hai chưa thêm ảnh Tô Màu nào trong Cài Đặt kìa!</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.bgSelectorGrid}>
            {allToMau.map((img: any, idx: number) => (
              <TouchableOpacity key={idx} style={styles.bgThumbnail} onPress={() => { setSelectedBg(img); setMode('drawing'); }}>
                <Image source={img} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.gameContainer, { backgroundColor: '#E5E7EB' }]}>
      <View style={styles.drawHeader}>
        <TouchableOpacity onPress={() => { setMode('menu'); clearAllPaths(); }}><Ionicons name="arrow-back-circle" size={45} color="#4B5563" /></TouchableOpacity>
        <Text style={{fontWeight: 'bold', color: 'gray'}}>Bé Sáng Tạo (Neon Glow ✨)</Text>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity style={styles.drawActionBtn} onPress={undoLastPath}><Ionicons name="arrow-undo" size={24} color="white" /><Text style={styles.drawActionText}>Hoàn tác</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.drawActionBtn, { backgroundColor: '#EF4444' }]} onPress={clearAllPaths}><Ionicons name="trash" size={24} color="white" /><Text style={styles.drawActionText}>Xóa hết</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.canvasArea}>
        {selectedBg && <Image source={selectedBg} style={StyleSheet.absoluteFillObject} resizeMode="contain" />}
        <View style={StyleSheet.absoluteFillObject} 
          onStartShouldSetResponder={() => true} 
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            setCurrentPath({ d: `M ${locationX} ${locationY}`, color: currentColor, strokeWidth, type: penType });
          }}
          onResponderMove={(e) => {
            if(!currentPath) return;
            const { locationX, locationY } = e.nativeEvent;
            setCurrentPath((prev: any) => ({ ...prev, d: `${prev.d} L ${locationX} ${locationY}` }));
          }}
          onResponderRelease={() => {
            if (currentPath) { setPaths((prev) => [...prev, currentPath]); setCurrentPath(null); }
          }}
        >
          {/* TÈO CODE NEON GLOW CHUẨN 100% SVG ĐÂY NHA ĐẠI CA */}
          <Svg style={{ flex: 1 }}>
            {/* Lớp mờ phát sáng (chỉ vẽ cho kim_tuyen) */}
            {paths.map((p, index) => p.type === 'kim_tuyen' && (
              <Path key={`glow_${index}`} d={p.d} stroke={p.color} strokeWidth={p.strokeWidth * 2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
            ))}
            {currentPath?.type === 'kim_tuyen' && (
              <Path d={currentPath.d} stroke={currentPath.color} strokeWidth={currentPath.strokeWidth * 2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.3} />
            )}
            
            {/* Lớp lõi sắc nét (kim_tuyen thì màu trắng và nhỏ hơn, thường thì lấy đúng màu) */}
            {paths.map((p, index) => (
              <Path 
                key={`core_${index}`} 
                d={p.d} 
                stroke={p.type === 'kim_tuyen' ? '#FFFFFF' : p.color} 
                strokeWidth={p.type === 'kim_tuyen' ? p.strokeWidth * 0.4 : p.strokeWidth} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
            ))}
            {currentPath && (
              <Path 
                d={currentPath.d} 
                stroke={currentPath.type === 'kim_tuyen' ? '#FFFFFF' : currentPath.color} 
                strokeWidth={currentPath.type === 'kim_tuyen' ? currentPath.strokeWidth * 0.4 : currentPath.strokeWidth} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
            )}
          </Svg>
        </View>
      </View>

      <View style={styles.drawToolbar}>
        <View style={styles.drawToolsRow}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.penTypeBtn, penType === 'thuong' && styles.penTypeActive]} onPress={() => setPenType('thuong')}><Text style={{ fontSize: 16 }}>✏️ Thường</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.penTypeBtn, penType === 'kim_tuyen' && styles.penTypeActive]} onPress={() => setPenType('kim_tuyen')}><Text style={{ fontSize: 16 }}>✨ Kim Tuyến</Text></TouchableOpacity>
          </View>
          <View style={styles.sliderContainer}>
            <Text style={{ fontWeight: 'bold', color: '#4B5563' }}>Nét to nhỏ:</Text>
            <Slider style={{ width: 150, height: 40 }} minimumValue={2} maximumValue={30} value={strokeWidth} onValueChange={setStrokeWidth} minimumTrackTintColor="#3B82F6" thumbTintColor="#2563EB" />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
          {BUBBLE_COLORS.map((c) => (
            <TouchableOpacity key={c} style={[styles.colorBubble, { backgroundColor: c }, currentColor === c && styles.colorBubbleActive ]} onPress={() => setCurrentColor(c)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// ==========================================
// MÀN HÌNH CHÍNH QUẢN LÝ CÁC TRÒ CHƠI
// ==========================================
export default function TroChoiHubScreen() {
  const { colors } = useTheme();
  const [maxLimit, setMaxLimit] = useState(10);
  const [currentGame, setCurrentGame] = useState<'menu' | 'cho_an' | 'bap_benh' | 'dap_thu' | 'thu_thach' | 've_tranh'>('menu');

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
  if (currentGame === 'bap_benh') return <BapBenhGame maxLimit={maxLimit} onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'dap_thu') return <DapThuGame onBack={() => setCurrentGame('menu')} />;
  if (currentGame === 'thu_thach') return <ThuThachGame onBack={() => setCurrentGame('menu')} />; 
  if (currentGame === 've_tranh') return <VeTranhGame onBack={() => setCurrentGame('menu')} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={styles.title}>Rạp Xiếc Trò Chơi 🎪</Text></View>
      <ScrollView contentContainerStyle={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]} onPress={() => setCurrentGame('cho_an')}>
          <Text style={styles.menuIcon}>🐰</Text><View><Text style={[styles.menuTitle, { color: '#B45309' }]}>Cho Động Vật Ăn</Text><Text style={{ color: '#D97706', fontSize: 16 }}>Cho thú cưng ăn nào!</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]} onPress={() => setCurrentGame('bap_benh')}>
          <Text style={styles.menuIcon}>⚖️</Text><View><Text style={[styles.menuTitle, { color: '#1D4ED8' }]}>Bập Bênh Vật Lý</Text><Text style={{ color: '#2563EB', fontSize: 16 }}>Cân động vật cho bé</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]} onPress={() => setCurrentGame('dap_thu')}>
          <Text style={styles.menuIcon}>🐹</Text><View><Text style={[styles.menuTitle, { color: '#047857' }]}>Đập Thú Nhún</Text><Text style={{ color: '#059669', fontSize: 16 }}>Đập búa giải trí siêu tốc độ!</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#EA580C', backgroundColor: '#FFF7ED' }]} onPress={() => setCurrentGame('thu_thach')}>
          <Text style={styles.menuIcon}>🃏</Text><View><Text style={[styles.menuTitle, { color: '#C2410C' }]}>Thử Thách Vui Nhộn</Text><Text style={{ color: '#EA580C', fontSize: 16 }}>Quay xèng bốc thẻ làm nhiệm vụ!</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuCard, { borderColor: '#C026D3', backgroundColor: '#FDF4FF' }]} onPress={() => setCurrentGame('ve_tranh')}>
          <Text style={styles.menuIcon}>🎨</Text><View><Text style={[styles.menuTitle, { color: '#A21CAF' }]}>Bé Tập Vẽ</Text><Text style={{ color: '#C026D3', fontSize: 16 }}>Vẽ tự do & Tô màu hình!</Text></View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: 'center', backgroundColor: '#FEF08A', borderBottomWidth: 3, borderBottomColor: '#FDE047' },
  title: { fontSize: 28, fontWeight: '900', color: '#B45309' },
  menuContainer: { padding: 20, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', flexDirection: 'row', gap: 15, paddingBottom: 50 },
  menuCard: { width: '45%', maxWidth: 350, flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 25, borderWidth: 4, elevation: 5 },
  menuIcon: { fontSize: 50, marginRight: 15 },
  menuTitle: { fontSize: 22, fontWeight: '900' },
  gameContainer: { flex: 1, overflow: 'hidden' },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 99, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 30 },
  animalScreen: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000', borderBottomWidth: 5, borderBottomColor: '#B45309', elevation: 10 },
  animalMedia: { width: '100%', height: '100%' },
  problemBoard: { alignSelf: 'center', marginTop: 40, backgroundColor: 'white', paddingHorizontal: 50, paddingVertical: 20, borderRadius: 30, borderWidth: 5, borderColor: '#3B82F6', elevation: 8 },
  problemText: { fontSize: 50, fontWeight: '900', color: '#1E3A8A' },
  answerArea: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 30, paddingHorizontal: 10 },
  foodItem: { alignItems: 'center', padding: 10 },
  foodEmoji: { fontSize: 80 },
  foodText: { fontSize: 40, fontWeight: '900', color: '#B45309', marginTop: -20, backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 20, borderWidth: 4, borderColor: '#F59E0B', elevation: 5 },
  winTextHoanHo: { position: 'absolute', top: 80, alignSelf: 'center', fontSize: 35, fontWeight: '900', color: '#EF4444', textShadowColor: 'white', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5, zIndex: 50 },
  seesawArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  fulcrum: { position: 'absolute', bottom: '25%', borderBottomWidth: 60, borderBottomColor: '#B45309', borderLeftWidth: 30, borderLeftColor: 'transparent', borderRightWidth: 30, borderRightColor: 'transparent', zIndex: 2 },
  fulcrumBase: { position: 'absolute', bottom: '15%', width: 100, height: 20, backgroundColor: '#78350F', borderRadius: 10, zIndex: 1 },
  seesawBoard: { width: '80%', height: 20, backgroundColor: '#F59E0B', borderRadius: 10, borderWidth: 2, borderColor: '#92400E', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 3, elevation: 5 },
  panContainerLeft: { position: 'absolute', left: -20, top: 10, alignItems: 'center' },
  panContainerRight: { position: 'absolute', right: -20, top: 10, alignItems: 'center' },
  pan: { width: 120, height: 25, backgroundColor: '#D97706', borderRadius: 15, borderWidth: 2, borderColor: '#78350F', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 5, zIndex: 4, marginTop: 80 },
  panRopeLeft: { position: 'absolute', width: 2, height: 80, backgroundColor: '#4B5563', left: 10, top: 0, transform: [{ rotate: '20deg' }] },
  panRopeRight: { position: 'absolute', width: 2, height: 80, backgroundColor: '#4B5563', right: 10, top: 0, transform: [{ rotate: '-20deg' }] },
  blocksOnPan: { position: 'absolute', bottom: 20, flexDirection: 'row', flexWrap: 'wrap-reverse', justifyContent: 'center', alignItems: 'center', width: 140, zIndex: 10 },
  animalOnPan: { position: 'absolute', bottom: 20, alignItems: 'center', zIndex: 10 },
  controlPanel: { height: '35%', backgroundColor: '#BAE6FD', borderTopWidth: 5, borderTopColor: '#0284C7', padding: 10 },
  instructionText: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#0369A1', marginBottom: 10 },
  inventoryArea: { flex: 1, flexDirection: 'row' },
  animalInventory: { width: '30%', justifyContent: 'center', alignItems: 'center', borderRightWidth: 3, borderRightColor: '#7DD3FC' },
  blockInventory: { width: 320, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', paddingTop: 10, gap: 12 },
  dragAnimalBox: { alignItems: 'center', paddingBottom: 20 },
  lottieAnimal: { width: 150, height: 150 }, 
  animalBadge: { position: 'absolute', bottom: 15, backgroundColor: '#EF4444', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  animalBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  block3D: { width: 50, height: 50, borderRadius: 8, borderBottomWidth: 5, borderRightWidth: 3, borderTopWidth: 1, borderLeftWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  block3DText: { fontSize: 24, fontWeight: '900', color: 'white', textShadowColor: 'black', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  whackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 20 },
  whackBackBtn: { position: 'absolute', left: 20, top: 0, zIndex: 10 },
  scoreBoardTop: { alignItems: 'center' },
  scoreBoard: { backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25, borderWidth: 4, borderColor: '#047857', elevation: 5 },
  scoreText: { fontSize: 30, fontWeight: '900', color: 'white' },
  healthBar: { flexDirection: 'row', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  heartIcon: { fontSize: 24, marginHorizontal: 2 },
  whackGrid: { width: '100%', maxWidth: 500, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 },
  holeContainer: { width: '30%', height: 120, margin: '1.5%', justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden' },
  holeDirt: { position: 'absolute', bottom: 15, width: '80%', height: 40, backgroundColor: '#78350F', borderRadius: 40, zIndex: 1 },
  holeFront: { position: 'absolute', bottom: 5, width: '90%', height: 30, backgroundColor: '#92400E', borderRadius: 40, zIndex: 3 },
  moleWrapper: { zIndex: 2, paddingBottom: 20 },
  moleEmoji: { fontSize: 80 },
  whackInstruction: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#047857', marginTop: 30, paddingHorizontal: 20 },
  gameOverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  gameOverBox: { backgroundColor: '#FEF3C7', padding: 40, borderRadius: 30, borderWidth: 8, borderColor: '#EF4444', alignItems: 'center', width: '80%', maxWidth: 400 },
  gameOverTitle: { fontSize: 45, fontWeight: '900', color: '#DC2626', marginBottom: 10, textShadowColor: '#FCA5A5', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 1 },
  gameOverScore: { fontSize: 30, fontWeight: 'bold', color: '#B45309', marginBottom: 10 },
  replayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 20, borderWidth: 4, borderColor: '#047857', elevation: 5 },
  replayBtnText: { fontSize: 24, fontWeight: '900', color: 'white', marginLeft: 10 },
  thuThachTitle: { fontSize: 35, fontWeight: '900', color: '#C2410C', marginTop: 20, marginBottom: 20, textShadowColor: '#FDBA74', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 1 },
  cardStage: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  challengeCard: { width: 300, height: 400, backgroundColor: 'white', borderRadius: 20, borderWidth: 6, borderColor: '#EA580C', justifyContent: 'center', alignItems: 'center', elevation: 10, overflow: 'hidden' },
  challengeImg: { width: '90%', height: '90%' },
  cardPlaceholder: { backgroundColor: '#FFEDD5', borderStyle: 'dashed' },
  spinningOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  thuThachControls: { padding: 30, width: '100%', alignItems: 'center' },
  spinBtn: { paddingVertical: 20, paddingHorizontal: 40, borderRadius: 30, borderWidth: 5, elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
  spinBtnText: { fontSize: 26, fontWeight: '900', color: 'white' },
  drawMenuTitle: { fontSize: 32, fontWeight: '900', color: '#A21CAF', marginBottom: 40, textAlign: 'center' },
  drawModeBtn: { paddingVertical: 20, paddingHorizontal: 40, borderRadius: 20, marginBottom: 20, width: 280, alignItems: 'center', elevation: 5 },
  drawModeText: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  bgSelectorGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, justifyContent: 'center', gap: 15 },
  bgThumbnail: { width: 140, height: 140, backgroundColor: 'white', borderRadius: 15, borderWidth: 3, borderColor: '#93C5FD', overflow: 'hidden' },
  drawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 10, backgroundColor: 'white', borderBottomWidth: 2, borderColor: '#E5E7EB', zIndex: 10 },
  drawActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  drawActionText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  canvasArea: { flex: 1, backgroundColor: 'white' },
  drawToolbar: { backgroundColor: 'white', paddingBottom: 25, paddingTop: 15, borderTopWidth: 2, borderColor: '#E5E7EB', elevation: 15 },
  drawToolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  penTypeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  penTypeActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  colorPalette: { paddingHorizontal: 15, gap: 12, alignItems: 'center' },
  colorBubble: { width: 45, height: 45, borderRadius: 25, borderWidth: 3, borderColor: 'white', elevation: 3 },
  colorBubbleActive: { transform: [{ scale: 1.2 }], borderColor: '#4B5563' },
});