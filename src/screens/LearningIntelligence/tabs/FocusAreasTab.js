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
  Vibration,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';

// Components & Services
import Text from '../../../components/Text';
import { COLORS } from '../../../helper/colors';
import { getAreaInsightsApi } from '../../../services/apiService';
import Routes from '../../../helper/routes';

const { width } = Dimensions.get('window');

// Quota Card Component
const QuotaCard = ({ quotaInfo, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
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
        <View style={styles.quotaContent}>
          <ActivityIndicator size="small" color={COLORS.blue043142} />
          <Text variant="regular13" color={COLORS.grey777777} style={{ marginLeft: 8 }}>
            Loading quota...
          </Text>
        </View>
      </View>
    );
  }

  const remaining = quotaInfo.limit - quotaInfo.used;
  const quotaColor = getQuotaColor();
  const progressPercent = (quotaInfo.used / quotaInfo.limit) * 100;

  return (
    <View style={styles.quotaCard}>
      <View style={styles.quotaHeader}>
        <View style={styles.quotaInfo}>
          <View style={styles.quotaIconContainer}>
            <MaterialIcons name="psychology" size={20} color={COLORS.blue043142} />
          </View>
          <View style={styles.quotaTextContainer}>
            <Text variant="semibold14" color={COLORS.blue043142}>
              Daily AI Insights
            </Text>
            <Text variant="regular11" color={COLORS.grey777777}>
              Free quota resets daily
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handleRefresh}
          style={styles.refreshButton}
          disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={16} 
            color={refreshing ? COLORS.grey777777 : COLORS.blue043142} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.quotaProgress}>
        <View style={styles.quotaNumbers}>
          <Text variant="bold20" color={quotaColor}>
            {remaining}<Text variant="regular14" color={COLORS.grey777777}>/{quotaInfo.limit}</Text>
          </Text>
          <Text variant="regular11" color={COLORS.grey777777}>
            remaining
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: quotaColor
                }
              ]} 
            />
          </View>
          <Text variant="regular10" color={COLORS.grey777777} style={styles.progressText}>
            Resets in {getTimeUntilReset(quotaInfo.resetAt)}
          </Text>
        </View>
      </View>

      {remaining === 0 && (
        <View style={styles.quotaWarning}>
          <MaterialIcons name="schedule" size={14} color={COLORS.orange} />
          <Text variant="regular11" color={COLORS.orange} style={{ marginLeft: 6 }}>
            Quota exhausted • More insights in {getTimeUntilReset(quotaInfo.resetAt)}
          </Text>
        </View>
      )}
    </View>
  );
};

// Updated styles for better alignment
const quotaCardStyles = StyleSheet.create({
  quotaCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Added flex: 1 to take available space
  },
  quotaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.blue043142 + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quotaTextContainer: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center', // Added for proper icon centering
    justifyContent: 'center', // Added for proper icon centering
    width: 32, // Fixed width
    height: 32, // Fixed height
  },
  quotaProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quotaNumbers: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressContainer: {
    flex: 1,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 4,
    textAlign: 'center',
  },
  quotaWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: COLORS.orange + '10',
    borderRadius: 8,
  },
});

// Severity Badge Component
const SeverityBadge = ({ severity, count }) => {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'critical':
        return { color: COLORS.redError, label: 'Critical', icon: 'error' };
      case 'high':
        return { color: COLORS.orange, label: 'High', icon: 'warning' };
      case 'medium':
        return { color: COLORS.yellowF5BE00, label: 'Medium', icon: 'info' };
      case 'low':
        return { color: COLORS.greenSuccess, label: 'Low', icon: 'check-circle' };
      default:
        return { color: COLORS.greyD6D6D6, label: 'Unknown', icon: 'help' };
    }
  };

  const config = getSeverityConfig();

  return (
    <View style={[styles.severityBadge, { backgroundColor: config.color + '15' }]}>
      <MaterialIcons name={config.icon} size={12} color={config.color} />
      <Text variant="semibold10" color={config.color} style={{ marginLeft: 4 }}>
        {config.label}
      </Text>
      <View style={[styles.countBadge, { backgroundColor: config.color }]}>
        <Text variant="semibold9" color={COLORS.whiteFFFFFF}>
          {count}
        </Text>
      </View>
    </View>
  );
};

// Area Card Component
const AreaCard = ({ area, onPress, quotaAvailable, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(50);
    }
    onPress(area);
  };

  const hasDetailedInsight = area.hasDetailedInsight || false;
  const canAccessInsight = quotaAvailable || hasDetailedInsight;

  return (
    <Animated.View style={[styles.areaCard, { opacity: fadeAnim }]}>
      <TouchableOpacity
        style={styles.areaCardContent}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!canAccessInsight}>
        
        {/* Header */}
        <View style={styles.areaHeader}>
          <Text variant="semibold15" color={COLORS.blue043142} style={styles.topicTitle}>
            {area.topic}
          </Text>
          <SeverityBadge severity={area.severity} count={area.errorCount} />
        </View>

        {/* Insight Preview */}
        {area.basicInsight && (
          <View style={styles.insightPreview}>
            <Text variant="regular12" color={COLORS.grey777777}>
              Found in {area.basicInsight.identifiedFrom?.length || 0} quizzes • 
              {area.basicInsight.recommendedSources?.length || 0} resources available
            </Text>
          </View>
        )}

        {/* Pattern Stats */}
        {area.patternData && (
          <View style={styles.patternStats}>
            <View style={styles.statItem}>
              <Text variant="regular10" color={COLORS.grey777777}>Accuracy</Text>
              <Text 
                variant="semibold12" 
                color={area.patternData.accuracy > 70 ? COLORS.greenSuccess : COLORS.orange}>
                {area.patternData.accuracy}%
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="regular10" color={COLORS.grey777777}>Trend</Text>
              <Text 
                variant="semibold12" 
                color={
                  area.patternData.trajectory === 'improving' ? COLORS.greenSuccess :
                  area.patternData.trajectory === 'declining' ? COLORS.redError : COLORS.grey777777
                }>
                {area.patternData.trajectory || 'Stable'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="regular10" color={COLORS.grey777777}>Avg Time</Text>
              <Text variant="semibold12" color={COLORS.blue043142}>
                {area.patternData.averageTime}s
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionButton}>
          {hasDetailedInsight ? (
            <View style={[styles.button, styles.buttonAvailable]}>
              <MaterialIcons name="check-circle" size={14} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{ marginLeft: 6 }}>
                View Detailed Insight
              </Text>
            </View>
          ) : quotaAvailable ? (
            <View style={[styles.button, styles.buttonFree]}>
              <MaterialIcons name="psychology" size={14} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{ marginLeft: 6 }}>
                Get AI Insight (Free)
              </Text>
            </View>
          ) : (
            <View style={[styles.button, styles.buttonDisabled]}>
              <MaterialIcons name="schedule" size={14} color={COLORS.grey777777} />
              <Text variant="semibold12" color={COLORS.grey777777} style={{ marginLeft: 6 }}>
                Quota Exhausted
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Empty State Component
const EmptyState = ({ onTakeQuiz }) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="school" size={48} color={COLORS.greyD6D6D6} />
      </View>
      <Text variant="semibold16" color={COLORS.blue043142} style={styles.emptyTitle}>
        No Areas of Improvement Found
      </Text>
      <Text variant="regular13" color={COLORS.grey777777} style={styles.emptyDescription}>
        Great job! You haven't identified any areas needing improvement yet. 
        Take some quizzes to get personalized AI insights.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onTakeQuiz}
        activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.blue043142, COLORS.blue043142 + 'CC']}
          style={styles.emptyButtonGradient}>
          <Text variant="semibold13" color={COLORS.whiteFFFFFF}>
            Take a Quiz
          </Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.whiteFFFFFF} style={{ marginLeft: 6 }} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Main Focus Areas Tab Component
const FocusAreasTab = () => {
  const navigation = useNavigation();
  const [areas, setAreas] = useState([]);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const response = await getAreaInsightsApi({ page: 1, limit: 20 });
      const { insights, quotaInfo: quota } = response.data;
      
      setAreas(insights || []);
      setQuotaInfo(quota);
    } catch (error) {
      console.error('Error fetching areas:', error);
      Alert.alert('Error', 'Failed to load areas of improvement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleAreaPress = async (area) => {
    const quotaAvailable = quotaInfo && (quotaInfo.limit - quotaInfo.used) > 0;
    
    if (!area.hasDetailedInsight && !quotaAvailable) {
      Alert.alert(
        'Quota Exhausted',
        `You've used all ${quotaInfo?.limit || 5} free insights today. Try again later.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
        <Text variant="regular13" color={COLORS.grey777777} style={{ marginTop: 12 }}>
          Analyzing your learning patterns...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.blue043142]}
          tintColor={COLORS.blue043142}
        />
      }
      showsVerticalScrollIndicator={false}>
      
      {/* Quota Card */}
      <QuotaCard quotaInfo={quotaInfo} onRefresh={fetchData} />

      {/* Areas List */}
      {areas.length === 0 ? (
        <EmptyState onTakeQuiz={() => navigation.navigate(Routes.QuizList)} />
      ) : (
        <View style={styles.areasContainer}>
          <View style={styles.areasHeader}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Your Learning Areas
            </Text>
            <Text variant="regular12" color={COLORS.grey777777}>
              {areas.length} topic{areas.length !== 1 ? 's' : ''} need improvement
            </Text>
          </View>
          
          {areas.map((area, index) => (
            <AreaCard
              key={`${area.topic}-${index}`}
              area={area}
              index={index}
              onPress={handleAreaPress}
              quotaAvailable={quotaInfo && (quotaInfo.limit - quotaInfo.used) > 0}
            />
          ))}
        </View>
      )}
    </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Quota Card Styles
  quotaCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quotaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.blue043142 + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quotaTextContainer: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.greyF7F7F7,
    marginLeft: -30,
  },
  quotaProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quotaNumbers: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressContainer: {
    flex: 1,
  },
  progressBackground: {
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: 4,
    textAlign: 'center',
  },
  quotaWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: COLORS.orange + '10',
    borderRadius: 8,
  },

  // Area Card Styles
  areasContainer: {
    gap: 12,
  },
  areasHeader: {
    marginBottom: 16,
  },
  areaCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  areaCardContent: {
    padding: 16,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitle: {
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    minWidth: 16,
    alignItems: 'center',
  },
  insightPreview: {
    marginBottom: 8,
  },
  patternStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.greyD6D6D6,
    marginHorizontal: 8,
  },
  actionButton: {
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonAvailable: {
    backgroundColor: COLORS.greenSuccess,
  },
  buttonFree: {
    backgroundColor: COLORS.blue043142,
  },
  buttonDisabled: {
    backgroundColor: COLORS.greyEEEEEE,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});

export default FocusAreasTab;