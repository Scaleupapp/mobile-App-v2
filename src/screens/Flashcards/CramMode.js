// Enhanced CramMode.js with improved UI and spacing fixes
// Key improvements: Better layout, reduced overlapping, cleaner transitions

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  generateFlashcardCramSessionApi,
  getFlashcardCramRecommendationsApi,
  getFlashcardDeckDetailsApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const {width: screenWidth} = Dimensions.get('window');

const CramMode = ({navigation, route}) => {
  const {deckId, deckTitle} = route.params;
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deck, setDeck] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [cramSession, setCramSession] = useState(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('3hours');
  const [focusArea, setFocusArea] = useState('auto');
  const [confidenceMode, setConfidenceMode] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [customTime, setCustomTime] = useState({hours: 3, minutes: 0});
  const [currentStep, setCurrentStep] = useState(1); // Step indicator

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Time frame options with better organization
  const timeFrameOptions = [
    {
      id: '1hour',
      label: '1 Hour',
      subtitle: 'Last-minute review',
      icon: 'alarm',
      color: COLORS.redEA4335,
      recommended: false,
    },
    {
      id: '3hours',
      label: '3 Hours',
      subtitle: 'Focused preparation',
      icon: 'schedule',
      color: COLORS.yellowF5BE00,
      recommended: true,
    },
    {
      id: '24hours',
      label: '1 Day',
      subtitle: 'Comprehensive study',
      icon: 'today',
      color: COLORS.blue043142,
      recommended: false,
    },
    {
      id: 'custom',
      label: 'Custom',
      subtitle: 'Set your own time',
      icon: 'tune',
      color: COLORS.green34A853,
      recommended: false,
    }
  ];

  // Focus area options
  const focusAreaOptions = [
    {id: 'auto', label: 'Auto-detect weak areas', icon: 'auto-awesome', description: 'AI identifies your problem areas'},
    {id: 'difficult', label: 'Most difficult cards', icon: 'trending-down', description: 'Focus on hardest content'},
    {id: 'recent-mistakes', label: 'Recent mistakes', icon: 'error-outline', description: 'Review what you got wrong'},
    {id: 'never-seen', label: 'Never studied cards', icon: 'visibility-off', description: 'Learn new material'},
    {id: 'all', label: 'All cards (balanced)', icon: 'balance', description: 'Comprehensive review'},
  ];

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch deck details
      const deckResponse = await getFlashcardDeckDetailsApi(deckId);
      if (deckResponse?.data?.success) {
        setDeck(deckResponse.data.deck);
      }

      // Fetch recommendations (optional)
      try {
        const recommendationsResponse = await getFlashcardCramRecommendationsApi(deckId);
        if (recommendationsResponse?.data?.success) {
          setRecommendations(recommendationsResponse.data.recommendations);
        }
      } catch (recError) {
        console.log('Recommendations unavailable (non-critical)');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({ type: 'error', title: 'Failed to load cram mode data' });
    } finally {
      setLoading(false);
    }
  }, [deckId, showToast]);

  // Generate cram session
  const generateCramSession = useCallback(async () => {
    try {
      setGenerating(true);
      
      let timeUntilExam = selectedTimeFrame;
      if (selectedTimeFrame === 'custom') {
        timeUntilExam = `${customTime.hours}h${customTime.minutes}m`;
      }
      
      const params = {
        timeUntilExam,
        focusArea,
        confidenceMode: confidenceMode.toString()
      };
      
      const response = await generateFlashcardCramSessionApi(deckId, params);
      
      if (response?.data?.success) {
        setCramSession(response.data.cramSession);
        setCurrentStep(3); // Move to results step
        
        // Success animation
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        showToast({ type: 'success', title: 'Cram session generated successfully!' });
        
      } else {
        throw new Error(response?.data?.message || 'Failed to generate cram session');
      }
    } catch (error) {
      console.error('Cram session generation error:', error);
      
      let errorMessage = 'Failed to generate cram session';
      if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast({ type: 'error', title: errorMessage });
    } finally {
      setGenerating(false);
    }
  }, [deckId, selectedTimeFrame, customTime, focusArea, confidenceMode, showToast, pulseAnim]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCramSession(null);
    setCurrentStep(1);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  // Handle start cramming with improved navigation
  const handleStartCramming = useCallback(() => {
    if (!cramSession) {
      showToast({ type: 'info', title: 'Please generate a cram session first' });
      return;
    }

    // Navigate to dedicated cram flashcard viewer
    navigation.navigate(Routes.CramFlashcardViewer, {
      deckId,
      cramSession: cramSession,
      priorityCards: cramSession.priorityCards,
      timeRemaining: cramSession.timeUntilExam,
    });
  }, [cramSession, deckId, navigation, showToast]);

  // Initialize screen
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fetchInitialData, fadeAnim, slideAnim])
  );

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
          <Text variant="medium12" color={currentStep >= 1 ? COLORS.whiteFFFFFF : COLORS.grey777777}>1</Text>
        </View>
        <Text variant="medium10" color={currentStep >= 1 ? COLORS.blue043142 : COLORS.grey777777}>
          Time & Focus
        </Text>
      </View>
      
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
          <Text variant="medium12" color={currentStep >= 2 ? COLORS.whiteFFFFFF : COLORS.grey777777}>2</Text>
        </View>
        <Text variant="medium10" color={currentStep >= 2 ? COLORS.blue043142 : COLORS.grey777777}>
          Generate
        </Text>
      </View>
      
      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      
      <View style={styles.stepContainer}>
        <View style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}>
          <Text variant="medium12" color={currentStep >= 3 ? COLORS.whiteFFFFFF : COLORS.grey777777}>3</Text>
        </View>
        <Text variant="medium10" color={currentStep >= 3 ? COLORS.blue043142 : COLORS.grey777777}>
          Study
        </Text>
      </View>
    </View>
  );

  // Render quick stats (if recommendations available)
  const renderQuickStats = () => {
    if (!recommendations?.analysis) return null;

    return (
      <Animated.View style={[styles.quickStatsContainer, {opacity: fadeAnim}]}>
        <Text variant="semibold14" color={COLORS.blue043142} style={styles.quickStatsTitle}>
          📊 Your Study Overview
        </Text>
        
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text variant="bold16" color={COLORS.blue043142}>
              {recommendations.analysis.overallAccuracy}%
            </Text>
            <Text variant="medium11" color={COLORS.grey777777}>Accuracy</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text variant="bold16" color={COLORS.redEA4335}>
              {recommendations.analysis.weakAreasCount}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777}>Weak Areas</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text variant="bold16" color={COLORS.green34A853}>
              {recommendations.analysis.studiedCards}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777}>Cards Done</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render time frame selector with better spacing
  const renderTimeFrameSelector = () => (
    <Animated.View style={[styles.sectionContainer, {opacity: fadeAnim}]}>
      <View style={styles.sectionHeader}>
        <Icon name="schedule" size={20} color={COLORS.blue043142} />
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          How much time do you have?
        </Text>
      </View>
      
      <View style={styles.timeFrameGrid}>
        {timeFrameOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.timeFrameCard,
              selectedTimeFrame === option.id && styles.timeFrameCardSelected,
              option.recommended && styles.timeFrameRecommended,
            ]}
            onPress={() => {
              if (option.id === 'custom') {
                setShowTimeModal(true);
              } else {
                setSelectedTimeFrame(option.id);
                setCurrentStep(Math.max(currentStep, 1));
              }
            }}>
            
            {option.recommended && (
              <View style={styles.recommendedBadge}>
                <Text variant="medium8" color={COLORS.whiteFFFFFF}>RECOMMENDED</Text>
              </View>
            )}
            
            <View style={[styles.timeFrameIcon, {backgroundColor: option.color + '15'}]}>
              <Icon name={option.icon} size={22} color={option.color} />
            </View>
            
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.timeFrameLabel}>
              {option.label}
            </Text>
            
            <Text variant="medium11" color={COLORS.grey777777} style={styles.timeFrameSubtitle}>
              {option.subtitle}
            </Text>
            
            {selectedTimeFrame === option.id && (
              <View style={[styles.selectedCheck, {backgroundColor: option.color}]}>
                <Icon name="check" size={14} color={COLORS.whiteFFFFFF} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // Render focus options with better UX
  const renderFocusOptions = () => (
    <Animated.View style={[styles.sectionContainer, {opacity: fadeAnim}]}>
      <View style={styles.sectionHeader}>
        <Icon name="center-focus-strong" size={20} color={COLORS.blue043142} />
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          What should we focus on?
        </Text>
      </View>
      
      <View style={styles.focusOptionsContainer}>
        {focusAreaOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.focusOptionCard,
              focusArea === option.id && styles.focusOptionSelected
            ]}
            onPress={() => {
              setFocusArea(option.id);
              setCurrentStep(Math.max(currentStep, 1));
            }}>
            
            <View style={styles.focusOptionHeader}>
              <Icon 
                name={option.icon} 
                size={18} 
                color={focusArea === option.id ? COLORS.blue043142 : COLORS.grey777777} 
              />
              <Text 
                variant="medium14" 
                color={focusArea === option.id ? COLORS.blue043142 : COLORS.grey777777}
                style={styles.focusOptionTitle}>
                {option.label}
              </Text>
              {focusArea === option.id && (
                <Icon name="check-circle" size={18} color={COLORS.blue043142} />
              )}
            </View>
            
            <Text variant="medium11" color={COLORS.grey555555} style={styles.focusOptionDescription}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Confidence Mode Toggle - Better Design */}
      <TouchableOpacity
        style={[styles.confidenceCard, confidenceMode && styles.confidenceCardActive]}
        onPress={() => setConfidenceMode(!confidenceMode)}>
        
        <View style={styles.confidenceHeader}>
          <View style={styles.confidenceIcon}>
            <Icon 
              name="psychology" 
              size={20} 
              color={confidenceMode ? COLORS.whiteFFFFFF : COLORS.blue043142} 
            />
          </View>
          <View style={styles.confidenceTextContainer}>
            <Text 
              variant="medium14" 
              color={confidenceMode ? COLORS.whiteFFFFFF : COLORS.blue043142}>
              Confidence Boost Mode
            </Text>
            <Text 
              variant="medium11" 
              color={confidenceMode ? COLORS.whiteFFFFFF + 'CC' : COLORS.grey777777}>
              Include some easy cards to build confidence
            </Text>
          </View>
          <View style={[
            styles.confidenceToggle,
            confidenceMode && styles.confidenceToggleActive
          ]}>
            <View style={[
              styles.confidenceKnob,
              confidenceMode && styles.confidenceKnobActive
            ]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render cram session results with better layout
  const renderCramSession = () => {
    if (!cramSession) return null;

    return (
      <Animated.View style={[styles.resultsContainer, {opacity: fadeAnim, transform: [{scale: pulseAnim}]}]}>
        <View style={styles.resultsHeader}>
          <View style={styles.resultsIcon}>
            <Icon name="auto-awesome" size={24} color={COLORS.yellowF5BE00} />
          </View>
          <View style={styles.resultsText}>
            <Text variant="semibold18" color={COLORS.blue043142}>
              🎯 Your Cram Session is Ready!
            </Text>
            <Text variant="medium12" color={COLORS.grey777777}>
              {cramSession.priorityCards?.length || 0} priority cards selected for optimal learning
            </Text>
          </View>
        </View>
        
        <View style={styles.sessionPreview}>
          <View style={styles.previewItem}>
            <Icon name="schedule" size={16} color={COLORS.blue043142} />
            <Text variant="medium12" color={COLORS.grey777777}>
              Study Time: {cramSession.timeUntilExam}
            </Text>
          </View>
          <View style={styles.previewItem}>
            <Icon name="psychology" size={16} color={COLORS.green34A853} />
            <Text variant="medium12" color={COLORS.grey777777}>
              Strategy: {cramSession.strategy}
            </Text>
          </View>
          <View style={styles.previewItem}>
            <Icon name="target" size={16} color={COLORS.yellowF5BE00} />
            <Text variant="medium12" color={COLORS.grey777777}>
              Focus: {cramSession.focusArea || 'Auto-selected weak areas'}
            </Text>
          </View>
        </View>

        {/* Performance insights if available */}
        {cramSession.performanceAnalysis && (
          <View style={styles.performanceInsights}>
            <Text variant="medium14" color={COLORS.blue043142} style={styles.insightsTitle}>
              📈 Performance Insights
            </Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Text variant="bold14" color={COLORS.blue043142}>
                  {Math.round(cramSession.performanceAnalysis.overallAccuracy || 0)}%
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Current</Text>
              </View>
              <View style={styles.insightItem}>
                <Text variant="bold14" color={COLORS.redEA4335}>
                  {cramSession.performanceAnalysis.weakAreas?.length || 0}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Weak</Text>
              </View>
              <View style={styles.insightItem}>
                <Text variant="bold14" color={COLORS.green34A853}>
                  {cramSession.performanceAnalysis.strongAreas?.length || 0}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Strong</Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  // Fixed action buttons with proper styling
  const renderActionButtons = () => (
    <View style={styles.actionContainer}>
      {!cramSession ? (
        <TouchableOpacity
          style={[styles.primaryButton, generating && styles.primaryButtonDisabled]}
          onPress={() => {
            setCurrentStep(2);
            generateCramSession();
          }}
          disabled={generating}>
          
          <View style={styles.buttonContent}>
            {generating ? (
              <>
                <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} style={styles.buttonLoader} />
                <Text style={styles.primaryButtonText}>Generating Your Session...</Text>
              </>
            ) : (
              <>
                <Icon name="auto-awesome" size={20} color={COLORS.whiteFFFFFF} style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Generate Cram Session</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartCramming}>
            <View style={styles.buttonContent}>
              <Icon name="play-arrow" size={20} color={COLORS.whiteFFFFFF} style={styles.buttonIcon} />
              <Text style={styles.startButtonText}>Start Cramming</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={() => {
              setCramSession(null);
              setCurrentStep(1);
            }}>
            <View style={styles.buttonContent}>
              <Icon name="refresh" size={18} color={COLORS.blue043142} style={styles.buttonIcon} />
              <Text style={styles.regenerateButtonText}>New Session</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Custom time modal (unchanged but with better styling)
  const renderCustomTimeModal = () => (
    <Modal
      visible={showTimeModal}
      transparent
      animationType="slide">
      
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text variant="semibold18" color={COLORS.blue043142} style={styles.modalTitle}>
            Set Custom Study Time
          </Text>
          
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputSection}>
              <Text variant="medium14" color={COLORS.grey777777}>Hours</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setCustomTime(prev => ({...prev, hours: Math.max(0, prev.hours - 1)}))}>
                  <Icon name="remove" size={18} color={COLORS.blue043142} />
                </TouchableOpacity>
                <Text variant="bold18" color={COLORS.blue043142} style={styles.timeValue}>
                  {customTime.hours}
                </Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setCustomTime(prev => ({...prev, hours: Math.min(24, prev.hours + 1)}))}>
                  <Icon name="add" size={18} color={COLORS.blue043142} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timeInputSection}>
              <Text variant="medium14" color={COLORS.grey777777}>Minutes</Text>
              <View style={styles.timeControls}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setCustomTime(prev => ({...prev, minutes: Math.max(0, prev.minutes - 15)}))}>
                  <Icon name="remove" size={18} color={COLORS.blue043142} />
                </TouchableOpacity>
                <Text variant="bold18" color={COLORS.blue043142} style={styles.timeValue}>
                  {customTime.minutes}
                </Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setCustomTime(prev => ({...prev, minutes: Math.min(45, prev.minutes + 15)}))}>
                  <Icon name="add" size={18} color={COLORS.blue043142} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowTimeModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.setTimeButton}
              onPress={() => {
                setSelectedTimeFrame('custom');
                setShowTimeModal(false);
                setCurrentStep(Math.max(currentStep, 1));
              }}>
              <Text style={styles.setTimeText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="Cram Mode" 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Analyzing your study data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Cram Mode"
        subtitle={deck?.title || deckTitle}
        onBackPress={() => navigation.goBack()}
        rightIcon="refresh"
        onRightIconPress={handleRefresh}
      />

      <View style={styles.content}>
        {renderStepIndicator()}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }>
          
          {renderQuickStats()}
          {renderTimeFrameSelector()}
          {renderFocusOptions()}
          {renderCramSession()}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {renderActionButtons()}
      {renderCustomTimeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(24),
    borderTopLeftRadius: nh(24),
    borderTopRightRadius: nh(24),
  },
  
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(20),
    paddingHorizontal: nw(20),
    backgroundColor: COLORS.greyF8F8F8,
    marginHorizontal: nw(20),
    marginTop: nh(16),
    borderRadius: nw(12),
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    backgroundColor: COLORS.greyDDDDDD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(6),
  },
  stepCircleActive: {
    backgroundColor: COLORS.blue043142,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.greyDDDDDD,
    marginHorizontal: nw(16),
  },
  stepLineActive: {
    backgroundColor: COLORS.blue043142,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: nw(20),
    paddingBottom: nh(100), // Space for fixed action buttons
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(24),
    borderTopLeftRadius: nh(24),
    borderTopRightRadius: nh(24),
  },
  loadingText: {
    marginTop: nh(16),
    textAlign: 'center',
  },

  // Section containers with better spacing
  sectionContainer: {
    marginBottom: nh(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(16),
    gap: nw(8),
  },
  sectionTitle: {
    flex: 1,
  },

  // Quick stats
  quickStatsContainer: {
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: nw(16),
    padding: nw(20),
    marginBottom: nh(20),
    marginTop: nh(16),
  },
  quickStatsTitle: {
    marginBottom: nh(12),
    textAlign: 'center',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },

  // Time frame selector - improved layout
  timeFrameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(12),
    justifyContent: 'space-between',
  },
  timeFrameCard: {
    width: nw(155),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    borderWidth: 2,
    borderColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    position: 'relative',
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeFrameCardSelected: {
    borderColor: COLORS.blue043142,
    backgroundColor: COLORS.blue043142 + '05',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  timeFrameRecommended: {
    borderColor: COLORS.yellowF5BE00,
  },
  recommendedBadge: {
    position: 'absolute',
    top: nw(6),
    right: nw(6),
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(8),
  },
  timeFrameIcon: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  timeFrameLabel: {
    marginBottom: nh(4),
    textAlign: 'center',
  },
  timeFrameSubtitle: {
    textAlign: 'center',
    lineHeight: nh(16),
  },
  selectedCheck: {
    position: 'absolute',
    top: nw(8),
    left: nw(8),
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Focus options - card-based design
  focusOptionsContainer: {
    gap: nh(12),
    marginBottom: nh(16),
  },
  focusOptionCard: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  focusOptionSelected: {
    backgroundColor: COLORS.blue043142 + '10',
    borderColor: COLORS.blue043142,
  },
  focusOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(6),
    gap: nw(12),
  },
  focusOptionTitle: {
    flex: 1,
  },
  focusOptionDescription: {
    lineHeight: nh(16),
    marginLeft: nw(30),
  },

  // Confidence mode toggle - enhanced design
  confidenceCard: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  confidenceCardActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  confidenceIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceTextContainer: {
    flex: 1,
  },
  confidenceToggle: {
    width: nw(48),
    height: nw(24),
    borderRadius: nw(12),
    backgroundColor: COLORS.greyDDDDDD,
    justifyContent: 'center',
    paddingHorizontal: nw(2),
  },
  confidenceToggleActive: {
    backgroundColor: COLORS.whiteFFFFFF + '50',
  },
  confidenceKnob: {
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    backgroundColor: COLORS.whiteFFFFFF,
    alignSelf: 'flex-start',
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  confidenceKnobActive: {
    alignSelf: 'flex-end',
  },

  // Results container
  resultsContainer: {
    backgroundColor: COLORS.green34A853 + '10',
    borderRadius: nw(16),
    padding: nw(20),
    marginBottom: nh(20),
    borderWidth: 1,
    borderColor: COLORS.green34A853 + '30',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(16),
    gap: nw(12),
  },
  resultsIcon: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    backgroundColor: COLORS.yellowF5BE00 + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsText: {
    flex: 1,
  },
  sessionPreview: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(16),
    gap: nh(8),
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  performanceInsights: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
  },
  insightsTitle: {
    marginBottom: nh(12),
    textAlign: 'center',
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },

  // Action buttons - fixed positioning
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    paddingVertical: nh(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: nh(56),
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.grey777777,
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: nw(8),
  },
  buttonLoader: {
    marginRight: nw(8),
  },
  primaryButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: nw(12),
  },
  startButton: {
    flex: 2,
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    paddingVertical: nh(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: 16,
    fontWeight: 'bold',
  },
  regenerateButton: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 2,
    borderColor: COLORS.blue043142,
    borderRadius: nw(12),
    paddingVertical: nh(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateButtonText: {
    color: COLORS.blue043142,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Custom time modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    padding: nw(24),
    width: nw(320),
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: nh(24),
    textAlign: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: nw(40),
    marginBottom: nh(24),
  },
  timeInputSection: {
    alignItems: 'center',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(12),
    gap: nw(16),
  },
  timeButton: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: COLORS.greyF8F8F8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  timeValue: {
    minWidth: nw(40),
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: nw(12),
    width: '100%',
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: nh(12),
    paddingHorizontal: nw(20),
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(8),
    alignItems: 'center',
  },
  cancelModalText: {
    color: COLORS.grey777777,
    fontWeight: 'bold',
  },
  setTimeButton: {
    flex: 1,
    paddingVertical: nh(12),
    paddingHorizontal: nw(20),
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    alignItems: 'center',
  },
  setTimeText: {
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
  },

  // Bottom padding for scroll content
  bottomPadding: {
    height: nh(40),
  },
});

export default CramMode;