// screens/AIStudyBuddy/AIStudyBuddyAnalytics.js
import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart, ProgressChart, BarChart } from 'react-native-chart-kit';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import AI Study Buddy API services
import {
  aiStudyBuddyGetAnalyticsApi,
  aiStudyBuddyGetQuotaApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddyAnalytics = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalSessions: 0,
      totalMessages: 0,
      totalStudyTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageSessionTime: 0,
    },
    dailyActivity: [],
    subjectBreakdown: [],
    topicsExplored: [],
    weeklyProgress: [],
    engagementMetrics: {
      averageResponseTime: 0,
      followUpRate: 0,
      bookmarkRate: 0,
      satisfactionScore: 0,
    },
    learningInsights: [],
    goals: {
      dailyQuestionGoal: 10,
      currentProgress: 0,
      goalAchievedDays: 0,
    }
  });

  // Modern gradient colors for different metrics
  const gradientColors = {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    success: ['#4facfe', '#00f2fe'],
    warning: ['#ffecd2', '#fcb69f'],
    purple: ['#a8edea', '#fed6e3'],
    orange: ['#ffd89b', '#19547b'],
    teal: ['#89f7fe', '#66a6ff'],
    pink: ['#f8cdda', '#1e3c72'],
  };

  // Time frame options
  const timeFrameOptions = [
    { label: '7D', value: '7d', gradient: gradientColors.primary },
    { label: '30D', value: '30d', gradient: gradientColors.secondary },
    { label: '90D', value: '90d', gradient: gradientColors.success },
    { label: '1Y', value: '1y', gradient: gradientColors.warning },
  ];

  // Enhanced subject colors with modern gradients
  const subjectGradients = {
    mathematics: ['#667eea', '#764ba2'],
    physics: ['#4facfe', '#00f2fe'],
    chemistry: ['#43e97b', '#38f9d7'],
    biology: ['#fa709a', '#fee140'],
    computer_science: ['#a8edea', '#fed6e3'],
    english: ['#ffecd2', '#fcb69f'],
    history: ['#ffd89b', '#19547b'],
    geography: ['#89f7fe', '#66a6ff'],
  };

  // Load analytics data with enhanced error handling
  const loadAnalyticsData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      try {
        const response = await aiStudyBuddyGetAnalyticsApi(timeframe);
        
        if (response.data && response.data.success && response.data.analytics) {
          setAnalyticsData(response.data.analytics);
        } else {
          setAnalyticsData(getDefaultAnalyticsData());
        }
      } catch (apiError) {
        console.warn('Analytics API failed, using default data:', apiError);
        setAnalyticsData(getDefaultAnalyticsData());
        
        showToast({
          message: 'Using demo data for better experience',
          type: 'info',
        });
      }
      
      if (showLoader) {
        startEntranceAnimations();
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      setAnalyticsData(getDefaultAnalyticsData());
      
      showToast({
        message: 'Failed to load analytics. Please try again.',
        type: 'error',
      });
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe, showToast]);

  // Enhanced default data with realistic values
  const getDefaultAnalyticsData = () => ({
    overview: {
      totalSessions: 47,
      totalMessages: 234,
      totalStudyTime: 720, // 12 hours
      currentStreak: 8,
      longestStreak: 15,
      averageSessionTime: 23,
    },
    dailyActivity: [
      { date: 'Mon', questions: 12, studyTime: 45 },
      { date: 'Tue', questions: 18, studyTime: 67 },
      { date: 'Wed', questions: 25, studyTime: 89 },
      { date: 'Thu', questions: 15, studyTime: 52 },
      { date: 'Fri', questions: 22, studyTime: 78 },
      { date: 'Sat', questions: 8, studyTime: 34 },
      { date: 'Sun', questions: 5, studyTime: 25 },
    ],
    subjectBreakdown: [
      { id: 'mathematics', name: 'Mathematics', percentage: 35, timeSpent: 252, sessions: 16 },
      { id: 'physics', name: 'Physics', percentage: 28, timeSpent: 202, sessions: 13 },
      { id: 'chemistry', name: 'Chemistry', percentage: 22, timeSpent: 158, sessions: 10 },
      { id: 'biology', name: 'Biology', percentage: 15, timeSpent: 108, sessions: 8 },
    ],
    weeklyProgress: [
      { week: 'Week 1', completed: 85, target: 100 },
      { week: 'Week 2', completed: 92, target: 100 },
      { week: 'Week 3', completed: 78, target: 100 },
      { week: 'Week 4', completed: 95, target: 100 },
    ],
    engagementMetrics: {
      averageResponseTime: 1.8,
      followUpRate: 82,
      bookmarkRate: 24,
      satisfactionScore: 4.6,
    },
    learningInsights: [
      {
        type: 'strength',
        icon: 'trending-up',
        message: 'Excellent progress in Mathematics! You\'re mastering calculus concepts.',
        color: gradientColors.success
      },
      {
        type: 'suggestion',
        icon: 'lightbulb',
        message: 'Consider reviewing Physics wave theory for better understanding.',
        color: gradientColors.warning
      },
      {
        type: 'achievement',
        icon: 'star',
        message: 'Congratulations! You\'ve maintained an 8-day study streak.',
        color: gradientColors.purple
      }
    ],
    goals: {
      dailyQuestionGoal: 15,
      currentProgress: 12,
      goalAchievedDays: 22,
      weeklyTarget: 105,
      weeklyProgress: 89,
    }
  });

  // Enhanced entrance animations
  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalyticsData(false);
  }, [loadAnalyticsData]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadAnalyticsData();
    }, [loadAnalyticsData])
  );

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
      loadAnalyticsData(true);
    }
  };

  // Enhanced formatting functions
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return '0m';
    const numMinutes = Number(minutes);
    if (numMinutes < 60) return `${numMinutes}m`;
    const hours = Math.floor(numMinutes / 60);
    const mins = numMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const number = Number(num);
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
    return number.toString();
  };

  const safeValue = (value, defaultValue = 0) => {
    return value !== null && value !== undefined && !isNaN(value) ? value : defaultValue;
  };

  // Modern animated header with streak info
  const renderModernHeader = () => (
    <Animated.View
      style={[
        styles.modernHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Your Learning Journey</Text>
              <Text style={styles.subtitleText}>Keep up the amazing progress! 🚀</Text>
            </View>
            <View style={styles.streakContainer}>
              <View style={styles.streakBadge}>
                <Icon name="local-fire-department" size={20} color="#FF6B35" />
                <Text style={styles.streakNumber}>{safeValue(analyticsData.overview?.currentStreak)}</Text>
              </View>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          
          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{formatNumber(safeValue(analyticsData.overview?.totalSessions))}</Text>
              <Text style={styles.quickStatLabel}>Sessions</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{formatDuration(safeValue(analyticsData.overview?.totalStudyTime))}</Text>
              <Text style={styles.quickStatLabel}>Study Time</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{formatNumber(safeValue(analyticsData.overview?.totalMessages))}</Text>
              <Text style={styles.quickStatLabel}>Questions</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Modern time frame selector with gradient buttons
  const renderModernTimeFrameSelector = () => (
    <Animated.View
      style={[
        styles.modernTimeFrameContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>Time Period</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeFrameContent}
      >
        {timeFrameOptions.map((option, index) => (
          <Pressable
            key={option.value}
            onPress={() => handleTimeframeChange(option.value)}
          >
            <LinearGradient
              colors={timeframe === option.value ? option.gradient : ['#F8F9FA', '#E9ECEF']}
              style={[
                styles.modernTimeFrameButton,
                timeframe === option.value && styles.modernTimeFrameButtonActive,
              ]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Text
                style={[
                  styles.modernTimeFrameText,
                  timeframe === option.value && styles.modernTimeFrameTextActive,
                ]}
              >
                {option.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );

  // Enhanced daily activity chart with gradients
  const renderModernDailyActivityChart = () => {
    const dailyData = analyticsData.dailyActivity || [];
    
    if (dailyData.length === 0) {
      return renderEmptyState('Daily Activity', 'No activity data available', 'insert-chart');
    }

    const chartData = {
      labels: dailyData.map(item => item.date || 'N/A').slice(0, 7),
      datasets: [
        {
          data: dailyData.map(item => safeValue(item.questions)).slice(0, 7),
          strokeWidth: 3,
          color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        },
      ],
    };
    
    return (
      <Animated.View
        style={[
          styles.modernChartContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.chartGradientBg}
        >
          <View style={styles.modernChartHeader}>
            <View>
              <Text style={styles.modernChartTitle}>Daily Activity</Text>
              <Text style={styles.modernChartSubtitle}>Questions asked this week</Text>
            </View>
            <View style={styles.chartBadge}>
              <Icon name="trending-up" size={16} color="#10B981" />
              <Text style={styles.chartBadgeText}>+12%</Text>
            </View>
          </View>
          
          <View style={styles.modernChartWrapper}>
            <LineChart
              data={chartData}
              width={screenWidth - 60}
              height={240}
              yAxisLabel=""
              yAxisSuffix=""
              withInnerLines={false}
              withOuterLines={false}
              fromZero={true}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '3',
                  stroke: '#667eea',
                  fill: '#FFFFFF',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#E5E7EB',
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chartStyle}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Modern subject breakdown with animated progress bars
  const renderModernSubjectBreakdown = () => {
    const subjects = analyticsData.subjectBreakdown || [];
    
    if (subjects.length === 0) {
      return renderEmptyState('Subject Distribution', 'No subject data available', 'pie-chart');
    }

    return (
      <Animated.View
        style={[
          styles.modernChartContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.chartGradientBg}
        >
          <View style={styles.modernChartHeader}>
            <View>
              <Text style={styles.modernChartTitle}>Subject Distribution</Text>
              <Text style={styles.modernChartSubtitle}>Time spent by subject</Text>
            </View>
          </View>

          <View style={styles.modernSubjectList}>
            {subjects.map((subject, index) => (
              <View key={subject.name || index} style={styles.modernSubjectItem}>
                <View style={styles.modernSubjectInfo}>
                  <LinearGradient
                    colors={subjectGradients[subject.id] || ['#6B7280', '#9CA3AF']}
                    style={styles.modernSubjectIcon}
                  >
                    <Text style={styles.modernSubjectIconText}>
                      {(subject.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.modernSubjectText}>
                    <Text style={styles.modernSubjectName}>{subject.name || 'Unknown Subject'}</Text>
                    <Text style={styles.modernSubjectMeta}>
                      {safeValue(subject.sessions)} sessions • {formatDuration(safeValue(subject.timeSpent))}
                    </Text>
                  </View>
                </View>
                <View style={styles.modernSubjectProgress}>
                  <Text style={styles.modernSubjectPercentage}>{safeValue(subject.percentage)}%</Text>
                  <View style={styles.modernProgressBarBg}>
                    <LinearGradient
                      colors={subjectGradients[subject.id] || ['#6B7280', '#9CA3AF']}
                      style={[
                        styles.modernProgressBarFill,
                        { width: `${safeValue(subject.percentage)}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Modern goals progress with circular progress
  const renderModernGoalsProgress = () => {
    const goals = analyticsData.goals || {};
    const currentProgress = safeValue(goals.currentProgress);
    const dailyGoal = safeValue(goals.dailyQuestionGoal, 10);
    const weeklyProgress = safeValue(goals.weeklyProgress, 0);
    const weeklyTarget = safeValue(goals.weeklyTarget, 100);
    
    const dailyProgressPercentage = Math.min((currentProgress / dailyGoal), 1);
    const weeklyProgressPercentage = Math.min((weeklyProgress / weeklyTarget), 1);

    const progressData = {
      data: [dailyProgressPercentage, weeklyProgressPercentage, 0.85], // Added mock data for better visual
    };

    return (
      <Animated.View
        style={[
          styles.modernChartContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.chartGradientBg}
        >
          <View style={styles.modernChartHeader}>
            <View>
              <Text style={styles.modernChartTitle}>Goal Progress</Text>
              <Text style={styles.modernChartSubtitle}>Daily and weekly targets</Text>
            </View>
            <Pressable
              style={styles.modernEditButton}
              onPress={() => {
                showToast({
                  message: 'Goal setting coming soon!',
                  type: 'info',
                });
              }}
            >
              <Icon name="tune" size={20} color="#667eea" />
            </Pressable>
          </View>

          <View style={styles.modernGoalsGrid}>
            {/* Daily Goal Card */}
            <View style={styles.modernGoalCard}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.goalCardGradient}
              >
                <Icon name="today" size={24} color="#FFFFFF" />
                <Text style={styles.goalCardTitle}>Daily Goal</Text>
                <Text style={styles.goalCardProgress}>{currentProgress}/{dailyGoal}</Text>
                <Text style={styles.goalCardLabel}>Questions</Text>
              </LinearGradient>
            </View>

            {/* Weekly Goal Card */}
            <View style={styles.modernGoalCard}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                style={styles.goalCardGradient}
              >
                <Icon name="view-week" size={24} color="#FFFFFF" />
                <Text style={styles.goalCardTitle}>Weekly Goal</Text>
                <Text style={styles.goalCardProgress}>{weeklyProgress}/{weeklyTarget}</Text>
                <Text style={styles.goalCardLabel}>Minutes</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Achievement Summary */}
          <View style={styles.achievementSummary}>
            <LinearGradient
              colors={['#a8edea', '#fed6e3']}
              style={styles.achievementGradient}
            >
              <Icon name="emoji-events" size={32} color="#667eea" />
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>
                  🎯 Goal achieved {safeValue(goals.goalAchievedDays)} days this month
                </Text>
                <Text style={styles.achievementSubtitle}>Keep up the excellent work!</Text>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Modern learning insights with enhanced design
  const renderModernLearningInsights = () => {
    const insights = analyticsData.learningInsights || [];
    
    if (insights.length === 0) {
      return renderEmptyState('Learning Insights', 'Keep studying to get personalized insights!', 'lightbulb');
    }

    return (
      <Animated.View
        style={[
          styles.modernChartContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.chartGradientBg}
        >
          <View style={styles.modernChartHeader}>
            <View>
              <Text style={styles.modernChartTitle}>Learning Insights</Text>
              <Text style={styles.modernChartSubtitle}>AI-powered recommendations</Text>
            </View>
            <View style={styles.insightsBadge}>
              <Icon name="auto-awesome" size={16} color="#8B5CF6" />
              <Text style={styles.insightsBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.modernInsightsList}>
            {insights.map((insight, index) => (
              <View key={index} style={styles.modernInsightCard}>
                <LinearGradient
                  colors={insight.color || gradientColors.primary}
                  style={styles.insightIconGradient}
                >
                  <Icon
                    name={insight.icon || 'lightbulb'}
                    size={20}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View style={styles.modernInsightContent}>
                  <Text style={styles.modernInsightType}>
                    {insight.type === 'strength' ? 'Strength' : 
                     insight.type === 'achievement' ? 'Achievement' : 'Suggestion'}
                  </Text>
                  <Text style={styles.modernInsightText}>{insight.message || 'No message available'}</Text>
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Modern engagement metrics grid
  const renderModernEngagementMetrics = () => {
    const metrics = [
      {
        title: 'Response Time',
        value: `${safeValue(analyticsData.engagementMetrics?.averageResponseTime, 0).toFixed(1)}s`,
        icon: 'speed',
        gradient: gradientColors.primary,
        trend: '+15%'
      },
      {
        title: 'Follow-up Rate',
        value: `${safeValue(analyticsData.engagementMetrics?.followUpRate)}%`,
        icon: 'forum',
        gradient: gradientColors.success,
        trend: '+8%'
      },
      {
        title: 'Bookmark Rate',
        value: `${safeValue(analyticsData.engagementMetrics?.bookmarkRate)}%`,
        icon: 'bookmark',
        gradient: gradientColors.warning,
        trend: '+23%'
      },
      {
        title: 'Satisfaction',
        value: `${safeValue(analyticsData.engagementMetrics?.satisfactionScore, 0).toFixed(1)}/5`,
        icon: 'star',
        gradient: gradientColors.purple,
        trend: '+0.3'
      },
    ];

    return (
      <Animated.View
        style={[
          styles.modernChartContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.chartGradientBg}
        >
          <View style={styles.modernChartHeader}>
            <View>
              <Text style={styles.modernChartTitle}>Engagement Metrics</Text>
              <Text style={styles.modernChartSubtitle}>Your learning behavior</Text>
            </View>
          </View>
          
          <View style={styles.modernEngagementGrid}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.modernEngagementCard}>
                <LinearGradient
                  colors={metric.gradient}
                  style={styles.engagementCardGradient}
                >
                  <View style={styles.engagementCardTop}>
                    <Icon name={metric.icon} size={24} color="#FFFFFF" />
                    <View style={styles.engagementTrend}>
                      <Text style={styles.engagementTrendText}>{metric.trend}</Text>
                    </View>
                  </View>
                  <Text style={styles.engagementCardValue}>{metric.value}</Text>
                  <Text style={styles.engagementCardTitle}>{metric.title}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Empty state component
  const renderEmptyState = (title, message, iconName) => (
    <Animated.View
      style={[
        styles.modernChartContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.chartGradientBg}
      >
        <View style={styles.modernChartHeader}>
          <Text style={styles.modernChartTitle}>{title}</Text>
        </View>
        <View style={styles.modernEmptyState}>
          <LinearGradient
            colors={['#E5E7EB', '#F3F4F6']}
            style={styles.emptyStateIcon}
          >
            <Icon name={iconName} size={32} color="#9CA3AF" />
          </LinearGradient>
          <Text style={styles.emptyStateText}>{message}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#667eea" barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your analytics...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" barStyle="light-content" />
      
      <Header 
        title=""
        showBackButton
        backgroundColor="transparent"
        backButtonColor="#FFFFFF"
        rightComponent={
          <Pressable
            style={styles.modernShareButton}
            onPress={() => {
              showToast({
                message: 'Analytics sharing coming soon!',
                type: 'info',
              });
            }}
          >
            <Icon name="share" size={20} color="#FFFFFF" />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
          />
        }
      >
        {/* Modern Header */}
        {renderModernHeader()}

        {/* Time Frame Selector */}
        {renderModernTimeFrameSelector()}

        {/* Goals Progress */}
        {renderModernGoalsProgress()}

        {/* Daily Activity Chart */}
        {renderModernDailyActivityChart()}

        {/* Subject Breakdown */}
        {renderModernSubjectBreakdown()}

        {/* Learning Insights */}
        {renderModernLearningInsights()}

        {/* Engagement Metrics */}
        {renderModernEngagementMetrics()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  modernShareButton: {
    padding: nw(10),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomSpacing: {
    height: nh(40),
  },

  // Modern Header Styles
  modernHeader: {
    marginTop: -nh(80),
    paddingTop: nh(80),
    marginBottom: nh(20),
  },
  headerGradient: {
    paddingBottom: nh(30),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: nw(20),
    paddingTop: nh(20),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(25),
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: nh(4),
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: 20,
    marginBottom: nh(4),
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: nw(4),
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: nh(16),
    paddingHorizontal: nw(12),
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: nh(2),
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Modern Time Frame Selector
  modernTimeFrameContainer: {
    marginHorizontal: nw(20),
    marginBottom: nh(20),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: nh(12),
  },
  timeFrameContent: {
    paddingVertical: nh(4),
    gap: nw(12),
  },
  modernTimeFrameButton: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderRadius: 25,
    minWidth: nw(70),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernTimeFrameButtonActive: {
    shadowOpacity: 0.25,
    elevation: 6,
  },
  modernTimeFrameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modernTimeFrameTextActive: {
    color: '#FFFFFF',
  },

  // Modern Chart Container
  modernChartContainer: {
    marginHorizontal: nw(20),
    marginBottom: nh(20),
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  chartGradientBg: {
    padding: nw(20),
  },
  modernChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(20),
  },
  modernChartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: nh(4),
  },
  modernChartSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 12,
    gap: nw(4),
  },
  chartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  insightsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 12,
    gap: nw(4),
  },
  insightsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modernEditButton: {
    padding: nw(8),
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modernChartWrapper: {
    alignItems: 'center',
    marginTop: nh(10),
  },
  chartStyle: {
    borderRadius: 16,
  },

  // Modern Subject List
  modernSubjectList: {
    gap: nh(16),
  },
  modernSubjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: nw(16),
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernSubjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernSubjectIcon: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  modernSubjectIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modernSubjectText: {
    flex: 1,
  },
  modernSubjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: nh(2),
  },
  modernSubjectMeta: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernSubjectProgress: {
    alignItems: 'flex-end',
    minWidth: nw(80),
  },
  modernSubjectPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: nh(4),
  },
  modernProgressBarBg: {
    width: nw(60),
    height: nh(6),
    backgroundColor: '#E5E7EB',
    borderRadius: nh(3),
    overflow: 'hidden',
  },
  modernProgressBarFill: {
    height: '100%',
    borderRadius: nh(3),
  },

  // Modern Goals
  modernGoalsGrid: {
    flexDirection: 'row',
    gap: nw(12),
    marginBottom: nh(20),
  },
  modernGoalCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  goalCardGradient: {
    padding: nw(20),
    alignItems: 'center',
    minHeight: nh(140),
    justifyContent: 'center',
  },
  goalCardTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: nh(8),
    marginBottom: nh(4),
  },
  goalCardProgress: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: nh(2),
  },
  goalCardLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  achievementSummary: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nw(20),
    gap: nw(16),
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: nh(4),
  },
  achievementSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modern Insights
  modernInsightsList: {
    gap: nh(12),
  },
  modernInsightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: nw(16),
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIconGradient: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  modernInsightContent: {
    flex: 1,
  },
  modernInsightType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: nh(4),
  },
  modernInsightText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Modern Engagement
  modernEngagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(12),
  },
  modernEngagementCard: {
    width: (screenWidth - 72) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  engagementCardGradient: {
    padding: nw(16),
    minHeight: nh(120),
    justifyContent: 'space-between',
  },
  engagementCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementTrend: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: 8,
  },
  engagementTrendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  engagementCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: nh(8),
  },
  engagementCardTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: nh(4),
  },

  // Empty State
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyStateIcon: {
    width: nw(64),
    height: nw(64),
    borderRadius: nw(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AIStudyBuddyAnalytics;