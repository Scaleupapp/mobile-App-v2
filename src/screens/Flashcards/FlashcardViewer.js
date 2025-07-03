// =====================================================
// COMPLETE ENHANCED FLASHCARD VIEWER - With Cram Mode Support
// File: screens/Flashcards/FlashcardViewer.js
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  Alert,
  Animated,
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  getFlashcardDeckDetailsApi,
  startFlashcardStudySessionApi,
  submitFlashcardAnswerApi,
  updateFlashcardApi,
  deleteFlashcardApi,
  exportFlashcardDeckApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const FlashcardViewer = ({navigation, route}) => {
  const {
    deckId, 
    cardIndex = 0, 
    studyMode = false,
    // NEW: Cram Mode Parameters
    cramMode = false,
    cramSession = null,
    priorityCards = null,
    fromSummary = false
  } = route.params;
  
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Existing state management
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(cardIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  
  // Session Planning State
  const [showSessionPlanner, setShowSessionPlanner] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState('mixed');
  const [selectedCardCount, setSelectedCardCount] = useState(20);
  
  // Study mode state
  const [studyStartTime, setStudyStartTime] = useState(null);
  const [answeredCards, setAnsweredCards] = useState(new Set());
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    timeSpent: 0,
    correctAnswers: [],
  });
  
  // Real-time feedback state
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // NEW: Cram Mode State
  const [cramProgress, setCramProgress] = useState(0);
  const [cramTimeRemaining, setCramTimeRemaining] = useState(null);
  const [cramTipIndex, setCramTipIndex] = useState(0);
  const [cramStats, setCramStats] = useState({
    known: 0,
    review: 0,
    skipped: 0,
    timeSpent: 0,
  });
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // NEW: Cram Mode Animation
  const cramPulseAnim = useRef(new Animated.Value(1)).current;

  // NEW: Determine which cards to use (cram priority cards or regular cards)
  const cardsToStudy = cramMode && priorityCards ? priorityCards : cards;

  // NEW: Initialize cram mode timer and settings
  useEffect(() => {
    if (cramMode && cramSession?.timeUntilExam) {
      const timeString = cramSession.timeUntilExam;
      let totalMinutes = 0;
      
      if (timeString.includes('h') && timeString.includes('m')) {
        const hours = parseInt(timeString.split('h')[0]) || 0;
        const minutes = parseInt(timeString.split('h')[1].split('m')[0]) || 0;
        totalMinutes = hours * 60 + minutes;
      } else if (timeString.includes('h')) {
        const hours = parseInt(timeString.split('h')[0]) || 0;
        totalMinutes = hours * 60;
      } else if (timeString.includes('m')) {
        const minutes = parseInt(timeString.split('m')[0]) || 0;
        totalMinutes = minutes;
      } else {
        // Default based on common patterns
        const timeMap = {
          '1hour': 60,
          '3hours': 180,
          '24hours': 1440,
        };
        totalMinutes = timeMap[timeString] || 180;
      }
      
      setCramTimeRemaining(totalMinutes);
    }
  }, [cramMode, cramSession]);

  // NEW: Update cram progress
  useEffect(() => {
    if (cramMode && cardsToStudy.length > 0) {
      const progress = ((currentIndex + 1) / cardsToStudy.length) * 100;
      setCramProgress(Math.round(progress));
      
      // Animate pulse for progress updates
      Animated.sequence([
        Animated.timing(cramPulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cramPulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIndex, cardsToStudy.length, cramMode]);

  // NEW: Rotate cram tips
  useEffect(() => {
    if (cramMode && cramSession?.cramContent) {
      const tips = cramSession.cramContent.examStrategies || 
                  cramSession.cramContent.mustKnowFacts || 
                  ['Focus on understanding key concepts', 'Manage your time effectively'];
      
      const interval = setInterval(() => {
        setCramTipIndex(prev => (prev + 1) % tips.length);
      }, 8000); // Change tip every 8 seconds
      
      return () => clearInterval(interval);
    }
  }, [cramMode, cramSession]);

  // Enhanced session initialization with cram mode support
  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
      
      const deckResponse = await getFlashcardDeckDetailsApi(deckId, {
        page: 1,
        limit: 1,
      });

      if (deckResponse?.data?.success) {
        setDeck(deckResponse.data.deck);
        
        // NEW: Handle cram mode initialization
        if (cramMode && priorityCards) {
          setCards(priorityCards);
          setSessionStarted(true);
          setStudyStartTime(Date.now());
          setLoading(false);
          showToast({ 
            type: 'success', 
            title: `Cram session started! ${priorityCards.length} priority cards loaded` 
          });
        } else if (studyMode && !sessionStarted) {
          setLoading(false);
          setShowSessionPlanner(true);
        } else {
          await loadAllCards();
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      showToast({ type: 'error', title: 'Failed to load deck' });
      navigation.goBack();
    }
  }, [deckId, studyMode, sessionStarted, cramMode, priorityCards]);

  // Load all cards (for browse mode)
  const loadAllCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFlashcardDeckDetailsApi(deckId, { page: 1, limit: 100 });
      if (response?.data?.success) {
        setCards(response.data.cards || []);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      showToast({ type: 'error', title: 'Failed to load cards' });
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Load cards for study session
  const startStudySession = useCallback(async () => {
    try {
      setLoading(true);
      setShowSessionPlanner(false);
      setSessionStarted(true);
      
      let response;
      try {
        response = await startFlashcardStudySessionApi(deckId, {
          sessionType: selectedSessionType,
          cardCount: selectedCardCount,
        });
      } catch (apiError) {
        console.log('Enhanced API not available, falling back to basic cards fetch');
        response = await getFlashcardDeckDetailsApi(deckId, { page: 1, limit: selectedCardCount });
      }
      
      if (response?.data?.success) {
        const sessionCards = response.data.session?.cards || response.data.cards || [];
        setCards(sessionCards);
        
        if (sessionCards.length > 0) {
          showToast({ type: 'success', title: `Study session started! ${sessionCards.length} cards loaded` });
          setStudyStartTime(Date.now());
        } else {
          showToast({ type: 'info', title: 'No cards available for this session' });
        }
      }
    } catch (error) {
      console.error('Error starting study session:', error);
      showToast({ type: 'error', title: 'Failed to start study session' });
    } finally {
      setLoading(false);
    }
  }, [deckId, selectedSessionType, selectedCardCount]);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Get current card (use cardsToStudy for cram mode)
  const currentCard = cardsToStudy[currentIndex];

  // Enhanced navigation with smooth animations and cram mode support
  const goToNext = () => {
    if (currentIndex < cardsToStudy.length - 1) {
      resetCardState();
      // Slide out left
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 125,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        slideAnim.setValue(screenWidth);
        // Slide in from right
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 125,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (cramMode) {
      // NEW: Handle cram session completion
      handleCramSessionComplete();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      resetCardState();
      // Slide out right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 125,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex - 1);
        slideAnim.setValue(-screenWidth);
        // Slide in from left
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 125,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const resetCardState = () => {
    setIsFlipped(false);
    setShowHints(false);
    flipAnim.setValue(0);
    hintAnim.setValue(0);
    setLastAnswerFeedback(null);
    if ((studyMode || cramMode) && sessionStarted) {
      setStudyStartTime(Date.now());
    }
  };

  // Enhanced flip animation
  const animateFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const animateHints = () => {
    Animated.spring(hintAnim, {
      toValue: showHints ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    setShowHints(!showHints);
  };

  // Enhanced study answer with real-time feedback
  const handleStudyAnswer = async (wasCorrect) => {
    if ((!studyMode && !cramMode) || !sessionStarted || !currentCard) return;
    const responseTime = studyStartTime ? (Date.now() - studyStartTime) / 1000 : 0;
    
    try {
      try {
        const response = await submitFlashcardAnswerApi(currentCard._id, { 
          wasCorrect, 
          responseTime, 
          difficulty: currentCard.difficulty 
        });
        if (response?.data?.success) {
          const result = response.data.result;
          setLastAnswerFeedback({ 
            wasCorrect, 
            nextReviewDate: result.nextReviewDate, 
            masteryLevel: getMasteryLevel(result.newInterval), 
            responseTime: Math.round(responseTime) 
          });
        }
      } catch (apiError) {
        setLastAnswerFeedback({ 
          wasCorrect, 
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), 
          masteryLevel: wasCorrect ? 'Learning' : 'New', 
          responseTime: Math.round(responseTime) 
        });
      }
      
      setAnsweredCards(prev => new Set([...prev, currentCard._id]));
      
      // Update session stats (existing logic)
      setSessionStats(prev => ({ 
        ...prev, 
        [wasCorrect ? 'correct' : 'incorrect']: prev[wasCorrect ? 'correct' : 'incorrect'] + 1, 
        timeSpent: prev.timeSpent + responseTime, 
        correctAnswers: wasCorrect ? [...prev.correctAnswers, currentIndex] : prev.correctAnswers 
      }));
      
      setShowFeedbackModal(true);
      
      Animated.sequence([
        Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.delay(2500),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setShowFeedbackModal(false);
        setTimeout(() => {
          if (currentIndex < cardsToStudy.length - 1) {
            goToNext();
          } else {
            cramMode ? handleCramSessionComplete() : showStudyComplete();
          }
        }, 200);
      });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to record answer' });
    }
  };

  // NEW: Handle cram mode specific actions
  const handleCramAction = useCallback((action) => {
    if (!cramMode || !currentCard) return;
    
    const responseTime = studyStartTime ? (Date.now() - studyStartTime) / 1000 : 0;
    
    // Update cram stats
    setCramStats(prev => ({
      ...prev,
      [action]: prev[action] + 1,
      timeSpent: prev.timeSpent + responseTime,
    }));
    
    // Add visual feedback
    Animated.sequence([
      Animated.spring(cramPulseAnim, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(cramPulseAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    // Move to next card or complete session
    setTimeout(() => {
      if (currentIndex < cardsToStudy.length - 1) {
        goToNext();
      } else {
        handleCramSessionComplete();
      }
    }, 500);
  }, [cramMode, currentCard, studyStartTime, currentIndex, cardsToStudy.length]);

  // NEW: Handle cram session completion
  const handleCramSessionComplete = useCallback(() => {
    const totalCards = cramStats.known + cramStats.review + cramStats.skipped;
    const efficiency = totalCards > 0 ? Math.round((cramStats.known / totalCards) * 100) : 0;
    const timeSpent = Math.round(cramStats.timeSpent / 60);
    
    Alert.alert(
      '🎉 Cram Session Complete!',
      `🎯 Efficiency: ${efficiency}%\n✅ Known: ${cramStats.known}\n📝 Review Later: ${cramStats.review}\n⏭️ Skipped: ${cramStats.skipped}\n⏱️ Time: ${timeSpent} minutes\n\nYou're ready for your exam! 🚀`,
      [
        {
          text: '🔄 Cram Again',
          onPress: () => {
            setCurrentIndex(0);
            setCramStats({ known: 0, review: 0, skipped: 0, timeSpent: 0 });
            resetCardState();
          },
          style: 'default'
        },
        {
          text: '✅ Finish',
          onPress: () => navigation.goBack(),
          style: 'default'
        }
      ]
    );
  }, [cramStats, navigation]);

  // Card management functions (existing)
  const handleAddNewCard = () => {
    setShowOptions(false);
    navigation.navigate(Routes.AddEditCard, { deckId: deck._id, deckTitle: deck.title });
  };

  const handleEditCard = () => {
    setShowOptions(false);
    navigation.navigate(Routes.AddEditCard, { deckId: deck._id, cardId: currentCard._id, cardData: currentCard, isEdit: true });
  };

  const handleDeleteCard = () => {
    if (!currentCard) return;
    
    setShowOptions(false);
    Alert.alert('Delete Card', 'Are you sure you want to delete this flashcard? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteFlashcardApi(currentCard._id);
            const newCards = cardsToStudy.filter((_, index) => index !== currentIndex);
            
            if (cramMode && priorityCards) {
              // Update priority cards array
              const updatedPriorityCards = priorityCards.filter((_, index) => index !== currentIndex);
              // Note: You might want to navigate back with updated priority cards
            } else {
              setCards(newCards);
            }
            
            if (newCards.length === 0) {
              showToast({ type: 'info', title: 'No more cards to study' });
              navigation.goBack();
              return;
            }
            if (currentIndex >= newCards.length) {
              setCurrentIndex(newCards.length - 1);
            }
            resetCardState();
            showToast({ type: 'success', title: 'Card deleted successfully' });
          } catch (error) {
            showToast({ type: 'error', title: 'Failed to delete card' });
          }
        },
      },
    ]);
  };

  const handleShareCard = () => {
    setShowOptions(false);
    const shareContent = `❓ ${currentCard.question}\n\n✅ ${currentCard.answer}${currentCard.explanation ? `\n\n💡 ${currentCard.explanation}` : ''}\n\n📚 From: ${deck?.title}${cramMode ? ' (Cram Mode)' : ''}`;
    Share.share({ message: shareContent, title: `Flashcard from ${deck?.title}` });
  };

  const handleExportDeck = async () => {
    setShowOptions(false);
    try {
      setLoading(true);
      const response = await exportFlashcardDeckApi(deckId);
      if (response?.data?.success) {
        showToast({ type: 'success', title: 'Deck exported successfully!' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to export deck' });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getMasteryLevel = (interval) => {
    if (!interval || interval <= 1) return 'New';
    if (interval <= 6) return 'Learning';
    if (interval <= 30) return 'Reviewing';
    return 'Mastered';
  };

  const formatNextReview = (nextReviewDate) => {
    if (!nextReviewDate) return 'Tomorrow';
    const now = new Date();
    const reviewDate = new Date(nextReviewDate);
    const diffDays = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return `${Math.round(diffDays / 7)} weeks`;
  };

  const showStudyComplete = () => {
    const accuracy = sessionStats.correct + sessionStats.incorrect > 0 ? 
      Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100) : 0;
    Alert.alert(
      '🎉 Study Session Complete!', 
      `🎯 Accuracy: ${accuracy}%\n📊 Cards studied: ${sessionStats.correct + sessionStats.incorrect}\n⏱️ Time: ${Math.round(sessionStats.timeSpent / 60)} minutes`,
      [
        { text: '🔄 Study Again', onPress: () => { 
          setSessionStarted(false); 
          setShowSessionPlanner(true); 
          resetCardState(); 
          setSessionStats({correct:0, incorrect:0, timeSpent:0, correctAnswers:[]});
        }},
        { text: '✅ Done', onPress: () => navigation.goBack() },
      ]
    );
  };

  // NEW: Render cram mode header
  const renderCramModeHeader = () => {
    if (!cramMode) return null;
    
    return (
      <Animated.View style={[styles.cramModeHeader, { transform: [{ scale: cramPulseAnim }] }]}>
        <View style={styles.cramModeIndicator}>
          <Icon name="flash-on" size={18} color={COLORS.redEA4335} />
          <Text variant="medium12" color={COLORS.redEA4335} style={styles.cramModeText}>
            CRAM MODE
          </Text>
          {cramSession?.timeUntilExam && (
            <View style={styles.cramTimeChip}>
              <Icon name="schedule" size={14} color={COLORS.whiteFFFFFF} />
              <Text variant="medium10" color={COLORS.whiteFFFFFF} style={styles.cramTimeText}>
                {cramSession.timeUntilExam}
              </Text>
            </View>
          )}
          {cramSession?.strategy && (
            <View style={styles.cramStrategyChip}>
              <Text variant="medium10" color={COLORS.blue043142}>
                {cramSession.strategy}
              </Text>
            </View>
          )}
        </View>
        
        {/* Cram Progress Bar */}
        <View style={styles.cramProgressContainer}>
          <View style={styles.cramProgressBar}>
            <View 
              style={[
                styles.cramProgressFill,
                {width: `${cramProgress}%`}
              ]} 
            />
          </View>
          <Text variant="medium11" color={COLORS.grey777777} style={styles.cramProgressText}>
            {currentIndex + 1} of {cardsToStudy.length} priority cards • {cramProgress}% complete
          </Text>
        </View>
        
        {/* Cram Stats */}
        <View style={styles.cramStatsRow}>
          <View style={styles.cramStat}>
            <Text variant="bold12" color={COLORS.green34A853}>{cramStats.known}</Text>
            <Text variant="medium10" color={COLORS.grey777777}>Known</Text>
          </View>
          <View style={styles.cramStat}>
            <Text variant="bold12" color={COLORS.yellowF5BE00}>{cramStats.review}</Text>
            <Text variant="medium10" color={COLORS.grey777777}>Review</Text>
          </View>
          <View style={styles.cramStat}>
            <Text variant="bold12" color={COLORS.grey777777}>{cramStats.skipped}</Text>
            <Text variant="medium10" color={COLORS.grey777777}>Skipped</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // NEW: Render cram mode tips
  const renderCramModeTips = () => {
    if (!cramMode || !cramSession?.cramContent) return null;

    const tips = cramSession.cramContent.examStrategies || 
                cramSession.cramContent.mustKnowFacts || 
                ['Focus on understanding key concepts', 'Manage your time effectively'];

    const currentTip = tips[cramTipIndex % tips.length];

    return (
      <View style={styles.cramTipsContainer}>
        <View style={styles.cramTipsHeader}>
          <Icon name="lightbulb" size={16} color={COLORS.yellowF5BE00} />
          <Text variant="medium12" color={COLORS.blue043142} style={styles.cramTipsTitle}>
            Cram Tip:
          </Text>
        </View>
        <Text variant="medium11" color={COLORS.grey555555} style={styles.cramTip}>
          {currentTip}
        </Text>
      </View>
    );
  };

  // NEW: Render cram mode action buttons
  const renderCramModeActions = () => {
    if (!cramMode || !isFlipped) return null;

    return (
      <View style={styles.cramActionsContainer}>
        <Text variant="medium16" color={COLORS.blue043142} style={styles.cramPrompt}>
          How well do you know this?
        </Text>
        <View style={styles.cramButtonsContainer}>
          <Pressable 
            style={[styles.cramActionButton, styles.cramSkipButton]}
            onPress={() => handleCramAction('skipped')}>
            <Icon name="skip-next" size={20} color={COLORS.grey777777} />
            <Text variant="medium12" color={COLORS.grey777777}>
              Skip
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.cramActionButton, styles.cramReviewButton]}
            onPress={() => handleCramAction('review')}>
            <Icon name="refresh" size={20} color={COLORS.yellowF5BE00} />
            <Text variant="medium12" color={COLORS.yellowF5BE00}>
              Review Later
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.cramActionButton, styles.cramKnowButton]}
            onPress={() => handleCramAction('known')}>
            <Icon name="check-circle" size={20} color={COLORS.green34A853} />
            <Text variant="medium12" color={COLORS.green34A853}>
              I Know This
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Enhanced session planner with beautiful UI (existing)
  const renderSessionPlanner = () => (
    <Modal visible={showSessionPlanner} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sessionPlannerModal}>
          <View style={styles.plannerHeader}>
            <Icon name="school" size={32} color={COLORS.blue043142} />
            <Text variant="bold20" color={COLORS.blue043142} style={styles.plannerTitle}>
              Plan Your Study Session
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              {deck?.title}
            </Text>
          </View>

          <View style={styles.sessionOptions}>
            <Text variant="semibold16" color={COLORS.blue043142} style={styles.optionLabel}>
              Session Type
            </Text>
            <View style={styles.typeGrid}>
              {[
                { key: 'new', label: 'New Cards', icon: 'fiber-new', color: COLORS.green34A853 },
                { key: 'review', label: 'Review', icon: 'refresh', color: COLORS.yellowF5BE00 },
                { key: 'mixed', label: 'Mixed', icon: 'shuffle', color: COLORS.blue043142 },
              ].map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.typeOption,
                    selectedSessionType === type.key && { ...styles.typeOptionSelected, borderColor: type.color }
                  ]}
                  onPress={() => setSelectedSessionType(type.key)}>
                  <Icon name={type.icon} size={24} color={selectedSessionType === type.key ? type.color : COLORS.grey777777} />
                  <Text variant="medium12" color={selectedSessionType === type.key ? type.color : COLORS.grey777777}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text variant="semibold16" color={COLORS.blue043142} style={[styles.optionLabel, {marginTop: 24}]}>
              Number of Cards
            </Text>
            <View style={styles.countGrid}>
              {[10, 20, 30, 50].map((count) => (
                <Pressable
                  key={count}
                  style={[
                    styles.countOption,
                    selectedCardCount === count && styles.countOptionSelected
                  ]}
                  onPress={() => setSelectedCardCount(count)}>
                  <Text variant="bold16" color={selectedCardCount === count ? COLORS.whiteFFFFFF : COLORS.blue043142}>
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.estimateContainer}>
              <Icon name="schedule" size={18} color={COLORS.blue043142} />
              <Text variant="medium14" color={COLORS.blue043142}>
                Estimated time: {Math.round(selectedCardCount / 2)} minutes
              </Text>
            </View>
          </View>

          <View style={styles.plannerActions}>
            <Pressable style={styles.cancelPlannerButton} onPress={() => { setShowSessionPlanner(false); navigation.goBack(); }}>
              <Text variant="semibold14" color={COLORS.grey777777}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.startPlannerButton} onPress={startStudySession}>
              <Icon name="play-arrow" size={20} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={styles.startButtonText}>Start Session</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Enhanced feedback modal (existing)
  const renderFeedbackModal = () => (
    <Modal visible={showFeedbackModal} transparent={true} animationType="none">
      <View style={styles.feedbackOverlay}>
        <Animated.View style={[
          styles.feedbackModal,
          {
            opacity: feedbackAnim,
            transform: [
              { scale: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
              { translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
            ]
          }
        ]}>
          {lastAnswerFeedback && (
            <>
              <View style={[styles.feedbackHeader, { backgroundColor: lastAnswerFeedback.wasCorrect ? COLORS.green34A853 : COLORS.redEA4335 }]}>
                <Icon name={lastAnswerFeedback.wasCorrect ? 'check-circle' : 'cancel'} size={28} color={COLORS.whiteFFFFFF} />
                <Text variant="bold18" color={COLORS.whiteFFFFFF}>
                  {lastAnswerFeedback.wasCorrect ? '🎉 Correct!' : '💪 Keep Learning!'}
                </Text>
              </View>
              <View style={styles.feedbackContent}>
                <View style={styles.feedbackRow}>
                  <Icon name="schedule" size={18} color={COLORS.blue043142} />
                  <Text variant="medium14" color={COLORS.grey777777}>
                    Response: {lastAnswerFeedback.responseTime}s
                  </Text>
                </View>
                <View style={styles.feedbackRow}>
                  <Icon name="update" size={18} color={COLORS.blue043142} />
                  <Text variant="medium14" color={COLORS.grey777777}>
                    Next review: {formatNextReview(lastAnswerFeedback.nextReviewDate)}
                  </Text>
                </View>
                <View style={styles.feedbackRow}>
                  <Icon name="trending-up" size={18} color={COLORS.blue043142} />
                  <Text variant="medium14" color={COLORS.grey777777}>
                    Level: {lastAnswerFeedback.masteryLevel}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  // Enhanced options modal (existing)
  const renderCardOptionsModal = () => (
    <Modal visible={showOptions} transparent={true} animationType="slide" onRequestClose={() => setShowOptions(false)}>
      <Pressable style={styles.optionsOverlay} onPress={() => setShowOptions(false)}>
        <View style={styles.optionsModal}>
          <View style={styles.optionsHeader}>
            <View style={styles.optionsHandle} />
            <Text variant="bold18" color={COLORS.blue043142} style={styles.optionsTitle}>
              Card Options
            </Text>
          </View>
            
          <View style={styles.optionsGrid}>
            {!cramMode && (
              <Pressable style={[styles.optionCard, styles.addCardOption]} onPress={handleAddNewCard}>
                <View style={styles.optionIconContainer}>
                  <Icon name="add" size={24} color={COLORS.green34A853} />
                </View>
                <Text variant="semibold14" color={COLORS.green34A853}>Add New Card</Text>
                <Text variant="medium11" color={COLORS.grey777777}>Create another card</Text>
              </Pressable>
            )}

            {!cramMode && (
              <Pressable style={[styles.optionCard, styles.editCardOption]} onPress={handleEditCard}>
                <View style={styles.optionIconContainer}>
                  <Icon name="edit" size={24} color={COLORS.blue043142} />
                </View>
                <Text variant="semibold14" color={COLORS.blue043142}>Edit Card</Text>
                <Text variant="medium11" color={COLORS.grey777777}>Modify this card</Text>
              </Pressable>
            )}

            {!cramMode && (
              <Pressable style={[styles.optionCard, styles.deleteCardOption]} onPress={handleDeleteCard}>
                <View style={styles.optionIconContainer}>
                  <Icon name="delete" size={24} color={COLORS.redEA4335} />
                </View>
                <Text variant="semibold14" color={COLORS.redEA4335}>Delete Card</Text>
                <Text variant="medium11" color={COLORS.grey777777}>Remove permanently</Text>
              </Pressable>
            )}

            <Pressable style={[styles.optionCard, styles.shareCardOption]} onPress={handleShareCard}>
              <View style={styles.optionIconContainer}>
                <Icon name="share" size={24} color={COLORS.blue043142} />
              </View>
              <Text variant="semibold14" color={COLORS.blue043142}>Share Card</Text>
              <Text variant="medium11" color={COLORS.grey777777}>Send to others</Text>
            </Pressable>

            {!cramMode && (
              <Pressable style={[styles.optionCard, styles.exportDeckOption]} onPress={handleExportDeck}>
                <View style={styles.optionIconContainer}>
                  <Icon name="cloud-download" size={24} color={COLORS.blue043142} />
                </View>
                <Text variant="semibold14" color={COLORS.blue043142}>Export Deck</Text>
                <Text variant="medium11" color={COLORS.grey777777}>Download all cards</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.cancelOptionsButton} onPress={() => setShowOptions(false)}>
            <Text variant="semibold16" color={COLORS.grey777777}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  // Enhanced card rendering with beautiful design (existing)
  const renderCardFace = (isBack) => {
    const frontRotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    const backRotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <Animated.View style={[
        styles.cardFace,
        {
          transform: [{ rotateY: isBack ? backRotateY : frontRotateY }],
        },
        isBack && { position: 'absolute', backfaceVisibility: 'hidden' }
      ]}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.cardBadge,
            { backgroundColor: isBack ? COLORS.green34A853 + '15' : COLORS.blue043142 + '15' }
          ]}>
            <Icon 
              name={isBack ? "check-circle-outline" : "help-outline"} 
              size={20} 
              color={isBack ? COLORS.green34A853 : COLORS.blue043142} 
            />
            <Text variant="semibold12" color={isBack ? COLORS.green34A853 : COLORS.blue043142}>
              {isBack ? 'Answer' : 'Question'}
            </Text>
          </View>
          
          {/* NEW: Show appropriate mode badge */}
          {cramMode ? (
            <View style={styles.cramBadge}>
              <Icon name="flash-on" size={14} color={COLORS.whiteFFFFFF} />
              <Text variant="medium10" color={COLORS.whiteFFFFFF}>CRAM</Text>
            </View>
          ) : studyMode && sessionStarted && (
            <View style={styles.studyBadge}>
              <Icon name="school" size={14} color={COLORS.whiteFFFFFF} />
              <Text variant="medium10" color={COLORS.whiteFFFFFF}>STUDY</Text>
            </View>
          )}
        </View>

        <ScrollView 
          style={styles.cardContent} 
          contentContainerStyle={styles.cardContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="medium20" style={styles.cardText}>
            {isBack ? currentCard?.answer : currentCard?.question}
          </Text>

          {currentCard?.difficulty && !isBack && (
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(currentCard.difficulty) + '20' }
            ]}>
              <Icon name="signal-cellular-alt" size={16} color={getDifficultyColor(currentCard.difficulty)} />
              <Text variant="medium12" color={getDifficultyColor(currentCard.difficulty)}>
                {currentCard.difficulty.charAt(0).toUpperCase() + currentCard.difficulty.slice(1)}
              </Text>
            </View>
          )}

          {isBack && currentCard?.explanation && (
            <View style={styles.explanationContainer}>
              <View style={styles.explanationHeader}>
                <Icon name="lightbulb" size={18} color={COLORS.yellowF5BE00} />
                <Text variant="semibold14" color={COLORS.blue043142}>Explanation</Text>
              </View>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.explanationText}>
                {currentCard.explanation}
              </Text>
            </View>
          )}

          {!isBack && currentCard?.hints?.length > 0 && (
            <View style={styles.hintsContainer}>
              <Pressable style={styles.hintsToggle} onPress={animateHints}>
                <Icon name="tips-and-updates" size={18} color={COLORS.yellowF5BE00} />
                <Text variant="medium12" color={COLORS.yellowF5BE00}>
                  {showHints ? 'Hide' : 'Show'} Hints ({currentCard.hints.length})
                </Text>
                <Icon name={showHints ? 'expand-less' : 'expand-more'} size={18} color={COLORS.yellowF5BE00} />
              </Pressable>
              
              <Animated.View style={[
                styles.hintsContent,
                {
                  maxHeight: hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
                  opacity: hintAnim,
                }
              ]}>
                {currentCard.hints.map((hint, index) => (
                  <View key={index} style={styles.hintItem}>
                    <Icon name="lightbulb" size={14} color={COLORS.yellowF5BE00} />
                    <Text variant="medium12" color={COLORS.grey777777} style={styles.hintText}>
                      {hint}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          )}
        </ScrollView>

        <View style={styles.cardFooter}>
          <Icon name="touch-app" size={16} color={COLORS.grey999999} />
          <Text variant="medium12" color={COLORS.grey777777} style={styles.flipHint}>
            Tap to flip
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Helper function for difficulty colors (existing)
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return COLORS.green34A853;
      case 'medium': return COLORS.yellowF5BE00;
      case 'hard': return COLORS.redEA4335;
      default: return COLORS.grey777777;
    }
  };

  // Enhanced navigation with progress (existing + cram mode support)
  const renderNavigation = () => (
    <View style={styles.navigationContainer}>
      <Pressable 
        onPress={goToPrevious} 
        disabled={currentIndex === 0} 
        style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
      >
        <Icon name="chevron-left" size={32} color={currentIndex === 0 ? COLORS.greyBBBBBB : COLORS.blue043142} />
      </Pressable>
      
      <View style={styles.progressContainer}>
        <Text variant="bold16" color={COLORS.blue043142}>
          {currentIndex + 1} / {cardsToStudy.length}
        </Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { 
              width: `${((currentIndex + 1) / cardsToStudy.length) * 100}%`,
              backgroundColor: cramMode ? COLORS.redEA4335 : COLORS.blue043142
            }
          ]} />
        </View>
        {(studyMode || cramMode) && sessionStarted && (
          <Text variant="medium11" color={COLORS.grey777777}>
            {cramMode ? 
              `✅ ${cramStats.known}  📝 ${cramStats.review}  ⏭️ ${cramStats.skipped}` :
              `✅ ${sessionStats.correct}  ❌ ${sessionStats.incorrect}`
            }
          </Text>
        )}
      </View>
      
      <Pressable 
        onPress={goToNext} 
        disabled={currentIndex === cardsToStudy.length - 1} 
        style={[styles.navButton, currentIndex === cardsToStudy.length - 1 && styles.navButtonDisabled]}
      >
        <Icon name="chevron-right" size={32} color={currentIndex === cardsToStudy.length - 1 ? COLORS.greyBBBBBB : COLORS.blue043142} />
      </Pressable>
    </View>
  );

  // Enhanced action footer with cram mode support
  const renderActionFooter = () => {
    // NEW: Cram mode actions
    if (cramMode && isFlipped && !answeredCards.has(currentCard._id)) {
      return renderCramModeActions();
    }

    // Existing study mode actions
    if (studyMode && sessionStarted && isFlipped && !answeredCards.has(currentCard._id)) {
      return (
        <View style={styles.studyActionsContainer}>
          <Text variant="medium16" color={COLORS.blue043142} style={styles.studyPrompt}>
            Did you get it right?
          </Text>
          <View style={styles.studyButtons}>
            <Pressable style={[styles.studyButton, styles.incorrectButton]} onPress={() => handleStudyAnswer(false)}>
              <Icon name="close" size={22} color={COLORS.whiteFFFFFF} />
              <Text variant="bold14" color={COLORS.whiteFFFFFF}>Incorrect</Text>
            </Pressable>
            <Pressable style={[styles.studyButton, styles.correctButton]} onPress={() => handleStudyAnswer(true)}>
              <Icon name="check" size={22} color={COLORS.whiteFFFFFF} />
              <Text variant="bold14" color={COLORS.whiteFFFFFF}>Correct</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Default action footer
    return (
      <View style={styles.actionFooter}>
        <Pressable style={styles.actionButton} onPress={animateFlip}>
          <View style={styles.actionButtonContent}>
            <Icon name="flip-camera-android" size={24} color={COLORS.blue043142} />
            <Text variant="semibold12" color={COLORS.blue043142}>Flip Card</Text>
          </View>
        </Pressable>
        
        {!studyMode && !cramMode && (
          <Pressable style={styles.actionButton} onPress={() => setShowOptions(true)}>
            <View style={styles.actionButtonContent}>
              <Icon name="more-horiz" size={24} color={COLORS.blue043142} />
              <Text variant="semibold12" color={COLORS.blue043142}>Options</Text>
            </View>
          </Pressable>
        )}
      </View>
    );
  };

  // Loading state (existing)
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="style" size={48} color={COLORS.blue043142} />
          <Text variant="medium16" color={COLORS.blue043142} style={styles.loadingText}>
            {cramMode ? 'Loading cram session...' : 'Loading flashcards...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Session planner for study mode (existing)
  if (studyMode && !sessionStarted && !cramMode) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
        {renderSessionPlanner()}
      </SafeAreaView>
    );
  }

  // No cards state (existing + cram mode support)
  if (!cardsToStudy.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
        <Header 
          title={cramMode ? "Cram Session" : (deck?.title || "Flashcard Deck")} 
          onBackPress={() => navigation.goBack()} 
          showBackButton 
        />
        <View style={styles.emptyContainer}>
          <Icon name="style" size={72} color={COLORS.greyBBBBBB} />
          <Text variant="bold20" color={COLORS.grey777777} style={styles.emptyTitle}>
            {cramMode ? 'No Priority Cards' : 'No Cards Yet'}
          </Text>
          <Text variant="medium14" color={COLORS.grey999999} style={styles.emptyDescription}>
            {cramMode ? 
              'No priority cards were selected for this cram session. Try adjusting your cram mode settings.' :
              'This deck doesn\'t have any flashcards yet. Add your first card to get started!'
            }
          </Text>
          {!cramMode && (
            <Button 
              text="Add First Card" 
              onPress={handleAddNewCard} 
              style={styles.addFirstCardButton}
              icon="add"
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main flashcard viewer
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
      <Header
        title={cramMode ? "Cram Session" : (studyMode ? "Study Session" : deck?.title || 'Flashcards')}
        subtitle={cramMode && cramSession?.strategy ? cramSession.strategy : deck?.title}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightIcon={cramMode ? "info-outline" : (studyMode ? "analytics" : undefined)}
        onRightIconPress={cramMode ? () => {
          Alert.alert(
            'Cram Mode Info',
            `Strategy: ${cramSession?.strategy || 'Smart Study'}\nCards: ${cardsToStudy.length} priority cards\nTime: ${cramSession?.timeUntilExam || 'Flexible'}\n\nFocus: ${cramSession?.focusArea || 'Auto-detected weak areas'}`
          );
        } : (studyMode ? () => navigation.navigate(Routes.FlashcardAnalytics, { deckId }) : undefined)}
      />
      
      {/* NEW: Cram Mode Header */}
      {renderCramModeHeader()}
      
      <View style={styles.cardContainer}>
        <Animated.View style={[
          styles.cardWrapper,
          {
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}>
          <Pressable style={styles.cardTouchArea} onPress={animateFlip}>
            {renderCardFace(false)}
            {renderCardFace(true)}
          </Pressable>
        </Animated.View>
      </View>
      
      {/* NEW: Cram Mode Tips */}
      {renderCramModeTips()}
      
      {renderNavigation()}
      {renderActionFooter()}
      
      {renderSessionPlanner()}
      {renderFeedbackModal()}
      {renderCardOptionsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF8F8F8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  addFirstCardButton: {
    marginTop: 8,
  },

  // NEW: Cram Mode Styles
  cramModeHeader: {
    backgroundColor: COLORS.redEA4335 + '10',
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  cramModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(8),
    flexWrap: 'wrap',
  },
  cramModeText: {
    marginLeft: nw(6),
    marginRight: nw(12),
    fontWeight: 'bold',
  },
  cramTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redEA4335,
    borderRadius: nw(12),
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    gap: nw(4),
    marginRight: nw(8),
  },
  cramTimeText: {
    fontWeight: 'bold',
  },
  cramStrategyChip: {
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(12),
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
  },
  cramProgressContainer: {
    alignItems: 'center',
    marginBottom: nh(8),
  },
  cramProgressBar: {
    width: '100%',
    height: nh(4),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nh(2),
    marginBottom: nh(4),
  },
  cramProgressFill: {
    height: '100%',
    backgroundColor: COLORS.redEA4335,
    borderRadius: nh(2),
  },
  cramProgressText: {
    textAlign: 'center',
  },
  cramStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cramStat: {
    alignItems: 'center',
  },
  cramTipsContainer: {
    backgroundColor: COLORS.yellowF5BE00 + '20',
    borderRadius: nw(12),
    padding: nw(16),
    marginHorizontal: nw(20),
    marginVertical: nh(8),
  },
  cramTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(4),
    gap: nw(6),
  },
  cramTipsTitle: {
    fontWeight: 'bold',
  },
  cramTip: {
    lineHeight: nh(16),
  },
  cramActionsContainer: {
    padding: nw(20),
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE + '50',
  },
  cramPrompt: {
    textAlign: 'center',
    marginBottom: nh(16),
  },
  cramButtonsContainer: {
    flexDirection: 'row',
    gap: nw(8),
  },
  cramActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(8),
    borderRadius: nw(8),
    borderWidth: 1,
  },
  cramSkipButton: {
    backgroundColor: COLORS.greyF8F8F8,
    borderColor: COLORS.greyDDDDDD,
  },
  cramKnowButton: {
    backgroundColor: COLORS.green34A853 + '15',
    borderColor: COLORS.green34A853,
  },
  cramReviewButton: {
    backgroundColor: COLORS.yellowF5BE00 + '15',
    borderColor: COLORS.yellowF5BE00,
  },
  cramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redEA4335,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  // Existing styles
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.whiteFFFFFF,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTouchArea: {
    flex: 1,
  },
  cardFace: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.whiteFFFFFF,
    backfaceVisibility: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE + '50',
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  studyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green34A853,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  cardText: {
    textAlign: 'center',
    color: COLORS.blue043142,
    lineHeight: 28,
    marginBottom: 20,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 12,
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  explanationText: {
    lineHeight: 20,
  },
  hintsContainer: {
    marginTop: 20,
  },
  hintsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.yellowF5BE00 + '15',
    borderRadius: 12,
    gap: 8,
  },
  hintsContent: {
    overflow: 'hidden',
    marginTop: 12,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  hintText: {
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  flipHint: {
    fontSize: 12,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE + '50',
  },
  navButton: {
    padding: 8,
    borderRadius: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  progressContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  progressBar: {
    width: 120,
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
    borderRadius: 3,
  },
  actionFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE + '50',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  actionButtonContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: 12,
    gap: 4,
  },
  studyActionsContainer: {
    padding: 20,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE + '50',
  },
  studyPrompt: {
    textAlign: 'center',
    marginBottom: 16,
  },
  studyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  studyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  correctButton: {
    backgroundColor: COLORS.green34A853,
  },
  incorrectButton: {
    backgroundColor: COLORS.redEA4335,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionPlannerModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 24,
    padding: 24,
    width: screenWidth - 40,
    maxWidth: 400,
  },
  plannerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  plannerTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  sessionOptions: {
    marginBottom: 24,
  },
  optionLabel: {
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.greyEEEEEE,
    borderRadius: 12,
    gap: 8,
  },
  typeOptionSelected: {
    borderWidth: 2,
    backgroundColor: COLORS.blue043142 + '05',
  },
  countGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  countOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.blue043142,
    borderRadius: 8,
  },
  countOptionSelected: {
    backgroundColor: COLORS.blue043142,
  },
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: 8,
    gap: 8,
  },
  plannerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelPlannerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.greyF8F8F8,
  },
  startPlannerButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.blue043142,
    gap: 8,
  },
  startButtonText: {
    marginLeft: 4,
  },

  // Feedback modal styles
  feedbackOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  feedbackModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 20,
    width: screenWidth - 60,
    maxWidth: 320,
    overflow: 'hidden',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  feedbackContent: {
    padding: 20,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  // Options modal styles
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  optionsHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE + '50',
  },
  optionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.greyBBBBBB,
    borderRadius: 2,
    marginBottom: 12,
  },
  optionsTitle: {
    marginBottom: 4,
  },
  optionsGrid: {
    padding: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.greyF8F8F8,
    gap: 16,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.whiteFFFFFF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardOption: {
    backgroundColor: COLORS.green34A853 + '10',
  },
  editCardOption: {
    backgroundColor: COLORS.blue043142 + '10',
  },
  deleteCardOption: {
    backgroundColor: COLORS.redEA4335 + '10',
  },
  shareCardOption: {
    backgroundColor: COLORS.blue043142 + '10',
  },
  exportDeckOption: {
    backgroundColor: COLORS.blue043142 + '10',
  },
  cancelOptionsButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: 12,
  },
});

export default FlashcardViewer;