import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  Platform,
  PanGestureHandler,
  State,
  Vibration,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';

// Components & Services
import Text from '../../components/Text';
import Header from '../../components/Header';
import { COLORS } from '../../helper/colors';
import { getAreaInsightsApi, getDetailedInsightApi } from '../../services/apiService';
import Routes from '../../helper/routes';

const { width, height } = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Enhanced Quota Card with Glassmorphism
const QuotaCard = ({ quotaInfo, onRefresh }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (quotaInfo) {
      const progressPercent = (quotaInfo.used / quotaInfo.limit) * 100;
      
      // Progress animation
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Glow effect for low quota
      const remaining = quotaInfo.limit - quotaInfo.used;
      if (remaining <= 2) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
      }
    }
  }, [quotaInfo]);

  const handleRefresh = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger?.('impactLight');
    } else {
      Vibration.vibrate(50);
    }

    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    onRefresh();
  };

  const getQuotaColor = () => {
    if (!quotaInfo) return COLORS.greyD6D6D6;
    const remaining = quotaInfo.limit - quotaInfo.used;
    if (remaining === 0) return COLORS.redError;
    if (remaining <= 2) return COLORS.orange;
    return COLORS.greenSuccess;
  };

  const getTimeUntilReset = (resetTime) => {
    if (!resetTime) return 'Unknown';
    const now = moment();
    const reset = moment(resetTime);
    const duration = moment.duration(reset.diff(now));
    
    if (duration.asHours() < 1) {
      return `${Math.ceil(duration.asMinutes())}m`;
    }
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
  };

  if (!quotaInfo) {
    return (
      <View style={styles.quotaCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={styles.glassmorphismCard}>
          <ActivityIndicator size="small" color={COLORS.blue043142} />
          <Text variant="regular13" color={COLORS.grey777777} style={styles.loadingText}>
            Loading quota...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  const remaining = quotaInfo.limit - quotaInfo.used;
  const quotaColor = getQuotaColor();

  return (
    <Animated.View style={[styles.quotaCard, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
        style={[styles.glassmorphismCard, styles.quotaGradient]}>
        
        <Animated.View style={[
          styles.glowEffect,
          {
            opacity: glowAnim,
            shadowColor: quotaColor,
          }
        ]} />
        
        <View style={styles.quotaHeader}>
          <View style={[styles.quotaIconContainer, { backgroundColor: COLORS.blue043142 + '15' }]}>
            <MaterialIcons name="psychology" size={24} color={COLORS.blue043142} />
          </View>
          <View style={styles.quotaTextContainer}>
            <Text variant="semibold16" color={COLORS.blue043142} numberOfLines={1}>
              Daily AI Insights
            </Text>
            <Text variant="regular12" color={COLORS.grey777777} numberOfLines={1}>
              Free quota resets daily
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleRefresh}
            style={styles.refreshButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={18} color={COLORS.blue043142} />
          </TouchableOpacity>
        </View>

        <View style={styles.quotaProgress}>
          <View style={styles.quotaNumbers}>
            <Text variant="bold24" color={quotaColor} numberOfLines={1}>
              {remaining}
            </Text>
            <Text variant="regular14" color={COLORS.grey777777} numberOfLines={1}>
              / {quotaInfo.limit} left
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                    backgroundColor: quotaColor
                  }
                ]} 
              />
            </View>
            <Text variant="regular11" color={COLORS.grey777777} style={styles.progressText} numberOfLines={1}>
              Resets in {getTimeUntilReset(quotaInfo.resetAt)}
            </Text>
          </View>
        </View>

        {remaining === 0 && (
          <View style={styles.quotaExhaustedBanner}>
            <MaterialIcons name="schedule" size={16} color={COLORS.orange} />
            <Text variant="semibold12" color={COLORS.orange} style={styles.exhaustedText} numberOfLines={2}>
              Quota exhausted • More insights in {getTimeUntilReset(quotaInfo.resetAt)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// Enhanced Severity Badge with Dynamic Colors
const SeverityBadge = ({ severity, count }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return { 
          colors: ['#FF6B6B', '#E53E3E'], 
          icon: 'error', 
          label: 'Critical',
          shadowColor: '#FF6B6B'
        };
      case 'high':
        return { 
          colors: ['#FF8C42', '#FF6B35'], 
          icon: 'warning', 
          label: 'High',
          shadowColor: '#FF8C42'
        };
      case 'medium':
        return { 
          colors: ['#FFD93D', '#F5BE00'], 
          icon: 'info', 
          label: 'Medium',
          shadowColor: '#FFD93D'
        };
      case 'low':
        return { 
          colors: ['#6BCF7F', '#34A853'], 
          icon: 'check-circle', 
          label: 'Low',
          shadowColor: '#6BCF7F'
        };
      default:
        return { 
          colors: ['#E2E8F0', '#A0AEC0'], 
          icon: 'help', 
          label: 'Unknown',
          shadowColor: '#E2E8F0'
        };
    }
  };

  const config = getSeverityConfig();

  return (
    <Animated.View style={[
      styles.severityBadge, 
      { transform: [{ scale: scaleAnim }] },
      Platform.OS === 'ios' && {
        shadowColor: config.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }
    ]}>
      <LinearGradient
        colors={config.colors}
        style={styles.severityGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <MaterialIcons name={config.icon} size={14} color={COLORS.whiteFFFFFF} />
        <Text variant="semibold11" color={COLORS.whiteFFFFFF} style={styles.severityText} numberOfLines={1}>
          {config.label}
        </Text>
        <View style={styles.errorCountBadge}>
          <Text variant="semibold10" color={config.colors[0]} numberOfLines={1}>
            {count}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Enhanced Area Card with Swipe Gestures
const AreaCard = ({ area, onPress, quotaAvailable, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger?.('impactMedium');
    } else {
      Vibration.vibrate(75);
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    onPress(area);
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: swipeAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > 100) {
        // Haptic feedback for swipe action
        if (Platform.OS === 'ios') {
          const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
          ReactNativeHapticFeedback?.trigger?.('notificationSuccess');
        } else {
          Vibration.vibrate([0, 100, 50, 100]);
        }
        
        // Quick action based on swipe direction
        if (translationX > 0) {
          // Swipe right - quick access
          handlePress();
        } else {
          // Swipe left - bookmark/favorite action
          Alert.alert('Bookmarked', `${area.topic} added to favorites!`);
        }
      }
      
      // Reset position
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const hasDetailedInsight = area.hasDetailedInsight || false;
  const canAccessInsight = quotaAvailable || hasDetailedInsight;

  const getCardGradient = () => {
    if (area.severity === 'critical') return ['rgba(255,107,107,0.05)', 'rgba(229,62,62,0.05)'];
    if (area.severity === 'high') return ['rgba(255,140,66,0.05)', 'rgba(255,107,53,0.05)'];
    if (area.severity === 'medium') return ['rgba(255,217,61,0.05)', 'rgba(245,190,0,0.05)'];
    return ['rgba(107,207,127,0.05)', 'rgba(52,168,83,0.05)'];
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.View 
        style={[
          styles.areaCard, 
          { 
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
              { translateX: swipeAnim }
            ],
          }
        ]}>
        <TouchableOpacity
          style={styles.areaCardTouchable}
          onPress={handlePress}
          activeOpacity={0.9}
          disabled={!canAccessInsight}>
          
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', ...getCardGradient()]}
            style={styles.areaCardContent}>
            
            {/* Header */}
            <View style={styles.areaCardHeader}>
              <View style={styles.topicContainer}>
                <Text variant="semibold16" color={COLORS.blue043142} style={styles.topicTitle} numberOfLines={2}>
                  {area.topic}
                </Text>
                <SeverityBadge severity={area.severity} count={area.errorCount} />
              </View>
            </View>

            {/* Basic Insight Preview */}
            {area.basicInsight && (
              <View style={styles.basicInsightPreview}>
                <Text variant="regular13" color={COLORS.grey777777} numberOfLines={2} style={styles.insightPreviewText}>
                  Found in {area.basicInsight.identifiedFrom?.length || 0} quizzes • 
                  {area.basicInsight.recommendedSources?.length || 0} study resources available
                </Text>
              </View>
            )}

            {/* Pattern Data with Glassmorphism */}
            {area.patternData && (
              <View style={styles.patternDataContainer}>
                <LinearGradient
                  colors={['rgba(4,49,66,0.08)', 'rgba(4,49,66,0.12)']}
                  style={styles.patternGradient}>
                  <View style={styles.patternStat}>
                    <Text variant="regular11" color={COLORS.grey777777} numberOfLines={1}>Accuracy</Text>
                    <Text variant="semibold13" color={area.patternData.accuracy > 70 ? COLORS.greenSuccess : COLORS.orange} numberOfLines={1}>
                      {area.patternData.accuracy}%
                    </Text>
                  </View>
                  <View style={styles.patternStatDivider} />
                  <View style={styles.patternStat}>
                    <Text variant="regular11" color={COLORS.grey777777} numberOfLines={1}>Trend</Text>
                    <Text variant="semibold13" color={
                      area.patternData.trajectory === 'improving' ? COLORS.greenSuccess :
                      area.patternData.trajectory === 'declining' ? COLORS.redError : COLORS.grey777777
                    } numberOfLines={1}>
                      {area.patternData.trajectory || 'Stable'}
                    </Text>
                  </View>
                  <View style={styles.patternStatDivider} />
                  <View style={styles.patternStat}>
                    <Text variant="regular11" color={COLORS.grey777777} numberOfLines={1}>Avg Time</Text>
                    <Text variant="semibold13" color={COLORS.blue043142} numberOfLines={1}>
                      {area.patternData.averageTime}s
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Enhanced Action Button */}
            <View style={styles.areaCardFooter}>
              {hasDetailedInsight ? (
                <LinearGradient
                  colors={['#6BCF7F', '#34A853']}
                  style={[styles.insightButton, styles.insightButtonAvailable]}>
                  <MaterialIcons name="check-circle" size={16} color={COLORS.whiteFFFFFF} />
                  <Text variant="semibold13" color={COLORS.whiteFFFFFF} style={styles.buttonText} numberOfLines={1}>
                    View Detailed Insight
                  </Text>
                </LinearGradient>
              ) : quotaAvailable ? (
                <LinearGradient
                  colors={[COLORS.blue043142, COLORS.blue043142 + 'E6']}
                  style={[styles.insightButton, styles.insightButtonFree]}>
                  <MaterialIcons name="psychology" size={16} color={COLORS.whiteFFFFFF} />
                  <Text variant="semibold13" color={COLORS.whiteFFFFFF} style={styles.buttonText} numberOfLines={1}>
                    Get AI Insight (Free)
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.insightButton, styles.insightButtonDisabled]}>
                  <MaterialIcons name="schedule" size={16} color={COLORS.grey777777} />
                  <Text variant="semibold13" color={COLORS.grey777777} style={styles.buttonText} numberOfLines={1}>
                    Quota Exhausted
                  </Text>
                </View>
              )}
            </View>

            {/* Swipe Indicator */}
            <View style={styles.swipeIndicator}>
              <Text variant="regular10" color={COLORS.grey999999} numberOfLines={1}>
                ← Swipe for actions →
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Enhanced Empty State
const EmptyState = ({ onTakeQuiz }) => {
  const bounceAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyIconContainer, { transform: [{ scale: bounceAnim }] }]}>
        <LinearGradient
          colors={['rgba(4,49,66,0.1)', 'rgba(4,49,66,0.05)']}
          style={styles.emptyIconGradient}>
          <MaterialIcons name="school" size={64} color={COLORS.blue043142} />
        </LinearGradient>
      </Animated.View>
      <Text variant="semibold18" color={COLORS.blue043142} style={styles.emptyTitle}>
        No Areas of Improvement Found
      </Text>
      <Text variant="regular14" color={COLORS.grey777777} style={styles.emptyDescription}>
        Great job! You haven't identified any areas needing improvement yet. 
        Take some quizzes to get personalized AI insights.
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={onTakeQuiz}
        activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.blue043142, COLORS.blue043142 + 'E6']}
          style={styles.emptyActionGradient}>
          <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
            Take a Quiz
          </Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.whiteFFFFFF} style={styles.emptyArrow} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Main Component
const AreasOfImprovement = () => {
  const navigation = useNavigation();
  const [areas, setAreas] = useState([]);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bundleOffers, setBundleOffers] = useState([]);
  const [overallPatternInsights, setOverallPatternInsights] = useState(null);

  // Fetch data with enhanced error handling
  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await getAreaInsightsApi({ page: 1, limit: 20 });
      const { insights, quotaInfo: quota, bundleOffers: offers, overallPatternInsights: patterns } = response.data;
      
      // Layout animation for smooth updates
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      setAreas(insights || []);
      setQuotaInfo(quota);
      setBundleOffers(offers || []);
      setOverallPatternInsights(patterns);
    } catch (error) {
      console.error('Error fetching areas:', error);
      Alert.alert('Error', 'Failed to load areas of improvement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRefresh = () => {
    // Haptic feedback for pull-to-refresh
    if (Platform.OS === 'ios') {
      const { ReactNativeHapticFeedback } = require('react-native-haptic-feedback');
      ReactNativeHapticFeedback?.trigger?.('impactLight');
    } else {
      Vibration.vibrate(50);
    }
    
    setRefreshing(true);
    fetchData(true);
  };

  const handleAreaPress = async (area) => {
    const quotaAvailable = quotaInfo && (quotaInfo.limit - quotaInfo.used) > 0;
    
    if (!area.hasDetailedInsight && !quotaAvailable) {
      Alert.alert(
        'Quota Exhausted',
        `You've used all ${quotaInfo?.limit || 5} free insights today. More insights will be available in ${getTimeUntilReset(quotaInfo?.resetAt)}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Navigate to detailed insight page
      navigation.navigate(Routes.TopicInsight, { 
        topic: area.topic,
        basicInsight: area.basicInsight,
        patternData: area.patternData
      });
    } catch (error) {
      console.error('Error navigating to insight:', error);
      Alert.alert('Error', 'Failed to load detailed insight');
    }
  };

  const getTimeUntilReset = (resetTime) => {
    if (!resetTime) return 'unknown time';
    const now = moment();
    const reset = moment(resetTime);
    const duration = moment.duration(reset.diff(now));
    
    if (duration.asHours() < 1) {
      return `${Math.ceil(duration.asMinutes())} minutes`;
    }
    return `${Math.floor(duration.asHours())} hours ${duration.minutes()} minutes`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Areas of Improvement" />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['rgba(4,49,66,0.1)', 'rgba(4,49,66,0.05)']}
            style={styles.loadingGradient}>
            <ActivityIndicator size="large" color={COLORS.blue043142} />
            <Text variant="regular14" color={COLORS.grey777777} style={styles.loadingText}>
              Analyzing your learning patterns...
            </Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Areas of Improvement" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.blue043142]}
            tintColor={COLORS.blue043142}
            progressBackgroundColor={COLORS.whiteFFFFFF}
          />
        }
        showsVerticalScrollIndicator={false}>
        
        {/* Enhanced Quota Card */}
        <QuotaCard quotaInfo={quotaInfo} onRefresh={handleRefresh} />

        {/* Areas List */}
        {areas.length === 0 ? (
          <EmptyState onTakeQuiz={() => navigation.navigate(Routes.QuizList)} />
        ) : (
          <View style={styles.areasContainer}>
            <View style={styles.areasHeader}>
              <Text variant="semibold18" color={COLORS.blue043142} numberOfLines={1}>
                Your Learning Areas
              </Text>
              <Text variant="regular13" color={COLORS.grey777777} numberOfLines={1}>
                {areas.length} topic{areas.length !== 1 ? 's' : ''} need{areas.length === 1 ? 's' : ''} improvement
              </Text>
            </View>
            
            {areas.map((area, index) => (
              <AreaCard
                key={area.topic}
                area={area}
                index={index}
                onPress={handleAreaPress}
                quotaAvailable={quotaInfo && (quotaInfo.limit - quotaInfo.used) > 0}
              />
            ))}
          </View>
        )}

        {/* Enhanced Pattern Insights */}
        {overallPatternInsights && (
          <View style={styles.patternInsightsCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(4,49,66,0.05)']}
              style={styles.patternInsightsGradient}>
              <View style={styles.patternInsightsHeader}>
                <MaterialIcons name="analytics" size={20} color={COLORS.blue043142} />
                <Text variant="semibold16" color={COLORS.blue043142} style={styles.patternInsightsTitle} numberOfLines={1}>
                  Learning Patterns
                </Text>
              </View>
              <Text variant="regular13" color={COLORS.grey777777} style={styles.patternInsightsText} numberOfLines={2}>
                Profile: {overallPatternInsights.behavioralProfile?.type || 'Analyzing...'}
              </Text>
              {overallPatternInsights.recommendations?.slice(0, 2).map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialIcons name="lightbulb" size={14} color={COLORS.yellowF5BE00} />
                  <Text variant="regular12" color={COLORS.grey777777} style={styles.recommendationText} numberOfLines={2}>
                    {rec.title}
                  </Text>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingGradient: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  
  // Enhanced Quota Card Styles
  quotaCard: {
    marginVertical: 16,
  },
  glassmorphismCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  quotaGradient: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  quotaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quotaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quotaTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(4,49,66,0.1)',
  },
  quotaProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quotaNumbers: {
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(4,49,66,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 6,
    textAlign: 'center',
  },
  quotaExhaustedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 10,
    backgroundColor: 'rgba(255,140,66,0.1)',
    borderRadius: 10,
  },
  exhaustedText: {
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },

  // Enhanced Area Card Styles
  areasContainer: {
    marginTop: 8,
  },
  areasHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  areaCard: {
    marginBottom: 16,
  },
  areaCardTouchable: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  areaCardContent: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  areaCardHeader: {
    marginBottom: 12,
  },
  topicContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topicTitle: {
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  severityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  severityText: {
    marginLeft: 6,
  },
  errorCountBadge: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  basicInsightPreview: {
    marginBottom: 12,
  },
  insightPreviewText: {
    lineHeight: 18,
  },
  patternDataContainer: {
    marginBottom: 16,
  },
  patternGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  patternStat: {
    alignItems: 'center',
    flex: 1,
  },
  patternStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(4,49,66,0.2)',
    marginHorizontal: 8,
  },
  areaCardFooter: {
    marginTop: 8,
  },
  insightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  insightButtonAvailable: {
    // Gradient applied via LinearGradient
  },
  insightButtonFree: {
    // Gradient applied via LinearGradient
  },
  insightButtonDisabled: {
    backgroundColor: 'rgba(4,49,66,0.1)',
  },
  buttonText: {
    marginLeft: 8,
  },
  swipeIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },

  // Enhanced Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyArrow: {
    marginLeft: 8,
  },

  // Enhanced Pattern Insights Styles
  patternInsightsCard: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  patternInsightsGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  patternInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternInsightsTitle: {
    marginLeft: 8,
  },
  patternInsightsText: {
    marginBottom: 12,
    lineHeight: 18,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default AreasOfImprovement;