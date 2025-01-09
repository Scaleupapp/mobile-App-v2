import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import io from 'socket.io-client/dist/socket.io';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../helper/colors';
import { DEVICE_HEIGHT, nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';

const API_URL = 'https://api.scaleupapp.club/api';

const TimerBox = ({ value, label }) => (
  <View style={styles.timerBoxContainer}>
    <View style={styles.timerBox}>
      <Text variant="semibold32" color={COLORS.whiteFFFFFF}>
        {value.toString().padStart(2, '0')}
      </Text>
    </View>
    <Text variant="regular12" color={COLORS.blue043142} style={styles.timerLabel}>
      {label}
    </Text>
  </View>
);

const QuizWaitingRoom = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [timeLeft, setTimeLeft] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const pulseAnim = new Animated.Value(1);


  const [usernamesCache, setUsernamesCache] = useState({});
  const [loadingUsernames, setLoadingUsernames] = useState({});

  const fetchUsername = async userId => {
    try {
      const response = await fetch(
        `https://api.scaleupapp.club/api/user/${userId}`,
      );

      if (!response.ok) {
        console.warn(
          `Failed to fetch username for user ${userId}. Status: ${response.status}`,
        );
        return userId;
      }

      const userData = await response.json();
      console.log(userData);

      return userData?.username || userId;
    } catch (error) {
      console.warn(
        `Network error fetching username for user ${userId}:`,
        error,
      );
      return userId;
    }
  };

  const fetchAndCacheUsername = async userId => {
    if (usernamesCache[userId]) {
      return usernamesCache[userId];
    }

    setLoadingUsernames(prev => ({ ...prev, [userId]: true }));

    try {
      const username = await fetchUsername(userId);
      setUsernamesCache(prevCache => ({ ...prevCache, [userId]: username }));
      setLoadingUsernames(prev => ({ ...prev, [userId]: false }));
      return username;
    } catch (error) {
      console.error(`Failed to fetch username for userId: ${userId}`, error);
      setLoadingUsernames(prev => ({ ...prev, [userId]: false }));
      return 'Unknown User';
    }
  };

  // Load usernames when participants change
  useEffect(() => {
    participants.forEach(participant => {
      if (!usernamesCache[participant.userId]) {
        fetchAndCacheUsername(participant.userId);
      }
    });
  }, [participants]);

  useEffect(() => {
    if (timeLeft && timeLeft <= 60) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [timeLeft]);

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

  const renderTimerOrWaiting = () => {
    if (timeLeft !== null) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      return (
        <View style={styles.countdownContainer}>
          <Text variant="semibold20" color={COLORS.blue043142}>
            Quiz starting in:
          </Text>
          <View style={styles.timerContainer}>
            <TimerBox value={minutes} label="Minutes" />
            <Text variant="semibold32" color={COLORS.blue043142} style={styles.timerSeparator}>
              :
            </Text>
            <TimerBox value={seconds} label="Seconds" />
          </View>
          {timeLeft <= 60 && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text variant="semibold16" color={COLORS.redFF0000} style={styles.startingSoon}>
                Starting soon!
              </Text>
            </Animated.View>
          )}
          {quizStartTime && (
            <Text variant="regular14" color={COLORS.blue043142} style={styles.startTime}>
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


  const renderParticipant = (participant, index) => {
    const isLoading = loadingUsernames[participant.userId];
    const username = usernamesCache[participant.userId];

    return (
      <View key={participant.userId} style={styles.participantCard}>
        <Text variant="semibold16" color={COLORS.blue043142}>
          #{index + 1}
        </Text>
        <View style={styles.participantNameContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.blue043142} />
          ) : (
            <Text variant="regular16" color={COLORS.blue043142} style={styles.participantName}>
              {username || `Participant ${index + 1}`}
            </Text>
          )}
        </View>
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
              participants.map((participant, index) => renderParticipant(participant, index))
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
  participantNameContainer: {
    flex: 1,
    marginLeft: nw(12),
    justifyContent: 'center',
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
    flex: 1,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  timerBoxContainer: {
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(8),
    width: nw(80),
    height: nw(80),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(4, 49, 66, 0.1)',
  },
  timerLabel: {
    marginTop: nh(4),
  },
  timerSeparator: {
    marginHorizontal: nw(8),
    marginBottom: nh(20),
  },
  startingSoon: {
    marginTop: nh(8),
  },
  startTime: {
    marginTop: nh(16),
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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