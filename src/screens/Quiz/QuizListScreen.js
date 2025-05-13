import React, {useState, useEffect, useCallback, useMemo} from 'react';
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
  Dimensions,
  TextInput, // Import TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

// Using RN Text for this example (Your Text component)
const Text = ({children, style, variant, color, ...props}) => {
  let fontWeight = 'normal';
  let fontSize = 14;
  if (variant) {
    if (variant.includes('semibold')) fontWeight = '600';
    if (variant.includes('bold')) fontWeight = 'bold';
    if (variant.includes('10')) fontSize = 10;
    if (variant.includes('12')) fontSize = 12;
    if (variant.includes('14')) fontSize = 14;
    if (variant.includes('16')) fontSize = 16;
    if (variant.includes('18')) fontSize = 18;
    if (variant.includes('20')) fontSize = 20;
    if (variant.includes('24')) fontSize = 24;
  }
  return <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>{children}</RNText>;
};
import { Text as RNText } from 'react-native';


// Mock Header (Your Header component)
const Header = ({ title }) => (
  <View style={styles.mockHeader}>
    <Text variant="bold20" color={COLORS.whiteFFFFFF}>{title}</Text>
  </View>
);

// Mock CustomTextInput (Your CustomTextInput component wrapper)
const CustomTextInput = ({ placeholder, value, onChangeText }) => (
  <TextInput
    style={styles.mockTextInput}
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    placeholderTextColor={COLORS.grey999999}
  />
);


import {
  listAllQuizEventsApi,
  registerForQuizApi,
  startQuizAttemptApi,
  fetchUserQuizAttemptsApi,
  fetchUserRegisteredQuizzesApi,
} from '../../services/apiService'; // Assuming this path is correct
import QuizInfoModal from './QuizInfoModal'; // Assuming this path is correct
import LeaderboardModal from './LeaderboardModal'; // Assuming this path is correct

import Ionicons from 'react-native-vector-icons/Ionicons';

// Helper for responsive scaling
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const nw = (percentage) => (DEVICE_WIDTH * percentage) / 100;
const nh = (percentage) => (DEVICE_HEIGHT * percentage) / 100;

// Define COLORS or import them
const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  lightBlueE6F0FF: '#E6F0FF',
  darkGrey333333: '#333333',
};

const TABS = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

const EmptyStateConfig = {
  [TABS.UPCOMING]: {
    image: require('../../assets/images/intro4.png'), // Replace with your actual asset
    title: "No Upcoming Quizzes",
    message: "Nothing on the horizon yet! Explore other sections or check back soon for new challenges.",
    icon: "calendar-outline"
  },
  [TABS.ACTIVE]: {
    image: require('../../assets/images/intro4.png'), // Replace with your actual asset
    title: "No Active Quizzes",
    message: "No quizzes live right now. Why not browse upcoming ones or review your past triumphs?",
    icon: "play-circle-outline"
  },
  [TABS.COMPLETED]: {
    image: require('../../assets/images/intro4.png'), // Replace with your actual asset
    title: "No Quizzes Attempted",
    message: "You haven't attempted any quizzes yet. Jump into one and track your progress here!",
    icon: "checkmark-done-circle-outline"
  },
};


const QuizList = ({navigation, route}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(
    route?.params?.from === 'popup' ? TABS.ACTIVE : TABS.UPCOMING,
  );
  const [isLoading, setIsLoading] = useState(true); // For pull-to-refresh and general loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial screen load
  const [registeredQuizIds, setRegisteredQuizIds] = useState([]);
  const [userQuizAttempts, setUserQuizAttempts] = useState([]); // Array of attempt objects

  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isQuizInfoVisible, setIsQuizInfoVisible] = useState(false);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);
  const [countdowns, setCountdowns] = useState({});

  // Combined data fetching logic
  const loadInitialData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsInitialLoading(true);
    else setIsLoading(true);

    try {
      const [registeredResponse, attemptsResponse, quizzesResponse] = await Promise.all([
        fetchUserRegisteredQuizzesApi(),
        fetchUserQuizAttemptsApi(),
        listAllQuizEventsApi(1, 100, true), // Consider pagination for large datasets
      ]);

      setRegisteredQuizIds(registeredResponse.data.registeredQuizIds || []);
      // Ensure userQuizAttempts is always an array
      setUserQuizAttempts(Array.isArray(attemptsResponse.data.attempts) ? attemptsResponse.data.attempts : []);
      
      const sortedQuizzes = (quizzesResponse.data.quizzes || []).sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime), // Default sort by start time
      );
      setQuizzes(sortedQuizzes);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert("Error", "Could not load quiz data. Please try again.");
    } finally {
      if (!isRefresh) setIsInitialLoading(false);
      setIsLoading(false);
      if (isRefresh) setIsRefreshing(false); // For RefreshControl
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Load data on initial mount


  // Countdown timer logic
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = {};
      const now = moment();

      quizzes.forEach(quiz => {
        const startTime = moment(quiz.startTime);
        const endTime = moment(quiz.endTime);

        if (registeredQuizIds.includes(quiz._id)) {
          if (now.isBetween(startTime, endTime)) { // Active
            const duration = moment.duration(endTime.diff(now));
            if (duration.asSeconds() > 0) {
              newCountdowns[quiz._id] = `Ends in: ${formatDuration(duration)}`;
            } else {
              newCountdowns[quiz._id] = 'Quiz Ended';
            }
          } else if (now.isBefore(startTime)) { // Upcoming for registered
            const duration = moment.duration(startTime.diff(now));
            newCountdowns[quiz._id] = `Starts in: ${formatDuration(duration)}`;
          } else { // Ended
            newCountdowns[quiz._id] = 'Quiz Ended';
          }
        }
      });
      setCountdowns(newCountdowns);
    };

    const intervalId = setInterval(updateCountdowns, 1000);
    updateCountdowns(); // Initial call
    return () => clearInterval(intervalId);
  }, [quizzes, registeredQuizIds]); // Dependencies for countdown

  const formatDuration = (duration) => {
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    if (seconds > 0) return `${seconds}s`;
    return 'Ending soon';
  };
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadInitialData(true); // Pass true to indicate it's a refresh
  }, [loadInitialData]);


  const handleRegister = async (quizId) => {
    Alert.alert(
      'Confirm Registration',
      'Are you sure you want to register for this quiz?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes, Register',
          onPress: async () => {
            try {
              setIsLoading(true);
              await registerForQuizApi(quizId);
              setRegisteredQuizIds(prev => [...prev, quizId]); // Optimistic update
              Alert.alert('Success', 'Successfully registered for the quiz!');
              await loadInitialData(true); // Refresh to get latest server state
            } catch (error) {
              console.error('Registration failed:', error);
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Failed to register. Please try again.',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleStartQuiz = async (quiz) => {
    const now = moment();
    const startTime = moment(quiz.startTime);
    const endTime = moment(quiz.endTime);

    if (now.isBefore(startTime)) {
        Alert.alert("Quiz Not Started", "This quiz has not started yet. Please wait for the start time.");
        return;
    }
    if (now.isAfter(endTime)) { // Should ideally be caught by ACTIVE tab logic, but good safeguard
        Alert.alert("Quiz Ended", "This quiz has already ended.");
        return;
    }

    try {
      setIsLoading(true);
      const response = await startQuizAttemptApi(quiz._id);
      navigation.navigate('QuizScreen', { // Ensure 'QuizScreen' is correct
        quizId: quiz._id,
        attemptId: response.data.attemptId,
        quizTitle: quiz.title,
        quizDuration: quiz.duration, // Assuming quiz object has duration
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      if (error.response && error.response.data.error === 'QUIZ_ATTEMPT_EXISTS') {
        Alert.alert(
          'Attempt Exists',
          'You have already attempted this quiz.',
          // Refresh data, as this quiz might now move to the "Completed" tab
          [{text: 'OK', onPress: () => loadInitialData(true) }], 
        );
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to start the quiz.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoPress = (quiz) => {
    setSelectedQuizInfo(quiz.quizInfo || { rules: [], rankWisePrizes: [] });
    setIsQuizInfoVisible(true);
  };

  const handleViewLeaderboard = (quizId) => {
    setSelectedQuizId(quizId);
    setIsLeaderboardVisible(true);
  };

  // Memoized filtered quizzes for performance
  const filteredQuizzes = useMemo(() => {
    const now = moment();
    let processedQuizzes = quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      const startTime = moment(quiz.startTime);
      const endTime = moment(quiz.endTime);
      const hasAttempted = userQuizAttempts.some(attempt => attempt.quiz === quiz._id); 
      const isRegistered = registeredQuizIds.includes(quiz._id);

      switch (activeTab) {
        case TABS.UPCOMING:
          return now.isBefore(startTime) && !hasAttempted; 
        case TABS.ACTIVE:
          return now.isBetween(startTime, endTime) && isRegistered && !hasAttempted;
        case TABS.COMPLETED:
          return hasAttempted; 
        default:
          return false;
      }
    });

    // Sort COMPLETED quizzes by latest attempt
    if (activeTab === TABS.COMPLETED) {
      processedQuizzes.sort((quizA, quizB) => {
        // Find the latest attempt for each quiz.
        // IMPORTANT: Replace 'attemptTimestamp' with the actual field in your userQuizAttempts objects
        // that indicates when the attempt was made or completed (e.g., 'completedAt', 'updatedAt', 'createdAt').
        const latestAttemptA = userQuizAttempts
          .filter(attempt => attempt.quiz === quizA._id)
          .sort((att1, att2) => moment(att2.attemptTimestamp).diff(moment(att1.attemptTimestamp)))[0];
        
        const latestAttemptB = userQuizAttempts
          .filter(attempt => attempt.quiz === quizB._id)
          .sort((att1, att2) => moment(att2.attemptTimestamp).diff(moment(att1.attemptTimestamp)))[0];

        const timeA = latestAttemptA ? moment(latestAttemptA.attemptTimestamp) : moment(quizA.endTime); // Fallback
        const timeB = latestAttemptB ? moment(latestAttemptB.attemptTimestamp) : moment(quizB.endTime); // Fallback

        return timeB.diff(timeA); // Sorts in descending order (latest first)
      });
    }
    return processedQuizzes;
  }, [quizzes, searchQuery, activeTab, userQuizAttempts, registeredQuizIds]);

  const renderQuizCard = ({item}) => {
    const isRegistered = registeredQuizIds.includes(item._id);
    const countdownText = countdowns[item._id];
    const now = moment();
    const startTime = moment(item.startTime);
    const endTime = moment(item.endTime);

    const hasAttempted = userQuizAttempts.some(attempt => attempt.quiz === item._id);
    // Ensure 'isCompleted' field exists in your attempt objects if you use this differentiation
    const isFullyCompleted = userQuizAttempts.some(attempt => attempt.quiz === item._id && attempt.isCompleted); 
    const isQuizOver = now.isAfter(endTime);
    
    let cardStatusText = '';
    let statusColor = COLORS.grey999999;
    let statusIcon = "help-circle-outline";

    if (activeTab === TABS.COMPLETED) {
        cardStatusText = isFullyCompleted ? 'Completed' : 'Attempted';
        statusColor = isFullyCompleted ? COLORS.greenSuccess : COLORS.blue043142;
        statusIcon = "checkmark-done-outline";
    } else if (hasAttempted) { 
        cardStatusText = 'Attempt In Progress'; // Or 'View Attempt' if they can resume
        statusColor = COLORS.blue043142; 
        statusIcon = "refresh-outline"; 
    } else if (now.isBetween(startTime, endTime)) { 
        cardStatusText = isRegistered ? (countdownText || 'Active') : 'Active Now';
        statusColor = COLORS.greenSuccess;
        statusIcon = "play-circle-outline";
    } else if (now.isBefore(startTime)) { 
        cardStatusText = isRegistered ? (countdownText || 'Upcoming') : 'Upcoming';
        statusColor = COLORS.yellowF5BE00;
        statusIcon = "alarm-outline";
    } else if (isQuizOver) { 
        cardStatusText = 'Ended';
        statusColor = COLORS.redError;
        statusIcon = "timer-off-outline";
    }
    
    const displayStatusText = (isRegistered && countdownText && activeTab !== TABS.COMPLETED) ? countdownText : cardStatusText;

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => navigation.navigate('QuizDetails', {quizId: item._id, quizTitle: item.title})}
        activeOpacity={0.8}>
        
        {item.isPaid && (
          <View style={styles.quizTypeMarker}>
            <Ionicons name="cash-outline" size={14} color={COLORS.whiteFFFFFF} />
            <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 4}}>
              Cash Prize
            </Text>
          </View>
        )}

        {isRegistered && activeTab !== TABS.COMPLETED && !hasAttempted && (
             <View style={styles.registeredBadgeTopRight}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.greenSuccess} />
                <Text variant="semibold10" color={COLORS.greenSuccess} style={{marginLeft: 4}}>Registered</Text>
            </View>
        )}

        {/* Card Header: Icon, Title, Info Button */}
        <View style={styles.cardHeader}>
            <Image
                source={item.imageUrl || require('../../assets/images/image.png')} // Replace with your actual asset
                style={styles.quizIcon}
                resizeMode="cover"
            />
            {/* Title container allows title to take space but not overlap info icon */}
            <View style={styles.quizTitleContainer}>
                <Text variant="semibold16" color={COLORS.blue043142} numberOfLines={2}>
                {item.title}
                </Text>
                <Text variant="regular12" color={COLORS.grey999999} numberOfLines={1} style={{marginTop: 2}}>
                {item.category || 'General Knowledge'}
                </Text>
            </View>
            {/* Info icon, absolutely positioned to the right of the header */}
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleInfoPress(item); }} style={styles.infoIconTouchable}>
                <Ionicons name="information-circle-outline" size={26} color={COLORS.blue043142} />
            </TouchableOpacity>
        </View>

        <Text variant="regular14" color={COLORS.darkGrey333333} style={styles.quizDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.dateTimeAndStatusContainer}>
            <View style={styles.dateTimeItem}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.blue043142} />
                <Text variant="regular12" color={COLORS.blue043142} style={{marginLeft: 6}}>
                {moment(item.startTime).format('MMM DD, YYYY')}
                </Text>
            </View>
            <View style={styles.dateTimeItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.blue043142} />
                <Text variant="regular12" color={COLORS.blue043142} style={{marginLeft: 6}}>
                {moment(item.startTime).format('hh:mm A')}
                </Text>
            </View>
        </View>

        {/* Status Display Bar */}
        {displayStatusText && (
        <View style={[styles.statusDisplayContainer, { backgroundColor: statusColor }]}>
            <Ionicons 
                name={statusIcon} 
                size={16} 
                color={COLORS.whiteFFFFFF} 
            />
            <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 6}}>
            {displayStatusText}
            </Text>
        </View>
        )}

        {/* Action Buttons Area */}
        <View style={styles.actionButtonsContainer}>
          {activeTab === TABS.COMPLETED ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaderboardButton]}
              onPress={(e) => { e.stopPropagation(); handleViewLeaderboard(item._id); }}>
              <Ionicons name="trophy-outline" size={18} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
                View Leaderboard
              </Text>
            </TouchableOpacity>
          ) : isRegistered ? (
            now.isBetween(startTime, endTime) && !hasAttempted ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.startQuizButton]}
                onPress={(e) => { e.stopPropagation(); handleStartQuiz(item); }}>
                <Ionicons name="play-circle-outline" size={18} color={COLORS.whiteFFFFFF} />
                <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
                  Start Quiz
                </Text>
              </TouchableOpacity>
            ) : null 
          ) : ( 
            now.isBefore(startTime) && !isQuizOver && !hasAttempted ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.registerButton]}
              onPress={(e) => { e.stopPropagation(); handleRegister(item._id); }}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
                Register Now
              </Text>
            </TouchableOpacity>
          ) : null)}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const config = EmptyStateConfig[activeTab];
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name={config.icon} size={nw(20)} color={COLORS.grey999999} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.emptyStateTitle}>
          {config.title}
        </Text>
        <Text variant="regular16" color={COLORS.darkGrey333333} style={styles.emptyStateMessage}>
          {config.message}
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate('ExploreContent')}>
          <Ionicons name="search-outline" size={20} color={COLORS.whiteFFFFFF} />
          <Text variant="semibold16" color={COLORS.whiteFFFFFF} style={{marginLeft: 10}}>
            Explore Content
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text variant="regular16" color={COLORS.blue043142} style={{marginTop: 16}}>Loading Quizzes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <ImageBackground
            source={require('../../assets/images/Ellipse.png')} // Replace with your actual asset
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImageStyle}
            resizeMode="cover">
            <Header title="Quizzes" />
            {/* Search Bar */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color={COLORS.grey999999} style={styles.searchIcon} />
                <CustomTextInput
                    placeholder={`Search in ${activeTab.toLowerCase()} quizzes...`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </ImageBackground>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {Object.values(TABS).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab);
            }}>
            <Text
              variant={activeTab === tab ? 'semibold14' : 'regular14'}
              color={activeTab === tab ? COLORS.yellowF5BE00 : COLORS.grey999999}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inline loading indicator for tab switches or non-initial loads */}
      {isLoading && !isInitialLoading && !isRefreshing && (
        <ActivityIndicator style={styles.inlineLoading} size="small" color={COLORS.yellowF5BE00} />
      )}

      {/* Quiz List */}
      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizCard}
        keyExtractor={item => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null} // Show empty state only when not loading
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00, COLORS.blue043142]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
      />

      {/* Modals */}
      {selectedQuizId && <LeaderboardModal
        visible={isLeaderboardVisible}
        onClose={() => setIsLeaderboardVisible(false)}
        quizId={selectedQuizId}
      />}
      {selectedQuizInfo && <QuizInfoModal
        visible={isQuizInfoVisible}
        onClose={() => setIsQuizInfoVisible(false)}
        quizInfo={selectedQuizInfo}
      />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  inlineLoading: { // For loading indicator during tab switches etc.
    marginVertical: nh(2),
    alignSelf: 'center',
  },
  mockHeader: { 
    paddingVertical: nh(1), 
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: nh(6), 
    justifyContent: 'center',
  },
  mockTextInput: { 
    flex: 1,
    height: '100%',
    paddingLeft: nw(2.5), 
    fontSize: 14,
    color: COLORS.blue043142,
  },
  headerContainer: {
    backgroundColor: COLORS.blue043142, // Fallback if image fails
  },
  headerBackground: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : nh(3),
    paddingBottom: nh(5), 
    justifyContent: 'space-between',
  },
  headerBackgroundImageStyle: {
    opacity: 0.9, 
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 25,
    marginHorizontal: nw(4),
    marginTop: nh(1), 
    paddingHorizontal: nw(3.5),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: nh(5.5),
  },
  searchIcon: {
    marginRight: nw(2),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  tab: {
    flex: 1,
    paddingVertical: nh(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.yellowF5BE00,
  },
  listContainer: {
    paddingHorizontal: nw(3.5), 
    paddingTop: nh(2),
    paddingBottom: nh(10), // Ensure space for last card
    flexGrow: 1,
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(3.5), 
    marginBottom: nh(2),
    elevation: 3, 
    shadowColor: COLORS.blue043142,
    shadowOffset: {width: 0, height: 2}, 
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    position: 'relative', 
  },
  quizTypeMarker: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.7),
    borderTopLeftRadius: 12, 
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  registeredBadgeTopRight: {
    position: 'absolute',
    top: nh(1),     
    right: nw(3.5), 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(2),
    paddingVertical: nh(0.5),
    borderRadius: 10,
    zIndex: 1,
    elevation: 1, 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(3.5), // Space for badges above
    marginBottom: nh(1.5),
    position: 'relative', // Needed for absolute positioning of infoIconTouchable within
  },
  quizIcon: {
    width: nw(13),
    height: nw(13),
    borderRadius: 8,
    marginRight: nw(3.5), 
    backgroundColor: COLORS.greyEEEEEE, // Placeholder color
  },
  quizTitleContainer: {
    flex: 1, // Takes available space
    marginRight: nw(8), // Increased margin to avoid overlap with info icon
  },
  infoIconTouchable: {
    position: 'absolute', // Positioned relative to cardHeader
    top: 0,
    right: 0,
    padding: nw(1), // Larger touch area
    zIndex: 2, // Ensure it's above title if somehow they still fight for space
  },
  quizDescription: {
    marginBottom: nh(1.5),
    lineHeight: 20,
  },
  dateTimeAndStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(1.5),
    paddingVertical: nh(1.2), 
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, 
  },
  statusDisplayContainer: { 
    paddingVertical: nh(1),
    paddingHorizontal: nw(3),
    borderRadius: 20, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start', // Don't stretch full width
    marginBottom: nh(1.5),
    marginTop: nh(0.5),
  },
  actionButtonsContainer: {
    marginTop: nh(1.5), 
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(1.5),
    borderRadius: 8,
    marginTop: nh(1),
  },
  registerButton: {
    backgroundColor: COLORS.blue043142,
  },
  startQuizButton: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  leaderboardButton: {
    backgroundColor: COLORS.blue043142, 
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(8), 
    marginTop: nh(2), 
    paddingBottom: nh(5),
  },
  emptyStateTitle: {
    marginBottom: nh(1.5),
    textAlign: 'center',
  },
  emptyStateMessage: {
    textAlign: 'center',
    marginBottom: nh(4),
    lineHeight: 22,
    color: COLORS.darkGrey333333,
  },
  exploreButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(1.5),
    paddingHorizontal: nw(10),
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default QuizList;
