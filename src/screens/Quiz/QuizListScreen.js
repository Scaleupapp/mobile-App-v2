import React, { useState, useEffect, useCallback } from 'react';
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
import {jwtDecode} from 'jwt-decode';
import moment from 'moment';
import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import LeaderboardModal from './LeaderboardModal';
import PaymentModal from './PaymentModal';
import { 
  listAllQuizEventsApi, 
  registerForQuizApi, 
  startQuizAttemptApi,
  fetchUserQuizAttemptsApi,
  fetchUserRegisteredQuizzesApi, // New API call to get user's registered quizzes
} from '../../services/apiService';

const TABS = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

const EmptyStateImages = {
  UPCOMING: require('../../assets/images/intro4.png'),
  ACTIVE: require('../../assets/images/intro4.png'),
  COMPLETED: require('../../assets/images/intro4.png'),
};

const EmptyStateMessages = {
  UPCOMING:
    "You're all set for now! No quizzes are scheduled. Keep exploring and stay sharp!",
  ACTIVE:
    "You're not taking any quizzes at the moment. Ready to test your knowledge? Jump into a new challenge!",
  COMPLETED:
    "It looks like you haven't completed any quizzes. Start one today and track your progress!",
};

const QuizList = ({navigation}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredQuizIds, setRegisteredQuizIds] = useState({});
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [countdowns, setCountdowns] = useState({});
  const [userQuizAttempts, setUserQuizAttempts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [paymentModal, setPaymentModal] = useState({
    visible: false,
    selectedQuiz: null
  });
  const fetchUserData = useCallback(async () => {
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const decodedToken = jwtDecode(parsedData.token);
        setCurrentUserId(decodedToken.userId);
      }

      // Fetch registered quizzes from the server
      const registeredResponse = await fetchUserRegisteredQuizzesApi();
      setRegisteredQuizIds(registeredResponse.data.registeredQuizIds || []);

      // Fetch user quiz attempts
      const attemptsResponse = await fetchUserQuizAttemptsApi();
      setUserQuizAttempts(attemptsResponse.data.attempts);

      // Fetch quizzes
      await fetchQuizzes();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsInitialLoading(false);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Update the useEffect to use the callback
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, activeTab]);

  // Now handlePaymentSuccess can safely use fetchUserData
  const handlePaymentSuccess = () => {
    fetchUserData(); // This will work now
  };

  useEffect(() => {
    const fetchUserQuizAttempts = async () => {
      try {
        const response = await fetchUserQuizAttemptsApi();
        setUserQuizAttempts(response.data.attempts);
      } catch (error) {
        console.error('Error fetching user quiz attempts:', error);
        // Optionally show an error toast or notification
      }
    };

    fetchUserQuizAttempts();
    fetchQuizzes(); // Your existing method to fetch quizzes
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateCountdowns, 1000);
    return () => clearInterval(intervalId);
  }, [quizzes, registeredQuizIds]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const response = await listAllQuizEventsApi(1, 10);
      const sortedQuizzes = response.data.quizzes.sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
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
    const currentTime = new Date().getTime();

    quizzes.forEach(quiz => {
      const startTime = new Date(quiz.startTime).getTime();
      const endTime = new Date(quiz.endTime).getTime();

      if (registeredQuizIds.includes(quiz._id)) {
        // Check if the quiz is currently active
        if (startTime <= currentTime && endTime >= currentTime) {
          let distance = endTime - currentTime;

          if (distance > 0) {
            let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let hours = Math.floor(
              (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            let minutes = Math.floor(
              (distance % (1000 * 60 * 60)) / (1000 * 60),
            );
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            updatedCountdowns[
              quiz._id
            ] = `Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
          } else {
            updatedCountdowns[quiz._id] = 'Quiz Ended';
          }
        } else if (startTime > currentTime) {
          let distance = startTime - currentTime;

          let days = Math.floor(distance / (1000 * 60 * 60 * 24));
          let hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          let seconds = Math.floor((distance % (1000 * 60)) / 1000);

          updatedCountdowns[
            quiz._id
          ] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
          updatedCountdowns[quiz._id] = 'Quiz Ended';
        }
      }
    });

    setCountdowns(updatedCountdowns);
  };

  const handleRegister = async quizId => {
    Alert.alert(
      'Register',
      'Are you sure you want to register?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await registerForQuizApi(quizId);
              // Update registered quizzes immediately after successful registration
              setRegisteredQuizIds(prev => [...prev, quizId]);
            } catch (error) {
              console.error('Registration failed:', error);
              Alert.alert(
                'Error',
                'Failed to register for the quiz. Please try again.',
              );
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleStartQuiz = async quizId => {
    try {
      const response = await startQuizAttemptApi(quizId);

      // Navigate to quiz screen
      navigation.navigate('QuizScreen', {
        quizId: quizId,
        attemptId: response.data.attemptId,
      });
    } catch (error) {
      console.error('Error starting quiz:', error);

      // Check for specific error about existing attempt
      if (
        error.response &&
        error.response.data.error === 'QUIZ_ATTEMPT_EXISTS'
      ) {
        Alert.alert(
          'Quiz Attempt Exists',
          'You have already started or completed this quiz. You cannot attempt it again.',
          [{text: 'OK'}],
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to start the quiz. Please try again later.',
        );
      }
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const currentTime = new Date().getTime();
    const startTime = new Date(quiz.startTime).getTime();
    const endTime = new Date(quiz.endTime).getTime();

    // Check if user has already attempted this quiz
    const hasAttempted = userQuizAttempts.some(
      attempt => attempt.quiz === quiz._id,
    );

    const isRegistered = registeredQuizIds.includes(quiz._id);

    switch (activeTab) {
      case TABS.UPCOMING:
        return matchesSearch && startTime > currentTime && !hasAttempted;

      case TABS.ACTIVE:
        return (
          matchesSearch &&
          startTime <= currentTime &&
          endTime >= currentTime &&
          !hasAttempted &&
          isRegistered
        );

      case TABS.COMPLETED:
        return matchesSearch && (endTime < currentTime || hasAttempted);

      default:
        return false;
    }
  });

  const handleViewLeaderboard = quizId => {
    setSelectedQuizId(quizId);
    setIsLeaderboardVisible(true);
  };

  const renderQuizCard = ({item}) => {
    const isRegistered = registeredQuizIds.includes(item._id);
    const countdown = countdowns[item._id];
    const quizDate = new Date(item.startTime);
    const formattedDate = moment(item.startTime).format('DD/MM/YYYY');
    const formattedTime = moment(item.startTime).format('HH:mm');
    const hasStarted =
      countdown &&
      !countdown.startsWith('Quiz Ended') &&
      countdown.includes('Ends in:');
    const hasAttempted = userQuizAttempts.some(
      attempt => attempt.quiz === item._id && attempt.isCompleted,
    );
    const currentTime = new Date().getTime();
    const endTime = new Date(item.endTime).getTime();
    const isQuizEnded = currentTime > endTime;
    const hasPaid = item.participants?.some(
      p => p.userId === currentUserId && p.hasPaid
    );

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => navigation.navigate('QuizDetails', {quizId: item._id})}>
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
            {item.title}
          </Text>
          <Text
            variant="regular16"
            color={COLORS.blue043142}
            style={styles.quizSubtitle}>
            {item.description}
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

          {activeTab === TABS.COMPLETED ? (
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => handleViewLeaderboard(item._id)}>
              <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                View Leaderboard
              </Text>
            </TouchableOpacity>
          ): item.isPaid && !hasPaid ? (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => setPaymentModal({
                visible: true,
                selectedQuiz: item
              })}>
              <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                Pay ₹{item.entryFee}
              </Text>
            </TouchableOpacity>
          )
           : isRegistered && !hasAttempted ? (
            <>
              <View style={styles.registeredBadge}>
                <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                  {countdown}
                </Text>
              </View>
              {hasStarted && (
                <TouchableOpacity
                  style={styles.startQuizButton}
                  onPress={() => handleStartQuiz(item._id)}>
                  <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                    Start Quiz
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : isQuizEnded || hasAttempted ? null : (
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

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={EmptyStateImages[activeTab]}
        style={styles.emptyStateImage}
      />
      <Text
        variant="semibold20"
        color={COLORS.blue043142}
        style={styles.emptyStateTitle}>
        {`No ${activeTab.toLowerCase()} Quizzes`}
      </Text>
      <Text
        variant="regular16"
        color={COLORS.blue043142}
        style={styles.emptyStateMessage}>
        {EmptyStateMessages[activeTab]}
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('ExploreContent')}>
        <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
          Explore Content
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isInitialLoading) {
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

      <View style={styles.tabContainer}>
        {Object.values(TABS).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}>
            <Text
              variant={activeTab === tab ? 'semibold14' : 'regular14'}
              color={
                activeTab === tab ? COLORS.yellowF5BE00 : COLORS.grey999999
              }>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchQuizzes();
            }}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
      />

      <LeaderboardModal
        visible={isLeaderboardVisible}
        onClose={() => setIsLeaderboardVisible(false)}
        quizId={selectedQuizId}
      />

      <PaymentModal
            visible={paymentModal.visible}
            onClose={() => setPaymentModal({ visible: false, selectedQuiz: null })}
            quiz={paymentModal.selectedQuiz}
            onPaymentSuccess={handlePaymentSuccess}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: nh(30),
  },
  tab: {
    paddingVertical: nh(12),
    paddingHorizontal: nw(16),
    marginRight: nw(16),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.yellowF5BE00,
  },
  listContainer: {
    padding: nw(16),
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(16),
    marginTop: nh(10),
  },
  emptyStateImage: {
    width: nw(200),
    height: nh(200),
    marginBottom: nh(24),
  },
  emptyStateMessage: {
    textAlign: 'center',
    marginBottom: nh(24),
  },
  exploreButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(12),
    paddingHorizontal: nw(48),
    borderRadius: 8,
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(16),
    marginBottom: nh(16),
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  registeredBadge: {
    position: 'absolute',
    bottom: nh(1),
    right: nw(0),
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(8),
    paddingVertical: nh(6),
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: nh(-30),
  },
  startQuizButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: nh(8),
  },
  leaderboardButton: {
    position: 'absolute',
    bottom: nh(1),
    right: nw(0),
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(8),
    paddingVertical: nh(6),
    borderRadius: 8,
  },
  emptyStateTitle: {
    marginBottom: nh(8),
    textAlign: 'center',
  },
});

export default QuizList;
