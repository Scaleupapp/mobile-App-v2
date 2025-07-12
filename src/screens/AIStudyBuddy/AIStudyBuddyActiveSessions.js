// screens/AIStudyBuddy/AIStudyBuddyActiveSessions.js
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
  Alert,
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
  aiStudyBuddyGetActiveSessionsApi,
  aiStudyBuddyUpdateSessionApi,
  aiStudyBuddyDeleteSessionApi,
  aiStudyBuddyGetQuotaApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

const AIStudyBuddyActiveSessions = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Enhanced subject metadata for higher education
  const subjectMeta = {
    mathematics: {icon: 'calculate', color: '#2563EB', name: 'Mathematics'},
    physics: {icon: 'science', color: '#059669', name: 'Physics'},
    chemistry: {icon: 'biotech', color: '#DC2626', name: 'Chemistry'},
    biology: {icon: 'eco', color: '#7C3AED', name: 'Biology'},
    computer_science: {
      icon: 'computer',
      color: '#0891B2',
      name: 'Computer Science',
    },
    english: {icon: 'menu-book', color: '#EA580C', name: 'English'},
    economics: {icon: 'trending-up', color: '#BE185D', name: 'Economics'},
    management: {icon: 'business', color: '#059669', name: 'Management'},
    mechanical_engineering: {
      icon: 'engineering',
      color: '#7C2D12',
      name: 'Mechanical Engineering',
    },
    electrical_engineering: {
      icon: 'electrical-services',
      color: '#BE123C',
      name: 'Electrical Engineering',
    },
    custom: {icon: 'tune', color: '#6366F1', name: 'Custom Subject'},
  };

  // Load sessions
  const loadSessions = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        const [sessionsResponse, quotaResponse] = await Promise.all([
          aiStudyBuddyGetActiveSessionsApi(),
          aiStudyBuddyGetQuotaApi(),
        ]);

        setSessions(sessionsResponse.data.activeSessions || []);
        setQuotaInfo(quotaResponse.data.quota);
      } catch (error) {
        console.error('Load sessions error:', error);
        showToast({
          title: 'Failed to load sessions. Please try again.',
          type: 'error',
        });
      } finally {
        if (showLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions(false);
  }, [loadSessions]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  // Filter sessions based on selected filter
  const getFilteredSessions = () => {
    switch (selectedFilter) {
      case 'recent':
        return sessions
          .filter(session => {
            const lastMessageTime = new Date(session.lastMessageAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return lastMessageTime > oneDayAgo;
          })
          .sort(
            (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
          );
      case 'paused':
        return sessions.filter(session => session.status === 'paused');
      default:
        return sessions.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
        );
    }
  };

  // Get relative time string
  const getRelativeTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Continue session
  const continueSession = session => {
    navigation.navigate(Routes.AIStudyBuddyChat, {
      sessionId: session.sessionId,
      subject: session.subject,
      syllabus: session.syllabus,
      isNewSession: false,
    });
  };

  // Pause/Resume session
  const toggleSessionStatus = async session => {
    try {
      const newStatus = session.status === 'paused' ? 'resume' : 'pause';

      await aiStudyBuddyUpdateSessionApi(session.sessionId, {
        action: newStatus,
      });

      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s.sessionId === session.sessionId
            ? {...s, status: newStatus === 'resume' ? 'active' : 'paused'}
            : s,
        ),
      );

      showToast({
        title: `Session ${newStatus === 'resume' ? 'resumed' : 'paused'}`,
        type: 'success',
      });
    } catch (error) {
      showToast({
        title: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // Archive session
  const archiveSession = async session => {
    Alert.alert(
      'Archive Session',
      'Are you sure you want to archive this session? You can still access it in your session history.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiStudyBuddyUpdateSessionApi(session.sessionId, {
                action: 'archive',
              });

              // Remove from local state
              setSessions(prev =>
                prev.filter(s => s.sessionId !== session.sessionId),
              );

              showToast({
                message: 'Session archived',
                type: 'success',
              });
            } catch (error) {
              showToast({
                title: formatAiStudyBuddyError(error),
                type: 'error',
              });
            }
          },
        },
      ],
    );
  };

  // View session details
  const viewSessionDetails = session => {
    navigation.navigate(Routes.AIStudyBuddySessionDetails, {
      sessionId: session.sessionId,
    });
  };

  // Get syllabus display name
  const getSyllabusDisplayName = syllabus => {
    const syllabusMap = {
      jee_main: 'JEE Main',
      jee_advanced: 'JEE Advanced',
      neet: 'NEET UG',
      gate: 'GATE',
      cat: 'CAT',
      mat: 'MAT',
      gmat: 'GMAT',
      gre: 'GRE',
      upsc: 'UPSC',
      ssc: 'SSC',
      undergraduate: 'Undergraduate',
      postgraduate: 'Post Graduate',
      mba: 'MBA',
      tech_interviews: 'Tech Interviews',
    };
    return syllabusMap[syllabus] || syllabus.replace('_', ' ').toUpperCase();
  };

  // Render quota status
  const renderQuotaStatus = () => {
    if (!quotaInfo) return null;

    const remaining = quotaInfo.dailyQuota?.remaining || 0;
    const total = quotaInfo.dailyQuota?.limit || 0;

    return (
      <View style={styles.quotaContainer}>
        <LinearGradient
          colors={
            remaining > 5
              ? ['#10B981', '#059669']
              : remaining > 2
              ? ['#F59E0B', '#D97706']
              : ['#EF4444', '#DC2626']
          }
          style={styles.quotaCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Icon name="quiz" size={18} color="white" />
          <Text style={styles.quotaText}>
            {remaining} of {total} questions remaining today
          </Text>
        </LinearGradient>
      </View>
    );
  };

  // Render filter tabs
  const renderFilterTabs = () => {
    const filters = [
      {id: 'all', label: 'All', icon: 'list', count: sessions.length},
      {
        id: 'recent',
        label: 'Recent',
        icon: 'schedule',
        count: sessions.filter(s => {
          const lastMessageTime = new Date(s.lastMessageAt);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return lastMessageTime > oneDayAgo;
        }).length,
      },
      {
        id: 'paused',
        label: 'Paused',
        icon: 'pause',
        count: sessions.filter(s => s.status === 'paused').length,
      },
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}>
          {filters.map(filter => (
            <Pressable
              key={filter.id}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedFilter(filter.id)}>
              <Icon
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.id ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.id && styles.activeFilterTabText,
                ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    {
                      backgroundColor:
                        selectedFilter === filter.id
                          ? 'rgba(255,255,255,0.3)'
                          : '#E5E7EB',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.filterBadgeText,
                      {
                        color:
                          selectedFilter === filter.id ? 'white' : '#64748B',
                      },
                    ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render session item
  const renderSessionItem = ({item: session, index}) => {
    const subject = subjectMeta[session.subject] || {
      icon: 'school',
      color: '#64748B',
      name: session.subject,
    };

    const isPaused = session.status === 'paused';
    const lastTopic =
      session.topicsDiscussed?.slice(-1)[0] ||
      session.learningContext?.topicsDiscussed?.slice(-1)[0] ||
      'General discussion';

    return (
      <View style={styles.sessionCard}>
        <Pressable
          style={[styles.sessionCardContent, isPaused && styles.pausedSession]}
          onPress={() => continueSession(session)}>
          {/* Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionMainInfo}>
              <LinearGradient
                colors={[subject.color, subject.color + 'DD']}
                style={styles.subjectIcon}>
                <Icon name={subject.icon} size={20} color="white" />
              </LinearGradient>

              <View style={styles.sessionDetails}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.syllabusInfo}>
                    {getSyllabusDisplayName(session.syllabus)}
                  </Text>
                  {session.grade && (
                    <>
                      <Text style={styles.metaSeparator}>•</Text>
                      <Text style={styles.gradeInfo}>
                        {session.grade.replace('_', ' ')}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.sessionStatus}>
              <Text style={styles.timeAgo}>
                {getRelativeTime(session.lastMessageAt)}
              </Text>
              {isPaused && (
                <View style={styles.pausedBadge}>
                  <Icon name="pause" size={10} color="#F59E0B" />
                  <Text style={styles.pausedText}>Paused</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content Preview */}
          <View style={styles.sessionContent}>
            <Text style={styles.lastTopic} numberOfLines={1}>
              {lastTopic}
            </Text>

            <View style={styles.sessionStats}>
              <View style={styles.statItem}>
                <Icon name="chat" size={14} color="#9CA3AF" />
                <Text style={styles.statText}>
                  {session.messageCount || 0} messages
                </Text>
              </View>

              {session.topicsDiscussed?.length > 0 && (
                <View style={styles.statItem}>
                  <Icon name="lightbulb" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    {session.topicsDiscussed.length} topics
                  </Text>
                </View>
              )}

              {session.studyTime && (
                <View style={styles.statItem}>
                  <Icon name="schedule" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    {Math.round(session.studyTime / 60)}min
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Learning Goals Preview */}
          {session.learningGoals?.length > 0 && (
            <View style={styles.goalsContainer}>
              <Icon name="flag" size={14} color={subject.color} />
              <Text style={styles.goalsText} numberOfLines={1}>
                {session.learningGoals.join(', ')}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[
              styles.actionButton,
              styles.continueButton,
              {backgroundColor: subject.color},
            ]}
            onPress={() => continueSession(session)}>
            <Icon name="play-arrow" size={16} color="white" />
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => toggleSessionStatus(session)}>
              <Icon
                name={isPaused ? 'play-arrow' : 'pause'}
                size={18}
                color="#64748B"
              />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() => viewSessionDetails(session)}>
              <Icon name="info-outline" size={18} color="#64748B" />
            </Pressable>

            <Pressable
              style={styles.iconButton}
              onPress={() => archiveSession(session)}>
              <Icon name="archive" size={18} color="#64748B" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const emptyStateConfig = {
      all: {
        icon: 'chat-bubble-outline',
        title: 'No Active Sessions',
        message:
          'Start a new conversation with your AI Study Buddy to begin learning!',
      },
      recent: {
        icon: 'schedule',
        title: 'No Recent Sessions',
        message: "You haven't had any study sessions in the last 24 hours.",
      },
      paused: {
        icon: 'pause-circle-outline',
        title: 'No Paused Sessions',
        message:
          'All your sessions are currently active or have been completed.',
      },
    };

    const config = emptyStateConfig[selectedFilter];

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name={config.icon} size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptyMessage}>{config.message}</Text>

        {selectedFilter === 'all' && (
          <Pressable
            style={styles.emptyButton}
            onPress={() => navigation.navigate(Routes.AIStudyBuddyNewSession)}>
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              style={styles.emptyButtonGradient}>
              <Icon name="add" size={20} color="white" />
              <Text style={styles.emptyButtonText}>Start New Session</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    );
  };

  // Render stats summary
  const renderStatsHeader = () => {
    if (sessions.length === 0) return null;

    const totalMessages = sessions.reduce(
      (sum, s) => sum + (s.messageCount || 0),
      0,
    );
    const totalTopics = new Set(sessions.flatMap(s => s.topicsDiscussed || []))
      .size;
    const activeCount = sessions.filter(s => s.status !== 'paused').length;

    return (
      <View style={styles.statsHeader}>
        <View style={styles.statsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{sessions.length}</Text>
            <Text style={styles.summaryLabel}>Total Sessions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalMessages}</Text>
            <Text style={styles.summaryLabel}>Messages</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalTopics}</Text>
            <Text style={styles.summaryLabel}>Topics</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <Header title="Active Sessions" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your study sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredSessions = getFilteredSessions();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <Header
        title="Study Sessions"
        showBackButton
        rightComponent={
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.navigate(Routes.AIStudyBuddyNewSession)}>
            <Icon name="add" size={24} color="#374151" />
          </Pressable>
        }
      />

      {/* Quota Status */}
      {renderQuotaStatus()}

      {/* Stats Header */}
      {renderStatsHeader()}

      {/* Filter Tabs */}
      {sessions.length > 0 && renderFilterTabs()}

      {/* Sessions List */}
      <View style={styles.content}>
        {filteredSessions.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredSessions}
            renderItem={renderSessionItem}
            keyExtractor={item => item.sessionId}
            contentContainerStyle={styles.sessionsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      {sessions.length > 0 && (
        <Pressable
          style={styles.fab}
          onPress={() => navigation.navigate(Routes.AIStudyBuddyNewSession)}>
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={styles.fabGradient}>
            <Icon name="add" size={24} color="white" />
          </LinearGradient>
        </Pressable>
      )}
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
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  headerButton: {
    padding: nw(8),
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },

  // Quota Status
  quotaContainer: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(16),
  },
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
    paddingHorizontal: nw(16),
    borderRadius: 12,
    gap: nw(8),
  },
  quotaText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },

  // Stats Header
  statsHeader: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(16),
  },
  statsSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: nw(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(2),
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Filter Tabs
  filterContainer: {
    paddingBottom: nh(16),
    backgroundColor: '#F8FAFC',
  },
  filtersContent: {
    paddingHorizontal: nw(16),
    gap: nw(12),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: nw(6),
  },
  activeFilterTab: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    minWidth: nw(18),
    height: nw(18),
    borderRadius: nw(9),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: nw(4),
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Sessions List
  sessionsList: {
    padding: nw(16),
    gap: nh(12),
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionCardContent: {
    padding: nw(16),
  },
  pausedSession: {
    opacity: 0.7,
  },

  // Session Header
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(12),
  },
  sessionMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  sessionDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(4),
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  syllabusInfo: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  gradeInfo: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sessionStatus: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: nh(4),
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: 10,
    gap: nw(2),
  },
  pausedText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '600',
  },

  // Session Content
  sessionContent: {
    marginBottom: nh(12),
  },
  lastTopic: {
    fontSize: 13,
    color: '#374151',
    marginBottom: nh(8),
    fontStyle: 'italic',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: nw(16),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  statText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Learning Goals
  goalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: nw(8),
    borderRadius: 8,
    marginBottom: nh(8),
    gap: nw(8),
  },
  goalsText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: nw(12),
  },
  actionButton: {
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
    borderRadius: 8,
    gap: nw(6),
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  iconButton: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(32),
  },
  emptyIconContainer: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(8),
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: nh(24),
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(24),
    gap: nw(8),
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: nh(24),
    right: nw(16),
    borderRadius: nw(28),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIStudyBuddyActiveSessions;
