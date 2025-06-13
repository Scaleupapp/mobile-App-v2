import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
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
  Platform,
  Modal,
  Alert,
  Text as RNText,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import moment from 'moment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  getQuizAnalyticsApi,
  getQuizParticipantsApi,
  getQuizShareStatsApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';

const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

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
};

const PERIODS = [
  {label: 'Today', value: 'day'},
  {label: 'This Week', value: 'week'},
  {label: 'This Month', value: 'month'},
  {label: 'All Time', value: 'all'},
];

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

// Header component
const Header = ({title, subtitle, onBack, rightComponent}) => (
  <View style={styles.header}>
    <TouchableOpacity 
      onPress={onBack} 
      style={styles.backButton}
      accessible={true}
      accessibilityLabel="Go back"
      accessibilityRole="button">
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text variant="bold18" color={COLORS.whiteFFFFFF} numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="regular12" color={COLORS.whiteFFFFFF} style={{opacity: 0.8}}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightComponent || <View style={{width: 40}} />}
  </View>
);

// Metric Card Component
const MetricCard = React.memo(({icon, label, value, subValue, color, index}) => {
  const scale = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
      mass: 1,
      delay: index * 100,
    });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));
  
  return (
    <Animated.View style={[styles.metricCard, animatedStyle]}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.metricGradient}>
        <View style={[styles.metricIconContainer, {backgroundColor: color + '20'}]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text variant="bold24" color={COLORS.blue043142} style={styles.metricValue}>
          {value}
        </Text>
        <Text variant="regular12" color={COLORS.grey666666} style={styles.metricLabel}>
          {label}
        </Text>
        {subValue && (
          <Text variant="semibold10" color={color} style={styles.metricSubValue}>
            {subValue}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
});

// Period Selector Component
const PeriodSelector = ({periods, activePeriod, onSelect}) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={styles.periodSelector}
    contentContainerStyle={styles.periodSelectorContent}>
    {periods.map((period) => (
      <TouchableOpacity
        key={period.value}
        style={[
          styles.periodButton,
          activePeriod === period.value && styles.periodButtonActive,
        ]}
        onPress={() => onSelect(period.value)}
        accessible={true}
        accessibilityLabel={`Select ${period.label} period`}
        accessibilityRole="button"
        accessibilityState={{selected: activePeriod === period.value}}>
        <Text
          variant={activePeriod === period.value ? 'semibold12' : 'regular12'}
          color={activePeriod === period.value ? COLORS.whiteFFFFFF : COLORS.grey666666}>
          {period.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// Question Performance Card
const QuestionCard = React.memo(({question, index, onPress}) => {
  const getDifficultyColor = (accuracy) => {
    const numAccuracy = parseFloat(accuracy) || 0;
    if (numAccuracy >= 80) return COLORS.greenSuccess;
    if (numAccuracy >= 50) return COLORS.yellowF5BE00;
    return COLORS.redError;
  };
  
  const accuracy = parseFloat(question.accuracy) || 0;
  
  return (
    <TouchableOpacity 
      style={styles.questionCard} 
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`Question ${index + 1}: ${question.questionText}`}
      accessibilityRole="button">
      <View style={styles.questionHeader}>
        <View style={[styles.questionNumber, {backgroundColor: getDifficultyColor(accuracy)}]}>
          <Text variant="semibold10" color={COLORS.whiteFFFFFF}>
            {index + 1}
          </Text>
        </View>
        <Text 
          variant="regular14" 
          color={COLORS.blue043142} 
          style={styles.questionText}
          numberOfLines={2}>
          {question.questionText || 'Question text not available'}
        </Text>
      </View>
      
      <View style={styles.questionMetrics}>
        <View style={styles.questionMetric}>
          <Text variant="bold14" color={getDifficultyColor(accuracy)}>
            {accuracy.toFixed(1)}%
          </Text>
          <Text variant="regular10" color={COLORS.grey999999}>accuracy</Text>
        </View>
        <View style={styles.questionMetric}>
          <Text variant="bold14" color={COLORS.blue043142}>
            {question.totalAnswers || 0}
          </Text>
          <Text variant="regular10" color={COLORS.grey999999}>attempts</Text>
        </View>
        <View style={styles.questionMetric}>
          <Text variant="bold14" color={COLORS.purpleCommunity}>
            {question.averageTime || '0.0'}s
          </Text>
          <Text variant="regular10" color={COLORS.grey999999}>avg time</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Top Performer Card
const PerformerCard = React.memo(({performer, rank}) => {
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return COLORS.grey999999;
    }
  };
  
  return (
    <View style={styles.performerCard}>
      <View style={styles.performerLeft}>
        <View style={styles.performerRank}>
          {rank <= 3 ? (
            <Ionicons name="medal" size={20} color={getMedalColor(rank)} />
          ) : (
            <Text variant="semibold14" color={COLORS.grey666666}>
              {rank}
            </Text>
          )}
        </View>
        <View style={styles.performerAvatarContainer}>
          {performer.profilePicture ? (
            <Image
              source={{uri: performer.profilePicture}}
              style={styles.performerAvatar}
            />
          ) : (
            <View style={styles.performerAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={COLORS.grey666666} />
            </View>
          )}
        </View>
        <View style={styles.performerInfo}>
          <Text variant="semibold14" color={COLORS.blue043142} numberOfLines={1}>
            {performer.username || 'Unknown User'}
          </Text>
          <Text variant="regular10" color={COLORS.grey999999}>
            {moment(performer.completedAt).format('MMM DD, HH:mm')}
          </Text>
        </View>
      </View>
      <Text variant="bold18" color={COLORS.yellowF5BE00}>
        {performer.score || 0}
      </Text>
    </View>
  );
});

const QuizAnalyticsScreen = ({navigation, route}) => {
  const {quizId, quizTitle} = route.params || {};
  const userdata = useSelector(state => state?.userData);
  
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePeriod, setActivePeriod] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [shareStats, setShareStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Validate quiz ID
  useEffect(() => {
    if (!quizId) {
      Alert.alert('Error', 'Quiz ID not provided', [
        {text: 'OK', onPress: () => navigation.goBack()}
      ]);
    }
  }, [quizId]);
  
  // Load Analytics Data
  useEffect(() => {
    if (quizId) {
      loadAnalyticsData();
    }
  }, [activePeriod, quizId]);
  
  const loadAnalyticsData = async (refresh = false) => {
    try {
      if (!refresh) setIsLoading(true);
      
      const [analyticsRes, shareRes, participantsRes] = await Promise.all([
        getQuizAnalyticsApi(quizId, activePeriod),
        getQuizShareStatsApi(quizId, activePeriod),
        getQuizParticipantsApi(quizId, 'all', 1, 10),
      ]);
      
      setAnalyticsData(analyticsRes?.data?.data || null);
      setShareStats(shareRes?.data?.data || null);
      setParticipants(participantsRes?.data?.data?.participants || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Quiz not found', [
          {text: 'OK', onPress: () => navigation.goBack()}
        ]);
      } else if (error.response?.status === 403) {
        Alert.alert('Error', 'You do not have permission to view this analytics', [
          {text: 'OK', onPress: () => navigation.goBack()}
        ]);
      } else {
        Alert.alert(
          'Error', 
          'Failed to load analytics data. Please check your connection and try again.',
          [
            {text: 'Cancel', onPress: () => navigation.goBack()},
            {text: 'Retry', onPress: () => loadAnalyticsData()},
          ]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadAnalyticsData(true);
  }, [activePeriod]);
  
  // Navigation Handlers
  const handleViewParticipants = () => {
    const participantsRoute = Routes?.QuizParticipants || 'QuizParticipants';
    
    try {
      navigation.navigate(participantsRoute, {quizId, quizTitle});
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Unable to navigate to participants screen');
    }
  };
  
  const handleExportData = () => {
    Alert.alert(
      'Export Analytics',
      'Analytics data will be exported as CSV and sent to your registered email.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Export', onPress: () => {
          Alert.alert('Success', 'Analytics exported successfully!');
        }},
      ]
    );
  };
  
  // Render Charts
  const renderParticipationChart = () => {
    if (!analyticsData?.participationTimeline || analyticsData.participationTimeline.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <MaterialIcons name="show-chart" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            No participation data available
          </Text>
        </View>
      );
    }
    
    try {
      const data = analyticsData.participationTimeline.slice(-7);
      const labels = data.map(d => moment(d.time).format('MMM DD'));
      const values = data.map(d => d.count || 0);
      
      const chartData = {
        labels,
        datasets: [{
          data: values,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          strokeWidth: 3,
        }],
      };
      
      return (
        <LineChart
          data={chartData}
          width={DEVICE_WIDTH - nw(10)}
          height={180}
          chartConfig={{
            backgroundColor: COLORS.whiteFFFFFF,
            backgroundGradientFrom: COLORS.whiteFFFFFF,
            backgroundGradientTo: COLORS.whiteFFFFFF,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: COLORS.purpleCommunity,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: COLORS.greyF7F7F7,
              strokeWidth: 1,
            },
          }}
          bezier
          style={{
            marginLeft: -nw(4),
            marginVertical: 8,
          }}
        />
      );
    } catch (error) {
      console.error('Error rendering participation chart:', error);
      return (
        <View style={styles.chartPlaceholder}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            Error loading chart
          </Text>
        </View>
      );
    }
  };
  
  const renderScoreDistribution = () => {
    if (!analyticsData?.scoreDistribution) {
      return null;
    }
    
    try {
      const distribution = analyticsData.scoreDistribution;
      const total = Object.values(distribution).reduce((sum, val) => sum + (val || 0), 0);
      
      if (total === 0) {
        return (
          <View style={styles.chartPlaceholder}>
            <MaterialIcons name="pie-chart" size={48} color={COLORS.greyEEEEEE} />
            <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
              No score data available
            </Text>
          </View>
        );
      }
      
      const scoreRanges = [
        {range: '0-20', label: 'Needs Work', color: COLORS.redError},
        {range: '21-40', label: 'Fair', color: '#FF6B6B'},
        {range: '41-60', label: 'Good', color: COLORS.purpleCommunity},
        {range: '61-80', label: 'Very Good', color: COLORS.yellowF5BE00},
        {range: '81-100', label: 'Excellent', color: COLORS.greenSuccess},
      ];
      
      return (
        <View style={styles.scoreDistributionContainer}>
          {scoreRanges.map((item) => {
            const count = distribution[item.range] || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const validPercentage = Math.min(100, Math.max(0, percentage));
            
            return (
              <View key={item.range} style={styles.scoreRange}>
                <View style={styles.scoreRangeHeader}>
                  <View style={[styles.scoreRangeDot, {backgroundColor: item.color}]} />
                  <Text variant="regular12" color={COLORS.grey666666}>{item.label}</Text>
                </View>
                <View style={styles.scoreRangeBar}>
                  <View 
                    style={[
                      styles.scoreRangeBarFill,
                      {
                        width: `${validPercentage}%`,
                        backgroundColor: item.color,
                      }
                    ]} 
                  />
                </View>
                <Text variant="semibold12" color={COLORS.blue043142}>
                  {count} ({validPercentage}%)
                </Text>
              </View>
            );
          })}
        </View>
      );
    } catch (error) {
      console.error('Error rendering score distribution:', error);
      return (
        <View style={styles.chartPlaceholder}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            Error loading score distribution
          </Text>
        </View>
      );
    }
  };
  
  // Render Tab Content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'questions':
        return renderQuestionsTab();
      case 'participants':
        return renderParticipantsTab();
      case 'feedback':
        return renderFeedbackTab();
      default:
        return null;
    }
  };
  
  const renderOverviewTab = () => (
    <>
      {/* Key Metrics - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.metricsScroll}
        contentContainerStyle={styles.metricsContainer}>
        <MetricCard
          icon="people"
          label="Total Attempts"
          value={analyticsData?.overview?.totalAttempts || 0}
          subValue={`${analyticsData?.overview?.periodAttempts || 0} this period`}
          color={COLORS.purpleCommunity}
          index={0}
        />
        <MetricCard
          icon="checkmark-circle"
          label="Completions"
          value={analyticsData?.overview?.totalCompletions || 0}
          subValue={`${analyticsData?.overview?.completionRate || 0}% rate`}
          color={COLORS.greenSuccess}
          index={1}
        />
        <MetricCard
          icon="trophy"
          label="Avg Score"
          value={`${Math.round(analyticsData?.overview?.averageScore || 0)}`}
          subValue="out of 100"
          color={COLORS.yellowF5BE00}
          index={2}
        />
        <MetricCard
          icon="share-social"
          label="Total Shares"
          value={shareStats?.summary?.totalShares || 0}
          subValue={`${shareStats?.conversions?.shareToCompletion || '0%'} conversion`}
          color={COLORS.blue043142}
          index={3}
        />
      </ScrollView>
      
      {/* Participation Timeline */}
      <View style={styles.chartCard}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.chartTitle}>
          Participation Timeline
        </Text>
        {renderParticipationChart()}
      </View>
      
      {/* Score Distribution */}
      <View style={styles.chartCard}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.chartTitle}>
          Score Distribution
        </Text>
        {renderScoreDistribution()}
      </View>
      
      {/* Completion Stats */}
      <View style={styles.completionCard}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.chartTitle}>
          Completion Funnel
        </Text>
        <View style={styles.completionStats}>
          <View style={styles.completionStat}>
            <View style={[styles.completionIcon, {backgroundColor: COLORS.blue043142 + '20'}]}>
              <Ionicons name="person-add" size={24} color={COLORS.blue043142} />
            </View>
            <Text variant="bold20" color={COLORS.blue043142}>
              {analyticsData?.completionFunnel?.registered || 0}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>
              Registered
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={COLORS.greyEEEEEE} />
          
          <View style={styles.completionStat}>
            <View style={[styles.completionIcon, {backgroundColor: COLORS.yellowF5BE00 + '20'}]}>
              <Ionicons name="play-circle" size={24} color={COLORS.yellowF5BE00} />
            </View>
            <Text variant="bold20" color={COLORS.yellowF5BE00}>
              {analyticsData?.completionFunnel?.started || 0}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>
              Started
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={COLORS.greyEEEEEE} />
          
          <View style={styles.completionStat}>
            <View style={[styles.completionIcon, {backgroundColor: COLORS.greenSuccess + '20'}]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.greenSuccess} />
            </View>
            <Text variant="bold20" color={COLORS.greenSuccess}>
              {analyticsData?.completionFunnel?.completed || 0}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>
              Completed
            </Text>
          </View>
        </View>
      </View>
    </>
  );
  
  const renderQuestionsTab = () => (
    <View style={styles.questionsContainer}>
      <View style={styles.questionsSummary}>
        <View style={[styles.summaryCard, {backgroundColor: COLORS.greenSuccess + '10'}]}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.greenSuccess} />
          <Text variant="semibold14" color={COLORS.greenSuccess} style={{marginTop: 8}}>
            Easiest Question
          </Text>
          <Text variant="regular12" color={COLORS.grey666666} style={{marginTop: 4}} numberOfLines={2}>
            {analyticsData?.questionPerformance?.easiest?.[0]?.questionText || 'N/A'}
          </Text>
          <Text variant="bold18" color={COLORS.greenSuccess} style={{marginTop: 8}}>
            {analyticsData?.questionPerformance?.easiest?.[0]?.accuracy || '0'}%
          </Text>
        </View>
        
        <View style={[styles.summaryCard, {backgroundColor: COLORS.redError + '10'}]}>
          <Ionicons name="close-circle" size={24} color={COLORS.redError} />
          <Text variant="semibold14" color={COLORS.redError} style={{marginTop: 8}}>
            Hardest Question
          </Text>
          <Text variant="regular12" color={COLORS.grey666666} style={{marginTop: 4}} numberOfLines={2}>
            {analyticsData?.questionPerformance?.hardest?.[0]?.questionText || 'N/A'}
          </Text>
          <Text variant="bold18" color={COLORS.redError} style={{marginTop: 8}}>
            {analyticsData?.questionPerformance?.hardest?.[0]?.accuracy || '0'}%
          </Text>
        </View>
      </View>
      
      <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
        All Questions Performance
      </Text>
      
      {(!analyticsData?.questionPerformance?.all || analyticsData.questionPerformance.all.length === 0) ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="help-outline" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            No question data available
          </Text>
        </View>
      ) : (
        <View style={styles.questionsList}>
          {analyticsData.questionPerformance.all.map((item, index) => (
            <QuestionCard
              key={`question-${index}`}
              question={item}
              index={index}
              onPress={() => {}}
            />
          ))}
        </View>
      )}
    </View>
  );
  
  const renderParticipantsTab = () => (
    <View style={styles.participantsContainer}>
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={handleViewParticipants}
        accessible={true}
        accessibilityLabel="View all participants"
        accessibilityRole="button">
        <Ionicons name="people" size={20} color={COLORS.purpleCommunity} />
        <Text variant="semibold14" color={COLORS.purpleCommunity} style={{marginLeft: 8}}>
          View All Participants
        </Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.purpleCommunity} style={{marginLeft: 4}} />
      </TouchableOpacity>
      
      <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
        Top Performers
      </Text>
      
      {analyticsData?.topPerformers?.map((performer, index) => (
        <PerformerCard
          key={`performer-${index}`}
          performer={performer}
          rank={index + 1}
        />
      ))}
      
      {(!analyticsData?.topPerformers || analyticsData.topPerformers.length === 0) && (
        <View style={styles.emptyState}>
          <Ionicons name="trophy" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            No participants yet
          </Text>
        </View>
      )}
    </View>
  );
  
  const renderFeedbackTab = () => {
    const feedback = analyticsData?.feedbackSummary;
    const averageRating = feedback?.averageRating || 0;
    const validRating = Math.min(5, Math.max(0, averageRating));
    
    return (
      <View style={styles.feedbackContainer}>
        {/* Rating Overview */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text variant="bold28" color={COLORS.yellowF5BE00}>
              {validRating.toFixed(1)}
            </Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.round(validRating) ? COLORS.yellowF5BE00 : COLORS.greyEEEEEE}
                />
              ))}
            </View>
            <Text variant="regular12" color={COLORS.grey666666}>
              {feedback?.totalRatings || 0} ratings
            </Text>
          </View>
          
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = feedback?.ratingBreakdown?.[rating] || 0;
              const totalRatings = feedback?.totalRatings || 0;
              const percentage = totalRatings > 0 
                ? Math.min(100, Math.max(0, (count / totalRatings) * 100))
                : 0;
              
              return (
                <View key={rating} style={styles.ratingBar}>
                  <Text variant="regular12" color={COLORS.grey666666} style={{width: 12}}>
                    {rating}
                  </Text>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.barFill,
                        {width: `${percentage}%`}
                      ]} 
                    />
                  </View>
                  <Text variant="regular12" color={COLORS.grey666666} style={{width: 30, textAlign: 'right'}}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Feedback Stats */}
        <View style={styles.feedbackStats}>
          <View style={[styles.feedbackStatCard, {backgroundColor: COLORS.greenSuccess + '10'}]}>
            <Ionicons name="thumbs-up" size={24} color={COLORS.greenSuccess} />
            <Text variant="bold18" color={COLORS.greenSuccess}>
              {feedback?.wouldRecommend?.yes || 0}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>
              Would Recommend
            </Text>
          </View>
          
          <View style={[styles.feedbackStatCard, {backgroundColor: COLORS.yellowF5BE00 + '10'}]}>
            <Ionicons name="speedometer" size={24} color={COLORS.yellowF5BE00} />
            <Text variant="bold18" color={COLORS.yellowF5BE00}>
              {feedback?.difficultyFeedback?.['just_right'] || 0}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>
              Right Difficulty
            </Text>
          </View>
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles" size={48} color={COLORS.greyEEEEEE} />
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 12}}>
            No feedback comments yet
          </Text>
        </View>
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.purpleCommunity} />
        <Text variant="regular16" color={COLORS.blue043142} style={{marginTop: 16}}>
          Loading analytics...
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header
          title="Quiz Analytics"
          subtitle={quizTitle || 'Quiz'}
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity 
              onPress={handleExportData} 
              style={styles.headerButton}
              accessible={true}
              accessibilityLabel="Export analytics data"
              accessibilityRole="button">
              <Ionicons name="download" size={20} color={COLORS.whiteFFFFFF} />
            </TouchableOpacity>
          }
        />
      </LinearGradient>
      
      {/* Period Selector and Tabs Combined */}
      <View style={styles.controlsContainer}>
        <PeriodSelector
          periods={PERIODS}
          activePeriod={activePeriod}
          onSelect={setActivePeriod}
        />
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}>
          {['overview', 'questions', 'participants', 'feedback'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              accessible={true}
              accessibilityLabel={`${tab} tab`}
              accessibilityRole="tab"
              accessibilityState={{selected: selectedTab === tab}}>
              <Text
                variant={selectedTab === tab ? 'semibold14' : 'regular14'}
                color={selectedTab === tab ? COLORS.purpleCommunity : COLORS.grey666666}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.purpleCommunity]}
            tintColor={COLORS.purpleCommunity}
          />
        }>
        {renderTabContent()}
      </ScrollView>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    marginHorizontal: nw(4),
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: nw(2),
    marginLeft: nw(2),
  },
  
  // Controls Container
  controlsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  
  // Period Selector
  periodSelector: {
    paddingVertical: nh(1.5),
  },
  periodSelectorContent: {
    paddingHorizontal: nw(4),
  },
  periodButton: {
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderRadius: 20,
    backgroundColor: COLORS.greyF7F7F7,
    marginRight: nw(2),
  },
  periodButtonActive: {
    backgroundColor: COLORS.blue043142,
  },
  
  // Tab Bar
  tabScroll: {
    paddingBottom: nh(1.5),
  },
  tab: {
    paddingHorizontal: nw(5),
    paddingVertical: nh(1),
    marginLeft: nw(4),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.purpleCommunity,
  },
  
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: nh(2),
    paddingBottom: nh(4),
  },
  
  // Metrics
  metricsScroll: {
    marginBottom: nh(3),
  },
  metricsContainer: {
    paddingHorizontal: nw(4),
  },
  metricCard: {
    width: nw(40),
    marginRight: nw(3),
  },
  metricGradient: {
    borderRadius: 16,
    padding: nw(4),
    height: nh(18),
  },
  metricIconContainer: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(1),
  },
  metricValue: {
    marginBottom: 4,
  },
  metricLabel: {
    opacity: 0.8,
  },
  metricSubValue: {
    marginTop: 4,
  },
  
  // Charts
  chartCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: nw(4),
    marginBottom: nh(3),
    borderRadius: 16,
    padding: nw(4),
  },
  chartTitle: {
    marginBottom: nh(2),
  },
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Score Distribution
  scoreDistributionContainer: {
    paddingTop: nh(1),
  },
  scoreRange: {
    marginBottom: nh(2),
  },
  scoreRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreRangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  scoreRangeBar: {
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    marginVertical: 4,
    overflow: 'hidden',
  },
  scoreRangeBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Completion Card
  completionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: nw(4),
    marginBottom: nh(3),
    borderRadius: 16,
    padding: nw(4),
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: nh(2),
  },
  completionStat: {
    flex: 1,
    alignItems: 'center',
  },
  completionIcon: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(1),
  },
  
  // Questions Tab
  questionsContainer: {
    flex: 1,
    paddingHorizontal: nw(4),
  },
  questionsSummary: {
    flexDirection: 'row',
    marginHorizontal: -nw(1),
    marginBottom: nh(3),
  },
  summaryCard: {
    flex: 1,
    padding: nw(4),
    borderRadius: 16,
    marginHorizontal: nw(1),
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: nh(2),
  },
  questionsList: {
    paddingBottom: nh(4),
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(3),
    marginBottom: nh(1.5),
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(1.5),
  },
  questionNumber: {
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(3),
  },
  questionText: {
    flex: 1,
    lineHeight: 20,
  },
  questionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  questionMetric: {
    alignItems: 'center',
  },
  
  // Participants Tab
  participantsContainer: {
    flex: 1,
    paddingHorizontal: nw(4),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleLightBg,
    paddingVertical: nh(1.5),
    borderRadius: 12,
    marginBottom: nh(3),
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(3),
    borderRadius: 12,
    marginBottom: nh(1.5),
  },
  performerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  performerRank: {
    width: nw(8),
    alignItems: 'center',
    marginRight: nw(3),
  },
  performerAvatarContainer: {
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    marginRight: nw(3),
    backgroundColor: COLORS.greyF7F7F7,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  performerAvatar: {
    width: '100%',
    height: '100%',
  },
  performerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  performerInfo: {
    flex: 1,
  },
  
  // Feedback Tab
  feedbackContainer: {
    flex: 1,
    paddingHorizontal: nw(4),
  },
  ratingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(4),
    borderRadius: 16,
    marginBottom: nh(3),
  },
  ratingLeft: {
    alignItems: 'center',
    marginRight: nw(4),
  },
  ratingStars: {
    flexDirection: 'row',
    marginVertical: nh(0.5),
  },
  ratingBars: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(0.8),
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    marginHorizontal: nw(2),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: 3,
  },
  feedbackStats: {
    flexDirection: 'row',
    marginHorizontal: -nw(1),
    marginBottom: nh(3),
  },
  feedbackStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: nw(4),
    borderRadius: 16,
    marginHorizontal: nw(1),
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(6),
  },
});

export default QuizAnalyticsScreen;