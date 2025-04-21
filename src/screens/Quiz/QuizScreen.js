import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text as RNText, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { 
  getNextQuestionApi, 
  submitAnswerApi, 
  getDetailedResultsApi 
} from '../../services/apiService';
import { useToast } from '../../components/CustomToast';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';

const { width } = Dimensions.get('window');

const QuizScreen = ({ navigation, route }) => {
  const { quizId, attemptId } = route.params;
  const { showToast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [timer, setTimer] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountdownVisible, setCountdownVisible] = useState(true);
  const [countdownValue, setCountdownValue] = useState(5);
  const [seenQuestions, setSeenQuestions] = useState([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    startCountdownBeforeQuiz();
    return () => clearInterval(intervalRef.current);
  }, []);


  

  const startCountdownBeforeQuiz = () => {
    let countdown = 5;
    const countdownInterval = setInterval(() => {
      if (countdown > 0) {
        setCountdownValue(countdown);
        countdown--;
      } else {
        clearInterval(countdownInterval);
        setCountdownVisible(false);
        loadNextQuestion();
      }
    }, 1000);
  };

  const loadNextQuestion = async () => {
    try {
      setLoadingQuestion(true);
      const response = await getNextQuestionApi(attemptId);
      setLoadingQuestion(false);
  
      if (response.data.finished) {
        await showFinalResults();
        return; // Exit the method if quiz is finished
      }
  
      const question = response.data.question;
      console.log('Received Question:', question);
  
      // Increment question number
      setCurrentQuestionNumber(prev => prev + 1);
  
      // Check if we've reached the maximum number of questions (10)
      if (currentQuestionNumber >= 10) {
        await showFinalResults();
        return;
      }
  
      // Prevent duplicate questions more robustly
      if (seenQuestions.includes(question.questionId)) {
        console.warn(`Duplicate question detected: ${question.questionText}`);
        
        // Attempt to load another question
        await loadNextQuestion();
        return;
      }
  
      setSeenQuestions((prev) => [...prev, question.questionId]);
      setCurrentQuestion(question);
      setSelectedOption(null);
      setTimer(15);
      startQuestionTimer();
      fadeInQuestion();
  
    } catch (error) {
      setLoadingQuestion(false);
      showToast('Error loading question');
      console.error('Error fetching question:', error);
  
      // Optionally show an alert or handle the error more gracefully
      Alert.alert(
        'Quiz Error',
        'There was a problem loading the next question. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };
  
  const handleNextQuestion = () => {
    // If no option was selected when time runs out, submit a 'skip' answer
    if (selectedOption === null) {
      submitSkippedAnswer();
    } else {
      loadNextQuestion();
    }
  };
  
  const submitSkippedAnswer = async () => {
    try {
      clearInterval(intervalRef.current);
      setIsSubmitting(true);
  
      await submitAnswerApi(quizId, attemptId, {
        questionId: currentQuestion.questionId,
        selectedOption: 'skip',
        timeTaken: 15
      });
  
      setIsSubmitting(false);
      loadNextQuestion();
    } catch (error) {
      setIsSubmitting(false);
      showToast('Error submitting skipped answer');
      console.error('Error submitting skipped answer:', error);
    }
  };

  const fadeInQuestion = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const startQuestionTimer = () => {
    clearInterval(intervalRef.current);
    const startTime = Date.now();
    setTimer(15);
    intervalRef.current = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const remainingTime = Math.max(15 - elapsedTime, 0);
      
      setTimer(parseFloat(remainingTime.toFixed(2)));
      
      if (remainingTime <= 0) {
        clearInterval(intervalRef.current);
        setTimer(0);
      }
    }, 10);
  };

  const getOptionLetter = (options, selectedOption) => {
    const index = options.indexOf(selectedOption);
    if (index === -1) return null;
    return String.fromCharCode(65 + index);
  };
  
  const handleSubmitAnswer = async () => {
    if (!selectedOption || isSubmitting) return; // Add this guard clause

    clearInterval(intervalRef.current);
    setIsSubmitting(true);
    
    try {
      const optionToSubmit = selectedOption 
        ? getOptionLetter(currentQuestion.options, selectedOption) 
        : 'skip';
      
      const timeTaken = parseFloat((15 - timer).toFixed(2));
      
      const response = await submitAnswerApi(quizId, attemptId, {
        questionId: currentQuestion.questionId,
        selectedOption: optionToSubmit,
        timeTaken: timeTaken
      });
      
      setIsSubmitting(false);
      loadNextQuestion();
    } catch (error) {
      setIsSubmitting(false);
      showToast('Error submitting answer');
      console.error('Error submitting answer:', error);
    }
  };



  const showFinalResults = async () => {
    try {
      const response = await getDetailedResultsApi(quizId, attemptId);
      const { totalScore, finalRank } = response.data;
      Alert.alert(
        'Quiz Completed',
        `You scored ${totalScore} points.\nYour current rank: ${finalRank}\nYou will get the final ranking after the quiz officially ends.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      showToast('Error fetching results');
      console.error('Error fetching results:', error);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    return (
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <View style={styles.questionHeader}>
          <RNText style={styles.questionNumberText}>
            Question {currentQuestionNumber}/10
          </RNText>
        </View>
        <View style={styles.questionTitleContainer}>
          <RNText style={styles.questionText}>{currentQuestion.questionText}</RNText>
        </View>
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.optionButton,
                selectedOption === option && styles.selectedOption,
                timer === 0 && styles.disabledOption,
                {
                  backgroundColor: selectedOption === option 
                    ? COLORS.yellowF5BE00 
                    : COLORS.blue043142
                }
              ]}
              disabled={timer === 0}
              onPress={() => setSelectedOption(option)}
            >
              <RNText style={styles.optionText}>{option}</RNText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actionContainer}>
        <RNText style={styles.timerText}>Time left: {Math.floor(timer)}s</RNText>
        {timer === 0 ? (
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNextQuestion}
            >
              <RNText style={styles.nextButtonText}>Next Question</RNText>
            </TouchableOpacity>
          ) : (
            selectedOption != null && (
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  isSubmitting && styles.disabledButton
                ]} 
                onPress={handleSubmitAnswer}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.whiteFFFFFF} />
                ) : (
                  <RNText style={styles.submitButtonText}>Submit</RNText>
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </Animated.View>
    );
  };

  // Adjust styles to use the new color palette
  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: COLORS.whiteFFFFFF, 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: nw(16)
    },
    loadingText: { 
      fontSize: nw(16), 
      color: COLORS.grey777777,
      fontWeight: 'bold'
    },
    questionContainer: { 
      width: width * 0.9, 
      backgroundColor: COLORS.whiteFFFFFF,
      borderRadius: 20,
      shadowColor: COLORS.blue043142,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
      padding: nw(20),
      alignItems: 'center' 
    },
    questionHeader: {
      width: '100%',
      alignItems: 'center',
      marginBottom: nh(10)
    },
    questionNumberText: {
      fontSize: nw(16),
      color: COLORS.grey333333,
      fontWeight: 'bold'
    },
    questionTitleContainer: {
      marginBottom: nh(20),
      backgroundColor: COLORS.greyBBBBBB,
      padding: nw(10),
      borderRadius: 10,
      width: '100%'
    },
    questionText: { 
      fontSize: nw(18), 
      fontWeight: 'bold', 
      textAlign: 'center',
      color: COLORS.blue043142
    },
    optionsContainer: {
      width: '100%',
      marginBottom: nh(20)
    },
    optionButton: {
      width: '100%',
      padding: nw(12),
      marginVertical: nh(6),
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: COLORS.blue043142
    },
    selectedOption: {
      borderWidth: 3,
      borderColor: COLORS.yellowF5BE00,
    },
    disabledOption: {
      opacity: 0.5,
    },
    optionText: { 
      color: COLORS.whiteFFFFFF, 
      fontSize: nw(14),
      fontWeight: 'bold'
    },
    actionContainer: {
      width: '100%',
      alignItems: 'center'
    },
    timerText: { 
      marginTop: nh(10), 
      fontSize: nw(16), 
      fontWeight: 'bold', 
      color: COLORS.grey333333 
    },
    submitButton: {
      marginTop: nh(10),
      backgroundColor: COLORS.yellowF5BE00,
      paddingVertical: nh(10),
      paddingHorizontal: nw(20),
      borderRadius: 10,
      width: '100%',
      alignItems: 'center'
    },
    submitButtonText: {
      color: COLORS.blue043142,
      fontWeight: 'bold'
    },
    nextButton: {
      marginTop: nh(10),
      backgroundColor: COLORS.blue043142,
      paddingVertical: nh(10),
      paddingHorizontal: nw(20),
      borderRadius: 10,
      width: '100%',
      alignItems: 'center'
    },
    nextButtonText: {
      color: COLORS.whiteFFFFFF,
      fontWeight: 'bold'
    },
  });

  // Rest of the component remains the same...

  return (
    <View style={styles.container}>
      <Modal visible={isCountdownVisible} transparent animationType="fade">
        <View style={countdownStyles.overlay}>
          <RNText style={countdownStyles.countdownText}>{countdownValue}</RNText>
        </View>
      </Modal>
      {loadingQuestion ? (
        <RNText style={styles.loadingText}>Loading question...</RNText>
      ) : (
        renderQuestion()
      )}
    </View>
  );
};

const countdownStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: nw(72),
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
  },
});

export default QuizScreen;