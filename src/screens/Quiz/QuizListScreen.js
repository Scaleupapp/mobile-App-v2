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
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import PaymentOptionsModal from './PaymentOptionsModal';
import LinearGradient from 'react-native-linear-gradient';
import {useSelector, useDispatch} from 'react-redux';
import {actions} from '../../redux/reducers';
import {useFocusEffect} from '@react-navigation/native';

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
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

// Mock Header (Your Header component)
const Header = ({title, rightComponent}) => (
  <View style={styles.headerContainer}>
    <Text variant="bold20" color={COLORS.whiteFFFFFF}>
      {title}
    </Text>
    {rightComponent && <View style={styles.headerRight}>{rightComponent}</View>}
  </View>
);

// Mock CustomTextInput (Your CustomTextInput component wrapper)
const CustomTextInput = ({placeholder, value, onChangeText}) => (
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
  getPublicQuizzesApi,
  registerForQuizApi,
  startQuizAttemptApi,
  fetchUserQuizAttemptsApi,
  fetchUserRegisteredQuizzesApi,
  checkUserPaymentDetailsApi,
  saveUserUpiDetailsApi,
  saveUserBankDetailsApi,
  requestQuizAccessApi,
  getMyAccessRequestsApi,
  getQuizByShareIdApi,
  checkUserQuizAccessApi,
} from '../../services/apiService';
import QuizInfoModal from './QuizInfoModal';
import LeaderboardModal from './LeaderboardModal';
import Routes from '../../helper/routes';

import Ionicons from 'react-native-vector-icons/Ionicons';
import mixpanel from '../../helper/mixpanelClient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Helper for responsive scaling
const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

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
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
  orangeWarning: '#FFA500',
};

const TABS = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

const EmptyStateConfig = {
  [TABS.UPCOMING]: {
    image: require('../../assets/images/intro4.png'),
    title: 'No Upcoming Quizzes',
    message:
      'Nothing on the horizon yet! Explore other sections or check back soon for new challenges.',
    icon: 'calendar-outline',
  },
  [TABS.ACTIVE]: {
    image: require('../../assets/images/intro4.png'),
    title: 'No Active Quizzes',
    message:
      'No quizzes live right now. Why not browse upcoming ones or review your past triumphs?',
    icon: 'play-circle-outline',
  },
  [TABS.COMPLETED]: {
    image: require('../../assets/images/intro4.png'),
    title: 'No Quizzes Attempted',
    message:
      "You haven't attempted any quizzes yet. Jump into one and track your progress here!",
    icon: 'checkmark-done-circle-outline',
  },
};

const QuizList = ({navigation, route}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(
    route?.params?.from === 'popup' ? TABS.ACTIVE : TABS.UPCOMING,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [registeredQuizIds, setRegisteredQuizIds] = useState([]);
  const [userQuizAttempts, setUserQuizAttempts] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isQuizInfoVisible, setIsQuizInfoVisible] = useState(false);
  const [selectedQuizInfo, setSelectedQuizInfo] = useState(null);
  const [countdowns, setCountdowns] = useState({});
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [pendingQuizRegistration, setPendingQuizRegistration] = useState(null);
  const [requestedAccessIds, setRequestedAccessIds] = useState([]);
  const [hasCreatedQuizzes, setHasCreatedQuizzes] = useState(false);
  const [accessRequestStatuses, setAccessRequestStatuses] = useState({});

  // Redux hooks
  const userdata = useSelector(state => state.userData);
  const dispatch = useDispatch();

  // Function to check if user has created quizzes
  const checkQuizCreatorStatus = useCallback(async () => {
    try {
      // Don't call the API if user already has isQuizCreator set
      if (userdata?.isQuizCreator) {
        setHasCreatedQuizzes(true);
        return;
      }

      // For now, we'll rely on the quiz data fetched in loadInitialData
      // to determine if the user has created quizzes
      // This avoids the API routing issue
      console.log('Quiz creator status will be checked from fetched quiz data');
    } catch (error) {
      console.log('Error checking creator status:', error);
    }
  }, [userdata]);

  // Load access requests
  const loadAccessRequests = useCallback(async () => {
    try {
      const response = await getMyAccessRequestsApi('all', 1, 20);
      const statuses = {};

      response.data.data.requests.forEach(request => {
        statuses[request.quiz.id] = {
          status: request.request.status,
          message: request.request.processNote,
          requestedAt: request.request.requestedAt,
        };
      });

      setAccessRequestStatuses(statuses);
    } catch (error) {
      console.log('Error loading access requests:', error);
    }
  }, []);

  const loadInitialData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setIsInitialLoading(true);
      else setIsLoading(true);

      try {
        // Check quiz creator status first
        await checkQuizCreatorStatus();

        const [
          registeredResponse,
          attemptsResponse,
          platformQuizzesResponse,
          userQuizzesResponse,
        ] = await Promise.all([
          fetchUserRegisteredQuizzesApi(),
          fetchUserQuizAttemptsApi(),
          listAllQuizEventsApi(1, 100, true),
          getPublicQuizzesApi({
            page: 1,
            limit: 100,
            sortBy: 'upcoming',
          }).catch(() => ({data: {data: {quizzes: []}}})),
        ]);
        setUserQuizAttempts(attemptsResponse.data.attempts || []);

        // Load access requests
        await loadAccessRequests();

        // Set registered quiz IDs with proper formatting
        const registeredIds = (
          registeredResponse.data.registeredQuizIds || []
        ).map(id => {
          return typeof id === 'string' ? id : String(id);
        });

        // console.log('Registered Quiz IDs after loading:', registeredIds);
        setRegisteredQuizIds(registeredIds);

        const platformQuizzes = (
          platformQuizzesResponse.data.quizzes || []
        ).map(quiz => ({
          ...quiz,

          creatorUsername: quiz.isUserGenerated
            ? quiz.creator?.username || 'Community Creator'
            : 'ScaleUp Official',
        }));

        const userGeneratedQuizzes = (
          userQuizzesResponse.data?.data?.quizzes || []
        ).map(quiz => ({
          ...quiz,
          _id: quiz.id || quiz._id,
          isUserGenerated: true,
          creatorUsername: quiz.creator?.username || 'Community Creator',
          creatorId: quiz.creator?.id,
          uniqueShareId: quiz.shareId,
          questionPoolSize: quiz.questionPool,
          questionsPerAttempt: quiz.questionsPerAttempt,
          totalAttempts: quiz.statistics?.attempts || 0,
          averageRating: quiz.statistics?.rating || 0,
          ratingCount: quiz.statistics?.ratingCount || 0,
          coverImage: quiz.coverImage,
          visibility: quiz.visibility || 'public',
        }));

        // Check if current user has created any quizzes from the fetched data
        const userId = userdata?._id || userdata?.id;
        if (userId && userGeneratedQuizzes.length > 0) {
          const userCreatedQuizzes = userGeneratedQuizzes.filter(
            quiz => quiz.creatorId === userId || quiz.creator?.id === userId,
          );
          const hasQuizzes = userCreatedQuizzes.length > 0;

          if (hasQuizzes && !hasCreatedQuizzes) {
            setHasCreatedQuizzes(true);

            // Update Redux if needed
            if (!userdata?.isQuizCreator) {
              const updatedUserData = {
                ...userdata,
                isQuizCreator: true,
              };
              dispatch(actions.setUserData(updatedUserData));

              // Also update AsyncStorage
              AsyncStorage.getItem('userData')
                .then(storedData => {
                  if (storedData) {
                    const parsed = JSON.parse(storedData);
                    AsyncStorage.setItem(
                      'userData',
                      JSON.stringify({
                        ...parsed,
                        isQuizCreator: true,
                      }),
                    );
                  }
                })
                .catch(err => console.log('Error updating AsyncStorage:', err));
            }
          }
        }

        const allQuizzes = [...platformQuizzes, ...userGeneratedQuizzes];

        // FIX for "Duplicate Key" warning
        const uniqueQuizzes = Array.from(
          new Map(allQuizzes.map(quiz => [quiz._id, quiz])).values(),
        );

        const sortedQuizzes = uniqueQuizzes.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime),
        );

        setQuizzes(sortedQuizzes);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Could not load quiz data. Please try again.');
      } finally {
        if (!isRefresh) setIsInitialLoading(false);
        setIsLoading(false);
        if (isRefresh) setIsRefreshing(false);
      }
    },
    [
      checkQuizCreatorStatus,
      userdata,
      dispatch,
      hasCreatedQuizzes,
      loadAccessRequests,
    ],
  );

  // refresh every time the screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      loadInitialData(true); // small spinner refresh
    }, [loadInitialData]),
  );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    mixpanel.track('Landed Quiz Page');
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = {};
      const now = moment();

      quizzes.forEach(quiz => {
        const startTime = moment(quiz.startTime);
        const endTime = moment(quiz.endTime);
        const accessRequestInfo = accessRequestStatuses[quiz._id];

        if (
          registeredQuizIds.includes(quiz._id) ||
          accessRequestInfo?.status === 'approved'
        ) {
          if (now.isBetween(startTime, endTime)) {
            const duration = moment.duration(endTime.diff(now));
            if (duration.asSeconds() > 0) {
              newCountdowns[quiz._id] = `Ends in: ${formatDuration(duration)}`;
            } else {
              newCountdowns[quiz._id] = 'Quiz Ended';
            }
          } else if (now.isBefore(startTime)) {
            const duration = moment.duration(startTime.diff(now));
            newCountdowns[quiz._id] = `Starts in: ${formatDuration(duration)}`;
          } else {
            newCountdowns[quiz._id] = 'Quiz Ended';
          }
        }
      });
      setCountdowns(newCountdowns);
    };

    const intervalId = setInterval(updateCountdowns, 1000);
    updateCountdowns();
    return () => clearInterval(intervalId);
  }, [quizzes, registeredQuizIds, accessRequestStatuses]);

  const formatDuration = duration => {
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
    loadInitialData(true);
  }, [loadInitialData]);

  const handleSaveUPI = async upiId => {
    try {
      setIsLoading(true);
      await saveUserUpiDetailsApi(upiId);
      setIsPaymentModalVisible(false);

      if (pendingQuizRegistration) {
        Alert.alert(
          'Payment Details Saved',
          'Your UPI details have been saved. Would you like to proceed with quiz registration?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Continue Registration',
              onPress: () => handleRegister(pendingQuizRegistration),
            },
          ],
        );
        setPendingQuizRegistration(null);
      }
    } catch (error) {
      console.error('Error saving UPI details:', error);
      Alert.alert('Error', 'Failed to save UPI details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBankDetails = async bankDetails => {
    try {
      setIsLoading(true);
      await saveUserBankDetailsApi(bankDetails);
      setIsPaymentModalVisible(false);

      if (pendingQuizRegistration) {
        Alert.alert(
          'Payment Details Saved',
          'Your bank details have been saved. Would you like to proceed with quiz registration?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Continue Registration',
              onPress: () => handleRegister(pendingQuizRegistration),
            },
          ],
        );
        setPendingQuizRegistration(null);
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', 'Failed to save bank details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async quizId => {
    try {
      const quiz = quizzes.find(
        q => q._id === quizId || q._id.toString() === quizId,
      );

      if (!quiz) {
        Alert.alert('Error', 'Quiz not found');
        return;
      }

      console.log('Registering for quiz:', {
        quizId,
        isUserGenerated: quiz.isUserGenerated,
        visibility: quiz.visibility,
        isPaid: quiz.isPaid,
      });

      // Handle private quiz logic
      if (quiz && quiz.isUserGenerated && quiz.visibility === 'private') {
        const accessStatus = accessRequestStatuses[quizId];
        if (accessStatus) {
          if (accessStatus.status === 'pending') {
            Alert.alert('Info', 'Your access request is pending approval.');
            return;
          } else if (accessStatus.status === 'rejected') {
            Alert.alert(
              'Access Denied',
              `Your access request was rejected. ${
                accessStatus.message ? `Reason: ${accessStatus.message}` : ''
              }`,
            );
            return;
          }
        }

        Alert.alert(
          'Private Quiz',
          'This is a private quiz. Would you like to request access from the creator?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Request Access',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  await requestQuizAccessApi(
                    quizId,
                    `Hi, I'm interested in taking your quiz "${quiz.title}". Please grant me access.`,
                  );
                  Alert.alert(
                    'Success',
                    'Access request sent to the quiz creator!',
                  );
                  await loadAccessRequests();
                } catch (error) {
                  console.error('Access request failed:', error);
                  Alert.alert(
                    'Error',
                    error?.response?.data?.message ||
                      'Failed to request access. Please try again.',
                  );
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ],
          {cancelable: true},
        );
        return;
      }

      // Only check payment for platform paid quizzes
      if (quiz && quiz.isPaid && !quiz.isUserGenerated) {
        const response = await checkUserPaymentDetailsApi();

        if (!response.data.hasPaymentDetails) {
          setPendingQuizRegistration(quizId);
          setIsPaymentModalVisible(true);
          return;
        }
      }

      // Confirm registration
      Alert.alert(
        'Confirm Registration',
        `Are you sure you want to register for "${quiz.title}"?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Yes, Register',
            onPress: async () => {
              try {
                setIsLoading(true);

                console.log('Sending registration request for quiz:', quizId);
                const response = await registerForQuizApi(quizId);
                console.log('Registration response:', response.data);

                // Update local state immediately
                const quizIdStr = quizId.toString();
                setRegisteredQuizIds(prev => {
                  if (!prev.includes(quizIdStr)) {
                    return [...prev, quizIdStr];
                  }
                  return prev;
                });

                Alert.alert('Success', 'Successfully registered for the quiz!');

                // Reload data to ensure sync
                await loadInitialData(true);
              } catch (error) {
                console.error('Registration failed:', error);
                console.error('Error response:', error?.response?.data);

                Alert.alert(
                  'Error',
                  error?.response?.data?.message ||
                    'Failed to register. Please try again.',
                );

                // Reload in case of partial failure
                await loadInitialData(true);
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        {cancelable: true},
      );
    } catch (error) {
      console.error('Error in handleRegister:', error);
      Alert.alert('Error', 'Could not process registration. Please try again.');
    }
  };

  const handleStartQuiz = async quiz => {
    const now = moment();
    const startTime = moment(quiz.startTime);
    const endTime = moment(quiz.endTime);

    if (now.isBefore(startTime)) {
      Alert.alert(
        'Quiz Not Started',
        'This quiz has not started yet. Please wait for the start time.',
      );
      return;
    }
    if (now.isAfter(endTime)) {
      Alert.alert('Quiz Ended', 'This quiz has already ended.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await startQuizAttemptApi(quiz._id);
      navigation.navigate('QuizScreen', {
        quizId: quiz._id,
        attemptId: response.data.attemptId,
        quizTitle: quiz.title,
        quizDuration: quiz.duration,
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      if (
        error.response &&
        error.response.data.error === 'QUIZ_ATTEMPT_EXISTS'
      ) {
        Alert.alert('Attempt Exists', 'You have already attempted this quiz.', [
          {text: 'OK', onPress: () => loadInitialData(true)},
        ]);
      } else {
        Alert.alert(
          'Error',
          error?.response?.data?.message || 'Failed to start the quiz.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoPress = quiz => {
    setSelectedQuizInfo(quiz.quizInfo || {rules: [], rankWisePrizes: []});
    setIsQuizInfoVisible(true);
  };

  const handleViewLeaderboard = quizId => {
    setSelectedQuizId(quizId);
    setIsLeaderboardVisible(true);
  };

  const handleCreateQuiz = () => {
    navigation.navigate(Routes.CreateQuiz);
  };

  const handleMyDashboard = () => {
    navigation.navigate(Routes.CreatorDashboard);
  };

  // Replace the existing filteredQuizzes useMemo hook with this updated version

  const filteredQuizzes = useMemo(() => {
    const now = moment();
    let processedQuizzes = quizzes.filter(quiz => {
      const searchLower = searchQuery.toLowerCase();

      // First, check if this is a private quiz
      const isPrivateQuiz =
        quiz.isUserGenerated && quiz.visibility === 'private';
      const userId = userdata?._id || userdata?.id;
      const isCreator =
        quiz.creatorId === userId || quiz.creator?.id === userId;
      const hasApprovedAccess =
        accessRequestStatuses[quiz._id]?.status === 'approved';
      const hasAttempted = userQuizAttempts.some(
        attempt => attempt.quiz === quiz._id,
      );

      // Handle private quiz visibility
      if (isPrivateQuiz && !searchQuery) {
        // Show private quiz if:
        // 1. User is the creator
        // 2. User has approved access
        // 3. User has attempted it (for completed tab)
        if (!isCreator && !hasApprovedAccess && !hasAttempted) {
          return false;
        }
      }

      // If it's a private quiz with a search query, check for exact share ID match
      if (isPrivateQuiz && searchQuery) {
        const matchesShareId =
          quiz.uniqueShareId &&
          quiz.uniqueShareId.toLowerCase() === searchLower.trim();

        // Only show private quiz if it matches the share ID or user has access
        if (!matchesShareId && !isCreator && !hasApprovedAccess) {
          return false;
        }
      }

      // Now check if it matches the search criteria
      const matchesSearch = searchQuery
        ? quiz.title.toLowerCase().includes(searchLower) ||
          (quiz.description &&
            quiz.description.toLowerCase().includes(searchLower)) ||
          (quiz.uniqueShareId &&
            quiz.uniqueShareId.toLowerCase().includes(searchLower)) ||
          (quiz.creatorUsername &&
            quiz.creatorUsername.toLowerCase().includes(searchLower))
        : true;

      if (!matchesSearch) return false;

      const startTime = moment(quiz.startTime);
      const endTime = moment(quiz.endTime);
      const isRegistered = registeredQuizIds.includes(quiz._id);
      const accessRequestInfo = accessRequestStatuses[quiz._id];

      switch (activeTab) {
        case TABS.UPCOMING:
          return now.isBefore(startTime) && !hasAttempted;
        case TABS.ACTIVE:
          return (
            now.isBetween(startTime, endTime) &&
            (isRegistered || accessRequestInfo?.status === 'approved') &&
            !hasAttempted
          );
        case TABS.COMPLETED:
          return hasAttempted;
        default:
          return false;
      }
    });

    if (activeTab === TABS.COMPLETED) {
      processedQuizzes.sort((quizA, quizB) => {
        const latestAttemptA = userQuizAttempts
          .filter(attempt => attempt.quiz === quizA._id)
          .sort((att1, att2) =>
            moment(att2.attemptTimestamp).diff(moment(att1.attemptTimestamp)),
          )[0];

        const latestAttemptB = userQuizAttempts
          .filter(attempt => attempt.quiz === quizB._id)
          .sort((att1, att2) =>
            moment(att2.attemptTimestamp).diff(moment(att1.attemptTimestamp)),
          )[0];

        const timeA = latestAttemptA
          ? moment(latestAttemptA.attemptTimestamp)
          : moment(quizA.endTime);
        const timeB = latestAttemptB
          ? moment(latestAttemptB.attemptTimestamp)
          : moment(quizB.endTime);

        return timeB.diff(timeA);
      });
    }
    return processedQuizzes;
  }, [
    quizzes,
    searchQuery,
    activeTab,
    userQuizAttempts,
    registeredQuizIds,
    accessRequestStatuses,
    userdata,
  ]);

  const renderQuizCard = ({item}) => {
    const isRegistered = registeredQuizIds.includes(item._id);
    const accessRequestInfo = accessRequestStatuses[item._id];
    const countdownText = countdowns[item._id];
    const now = moment();
    const startTime = moment(item.startTime);
    const endTime = moment(item.endTime);

    const hasAttempted = userQuizAttempts.some(
      attempt => attempt.quiz === item._id,
    );
    const isFullyCompleted = userQuizAttempts.some(
      attempt => attempt.quiz === item._id && attempt.isCompleted,
    );
    const isQuizOver = now.isAfter(endTime);

    let cardStatusText = '';
    let statusColor = COLORS.grey999999;
    let statusIcon = 'help-circle-outline';

    if (activeTab === TABS.COMPLETED) {
      cardStatusText = isFullyCompleted ? 'Completed' : 'Attempted';
      statusColor = isFullyCompleted ? COLORS.greenSuccess : COLORS.blue043142;
      statusIcon = 'checkmark-done-outline';
    } else if (hasAttempted) {
      cardStatusText = 'Attempt In Progress';
      statusColor = COLORS.blue043142;
      statusIcon = 'refresh-outline';
    } else if (now.isBetween(startTime, endTime)) {
      cardStatusText =
        isRegistered || accessRequestInfo?.status === 'approved'
          ? countdownText || 'Active'
          : 'Active Now';
      statusColor = COLORS.greenSuccess;
      statusIcon = 'play-circle-outline';
    } else if (now.isBefore(startTime)) {
      cardStatusText =
        isRegistered || accessRequestInfo?.status === 'approved'
          ? countdownText || 'Upcoming'
          : 'Upcoming';
      statusColor = COLORS.yellowF5BE00;
      statusIcon = 'alarm-outline';
    } else if (isQuizOver) {
      cardStatusText = 'Ended';
      statusColor = COLORS.redError;
      statusIcon = 'timer-off-outline';
    }

    const displayStatusText =
      (isRegistered || accessRequestInfo?.status === 'approved') &&
      countdownText &&
      activeTab !== TABS.COMPLETED
        ? countdownText
        : cardStatusText;

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() =>
          navigation.navigate('QuizDetails', {
            quizId: item._id,
            quizTitle: item.title,
          })
        }
        activeOpacity={0.8}>
        {!item.isUserGenerated && (
          <View style={styles.officialBadge}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={COLORS.whiteFFFFFF}
            />
            <Text
              variant="semibold11"
              color={COLORS.whiteFFFFFF}
              style={{marginLeft: 4}}>
              Official Quiz
            </Text>
          </View>
        )}

        {item.isUserGenerated && (
          <View style={styles.communityBadgeContainer}>
            <LinearGradient
              colors={[COLORS.purpleCommunity, '#9333EA']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={StyleSheet.absoluteFill}
            />
            <MaterialCommunityIcons
              name="account-group"
              size={14}
              color={COLORS.whiteFFFFFF}
            />
            <Text
              variant="semibold11"
              color={COLORS.whiteFFFFFF}
              style={{marginLeft: 4}}>
              Community Quiz
            </Text>
          </View>
        )}

        {item.isUserGenerated && item.visibility === 'private' && (
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={12} color={COLORS.blue043142} />
            <Text
              variant="semibold10"
              color={COLORS.blue043142}
              style={{marginLeft: 3}}>
              Private
            </Text>
          </View>
        )}

        {item.isPaid && !item.isUserGenerated && (
          <View style={styles.quizTypeMarker}>
            <Ionicons
              name="cash-outline"
              size={14}
              color={COLORS.whiteFFFFFF}
            />
            <Text
              variant="semibold12"
              color={COLORS.whiteFFFFFF}
              style={{marginLeft: 4}}>
              Cash Prize
            </Text>
          </View>
        )}

        {(isRegistered || accessRequestInfo?.status === 'approved') &&
          activeTab !== TABS.COMPLETED &&
          !hasAttempted && (
            <View style={styles.registeredBadgeTopRight}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={COLORS.greenSuccess}
              />
              <Text
                variant="semibold10"
                color={COLORS.greenSuccess}
                style={{marginLeft: 4}}>
                {isRegistered ? 'Registered' : 'Access Granted'}
              </Text>
            </View>
          )}

        <View style={styles.cardHeader}>
          <Image
            source={
              item.coverImage
                ? {uri: item.coverImage}
                : item.imageUrl
                ? {uri: item.imageUrl}
                : require('../../assets/images/image.png')
            }
            style={styles.quizIcon}
            resizeMode="cover"
          />
          <View style={styles.quizTitleContainer}>
            <Text
              variant="semibold16"
              color={COLORS.blue043142}
              numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.metaInfoContainer}>
              <Text
                variant="regular12"
                color={COLORS.grey999999}
                numberOfLines={1}>
                {item.category || item.topics?.join(', ')}
              </Text>
              <Text
                variant="semibold12"
                color={
                  item.isUserGenerated
                    ? COLORS.purpleCommunity
                    : COLORS.blue043142
                }
                numberOfLines={1}
                style={{marginTop: nh(0.2)}}>
                By: {item.creatorUsername}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              mixpanel.track('Quiz information icon');

              handleInfoPress(item);
            }}
            style={styles.infoIconTouchable}>
            <Ionicons
              name="information-circle-outline"
              size={26}
              color={COLORS.blue043142}
            />
          </TouchableOpacity>
        </View>

        <Text
          variant="regular14"
          color={COLORS.darkGrey333333}
          style={styles.quizDescription}
          numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.dateTimeAndStatusContainer}>
          <View style={styles.dateTimeItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.blue043142}
            />
            <Text
              variant="regular12"
              color={COLORS.blue043142}
              style={{marginLeft: 6}}>
              {moment(item.startTime).format('MMM DD, YYYY')}
            </Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.blue043142} />
            <Text
              variant="regular12"
              color={COLORS.blue043142}
              style={{marginLeft: 6}}>
              {moment(item.startTime).format('hh:mm A')}
            </Text>
          </View>
        </View>

        {displayStatusText && (
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View
              style={[
                styles.statusDisplayContainer,
                {backgroundColor: statusColor},
              ]}>
              <Ionicons
                name={statusIcon}
                size={16}
                color={COLORS.whiteFFFFFF}
              />
              <Text
                variant="semibold12"
                color={COLORS.whiteFFFFFF}
                style={{marginLeft: 6}}>
                {displayStatusText}
              </Text>
            </View>
          </View>
        )}

        {/* Access request status badge */}
        {item.isUserGenerated &&
          item.visibility === 'private' &&
          accessRequestInfo && (
            <View
              style={[
                styles.accessStatusBadge,
                {
                  backgroundColor:
                    accessRequestInfo.status === 'pending'
                      ? COLORS.orangeWarning + '20'
                      : accessRequestInfo.status === 'approved'
                      ? COLORS.greenSuccess + '20'
                      : COLORS.redError + '20',
                },
              ]}>
              <Ionicons
                name={
                  accessRequestInfo.status === 'pending'
                    ? 'time-outline'
                    : accessRequestInfo.status === 'approved'
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={16}
                color={
                  accessRequestInfo.status === 'pending'
                    ? COLORS.orangeWarning
                    : accessRequestInfo.status === 'approved'
                    ? COLORS.greenSuccess
                    : COLORS.redError
                }
              />
              <Text
                variant="semibold12"
                color={
                  accessRequestInfo.status === 'pending'
                    ? COLORS.orangeWarning
                    : accessRequestInfo.status === 'approved'
                    ? COLORS.greenSuccess
                    : COLORS.redError
                }
                style={{marginLeft: 6}}>
                {accessRequestInfo.status === 'pending'
                  ? 'Access Pending'
                  : accessRequestInfo.status === 'approved'
                  ? 'Access Granted'
                  : 'Access Denied'}
              </Text>
            </View>
          )}

        <View style={styles.actionButtonsContainer}>
          {activeTab === TABS.COMPLETED ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaderboardButton]}
              onPress={e => {
                e.stopPropagation();
                mixpanel.track(`View Leaderboard Click`);

                handleViewLeaderboard(item._id);
              }}>
              <Ionicons
                name="trophy-outline"
                size={18}
                color={COLORS.whiteFFFFFF}
              />
              <Text
                variant="semibold14"
                color={COLORS.whiteFFFFFF}
                style={{marginLeft: 8}}>
                View Leaderboard
              </Text>
            </TouchableOpacity>
          ) : isRegistered || accessRequestInfo?.status === 'approved' ? (
            now.isBetween(startTime, endTime) && !hasAttempted ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.startQuizButton]}
                onPress={e => {
                  e.stopPropagation();
                  mixpanel.track(`Start Quiz Click`);
                  handleStartQuiz(item);
                }}>
                <Ionicons
                  name="play-circle-outline"
                  size={18}
                  color={COLORS.whiteFFFFFF}
                />
                <Text
                  variant="semibold14"
                  color={COLORS.whiteFFFFFF}
                  style={{marginLeft: 8}}>
                  Start Quiz
                </Text>
              </TouchableOpacity>
            ) : null
          ) : accessRequestInfo?.status === 'pending' ? (
            <View style={[styles.actionButton, styles.pendingButton]}>
              <Ionicons
                name="time-outline"
                size={18}
                color={COLORS.whiteFFFFFF}
              />
              <Text
                variant="semibold14"
                color={COLORS.whiteFFFFFF}
                style={{marginLeft: 8}}>
                Access Pending
              </Text>
            </View>
          ) : accessRequestInfo?.status === 'rejected' ? (
            <View>
              <View style={[styles.actionButton, styles.rejectedButton]}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.whiteFFFFFF}
                />
                <Text
                  variant="semibold14"
                  color={COLORS.whiteFFFFFF}
                  style={{marginLeft: 8}}>
                  Access Denied
                </Text>
              </View>
              {accessRequestInfo.message && (
                <Text
                  variant="regular12"
                  color={COLORS.redError}
                  style={{marginTop: 8, textAlign: 'center'}}>
                  Reason: {accessRequestInfo.message}
                </Text>
              )}
            </View>
          ) : now.isBefore(startTime) && !isQuizOver && !hasAttempted ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.registerButton]}
              onPress={e => {
                e.stopPropagation();
                mixpanel.track(` Register Now Click`);
                handleRegister(item._id);
              }}>
              <Ionicons
                name={
                  item.isUserGenerated && item.visibility === 'private'
                    ? 'key-outline'
                    : 'pencil-outline'
                }
                size={18}
                color={COLORS.whiteFFFFFF}
              />
              <Text
                variant="semibold14"
                color={COLORS.whiteFFFFFF}
                style={{marginLeft: 8}}>
                {item.isUserGenerated && item.visibility === 'private'
                  ? 'Request Access'
                  : 'Register Now'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const config = EmptyStateConfig[activeTab];
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name={config.icon} size={nw(20)} color={COLORS.grey999999} />
        <Text
          variant="semibold20"
          color={COLORS.blue043142}
          style={styles.emptyStateTitle}>
          {config.title}
        </Text>
        <Text
          variant="regular16"
          color={COLORS.darkGrey333333}
          style={styles.emptyStateMessage}>
          {config.message}
        </Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => {
            mixpanel.track(`Explore Content Click`);
            navigation.navigate('ExploreContent');
          }}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.whiteFFFFFF}
          />
          <Text
            variant="semibold16"
            color={COLORS.whiteFFFFFF}
            style={{marginLeft: 10}}>
            Explore Content
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isUniqueQuizId = query => {
    // Unique quiz IDs follow the pattern UQ-XXXXXX
    return /^UQ-[A-Z0-9]{6}$/i.test(query.trim());
  };

  const handleSearch = async query => {
    setSearchQuery(query);

    // Check if it's a unique quiz ID
    if (isUniqueQuizId(query)) {
      try {
        setIsLoading(true);
        const response = await getQuizByShareIdApi(query.trim().toUpperCase());

        if (response.data.success) {
          const quiz = response.data.data;

          // If it's a private quiz, add it to the current quiz list temporarily
          if (quiz.visibility === 'private') {
            // Check if quiz is already in the list
            const existingQuiz = quizzes.find(
              q => q._id === quiz.id || q._id === quiz._id,
            );

            if (!existingQuiz) {
              // Add the quiz to the list temporarily
              const formattedQuiz = {
                ...quiz,
                _id: quiz.id || quiz._id,
                isUserGenerated: true,
                creatorUsername: quiz.creator?.username || 'Community Creator',
                creatorId: quiz.creator?.id,
                uniqueShareId: quiz.shareId,
                questionPoolSize: quiz.questionPool,
                questionsPerAttempt: quiz.questionsPerAttempt,
                totalAttempts: quiz.statistics?.attempts || 0,
                averageRating: quiz.statistics?.rating || 0,
                ratingCount: quiz.statistics?.ratingCount || 0,
                coverImage: quiz.coverImage,
                visibility: quiz.visibility,
              };

              // Add to quizzes list
              setQuizzes(prevQuizzes => [...prevQuizzes, formattedQuiz]);

              // Show a message to the user
              Alert.alert(
                'Private Quiz Found',
                `Found private quiz: "${quiz.title}". You can now see it in the list.`,
                [{text: 'OK'}],
              );
            } else {
              // Quiz already in list, just show a message
              Alert.alert(
                'Quiz Found',
                `Quiz "${quiz.title}" is already in your list.`,
                [{text: 'OK'}],
              );
            }
          } else {
            // For public quizzes, navigate directly
            navigation.navigate(Routes.QuizDetails, {
              quizId: quiz.id,
              quizTitle: quiz.title,
            });
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          Alert.alert('Not Found', 'No quiz found with this ID');
        } else if (error.response?.status === 403) {
          // Private quiz - show access request option
          const quizId = error.response.data.quizId;
          const quizTitle = error.response.data.quizTitle || 'this quiz';

          Alert.alert(
            'Private Quiz',
            `"${quizTitle}" is a private quiz. Would you like to request access?`,
            [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Request Access',
                onPress: async () => {
                  try {
                    setIsLoading(true);
                    await requestQuizAccessApi(
                      quizId,
                      `Hi, I found your quiz with ID ${query} and would like to request access.`,
                    );
                    Alert.alert(
                      'Success',
                      'Access request sent to the quiz creator!',
                    );
                    // Reload access requests
                    await loadAccessRequests();
                  } catch (requestError) {
                    console.error('Access request failed:', requestError);
                    Alert.alert(
                      'Error',
                      requestError?.response?.data?.message ||
                        'Failed to request access. Please try again.',
                    );
                  } finally {
                    setIsLoading(false);
                  }
                },
              },
            ],
            {cancelable: true},
          );
        } else {
          Alert.alert('Error', 'Failed to search for quiz. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text
          variant="regular16"
          color={COLORS.blue043142}
          style={{marginTop: 16}}>
          Loading Quizzes...
        </Text>
      </View>
    );
  }

  // Determine if Dashboard button should be shown
  const showDashboard = userdata?.isQuizCreator || hasCreatedQuizzes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />

      <View style={styles.headerWrapper}>
        <ImageBackground
          source={require('../../assets/images/Ellipse.png')}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImageStyle}
          resizeMode="cover">
          <Header
            title="Quizzes"
            rightComponent={
              <View style={styles.creatorActionCenter}>
                {/* Dashboard button shows if user is a quiz creator */}

                <TouchableOpacity
                  style={[styles.headerActionButton, {marginLeft: 12}]}
                  onPress={handleMyDashboard}>
                  <Ionicons
                    name="stats-chart"
                    size={22}
                    color={COLORS.whiteFFFFFF}
                  />
                  <Text
                    variant="semibold12"
                    color={COLORS.whiteFFFFFF}
                    style={{marginLeft: 4}}>
                    Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
          <View style={styles.searchWrapper}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.grey999999}
              style={styles.searchIcon}
            />
            <CustomTextInput
              placeholder="Search quizzes by title or ID (e.g., UQ-ABC123)..."
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
              }}
            />
          </View>
        </ImageBackground>
      </View>

      <View style={styles.tabContainer}>
        {Object.values(TABS).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              mixpanel.track(`${tab} TAB`);
              setActiveTab(tab);
            }}>
            <Text
              variant={activeTab === tab ? 'semibold14' : 'regular14'}
              color={
                activeTab === tab ? COLORS.yellowF5BE00 : COLORS.grey999999
              }>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !isInitialLoading && !isRefreshing && (
        <ActivityIndicator
          style={styles.inlineLoading}
          size="small"
          color={COLORS.yellowF5BE00}
        />
      )}

      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizCard}
        keyExtractor={item => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00, COLORS.blue043142]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
      />

      {selectedQuizId && (
        <LeaderboardModal
          visible={isLeaderboardVisible}
          onClose={() => setIsLeaderboardVisible(false)}
          quizId={selectedQuizId}
        />
      )}
      {selectedQuizInfo && (
        <QuizInfoModal
          visible={isQuizInfoVisible}
          onClose={() => setIsQuizInfoVisible(false)}
          quizInfo={selectedQuizInfo}
        />
      )}

      <PaymentOptionsModal
        visible={isPaymentModalVisible}
        onClose={() => {
          setIsPaymentModalVisible(false);
          setPendingQuizRegistration(null);
        }}
        onSaveUPI={handleSaveUPI}
        onSaveBankDetails={handleSaveBankDetails}
      />
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
  inlineLoading: {
    marginVertical: nh(2),
    alignSelf: 'center',
  },
  headerContainer: {
    paddingVertical: nh(1),
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
  },
  headerRight: {
    position: 'absolute',
    right: nw(4),
  },
  mockTextInput: {
    flex: 1,
    height: '100%',
    paddingLeft: nw(2.5),
    fontSize: 14,
    color: COLORS.blue043142,
  },
  headerWrapper: {
    backgroundColor: COLORS.blue043142,
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
  creatorActionCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    shadowOffset: {width: 0, height: 1},
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
    paddingBottom: nh(10),
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
  officialBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.7),
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  communityBadgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: nh(0.7),
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  privateBadge: {
    position: 'absolute',
    top: nh(0.7),
    right: nw(3.5),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleLightBg,
    paddingHorizontal: nw(2),
    paddingVertical: nh(0.4),
    borderRadius: 8,
    zIndex: 1,
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
    marginTop: nh(3.5),
    marginBottom: nh(1.5),
    position: 'relative',
  },
  quizIcon: {
    width: nw(13),
    height: nw(13),
    borderRadius: 8,
    marginRight: nw(3.5),
    backgroundColor: COLORS.greyEEEEEE,
  },
  quizTitleContainer: {
    flex: 1,
    marginRight: nw(8),
  },
  metaInfoContainer: {
    marginTop: nh(0.5),
  },
  infoIconTouchable: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: nw(1),
    zIndex: 2,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
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
  disabledButton: {
    backgroundColor: COLORS.grey999999,
  },
  pendingButton: {
    backgroundColor: COLORS.orangeWarning,
  },
  rejectedButton: {
    backgroundColor: COLORS.redError,
  },
  accessStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: nh(1),
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
