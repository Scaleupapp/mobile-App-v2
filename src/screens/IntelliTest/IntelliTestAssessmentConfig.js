// =====================================================
// FIXED INTELLITEST ASSESSMENT CONFIGURATION SCREEN
// File: screens/IntelliTest/IntelliTestAssessmentConfig.js
// Features: Fixed navigation + top button design + step visibility
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager,
  Vibration,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import IntelliTest API services
import {
  createIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

// Custom Slider Component (same as before)
const CustomSlider = ({value, minimumValue, maximumValue, step, onValueChange, minimumTrackTintColor = '#3B82F6', style}) => {
  const [sliderValue, setSliderValue] = useState(value);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handleLayout = (event) => {
    setSliderWidth(event.nativeEvent.layout.width);
  };

  const calculateValue = (gestureX) => {
    const percentage = Math.max(0, Math.min(1, gestureX / sliderWidth));
    const range = maximumValue - minimumValue;
    let newValue = minimumValue + (percentage * range);
    
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    return Math.max(minimumValue, Math.min(maximumValue, newValue));
  };

  const handleTouch = (event) => {
    if (sliderWidth > 0) {
      const gestureX = event.nativeEvent.locationX;
      const newValue = calculateValue(gestureX);
      setSliderValue(newValue);
      onValueChange(newValue);
    }
  };

  const progressPercentage = ((sliderValue - minimumValue) / (maximumValue - minimumValue)) * 100;

  return (
    <View style={[styles.customSliderContainer, style]} onLayout={handleLayout}>
      <TouchableOpacity
        style={styles.customSliderTrack}
        onPress={handleTouch}
        activeOpacity={1}
      >
        <View style={styles.customSliderBackground}>
          <View 
            style={[
              styles.customSliderFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: minimumTrackTintColor
              }
            ]} 
          />
        </View>
        <View 
          style={[
            styles.customSliderThumb,
            {
              left: `${progressPercentage}%`,
              backgroundColor: minimumTrackTintColor,
              marginLeft: -nw(10)
            }
          ]} 
        />
      </TouchableOpacity>
    </View>
  );
};

// Difficulty Distribution Component (same as before)
const DifficultySliders = ({distribution, onChange}) => {
  const updateDistribution = (key, value) => {
    const newDist = {...distribution};
    const oldValue = newDist[key];
    newDist[key] = value;
    
    const otherKeys = Object.keys(newDist).filter(k => k !== key);
    const otherTotal = otherKeys.reduce((sum, k) => sum + newDist[k], 0);
    const difference = value - oldValue;
    
    if (otherTotal > 0 && difference !== 0) {
      otherKeys.forEach(k => {
        const proportion = newDist[k] / otherTotal;
        newDist[k] = Math.max(0, Math.min(100, newDist[k] - (difference * proportion)));
      });
    }
    
    const total = Object.values(newDist).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const adjustment = (100 - total) / otherKeys.length;
      otherKeys.forEach(k => {
        newDist[k] = Math.max(0, Math.min(100, newDist[k] + adjustment));
      });
    }
    
    Object.keys(newDist).forEach(k => {
      newDist[k] = Math.round(newDist[k]);
    });
    
    onChange(newDist);
  };

  return (
    <View style={styles.difficultyContainer}>
      {['easy', 'medium', 'hard'].map((level) => (
        <View key={level} style={styles.difficultySlider}>
          <View style={styles.difficultyHeader}>
            <Text variant="medium14" color={COLORS.blue043142}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
            <Text variant="bold16" color={
              level === 'easy' ? '#10B981' : 
              level === 'medium' ? '#F59E0B' : '#EF4444'
            }>
              {distribution[level]}%
            </Text>
          </View>
          <CustomSlider
            style={styles.slider}
            value={distribution[level]}
            minimumValue={0}
            maximumValue={70}
            step={5}
            onValueChange={(value) => updateDistribution(level, value)}
            minimumTrackTintColor={
              level === 'easy' ? '#10B981' : 
              level === 'medium' ? '#F59E0B' : '#EF4444'
            }
          />
        </View>
      ))}
      <View style={styles.totalIndicator}>
        <Text variant="medium12" color={COLORS.grey777777}>
          Total: {Object.values(distribution).reduce((sum, val) => sum + val, 0)}%
        </Text>
      </View>
    </View>
  );
};

const IntelliTestAssessmentConfig = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  const {examId, examName, assessmentType, examMetadata} = route.params || {};

  // State management
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Enhanced assessment configuration state
  const [config, setConfig] = useState({
    sessionType: assessmentType || 'initial_assessment',
    totalQuestions: 10,
    timeLimit: 30,
    difficultyDistribution: {easy: 40, medium: 40, hard: 20},
    hasNegativeMarking: examMetadata?.negativeMarking ?? true,
    allowQuestionNavigation: true,
    includeCustomTopics: false,
    customTopicIds: [],
  });

  // Animation references
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Assessment types
  const assessmentTypes = [
    { 
      id: 'initial_assessment', 
      name: 'Diagnostic Test', 
      description: 'Identify your strengths & weaknesses with AI analysis.',
      icon: 'psychology',
      color: '#3B82F6'
    },
    { 
      id: 'practice', 
      name: 'Practice Session', 
      description: 'Focus on improving specific skills and topics.',
      icon: 'fitness_center',
      color: '#10B981'
    },
    { 
      id: 'mock_test', 
      name: 'Mock Exam', 
      description: 'Simulate the full exam experience with timing.',
      icon: 'quiz',
      color: '#8B5CF6'
    },
  ];

  // Simple haptic feedback
  const triggerHaptic = () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 500);
  }, []);

  useEffect(() => {
    const totalSteps = 4;
    Animated.spring(progressAnim, {
      toValue: currentStep / totalSteps,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [currentStep]);

  const changeStep = (nextStep) => {
    if (nextStep > 0 && nextStep <= 4) {
      triggerHaptic();
      setCurrentStep(nextStep);
    }
  };

  const handleAssessmentTypeChange = useCallback((typeId) => {
    triggerHaptic();
    setConfig(prev => ({ ...prev, sessionType: typeId }));
    setTimeout(() => changeStep(2), 200);
  }, []);
  
  // FIXED: Enhanced navigation to question generation
  const handleStartAssessment = useCallback(async () => {
    console.log('🚀 Starting assessment configuration...', {
      examId,
      examName,
      config
    });

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setCreatingSession(true);
    
    try {
      const sessionPayload = { 
        examId, 
        sessionType: config.sessionType,
        totalQuestions: config.totalQuestions,
        timeLimit: config.timeLimit,
        difficultyDistribution: config.difficultyDistribution,
        hasNegativeMarking: config.hasNegativeMarking,
        allowQuestionNavigation: config.allowQuestionNavigation,
        includeCustomTopics: config.includeCustomTopics,
        customTopicIds: config.customTopicIds,
      };
      
      console.log('📤 Creating session with payload:', sessionPayload);
      
      const sessionResponse = await createIntelliTestSessionApi(sessionPayload);
      
      console.log('📥 Session response received:', sessionResponse.data);
      
      if (sessionResponse.data?.success) {
        const sessionId = sessionResponse.data.data?.sessionId;
        
        if (!sessionId) {
          throw new Error('Session ID not received from server');
        }

        console.log('✅ Session created successfully, navigating to question generation...', {
          sessionId,
          route: Routes.IntelliTestQuestionGeneration
        });
        
        // CRITICAL: Add small delay to ensure state is properly set
        setTimeout(() => {
          // Navigate to Question Generation screen
          navigation.navigate(Routes.IntelliTestQuestionGeneration, {
            sessionId,
            examId,
            examName,
            config,
            sessionData: sessionResponse.data.data
          });
        }, 100);
        
      } else {
        throw new Error(sessionResponse.data?.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('❌ Session creation error:', error);
      
      // Show detailed error to user
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create assessment session';
      
      Alert.alert(
        'Session Creation Failed',
        errorMessage,
        [
          {
            text: 'Retry',
            onPress: () => handleStartAssessment()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      
      showToast({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setCreatingSession(false);
    }
  }, [config, examId, examName, navigation, showToast]);

  // Render top action button
  const renderTopActionButton = () => {
    if (currentStep < 4) {
      return (
        <View style={styles.topButtonContainer}>
          <TouchableOpacity 
            onPress={() => changeStep(currentStep + 1)} 
            activeOpacity={0.8}
            style={styles.topButton}
          >
            <LinearGradient 
              colors={['#00457E', '#003366']} 
              style={styles.topButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text variant="bold16" color={COLORS.whiteFFFFFF}>
                Continue to Step {currentStep + 1}
              </Text>
              <Icon name="arrow-forward" size={nw(20)} color={COLORS.whiteFFFFFF} style={{ marginLeft: nw(8) }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.topButtonContainer}>
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity 
            onPress={handleStartAssessment} 
            disabled={creatingSession} 
            activeOpacity={0.8}
            style={[styles.topButton, styles.generateButton]}
          >
            <LinearGradient 
              colors={creatingSession ? ['#FFB84D', '#FF9500'] : ['#FFD24D', '#FFC700']} 
              style={styles.topButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              {creatingSession ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.blue043142} />
                  <Text variant="bold16" color={COLORS.blue043142} style={{marginLeft: nw(8)}}>
                    Creating Session...
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="auto_fix_high" size={nw(24)} color={COLORS.blue043142} />
  <Text variant="bold18" color={COLORS.blue043142} >
    Generate Questions
  </Text>
  <Icon name="arrow-forward" size={nw(20)} color={COLORS.blue043142} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Helper text for final step */}
        <Text variant="medium12" color={COLORS.grey777777} style={styles.helperText}>
          AI will create {config.totalQuestions} personalized questions • ~{Math.ceil(config.totalQuestions / 5)} min
        </Text>
      </View>
    );
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text variant="bold14" color={COLORS.blue043142}>
            Step {currentStep} of 4
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Configuration
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, {width: progressWidth}]} />
        </View>
      </View>
    );
  };
  
  const renderSectionHeader = (title, subtitle) => (
    <View style={styles.sectionHeader}>
      <Text variant="bold28" color={COLORS.blue043142}>{title}</Text>
      <Text variant="medium16" color={COLORS.grey777777} style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    </View>
  );

  const renderStepContent = () => {
    switch(currentStep) {
      case 1: 
        return (
          <Animated.View style={{opacity: fadeAnim}}>
            {renderSectionHeader('Test Type', 'How do you want to prepare today?')}
            {assessmentTypes.map((type) => (
              <TouchableOpacity 
                key={type.id} 
                style={[
                  styles.enhancedChoiceCard,
                  config.sessionType === type.id && styles.selectedCard
                ]} 
                onPress={() => handleAssessmentTypeChange(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, {backgroundColor: type.color + '15'}]}>
                  <Icon name={type.icon} size={nw(28)} color={type.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="bold18" color={COLORS.blue043142}>{type.name}</Text>
                  <Text variant="medium14" color={COLORS.grey777777} style={styles.description}>
                    {type.description}
                  </Text>
                </View>
                <Icon name="arrow-forward-ios" size={nw(16)} color={COLORS.greyBBBBBB} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        );
      
      case 2:
        return (
          <Animated.View style={{opacity: fadeAnim}}>
            {renderSectionHeader('Test Parameters', 'Customize your assessment length and difficulty.')}
            
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text variant="bold16" color={COLORS.blue043142}>Total Questions</Text>
                <Text variant="bold18" color="#3B82F6">{config.totalQuestions}</Text>
              </View>
              <CustomSlider
                style={styles.fullSlider}
                value={config.totalQuestions}
                minimumValue={5}
                maximumValue={50}
                step={5}
                onValueChange={(value) => setConfig(prev => ({...prev, totalQuestions: value}))}
                minimumTrackTintColor="#3B82F6"
              />
              <View style={styles.sliderLabels}>
                <Text variant="medium12" color={COLORS.grey777777}>5 Questions</Text>
                <Text variant="medium12" color={COLORS.grey777777}>50 Questions</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text variant="bold16" color={COLORS.blue043142}>Time Limit</Text>
                <Text variant="bold18" color="#8B5CF6">{config.timeLimit} mins</Text>
              </View>
              <CustomSlider
                style={styles.fullSlider}
                value={config.timeLimit}
                minimumValue={15}
                maximumValue={180}
                step={15}
                onValueChange={(value) => setConfig(prev => ({...prev, timeLimit: value}))}
                minimumTrackTintColor="#8B5CF6"
              />
              <View style={styles.sliderLabels}>
                <Text variant="medium12" color={COLORS.grey777777}>15 mins</Text>
                <Text variant="medium12" color={COLORS.grey777777}>180 mins</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <Text variant="bold16" color={COLORS.blue043142}>Difficulty Distribution</Text>
              <Text variant="medium12" color={COLORS.grey777777} style={{marginTop: nh(4), marginBottom: nh(12)}}>
                Adjust the percentage of easy, medium, and hard questions
              </Text>
              <DifficultySliders 
                distribution={config.difficultyDistribution}
                onChange={(newDistribution) => setConfig(prev => ({...prev, difficultyDistribution: newDistribution}))}
              />
            </View>
          </Animated.View>
        );
      
      case 3:
        return (
          <Animated.View style={{opacity: fadeAnim}}>
            {renderSectionHeader('Advanced Settings', 'Fine-tune your assessment experience.')}
            
            <View style={styles.settingsContainer}>
              <TouchableOpacity 
                style={[styles.settingCard, config.hasNegativeMarking && styles.activeSetting]}
                onPress={() => {
                  triggerHaptic();
                  setConfig(prev => ({...prev, hasNegativeMarking: !prev.hasNegativeMarking}));
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconContainer, {backgroundColor: '#EF444415'}]}>
                  <Icon name="remove-circle" size={nw(24)} color="#EF4444" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text variant="bold16" color={COLORS.blue043142}>Negative Marking</Text>
                  <Text variant="medium13" color={COLORS.grey777777}>
                    Penalize for incorrect answers
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, config.hasNegativeMarking && styles.toggleActive]}>
                  <Animated.View 
                    style={[
                      styles.toggleThumb, 
                      { transform: [{ translateX: config.hasNegativeMarking ? nw(20) : 0 }] }
                    ]} 
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.settingCard, config.allowQuestionNavigation && styles.activeSetting]}
                onPress={() => {
                  triggerHaptic();
                  setConfig(prev => ({...prev, allowQuestionNavigation: !prev.allowQuestionNavigation}));
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconContainer, {backgroundColor: '#10B98115'}]}>
                  <Icon name="swap-horiz" size={nw(24)} color="#10B981" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text variant="bold16" color={COLORS.blue043142}>Free Navigation</Text>
                  <Text variant="medium13" color={COLORS.grey777777}>
                    Jump between questions freely
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, config.allowQuestionNavigation && styles.toggleActive]}>
                  <Animated.View 
                    style={[
                      styles.toggleThumb, 
                      { transform: [{ translateX: config.allowQuestionNavigation ? nw(20) : 0 }] }
                    ]} 
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.settingCard, config.includeCustomTopics && styles.activeSetting]}
                onPress={() => {
                  triggerHaptic();
                  setConfig(prev => ({...prev, includeCustomTopics: !prev.includeCustomTopics}));
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconContainer, {backgroundColor: '#8B5CF615'}]}>
                  <Icon name="extension" size={nw(24)} color="#8B5CF6" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text variant="bold16" color={COLORS.blue043142}>Include Custom Topics</Text>
                  <Text variant="medium13" color={COLORS.grey777777}>
                    Add community-created questions
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, config.includeCustomTopics && styles.toggleActive]}>
                  <Animated.View 
                    style={[
                      styles.toggleThumb, 
                      { transform: [{ translateX: config.includeCustomTopics ? nw(20) : 0 }] }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      
      case 4:
        const selectedType = assessmentTypes.find(t => t.id === config.sessionType);
        
        return (
          <Animated.View style={{opacity: fadeAnim}}>
            {renderSectionHeader("You're All Set!", "Review your configuration and generate questions.")}
            
            <LinearGradient 
              colors={['#003B73', '#002C5A']} 
              style={styles.summaryCard}
            >
              <Icon name={selectedType?.icon || 'quiz'} size={nw(36)} color={COLORS.whiteFFFFFF} />
              <Text variant="bold24" color={COLORS.whiteFFFFFF} style={{marginTop: nh(12)}}>
                {selectedType?.name}
              </Text>
              <Text variant="medium16" color={COLORS.whiteFFFFFF} style={{opacity: 0.8}}>
                {examName}
              </Text>
              
              <View style={styles.readyIndicator}>
                <Icon name="verified" size={nw(20)} color="#10B981" />
                <Text variant="bold14" color="#10B981" style={{marginLeft: nw(6)}}>
                  Ready to Generate
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, {backgroundColor: '#3B82F615'}]}>
                  <Icon name="timer" size={nw(24)} color="#3B82F6" />
                </View>
                <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
                  {config.timeLimit} mins
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Duration</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, {backgroundColor: '#8B5CF615'}]}>
                  <Icon name="quiz" size={nw(24)} color="#8B5CF6" />
                </View>
                <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
                  {config.totalQuestions}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Questions</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, {backgroundColor: config.hasNegativeMarking ? '#EF444415' : '#10B98115'}]}>
                  <Icon 
                    name={config.hasNegativeMarking ? "remove-circle" : "check-circle"} 
                    size={nw(24)} 
                    color={config.hasNegativeMarking ? "#EF4444" : "#10B981"} 
                  />
                </View>
                <Text 
                  variant="bold16" 
                  color={config.hasNegativeMarking ? "#EF4444" : "#10B981"} 
                  style={{marginTop: nh(8)}}
                >
                  {config.hasNegativeMarking ? 'Enabled' : 'Disabled'}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Negative Marks</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, {backgroundColor: '#F59E0B15'}]}>
                  <Icon 
                    name={config.allowQuestionNavigation ? "swap-horiz" : "trending-flat"} 
                    size={nw(24)} 
                    color="#F59E0B" 
                  />
                </View>
                <Text variant="bold16" color="#F59E0B" style={{marginTop: nh(8)}}>
                  {config.allowQuestionNavigation ? 'Free' : 'Linear'}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Navigation</Text>
              </View>
            </View>

            <View style={styles.difficultyPreview}>
              <Text variant="bold16" color={COLORS.blue043142} style={{marginBottom: nh(12)}}>
                Difficulty Breakdown
              </Text>
              <View style={styles.difficultyBars}>
                <View style={styles.difficultyBar}>
                  <View style={[styles.difficultyBarFill, {
                    width: `${config.difficultyDistribution.easy}%`,
                    backgroundColor: '#10B981'
                  }]} />
                  <Text variant="medium12" color={COLORS.grey777777}>
                    Easy: {config.difficultyDistribution.easy}%
                  </Text>
                </View>
                <View style={styles.difficultyBar}>
                  <View style={[styles.difficultyBarFill, {
                    width: `${config.difficultyDistribution.medium}%`,
                    backgroundColor: '#F59E0B'
                  }]} />
                  <Text variant="medium12" color={COLORS.grey777777}>
                    Medium: {config.difficultyDistribution.medium}%
                  </Text>
                </View>
                <View style={styles.difficultyBar}>
                  <View style={[styles.difficultyBarFill, {
                    width: `${config.difficultyDistribution.hard}%`,
                    backgroundColor: '#EF4444'
                  }]} />
                  <Text variant="medium12" color={COLORS.grey777777}>
                    Hard: {config.difficultyDistribution.hard}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003366" />
        <Text variant="medium16" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
          Preparing IntelliTest...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
      <Header
        title="Configure Assessment"
        onBackPress={currentStep === 1 ? navigation.goBack : () => changeStep(currentStep - 1)}
      />
      
      {/* Progress Bar */}
      {renderProgressBar()}
      
      {/* Top Action Button - Always Visible */}
      {renderTopActionButton()}
      
      {/* Main Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        <View style={styles.stepContentContainer}>
          {renderStepContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: { 
    flexGrow: 1, 
    backgroundColor: '#F8FAFC',
    paddingBottom: nh(40),
  },
  stepContentContainer: { 
    paddingHorizontal: nw(20), 
  },

  // Progress Bar
  progressContainer: { 
    paddingHorizontal: nw(20), 
    paddingVertical: nh(16), 
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(8)
  },
  progressBarBackground: { 
    height: 6, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 3, 
    overflow: 'hidden'
  },
  progressBarFill: { 
    height: 6, 
    backgroundColor: '#FFC700', 
    borderRadius: 3,
  },

  // TOP BUTTON DESIGN - NEW
  topButtonContainer: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  topButton: {
    borderRadius: nw(16),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  generateButton: {
    elevation: 6,
    shadowColor: '#FFC700',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  topButtonGradient: {
    paddingVertical: nh(18),
    paddingHorizontal: nw(24),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: nh(56),
  },
  helperText: {
    textAlign: 'center',
    marginTop: nh(8),
    fontStyle: 'italic',
  },

  // Section Header
  sectionHeader: { 
    marginBottom: nh(24), 
    paddingTop: nh(20) 
  },
  sectionSubtitle: { 
    marginTop: nh(6) 
  },

  // Enhanced Choice Cards
  enhancedChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    marginBottom: nh(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedCard: {
    borderColor: '#FFC700',
    borderWidth: 2,
    backgroundColor: '#FFFEF7',
  },
  iconContainer: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12)
  },
  textContainer: {
    flex: 1
  },
  description: {
    marginTop: nh(4)
  },

  // Input Cards
  inputCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  fullSlider: {
    width: '100%',
    height: nh(40),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(4),
  },

  // Difficulty Distribution
  difficultyContainer: {
    gap: nh(16),
  },
  difficultySlider: {
    gap: nh(8),
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: nh(30),
  },
  totalIndicator: {
    alignItems: 'center',
    marginTop: nh(8),
    paddingTop: nh(8),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  // Settings
  settingsContainer: {
    gap: nh(12)
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeSetting: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4'
  },
  settingIconContainer: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12)
  },
  settingTextContainer: {
    flex: 1
  },
  toggleSwitch: {
    width: nw(44),
    height: nh(24),
    borderRadius: nh(12),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    padding: nw(2)
  },
  toggleActive: {
    backgroundColor: '#10B981'
  },
  toggleThumb: {
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    backgroundColor: COLORS.whiteFFFFFF,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },

  // Summary
  summaryCard: {
    borderRadius: nw(20),
    padding: nw(24),
    alignItems: 'center',
    marginBottom: nh(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  readyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(20),
    marginTop: nh(16),
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: nh(20),
  },
  summaryItem: {
    width: '48%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    alignItems: 'center',
    marginBottom: nh(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryIconContainer: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(4),
  },

  // Difficulty Preview
  difficultyPreview: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    marginBottom: nh(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  difficultyBars: {
    gap: nh(8),
  },
  difficultyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  difficultyBarFill: {
    height: nh(8),
    borderRadius: nh(4),
    minWidth: nw(20),
  },

  // Custom Slider Styles
  customSliderContainer: {
    height: nh(40),
    justifyContent: 'center',
  },
  customSliderTrack: {
    height: nh(40),
    justifyContent: 'center',
  },
  customSliderBackground: {
    height: nh(6),
    backgroundColor: '#E5E7EB',
    borderRadius: nh(3),
    overflow: 'hidden',
  },
  customSliderFill: {
    height: '100%',
    borderRadius: nh(3),
  },
  customSliderThumb: {
    position: 'absolute',
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    backgroundColor: '#3B82F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default IntelliTestAssessmentConfig;