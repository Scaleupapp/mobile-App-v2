import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text as RNText, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';
import { 
  getNextQuestionApi, 
  submitAnswerApi, 
  getDetailedResultsApi 
} from '../../services/apiService';
import { useToast } from '../../components/CustomToast';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';

const QuizScreen = ({ navigation, route }) => {
  const { quizId, attemptId } = route.params;
  const { showToast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [timer, setTimer] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountdownVisible, setCountdownVisible] = useState(true);
  const [countdownValue, setCountdownValue] = useState(5);
  const [seenQuestions, setSeenQuestions] = useState([]);

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
      } else {
        const question = response.data.question;
        console.log('Received Question:', question);

        // Check if the question has already been seen
        if (seenQuestions.includes(question.questionId)) {
          console.warn(`Duplicate question detected: ${question.questionText}`);
          return loadNextQuestion(); // Request a new question if duplicate detected
        }

        setSeenQuestions((prev) => [...prev, question.questionId]);
        setCurrentQuestion(question);
        setSelectedOption(null);
        setTimer(10);
        startQuestionTimer();
        fadeInQuestion();
      }
    } catch (error) {
      setLoadingQuestion(false);
      showToast('Error loading question');
      console.error('Error fetching question:', error);
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
    setTimer(10);
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setTimer(0);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption == null) {
      showToast('Please select an option');
      return;
    }
    clearInterval(intervalRef.current);
    setIsSubmitting(true);
    try {
      await submitAnswerApi(quizId, attemptId, {
        questionId: currentQuestion.questionId,
        selectedOption,
        timeTaken: 10 - timer,
      });
      setIsSubmitting(false);
      loadNextQuestion();
    } catch (error) {
      setIsSubmitting(false);
      showToast('Error submitting answer');
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    loadNextQuestion();
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
        <RNText style={styles.questionText}>{currentQuestion.questionText}</RNText>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.optionButton,
              selectedOption === option && styles.selectedOption,
              timer === 0 && styles.disabledOption
            ]}
            disabled={timer === 0}
            onPress={() => setSelectedOption(option)}
          >
            <RNText style={styles.optionText}>{option}</RNText>
          </TouchableOpacity>
        ))}
        <RNText style={styles.timerText}>Time left: {timer}s</RNText>
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
              style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
              onPress={handleSubmitAnswer}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <RNText style={styles.submitButtonText}>Submit</RNText>
              )}
            </TouchableOpacity>
          )
        )}
      </Animated.View>
    );
  };

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

export default QuizScreen;

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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: nw(16), 
    backgroundColor: COLORS.whiteFFFFFF, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    fontSize: nw(16), 
    color: COLORS.grey777777 
  },
  questionContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  questionText: { 
    fontSize: nw(18), 
    fontWeight: 'bold', 
    marginBottom: nh(12), 
    textAlign: 'center' 
  },
  optionButton: {
    width: '100%',
    padding: nw(12),
    marginVertical: nh(6),
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(6),
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: COLORS.green00A000,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: { 
    color: '#fff', 
    fontSize: nw(14) 
  },
  timerText: { 
    marginTop: nh(12), 
    fontSize: nw(16), 
    fontWeight: 'bold', 
    color: COLORS.redFF0000 
  },
  submitButton: {
    marginTop: nh(16),
    backgroundColor: COLORS.green00A000,
    paddingVertical: nh(10),
    paddingHorizontal: nw(20),
    borderRadius: nw(6),
  },
  nextButton: {
    marginTop: nh(16),
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(10),
    paddingHorizontal: nw(20),
    borderRadius: nw(6),
  },
});
