// =====================================================
// MODERN CRAM FLASHCARD VIEWER - Completely Redesigned
// File: screens/Flashcards/CramFlashcardViewer.js
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
  Dimensions,
  PanResponder,
  Vibration,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Routes from '../../helper/routes';
import {submitFlashcardAnswerApi} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const CramFlashcardViewer = ({navigation, route}) => {
  const {
    deckId,
    cramSession,
    priorityCards = [],
  } = route.params;
  
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Core state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Cram-specific state
  const [cramStats, setCramStats] = useState({
    known: 0,
    review: 0,
    skipped: 0,
    timeSpent: 0,
    startTime: Date.now(),
  });
  
  const [studyStartTime, setStudyStartTime] = useState(Date.now());
  
  // Animation refs
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const buttonBounce = useRef(new Animated.Value(1)).current;
  
  // Initialize progress animation
  useEffect(() => {
    const progress = (currentIndex + 1) / priorityCards.length;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, priorityCards.length]);

  // Gesture handling for card swiping
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 80;
      },
      onPanResponderGrant: () => {
        Animated.spring(cardScale, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(gestureState.dx * 0.7);
      },
      onPanResponderRelease: (evt, gestureState) => {
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        if (gestureState.dx > 80) {
          // Swipe right - previous card
          if (currentIndex > 0) {
            goToPrevious();
          } else {
            snapBack();
          }
        } else if (gestureState.dx < -80) {
          // Swipe left - next card or known
          if (isFlipped) {
            handleCramAction('known');
          } else {
            flipCard();
          }
        } else {
          snapBack();
        }
      },
    })
  ).current;

  const snapBack = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Current card
  const currentCard = priorityCards[currentIndex];
  const progress = Math.round(((currentIndex + 1) / priorityCards.length) * 100);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < priorityCards.length - 1) {
      setIsFlipped(false);
      flipAnim.setValue(0);
      
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.8,
          duration: 125,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        setStudyStartTime(Date.now());
        slideAnim.setValue(screenWidth);
        
        // Slide in animation
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      handleCramComplete();
    }
  }, [currentIndex, priorityCards.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      flipAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.8,
          duration: 125,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex - 1);
        setStudyStartTime(Date.now());
        slideAnim.setValue(-screenWidth);
        
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentIndex]);

  // Flip animation
  const flipCard = useCallback(() => {
    Vibration.vibrate(50); // Haptic feedback
    
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  // Cram actions with visual feedback
  const handleCramAction = useCallback((action) => {
    const responseTime = (Date.now() - studyStartTime) / 1000;
    
    // Haptic feedback
    Vibration.vibrate(action === 'known' ? 100 : 50);
    
    // Button animation
    Animated.sequence([
      Animated.timing(buttonBounce, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonBounce, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Update stats
    setCramStats(prev => ({
      ...prev,
      [action]: prev[action] + 1,
      timeSpent: prev.timeSpent + responseTime,
    }));
    
    // Show brief feedback
    const messages = {
      known: '✅ Great!',
      review: '📝 Added to review',
      skipped: '⏭️ Skipped'
    };
    
    showToast({ 
      type: 'success', 
      title: messages[action],
      duration: 1000 
    });
    
    // Auto-advance after delay
    setTimeout(() => {
      goToNext();
    }, 600);
  }, [studyStartTime, goToNext, showToast]);

  // Complete cram session
  const handleCramComplete = useCallback(() => {
    setShowCompletionModal(true);
  }, []);

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return COLORS.green34A853;
      case 'medium': return COLORS.yellowF5BE00;
      case 'hard': return COLORS.redEA4335;
      default: return COLORS.grey777777;
    }
  };

  // Render modern progress bar
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <Animated.View style={[
          styles.progressBarFill,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }
        ]} />
      </View>
      <View style={styles.progressInfo}>
        <Text variant="medium12" color={COLORS.whiteFFFFFF}>
          {currentIndex + 1} of {priorityCards.length}
        </Text>
        <Text variant="bold14" color={COLORS.whiteFFFFFF}>
          {progress}% Complete
        </Text>
      </View>
    </View>
  );

  // Render modern card
  const renderCard = () => {
    const frontRotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
    const backRotateY = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <View style={styles.cardContainer}>
        <Animated.View 
          style={[
            styles.cardWrapper,
            {
              transform: [
                { translateX: slideAnim },
                { scale: cardScale }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          {/* Front of card */}
          <Animated.View style={[
            styles.cardFace,
            styles.cardFront,
            {transform: [{rotateY: frontRotateY}]},
            isFlipped && {opacity: 0}
          ]}>
            <Pressable style={styles.cardContent} onPress={flipCard}>
              <View style={styles.cardHeader}>
                <View style={styles.questionBadge}>
                  <Icon name="help-outline" size={16} color={COLORS.blue043142} />
                  <Text variant="medium11" color={COLORS.blue043142}>Question</Text>
                </View>
                {currentCard?.difficulty && (
                  <View style={[
                    styles.difficultyChip,
                    {backgroundColor: getDifficultyColor(currentCard.difficulty) + '20'}
                  ]}>
                    <Text variant="medium9" color={getDifficultyColor(currentCard.difficulty)}>
                      {currentCard.difficulty.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              <ScrollView 
                style={styles.textContainer}
                contentContainerStyle={styles.textContent}
                showsVerticalScrollIndicator={false}
              >
                <Text variant="medium20" style={styles.cardText}>
                  {currentCard?.question}
                </Text>
              </ScrollView>
              
              <View style={styles.cardFooter}>
                <View style={styles.flipHint}>
                  <Icon name="touch-app" size={16} color={COLORS.grey777777} />
                  <Text variant="medium11" color={COLORS.grey777777}>Tap to reveal answer</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Back of card */}
          <Animated.View style={[
            styles.cardFace,
            styles.cardBack,
            {transform: [{rotateY: backRotateY}]},
            !isFlipped && {opacity: 0}
          ]}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.answerBadge}>
                  <Icon name="check-circle-outline" size={16} color={COLORS.green34A853} />
                  <Text variant="medium11" color={COLORS.green34A853}>Answer</Text>
                </View>
              </View>
              
              <ScrollView 
                style={styles.textContainer}
                contentContainerStyle={styles.textContent}
                showsVerticalScrollIndicator={false}
              >
                <Text variant="medium20" style={[styles.cardText, {color: COLORS.green34A853}]}>
                  {currentCard?.answer}
                </Text>
                
                {currentCard?.explanation && (
                  <View style={styles.explanationContainer}>
                    <View style={styles.explanationHeader}>
                      <Icon name="lightbulb" size={14} color={COLORS.yellowF5BE00} />
                      <Text variant="medium11" color={COLORS.blue043142}>Explanation</Text>
                    </View>
                    <Text variant="medium13" color={COLORS.grey666666} style={styles.explanationText}>
                      {currentCard.explanation}
                    </Text>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.cardFooter}>
                <Text variant="medium11" color={COLORS.grey777777}>How well do you know this?</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  // Render modern action buttons
  const renderActionButtons = () => {
    if (!isFlipped) return null;

    return (
      <Animated.View style={[
        styles.actionButtonsContainer,
        {transform: [{scale: buttonBounce}]}
      ]}>
        <Pressable 
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => handleCramAction('skipped')}
        >
          <Icon name="skip-next" size={22} color={COLORS.grey777777} />
          <Text variant="medium12" color={COLORS.grey777777} style={styles.buttonText}>
            Skip
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.reviewButton]}
          onPress={() => handleCramAction('review')}
        >
          <Icon name="refresh" size={22} color={COLORS.yellowF5BE00} />
          <Text variant="medium12" color={COLORS.yellowF5BE00} style={styles.buttonText}>
            Review Later
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.knownButton]}
          onPress={() => handleCramAction('known')}
        >
          <Icon name="check-circle" size={22} color={COLORS.green34A853} />
          <Text variant="medium12" color={COLORS.green34A853} style={styles.buttonText}>
            I Know This!
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  // Render navigation controls
  const renderNavigationControls = () => (
    <View style={styles.navigationContainer}>
      <Pressable 
        style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
        onPress={goToPrevious}
        disabled={currentIndex === 0}
      >
        <Icon 
          name="chevron-left" 
          size={28} 
          color={currentIndex === 0 ? COLORS.greyBBBBBB : COLORS.blue043142} 
        />
      </Pressable>
      
      <Pressable style={styles.flipButton} onPress={flipCard}>
        <Icon name="flip-camera-android" size={24} color={COLORS.blue043142} />
        <Text variant="medium12" color={COLORS.blue043142}>Flip</Text>
      </Pressable>
      
      <Pressable 
        style={[styles.navButton, currentIndex === priorityCards.length - 1 && styles.navButtonDisabled]}
        onPress={goToNext}
        disabled={currentIndex === priorityCards.length - 1}
      >
        <Icon 
          name="chevron-right" 
          size={28} 
          color={currentIndex === priorityCards.length - 1 ? COLORS.greyBBBBBB : COLORS.blue043142} 
        />
      </Pressable>
    </View>
  );

  // Render completion modal
  const renderCompletionModal = () => {
    const totalCards = cramStats.known + cramStats.review + cramStats.skipped;
    const efficiency = totalCards > 0 ? Math.round((cramStats.known / totalCards) * 100) : 0;
    const totalTime = Math.round((Date.now() - cramStats.startTime) / 60000);

    return (
      <Modal visible={showCompletionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <View style={styles.completionHeader}>
              <View style={styles.completionIcon}>
                <Icon name="celebration" size={48} color={COLORS.yellowF5BE00} />
              </View>
              <Text variant="bold24" color={COLORS.blue043142} style={styles.completionTitle}>
                Cram Session Complete!
              </Text>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.completionSubtitle}>
                Great job! You've finished all your priority cards.
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text variant="bold28" color={COLORS.green34A853}>{cramStats.known}</Text>
                <Text variant="medium12" color={COLORS.grey777777}>Known</Text>
              </View>
              <View style={styles.statCard}>
                <Text variant="bold28" color={COLORS.yellowF5BE00}>{cramStats.review}</Text>
                <Text variant="medium12" color={COLORS.grey777777}>Review</Text>
              </View>
              <View style={styles.statCard}>
                <Text variant="bold28" color={COLORS.grey777777}>{cramStats.skipped}</Text>
                <Text variant="medium12" color={COLORS.grey777777}>Skipped</Text>
              </View>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Icon name="timer" size={16} color={COLORS.blue043142} />
                <Text variant="medium14" color={COLORS.grey777777}>
                  Study Time: {totalTime} minutes
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Icon name="trending-up" size={16} color={COLORS.blue043142} />
                <Text variant="medium14" color={COLORS.grey777777}>
                  Efficiency: {efficiency}%
                </Text>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={styles.secondaryModalButton}
                onPress={() => {
                  setCurrentIndex(0);
                  setCramStats({known: 0, review: 0, skipped: 0, timeSpent: 0, startTime: Date.now()});
                  setIsFlipped(false);
                  flipAnim.setValue(0);
                  setShowCompletionModal(false);
                }}
              >
                <Icon name="refresh" size={20} color={COLORS.blue043142} />
                <Text variant="medium14" color={COLORS.blue043142}>Study Again</Text>
              </Pressable>
              
              <Pressable 
                style={styles.primaryModalButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="check" size={20} color={COLORS.whiteFFFFFF} />
                <Text variant="medium14" color={COLORS.whiteFFFFFF}>Finish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Empty state
  if (!priorityCards.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.redEA4335} />
        <View style={styles.emptyContainer}>
          <Icon name="sentiment-dissatisfied" size={64} color={COLORS.grey777777} />
          <Text variant="bold20" color={COLORS.grey777777} style={styles.emptyTitle}>
            No Cards Available
          </Text>
          <Text variant="medium14" color={COLORS.grey999999} style={styles.emptyText}>
            This cram session doesn't have any cards to study.
          </Text>
          <Pressable style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <Text variant="medium14" color={COLORS.blue043142}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.redEA4335} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
        </Pressable>
        
        <View style={styles.headerContent}>
          <Text variant="bold16" color={COLORS.whiteFFFFFF}>Cram Session</Text>
          <Text variant="medium12" color={COLORS.whiteFFFFFF + 'CC'}>
            {cramSession?.strategy || 'Smart Study'}
          </Text>
        </View>
        
        <View style={styles.sessionStats}>
          <View style={styles.statBadge}>
            <Text variant="medium10" color={COLORS.whiteFFFFFF}>✅ {cramStats.known}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text variant="medium10" color={COLORS.whiteFFFFFF}>📝 {cramStats.review}</Text>
          </View>
        </View>
      </View>

      {renderProgressBar()}
      {renderCard()}
      {renderNavigationControls()}
      {renderActionButtons()}
      {renderCompletionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.redEA4335,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(16),
    backgroundColor: COLORS.redEA4335,
  },
  backButton: {
    padding: nw(8),
    borderRadius: nw(20),
    backgroundColor: COLORS.whiteFFFFFF + '20',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: nw(4),
  },
  statBadge: {
    backgroundColor: COLORS.whiteFFFFFF + '20',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(12),
  },

  // Progress bar
  progressContainer: {
    backgroundColor: COLORS.redEA4335,
    paddingHorizontal: nw(20),
    paddingBottom: nh(20),
  },
  progressBarBackground: {
    height: nh(8),
    backgroundColor: COLORS.whiteFFFFFF + '30',
    borderRadius: nh(4),
    overflow: 'hidden',
    marginBottom: nh(8),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(4),
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Card container
  cardContainer: {
    flex: 1,
    backgroundColor: COLORS.greyF8F8F8,
    paddingHorizontal: nw(20),
    paddingTop: nh(20),
  },
  cardWrapper: {
    flex: 1,
    borderRadius: nw(24),
    backgroundColor: COLORS.whiteFFFFFF,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardFace: {
    flex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: nw(24),
    backgroundColor: COLORS.whiteFFFFFF,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    position: 'relative',
  },
  cardBack: {
    position: 'absolute',
  },
  cardContent: {
    flex: 1,
    borderRadius: nw(24),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: nw(24),
    paddingVertical: nh(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE + '50',
  },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '15',
    paddingHorizontal: nw(10),
    paddingVertical: nh(5),
    borderRadius: nw(12),
    gap: nw(4),
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green34A853 + '15',
    paddingHorizontal: nw(10),
    paddingVertical: nh(5),
    borderRadius: nw(12),
    gap: nw(4),
  },
  difficultyChip: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(8),
  },
  textContainer: {
    flex: 1,
  },
  textContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: nw(24),
    paddingVertical: nh(20),
  },
  cardText: {
    textAlign: 'center',
    color: COLORS.blue043142,
    lineHeight: nh(28),
  },
  explanationContainer: {
    marginTop: nh(24),
    padding: nw(16),
    backgroundColor: COLORS.yellowF5BE00 + '10',
    borderRadius: nw(12),
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
    gap: nw(6),
  },
  explanationText: {
    lineHeight: nh(20),
  },
  cardFooter: {
    paddingVertical: nh(16),
    alignItems: 'center',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
  },

  // Navigation controls
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(20),
    paddingVertical: nh(16),
    backgroundColor: COLORS.greyF8F8F8,
  },
  navButton: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    backgroundColor: COLORS.whiteFFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonDisabled: {
    backgroundColor: COLORS.greyF8F8F8,
    shadowOpacity: 0,
    elevation: 0,
  },
  flipButton: {
    alignItems: 'center',
    paddingVertical: nh(8),
    paddingHorizontal: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    gap: nh(4),
  },

  // Action buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE + '50',
    gap: nw(12),
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: nh(16),
    borderRadius: nw(16),
    borderWidth: 2,
    gap: nh(6),
  },
  skipButton: {
    backgroundColor: COLORS.greyF8F8F8,
    borderColor: COLORS.greyDDDDDD,
  },
  reviewButton: {
    backgroundColor: COLORS.yellowF5BE00 + '15',
    borderColor: COLORS.yellowF5BE00,
  },
  knownButton: {
    backgroundColor: COLORS.green34A853 + '15',
    borderColor: COLORS.green34A853,
  },
  buttonText: {
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(40),
  },
  emptyTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: nh(20),
    marginBottom: nh(24),
  },
  goBackButton: {
    paddingVertical: nh(12),
    paddingHorizontal: nw(24),
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(8),
  },

  // Completion modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(24),
    padding: nw(24),
    width: nw(320),
    alignItems: 'center',
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: nh(24),
  },
  completionIcon: {
    marginBottom: nh(12),
  },
  completionTitle: {
    marginBottom: nh(8),
    textAlign: 'center',
  },
  completionSubtitle: {
    textAlign: 'center',
    lineHeight: nh(20),
  },
  statsContainer: {
    flexDirection: 'row',
    gap: nw(16),
    marginBottom: nh(24),
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: nh(16),
    paddingHorizontal: nw(12),
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    flex: 1,
  },
  summaryStats: {
    gap: nh(8),
    marginBottom: nh(24),
    alignSelf: 'stretch',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: nw(12),
    alignSelf: 'stretch',
  },
  secondaryModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    gap: nw(6),
  },
  primaryModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    gap: nw(6),
  },
});

export default CramFlashcardViewer;