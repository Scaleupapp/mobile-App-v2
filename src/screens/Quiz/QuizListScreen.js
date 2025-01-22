import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Text from '../../components/Text';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import { 
  listAllQuizEventsApi, 
  registerForQuizApi, 
  startQuizAttemptApi 
} from '../../services/apiService';

const QuizList = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredQuizIds, setRegisteredQuizIds] = useState({});
  const [countdowns, setCountdowns] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load registered quizzes and fetch quiz list on mount
  useEffect(() => {
    const loadRegistered = async () => {
      try {
        const stored = await AsyncStorage.getItem('registeredQuizIds');
        if (stored) setRegisteredQuizIds(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading registered quizzes', err);
      }
    };
    loadRegistered();
    fetchQuizzes();
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [quizzes, registeredQuizIds]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const response = await listAllQuizEventsApi(1, 10);
      const sortedQuizzes = response.data.quizzes.sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime)
      );
      setQuizzes(sortedQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateCountdowns = () => {
    let updatedCountdowns = {};
    quizzes.forEach(quiz => {
      if (registeredQuizIds[quiz._id]) {
        let start = new Date(quiz.startTime).getTime();
        let now = new Date().getTime();
        let distance = start - now;
        
        if (distance > 0) {
          let days = Math.floor(distance / (1000 * 60 * 60 * 24));
          let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          let seconds = Math.floor((distance % (1000 * 60)) / 1000);
          updatedCountdowns[quiz._id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
          updatedCountdowns[quiz._id] = 'Quiz started';
        }
      }
    });
    setCountdowns(updatedCountdowns);
  };

  const handleRegister = (quizId) => {
    Alert.alert(
      'Register',
      'Are you sure you want to register?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await registerForQuizApi(quizId);
              setRegisteredQuizIds(prev => {
                const updated = { ...prev, [quizId]: true };
                AsyncStorage.setItem('registeredQuizIds', JSON.stringify(updated));
                return updated;
              });
            } catch (error) {
              console.error('Registration failed:', error);
            }
          } 
        },
      ],
      { cancelable: true }
    );
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const response = await startQuizAttemptApi(quizId);
      const { attemptId } = response.data;
      navigation.navigate('QuizScreen', { quizId, attemptId });
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  const renderQuizCard = ({ item }) => {
    const isRegistered = registeredQuizIds[item._id];
    const countdown = countdowns[item._id];
    const quizDate = new Date(item.startTime);
    const formattedDate = `${quizDate.getDate()}/${quizDate.getMonth() + 1}/${quizDate.getFullYear()}`;
    const formattedTime = quizDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => navigation.navigate('QuizDetails', { quizId: item._id })}>
        <View style={styles.quizIconContainer}>
          <Image
            source={require('../../assets/images/image.png')}
            style={styles.quizIcon}
          />
        </View>
        <View style={styles.quizInfo}>
          <Text
            variant="semibold16"
            color={COLORS.blue043142}
            style={styles.quizTitle}>
            {item.topic || item.title}
          </Text>
          <Text
            variant="regular16"
            color={COLORS.blue043142}
            style={styles.quizSubtitle}>
            {item.difficulty || item.description}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Text variant="regular14" color={COLORS.blue043142}>
              {formattedDate}
            </Text>
            <Text
              variant="regular14"
              color={COLORS.blue043142}
              style={styles.dateTime2}>
              {formattedTime}
            </Text>
          </View>
          
          {isRegistered ? (
            <>
              <Text
                variant="regular14"
                color={COLORS.green00A000}
                style={styles.countdownText}>
                {countdown === 'Quiz started' ? 'Quiz is ready to start!' : `Starts in: ${countdown}`}
              </Text>
              {countdown === 'Quiz started' && (
                <TouchableOpacity
                  style={styles.startQuizButton}
                  onPress={() => handleStartQuiz(item._id)}>
                  <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                    Start Quiz
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => handleRegister(item._id)}>
              <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                Register
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={require('../../assets/images/Ellipse.png')}
        style={styles.semicircle}
        resizeMode="stretch">
        <Header title="Quizzes" rightIcon={false} />
      </ImageBackground>

      <View style={styles.searchWrapper}>
        <CustomTextInput
          width={DEVICE_WIDTH - 32}
          height={nh(50)}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={quizzes}
        renderItem={renderQuizCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchQuizzes}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  semicircle: {
    width: DEVICE_WIDTH,
    height: nh(120),
    marginBottom: nh(20),
  },
  searchWrapper: {
    position: 'absolute',
    left: nw(16),
    right: 0,
    top: Platform.OS == 'ios' ? nh(140) : nh(80),
  },
  listContainer: {
    padding: nw(16),
    paddingTop: nh(60),
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(16),
    marginBottom: nh(16),
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizIconContainer: {
    marginRight: nw(12),
  },
  quizIcon: {
    width: nw(40),
    height: nh(40),
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    marginBottom: nh(4),
  },
  quizSubtitle: {
    marginBottom: nh(8),
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: nh(8),
  },
  dateTime2: {
    marginLeft: nw(12),
  },
  countdownText: {
    marginTop: nh(4),
    marginBottom: nh(8),
  },
  registerButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  startQuizButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
});

export default QuizList;