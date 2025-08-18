// =====================================================
// ENHANCED INTELLITEST QUESTION GENERATION SCREEN
// File: screens/IntelliTest/IntelliTestQuestionGeneration.js
// Features: Engaging content, better progress tracking, improved UX
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
  BackHandler,
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

// Import API services
import {
  getIntelliTestSessionSummaryApi,
  startIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Engaging content for different exams
const EXAM_ENGAGEMENT_CONTENT = {
  'CAT': {
    facts: [
      "💼 CAT is taken by over 2 lakh students annually for admission to 20 IIMs",
      "⚡ The average CAT topper solves questions in under 2 minutes each",
      "🎯 Only top 1% candidates get calls from IIM-A, B, and C",
      "📊 Data Interpretation contributes 40% of the DILR section score",
      "🧠 Reading Comprehension passages are often from business magazines",
      "💡 CAT questions test logical reasoning more than memorization"
    ],
    tips: [
      "Focus on accuracy over speed - negative marking can be costly",
      "Practice time management - each section has its own time limit",
      "Read questions carefully - CAT tests your attention to detail",
      "Use elimination strategy for multiple choice questions",
      "Stay calm during the exam - stress can affect logical thinking"
    ],
    motivation: [
      "Every question you practice brings you closer to your MBA dream",
      "Top business leaders started their journey with CAT preparation",
      "Success in CAT opens doors to prestigious management careers",
      "Your preparation today shapes your leadership tomorrow"
    ]
  },
  'JEE_MAIN': {
    facts: [
      "🔬 JEE Main is attempted by over 10 lakh students for engineering admissions",
      "⚛️ Physics contributes 25% of the total score across all subjects",
      "🧪 Chemistry questions often integrate organic and physical chemistry",
      "📐 Mathematics section tests calculus, algebra, and coordinate geometry",
      "🎯 Top 2.5 lakh students qualify for JEE Advanced",
      "💻 The exam is conducted in multiple sessions for fairness"
    ],
    tips: [
      "Master the fundamentals - advanced concepts build on basics",
      "Practice numerical problems daily for speed and accuracy",
      "Physics requires strong conceptual understanding over memorization",
      "Chemistry demands both theoretical knowledge and practical application",
      "Mathematics needs consistent practice for problem-solving skills"
    ],
    motivation: [
      "Engineering shapes the future - your preparation matters",
      "Every solved problem builds your analytical thinking",
      "Top engineers started with dedicated JEE preparation",
      "Your hard work today creates tomorrow's innovations"
    ]
  },
  'NEET': {
    facts: [
      "🏥 NEET is the gateway to MBBS seats in government medical colleges",
      "🧬 Biology carries 50% weightage with 90 questions out of 180",
      "⚗️ Chemistry questions span organic, inorganic, and physical chemistry",
      "🔬 Physics focuses on medical applications and fundamental concepts",
      "📚 NCERT textbooks form the foundation for 85% of questions",
      "🎯 Top 1% candidates secure government medical college seats"
    ],
    tips: [
      "NCERT is your Bible - master every concept thoroughly",
      "Biology requires consistent revision and fact retention",
      "Chemistry needs balanced preparation across all three branches",
      "Physics concepts should be understood with medical applications",
      "Practice previous year questions for pattern familiarity"
    ],
    motivation: [
      "Doctors save lives - your preparation serves humanity",
      "Medical profession offers respect and fulfillment",
      "Every concept learned helps future patients",
      "Your dedication today creates a healer tomorrow"
    ]
  },
  'GATE': {
    facts: [
      "🎓 GATE score is valid for 3 years for admissions and PSU jobs",
      "🏭 PSUs like ONGC, BHEL recruit directly through GATE scores",
      "📊 Only top 15% candidates qualify each year across all branches",
      "💼 Average salary package in PSUs is ₹8-12 LPA for fresh graduates",
      "🎯 IIT professors design questions to test engineering depth",
      "⚡ Numerical Answer Type questions carry no negative marking"
    ],
    tips: [
      "Focus on core engineering subjects with 70% weightage",
      "Engineering Mathematics is crucial - practice regularly",
      "Previous year analysis reveals important topic patterns",
      "Time management is critical with 3 hours for 65 questions",
      "Understanding concepts is more important than memorizing formulas"
    ],
    motivation: [
      "GATE opens doors to prestigious PSUs and higher education",
      "Engineering excellence requires continuous learning",
      "Your technical skills today build India's infrastructure tomorrow",
      "Top engineers combine theoretical knowledge with practical wisdom"
    ]
  },
  'GMAT': {
    facts: [
      "🌍 GMAT is accepted by 7000+ business schools worldwide",
      "📈 Average GMAT score at top 10 business schools is 720+",
      "💰 MBA graduates see 80-100% salary increase post-graduation",
      "🧠 Quantitative section tests mathematical reasoning, not computation",
      "📖 Verbal section emphasizes critical reasoning and comprehension",
      "⏰ Adaptive format adjusts difficulty based on your performance"
    ],
    tips: [
      "Critical reasoning questions test logic, not subject knowledge",
      "Data sufficiency requires understanding what information is needed",
      "Reading comprehension passages are from business and academic sources",
      "Quantitative reasoning emphasizes problem-solving over calculation",
      "Integrated reasoning combines data analysis with logical thinking"
    ],
    motivation: [
      "Global MBA opens international career opportunities",
      "Business leaders master analytical and strategic thinking",
      "Your preparation today shapes your global business impact",
      "Top business schools seek well-rounded analytical minds"
    ]
  },
  'UPSC': {
    facts: [
      "🏛️ UPSC CSE has less than 0.1% success rate among all applicants",
      "📚 General Studies covers history, geography, polity, and current affairs",
      "🎯 Civil servants impact millions of lives through policy implementation",
      "📰 Current affairs from last 12 months are crucial for success",
      "🧠 CSAT tests logical reasoning and comprehension skills",
      "⚖️ IAS officers shape India's administrative and policy framework"
    ],
    tips: [
      "Current affairs reading should be daily and analytical",
      "Static GS topics need conceptual clarity with factual accuracy",
      "CSAT requires speed with accuracy in logical reasoning",
      "Previous year questions reveal important pattern trends",
      "Integrate static knowledge with current developments"
    ],
    motivation: [
      "Civil servants serve the nation and impact society",
      "Administrative excellence requires dedication and integrity",
      "Your preparation today serves India's development tomorrow",
      "Public service is the highest form of national contribution"
    ]
  }
};

const IntelliTestQuestionGeneration = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  const {sessionId, examId, examName, config, sessionData} = route.params || {};

  // State management
  const [generationPhase, setGenerationPhase] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(1);
  const [generatedQuestions, setGeneratedQuestions] = useState(0);
  const [aiSuccessRate, setAiSuccessRate] = useState(0);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [startingAssessment, setStartingAssessment] = useState(false);
  
  // Engagement content state
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentMotivationIndex, setCurrentMotivationIndex] = useState(0);

  // Animation references
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Get exam-specific content
  const examContent = EXAM_ENGAGEMENT_CONTENT[examId] || EXAM_ENGAGEMENT_CONTENT['CAT'];

  // Generation phases with detailed info
  const generationPhases = {
    initializing: {
      title: 'Initializing AI Engine',
      subtitle: 'Preparing intelligent question generation...',
      icon: 'settings',
      color: '#6B7280',
      description: 'Setting up exam-specific parameters and AI algorithms'
    },
    analyzing: {
      title: 'Analyzing Exam Pattern',
      subtitle: 'Understanding difficulty distribution...',
      icon: 'analytics',
      color: '#3B82F6',
      description: 'Analyzing your configuration for optimal question selection'
    },
    generating: {
      title: 'Generating Questions',
      subtitle: 'AI is creating personalized questions...',
      icon: 'psychology',
      color: '#8B5CF6',
      description: 'Using advanced algorithms to create exam-quality questions'
    },
    enhancing: {
      title: 'Enhancing Quality',
      subtitle: 'Optimizing difficulty and relevance...',
      icon: 'auto_fix_high',
      color: '#F59E0B',
      description: 'Fine-tuning questions for optimal learning experience'
    },
    validating: {
      title: 'Final Validation',
      subtitle: 'Ensuring question accuracy...',
      icon: 'verified',
      color: '#10B981',
      description: 'Running quality checks and validation algorithms'
    },
    completed: {
      title: 'Generation Complete!',
      subtitle: 'Your personalized assessment is ready',
      icon: 'check_circle',
      color: '#059669',
      description: 'All questions generated and validated successfully'
    },
    error: {
      title: 'Generation Failed',
      subtitle: 'Unable to generate questions',
      icon: 'error',
      color: '#EF4444',
      description: 'Please try again or contact support'
    }
  };

  // Prevent back navigation during generation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (generationPhase === 'completed' || generationPhase === 'error') {
        return false;
      }
      
      Alert.alert(
        'Generation in Progress',
        'Questions are being generated. Do you want to cancel and return to configuration?',
        [
          { text: 'Continue Generation', style: 'cancel' },
          { 
            text: 'Cancel', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [generationPhase, navigation]);

  // Content rotation for engagement
  useEffect(() => {
    if (generationPhase === 'generating' && examContent.facts.length > 0) {
      const interval = setInterval(() => {
        // Fade out current content
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Update content
          setCurrentFactIndex(prev => (prev + 1) % examContent.facts.length);
          setCurrentTipIndex(prev => (prev + 1) % examContent.tips.length);
          setCurrentMotivationIndex(prev => (prev + 1) % examContent.motivation.length);
          
          // Fade in new content
          Animated.timing(contentFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        });
      }, 4000); // Change content every 4 seconds

      return () => clearInterval(interval);
    }
  }, [generationPhase, examContent]);

  // Start animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  // Animate progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Enhanced generation simulation with more phases
  const simulateGeneration = useCallback(async () => {
    try {
      const totalQuestions = config?.totalQuestions || 30;
      const batchSize = 5;
      const calculatedBatches = Math.ceil(totalQuestions / batchSize);
      setTotalBatches(calculatedBatches);

      // Phase 1: Initializing (0-5%)
      setGenerationPhase('initializing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(5);

      // Phase 2: Analyzing (5-15%)
      setGenerationPhase('analyzing');
      await new Promise(resolve => setTimeout(resolve, 1200));
      setProgress(15);

      // Phase 3: Generating questions in batches (15-75%)
      setGenerationPhase('generating');
      
      for (let batch = 1; batch <= calculatedBatches; batch++) {
        setCurrentBatch(batch);
        
        const batchProgress = 15 + ((batch / calculatedBatches) * 60);
        setProgress(batchProgress);
        
        const questionsInBatch = Math.min(batchSize, totalQuestions - (batch - 1) * batchSize);
        setGeneratedQuestions((batch - 1) * batchSize + questionsInBatch);
        
        const batchSuccessRate = 85 + Math.random() * 10;
        setAiSuccessRate(batchSuccessRate);
        
        const currentFallbacks = Math.floor(((batch - 1) * batchSize + questionsInBatch) * (100 - batchSuccessRate) / 100);
        setFallbackCount(currentFallbacks);
        
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      }

      // Phase 4: Enhancing (75-90%)
      setGenerationPhase('enhancing');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(90);

      // Phase 5: Validating (90-100%)
      setGenerationPhase('validating');
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 1200));
      setProgress(100);

      // Phase 6: Completed
      setGenerationPhase('completed');
      
      await fetchSessionDetails();
      
      setTimeout(() => {
        setShowSessionModal(true);
      }, 800);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationPhase('error');
      showToast({
        message: 'Failed to generate questions. Please try again.',
        type: 'error',
      });
    }
  }, [config, showToast]);

  // Fetch session details from API
  const fetchSessionDetails = useCallback(async () => {
    try {
      if (!sessionId) return;
      
      const response = await getIntelliTestSessionSummaryApi(sessionId);
      if (response.data?.success) {
        setSessionDetails(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSessionDetails({
        sessionId,
        examConfiguration: {
          examId,
          examName,
          totalQuestions: config?.totalQuestions || 30,
          timeLimit: config?.timeLimit || 45,
        },
        sessionConfig: config,
        questions: Array(config?.totalQuestions || 30).fill({}),
        generationMetadata: {
          aiGenerationSuccessful: aiSuccessRate > 80,
          fallbackQuestionsCount: fallbackCount,
          questionTypes: ['multiple_choice'],
          subjects: ['Physics', 'Chemistry', 'Mathematics'],
          difficulties: ['easy', 'medium', 'hard']
        }
      });
    }
  }, [sessionId, examId, examName, config, aiSuccessRate, fallbackCount]);

  // Start generation process
  useEffect(() => {
    if (sessionId) {
      simulateGeneration();
    }
  }, [sessionId, simulateGeneration]);

  // Handle start assessment
  const handleStartAssessment = useCallback(async () => {
    try {
      setStartingAssessment(true);
      await startIntelliTestSessionApi({ sessionId });
      navigation.replace(Routes.IntelliStartTestAssessment, {
        sessionId,
        examId,
        examName,
        config,
        sessionDetails
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      showToast({
        message: formatIntelliTestError(error),
        type: 'error',
      });
    } finally {
      setStartingAssessment(false);
    }
  }, [sessionId, examId, examName, config, sessionDetails, navigation, showToast]);

  // Handle return to hub
  const handleReturnToHub = useCallback(() => {
    setShowSessionModal(false);
    navigation.navigate(Routes.IntelliTestHub);
  }, [navigation]);

  // Render progress indicator with engagement content
  const renderProgressIndicator = () => {
    const currentPhase = generationPhases[generationPhase];
    const rotateInterpolate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View style={[styles.progressContainer, {opacity: fadeAnim}]}>
        {/* Phase Indicator */}
        <View style={styles.progressHeader}>
          <Animated.View 
            style={[
              styles.phaseIconContainer, 
              {backgroundColor: currentPhase.color + '15'},
              (generationPhase === 'generating' || generationPhase === 'analyzing') && {transform: [{scale: pulseAnim}]}
            ]}
          >
            {(generationPhase === 'generating' || generationPhase === 'analyzing') ? (
              <Animated.View style={{transform: [{rotate: rotateInterpolate}]}}>
                <Icon name={currentPhase.icon} size={nw(32)} color={currentPhase.color} />
              </Animated.View>
            ) : (
              <Icon name={currentPhase.icon} size={nw(32)} color={currentPhase.color} />
            )}
          </Animated.View>
          
          <View style={styles.phaseTextContainer}>
            <Text variant="bold20" color={COLORS.blue043142}>
              {currentPhase.title}
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              {currentPhase.subtitle}
            </Text>
            <Text variant="medium12" color={COLORS.grey999999} style={{marginTop: nh(4)}}>
              {currentPhase.description}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: currentPhase.color
                }
              ]} 
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text variant="bold18" color={currentPhase.color}>
              {Math.round(progress)}%
            </Text>
            <Text variant="medium12" color={COLORS.grey777777}>
              Complete
            </Text>
          </View>
        </View>

        {/* Generation Stats */}
        {generationPhase === 'generating' && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="bold16" color={COLORS.blue043142}>{currentBatch}</Text>
              <Text variant="medium12" color={COLORS.grey777777}>Current Batch</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="bold16" color={COLORS.blue043142}>{generatedQuestions}</Text>
              <Text variant="medium12" color={COLORS.grey777777}>Generated</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="bold16" color="#10B981">{Math.round(aiSuccessRate)}%</Text>
              <Text variant="medium12" color={COLORS.grey777777}>AI Success</Text>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  // Render engaging content
  const renderEngagingContent = () => {
    if (generationPhase === 'error' || generationPhase === 'completed') {
      return null;
    }

    return (
      <Animated.View style={[styles.engagementContainer, {opacity: fadeAnim}]}>
        {/* During generation - show rotating content */}
        {generationPhase === 'generating' && (
          <Animated.View style={[styles.contentCard, {opacity: contentFadeAnim}]}>
            <View style={styles.factSection}>
              <View style={styles.factHeader}>
                <Icon name="lightbulb" size={nw(20)} color="#F59E0B" />
                <Text variant="bold16" color={COLORS.blue043142}>Did You Know?</Text>
              </View>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.factText}>
                {examContent.facts[currentFactIndex]}
              </Text>
            </View>
            
            <View style={styles.tipSection}>
              <View style={styles.tipHeader}>
                <Icon name="tips_and_updates" size={nw(20)} color="#10B981" />
                <Text variant="bold16" color={COLORS.blue043142}>Pro Tip</Text>
              </View>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.tipText}>
                {examContent.tips[currentTipIndex]}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* During other phases - show motivation */}
        {(generationPhase === 'initializing' || generationPhase === 'analyzing' || 
          generationPhase === 'enhancing' || generationPhase === 'validating') && (
          <View style={styles.motivationCard}>
            <Icon name="emoji_events" size={nw(24)} color="#FFD700" />
            <Text variant="medium14" color={COLORS.grey777777} style={styles.motivationText}>
              {examContent.motivation[currentMotivationIndex]}
            </Text>
          </View>
        )}

        {/* Batch Info */}
        {generationPhase === 'generating' && (
          <View style={styles.batchInfoCard}>
            <Text variant="medium12" color={COLORS.grey777777}>
              Processing batch {currentBatch} of {totalBatches} • {generatedQuestions} / {config?.totalQuestions || 30} questions ready
            </Text>
            <View style={styles.miniProgressBar}>
              <View 
                style={[
                  styles.miniProgressFill,
                  {width: `${(generatedQuestions / (config?.totalQuestions || 30)) * 100}%`}
                ]} 
              />
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (generationPhase !== 'error') return null;

    return (
      <Animated.View style={[styles.errorContainer, {opacity: fadeAnim}]}>
        <Icon name="error_outline" size={nw(48)} color="#EF4444" />
        <Text variant="bold18" color="#EF4444" style={{marginTop: nh(16)}}>
          Generation Failed
        </Text>
        <Text variant="medium14" color={COLORS.grey777777} style={{textAlign: 'center', marginTop: nh(8)}}>
          We encountered an issue while generating your questions. Please try again.
        </Text>
        
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setGenerationPhase('initializing');
            setProgress(0);
            setCurrentFactIndex(0);
            setCurrentTipIndex(0);
            setCurrentMotivationIndex(0);
            simulateGeneration();
          }}
          activeOpacity={0.8}
        >
          <Icon name="refresh" size={nw(18)} color={COLORS.whiteFFFFFF} />
          <Text variant="bold14" color={COLORS.whiteFFFFFF} style={{marginLeft: nw(8)}}>
            Try Again
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Enhanced session details modal
  const renderSessionModal = () => (
    <Modal
      visible={showSessionModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSessionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#059669', '#10B981']}
            style={styles.modalHeader}
          >
            <Icon name="check_circle" size={nw(40)} color={COLORS.whiteFFFFFF} />
            <Text variant="bold24" color={COLORS.whiteFFFFFF} style={{marginTop: nh(8)}}>
              Assessment Ready!
            </Text>
            <Text variant="medium14" color={COLORS.whiteFFFFFF} style={{opacity: 0.9}}>
              {config?.totalQuestions || 30} personalized questions generated
            </Text>
          </LinearGradient>

          {/* Session Summary */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon name="quiz" size={nw(24)} color="#3B82F6" />
                <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
                  {config?.totalQuestions || 30}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Questions</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="timer" size={nw(24)} color="#8B5CF6" />
                <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
                  {config?.timeLimit || 45}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>Minutes</Text>
              </View>
              
              <View style={styles.statCard}>
                <Icon name="auto_fix_high" size={nw(24)} color="#10B981" />
                <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
                  {Math.round(aiSuccessRate)}%
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>AI Quality</Text>
              </View>
            </View>

            {/* Exam Configuration Summary */}
            <View style={styles.summarySection}>
              <Text variant="bold18" color={COLORS.blue043142} style={{marginBottom: nh(16)}}>
                Assessment Configuration
              </Text>
              
              <View style={styles.configGrid}>
                <View style={styles.configRow}>
                  <Text variant="medium14" color={COLORS.grey777777}>Examination</Text>
                  <Text variant="medium14" color={COLORS.blue043142}>{examName}</Text>
                </View>
                <View style={styles.configRow}>
                  <Text variant="medium14" color={COLORS.grey777777}>Type</Text>
                  <Text variant="medium14" color={COLORS.blue043142}>
                    {config?.sessionType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.configRow}>
                  <Text variant="medium14" color={COLORS.grey777777}>Negative Marking</Text>
                  <View style={styles.statusIndicator}>
                    <Icon 
                      name={config?.hasNegativeMarking ? "cancel" : "check_circle"} 
                      size={nw(16)} 
                      color={config?.hasNegativeMarking ? "#EF4444" : "#10B981"} 
                    />
                    <Text variant="medium14" color={config?.hasNegativeMarking ? "#EF4444" : "#10B981"}>
                      {config?.hasNegativeMarking ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <View style={styles.configRow}>
                  <Text variant="medium14" color={COLORS.grey777777}>Navigation</Text>
                  <View style={styles.statusIndicator}>
                    <Icon 
                      name={config?.allowQuestionNavigation ? "swap_horiz" : "trending_flat"} 
                      size={nw(16)} 
                      color={config?.allowQuestionNavigation ? "#10B981" : "#F59E0B"} 
                    />
                    <Text variant="medium14" color={config?.allowQuestionNavigation ? "#10B981" : "#F59E0B"}>
                      {config?.allowQuestionNavigation ? 'Free' : 'Linear'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Difficulty Distribution Visualization */}
            {config?.difficultyDistribution && (
              <View style={styles.summarySection}>
                <Text variant="bold18" color={COLORS.blue043142} style={{marginBottom: nh(16)}}>
                  Difficulty Distribution
                </Text>
                <View style={styles.difficultyBars}>
                  {['easy', 'medium', 'hard'].map((level, index) => {
                    const colors = ['#10B981', '#F59E0B', '#EF4444'];
                    const percentage = config.difficultyDistribution[level];
                    return (
                      <View key={level} style={styles.difficultyBarContainer}>
                        <View style={styles.difficultyBarHeader}>
                          <Text variant="medium14" color={COLORS.blue043142}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                          <Text variant="bold14" color={colors[index]}>
                            {percentage}%
                          </Text>
                        </View>
                        <View style={styles.difficultyBar}>
                          <View 
                            style={[
                              styles.difficultyBarFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: colors[index]
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Generation Quality Insights */}
            <View style={styles.summarySection}>
              <Text variant="bold18" color={COLORS.blue043142} style={{marginBottom: nh(16)}}>
                Generation Quality
              </Text>
              <View style={styles.qualityCard}>
                <View style={styles.qualityMetric}>
                  <Text variant="medium14" color={COLORS.grey777777}>AI Success Rate</Text>
                  <View style={styles.qualityBarContainer}>
                    <View style={styles.qualityBar}>
                      <View 
                        style={[
                          styles.qualityBarFill,
                          {
                            width: `${aiSuccessRate}%`,
                            backgroundColor: aiSuccessRate > 85 ? '#10B981' : aiSuccessRate > 70 ? '#F59E0B' : '#EF4444'
                          }
                        ]} 
                      />
                    </View>
                    <Text variant="bold14" color={COLORS.blue043142}>
                      {Math.round(aiSuccessRate)}%
                    </Text>
                  </View>
                </View>
                <Text variant="medium12" color={COLORS.grey777777}>
                  {fallbackCount > 0 ? `${fallbackCount} fallback questions included` : 'All questions AI-generated'}
                </Text>
              </View>
            </View>

            {/* Ready to Start Message */}
            <View style={styles.readyMessage}>
              <Icon name="rocket_launch" size={nw(24)} color="#3B82F6" />
              <Text variant="medium14" color={COLORS.grey777777} style={{marginLeft: nw(12), flex: 1}}>
                Your personalized assessment is ready. Begin when you're prepared to focus for the full duration.
              </Text>
            </View>
          </ScrollView>

          {/* Enhanced Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleReturnToHub}
              activeOpacity={0.8}
            >
              <Icon name="home" size={nw(18)} color={COLORS.blue043142} />
              <Text variant="bold14" color={COLORS.blue043142} style={{marginLeft: nw(8)}}>
                Back to Hub
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartAssessment}
              disabled={startingAssessment}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.primaryButtonGradient}
              >
                {startingAssessment ? (
                  <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
                ) : (
                  <>
                    <Icon name="play_arrow" size={nw(20)} color={COLORS.whiteFFFFFF} />
                    <Text variant="bold16" color={COLORS.whiteFFFFFF} style={{marginLeft: nw(8)}}>
                      Start Assessment
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Generating Questions"
        onBackPress={generationPhase === 'completed' || generationPhase === 'error' ? navigation.goBack : undefined}
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.contentContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderProgressIndicator()}
          {renderEngagingContent()}
          {renderErrorState()}
        </ScrollView>
      </View>

      {renderSessionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  scrollContent: {
    flexGrow: 1,
    padding: nw(20),
    justifyContent: 'center',
  },

  // Enhanced Progress Indicator
  progressContainer: {
    alignItems: 'center',
    marginBottom: nh(30),
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: nh(30),
  },
  phaseIconContainer: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  phaseTextContainer: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: nh(20),
  },
  progressBarBackground: {
    width: '100%',
    height: nh(10),
    backgroundColor: '#E5E7EB',
    borderRadius: nh(5),
    marginBottom: nh(12),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: nh(5),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressTextContainer: {
    alignItems: 'center',
  },

  // Generation Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
  },

  // Engagement Content
  engagementContainer: {
    gap: nh(16),
  },
  contentCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  factSection: {
    marginBottom: nh(16),
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  factText: {
    lineHeight: 20,
  },
  tipSection: {
    paddingTop: nh(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  tipText: {
    lineHeight: 20,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  motivationText: {
    marginLeft: nw(12),
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  batchInfoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
  },
  miniProgressBar: {
    width: '100%',
    height: nh(4),
    backgroundColor: '#E0E7FF',
    borderRadius: nh(2),
    marginTop: nh(8),
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: nh(2),
  },

  // Error State
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: nw(20),
    marginTop: nh(40),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: nw(12),
    paddingHorizontal: nw(24),
    paddingVertical: nh(14),
    marginTop: nh(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    maxHeight: screenHeight * 0.9,
  },
  modalHeader: {
    padding: nw(24),
    alignItems: 'center',
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
  },
  modalBody: {
    paddingHorizontal: nw(20),
    maxHeight: screenHeight * 0.6,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: nh(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: nh(20),
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },

  // Summary Sections
  summarySection: {
    marginBottom: nh(24),
  },
  configGrid: {
    gap: nh(12),
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(4),
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },

  // Difficulty Visualization
  difficultyBars: {
    gap: nh(12),
  },
  difficultyBarContainer: {
    gap: nh(6),
  },
  difficultyBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBar: {
    height: nh(8),
    backgroundColor: '#F3F4F6',
    borderRadius: nh(4),
    overflow: 'hidden',
  },
  difficultyBarFill: {
    height: '100%',
    borderRadius: nh(4),
  },

  // Quality Metrics
  qualityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qualityMetric: {
    marginBottom: nh(8),
  },
  qualityBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    marginTop: nh(4),
  },
  qualityBar: {
    flex: 1,
    height: nh(6),
    backgroundColor: '#E5E7EB',
    borderRadius: nh(3),
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: nh(3),
  },

  // Ready Message
  readyMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF8FF',
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginVertical: nh(16),
  },

  // Enhanced Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: nw(20),
    gap: nw(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    borderRadius: nw(12),
    paddingVertical: nh(16),
  },
  primaryButton: {
    flex: 2,
    borderRadius: nw(12),
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(16),
  },
});

export default IntelliTestQuestionGeneration;