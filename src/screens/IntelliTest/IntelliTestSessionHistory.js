// =====================================================
// INTELLITEST SESSION HISTORY SCREEN
// File: screens/IntelliTest/IntelliTestSessionHistory.js
// =====================================================

import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import IntelliTest API services
import {
  getIntelliTestSessionHistoryApi,
  getIntelliTestSessionSummaryApi,
  resumeIntelliTestSessionApi,
  startIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const IntelliTestSessionHistory = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  const {filter} = route.params || {}; // 'all', 'completed', 'unfinished'

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(filter || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [resumingSession, setResumingSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced exam metadata - matching API response format
  const examMetadata = {
    'JEE Main': {
      name: 'JEE Main',
      icon: 'engineering',
      bgColor: COLORS.blue043142,
      description: 'Engineering Entrance',
    },
    'NEET': {
      name: 'NEET',
      icon: 'local-hospital',
      bgColor: '#e74c3c',
      description: 'Medical Entrance',
    },
    'CAT': {
      name: 'CAT',
      icon: 'business',
      bgColor: '#9b59b6',
      description: 'Management Entrance',
    },
    'GATE': {
      name: 'GATE',
      icon: 'memory',
      bgColor: '#f39c12',
      description: 'Graduate Aptitude Test',
    },
    'GMAT': {
      name: 'GMAT',
      icon: 'school',
      bgColor: '#27ae60',
      description: 'Global MBA Entrance',
    },
    'UPSC': {
      name: 'UPSC',
      icon: 'account-balance',
      bgColor: '#34495e',
      description: 'Civil Services',
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Sessions', icon: 'list' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'unfinished', label: 'Unfinished', icon: 'pending' },
    { key: 'paused', label: 'Paused', icon: 'pause-circle' },
    { key: 'in_progress', label: 'In Progress', icon: 'timelapse' },
  ];

  // Fetch session history
  const fetchSessionHistory = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getIntelliTestSessionHistoryApi({
        limit: 20,
        page: page,
      });

      if (response.data?.success) {
        const newSessions = response.data.data?.sessions || [];
        const pagination = response.data.data?.pagination || {};

        if (append && page > 1) {
          setSessions(prev => [...prev, ...newSessions]);
        } else {
          setSessions(newSessions);
        }

        setHasNextPage(pagination.hasNextPage || false);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
      showToast({
        message: formatIntelliTestError(error),
        type: 'error',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showToast]);

  // Filter sessions based on selected filter and search
  const filterSessions = useCallback(() => {
    let filtered = sessions;

    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'completed') {
        filtered = sessions.filter(session => 
          session.status === 'completed' || session.overallStats
        );
      } else if (selectedFilter === 'unfinished') {
        filtered = sessions.filter(session => 
          ['paused', 'created', 'in_progress'].includes(session.status)
        );
      } else {
        filtered = sessions.filter(session => session.status === selectedFilter);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.examName?.toLowerCase().includes(query) ||
        session.sessionType?.toLowerCase().includes(query) ||
        session.status?.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, selectedFilter, searchQuery]);

  // Load more sessions
  const loadMoreSessions = useCallback(() => {
    if (!loadingMore && hasNextPage) {
      fetchSessionHistory(currentPage + 1, true);
    }
  }, [loadingMore, hasNextPage, currentPage, fetchSessionHistory]);

  // Refresh sessions
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchSessionHistory(1, false);
    setRefreshing(false);
  }, [fetchSessionHistory]);

  // Resume session handler
  const handleResumeSession = useCallback(async (session) => {
    try {
      setResumingSession(session.sessionId);
      
      if (session.status === 'paused') {
        await resumeIntelliTestSessionApi({ sessionId: session.sessionId });
        showToast({ message: 'Session resumed successfully', type: 'success' });
      } else if (session.status === 'created') {
        await startIntelliTestSessionApi({ sessionId: session.sessionId });
        showToast({ message: 'Assessment started', type: 'success' });
      }
      
      navigation.navigate(Routes.IntelliTestAssessment, {
        sessionId: session.sessionId,
        examId: session.examName, // Use examName as examId since that's what the API provides
        examName: session.examName,
        config: {
          totalQuestions: session.overallStats?.totalQuestions || 30,
          timeLimit: 45, // Default time limit
        }
      });
      
    } catch (error) {
      console.error('Error resuming session:', error);
      showToast({
        message: formatIntelliTestError(error),
        type: 'error',
      });
    } finally {
      setResumingSession(null);
    }
  }, [navigation, showToast]);

  // View session details
  const handleViewSessionDetails = useCallback(async (session) => {
    try {
      setSelectedSession(session);
      
      // Fetch detailed session summary if completed
      if (session.status === 'completed') {
        const response = await getIntelliTestSessionSummaryApi(session.sessionId);
        if (response.data?.success) {
          setSelectedSession({
            ...session,
            detailedStats: response.data.data
          });
        }
      }
      
      setShowSessionModal(true);
    } catch (error) {
      console.error('Error fetching session details:', error);
      setSelectedSession(session);
      setShowSessionModal(true);
    }
  }, []);

  // Get session status info
  const getSessionStatusInfo = (session) => {
    const status = session.status;
    
    switch (status) {
      case 'completed':
        return {
          statusText: 'Completed',
          statusColor: '#10B981',
          icon: 'check-circle',
          canResume: false,
        };
      case 'paused':
        return {
          statusText: 'Paused',
          statusColor: '#F59E0B',
          icon: 'pause-circle',
          canResume: true,
        };
      case 'created':
        return {
          statusText: 'Ready to Start',
          statusColor: '#3B82F6',
          icon: 'play-circle',
          canResume: true,
        };
      case 'in_progress':
        return {
          statusText: 'In Progress',
          statusColor: '#8B5CF6',
          icon: 'timelapse',
          canResume: true,
        };
      default:
        return {
          statusText: 'Unknown',
          statusColor: '#6B7280',
          icon: 'help-outline',
          canResume: false,
        };
    }
  };

  // Format duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime) return 'Not started';
    if (!endTime) return 'In progress';
    
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      fetchSessionHistory(1, false);
    }, [fetchSessionHistory])
  );

  // Filter sessions when data changes
  useEffect(() => {
    filterSessions();
  }, [filterSessions]);

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterTabs}>
          {filterOptions.map((option) => {
            const isSelected = selectedFilter === option.key;
            const count = option.key === 'all' 
              ? sessions.length 
              : sessions.filter(s => 
                  option.key === 'completed' 
                    ? (s.status === 'completed' || s.overallStats)
                    : option.key === 'unfinished'
                    ? ['paused', 'created', 'in_progress'].includes(s.status)
                    : s.status === option.key
                ).length;
            
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setSelectedFilter(option.key)}
              >
                <Icon 
                  name={option.icon} 
                  size={nw(16)} 
                  color={isSelected ? COLORS.whiteFFFFFF : COLORS.grey777777} 
                />
                <Text 
                  variant="medium12" 
                  color={isSelected ? COLORS.whiteFFFFFF : COLORS.grey777777}
                  style={{marginLeft: nw(4)}}
                >
                  {option.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, isSelected && styles.filterBadgeActive]}>
                    <Text 
                      variant="bold10" 
                      color={isSelected ? COLORS.yellowF5BE00 : COLORS.whiteFFFFFF}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // Render session card
  const renderSessionCard = ({item: session}) => {
    const statusInfo = getSessionStatusInfo(session);
    const exam = examMetadata[session.examName] || {
      name: session.examName || 'Assessment',
      icon: 'school',
      bgColor: COLORS.blue043142,
    };
    const isResuming = resumingSession === session.sessionId;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleViewSessionDetails(session)}
        activeOpacity={0.8}
      >
        <View style={styles.sessionHeader}>
          <View style={[styles.sessionExamIcon, {backgroundColor: exam.bgColor}]}>
            <Icon name={exam.icon} size={nw(20)} color={COLORS.whiteFFFFFF} />
          </View>
          
          <View style={styles.sessionInfo}>
            <Text variant="bold16" color={COLORS.blue043142}>
              {exam.name}
            </Text>
            <View style={styles.sessionMeta}>
              <Icon name={statusInfo.icon} size={nw(14)} color={statusInfo.statusColor} />
              <Text variant="medium12" color={statusInfo.statusColor} style={{marginLeft: nw(4)}}>
                {statusInfo.statusText}
              </Text>
              <Text variant="medium12" color={COLORS.grey999999} style={{marginLeft: nw(8)}}>
                • {new Date(session.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {statusInfo.canResume && (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleResumeSession(session);
              }}
              disabled={isResuming}
            >
              {isResuming ? (
                <ActivityIndicator size="small" color={COLORS.yellowF5BE00} />
              ) : (
                <>
                  <Text variant="bold12" color={COLORS.yellowF5BE00}>
                    {session.status === 'created' ? 'Start' : 'Resume'}
                  </Text>
                  <Icon name="play-arrow" size={nw(16)} color={COLORS.yellowF5BE00} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sessionStats}>
          {session.overallStats ? (
            <>
              <View style={styles.statItem}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {Math.round(session.overallStats.accuracy || 0)}%
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {session.overallStats.attemptedQuestions || 0}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Attempted</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {session.overallStats.correctAnswers || 0}/{session.overallStats.totalQuestions || 0}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {formatDuration(session.startTime, session.endTime)}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>Duration</Text>
              </View>
            </>
          ) : (
            <View style={styles.incompleteMeta}>
              <Text variant="medium12" color={COLORS.grey777777}>
                {session.sessionType?.replace('_', ' ') || 'Assessment'} • Not yet started
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render session details modal
  const renderSessionModal = () => (
    <Modal
      visible={showSessionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSessionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="bold18" color={COLORS.blue043142}>
              Session Details
            </Text>
            <TouchableOpacity onPress={() => setShowSessionModal(false)}>
              <Icon name="close" size={nw(24)} color={COLORS.grey777777} />
            </TouchableOpacity>
          </View>
          
          {selectedSession && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text variant="bold14" color={COLORS.blue043142}>Exam Information</Text>
                <Text variant="medium12" color={COLORS.grey777777} style={{marginTop: nh(4)}}>
                  {selectedSession.examName} • {selectedSession.sessionType}
                </Text>
                <Text variant="medium12" color={COLORS.grey777777}>
                  Started: {new Date(selectedSession.createdAt).toLocaleString()}
                </Text>
              </View>
              
              {selectedSession.overallStats && (
                <View style={styles.modalSection}>
                  <Text variant="bold14" color={COLORS.blue043142}>Performance Summary</Text>
                  
                  {/* Main Score Display */}
                  <View style={styles.scoreHighlight}>
                    <Text variant="bold32" color={COLORS.blue043142}>
                      {Math.round(selectedSession.overallStats.accuracy || 0)}%
                    </Text>
                    <Text variant="medium14" color={COLORS.grey777777}>Overall Accuracy</Text>
                  </View>

                  {/* Performance Stats */}
                  <View style={styles.performanceStats}>
                    <View style={styles.statRow}>
                      <View style={styles.statRowItem}>
                        <Icon name="quiz" size={nw(20)} color={COLORS.blue043142} />
                        <View style={styles.statRowContent}>
                          <Text variant="bold16" color={COLORS.blue043142}>
                            {selectedSession.overallStats.correctAnswers || 0} / {selectedSession.overallStats.totalQuestions || 0}
                          </Text>
                          <Text variant="medium12" color={COLORS.grey777777}>Correct Answers</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statRow}>
                      <View style={styles.statRowItem}>
                        <Icon name="assignment-turned-in" size={nw(20)} color={COLORS.yellowF5BE00} />
                        <View style={styles.statRowContent}>
                          <Text variant="bold16" color={COLORS.blue043142}>
                            {selectedSession.overallStats.attemptedQuestions || 0}
                          </Text>
                          <Text variant="medium12" color={COLORS.grey777777}>Questions Attempted</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statRow}>
                      <View style={styles.statRowItem}>
                        <Icon name="stars" size={nw(20)} color="#10B981" />
                        <View style={styles.statRowContent}>
                          <Text variant="bold16" color={COLORS.blue043142}>
                            {selectedSession.overallStats.totalMarks || 0} marks
                          </Text>
                          <Text variant="medium12" color={COLORS.grey777777}>
                            out of {selectedSession.overallStats.maxPossibleMarks || 0} marks
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.statRow}>
                      <View style={styles.statRowItem}>
                        <Icon name="schedule" size={nw(20)} color="#8B5CF6" />
                        <View style={styles.statRowContent}>
                          <Text variant="bold16" color={COLORS.blue043142}>
                            {formatDuration(selectedSession.startTime, selectedSession.endTime)}
                          </Text>
                          <Text variant="medium12" color={COLORS.grey777777}>Time Taken</Text>
                        </View>
                      </View>
                    </View>

                    {selectedSession.overallStats.skippedQuestions > 0 && (
                      <View style={styles.statRow}>
                        <View style={styles.statRowItem}>
                          <Icon name="skip-next" size={nw(20)} color="#EF4444" />
                          <View style={styles.statRowContent}>
                            <Text variant="bold16" color={COLORS.blue043142}>
                              {selectedSession.overallStats.skippedQuestions || 0}
                            </Text>
                            <Text variant="medium12" color={COLORS.grey777777}>Questions Skipped</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Completion Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text variant="medium12" color={COLORS.grey777777}>
                        Completion: {selectedSession.overallStats.completionPercentage || 0}%
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { width: `${selectedSession.overallStats.completionPercentage || 0}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}
              
              <View style={styles.modalActions}>
                {getSessionStatusInfo(selectedSession).canResume && (
                  <TouchableOpacity
                    style={styles.modalPrimaryButton}
                    onPress={() => {
                      setShowSessionModal(false);
                      handleResumeSession(selectedSession);
                    }}
                  >
                    <Text variant="bold14" color={COLORS.whiteFFFFFF}>
                      {selectedSession.status === 'created' ? 'Start Test' : 'Resume Test'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {selectedSession.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => {
                      setShowSessionModal(false);
                      navigation.navigate(Routes.IntelliTestResults, {
                        sessionId: selectedSession.sessionId,
                        examId: selectedSession.examName,
                        examName: selectedSession.examName,
                      });
                    }}
                  >
                    <Text variant="bold14" color={COLORS.blue043142}>View Results</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" size={nw(64)} color={COLORS.greyBBBBBB} />
      <Text variant="bold18" color={COLORS.grey777777} style={{marginTop: nh(16)}}>
        No Sessions Found
      </Text>
      <Text variant="medium14" color={COLORS.grey999999} style={{marginTop: nh(4), textAlign: 'center'}}>
        {selectedFilter === 'all' 
          ? "You haven't taken any assessments yet"
          : `No ${selectedFilter} sessions found`}
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity
          style={styles.startAssessmentButton}
          onPress={() => navigation.navigate(Routes.IntelliTestExamSelection)}
        >
          <Text variant="bold14" color={COLORS.whiteFFFFFF}>Start Your First Assessment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="Session History" 
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
          backgroundColor={COLORS.yellowF5BE00}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
            Loading session history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Session History" 
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.content}>
        {renderFilterTabs()}
        
        {filteredSessions.length > 0 ? (
          <FlatList
            data={filteredSessions}
            renderItem={renderSessionCard}
            keyExtractor={(item) => item.sessionId}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreSessions}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={COLORS.blue043142} />
                </View>
              ) : null
            }
            contentContainerStyle={styles.sessionsList}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {renderSessionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    gap: nw(8),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(20),
    backgroundColor: COLORS.greyF5F5F5,
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
  },
  filterTabActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  filterBadge: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    marginLeft: nw(4),
    minWidth: nw(16),
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.whiteFFFFFF,
  },

  // Session List
  sessionsList: {
    padding: nw(16),
    gap: nh(12),
  },
  sessionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  sessionExamIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(2),
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '15',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    minHeight: nw(32),
    justifyContent: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  incompleteMeta: {
    flex: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  modalContent: {
    padding: nw(20),
  },
  modalSection: {
    marginBottom: nh(20),
  },
  
  // New Score Highlight Design
  scoreHighlight: {
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: nw(12),
    padding: nw(20),
    alignItems: 'center',
    marginTop: nh(12),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '20',
  },
  
  // Performance Stats Rows
  performanceStats: {
    gap: nh(12),
  },
  statRow: {
    backgroundColor: COLORS.greyF5F5F5,
    borderRadius: nw(8),
    padding: nw(12),
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statRowContent: {
    marginLeft: nw(12),
    flex: 1,
  },
  
  // Progress Section
  progressSection: {
    marginTop: nh(16),
  },
  progressHeader: {
    marginBottom: nh(8),
  },
  progressBarContainer: {
    marginBottom: nh(8),
  },
  progressBarBackground: {
    height: nh(8),
    backgroundColor: COLORS.greyD6D6D6,
    borderRadius: nw(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(4),
  },
  modalActions: {
    flexDirection: 'row',
    gap: nw(12),
    marginTop: nh(20),
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    paddingVertical: nh(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(32),
  },
  startAssessmentButton: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    marginTop: nh(16),
  },

  // Loading More
  loadingMore: {
    paddingVertical: nh(20),
    alignItems: 'center',
  },
});

export default IntelliTestSessionHistory;