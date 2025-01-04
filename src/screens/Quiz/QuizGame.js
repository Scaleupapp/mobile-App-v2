import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.43.240:3000/api';
const SOCKET_URL = 'http://192.168.43.240:3000';

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
  const [questions, setQuestions] = useState([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [canProgress, setCanProgress] = useState(false);
  const [isWaitingForNextQuestion, setIsWaitingForNextQuestion] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());


  const startTimeRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  const initializeSocket = async (authToken) => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

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
        console.log('Socket connected with ID:', socketRef.current.id);
        setIsConnected(true);
        setConnectionAttempts(0);
        
        socketRef.current.emit('joinQuizRoom', { quizId });
        socketRef.current.emit('getCurrentQuestion', { quizId });
      });

      socketRef.current.on('nextQuestion', (data) => {
        if (!isMountedRef.current) return;
        console.log('Received nextQuestion event:', data);
 
        
        const questionData = data?.question || data?.questions;
        if (!questionData || answeredQuestions.has(questionData._id)) {
          return; // Skip if question already answered or invalid
        }

        const processedQuestion = {
          _id: questionData._id,
          text: questionData.text || questionData.questionText,
          options: questionData.options || []
        };

        setCurrentQuestion(processedQuestion);
        setSelectedOption(null);
        setTimeLeft(10);
        startTimeRef.current = new Date();
        setQuizStatus('active');
        setLoading(false);
      });

      socketRef.current.on('quizStatus', (data) => {
        if (!isMountedRef.current) return;
        setQuizStatus(data.status);
        
        if (data.status === 'ended') {
          navigation.replace('QuizResults', { quizId });
        }
      });

      socketRef.current.on('showLeaderboard', () => {
        if (!isMountedRef.current) return;
        navigation.replace('QuizResults', { quizId });
      });

      socketRef.current.on('connect_error', (error) => {
        if (!isMountedRef.current) return;
        console.error('Socket connection error:', error);
        handleConnectionError();
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      handleConnectionError();
    }
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

  const handleSubmitAnswer = async (selectedOption) => {
    if (!token || !currentQuestion?._id || answeredQuestions.has(currentQuestion._id)) {
      return;
    }

    try {
      const endTime = new Date();
      const timeTaken = startTimeRef.current 
        ? Math.min((endTime - startTimeRef.current) / 1000, 10)
        : 10;

      await axios.post(
        `${API_URL}/quiz/submit-answer`,
        {
          quizId,
          questionId: currentQuestion._id,
          selectedOption,
          timeTaken
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setSelectedOption(selectedOption);
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion._id]));
      setCanProgress(true); // Enable the Next button

      clearInterval(timerRef.current);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && quizStatus === 'active' && !selectedOption) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitAnswer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft, currentQuestion, quizStatus, selectedOption]);

  const handleNextQuestion = () => {
    if (!canProgress || isWaitingForNextQuestion) return;
    
    setIsWaitingForNextQuestion(true);
    socketRef.current.emit('getCurrentQuestion', { quizId });
  };



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
    <View style={styles.container}>
      <View style={styles.header}>
        <View 
          style={[
            styles.timerContainer, 
            { width: `${(timeLeft/10) * 100}%` },
            timeLeft <= 3 && styles.timerWarning
          ]}
        >
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion?.text}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion?.options?.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedOption === option && styles.selectedOption
            ]}
            onPress={() => handleSubmitAnswer(option)}
            disabled={selectedOption !== null}
          >
            <Text 
              style={[
                styles.optionText,
                selectedOption === option && styles.selectedOptionText
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      {canProgress && !isWaitingForNextQuestion && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextQuestion}
        >
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
      )}

      {isWaitingForNextQuestion && (
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.waitingText}>Waiting for next question...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    color: 'white',
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
    color: 'white',
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
});

export default QuizGame;