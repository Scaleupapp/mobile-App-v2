import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  UIManager,
  Platform,
  LayoutAnimation,
} from 'react-native';
import {
  getNextQuestionApi,
  submitAnswerApi,
  getDetailedResultsApi,
} from '../../services/apiService'; // Assuming apiService is correctly set up
import {useToast} from '../../components/CustomToast'; // Assuming CustomToast is correctly set up
import {COLORS} from '../../helper/colors'; // Using your provided COLORS
import {nh, nw} from '../../helper/scales'; // Assuming scales are correctly set up

const {width, height} = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QuizScreen = ({navigation, route}) => {
  const {quizId, attemptId} = route.params;
  const {showToast} = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [timer, setTimer] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountdownVisible, setCountdownVisible] = useState(true);
  const [countdownValue, setCountdownValue] = useState(5);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [showTimesUpMessage, setShowTimesUpMessage] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownScaleAnim = useRef(new Animated.Value(0.5)).current;
  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const optionPressAnim = useRef(new Animated.Value(1)).current; // For option press scale effect
  const intervalRef = useRef(null); // For countdown interval
  const timerIntervalRef = useRef(null); // For question timer interval


  useEffect(() => {
    startCountdownBeforeQuiz();
    return () => { // Cleanup intervals on unmount
      clearInterval(intervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Strictly disable back button functionality during the quiz
    const backAction = () => {
      return true; // Prevents default back action and does nothing else
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove(); // Cleanup listener on unmount
  }, []);


  useEffect(() => {
    if (isCountdownVisible && countdownValue > 0) { // Animate only when countdown is active
      countdownScaleAnim.setValue(0.8); // Start smaller for a pop-in effect
      Animated.spring(countdownScaleAnim, { // Using spring for a bouncier feel
        toValue: 1,
        friction: 3, // Adjust for more or less bounce
        tension: 100, // Adjust for speed/energy
        useNativeDriver: true,
      }).start();
    }
  }, [countdownValue, isCountdownVisible]);


  const startCountdownBeforeQuiz = () => {
    let countdown = 5;
    setCountdownValue(countdown);
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        setCountdownValue(countdown);
      } else {
        clearInterval(countdownInterval);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCountdownVisible(false);
        loadNextQuestion();
      }
    }, 1000);
    intervalRef.current = countdownInterval;
  };

  const loadNextQuestion = async () => {
    setShowTimesUpMessage(false);
    try {
      setLoadingQuestion(true);
      setSelectedOption(null);
      fadeAnim.setValue(0);

      const response = await getNextQuestionApi(attemptId);
      
      if (response.data.finished || currentQuestionNumber >= 10) {
        setLoadingQuestion(false);
        await showFinalResults();
        return;
      }

      const question = response.data.question;

      if (seenQuestions.includes(question.questionId)) {
        // Silently try to load another question if it's a duplicate.
        // If the API consistently sends duplicates, the error handling below or timeouts will eventually trigger.
        await loadNextQuestion();
        return;
      }
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSeenQuestions(prev => [...prev, question.questionId]);
      setCurrentQuestion(question);
      setCurrentQuestionNumber(prev => prev + 1);
      setTimer(15);
      timerBarAnim.setValue(1);
      setLoadingQuestion(false);
      startQuestionTimer();
      fadeInQuestion();

    } catch (error) {
      setLoadingQuestion(false);
      showToast('Error loading question', 'error');
      Alert.alert(
        'Quiz Error',
        'There was a problem loading the next question. Please check your connection and try again.',
        [{text: 'Go Back', onPress: () => navigation.goBack()}, {text: 'Retry', onPress: () => loadNextQuestion()}],
        {cancelable: false}
      );
    }
  };

  const handleTimeUpNext = () => {
    submitSkippedAnswer();
  };

  const submitSkippedAnswer = async () => {
    if (!currentQuestion) return;

    clearInterval(timerIntervalRef.current);
    setIsSubmitting(true);
    try {
      await submitAnswerApi(quizId, attemptId, {
        questionId: currentQuestion.questionId,
        selectedOption: 'skip',
        timeTaken: 15.00,
      });
    } catch (error) {
      showToast('Error submitting skipped answer', 'error');
    } finally {
      setIsSubmitting(false);
      loadNextQuestion();
    }
  };

  const fadeInQuestion = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400, // Slightly faster fade-in
      useNativeDriver: true,
    }).start();
  };

  const startQuestionTimer = () => {
    clearInterval(timerIntervalRef.current);
    setTimer(15);
    timerBarAnim.setValue(1);
    const startTime = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const remainingTime = Math.max(15 - elapsedTime, 0);
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
      setTimer(parseFloat(remainingTime.toFixed(2)));

      Animated.timing(timerBarAnim, {
        toValue: remainingTime / 15,
        duration: 100,
        useNativeDriver: false, 
      }).start();

      if (remainingTime <= 0) {
        clearInterval(timerIntervalRef.current);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTimer(0); // Ensure timer is exactly 0 for conditional rendering
        setShowTimesUpMessage(true);
        setSelectedOption(null);
      }
    }, 100);
  };

  const getOptionLetter = (options, selectedOptionValue) => {
    const index = options.findIndex(opt => opt === selectedOptionValue);
    if (index === -1) return 'skip';
    return String.fromCharCode(65 + index);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || isSubmitting || !currentQuestion) return;

    clearInterval(timerIntervalRef.current);
    setIsSubmitting(true);

    try {
      const optionToSubmit = getOptionLetter(currentQuestion.options, selectedOption);
      const timeTaken = parseFloat((15 - timer).toFixed(2));

      await submitAnswerApi(quizId, attemptId, {
        questionId: currentQuestion.questionId,
        selectedOption: optionToSubmit,
        timeTaken: Math.max(0.01, timeTaken), // Ensure time taken is at least minimal positive
      });
    } catch (error) {
      showToast('Error submitting answer', 'error');
    } finally {
      setIsSubmitting(false);
      loadNextQuestion();
    }
  };

  const showFinalResults = async () => {
    clearInterval(intervalRef.current);
    clearInterval(timerIntervalRef.current);
    try {
      const response = await getDetailedResultsApi(quizId, attemptId);
      const {totalScore, finalRank} = response.data;
      Alert.alert(
        'Quiz Completed!',
        `Amazing effort!\n\nYour Score: ${totalScore}\nProvisional Rank: ${finalRank}\n\nFinal rankings will be available after the quiz period ends.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
        {cancelable: false},
      );
    } catch (error) {
      showToast('Error fetching final results', 'error');
      Alert.alert(
        'Results Error',
        'Could not fetch your final results at this time.',
        [{text: 'OK', onPress: () => navigation.goBack()}],
        {cancelable: false},
      );
    }
  };

  const handleOptionPress = (option) => {
    if (timer > 0 && !showTimesUpMessage) { // Ensure options can only be pressed if time is running
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedOption(option);
      optionPressAnim.setValue(0.97); // Start slightly smaller
      Animated.spring(optionPressAnim, { // Spring animation for a nice physical feel
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const QuizProgressBar = () => (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[styles.progressBarFill, { width: `${Math.min(100, (currentQuestionNumber / 10) * 100)}%` }]} />
    </View>
  );

  const VisualTimerBar = () => (
    <View style={styles.visualTimerContainer}>
      <Animated.View 
        style={[
            styles.visualTimerFill, 
            { flexBasis: timerBarAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
            }) }
        ]} 
      />
    </View>
  );

  const renderQuestion = () => {
    if (!currentQuestion) {
      return <ActivityIndicator size="large" color={COLORS.yellowF5BE00} style={{marginTop: 20}} />;
    }
    return (
      <Animated.View style={[styles.questionCard, {opacity: fadeAnim}]}>
        <QuizProgressBar />
        <View style={styles.questionHeader}>
          <RNText style={styles.questionNumberText}>
            Question {currentQuestionNumber}
            <RNText style={styles.questionTotalText}>/10</RNText>
          </RNText>
        </View>

        <View style={styles.questionTitleContainer}>
          <RNText style={styles.questionText}>
            {currentQuestion.questionText}
          </RNText>
        </View>

        {showTimesUpMessage && (
          <RNText style={styles.timesUpText}>Time's Up!</RNText>
        )}

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isDisabled = timer === 0 || showTimesUpMessage;
            return (
              <Animated.View 
                key={index} 
                // Apply press animation only if the option is the one being pressed
                style={{ transform: [{ scale: (isSelected && !isDisabled) ? optionPressAnim : 1 }] }}
              >
                <Pressable
                  style={({pressed}) => [
                    styles.optionButton,
                    isSelected && !isDisabled && styles.selectedOptionButton, // Apply selected style only if not disabled
                    isDisabled && styles.disabledOptionButton,
                    {
                      backgroundColor: isSelected && !isDisabled
                        ? COLORS.yellowF5BE00
                        : isDisabled 
                            ? COLORS.greyD6D6D6 // Disabled background
                            : COLORS.blue043142, // Default background
                      transform: [{scale: pressed && !isDisabled ? 0.98 : 1}] // Press feedback only if not disabled
                    },
                  ]}
                  disabled={isDisabled}
                  onPress={() => handleOptionPress(option)}>
                  <RNText style={[
                      styles.optionText, 
                      isSelected && !isDisabled && styles.selectedOptionText,
                      isDisabled && styles.disabledOptionText,
                    ]}>
                      {String.fromCharCode(65 + index)}. {option}
                  </RNText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.timerActionContainer}>
          <View style={styles.timerDisplay}>
            <RNText style={styles.timerText}>
              {Math.floor(timer)}
              <RNText style={styles.timerSecondsSuffix}>s</RNText>
            </RNText>
            <VisualTimerBar />
          </View>

          {(timer === 0 || showTimesUpMessage) ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.nextButton]}
              onPress={handleTimeUpNext}
              activeOpacity={0.7}>
              <RNText style={[styles.actionButtonText, styles.nextButtonText]}>Next Question</RNText>
            </TouchableOpacity>
          ) : selectedOption != null ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.submitButton,
                isSubmitting && styles.disabledButtonOpacity,
              ]}
              onPress={handleSubmitAnswer}
              disabled={isSubmitting}
              activeOpacity={0.7}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.blue043142} />
              ) : (
                <RNText style={[styles.actionButtonText, styles.submitButtonText]}>Submit</RNText>
              )}
            </TouchableOpacity>
          ) : (
            // Placeholder to maintain layout consistency when no button is shown (i.e., option not selected yet)
            <View style={styles.placeholderButton} /> 
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Modal visible={isCountdownVisible} transparent animationType="fade">
        <View style={countdownStyles.overlay}>
          <Animated.Text style={[countdownStyles.countdownText, {transform: [{scale: countdownScaleAnim}]}]}>
            {countdownValue}
          </Animated.Text>
        </View>
      </Modal>

      {loadingQuestion && !currentQuestion ? (
         <View style={styles.fullScreenLoaderContainer}>
            <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
            <RNText style={styles.loadingText}>Loading Quiz...</RNText>
         </View>
      ) : loadingQuestion && currentQuestion ? ( 
        <View style={styles.questionCard}> 
            <ActivityIndicator size="large" color={COLORS.yellowF5BE00} style={{marginVertical: nh(50)}}/>
            <RNText style={[styles.loadingText, {color: COLORS.blue043142}]}>Loading next question...</RNText>
        </View>
      ) : (
        renderQuestion()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue043142,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(10), // Horizontal padding for the screen
    paddingVertical: nh(20),   // Vertical padding for the screen
  },
  fullScreenLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142, // Match screen background
  },
  loadingText: {
    marginTop: nh(15),
    fontSize: nw(18),
    color: COLORS.whiteFFFFFF,
    fontWeight: '600',
  },
  questionCard: {
    width: width * 0.95,
    maxWidth: 450, // Max width for larger screens
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 25, // More pronounced rounding
    padding: nw(18), // Increased padding inside card
    paddingBottom: nh(25),
    shadowColor: COLORS.black333333, // Using black for shadow
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15, // Softer shadow
    shadowRadius: 12,
    elevation: 8, // Elevation for Android
    alignItems: 'center',
    overflow: 'visible', // Can be visible if animations/shadows need it, but progress bar implies hidden
  },
  progressBarContainer: {
    height: nh(8), // Thicker progress bar
    width: '100%',
    backgroundColor: COLORS.greyD6D6D6, // Lighter grey for progress bar background
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 25, // Match card radius
    borderTopRightRadius: 25, // Match card radius
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: 4,
  },
  questionHeader: {
    marginTop: nh(20), // Adjusted for thicker progress bar
    marginBottom: nh(15),
    alignSelf: 'flex-end',
  },
  questionNumberText: {
    fontSize: nw(15),
    color: COLORS.grey777777,
    fontWeight: 'bold',
  },
  questionTotalText: {
    fontSize: nw(15),
    color: COLORS.greyBBBBBB,
  },
  questionTitleContainer: {
    marginBottom: nh(25),
    backgroundColor: COLORS.blue043142, // Dark blue background
    paddingVertical: nh(18),
    paddingHorizontal: nw(12),
    borderRadius: 15, // Rounded corners for this container
    width: '100%',
    minHeight: nh(90),
    justifyContent: 'center',
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionText: {
    fontSize: nw(17),
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.whiteFFFFFF, // White text on dark blue
    lineHeight: nw(25),
  },
  optionsContainer: {
    width: '100%',
    marginBottom: nh(20),
  },
  optionButton: {
    width: '100%',
    paddingVertical: nh(15), // More padding
    paddingHorizontal: nw(12),
    marginVertical: nh(7), // Slightly more margin
    borderRadius: 12,
    alignItems: 'flex-start',
    borderWidth: 1.5, // Default border width
    borderColor: COLORS.blue043142, // Default border color matches option bg
  },
  selectedOptionButton: {
    backgroundColor: COLORS.yellowF5BE00, // Yellow background when selected
    borderColor: COLORS.yellowF5BE00, // Yellow border when selected
    borderWidth: 2, // Thicker border
  },
  disabledOptionButton: {
    backgroundColor: COLORS.greyD6D6D6, // Light grey background for disabled
    borderColor: COLORS.greyBBBBBB, // Slightly darker grey border for disabled
    opacity: 0.7,
  },
  optionText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(15.5), // Slightly larger option text
    fontWeight: '500',
  },
  selectedOptionText: {
    color: COLORS.blue043142, // Dark text on yellow background
    fontWeight: 'bold',
  },
  disabledOptionText: {
    color: COLORS.grey777777, // Grey text for disabled options
  },
  timesUpText: {
    fontSize: nw(20), // Larger "Time's Up"
    fontWeight: 'bold',
    color: COLORS.redEA4335, // Using user's red
    marginBottom: nh(12),
    textAlign: 'center',
  },
  timerActionContainer: {
    width: '100%',
    marginTop: nh(10),
    alignItems: 'center',
  },
  timerDisplay: {
    marginBottom: nh(20),
    alignItems: 'center',
  },
  timerText: {
    fontSize: nw(30),
    fontWeight: 'bold',
    color: COLORS.blue043142,
  },
  timerSecondsSuffix: {
    fontSize: nw(18),
    fontWeight: '500', // Medium weight for 's'
    color: COLORS.grey777777,
  },
  visualTimerContainer: {
    height: nh(10), // Thicker timer bar
    width: width * 0.7,
    maxWidth: 280,
    backgroundColor: COLORS.greyD6D6D6,
    borderRadius: 5,
    marginTop: nh(10),
    overflow: 'hidden',
    flexDirection: 'row',
  },
  visualTimerFill: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: 5,
  },
  actionButton: {
    width: '100%', // Full width buttons relative to their container
    paddingVertical: nh(15),
    borderRadius: 30, // Fully rounded ends
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: nh(52),
    elevation: 2,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButton: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  nextButton: {
    backgroundColor: COLORS.blue043142,
  },
  actionButtonText: {
    fontSize: nw(16.5),
    fontWeight: 'bold',
    letterSpacing: 0.5, // Add some letter spacing
  },
  submitButtonText: {
    color: COLORS.blue043142,
  },
  nextButtonText: {
    color: COLORS.whiteFFFFFF,
  },
  disabledButtonOpacity: { // For submit button loading state
    opacity: 0.7,
  },
  placeholderButton: { 
    height: nh(52), // Match actionButton minHeight
    width: '100%',
  },
});

const countdownStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 49, 66, 0.92)', // Using COLORS.blue043142 with alpha
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: nw(100), // Massive countdown text
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
    textShadowColor: COLORS.yellowF5BE00, // Shadow using quiz yellow
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 15, // More pronounced glow
  },
});

export default QuizScreen;