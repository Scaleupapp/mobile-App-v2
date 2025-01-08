import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../helper/colors';
import { DEVICE_HEIGHT, nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';

const API_URL = 'http://192.168.97.240:3000/api';

const QuizWaitingRoom = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [timeLeft, setTimeLeft] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStartTime, setQuizStartTime] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        const parsedUser = JSON.parse(userData);
        setToken(parsedUser?.token);

        if (parsedUser?.token) {
          const response = await axios.get(
            `${API_URL}/quiz/list`,
            {
              headers: { Authorization: `Bearer ${parsedUser.token}` }
            }
          );
          const quiz = response.data.quizzes.find(q => q._id === quizId);
          if (quiz) {
            setQuizStartTime(new Date(quiz.startTime));
            const joinedParticipants = quiz.participants.filter(p => p.hasJoined);
            setParticipants(joinedParticipants);
            
            const now = new Date();
            const startTime = new Date(quiz.startTime);
            const difference = startTime - now;
            if (difference > 0 && difference <= 3600000) {
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
          <Text variant="regular16" color={COLORS.blue043142}>
            Quiz starting in:
          </Text>
          <Text variant="semibold24" color={COLORS.blue043142} style={styles.timer}>
            {formatTimeLeft(timeLeft)}
          </Text>
          {quizStartTime && (
            <Text variant="regular14" color={COLORS.blue043142}>
              Start time: {quizStartTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
        <Text variant="regular16" color={COLORS.blue043142} style={styles.waitingText}>
          Waiting for quiz to start...
        </Text>
        {quizStartTime && (
          <Text variant="regular14" color={COLORS.blue043142}>
            Start time: {quizStartTime.toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="regular16" color={COLORS.blue043142}>
            Loading waiting room...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {renderTimerOrWaiting()}

          <View style={styles.participantsContainer}>
            <Text variant="semibold20" color={COLORS.blue043142} style={styles.participantsTitle}>
              Participants ({participants.length})
            </Text>
            
            {participants.length === 0 ? (
              <Text variant="regular16" color={COLORS.blue043142} style={styles.noParticipantsText}>
                No participants have joined yet. Be the first one!
              </Text>
            ) : (
              participants.map((participant, index) => (
                <View key={participant.userId} style={styles.participantCard}>
                  <Text variant="semibold16" color={COLORS.blue043142}>
                    #{index + 1}
                  </Text>
                  <Text variant="regular16" color={COLORS.blue043142} style={styles.participantName}>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      
      <View style={styles.headerContainer}>
        <Header
          title="Quiz Waiting Room"
          onBackPress={() => navigation.navigate('QuizDetails', { quizId })}
        />
      </View>
      
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          {renderContent()}
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
  contentContainer: {
    padding: nw(16),
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: nh(32),
    padding: nw(20),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(8),
    width: '100%',
  },
  timer: {
    marginVertical: nh(8),
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: nh(32),
    padding: nw(20),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(8),
    width: '100%',
  },
  waitingText: {
    marginTop: nh(16),
  },
  participantsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    borderRadius: nh(8),
    marginBottom: nh(20),
  },
  participantsTitle: {
    marginBottom: nh(16),
  },
  noParticipantsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: nh(20),
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nw(12),
    borderRadius: nh(8),
    marginBottom: nh(8),
    backgroundColor: 'rgba(4, 49, 66, 0.05)',
  },
  participantName: {
    marginLeft: nw(12),
  },
});

export default QuizWaitingRoom;