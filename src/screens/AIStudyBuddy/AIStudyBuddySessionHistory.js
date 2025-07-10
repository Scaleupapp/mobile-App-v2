// screens/AIStudyBuddy/AIStudyBuddySessionHistory.js
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
  TextInput,
  Modal,
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
  aiStudyBuddyGetSessionHistoryApi,
  aiStudyBuddyDeleteSessionApi,
  aiStudyBuddyUpdateSessionApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddySessionHistory = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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

  // Available subjects for filtering
  const subjects = [
    {id: 'all', name: 'All Subjects'},
    {id: 'mathematics', name: 'Mathematics'},
    {id: 'physics', name: 'Physics'},
    {id: 'chemistry', name: 'Chemistry'},
    {id: 'biology', name: 'Biology'},
    {id: 'computer_science', name: 'Computer Science'},
    {id: 'english', name: 'English'},
    {id: 'economics', name: 'Economics'},
    {id: 'management', name: 'Management'},
    {id: 'mechanical_engineering', name: 'Mechanical Eng.'},
    {id: 'electrical_engineering', name: 'Electrical Eng.'},
  ];

  // Status options
  const statusOptions = [
    {id: 'all', name: 'All Sessions', icon: 'list'},
    {id: 'completed', name: 'Completed', icon: 'check-circle'},
    {id: 'archived', name: 'Archived', icon: 'archive'},
    {id: 'paused', name: 'Paused', icon: 'pause'},
    {id: 'active', name: 'Active', icon: 'play-arrow'},
  ];

  // Time range options
  const timeRanges = [
    {id: 'all', name: 'All Time', icon: 'date-range'},
    {id: 'today', name: 'Today', icon: 'today'},
    {id: 'week', name: 'This Week', icon: 'view-week'},
    {id: 'month', name: 'This Month', icon: 'calendar-month'},
    {id: 'quarter', name: 'Last 3 Months', icon: 'calendar-view-month'},
  ];

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

  // Load session history
  const loadSessions = useCallback(
    async (pageNum = 1, showLoader = true) => {
      try {
        if (showLoader && pageNum === 1) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        const params = {
          page: pageNum,
          limit: 20,
          ...(selectedSubject !== 'all' && {subject: selectedSubject}),
          ...(selectedStatus !== 'all' && {status: selectedStatus}),
        };

        const response = await aiStudyBuddyGetSessionHistoryApi(params);

        const newSessions = response.data.sessions || [];

        if (pageNum === 1) {
          setSessions(newSessions);
          setPage(1);
        } else {
          setSessions(prev => [...prev, ...newSessions]);
        }

        setHasMore(newSessions.length === 20);
        setPage(pageNum);
      } catch (error) {
        console.error('Load session history error:', error);
        showToast({
          message: 'Failed to load session history. Please try again.',
          type: 'error',
        });
      } finally {
        if (showLoader && pageNum === 1) setLoading(false);
        if (pageNum > 1) setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedSubject, selectedStatus, showToast],
  );

  // Filter sessions based on search and time range
  useEffect(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        const subject =
          subjectMeta[session.subject]?.name.toLowerCase() ||
          session.subject.toLowerCase();
        const topics =
          session.topicsDiscussed?.join(' ').toLowerCase() ||
          session.learningContext?.topicsDiscussed?.join(' ').toLowerCase() ||
          '';
        const goals =
          session.learningGoals?.join(' ').toLowerCase() ||
          session.learningContext?.learningGoals?.join(' ').toLowerCase() ||
          '';

        return (
          subject.includes(query) ||
          topics.includes(query) ||
          goals.includes(query) ||
          session.syllabus?.toLowerCase().includes(query)
        );
      });
    }

    // Apply time range filter
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (selectedTimeRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(
        session => new Date(session.startedAt) >= filterDate,
      );
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, selectedTimeRange]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions(1, false);
  }, [loadSessions]);

  // Load more data
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      loadSessions(page + 1, false);
    }
  }, [hasMore, loadingMore, loading, page, loadSessions]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  // Apply filters
  const applyFilters = useCallback(() => {
    setShowFilters(false);
    loadSessions(1, true);
  }, [loadSessions]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedStatus('all');
    setSelectedTimeRange('all');
    setShowFilters(false);
    loadSessions(1, true);
  };

  // Get relative time string
  const getRelativeTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  // Get session duration
  const getSessionDuration = session => {
    if (!session.startedAt) return 'Unknown';

    const start = new Date(session.startedAt);
    const end = session.completedAt
      ? new Date(session.completedAt)
      : new Date(session.lastMessageAt);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // View session details
  const viewSessionDetails = session => {
    navigation.navigate(Routes.AIStudyBuddySessionDetails, {
      sessionId: session.sessionId,
    });
  };

  // Restart similar session
  const restartSimilarSession = session => {
    navigation.navigate(Routes.AIStudyBuddyNewSession, {
      preselectedSubject: session.subject,
      preselectedSyllabus: session.syllabus,
      initialQuery: `Continue learning about ${
        session.topicsDiscussed?.slice(-1)[0] ||
        session.learningContext?.topicsDiscussed?.slice(-1)[0] ||
        session.subject
      }`,
    });
  };

  // Restore session (unarchive)
  const restoreSession = async session => {
    try {
      await aiStudyBuddyUpdateSessionApi(session.sessionId, {
        action: 'unarchive',
      });

      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s.sessionId === session.sessionId ? {...s, status: 'active'} : s,
        ),
      );

      showToast({
        message: 'Session restored to active',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // Delete session permanently
  const deleteSession = async session => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to permanently delete this session? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiStudyBuddyDeleteSessionApi(session.sessionId, true);

              // Remove from local state
              setSessions(prev =>
                prev.filter(s => s.sessionId !== session.sessionId),
              );

              showToast({
                message: 'Session deleted permanently',
                type: 'success',
              });
            } catch (error) {
              showToast({
                message: formatAiStudyBuddyError(error),
                type: 'error',
              });
            }
          },
        },
      ],
    );
  };

  // Render search bar with enhanced design
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sessions, topics, or subjects..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}>
            <Icon name="close" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <Pressable
        style={[
          styles.filterButton,
          {
            backgroundColor:
              selectedSubject !== 'all' ||
              selectedStatus !== 'all' ||
              selectedTimeRange !== 'all'
                ? '#2563EB15'
                : '#F8FAFC',
          },
        ]}
        onPress={() => setShowFilters(true)}>
        <Icon
          name="tune"
          size={20}
          color={
            selectedSubject !== 'all' ||
            selectedStatus !== 'all' ||
            selectedTimeRange !== 'all'
              ? '#2563EB'
              : '#64748B'
          }
        />
        {(selectedSubject !== 'all' ||
          selectedStatus !== 'all' ||
          selectedTimeRange !== 'all') && (
          <View style={styles.filterActiveBadge} />
        )}
      </Pressable>
    </View>
  );

  // Render session item with enhanced design
  const renderSessionItem = ({item: session, index}) => {
    const subject = subjectMeta[session.subject] || {
      icon: 'school',
      color: '#64748B',
      name: session.subject,
    };

    const isCompleted = session.status === 'completed';
    const isArchived = session.status === 'archived';
    const isPaused = session.status === 'paused';
    const isActive = session.status === 'active';

    const statusConfig = {
      completed: {color: '#10B981', bgColor: '#10B98115', icon: 'check-circle'},
      archived: {color: '#64748B', bgColor: '#64748B15', icon: 'archive'},
      paused: {color: '#F59E0B', bgColor: '#F59E0B15', icon: 'pause'},
      active: {color: '#2563EB', bgColor: '#2563EB15', icon: 'play-arrow'},
    };

    const status = statusConfig[session.status] || statusConfig.active;

    return (
      <View style={styles.sessionCard}>
        <Pressable
          style={[
            styles.sessionCardContent,
            (isArchived || isPaused) && styles.inactiveSession,
          ]}
          onPress={() => viewSessionDetails(session)}>
          {/* Header */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionMainInfo}>
              <LinearGradient
                colors={[subject.color, subject.color + 'DD']}
                style={styles.subjectIcon}>
                <Icon name={subject.icon} size={18} color="white" />
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

            <View style={styles.sessionStatusArea}>
              <Text style={styles.timeAgo}>
                {getRelativeTime(session.startedAt)}
              </Text>
              <View
                style={[styles.statusBadge, {backgroundColor: status.bgColor}]}>
                <Icon name={status.icon} size={10} color={status.color} />
                <Text style={[styles.statusText, {color: status.color}]}>
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Content Preview */}
          <View style={styles.sessionContent}>
            <Text style={styles.sessionSummary} numberOfLines={2}>
              {session.topicsDiscussed?.slice(-2).join(', ') ||
                session.learningContext?.topicsDiscussed
                  ?.slice(-2)
                  .join(', ') ||
                'General discussion'}
            </Text>

            <View style={styles.sessionStats}>
              <View style={styles.statItem}>
                <Icon name="chat" size={12} color="#9CA3AF" />
                <Text style={styles.statText}>
                  {session.messageCount || 0} messages
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="schedule" size={12} color="#9CA3AF" />
                <Text style={styles.statText}>
                  {getSessionDuration(session)}
                </Text>
              </View>
              {(session.topicsDiscussed?.length > 0 ||
                session.learningContext?.topicsDiscussed?.length > 0) && (
                <View style={styles.statItem}>
                  <Icon name="lightbulb" size={12} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    {session.topicsDiscussed?.length ||
                      session.learningContext?.topicsDiscussed?.length ||
                      0}{' '}
                    topics
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Learning Goals Preview */}
          {(session.learningGoals?.length > 0 ||
            session.learningContext?.learningGoals?.length > 0) && (
            <View style={styles.goalsPreview}>
              <Icon name="flag" size={12} color={subject.color} />
              <Text style={styles.goalsText} numberOfLines={1}>
                {(
                  session.learningGoals ||
                  session.learningContext?.learningGoals ||
                  []
                )
                  .slice(0, 2)
                  .join(', ')}
                {(
                  session.learningGoals ||
                  session.learningContext?.learningGoals ||
                  []
                ).length > 2 &&
                  ` +${
                    (
                      session.learningGoals ||
                      session.learningContext?.learningGoals ||
                      []
                    ).length - 2
                  } more`}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, {backgroundColor: subject.color}]}
            onPress={() => viewSessionDetails(session)}>
            <Icon name="info-outline" size={14} color="white" />
            <Text style={styles.actionButtonText}>Details</Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => restartSimilarSession(session)}>
              <Icon name="refresh" size={16} color="#64748B" />
            </Pressable>

            {isArchived && (
              <Pressable
                style={[styles.iconButton, {backgroundColor: '#10B98115'}]}
                onPress={() => restoreSession(session)}>
                <Icon name="unarchive" size={16} color="#10B981" />
              </Pressable>
            )}

            <Pressable
              style={[styles.iconButton, {backgroundColor: '#EF444415'}]}
              onPress={() => deleteSession(session)}>
              <Icon name="delete-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Render enhanced filter modal
  const renderFilterModal = () => (
    <Modal visible={showFilters} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Sessions</Text>
            <Pressable
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}>
              <Icon name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.filterContent}
            showsVerticalScrollIndicator={false}>
            {/* Subject Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Subject</Text>
              <View style={styles.filterOptions}>
                {subjects.map(subject => (
                  <Pressable
                    key={subject.id}
                    style={[
                      styles.filterOption,
                      selectedSubject === subject.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() => setSelectedSubject(subject.id)}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedSubject === subject.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {subject.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {statusOptions.map(status => (
                  <Pressable
                    key={status.id}
                    style={[
                      styles.filterOption,
                      selectedStatus === status.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() => setSelectedStatus(status.id)}>
                    <Icon
                      name={status.icon}
                      size={14}
                      color={selectedStatus === status.id ? 'white' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedStatus === status.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {status.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Time Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Time Range</Text>
              <View style={styles.filterOptions}>
                {timeRanges.map(range => (
                  <Pressable
                    key={range.id}
                    style={[
                      styles.filterOption,
                      selectedTimeRange === range.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() => setSelectedTimeRange(range.id)}>
                    <Icon
                      name={range.icon}
                      size={14}
                      color={
                        selectedTimeRange === range.id ? 'white' : '#64748B'
                      }
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedTimeRange === range.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {range.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Pressable style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={applyFilters}>
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                style={styles.applyButtonGradient}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render empty state
  const renderEmptyState = () => {
    const isFiltered =
      searchQuery ||
      selectedSubject !== 'all' ||
      selectedStatus !== 'all' ||
      selectedTimeRange !== 'all';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon
            name={isFiltered ? 'search-off' : 'history'}
            size={48}
            color="#D1D5DB"
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isFiltered ? 'No Sessions Found' : 'No Session History'}
        </Text>
        <Text style={styles.emptyMessage}>
          {isFiltered
            ? "Try adjusting your search or filters to find what you're looking for."
            : 'Your past conversations will appear here. Start a new session to begin learning!'}
        </Text>

        {isFiltered ? (
          <Pressable style={styles.emptyButton} onPress={clearFilters}>
            <LinearGradient
              colors={['#64748B', '#475569']}
              style={styles.emptyButtonGradient}>
              <Icon name="clear-all" size={20} color="white" />
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
            </LinearGradient>
          </Pressable>
        ) : (
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

  // Render stats header
  const renderStatsHeader = () => {
    if (filteredSessions.length === 0) return null;

    const totalSessions = filteredSessions.length;
    const totalMessages = filteredSessions.reduce(
      (sum, s) => sum + (s.messageCount || 0),
      0,
    );
    const uniqueSubjects = new Set(filteredSessions.map(s => s.subject)).size;
    const completedSessions = filteredSessions.filter(
      s => s.status === 'completed',
    ).length;

    return (
      <View style={styles.statsHeader}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMessages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{uniqueSubjects}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <Header title="Session History" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            Loading your session history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <Header
        title="Session History"
        showBackButton
        rightComponent={
          <Pressable
            style={styles.headerButton}
            onPress={() => setShowFilters(true)}>
            <Icon name="tune" size={24} color="#374151" />
            {(selectedSubject !== 'all' ||
              selectedStatus !== 'all' ||
              selectedTimeRange !== 'all') && (
              <View style={styles.headerFilterBadge} />
            )}
          </Pressable>
        }
      />

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Stats Header */}
      {renderStatsHeader()}

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
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.loadingMoreText}>
                    Loading more sessions...
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Filter Modal */}
      {renderFilterModal()}
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
    position: 'relative',
    borderRadius: 8,
  },
  headerFilterBadge: {
    position: 'absolute',
    top: nw(6),
    right: nw(6),
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    gap: nw(12),
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: nw(12),
    paddingVertical: nh(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: nw(8),
    marginRight: nw(8),
  },
  clearSearchButton: {
    padding: nw(4),
  },
  filterButton: {
    padding: nw(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterActiveBadge: {
    position: 'absolute',
    top: nw(4),
    right: nw(4),
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    backgroundColor: '#2563EB',
  },

  // Stats Header
  statsHeader: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(16),
  },
  statsContainer: {
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(2),
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
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
  inactiveSession: {
    opacity: 0.75,
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
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
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
    marginBottom: nh(3),
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
  sessionStatusArea: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: nh(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: 10,
    gap: nw(2),
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },

  // Session Content
  sessionContent: {
    marginBottom: nh(12),
  },
  sessionSummary: {
    fontSize: 13,
    color: '#374151',
    marginBottom: nh(8),
    lineHeight: 18,
    fontStyle: 'italic',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: nw(16),
  },
  statText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: nw(4),
    fontWeight: '500',
  },

  // Goals Preview
  goalsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: nw(8),
    borderRadius: 8,
    marginBottom: nh(8),
    gap: nw(6),
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(8),
    paddingHorizontal: nw(16),
    borderRadius: 8,
    gap: nw(4),
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  iconButton: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: nh(500),
    maxHeight: screenHeight * 0.8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: nw(4),
  },
  filterContent: {
    flex: 1,
    padding: nw(20),
  },
  filterSection: {
    marginBottom: nh(24),
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(12),
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: nw(4),
  },
  selectedFilterOption: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: nw(12),
    padding: nw(20),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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
    textAlign: 'center',
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

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(20),
    gap: nw(8),
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default AIStudyBuddySessionHistory;
