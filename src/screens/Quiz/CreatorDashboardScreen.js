import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LineChart, BarChart} from 'react-native-chart-kit';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import moment from 'moment';
import {useSelector} from 'react-redux';
import QuizShareButton from '../../components/QuizShareButton';
//import QuizShareModal from '../components/QuizShareModal';

// Text component
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
    if (variant.includes('28')) fontSize = 28;
  }
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

// Header component
const Header = ({title, subtitle, onBack, rightComponent}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text variant="bold24" color={COLORS.whiteFFFFFF}>
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="regular14"
          color={COLORS.whiteFFFFFF}
          style={{opacity: 0.9, marginTop: 4}}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightComponent || <View style={{width: 40}} />}
  </View>
);

// Stat Card Component
const StatCard = ({icon, iconColor, value, label, trend, gradientColors}) => {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, {damping: 15, stiffness: 150});
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <LinearGradient
        colors={gradientColors || ['#FFFFFF', '#F8F9FA']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.statCardGradient}>
        <View
          style={[
            styles.statIconContainer,
            {backgroundColor: iconColor + '15'},
          ]}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
        <View style={styles.statContent}>
          <Text
            variant="bold28"
            color={COLORS.blue043142}
            style={styles.statValue}>
            {value}
          </Text>
          <Text
            variant="regular14"
            color={COLORS.grey666666}
            style={{marginTop: 4}}>
            {label}
          </Text>
        </View>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={
                trend > 0
                  ? 'trending-up'
                  : trend < 0
                  ? 'trending-down'
                  : 'remove'
              }
              size={20}
              color={
                trend > 0
                  ? COLORS.greenSuccess
                  : trend < 0
                  ? COLORS.redError
                  : COLORS.grey999999
              }
            />
            <Text
              variant="semibold14"
              color={
                trend > 0
                  ? COLORS.greenSuccess
                  : trend < 0
                  ? COLORS.redError
                  : COLORS.grey999999
              }
              style={{marginLeft: 4}}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Quiz Card Component with Access Request Management
const QuizCard = ({
  quiz,
  index,
  onPress,
  onAnalytics,
  onViewAccessRequests,
}) => {
  const getStatusColor = status => {
    switch (status) {
      case 'draft':
        return COLORS.grey666666;
      case 'pending_review':
      case 'manual_review':
        return COLORS.yellowF5BE00;
      case 'approved':
      case 'ai_approved':
        return COLORS.greenSuccess;
      case 'rejected':
        return COLORS.redError;
      default:
        return COLORS.grey999999;
    }
  };

  const getStatusText = status => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending_review':
        return 'Under Review';
      case 'manual_review':
        return 'Under Review';
      case 'approved':
      case 'ai_approved':
        return 'Published';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.quizCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.quizCardHeader}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(quiz.status) + '15'},
            ]}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: getStatusColor(quiz.status)},
              ]}
            />
            <Text variant="semibold14" color={getStatusColor(quiz.status)}>
              {getStatusText(quiz.status)}
            </Text>
          </View>

          <Text variant="regular14" color={COLORS.grey666666}>
            {moment(quiz.dates.created).format('MMM DD, YYYY')}
          </Text>
        </View>

        {/* Title with Share Button */}
        <View style={styles.quizTitleRow}>
          <Text
            variant="bold18"
            color={COLORS.blue043142}
            numberOfLines={2}
            style={styles.quizTitle}>
            {quiz.title}
          </Text>
        </View>

        {/* Show if quiz is private */}
        {quiz.visibility === 'private' && (
          <View style={styles.privacyIndicator}>
            <Ionicons
              name="lock-closed"
              size={14}
              color={COLORS.purpleCommunity}
            />
            <Text
              variant="regular12"
              color={COLORS.purpleCommunity}
              style={{marginLeft: 4}}>
              Private Quiz
            </Text>
          </View>
        )}

        <View style={styles.quizMetrics}>
          <View style={styles.metricItem}>
            <Ionicons
              name="people-outline"
              size={18}
              color={COLORS.grey666666}
            />
            <Text
              variant="regular14"
              color={COLORS.grey666666}
              style={{marginLeft: 6}}>
              {quiz.statistics.attempts} attempts
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="star" size={18} color={COLORS.yellowF5BE00} />
            <Text
              variant="regular14"
              color={COLORS.grey666666}
              style={{marginLeft: 6}}>
              {quiz.statistics.rating || 'N/A'}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={COLORS.greenSuccess}
            />
            <Text
              variant="regular14"
              color={COLORS.grey666666}
              style={{marginLeft: 6}}>
              {quiz.statistics.completionRate}%
            </Text>
          </View>
        </View>

        <View style={styles.quizActions}>
          {quiz.status === 'draft' ? (
            <TouchableOpacity style={styles.editButton} onPress={onPress}>
              <Ionicons
                name="create-outline"
                size={18}
                color={COLORS.blue043142}
              />
              <Text
                variant="semibold14"
                color={COLORS.blue043142}
                style={{marginLeft: 6}}>
                Continue Editing
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.publishedActionsRow}>
              <TouchableOpacity
                style={styles.analyticsButton}
                onPress={() => onAnalytics(quiz)}>
                <Ionicons
                  name="bar-chart-outline"
                  size={18}
                  color={COLORS.purpleCommunity}
                />
                <Text
                  variant="semibold14"
                  color={COLORS.purpleCommunity}
                  style={{marginLeft: 6}}>
                  View Analytics
                </Text>
              </TouchableOpacity>

              {/* Access Requests Button for Private Quizzes */}
              {quiz.visibility === 'private' &&
                quiz.statistics.pendingAccessRequests > 0 && (
                  <TouchableOpacity
                    style={styles.accessRequestsButton}
                    onPress={e => {
                      e.stopPropagation();
                      onViewAccessRequests(quiz);
                    }}>
                    <View style={styles.requestsCountBadge}>
                      <Text variant="bold10" color={COLORS.whiteFFFFFF}>
                        {quiz.statistics.pendingAccessRequests}
                      </Text>
                    </View>
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={COLORS.orangeWarning}
                    />
                    <Text
                      variant="semibold14"
                      color={COLORS.orangeWarning}
                      style={{marginLeft: 6}}>
                      Requests
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Share Button */}
              {['approved', 'ai_approved'].includes(quiz.status) &&
                quiz.shareId && (
                  <QuizShareButton
                    quiz={quiz}
                    variant="icon"
                    style={styles.shareIconButton}
                  />
                )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Badge Component
const BadgeItem = ({badge, earned, progress}) => (
  <View style={[styles.badgeItem, earned && styles.badgeItemEarned]}>
    <View style={[styles.badgeIcon, earned && styles.badgeIconEarned]}>
      <Text variant="bold24">{badge.icon}</Text>
    </View>
    <Text
      variant="semibold14"
      color={earned ? COLORS.blue043142 : COLORS.grey666666}
      numberOfLines={2}
      style={styles.badgeName}>
      {badge.name}
    </Text>
    {!earned && progress !== undefined && (
      <View style={styles.badgeProgress}>
        <View style={[styles.badgeProgressFill, {width: `${progress}%`}]} />
      </View>
    )}
  </View>
);

// Filter Pills
const FilterPill = ({label, active, onPress}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}>
    <Text
      variant={active ? 'semibold14' : 'regular14'}
      color={active ? COLORS.whiteFFFFFF : COLORS.grey666666}>
      {label}
    </Text>
  </TouchableOpacity>
);

import {
  getCreatorDashboardApi,
  getMyQuizzesApi,
  getCreatorStatsApi,
  getCreatorBadgesApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Helper for responsive scaling
const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

// Colors
const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  grey666666: '#666666',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greyF8F9FA: '#F8F9FA',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  lightBlueE6F0FF: '#E6F0FF',
  darkGrey333333: '#333333',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
  orangeWarning: '#FFA500',
};

const QUIZ_FILTERS = [
  {id: 'all', label: 'All'},
  {id: 'draft', label: 'Drafts'},
  {id: 'pending', label: 'Under Review'},
  {id: 'published', label: 'Published'},
  {id: 'rejected', label: 'Rejected'},
];

const CreatorDashboardScreen = ({navigation}) => {
  const userdata = useSelector(state => state?.userData);

  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [badges, setBadges] = useState({
    earnedBadges: [],
    availableBadges: [],
    summary: {},
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (refresh = false) => {
    try {
      if (!refresh) setIsLoading(true);

      // Fetch all data in parallel
      const [dashboardRes, quizzesRes, badgesRes] = await Promise.all([
        getCreatorDashboardApi(),
        getMyQuizzesApi({status: 'all', page: 1, limit: 10}),
        getCreatorBadgesApi(),
      ]);

      setDashboardData(dashboardRes.data.data);
      setQuizzes(quizzesRes.data.data.quizzes);
      setBadges(badgesRes.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadDashboardData(true);
  }, []);

  // Navigation Handlers
  const handleCreateQuiz = () => {
    navigation.navigate(Routes.CreateQuiz);
  };

  const handleQuizPress = quiz => {
    if (quiz.status === 'draft') {
      navigation.navigate(Routes.EditQuiz, {quizId: quiz.id});
    } else {
      navigation.navigate(Routes.QuizAnalytics, {
        quizId: quiz.id,
        quizTitle: quiz.title,
      });
    }
  };

  const handleViewAnalytics = quiz => {
    navigation.navigate(Routes.QuizAnalytics, {
      quizId: quiz.id,
      quizTitle: quiz.title,
    });
  };

  const handleViewAllQuizzes = () => {
    navigation.navigate(Routes.MyQuizzes);
  };

  // Add handler for viewing access requests
  const handleViewAccessRequests = quiz => {
    navigation.navigate(Routes.QuizAccessRequests, {
      quizId: quiz.id,
      quizTitle: quiz.title,
    });
  };

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    if (activeFilter === 'all') return quizzes;
    return quizzes.filter(quiz => {
      switch (activeFilter) {
        case 'draft':
          return quiz.status === 'draft';
        case 'pending':
          return ['pending_review', 'manual_review'].includes(quiz.status);
        case 'published':
          return ['approved', 'ai_approved'].includes(quiz.status);
        case 'rejected':
          return quiz.status === 'rejected';
        default:
          return true;
      }
    });
  }, [quizzes, activeFilter]);

  // Render Chart
  const renderActivityChart = () => {
    if (
      !dashboardData?.recentActivity?.quizzes ||
      dashboardData.recentActivity.quizzes.length === 0
    ) {
      return (
        <View style={styles.chartPlaceholder}>
          <MaterialIcons
            name="insert-chart"
            size={48}
            color={COLORS.greyEEEEEE}
          />
          <Text
            variant="regular16"
            color={COLORS.grey666666}
            style={{marginTop: 16}}>
            No activity data available yet
          </Text>
        </View>
      );
    }

    // Prepare data for last 7 days
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = moment().subtract(i, 'days');
      return {
        date: date.format('MMM DD'),
        dayLabel: date.format('ddd'),
        attempts: 0,
      };
    }).reverse();

    // Aggregate attempts by day
    dashboardData.recentActivity.quizzes.forEach(quiz => {
      const dayIndex = last7Days.findIndex(
        day => moment(quiz.createdAt).format('MMM DD') === day.date,
      );
      if (dayIndex !== -1) {
        last7Days[dayIndex].attempts += quiz.attempts;
      }
    });

    const chartData = {
      labels: last7Days.map(d => d.dayLabel),
      datasets: [
        {
          data: last7Days.map(d => d.attempts),
          color: (opacity = 1) => `rgba(245, 190, 0, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={DEVICE_WIDTH - nw(8)}
        height={200}
        chartConfig={{
          backgroundColor: COLORS.whiteFFFFFF,
          backgroundGradientFrom: COLORS.whiteFFFFFF,
          backgroundGradientTo: COLORS.whiteFFFFFF,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(245, 190, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: COLORS.yellowF5BE00,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: COLORS.greyEEEEEE,
            strokeWidth: 1,
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text
          variant="regular16"
          color={COLORS.blue043142}
          style={{marginTop: 16}}>
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  const {overview, creator, recentActivity, aiUsage} = dashboardData || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />

      {/* Header Section */}
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header
          title="Creator Dashboard"
          subtitle="Manage your quizzes and track performance"
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate(Routes.Notifications)}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={COLORS.whiteFFFFFF}
              />
              {recentActivity?.pendingAccessRequests > 0 && (
                <View style={styles.notificationDot} />
              )}
            </TouchableOpacity>
          }
        />

        {/* Creator Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {creator?.profilePicture ? (
              <Image
                source={{uri: creator.profilePicture}}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={32} color={COLORS.whiteFFFFFF} />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text variant="bold20" color={COLORS.whiteFFFFFF}>
              {creator?.username || userdata?.username || 'Creator'}
            </Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={14} color={COLORS.yellowF5BE00} />
              <Text
                variant="semibold14"
                color={COLORS.yellowF5BE00}
                style={{marginLeft: 4}}>
                {creator?.points || 0} Points • Level {creator?.level || 1}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }>
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text
            variant="bold20"
            color={COLORS.blue043142}
            style={styles.sectionTitle}>
            Overview
          </Text>
          {overview?.totalQuizzes > 0 ? (
            /* ---------- normal stats grid ---------- */
            <View style={styles.statsGrid}>
              <StatCard
                icon="document-text-outline"
                iconColor={COLORS.blue043142}
                value={overview.totalQuizzes}
                label="Total Quizzes"
              />
              <StatCard
                icon="people-outline"
                iconColor={COLORS.purpleCommunity}
                value={overview.totalParticipants}
                label="Participants"
              />
              <StatCard
                icon="star"
                iconColor={COLORS.yellowF5BE00}
                value={overview.overallRating?.toFixed(1) || 'N/A'}
                label="Avg Rating"
              />
              <StatCard
                icon="checkmark-circle-outline"
                iconColor={COLORS.greenSuccess}
                value={`${overview.engagementRate}%`}
                label="Completion"
              />
            </View>
          ) : (
            /* ---------- empty-state message ---------- */
            <View style={{paddingVertical: nh(4), alignItems: 'center'}}>
              <Ionicons
                name="information-circle-outline"
                size={36}
                color={COLORS.grey999999}
              />
              <Text
                variant="regular16"
                color={COLORS.grey666666}
                style={{marginTop: nh(1.5), textAlign: 'center'}}>
                Please create a Quiz to see Quiz Creator Statistics
              </Text>
            </View>
          )}
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="bold20" color={COLORS.blue043142}>
              Your Badges
            </Text>
            <TouchableOpacity onPress={() => setShowAllBadges(true)}>
              <Text variant="regular14" color={COLORS.purpleCommunity}>
                View All ({badges.summary?.earned || 0}/
                {badges.summary?.total || 10})
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesList}>
            {badges.earnedBadges?.slice(0, 5).map((badge, index) => (
              <BadgeItem key={badge.id} badge={badge} earned={true} />
            ))}
            {badges.availableBadges?.slice(0, 3).map((badge, index) => (
              <BadgeItem
                key={badge.id}
                badge={badge}
                earned={false}
                progress={badge.progressPercentage}
              />
            ))}
          </ScrollView>
        </View>

        {/* Recent Quizzes */}
        <View style={styles.quizzesSection}>
          <View style={styles.sectionHeader}>
            <Text variant="bold20" color={COLORS.blue043142}>
              My Quizzes
            </Text>
            <TouchableOpacity onPress={handleViewAllQuizzes}>
              <Text variant="regular14" color={COLORS.purpleCommunity}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}>
            {QUIZ_FILTERS.map(filter => (
              <FilterPill
                key={filter.id}
                label={filter.label}
                active={activeFilter === filter.id}
                onPress={() => setActiveFilter(filter.id)}
              />
            ))}
          </ScrollView>

          {/* Quiz List */}
          {filteredQuizzes.length === 0 ? (
            <View style={styles.emptyQuizzes}>
              <MaterialIcons name="quiz" size={56} color={COLORS.greyEEEEEE} />
              <Text
                variant="regular16"
                color={COLORS.grey666666}
                style={{marginTop: 16}}>
                No quizzes found
              </Text>
              {activeFilter === 'all' && (
                <TouchableOpacity
                  style={styles.createFirstQuizButton}
                  onPress={handleCreateQuiz}>
                  <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                    Create Your First Quiz
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredQuizzes.slice(0, 5).map((quiz, index) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                index={index}
                onPress={() => handleQuizPress(quiz)}
                onAnalytics={handleViewAnalytics}
                onViewAccessRequests={handleViewAccessRequests} // Add this line
              />
            ))
          )}
        </View>

        {/* Streak Card */}
        {overview?.currentStreak > 0 && (
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={36} color={COLORS.yellowF5BE00} />
            </View>
            <View style={{flex: 1}}>
              <Text variant="bold18" color={COLORS.blue043142}>
                {overview.currentStreak} Day Streak! 🔥
              </Text>
              <Text
                variant="regular14"
                color={COLORS.grey666666}
                style={{marginTop: 4}}>
                Keep creating to maintain your streak
              </Text>
            </View>
            <View style={styles.streakStats}>
              <Text variant="bold24" color={COLORS.yellowF5BE00}>
                {overview.longestStreak}
              </Text>
              <Text variant="regular12" color={COLORS.grey666666}>
                Best
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{height: nh(10)}} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateQuiz}>
        <LinearGradient
          colors={[COLORS.yellowF5BE00, '#FFC700']}
          style={styles.fabGradient}>
          <Ionicons name="add" size={32} color={COLORS.whiteFFFFFF} />
        </LinearGradient>
      </TouchableOpacity>

      {/* All Badges Modal */}
      <Modal
        visible={showAllBadges}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllBadges(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="bold20" color={COLORS.blue043142}>
                All Badges ({badges.summary?.earned || 0}/
                {badges.summary?.total || 10})
              </Text>
              <TouchableOpacity onPress={() => setShowAllBadges(false)}>
                <Ionicons name="close" size={28} color={COLORS.grey666666} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}>
              <Text
                variant="bold18"
                color={COLORS.blue043142}
                style={styles.badgeCategory}>
                Earned Badges
              </Text>
              <View style={styles.badgesGrid}>
                {badges.earnedBadges?.map(badge => (
                  <View key={badge.id} style={styles.badgeGridItem}>
                    <BadgeItem badge={badge} earned={true} />
                    <Text
                      variant="regular12"
                      color={COLORS.grey666666}
                      style={{marginTop: 8, textAlign: 'center'}}>
                      {moment(badge.earnedAt).format('MMM DD, YYYY')}
                    </Text>
                  </View>
                ))}
              </View>

              <Text
                variant="bold18"
                color={COLORS.blue043142}
                style={[styles.badgeCategory, {marginTop: nh(4)}]}>
                Available Badges
              </Text>
              <View style={styles.badgesGrid}>
                {badges.availableBadges?.map(badge => (
                  <View key={badge.id} style={styles.badgeGridItem}>
                    <BadgeItem
                      badge={badge}
                      earned={false}
                      progress={badge.progressPercentage}
                    />
                    <Text
                      variant="regular12"
                      color={COLORS.grey666666}
                      style={{marginTop: 8, textAlign: 'center'}}>
                      {badge.progress}/{badge.target}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{height: nh(4)}} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF8F9FA,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  headerGradient: {
    // paddingTop: Platform.OS === 'android' ? 0 : 0,
    paddingBottom: nh(3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  notificationButton: {
    padding: nw(2),
    marginRight: -nw(2),
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.redError,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(4),
    marginTop: nh(2),
  },
  profileImageContainer: {
    width: nw(18),
    height: nw(18),
    borderRadius: nw(9),
    borderWidth: 3,
    borderColor: COLORS.whiteFFFFFF,
    backgroundColor: COLORS.whiteFFFFFF,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileInfo: {
    flex: 1,
    marginLeft: nw(4),
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 190, 0, 0.2)',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  settingsButton: {
    padding: nw(2),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: nh(3),
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: nw(4),
    marginBottom: nh(3),
  },
  sectionTitle: {
    marginBottom: nh(2),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -nw(1.5),
  },
  statCard: {
    width: '50%',
    paddingHorizontal: nw(1.5),
    marginBottom: nh(2),
  },
  statCardGradient: {
    borderRadius: 16,
    padding: nw(4),
    height: nh(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIconContainer: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(1),
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    lineHeight: 32,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: nw(4),
    right: nw(4),
  },

  // Chart Section
  chartSection: {
    paddingHorizontal: nw(4),
    marginBottom: nh(3),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(2),
    marginHorizontal: 16,
  },
  chartContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: nw(3),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  chartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badges Section
  badgesSection: {
    marginBottom: nh(3),
  },
  badgesList: {
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: nw(5),
    width: nw(20),
  },
  badgeItemEarned: {
    opacity: 1,
  },
  badgeIcon: {
    width: nw(16),
    height: nw(16),
    borderRadius: nw(8),
    backgroundColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(1),
  },
  badgeIconEarned: {
    backgroundColor: COLORS.yellowF5BE00 + '20',
    borderWidth: 2,
    borderColor: COLORS.yellowF5BE00,
  },
  badgeName: {
    textAlign: 'center',
    lineHeight: 18,
  },
  badgeProgress: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: 2,
  },

  // Quizzes Section
  quizzesSection: {
    paddingHorizontal: nw(4),
    marginBottom: nh(3),
  },
  filterContainer: {
    marginBottom: nh(2),
    marginHorizontal: -nw(4),
    paddingHorizontal: nw(4),
  },
  filterPill: {
    paddingHorizontal: nw(4),
    paddingVertical: nh(1.2),
    borderRadius: 24,
    backgroundColor: COLORS.whiteFFFFFF,
    marginRight: nw(3),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  filterPillActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  emptyQuizzes: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(6),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
  },
  createFirstQuizButton: {
    marginTop: nh(3),
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(6),
    paddingVertical: nh(1.5),
    borderRadius: 24,
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: nw(4),
    marginBottom: nh(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(1.5),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  quizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizTitle: {
    marginBottom: nh(1.5),
    lineHeight: 24,
    flex: 1,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(1),
  },
  quizMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(2),
    paddingBottom: nh(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(5),
  },
  quizActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueE6F0FF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderRadius: 20,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleLightBg,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderRadius: 20,
  },
  accessRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orangeWarning + '15',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    position: 'relative',
  },
  requestsCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.redError,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  accessBadge: {
    backgroundColor: COLORS.redError,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 12,
  },

  // Quick Actions
  pendingRequestsSection: {
    paddingHorizontal: nw(4),
    marginBottom: nh(3),
  },
  pendingRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(4),
    borderRadius: 16,
    marginBottom: nh(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  pendingRequestIcon: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    backgroundColor: COLORS.orangeWarning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(3),
    position: 'relative',
  },
  requestCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.redError,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  accessRequestCard: {
    marginBottom: nh(3),
  },
  accessRequestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nw(5),
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.yellowF5BE00,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  accessRequestIcon: {
    width: nw(14),
    height: nw(14),
    borderRadius: nw(7),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(4),
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: nw(4),
    padding: nw(5),
    borderRadius: 20,
    marginBottom: nh(3),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  streakIcon: {
    width: nw(16),
    height: nw(16),
    borderRadius: nw(8),
    backgroundColor: COLORS.yellowF5BE00 + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(4),
  },
  streakStats: {
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: nh(3),
    right: nw(4),
    elevation: 8,
    shadowColor: COLORS.yellowF5BE00,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: nh(3),
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingBottom: nh(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  modalBody: {
    paddingHorizontal: nw(4),
    paddingTop: nh(3),
  },
  badgeCategory: {
    marginBottom: nh(2),
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -nw(2),
  },
  badgeGridItem: {
    width: '33.33%',
    paddingHorizontal: nw(2),
    marginBottom: nh(3),
    alignItems: 'center',
  },

  publishedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: nw(2), // Space between buttons
  },
  shareIconButton: {
    backgroundColor: COLORS.purpleLightBg,
    padding: nw(2),
    borderRadius: 20,
    marginLeft: nw(2),
  },
});

export default CreatorDashboardScreen;
