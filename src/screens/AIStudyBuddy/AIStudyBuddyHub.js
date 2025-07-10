// screens/AIStudyBuddy/AIStudyBuddyHub.js
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
  Dimensions,
  FlatList,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import AI Study Buddy API services
import {
  aiStudyBuddyGetQuotaApi,
  aiStudyBuddyGetActiveSessionsApi,
  aiStudyBuddyGetAnalyticsApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';
import mixpanel from '../../helper/mixpanelClient';

const {width: screenWidth} = Dimensions.get('window');

const AIStudyBuddyHub = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    questionsAsked: 0,
    topicsExplored: 0,
    timeSpent: 0,
    streak: 0,
  });

  // Enhanced subject data for Indian competitive exams and higher education
  const competitiveExamSubjects = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: 'calculate',
      color: '#2563EB',
      gradient: ['#2563EB', '#1D4ED8'],
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: 'science',
      color: '#059669',
      gradient: ['#059669', '#047857'],
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: 'biotech',
      color: '#DC2626',
      gradient: ['#DC2626', '#B91C1C'],
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: 'eco',
      color: '#7C3AED',
      gradient: ['#7C3AED', '#6D28D9'],
    },
    {
      id: 'english',
      name: 'English',
      icon: 'menu-book',
      color: '#EA580C',
      gradient: ['#EA580C', '#C2410C'],
    },
    {
      id: 'computer_science',
      name: 'Computer Science',
      icon: 'computer',
      color: '#0891B2',
      gradient: ['#0891B2', '#0E7490'],
    },
    {
      id: 'economics',
      name: 'Economics',
      icon: 'trending-up',
      color: '#BE185D',
      gradient: ['#BE185D', '#A21CAF'],
    },
    {
      id: 'accountancy',
      name: 'Accountancy',
      icon: 'account-balance',
      color: '#059669',
      gradient: ['#059669', '#047857'],
    },
    {
      id: 'history',
      name: 'History',
      icon: 'history-edu',
      color: '#B45309',
      gradient: ['#B45309', '#92400E'],
    },
    {
      id: 'geography',
      name: 'Geography',
      icon: 'public',
      color: '#065F46',
      gradient: ['#065F46', '#064E3B'],
    },
    {
      id: 'political_science',
      name: 'Political Science',
      icon: 'gavel',
      color: '#7C2D12',
      gradient: ['#7C2D12', '#6B2410'],
    },
    {
      id: 'psychology',
      name: 'Psychology',
      icon: 'psychology',
      color: '#BE123C',
      gradient: ['#BE123C', '#A21CAF'],
    },
  ];

  // Quick actions (reduced as requested)
  const quickActions = [
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: 'bookmark',
      color: '#F59E0B',
      route: Routes.AIStudyBuddyBookmarks,
    },
    {
      id: 'history',
      title: 'History',
      icon: 'history',
      color: '#059669',
      route: Routes.AIStudyBuddySessionHistory,
    },
    {
      id: 'search',
      title: 'Search',
      icon: 'search',
      color: COLORS.blue043142,
      route: Routes.AIStudyBuddySearchMessages,
    },
  ];

  // Load initial data
  const loadData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        // Fetch all required data in parallel
        const [quotaResponse, sessionsResponse, analyticsResponse] =
          await Promise.all([
            aiStudyBuddyGetQuotaApi().catch(() => ({data: {quota: null}})),
            aiStudyBuddyGetActiveSessionsApi().catch(() => ({
              data: {activeSessions: []},
            })),
            aiStudyBuddyGetAnalyticsApi('7d').catch(() => ({
              data: {analytics: null},
            })),
          ]);

        setQuotaInfo(quotaResponse.data.quota);
        setActiveSessions(sessionsResponse.data.activeSessions || []);

        // Set analytics data
        if (analyticsResponse.data.analytics) {
          const analytics = analyticsResponse.data.analytics;
          setWeeklyStats({
            questionsAsked: analytics.overview?.totalMessages || 0,
            topicsExplored: analytics.topicsExplored?.length || 0,
            timeSpent: Math.round(
              (analytics.overview?.totalStudyTime || 0) / 60,
            ),
            streak: analytics.overview?.currentStreak || 0,
          });
        }

        // Calculate today's stats if analytics not available
        if (!analyticsResponse.data.analytics) {
          calculateTodayStats(sessionsResponse.data.activeSessions);
        }
      } catch (error) {
        console.error('Load data error:', error);
        showToast({
          message: formatAiStudyBuddyError(error),
          type: 'error',
        });
      } finally {
        if (showLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  // Calculate today's learning stats (fallback)
  const calculateTodayStats = sessions => {
    const today = new Date().toDateString();
    const todaySessions =
      sessions?.filter(
        s => new Date(s.lastMessageAt).toDateString() === today,
      ) || [];

    const stats = {
      questionsAsked: todaySessions.reduce(
        (sum, s) => sum + (s.messageCount || 0),
        0,
      ),
      topicsExplored: new Set(
        todaySessions.flatMap(s => s.topicsDiscussed || []),
      ).size,
      timeSpent: Math.round(
        todaySessions.reduce((sum, s) => {
          if (s.startedAt && s.lastMessageAt) {
            return (
              sum +
              (new Date(s.lastMessageAt) - new Date(s.startedAt)) /
                (1000 * 60 * 60)
            );
          }
          return sum;
        }, 0),
      ),
      streak: 1,
    };

    setWeeklyStats(stats);
  };

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Get appropriate greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Render hero section with improved design
  const renderHeroSection = () => {
    const greeting = getGreeting();
    const firstName = userData?.firstname || 'Student';

    return (
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.heroGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.heroContent}>
            <Text style={styles.greetingText}>
              {greeting}, {firstName}! 👋
            </Text>
            <Text style={styles.motivationText}>Ready to ace your exams?</Text>

            {/* Main CTA Button */}
            <Pressable
              style={styles.mainCTAButton}
              onPress={() =>
                navigation.navigate(Routes.AIStudyBuddyNewSession)
              }>
              <Icon name="chat" size={20} color="#1E40AF" />
              <Text style={styles.ctaText}>Start Learning</Text>
              <Icon name="arrow-forward" size={16} color="#1E40AF" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Render compact stats section
  const renderStatsSection = () => {
    if (
      !weeklyStats.questionsAsked &&
      !weeklyStats.topicsExplored &&
      !weeklyStats.timeSpent
    ) {
      return null;
    }

    const stats = [
      {
        title: 'Questions',
        value: weeklyStats.questionsAsked.toString(),
        icon: 'quiz',
        color: '#2563EB',
      },
      {
        title: 'Topics',
        value: weeklyStats.topicsExplored.toString(),
        icon: 'explore',
        color: '#059669',
      },
      {
        title: 'Hours',
        value: `${weeklyStats.timeSpent}h`,
        icon: 'access-time',
        color: '#DC2626',
      },
    ];

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View
                style={[styles.statIcon, {backgroundColor: stat.color + '15'}]}>
                <Icon name={stat.icon} size={16} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render quota status without upgrade
  const renderQuotaStatus = () => {
    if (!quotaInfo) return null;

    const remaining = quotaInfo.dailyQuota?.remaining || 0;
    const total = quotaInfo.dailyQuota?.limit || 0;
    const percentage = total > 0 ? ((total - remaining) / total) * 100 : 0;

    return (
      <View style={styles.quotaSection}>
        <View style={styles.quotaCard}>
          <View style={styles.quotaHeader}>
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaTitle}>Daily Questions</Text>
              <Text style={styles.quotaSubtitle}>
                {remaining} of {total} remaining today
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${percentage}%`,
                    backgroundColor:
                      remaining > 2
                        ? '#2563EB'
                        : remaining > 0
                        ? '#DC2626'
                        : '#EF4444',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render compact quick actions
  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <View style={styles.quickActionsGrid}>
        {quickActions.map(action => (
          <Pressable
            key={action.id}
            style={styles.quickActionCard}
            onPress={() => {
              mixpanel.track(`Clicked on ${action.title}`);
              navigation.navigate(action.route);
            }}>
            <View
              style={[
                styles.quickActionIcon,
                {backgroundColor: action.color + '15'},
              ]}>
              <Icon name={action.icon} size={18} color={action.color} />
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Render enhanced subjects section for Indian students
  const renderSubjectsSection = () => {
    const renderSubjectItem = ({item, index}) => (
      <Pressable
        style={styles.subjectCard}
        onPress={() => {
          mixpanel.track(`Clicked on subject ${item.name}`);
          navigation.navigate(Routes.AIStudyBuddyNewSession, {
            preselectedSubject: item.id,
          });
        }}>
        <LinearGradient
          colors={item.gradient}
          style={styles.subjectGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <Icon name={item.icon} size={20} color="white" />
        </LinearGradient>
        <Text style={styles.subjectName}>{item.name}</Text>
      </Pressable>
    );

    return (
      <View style={styles.subjectsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Study Subjects</Text>
          <Pressable
            onPress={() => navigation.navigate(Routes.AIStudyBuddyNewSession)}
            style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="arrow-forward" size={14} color="#2563EB" />
          </Pressable>
        </View>

        <FlatList
          data={competitiveExamSubjects}
          renderItem={renderSubjectItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsList}
        />
      </View>
    );
  };

  // Render recent conversations
  const renderRecentConversations = () => {
    if (!activeSessions?.length) {
      return (
        <View style={styles.conversationsSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <View style={styles.emptyConversations}>
            <Icon name="chat-bubble-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyConversationsText}>No sessions yet</Text>
            <Text style={styles.emptyConversationsSubtext}>
              Start your first study session to see it here
            </Text>
          </View>
        </View>
      );
    }

    const recentSessions = activeSessions.slice(0, 3);

    return (
      <View style={styles.conversationsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <Pressable
            onPress={() =>
              navigation.navigate(Routes.AIStudyBuddySessionHistory)
            }
            style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="arrow-forward" size={14} color="#2563EB" />
          </Pressable>
        </View>

        <View style={styles.conversationsList}>
          {recentSessions.map((session, index) => {
            const subject = competitiveExamSubjects.find(
              s => s.id === session.subject,
            );
            const lastTopic =
              session.topicsDiscussed?.slice(-1)[0] || 'General discussion';

            return (
              <Pressable
                key={session.sessionId}
                style={styles.conversationCard}
                onPress={() =>
                  navigation.navigate(Routes.AIStudyBuddyChat, {
                    sessionId: session.sessionId,
                    subject: session.subject,
                  })
                }>
                <View
                  style={[
                    styles.conversationIcon,
                    {backgroundColor: subject?.color + '15' || '#2563EB15'},
                  ]}>
                  <Icon
                    name={subject?.icon || 'school'}
                    size={16}
                    color={subject?.color || '#2563EB'}
                  />
                </View>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationSubject}>
                    {subject?.name || session.subject}
                  </Text>
                  <Text style={styles.conversationTopic} numberOfLines={1}>
                    {lastTopic}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {getRelativeTime(session.lastMessageAt)}
                  </Text>
                </View>
                <Icon name="arrow-forward-ios" size={12} color="#9CA3AF" />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  // Get relative time string
  const getRelativeTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />

      {/* Header */}
      <Header
        title="AI Study Buddy"
        showBackButton={false}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        {renderHeroSection()}

        {/* Quota Status */}
        {renderQuotaStatus()}

        {/* Stats Section */}
        {renderStatsSection()}

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Subjects Section */}
        {renderSubjectsSection()}

        {/* Recent Conversations */}
        {renderRecentConversations()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: nh(24),
  },

  // Hero Section - Better spacing to prevent cutoff
  heroSection: {
    marginHorizontal: nw(8),
    marginTop: nh(5),
    marginBottom: nh(5),
  },
  heroGradient: {
    paddingVertical: nh(28),

    borderRadius: 16,
    minHeight: nh(240),
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: nh(6),
    textAlign: 'center',
    lineHeight: 24,
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: nh(24),
    lineHeight: 20,
    paddingHorizontal: nw(8),
  },
  mainCTAButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: nh(12),
    paddingHorizontal: nw(24),
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Compact Stats Section
  statsSection: {
    paddingHorizontal: nw(16),
    marginBottom: nh(20),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
    marginHorizontal: nw(16),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: nw(12),
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statIcon: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(6),
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(2),
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },

  // Quota Section
  quotaSection: {
    paddingHorizontal: nw(16),
    marginBottom: nh(20),
  },
  quotaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  quotaInfo: {
    flex: 1,
  },
  quotaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(2),
  },
  quotaSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  progressContainer: {
    marginTop: nh(8),
  },
  progressTrack: {
    height: nh(4),
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  // Compact Quick Actions
  quickActionsSection: {
    paddingHorizontal: nw(16),
    marginBottom: nh(20),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: nw(12),
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  // Enhanced Subjects Section
  subjectsSection: {
    marginBottom: nh(20),
  },
  subjectsList: {
    paddingHorizontal: nw(16),
    gap: nw(12),
  },
  subjectCard: {
    alignItems: 'center',
    marginRight: nw(12),
    width: nw(80),
  },
  subjectGradient: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(6),
  },
  subjectName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Recent Conversations
  conversationsSection: {
    paddingHorizontal: nw(16),
    marginBottom: nh(20),
  },
  emptyConversations: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyConversationsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: nh(12),
    marginBottom: nh(4),
  },
  emptyConversationsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  conversationsList: {
    gap: nh(8),
  },
  conversationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(12),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationIcon: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  conversationInfo: {
    flex: 1,
  },
  conversationSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(2),
  },
  conversationTopic: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: nh(2),
  },
  conversationTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // Bottom spacing
  bottomSpacing: {
    height: nh(24),
  },
});

export default AIStudyBuddyHub;
