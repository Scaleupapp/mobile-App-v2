// =====================================================
// ENHANCED INTELLITEST ASSESSMENT SCREEN
// File: screens/IntelliTest/IntelliTestAssessment.js
// Features: Multi-format questions, robust error handling, improved UX
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
  Vibration,
  TextInput,
  Image,
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
  getCurrentIntelliTestQuestionApi,
  submitIntelliTestAnswerApi,
  navigateIntelliTestQuestionApi,
  pauseIntelliTestSessionApi,
  resumeIntelliTestSessionApi,
  endIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const IntelliTestAssessment = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  const {sessionId, examId, examName, config} = route.params || {};

  // Core State Management
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(config?.totalQuestions || 30);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(config?.timeLimit * 60 || 2700); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI State
  const [selectedOption, setSelectedOption] = useState(null);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [textualAnswer, setTextualAnswer] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [unansweredQuestionsCount, setUnansweredQuestionsCount] = useState(0);
  const [optionChangeCount, setOptionChangeCount] = useState(0);
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  // Animation References
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const questionTransitionAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const questionStartTime = useRef(Date.now());

  // Simple haptic feedback
  const triggerHaptic = () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  };

  // Timer Management
  useEffect(() => {
    if (!isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPaused, timeRemaining]);

  // Timer Visual Effects
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);
    
    // Start pulsing when under 5 minutes
    if (minutes < 5 && timeRemaining > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      timerPulseAnim.setValue(1);
    }
  }, [timeRemaining]);

  // Back Handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowExitModal(true);
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Load Initial Question
  useEffect(() => {
    if (sessionId) {
      loadCurrentQuestion();
    }
  }, [sessionId]);

  const loadCurrentQuestion = async (retryCount = 0, forceResume = false) => {
    try {
      setLoading(true);
      console.log('Loading question for sessionId:', sessionId, 'Retry count:', retryCount, 'Force resume:', forceResume);
      
      const response = await getCurrentIntelliTestQuestionApi(sessionId);
      console.log('Question API Response:', response.data);
      
      if (response.data?.success) {
        const responseData = response.data.data;
        const questionData = responseData.question; // Extract the nested question object
        const sessionProgress = responseData.sessionProgress;
        
        console.log('Question data received:', questionData);
        console.log('Session progress:', sessionProgress);
        
        if (!questionData) {
          throw new Error('No question data received');
        }

        setCurrentQuestion(questionData);
        setQuestionNumber(sessionProgress?.currentQuestionNumber || questionData.questionSequence || 1);
        setTotalQuestions(sessionProgress?.totalQuestions || totalQuestions);
        
        // Update timer from session progress if available
        if (sessionProgress?.sessionTimeRemaining) {
          setTimeRemaining(sessionProgress.sessionTimeRemaining);
        }
        
        // Reset question-specific state
        setSelectedOption(null);
        setNumericalAnswer('');
        setTextualAnswer('');
        setOptionChangeCount(0);
        questionStartTime.current = Date.now();
        
        // Animate question appearance
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } else {
        // Handle specific error for paused session
        if (response.data?.message?.includes('Session is not in progress') && 
            response.data?.message?.includes('paused')) {
          
          if (forceResume && retryCount < 5) {
            // If this is a force resume attempt, try calling resume again
            console.log('Session still paused during force resume, calling resume API again...');
            try {
              const resumeResponse = await resumeIntelliTestSessionApi({ sessionId });
              if (resumeResponse.data?.success) {
                setTimeout(() => {
                  loadCurrentQuestion(retryCount + 1, true);
                }, 2000); // Longer delay
                return;
              }
            } catch (resumeError) {
              console.error('Error during force resume:', resumeError);
            }
          } else if (retryCount < 8) {
            // Regular retry with longer delays
            const delay = Math.min(2000 + (retryCount * 1000), 8000); // Progressive delay up to 8 seconds
            console.log(`Session still paused, retrying in ${delay}ms...`);
            setTimeout(() => {
              loadCurrentQuestion(retryCount + 1, forceResume);
            }, delay);
            return;
          }
        }
        
        throw new Error(response.data?.message || 'Failed to load question - API returned unsuccessful');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      
      // If it's a session status error and we haven't retried too many times, try again
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('paused') && 
          retryCount < 8) {
        
        const delay = Math.min(2000 + (retryCount * 1000), 8000); // Progressive delay
        console.log(`Retrying due to session status error, attempt: ${retryCount + 1} in ${delay}ms`);
        
        setTimeout(() => {
          loadCurrentQuestion(retryCount + 1, forceResume);
        }, delay);
        return;
      }
      
      showToast({ 
        message: retryCount >= 8 
          ? 'Session resume failed. Please try starting the assessment again.' 
          : formatIntelliTestError(error) || 'Failed to load question', 
        type: 'error' 
      });
      
      // If all retries failed, go back to hub
      if (retryCount >= 8) {
        setTimeout(() => {
          navigation.navigate(Routes.IntelliTestHub);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = useCallback((optionId) => {
    triggerHaptic();
    
    if (selectedOption !== null) {
      setOptionChangeCount(prev => prev + 1);
    }
    
    setSelectedOption(optionId);
  }, [selectedOption]);

  const handleAnswerSubmit = async (autoSubmit = false) => {
    if (!currentQuestion) {
      showToast({ message: 'No question loaded', type: 'error' });
      return;
    }

    // Validate answer based on question type
    const questionType = currentQuestion.questionType || currentQuestion.type;
    
    if (!autoSubmit) {
      if (questionType === 'multiple_choice' && !selectedOption) {
        showToast({ message: 'Please select an answer', type: 'warning' });
        return;
      }
      if (questionType === 'numerical' && !numericalAnswer.trim()) {
        showToast({ message: 'Please enter a numerical answer', type: 'warning' });
        return;
      }
      if (questionType === 'textual' && !textualAnswer.trim()) {
        showToast({ message: 'Please enter your answer', type: 'warning' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
      
      const payload = {
        sessionId,
        questionId: currentQuestion.questionId || currentQuestion._id,
        selectedOption: selectedOption || null,
        numericalAnswer: numericalAnswer ? parseFloat(numericalAnswer) : null,
        textualAnswer: textualAnswer || null,
        confidenceLevel,
        timeSpent,
        optionChangeCount,
      };

      console.log('Submitting answer:', payload);
      const response = await submitIntelliTestAnswerApi(payload);
      console.log('Submit response:', response.data);
      
      if (response.data?.success) {
        // Store answer locally
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.questionId || currentQuestion._id]: {
            selectedOption,
            numericalAnswer,
            textualAnswer,
            timeSpent,
            isCorrect: response.data.data?.feedback?.isCorrect,
          }
        }));

        const responseData = response.data.data;
        
        // Handle session completion logic based on backend response
        if (responseData.sessionCompleted) {
          // Session was completed (all questions answered)
          handleEndAssessment();
        } else if (responseData.completionStatus?.suggestCompletion) {
          // Last question answered but some unanswered - show confirmation
          const unansweredCount = responseData.completionStatus.unansweredQuestions;
          setUnansweredQuestionsCount(unansweredCount);
          setShowFinishConfirmation(true);
        } else if (responseData.nextQuestion) {
          // Navigate to next question (regular flow or suggested unanswered question)
          const nextQuestionNum = responseData.nextQuestion.questionNumber || questionNumber + 1;
          await navigateToQuestion(nextQuestionNum);
        } else {
          // Fallback - shouldn't happen with proper backend logic
          if (questionNumber < totalQuestions) {
            await navigateToQuestion(questionNumber + 1);
          } else {
            handleEndAssessment();
          }
        }
      } else {
        throw new Error(response.data?.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      showToast({ message: formatIntelliTestError(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToQuestion = async (targetQuestionNumber) => {
    try {
      // Animate question transition
      Animated.timing(questionTransitionAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const response = await navigateIntelliTestQuestionApi({
        sessionId,
        questionNumber: targetQuestionNumber,
      });

      if (response.data?.success) {
        await loadCurrentQuestion();
        
        // Animate back
        Animated.timing(questionTransitionAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error navigating to question:', error);
      showToast({ message: formatIntelliTestError(error), type: 'error' });
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        // Resume the session
        const resumeResponse = await resumeIntelliTestSessionApi({ sessionId });
        console.log('Resume response:', resumeResponse.data);
        
        if (resumeResponse.data?.success) {
          setIsPaused(false);
          showToast({ message: 'Assessment resumed', type: 'success' });
          
          // Try immediate load first, then retry with longer delays if needed
          try {
            await loadCurrentQuestion(0, true); // Pass force resume flag
          } catch (error) {
            console.log('Immediate load failed, will retry with delays');
            // If immediate load fails, try with longer delays
            setTimeout(async () => {
              await loadCurrentQuestion(0, true);
            }, 2000); // Longer delay for backend DB consistency
          }
        } else {
          throw new Error(resumeResponse.data?.message || 'Failed to resume session');
        }
      } else {
        // Pause the session
        const pauseResponse = await pauseIntelliTestSessionApi({ sessionId, reason: 'user_requested' });
        console.log('Pause response:', pauseResponse.data);
        
        if (pauseResponse.data?.success) {
          setIsPaused(true);
          showToast({ message: 'Assessment paused', type: 'info' });
        } else {
          throw new Error(pauseResponse.data?.message || 'Failed to pause session');
        }
      }
    } catch (error) {
      console.error('Error pausing/resuming:', error);
      showToast({ message: formatIntelliTestError(error), type: 'error' });
    }
  };

  const handleTimeUp = async () => {
    try {
      await endIntelliTestSessionApi({ sessionId, reason: 'time_up' });
      navigation.replace(Routes.IntelliTestResults, { sessionId, examId, examName });
    } catch (error) {
      console.error('Error handling time up:', error);
      showToast({ message: 'Time up! Assessment ended.', type: 'warning' });
      navigation.replace(Routes.IntelliTestResults, { sessionId, examId, examName });
    }
  };

  const handleEndAssessment = async () => {
    try {
      await endIntelliTestSessionApi({ sessionId, reason: 'completed_manually' });
      navigation.replace(Routes.IntelliTestResults, { sessionId, examId, examName });
    } catch (error) {
      console.error('Error ending assessment:', error);
      showToast({ message: formatIntelliTestError(error), type: 'error' });
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Assessment',
      'Are you sure you want to exit? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: async () => {
            if (!isPaused) {
              await handlePauseResume();
            }
            navigation.goBack();
          }
        },
      ]
    );
  };

  // Timer Display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const minutes = Math.floor(timeRemaining / 60);
    if (minutes <= 2) return '#EF4444';
    if (minutes <= 5) return '#F59E0B';
    return '#10B981';
  };

  // Enhanced Question Content Renderer
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    return (
      <View style={styles.questionSection}>
        {/* Question Header Info */}
        {currentQuestion.subject && (
          <View style={styles.questionMeta}>
            <View style={styles.subjectTag}>
              <Text variant="medium10" color={COLORS.blue043142}>
                {currentQuestion.subject}
              </Text>
            </View>
            {currentQuestion.difficulty && (
              <View style={[styles.difficultyTag, { 
                backgroundColor: getDifficultyColor(currentQuestion.difficulty) + '15' 
              }]}>
                <Text variant="medium10" color={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Question Text */}
        <Text variant="bold18" color={COLORS.blue043142} style={styles.questionText}>
          {currentQuestion.questionText || currentQuestion.text || 'Question text not available'}
        </Text>

        {/* Question Images */}
        {renderQuestionImages()}

        {/* Question Formula/LaTeX */}
        {currentQuestion.formula && (
          <View style={styles.formulaContainer}>
            <Text variant="medium14" color={COLORS.grey777777} style={{marginBottom: nh(8)}}>
              Formula:
            </Text>
            <View style={styles.formulaBox}>
              <Text variant="medium16" color={COLORS.blue043142} style={styles.formulaText}>
                {currentQuestion.formula}
              </Text>
            </View>
          </View>
        )}

        {/* Additional Context */}
        {currentQuestion.context && (
          <View style={styles.contextContainer}>
            <Text variant="medium14" color={COLORS.grey777777} style={{marginBottom: nh(8)}}>
              Context:
            </Text>
            <Text variant="medium14" color={COLORS.grey666666}>
              {currentQuestion.context}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render question images with proper loading states
  const renderQuestionImages = () => {
    const images = currentQuestion.images || 
                  (currentQuestion.imageUrl ? [currentQuestion.imageUrl] : []) ||
                  (currentQuestion.image ? [currentQuestion.image] : []);

    if (!images.length) return null;

    return (
      <View style={styles.imagesContainer}>
        {images.map((imageUrl, index) => (
          <View key={index} style={styles.imageWrapper}>
            {imageLoadingStates[imageUrl] && (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="small" color={COLORS.blue043142} />
              </View>
            )}
            <Image
              source={{ uri: imageUrl }}
              style={styles.questionImage}
              onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [imageUrl]: true }))}
              onLoadEnd={() => setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }))}
              onError={() => {
                setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }));
                console.error('Failed to load image:', imageUrl);
              }}
              resizeMode="contain"
            />
          </View>
        ))}
      </View>
    );
  };

  // Enhanced Answer Options Renderer
  const renderAnswerOptions = () => {
    const questionType = currentQuestion.questionType || currentQuestion.type;

    switch (questionType) {
      case 'multiple_choice':
        return renderMultipleChoiceOptions();
      case 'numerical':
        return renderNumericalInput();
      case 'textual':
      case 'text':
        return renderTextualInput();
      case 'true_false':
        return renderTrueFalseOptions();
      default:
        return renderMultipleChoiceOptions(); // fallback
    }
  };

  const renderMultipleChoiceOptions = () => {
    const options = currentQuestion.options || currentQuestion.choices || [];
    
    // Handle different option formats
    let optionsArray = [];
    
    if (Array.isArray(options)) {
      // Already an array
      optionsArray = options;
    } else if (typeof options === 'object') {
      // Convert object format {A: "text", B: "text"} to array
      optionsArray = Object.entries(options).map(([key, value]) => ({
        optionId: key,
        optionText: value,
        id: key,
        text: value
      }));
    }
    
    console.log('Processed options:', optionsArray);
    
    if (!optionsArray.length) {
      return (
        <View style={styles.noOptionsContainer}>
          <Text variant="medium14" color={COLORS.grey777777}>
            No options available for this question
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.optionsSection}>
        {optionsArray.map((option, index) => {
          const optionId = option.optionId || option.id || String.fromCharCode(65 + index);
          const optionText = option.optionText || option.text || option.content || option;
          const isSelected = selectedOption === optionId;
          
          return (
            <TouchableOpacity
              key={optionId}
              style={[styles.optionCard, isSelected && styles.selectedOption]}
              onPress={() => handleOptionSelect(optionId)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionCircle, isSelected && styles.selectedCircle]}>
                <Text variant="bold14" color={isSelected ? COLORS.whiteFFFFFF : COLORS.grey777777}>
                  {optionId}
                </Text>
              </View>
              <View style={styles.optionContent}>
                <Text 
                  variant="medium16" 
                  color={isSelected ? COLORS.blue043142 : COLORS.grey777777}
                  style={styles.optionText}
                >
                  {optionText}
                </Text>
                {option.image && (
                  <Image
                    source={{ uri: option.image }}
                    style={styles.optionImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderNumericalInput = () => (
    <View style={styles.numericalSection}>
      <Text variant="medium14" color={COLORS.grey777777} style={{marginBottom: nh(8)}}>
        Enter your numerical answer:
      </Text>
      <View style={styles.numericalInput}>
        <TextInput
          style={styles.numericalField}
          value={numericalAnswer}
          onChangeText={setNumericalAnswer}
          placeholder="Enter number..."
          keyboardType="numeric"
          placeholderTextColor={COLORS.grey777777}
          autoCorrect={false}
        />
      </View>
      {currentQuestion.unit && (
        <Text variant="medium12" color={COLORS.grey777777} style={{marginTop: nh(4)}}>
          Unit: {currentQuestion.unit}
        </Text>
      )}
    </View>
  );

  const renderTextualInput = () => (
    <View style={styles.textualSection}>
      <Text variant="medium14" color={COLORS.grey777777} style={{marginBottom: nh(8)}}>
        Enter your answer:
      </Text>
      <View style={styles.textualInput}>
        <TextInput
          style={styles.textualField}
          value={textualAnswer}
          onChangeText={setTextualAnswer}
          placeholder="Type your answer here..."
          placeholderTextColor={COLORS.grey777777}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCorrect={true}
        />
      </View>
      <Text variant="medium12" color={COLORS.grey777777} style={{marginTop: nh(4)}}>
        {textualAnswer.length} characters
      </Text>
    </View>
  );

  const renderTrueFalseOptions = () => (
    <View style={styles.optionsSection}>
      {['True', 'False'].map((option) => {
        const isSelected = selectedOption === option;
        
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionCard, isSelected && styles.selectedOption]}
            onPress={() => handleOptionSelect(option)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionCircle, isSelected && styles.selectedCircle]}>
              <Icon 
                name={option === 'True' ? 'check' : 'close'} 
                size={nw(20)} 
                color={isSelected ? COLORS.whiteFFFFFF : COLORS.grey777777} 
              />
            </View>
            <Text 
              variant="medium16" 
              color={isSelected ? COLORS.blue043142 : COLORS.grey777777}
              style={styles.optionText}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Helper function for difficulty colors
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Helper function to find first unanswered question
  const findFirstUnansweredQuestion = () => {
    for (let i = 1; i <= totalQuestions; i++) {
      if (!answers[`question_${i}`] && i !== questionNumber) {
        return i;
      }
    }
    return 1; // fallback to first question
  };

  // Question Palette
  const renderQuestionPalette = () => (
    <Modal
      visible={showQuestionPalette}
      transparent
      animationType="slide"
      onRequestClose={() => setShowQuestionPalette(false)}
    >
      <View style={styles.paletteOverlay}>
        <View style={styles.paletteContainer}>
          <View style={styles.paletteHeader}>
            <Text variant="bold18" color={COLORS.blue043142}>Question Navigator</Text>
            <TouchableOpacity onPress={() => setShowQuestionPalette(false)}>
              <Icon name="close" size={nw(24)} color={COLORS.grey777777} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.paletteGrid}>
            <View style={styles.paletteNumbers}>
              {Array.from({ length: totalQuestions }, (_, index) => {
                const qNum = index + 1;
                const isAnswered = answers[`question_${qNum}`] || Object.keys(answers).length > index;
                const isCurrent = qNum === questionNumber;
                
                return (
                  <TouchableOpacity
                    key={qNum}
                    style={[
                      styles.paletteNumber,
                      isCurrent && styles.paletteNumberCurrent,
                      isAnswered && styles.paletteNumberAnswered,
                    ]}
                    onPress={() => {
                      setShowQuestionPalette(false);
                      if (qNum !== questionNumber) {
                        navigateToQuestion(qNum);
                      }
                    }}
                  >
                    <Text 
                      variant="bold14" 
                      color={isCurrent ? COLORS.whiteFFFFFF : isAnswered ? '#10B981' : COLORS.grey777777}
                    >
                      {qNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={styles.paletteLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#FFC700'}]} />
              <Text variant="medium12" color={COLORS.grey777777}>Current</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#10B981'}]} />
              <Text variant="medium12" color={COLORS.grey777777}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#E5E7EB'}]} />
              <Text variant="medium12" color={COLORS.grey777777}>Not Visited</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Finish Confirmation Modal
  const renderFinishConfirmationModal = () => (
    <Modal
      visible={showFinishConfirmation}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFinishConfirmation(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.finishModal}>
          <Icon name="warning" size={nw(48)} color="#F59E0B" />
          <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(16), textAlign: 'center'}}>
            Finish Assessment?
          </Text>
          <Text variant="medium16" color={COLORS.grey777777} style={{marginTop: nh(8), textAlign: 'center'}}>
            You have {unansweredQuestionsCount} unanswered question{unansweredQuestionsCount > 1 ? 's' : ''}.
          </Text>
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(4), textAlign: 'center'}}>
            Do you want to continue answering or finish the assessment now?
          </Text>
          
          <View style={styles.finishActions}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowFinishConfirmation(false);
                // Navigate to first unanswered question
                const firstUnanswered = findFirstUnansweredQuestion();
                if (firstUnanswered > 0) {
                  navigateToQuestion(firstUnanswered);
                }
              }}
            >
              <Text variant="bold16" color={COLORS.blue043142}>Continue Answering</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.finishNowButton}
              onPress={() => {
                setShowFinishConfirmation(false);
                handleEndAssessment();
              }}
            >
              <Text variant="bold16" color={COLORS.whiteFFFFFF}>Finish Now</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryInfo}>
            <View style={styles.summaryRow}>
              <Text variant="medium12" color={COLORS.grey777777}>Answered:</Text>
              <Text variant="bold12" color={COLORS.blue043142}>
                {Object.keys(answers).length + 1} / {totalQuestions}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="medium12" color={COLORS.grey777777}>Remaining:</Text>
              <Text variant="bold12" color="#EF4444">
                {unansweredQuestionsCount}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Exit Modal
  const renderExitModal = () => (
    <Modal
      visible={showExitModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowExitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.exitModal}>
          <Icon name="warning" size={nw(48)} color="#F59E0B" />
          <Text variant="bold20" color={COLORS.blue043142} style={{marginTop: nh(16), textAlign: 'center'}}>
            Exit Assessment?
          </Text>
          <Text variant="medium16" color={COLORS.grey777777} style={{marginTop: nh(8), textAlign: 'center'}}>
            Your progress will be saved and you can resume later.
          </Text>
          
          <View style={styles.exitActions}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => setShowExitModal(false)}
            >
              <Text variant="bold16" color={COLORS.grey777777}>Continue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.confirmExitButton}
              onPress={handleExit}
            >
              <Text variant="bold16" color="#EF4444">Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium16" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
            Loading question...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
        <View style={styles.loadingContainer}>
          <Icon name="error" size={nw(48)} color="#EF4444" />
          <Text variant="medium16" color="#EF4444" style={{marginTop: nh(16), textAlign: 'center'}}>
            Failed to load question
          </Text>
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(8), textAlign: 'center'}}>
            Session ID: {sessionId || 'Not provided'}
          </Text>
          <TouchableOpacity onPress={loadCurrentQuestion} style={styles.retryButton}>
            <Text variant="bold14" color={COLORS.blue043142}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitButtonAlt}>
            <Text variant="bold14" color="#EF4444">Exit Assessment</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />
      
      {/* Custom Header */}
      <View style={styles.assessmentHeader}>
        <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.exitHeaderButton}>
          <Icon name="close" size={nw(24)} color={COLORS.grey777777} />
        </TouchableOpacity>
        
        <View style={styles.progressSection}>
          <Text variant="medium14" color={COLORS.grey777777}>
            {questionNumber} of {totalQuestions}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(questionNumber / totalQuestions) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: timerPulseAnim }] }]}>
          <Icon name="timer" size={nw(18)} color={getTimerColor()} />
          <Text variant="bold14" color={getTimerColor()} style={{marginLeft: nw(4)}}>
            {formatTime(timeRemaining)}
          </Text>
        </Animated.View>
      </View>

      {/* Question Content */}
      <Animated.View 
        style={[
          styles.questionContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: questionTransitionAnim }]
          }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderQuestionContent()}
          {renderAnswerOptions()}
        </ScrollView>
      </Animated.View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowQuestionPalette(true)}
          >
            <Icon name="grid-view" size={nw(20)} color={COLORS.blue043142} />
            <Text variant="medium14" color={COLORS.blue043142} style={{marginLeft: nw(6)}}>
              Questions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePauseResume}
            disabled={isSubmitting}
          >
            <Icon name={isPaused ? "play-arrow" : "pause"} size={nw(20)} color={COLORS.blue043142} />
            <Text variant="medium14" color={COLORS.blue043142} style={{marginLeft: nw(6)}}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationRow}>
          {questionNumber > 1 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateToQuestion(questionNumber - 1)}
              disabled={isSubmitting}
            >
              <Icon name="arrow-back" size={nw(20)} color={COLORS.blue043142} />
              <Text variant="medium14" color={COLORS.blue043142}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleAnswerSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#E5E7EB', '#D1D5DB'] : ['#FFC700', '#FFB700']}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.grey777777} />
              ) : (
                <>
                  <Text variant="bold16" color={COLORS.blue043142}>
                    {questionNumber === totalQuestions ? 'Finish' : 'Next'}
                  </Text>
                  {questionNumber < totalQuestions && (
                    <Icon name="arrow-forward" size={nw(20)} color={COLORS.blue043142} style={{marginLeft: nw(8)}} />
                  )}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {renderQuestionPalette()}
      {renderExitModal()}
      {renderFinishConfirmationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: nw(32),
  },
  retryButton: {
    marginTop: nh(16),
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  exitButtonAlt: {
    marginTop: nh(8),
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    backgroundColor: '#FEE2E2',
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: '#EF4444',
  },

  // Header
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(20),
    paddingVertical: nh(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exitHeaderButton: {
    padding: nw(8),
  },
  progressSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: nw(20),
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: nh(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC700',
    borderRadius: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
  },

  // Question Content
  questionContainer: {
    flex: 1,
    padding: nw(20),
  },
  questionSection: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(20),
    marginBottom: nh(20),
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
  questionMeta: {
    flexDirection: 'row',
    marginBottom: nh(12),
    gap: nw(8),
  },
  subjectTag: {
    backgroundColor: COLORS.blue043142 + '15',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(12),
  },
  difficultyTag: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(12),
  },
  questionText: {
    lineHeight: 28,
    marginBottom: nh(16),
  },
  
  // Images
  imagesContainer: {
    marginVertical: nh(16),
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: nh(12),
  },
  questionImage: {
    width: '100%',
    height: nh(200),
    borderRadius: nw(8),
    backgroundColor: '#F8FAFC',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: nw(8),
    zIndex: 1,
  },
  
  // Formula
  formulaContainer: {
    marginVertical: nh(16),
  },
  formulaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: nw(8),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formulaText: {
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  
  // Context
  contextContainer: {
    marginVertical: nh(16),
    padding: nw(16),
    backgroundColor: '#FEF3C7',
    borderRadius: nw(8),
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },

  // Options
  optionsSection: {
    gap: nh(12),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedOption: {
    borderColor: '#FFC700',
    borderWidth: 2,
    backgroundColor: '#FFFEF7',
  },
  optionCircle: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
    marginTop: nh(2),
  },
  selectedCircle: {
    backgroundColor: '#FFC700',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    lineHeight: 24,
  },
  optionImage: {
    width: '100%',
    height: nh(100),
    marginTop: nh(8),
    borderRadius: nw(8),
  },
  noOptionsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Numerical Input
  numericalSection: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  numericalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: nw(8),
    overflow: 'hidden',
  },
  numericalField: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    fontSize: 16,
    color: COLORS.blue043142,
  },

  // Textual Input
  textualSection: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textualInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: nw(8),
    overflow: 'hidden',
  },
  textualField: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    fontSize: 16,
    color: COLORS.blue043142,
    minHeight: nh(100),
  },

  // Bottom Controls
  bottomControls: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(20),
    paddingVertical: nh(16),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(12),
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    backgroundColor: '#F8FAFC',
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: '#F8FAFC',
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  submitButton: {
    flex: 1,
    marginLeft: nw(12),
    borderRadius: nw(12),
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: nh(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Question Palette Modal
  paletteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  paletteContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    maxHeight: screenHeight * 0.7,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paletteGrid: {
    maxHeight: screenHeight * 0.4,
  },
  paletteNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: nw(20),
    gap: nw(12),
  },
  paletteNumber: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paletteNumberCurrent: {
    backgroundColor: '#FFC700',
    borderColor: '#FFC700',
  },
  paletteNumberAnswered: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  paletteLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(20),
    gap: nw(20),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    marginRight: nw(6),
  },

  // Finish Confirmation Modal
  finishModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    padding: nw(24),
    alignItems: 'center',
    marginHorizontal: nw(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  finishActions: {
    flexDirection: 'row',
    marginTop: nh(24),
    gap: nw(12),
  },
  continueButton: {
    flex: 1,
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    borderWidth: 2,
    borderColor: COLORS.blue043142,
    alignItems: 'center',
  },
  finishNowButton: {
    flex: 1,
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    alignItems: 'center',
  },
  summaryInfo: {
    marginTop: nh(16),
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: nw(8),
    padding: nw(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(4),
  },

  // Exit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    padding: nw(24),
    alignItems: 'center',
    marginHorizontal: nw(20),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  exitActions: {
    flexDirection: 'row',
    marginTop: nh(24),
    gap: nw(12),
  },
  exitButton: {
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    backgroundColor: '#F3F4F6',
    borderRadius: nw(8),
  },
  confirmExitButton: {
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    backgroundColor: '#FEE2E2',
    borderRadius: nw(8),
  },
});

export default IntelliTestAssessment;