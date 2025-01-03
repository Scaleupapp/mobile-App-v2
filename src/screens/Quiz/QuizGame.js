import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.scaleupapp.club/api';
const SOCKET_URL = 'https://api.scaleupapp.club';

const QuizGame = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStatus, setQuizStatus] = useState('waiting'); // 'waiting', 'active', 'finished'
  
  const startTimeRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize socket connection with reconnection logic
  const initializeSocket = (authToken) => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully');
      socketRef.current.emit('joinQuizRoom', { quizId });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Connection error. Attempting to reconnect...');
    });

    // Handle quiz events
    socketRef.current.on('quizStart', (data) => {
      console.log('Quiz started:', data);
      setQuizStatus('active');
      setError(null);
    });

    socketRef.current.on('nextQuestion', (data) => {
      if (!data.question) return;
      
      setSelectedOption(null);
      setTimeLeft(10);
      startTimeRef.current = new Date();
      
      setCurrentQuestion({
        text: data.question.questionText,
        options: data.question.options,
        _id: data.question._id
      });
    });

    socketRef.current.on('showLeaderboard', (data) => {
      setQuizStatus('finished');
      navigation.replace('QuizResults', { 
        quizId,
        token: authToken,
        ...data 
      });
    });

    socketRef.current.on('quizError', (error) => {
      console.error('Quiz error:', error);
      setError(error.message || 'An error occurred during the quiz');
    });
  };

  // Join quiz and validate participation
  const joinQuiz = async (authToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/quiz/initiate`,
        { quizId },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      console.log('sdfdffffff',response)

      if (response.data.status === 'waiting') {
        setQuizStatus('waiting');
      } else if (response.data.status === 'active') {
        setQuizStatus('active');
      }
      
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error joining quiz:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join quiz';
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (!userData) {
          setError('Please log in to participate');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (!parsedUser?.token) {
          setError('Invalid session. Please log in again');
          return;
        }

        setToken(parsedUser.token);
        await joinQuiz(parsedUser.token);
        initializeSocket(parsedUser.token);
      } catch (error) {
        console.error('Quiz initialization error:', error);
        setError('Failed to initialize quiz');
      }
    };

    initializeQuiz();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!token || !currentQuestion?._id) return;

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
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && quizStatus === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft, currentQuestion, quizStatus]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Preparing quiz...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Waiting state
  if (quizStatus === 'waiting' || !currentQuestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Waiting for quiz to start...</Text>
      </View>
    );
  }

  // Quiz interface
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
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedOption === option && styles.selectedOption
            ]}
            onPress={() => {
              setSelectedOption(option);
              // Auto-submit after selection
              setTimeout(() => handleSubmitAnswer(), 100);
            }}
            disabled={timeLeft === 0}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  timerContainer: {
    height: '100%',
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  timerWarning: {
    backgroundColor: '#FF4444',
  },
  timerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  questionContainer: {
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 24,
  },
  optionsContainer: {
    padding: 20,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
    padding: 20,
  },
});

export default QuizGame;