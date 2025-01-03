import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.scaleupapp.club/api';

const QuizWaitingRoom = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [timeLeft, setTimeLeft] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStartTime, setQuizStartTime] = useState(null);

  // Initialize token and fetch initial quiz data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get token from storage
        const userData = await AsyncStorage.getItem('userData');
        const parsedUser = JSON.parse(userData);
        setToken(parsedUser?.token);

        // Fetch initial quiz data
        if (parsedUser?.token) {
          const response = await axios.get(
            `${API_URL}/quiz/list`,
            {
              headers: { Authorization: `Bearer ${parsedUser.token}` }
            }
          );
          const quiz = response.data.quizzes.find(q => q._id === quizId);
          if (quiz) {
            // Set quiz start time
            setQuizStartTime(new Date(quiz.startTime));
            
            // Filter to show only joined participants
            const joinedParticipants = quiz.participants.filter(p => p.hasJoined);
            setParticipants(joinedParticipants);
            
            // Initialize countdown if we're close to start time
            const now = new Date();
            const startTime = new Date(quiz.startTime);
            const difference = startTime - now;
            if (difference > 0 && difference <= 3600000) { // Within 1 hour of start
              setTimeLeft(Math.floor(difference / 1000));
              startCountdown(startTime);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [quizId]);

  // Function to start countdown
  const startCountdown = (startTime) => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = startTime - now;
      
      if (difference <= 0) {
        clearInterval(timer);
        navigation.replace('QuizGame', { 
          quizId,
          token: token
        });
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  };

  // Socket connection and event handlers
// In QuizGame.js, modify the initializeSocket function:
const initializeSocket = (authToken) => {
  try {
    // Connect to the root namespace with the correct configuration
    socketRef.current = io(SOCKET_URL, {
      // Match the CORS configuration from your backend
      withCredentials: true,
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      // Extra options to match your backend configuration
      extraHeaders: {
        "Authorization": `Bearer ${authToken}`
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully');
      // Join the quiz room after successful connection
      socketRef.current.emit('joinQuizRoom', { quizId });
    });

    // Rest of your socket event handlers...
  } catch (error) {
    console.error('Socket initialization error:', error);
    setError('Failed to initialize quiz connection');
  }
};

  const formatTimeLeft = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTimerOrWaiting = () => {
    if (timeLeft !== null) {
      return (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>Quiz starting in:</Text>
          <Text style={styles.timer}>{formatTimeLeft(timeLeft)}</Text>
          {quizStartTime && (
            <Text style={styles.startTimeText}>
              Start time: {quizStartTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.waitingText}>Waiting for quiz to start...</Text>
        {quizStartTime && (
          <Text style={styles.startTimeText}>
            Start time: {quizStartTime.toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading waiting room...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Waiting Room</Text>
        
        {renderTimerOrWaiting()}

        <View style={styles.participantsContainer}>
          <Text style={styles.participantsTitle}>
            Participants ({participants.length})
          </Text>
          
          {participants.length === 0 ? (
            <Text style={styles.noParticipantsText}>
              No participants have joined yet. Be the first one!
            </Text>
          ) : (
            participants.map((participant, index) => (
              <View key={participant.userId} style={styles.participantCard}>
                <Text style={styles.participantNumber}>#{index + 1}</Text>
                <Text style={styles.participantName}>
                  {participant.username || `Participant ${index + 1}`}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    width: '100%',
  },
  countdownText: {
    fontSize: 18,
    color: 'black',
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  startTimeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    width: '100%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  waitingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  participantsContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    minHeight: 200,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#333',
  },
  noParticipantsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  participantNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    color: '#333',
  },
});

export default QuizWaitingRoom;