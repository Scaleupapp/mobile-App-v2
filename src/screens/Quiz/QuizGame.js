import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,ScrollView, Animated, Easing } from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.135.240:3000/api';
const SOCKET_URL = 'http://192.168.135.240:3000';

const QuizGame = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [isConnected, setIsConnected] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [canProgress, setCanProgress] = useState(false);
  const [isWaitingForNextQuestion, setIsWaitingForNextQuestion] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(16);

  const startTimeRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const timerAnimation = useRef(new Animated.Value(10)).current;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };




  const initializeSocket = async (authToken) => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      console.log('Initializing socket connection for quiz:', quizId);
      
      socketRef.current = io(SOCKET_URL, {
        auth: { token: authToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      socketRef.current.on('connect', () => {
        if (!isMountedRef.current) return;
        console.log('Socket connected successfully. Socket ID:', socketRef.current.id);
        setIsConnected(true);
        setConnectionAttempts(0);
        
        // Join quiz room and request initial state
        socketRef.current.emit('joinQuizRoom', { quizId });
      });

      // Handle quiz status updates
      socketRef.current.on('quizStatus', (data) => {
        if (!isMountedRef.current) return;
        console.log('Received quiz status:', data);
        setQuizStatus(data.status);
        
        if (data.status === 'active' && data.currentQuestion) {
          console.log('Setting current question from quiz status');
          setCurrentQuestion(data.currentQuestion);
          setTimeLeft(10);
          startTimeRef.current = new Date();
          setLoading(false);
        }
      });

      // Handle next question events
      socketRef.current.on('nextQuestion', (data) => {
        if (!isMountedRef.current) return;
        console.log('Received next question:', data);
        
        if (data && data.question) {
          const questionData = data.question;
          console.log('Processing question data:', questionData);
          
          setCurrentQuestion({
            _id: questionData._id,
            text: questionData.text || questionData.questionText,
            options: questionData.options || []
          });
          setSelectedOption(null);
          setTimeLeft(10);
          setCanProgress(false);
          setIsWaitingForNextQuestion(false);
          setShowFeedback(false);
          startTimeRef.current = new Date();
          setQuizStatus('active');
          setLoading(false);
          //setQuestionNumber(prev => prev + 1);
        } else {
          console.warn('Received nextQuestion event without valid question data');
        }
      });

      // Handle quiz end
      socketRef.current.on('quizEnded', () => {
        if (!isMountedRef.current) return;
        console.log('Quiz ended event received');
        handleQuizCompletion();
      });

      // Handle errors
      socketRef.current.on('error', (error) => {
        if (!isMountedRef.current) return;
        console.error('Socket error:', error);
        setError(error.message || 'An error occurred');
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      handleConnectionError();
    }
  };

  const initializeQuiz = async () => {
    try {
      console.log('Initializing quiz:', quizId);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('Please log in to participate');
      }

      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.token) {
        throw new Error('Invalid session');
      }

      setToken(parsedUser.token);

      // Initialize quiz participation
      try {
        const response = await fetch(`${API_URL}/quiz/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsedUser.token}`
          },
          body: JSON.stringify({ quizId })
        });

        const data = await response.json();
        console.log('Quiz initiation response:', data);

        if (!response.ok && data.message !== "The quiz has already started") {
          throw new Error(data.message || 'Failed to initialize quiz');
        }

      } catch (error) {
        if (error.message === "The quiz has already started") {
          console.log('Quiz already in progress, joining...');
          setQuizStatus('active');
        } else {
          throw error;
        }
      }

      await initializeSocket(parsedUser.token);
    } catch (error) {
      console.error('Quiz initialization error:', error);
      setError(error.message || 'Failed to initialize quiz');
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeQuiz();

    return () => {
      console.log('Cleaning up quiz component');
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  useEffect(() => {
    socketRef.current?.on('nextQuestion', (data) => {
      if (!isMountedRef.current) return;
      
      if (data && (data.question || data.questions)) {
        const questionData = data.question || data.questions;
        // setQuestionNumber(prev => prev + 1);
        setCurrentQuestion({
          _id: questionData._id,
          text: questionData.questionText || questionData.text,
          options: questionData.options || []
        });
        setSelectedOption(null);
        setTimeLeft(10);
        setShowFeedback(false);
        setIsCorrect(null);
        setCorrectAnswer(null);
        startTimeRef.current = new Date();
        setQuizStatus('active');
        setLoading(false);
      }
    });

    socketRef.current?.on('quizEnded', () => {
      if (!isMountedRef.current) return;
      handleQuizCompletion();
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleQuizCompletion = () => {
    setQuizCompleted(true);
    // Navigate to results screen
    navigation.replace('QuizResults', { quizId });
  };


  const handleConnectionError = () => {
    setConnectionAttempts(prev => {
      const newAttempts = prev + 1;
      if (newAttempts >= maxReconnectAttempts) {
        setError('Unable to connect to quiz server. Please try again.');
        setLoading(false);
      }
      return newAttempts;
    });
  };

  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) throw new Error('Please log in to participate');

        const parsedUser = JSON.parse(userData);
        if (!parsedUser?.token) throw new Error('Invalid session');

        setToken(parsedUser.token);

        try {
          await axios.post(
            `${API_URL}/quiz/initiate`,
            { quizId },
            { headers: { Authorization: `Bearer ${parsedUser.token}` }}
          );
        } catch (error) {
          if (error.response?.data?.message === "The quiz has already started") {
            console.log('Quiz in progress, joining...');
            setQuizStatus('active');
          } else {
            throw error;
          }
        }

        await initializeSocket(parsedUser.token);
      } catch (error) {
        console.error('Quiz initialization error:', error);
        setError(error.message || 'Failed to initialize quiz');
        setLoading(false);
      }
    };

    initializeQuiz();

    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  const handleSubmitAnswer = async (option) => {
    if (!token || !currentQuestion?._id || selectedOption !== null) return;

    // Animate the option selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const endTime = new Date();
      const timeTaken = startTimeRef.current 
        ? Math.min((endTime - startTimeRef.current) / 1000, 10)
        : 10;

      setSelectedOption(option);

      const response = await fetch(`${API_URL}/quiz/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quizId,
          questionId: currentQuestion._id,
          selectedOption: option,
          timeTaken
        })
      });

      const data = await response.json();
      
      setShowFeedback(true);
      setIsCorrect(data.isCorrect);
      setCorrectAnswer(data.correctAnswer);
      setScore(prev => prev + (data.pointsAwarded || 0));
      setAnsweredQuestions(prev => prev + 1);
      setQuestionNumber(prev => prev + 1); // Add this line to increment question number

      setCanProgress(true);

      if (data.isCorrect) {
        setFeedback(`Correct! +${data.pointsAwarded} points`);
      } else {
        setFeedback(`Incorrect. The correct answer was: ${data.correctAnswer}`);
      }

      // Animate feedback appearance
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (answeredQuestions + 1 >= totalQuestions) {
        setTimeout(handleQuizCompletion, 2000);
      } else {
        setTimeout(() => {
          // Transition to next question with animation
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          setIsWaitingForNextQuestion(true);
          setShowFeedback(false);
          setSelectedOption(null);
          socketRef.current?.emit('getCurrentQuestion', { quizId });
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback('Error submitting answer');
    }
  };

  const handleNextQuestion = () => {
    if (!canProgress || isWaitingForNextQuestion) return;
    
    setIsWaitingForNextQuestion(true);
    setShowFeedback(false);
    setSelectedOption(null);
    
    // Emit getCurrentQuestion event to get the next question
    socketRef.current?.emit('getCurrentQuestion', { quizId });
    console.log('Requesting next question for quiz:', quizId);
  };



  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && quizStatus === 'active' && !showFeedback) {

      Animated.timing(timerAnimation, {
        toValue: 0,
        duration: timeLeft * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (!selectedOption) {
              handleSubmitAnswer(null);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft, currentQuestion, quizStatus, showFeedback]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          {connectionAttempts > 0 
            ? `Connecting to quiz server (Attempt ${connectionAttempts}/${maxReconnectAttempts})...`
            : 'Preparing quiz...'}
        </Text>
        {isConnected && <Text style={styles.connectedText}>Connected to server</Text>}
        <Text style={styles.debugText}>Quiz Status: {quizStatus}</Text>
        <Text style={styles.debugText}>Socket Connected: {isConnected ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Has Question: {currentQuestion ? 'Yes' : 'No'}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            setConnectionAttempts(0);
            initializeSocket(token);
          }}
        >
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (quizStatus === 'waiting' || !currentQuestion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Waiting for quiz to start...</Text>
        {isConnected && <Text style={styles.connectedText}>Connected to server</Text>}
      </View>
    );
  }

return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Progress Section */}
      <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Question {questionNumber}/{totalQuestions}
          </Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Animated.View style={[
              styles.timerRing,
              {
                transform: [{
                  rotate: timerAnimation.interpolate({
                    inputRange: [0, 10],
                    outputRange: ['360deg', '0deg'],
                  }),
                }],
              },
            ]} />
          </View>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        
        {/* Overall Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBarFill,
              styles.overallProgress,
              { width: `${(answeredQuestions/totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </Animated.View>

      {/* Question Section */}
      <Animated.View 
        style={[
          styles.questionCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.questionText}>{currentQuestion?.text}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion?.options?.map((option, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              style={[
                styles.optionButton,
                selectedOption === option && styles.selectedOption,
                showFeedback && selectedOption === option && (
                  isCorrect ? styles.correctOption : styles.wrongOption
                ),
                showFeedback && correctAnswer === option && styles.correctOption
              ]}
              onPress={() => handleSubmitAnswer(option)}
              disabled={selectedOption !== null}
            >
              <Text style={[
                styles.optionText,
                selectedOption === option && styles.selectedOptionText,
                (showFeedback && (selectedOption === option || correctAnswer === option)) && 
                styles.feedbackOptionText
              ]}>
                {`${String.fromCharCode(65 + index)}. ${option}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Section */}
        {showFeedback && (
          <Animated.View 
            style={[
              styles.feedbackContainer,
              isCorrect ? styles.correctFeedback : styles.wrongFeedback,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.feedbackText}>{feedback}</Text>
            {answeredQuestions >= totalQuestions && (
              <Text style={styles.completionText}>
                Quiz completed! Redirecting to results...
              </Text>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20 // Adds padding at the bottom for better scrolling
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginBottom: 20,
  },
  timerContainer: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  timerWarning: {
    backgroundColor: '#FF5252',
  },
  timerText: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: 'black',
  },
  selectedOptionText: {
    color: 'black',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: 'black',
  },
  connectedText: {
    marginTop: 5,
    color: 'green',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'black',
    textAlign: 'center',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  waitingText: {
    color: '#666',
    fontSize: 16,
  },
  correctOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049'
  },
  wrongOption: {
    backgroundColor: '#f44336',
    borderColor: '#da190b'
  },
  correctOptionText: {
    color: '#ffffff'
  },
  wrongOptionText: {
    color: '#ffffff'
  },
  feedbackText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
    fontWeight: 'bold'
  },
  questionCounter: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',

  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',

  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginVertical: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  overallProgress: {
    backgroundColor: '#4CAF50',
  },
  progressStats: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
    color: '#666',
  },
  questionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  correctFeedback: {
    backgroundColor: '#E8F5E9',
  },
  wrongFeedback: {
    backgroundColor: '#FFEBEE',
  },
  feedbackOptionText: {
    color: 'white',
  },
  completionText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  debugText: {
    marginTop: 10,
    color: '#666',
    fontSize: 12
  },
  timerContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  timerRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#2196F3',
    borderRightColor: 'transparent',
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  questionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    margin: 16,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  wrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  feedbackOptionText: {
    fontWeight: 'bold',
  },
  feedbackContainer: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
});

export default QuizGame;