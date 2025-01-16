import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator,ScrollView, Animated, Easing,SafeAreaView,
  StatusBar, } from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../helper/colors';
import { DEVICE_HEIGHT, nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';

const API_URL = 'https://api.scaleupapp.club/api';
const SOCKET_URL = 'https://api.scaleupapp.club';

const QuizGame = ({ route, navigation }) => {
  const { quizId } = route.params; // Get totalQuestions from navigation params
  const [totalQuestions, setTotalQuestions] = useState(0); // Add this state

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
  const [processedQuestions] = useState(new Set()); // Add this to track processed questions
  
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
      // socketRef.current.on('nextQuestion', (data) => {
      //   if (!isMountedRef.current) return;
      //   console.log('Received next question:', data);
        
      //   if (data && data.question) {
      //     const questionData = data.question;
      //     console.log('Processing question data:', questionData);
          
      //     setCurrentQuestion({
      //       _id: questionData._id,
      //       text: questionData.text || questionData.questionText,
      //       options: questionData.options || []
      //     });
      //     setSelectedOption(null);
      //     setTimeLeft(10);
      //     setCanProgress(false);
      //     setIsWaitingForNextQuestion(false);
      //     setShowFeedback(false);
      //     startTimeRef.current = new Date();
      //     setQuizStatus('active');
      //     setLoading(false);
      //     //setQuestionNumber(prev => prev + 1);
      //   } else {
      //     console.warn('Received nextQuestion event without valid question data');
      //   }
      // });

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
    const getTotalQuestions = async () => {
      try {
        const storedTotal = await AsyncStorage.getItem(`quiz_${quizId}_total_questions`);
        if (storedTotal) {
          setTotalQuestions(JSON.parse(storedTotal));
        }
      } catch (error) {
        console.error('Error getting total questions:', error);
      }
    };
    
    getTotalQuestions();
  }, [quizId]);

  useEffect(() => {
    if (!socketRef.current) return;
  
    const handleNextQuestion = (data) => {
      if (!isMountedRef.current) return;
      
      if (data && data.question) {
        const questionData = data.question;
        
        // Check if we've already processed this question
        if (processedQuestions.has(questionData._id)) {
          console.log('Skipping duplicate question:', questionData._id);
          return;
        }
        
        console.log('Processing new question:', questionData._id);
        processedQuestions.add(questionData._id);
        
        setCurrentQuestion({
          _id: questionData._id,
          text: questionData.text || questionData.questionText,
          options: questionData.options || []
        });
        setQuestionNumber(data.questionIndex); // Update question number from backend
        setSelectedOption(null);
        setTimeLeft(10);
        setCanProgress(false);
        setIsWaitingForNextQuestion(false);
        setShowFeedback(false);
        startTimeRef.current = new Date();
        setQuizStatus('active');
        setLoading(false);
      } else {
        console.warn('Received nextQuestion event without valid question data');
      }
    };
  
    const handleQuizEnded = () => {
      if (!isMountedRef.current) return;
      console.log('Quiz ended event received');
      handleQuizCompletion();
    };
  
    // Set up event listeners
    socketRef.current.on('nextQuestion', handleNextQuestion);
    socketRef.current.on('quizEnded', handleQuizEnded);
  
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('nextQuestion', handleNextQuestion);
        socketRef.current.off('quizEnded', handleQuizEnded);
      }
    };
  }, [socketRef.current]);

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

  // useEffect(() => {
  //   socketRef.current?.on('nextQuestion', (data) => {
  //     if (!isMountedRef.current) return;
      
  //     if (data && (data.question || data.questions)) {
  //       const questionData = data.question || data.questions;
  //       // setQuestionNumber(prev => prev + 1);
  //       setCurrentQuestion({
  //         _id: questionData._id,
  //         text: questionData.questionText || questionData.text,
  //         options: questionData.options || []
  //       });
  //       setSelectedOption(null);
  //       setTimeLeft(10);
  //       setShowFeedback(false);
  //       setIsCorrect(null);
  //       setCorrectAnswer(null);
  //       startTimeRef.current = new Date();
  //       setQuizStatus('active');
  //       setLoading(false);
  //     }
  //   });

  //   socketRef.current?.on('quizEnded', () => {
  //     if (!isMountedRef.current) return;
  //     handleQuizCompletion();
  //   });

  //   return () => {
  //     isMountedRef.current = false;
  //   };
  // }, []);

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
      // setQuestionNumber(prev => prev + 1); // Add this line to increment question number

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

      // if (answeredQuestions + 1 >= totalQuestions) {
      //   setTimeout(handleQuizCompletion, 2000);
      // } else {
      //   setTimeout(() => {
      //     // Transition to next question with animation
      //     Animated.sequence([
      //       Animated.timing(fadeAnim, {
      //         toValue: 0,
      //         duration: 200,
      //         useNativeDriver: true,
      //       }),
      //       Animated.timing(fadeAnim, {
      //         toValue: 1,
      //         duration: 200,
      //         useNativeDriver: true,
      //       }),
      //     ]).start();

      //     setIsWaitingForNextQuestion(true);
      //     setShowFeedback(false);
      //     setSelectedOption(null);
      //     socketRef.current?.emit('getCurrentQuestion', { quizId });
      //   }, 2000);
      // }
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
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.yellowF5BE00}
        />
        <View style={[styles.centerContent, { flex: 1 }]}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="regular16" color={COLORS.blue043142}>
            {connectionAttempts > 0 
              ? `Connecting to quiz server (Attempt ${connectionAttempts}/${maxReconnectAttempts})...`
              : 'Preparing quiz...'}
          </Text>
          {isConnected && (
            <Text variant="regular14" color={COLORS.green}>Connected to server</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.yellowF5BE00}
        />
        <View style={[styles.centerContent, { flex: 1 }]}>
          <Text variant="regular16" color={COLORS.red}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              setConnectionAttempts(0);
              initializeSocket(token);
            }}
          >
            <Text variant="regular16" color={COLORS.whiteFFFFFF}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (quizStatus === 'waiting' || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.yellowF5BE00}
        />
        <View style={[styles.centerContent, { flex: 1 }]}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="regular16" color={COLORS.blue043142}>
            Waiting for quiz to start...
          </Text>
          {isConnected && (
            <Text variant="regular14" color={COLORS.green}>Connected to server</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      
      <View style={styles.headerContainer}>
        <Header
          title="Quiz Game"
          onBackPress={() => navigation.navigate('QuizDetails', { quizId })}
        />
      </View>
      
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            {/* Progress Section */}
            <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
              <View style={styles.progressHeader}>
                <Text variant="regular16" color={COLORS.blue043142}>
                  Question {questionNumber}/{totalQuestions}
                </Text>
                <View style={styles.timerContainer}>
                  <Text variant="semibold16" color={COLORS.blue043142}>
                    {formatTime(timeLeft)}
                  </Text>
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
                <Text variant="regular16" color={COLORS.blue043142}>
                  Score: {score}
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
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
              <Text variant="semibold18" color={COLORS.blue043142} style={styles.questionText}>
                {currentQuestion?.text}
              </Text>
              
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
                    <Text 
                      variant="regular16" 
                      color={
                        selectedOption === option ? COLORS.whiteFFFFFF :
                        showFeedback && (selectedOption === option || correctAnswer === option) ? 
                        COLORS.whiteFFFFFF : COLORS.blue043142
                      }
                    >
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
                  <Text variant="semibold16" color={COLORS.blue043142}>
                    {feedback}
                  </Text>
                  {answeredQuestions >= totalQuestions && (
                    <Text variant="regular14" color={COLORS.blue043142}>
                      Quiz completed! Redirecting to results...
                    </Text>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  headerContainer: {
    paddingTop: nh(10),
    paddingBottom: nh(10),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(26),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingTop: nh(20),
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: nw(16),
    paddingBottom: nh(20),
  },
  progressCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    borderRadius: nh(8),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: 'rgba(4, 49, 66, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  timerContainer: {
    position: 'relative',
    width: nw(60),
    height: nh(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: nh(30),
    borderWidth: 3,
    borderColor: COLORS.blue043142,
    borderRightColor: 'transparent',
  },
  progressBarContainer: {
    height: nh(8),
    backgroundColor: 'rgba(4, 49, 66, 0.1)',
    borderRadius: nh(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(4),
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    borderRadius: nh(8),
    borderWidth: 1,
    borderColor: 'rgba(4, 49, 66, 0.1)',
  },
  questionText: {
    marginBottom: nh(16),
  },
  optionsContainer: {
    gap: nh(10),
  },
  optionButton: {
    padding: nw(16),
    borderRadius: nh(8),
    borderWidth: 1,
    borderColor: 'rgba(4, 49, 66, 0.1)',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  selectedOption: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  correctOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  wrongOption: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  feedbackContainer: {
    padding: nw(16),
    borderRadius: nh(8),
    marginTop: nh(16),
    borderWidth: 1,
  },
  correctFeedback: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  wrongFeedback: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#f44336',
  },
  retryButton: {
    backgroundColor: COLORS.blue043142,
    padding: nw(16),
    borderRadius: nh(8),
    marginTop: nh(16),
  },
});

export default QuizGame;