import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Components & Services
import Text from '../../../components/Text';
import { COLORS } from '../../../helper/colors';
import { UserAnalytics } from '../../../services/apiService';
import { getTimeAgo } from '../../../helper/commonFunctions';
import Routes from '../../../helper/routes';

const { width, height } = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

// Stats Overview Component
const StatsOverview = ({ stats }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  const statsArray = [
    { key: 'totalQuizzes', label: 'Quizzes', icon: 'quiz', color: COLORS.blue043142 },
    { key: 'totalQuestions', label: 'Questions', icon: 'help-outline', color: COLORS.purple || COLORS.blue043142 },
    { key: 'accuracy', label: 'Accuracy', icon: 'target', color: COLORS.greenSuccess, suffix: '%' },
    { key: 'streakDays', label: 'Streak', icon: 'local-fire-department', color: COLORS.orange, suffix: stats.streakDays > 0 ? ' 🔥' : '' },
  ];

  return (
    <Animated.View style={[styles.statsContainer, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.statsHeader}>
        <MaterialIcons name="analytics" size={20} color={COLORS.blue043142} />
        <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
          Performance Overview
        </Text>
      </View>
      
      <View style={styles.statsGrid}>
        {statsArray.map((stat, index) => {
          const value = stats[stat.key] || 0;
          return (
            <View key={stat.key} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <MaterialIcons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text variant="bold16" color={COLORS.blue043142}>
                {value}{stat.suffix || ''}
              </Text>
              <Text variant="regular10" color={COLORS.grey777777} style={{ textAlign: 'center' }}>
                {stat.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

// Activity Section Component
const ActivitySection = ({ activity, navigation }) => {
  const [showAll, setShowAll] = useState(false);

  if (!activity || activity.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="visibility" size={20} color={COLORS.blue043142} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Profile Views
          </Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="visibility-off" size={32} color={COLORS.greyD6D6D6} />
          <Text variant="regular13" color={COLORS.grey777777} style={{ marginTop: 8 }}>
            No profile views yet
          </Text>
        </View>
      </View>
    );
  }

  const displayData = showAll ? activity : activity.slice(0, 3);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="visibility" size={20} color={COLORS.blue043142} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Profile Views
          </Text>
        </View>
        <Text variant="regular12" color={COLORS.grey777777}>
          {activity.length} total views
        </Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item, index) => `activity-${index}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.activityItem}
            onPress={() => navigation.navigate(Routes.OtherProfile, { id: item?.userId })}
            activeOpacity={0.8}>
            <View style={styles.activityContent}>
              {item.profilePicture ? (
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <LinearGradient
                  colors={[COLORS.blue043142, COLORS.blue043142 + 'CC']}
                  style={styles.profilePlaceholder}>
                  <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
                    {item.username ? item.username[0].toUpperCase() : '?'}
                  </Text>
                </LinearGradient>
              )}
              
              <View style={styles.activityDetails}>
                <Text variant="semibold13" color={COLORS.blue043142} numberOfLines={1}>
                  {item.username || 'Unknown User'}
                </Text>
                <View style={styles.activityMeta}>
                  <Text variant="regular11" color={COLORS.grey777777}>
                    {getTimeAgo(item.timestamp)}
                  </Text>
                  <Text variant="regular11" color={COLORS.grey777777}>
                    • {item.count || 0} views
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.grey777777} />
          </TouchableOpacity>
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {activity.length > 3 && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.8}>
          <Text variant="semibold13" color={COLORS.blue043142}>
            {showAll ? 'Show Less' : `View All ${activity.length} Views`}
          </Text>
          <Ionicons 
            name={showAll ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={COLORS.blue043142}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Interests Section Component
const InterestsSection = ({ interests }) => {
  const [showAll, setShowAll] = useState(false);

  if (!interests || interests.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="favorite" size={20} color={COLORS.blue043142} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Learning Interests
          </Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="explore-off" size={32} color={COLORS.greyD6D6D6} />
          <Text variant="regular13" color={COLORS.grey777777} style={{ marginTop: 8 }}>
            Take quizzes to discover your interests
          </Text>
        </View>
      </View>
    );
  }

  const displayData = showAll ? interests : interests.slice(0, 5);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="favorite" size={20} color={COLORS.blue043142} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Learning Interests
          </Text>
        </View>
        <Text variant="regular12" color={COLORS.grey777777}>
          {interests.length} topics
        </Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item, index) => `interest-${index}`}
        renderItem={({ item, index }) => {
          const topic = item?.interest || item?.topic || 'Unknown Topic';
          const count = item?.count || 0;
          
          return (
            <View style={styles.listItem}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemLeft}>
                  <View style={[styles.listItemIcon, { backgroundColor: COLORS.blue043142 + '15' }]}>
                    <MaterialIcons name="topic" size={16} color={COLORS.blue043142} />
                  </View>
                  <Text variant="semibold13" color={COLORS.blue043142} style={{ marginLeft: 10, flex: 1 }}>
                    {topic}
                  </Text>
                </View>
                {count > 0 && (
                  <View style={styles.countBadge}>
                    <Text variant="semibold11" color={COLORS.blue043142}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {interests.length > 5 && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.8}>
          <Text variant="semibold13" color={COLORS.blue043142}>
            {showAll ? 'Show Less' : `View All ${interests.length} Interests`}
          </Text>
          <Ionicons 
            name={showAll ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={COLORS.blue043142}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Areas of Improvement Section Component
const AreasSection = ({ areas, navigation }) => {
  const [showAll, setShowAll] = useState(false);

  if (!areas || areas.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="trending-up" size={20} color={COLORS.orange} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Areas of Improvement
          </Text>
        </View>
        <View style={styles.improvementPrompt}>
          <LinearGradient
            colors={[COLORS.orange + '08', COLORS.orange + '15']}
            style={styles.promptGradient}>
            <MaterialIcons name="psychology" size={28} color={COLORS.orange} />
            <Text variant="semibold15" color={COLORS.blue043142} style={{ marginTop: 12, marginBottom: 6 }}>
              Ready to Grow?
            </Text>
            <Text variant="regular12" color={COLORS.grey777777} style={{ textAlign: 'center', marginBottom: 16 }}>
              Take more quizzes to identify areas where you can improve and unlock personalized insights.
            </Text>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => navigation.navigate(Routes.QuizList)}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.orange, COLORS.orange + 'DD']}
                style={styles.promptButtonGradient}>
                <MaterialIcons name="quiz" size={16} color={COLORS.whiteFFFFFF} />
                <Text variant="semibold13" color={COLORS.whiteFFFFFF} style={{ marginLeft: 6 }}>
                  Take Quiz
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  const displayData = showAll ? areas : areas.slice(0, 5);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="trending-up" size={20} color={COLORS.orange} />
          <Text variant="semibold16" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
            Areas of Improvement
          </Text>
        </View>
        <Text variant="regular12" color={COLORS.grey777777}>
          {areas.length} areas identified
        </Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item, index) => `area-${index}`}
        renderItem={({ item, index }) => {
          const topic = item?.topic || item?.interest || 'Unknown Area';
          const count = item?.count || 0;
          
          return (
            <View style={styles.listItem}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemLeft}>
                  <View style={[styles.listItemIcon, { backgroundColor: COLORS.orange + '15' }]}>
                    <MaterialIcons name="flag" size={16} color={COLORS.orange} />
                  </View>
                  <Text variant="semibold13" color={COLORS.blue043142} style={{ marginLeft: 10, flex: 1 }}>
                    {topic}
                  </Text>
                </View>
                {count > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: COLORS.orange + '15' }]}>
                    <Text variant="semibold11" color={COLORS.orange}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {areas.length > 5 && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAll(!showAll)}
          activeOpacity={0.8}>
          <Text variant="semibold13" color={COLORS.blue043142}>
            {showAll ? 'Show Less' : `View All ${areas.length} Areas`}
          </Text>
          <Ionicons 
            name={showAll ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={COLORS.blue043142}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main Analytics Tab Component
const AnalyticsTab = () => {
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      console.log('AnalyticsTab: Starting fetchData, isRefresh:', isRefresh);
      if (!isRefresh) setLoading(true);
      
      const response = await UserAnalytics();
      console.log('AnalyticsTab: API Response received:', !!response);
      
      if (response && response.data) {
        setData(response.data);
        console.log('AnalyticsTab: Data set successfully');
      } else {
        console.log('AnalyticsTab: No data in response');
        setData({});
      }
    } catch (error) {
      console.error('AnalyticsTab: Error fetching data:', error);
      setData({});
    } finally {
      console.log('AnalyticsTab: Setting loading to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('AnalyticsTab: useFocusEffect triggered');
      fetchData();
    }, [])
  );

  const handleRefresh = () => {
    console.log('AnalyticsTab: Refresh triggered');
    setRefreshing(true);
    fetchData(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="semibold18" color={COLORS.blue043142}>
        Analytics & Performance
      </Text>
      <Text variant="regular12" color={COLORS.grey777777}>
        Your learning journey insights
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="analytics" size={64} color={COLORS.greyD6D6D6} />
      </View>
      <Text variant="semibold18" color={COLORS.blue043142} style={styles.emptyTitle}>
        No Analytics Data Yet
      </Text>
      <Text variant="regular14" color={COLORS.grey777777} style={styles.emptyDescription}>
        Start taking quizzes and engaging with the platform to generate your personalized analytics.
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={() => navigation.navigate(Routes.QuizList)}
        activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.blue043142, COLORS.blue043142 + 'E6']}
          style={styles.emptyActionGradient}>
          <MaterialIcons name="quiz" size={18} color={COLORS.whiteFFFFFF} />
          <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{ marginLeft: 8 }}>
            Start Learning
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  console.log('AnalyticsTab: Rendering - loading:', loading, 'hasData:', !!data);

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="regular14" color={COLORS.grey777777} style={{ marginTop: 16 }}>
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderEmpty()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        
        {renderHeader()}

        {/* Stats Overview */}
        <StatsOverview stats={data.stats} />

        {/* Profile Views */}
        <ActivitySection activity={data.activity} navigation={navigation} />

        {/* Learning Interests */}
        <InterestsSection interests={data.interests} />

        {/* Areas of Improvement */}
        <AreasSection areas={data.areasOfImprovement} navigation={navigation} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  header: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Stats Overview
  statsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.greyF7F7F7,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  // Section Container
  sectionContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  // Activity Items
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    padding: 12,
    borderRadius: 10,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityDetails: {
    flex: 1,
  },
  activityMeta: {
    flexDirection: 'row',
    marginTop: 2,
  },

  // List Items
  listItem: {
    backgroundColor: COLORS.greyF7F7F7,
    padding: 12,
    borderRadius: 10,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: COLORS.blue043142 + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Toggle Button
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.blue043142 + '08',
    borderRadius: 8,
  },

  // Improvement Prompt
  improvementPrompt: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  promptGradient: {
    alignItems: 'center',
    padding: 20,
  },
  promptButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  promptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default AnalyticsTab;