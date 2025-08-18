// =====================================================
// INTELLITEST HUB SCREEN - Enhanced with Analytics Integration
// File: screens/IntelliTest/IntelliTestHub.js
// =====================================================

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
  Alert,
  Animated,
  TouchableOpacity,
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

// Import IntelliTest API services
import {
  getIntelliTestAvailableExamsApi,
  getIntelliTestSessionHistoryApi,
  getIntelliTestRoadmapHistoryApi,
  resumeIntelliTestSessionApi,
  startIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

const IntelliTestHub = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumingSession, setResumingSession] = useState(null);
  const [availableExams, setAvailableExams] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [unfinishedSessions, setUnfinishedSessions] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [quickStats, setQuickStats] = useState({
    totalAssessments: 0,
    avgScore: 0,
    studyStreak: 0,
    improvementRate: 0,
  });

  // Enhanced exam metadata aligned with ScaleUp design
  const examMetadata = {
    'JEE_MAIN': {
      name: 'JEE Main',
      icon: 'engineering',
      bgColor: COLORS.blue043142,
      description: 'Engineering Entrance',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      difficulty: 'High',
    },
    'NEET': {
      name: 'NEET',
      icon: 'local-hospital',
      bgColor: '#e74c3c',
      description: 'Medical Entrance',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      difficulty: 'High',
    },
    'CAT': {
      name: 'CAT',
      icon: 'business',
      bgColor: '#9b59b6',
      description: 'Management Entrance',
      subjects: ['Verbal', 'Quant', 'DILR'],
      difficulty: 'High',
    },
    'GATE': {
      name: 'GATE',
      icon: 'memory',
      bgColor: '#f39c12',
      description: 'Graduate Aptitude Test',
      subjects: ['Technical', 'Aptitude'],
      difficulty: 'Medium',
    },
    'GMAT': {
      name: 'GMAT',
      icon: 'school',
      bgColor: '#27ae60',
      description: 'Global MBA Entrance',
      subjects: ['Verbal', 'Quant', 'AWA', 'IR'],
      difficulty: 'High',
    },
    'UPSC': {
      name: 'UPSC',
      icon: 'account-balance',
      bgColor: '#34495e',
      description: 'Civil Services',
      subjects: ['GS', 'Aptitude', 'Optional'],
      difficulty: 'Very High',
    }
  };

  // Fetch initial data
  const fetchHubData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch available exams
      try {
        const examsResponse = await getIntelliTestAvailableExamsApi();
        console.log('Exams API Response:', examsResponse.data);
        
        if (examsResponse.data?.success) {
          const examsData = examsResponse.data.data?.allExams || examsResponse.data.data?.exams || [];
          setAvailableExams(examsData);
          console.log('Available exams set:', examsData);
        } else {
          console.log('Exams API unsuccessful, using fallback');
          // Fallback to metadata keys if API fails
          setAvailableExams(Object.keys(examMetadata).map(examId => ({
            examId,
            examName: examMetadata[examId].name,
            category: 'competitive'
          })));
        }
      } catch (examError) {
        console.error('Error fetching exams:', examError);
        // Set fallback data
        setAvailableExams(Object.keys(examMetadata).map(examId => ({
          examId,
          examName: examMetadata[examId].name,
          category: 'competitive'
        })));
      }

      // Fetch recent sessions - using your original logic
      try {
        const sessionsResponse = await getIntelliTestSessionHistoryApi({
          limit: 5,
          page: 1
        });
        if (sessionsResponse.data?.success) {
          const sessions = sessionsResponse.data.data?.sessions || [];
          setRecentSessions(sessions);
          calculateQuickStats(sessions);
        }
      } catch (sessionError) {
        console.error('Error fetching sessions:', sessionError);
        setRecentSessions([]);
      }

      // Fetch unfinished sessions separately
      try {
        const unfinishedResponse = await getIntelliTestSessionHistoryApi({
          status: 'paused,created,in_progress', // if API supports status filtering
          limit: 10,
          page: 1
        });
        if (unfinishedResponse.data?.success) {
          const unfinished = unfinishedResponse.data.data?.sessions || [];
          setUnfinishedSessions(unfinished);
        } else {
          // Fallback: fetch more sessions and filter client-side
          const allSessionsResponse = await getIntelliTestSessionHistoryApi({
            limit: 20,
            page: 1
          });
          if (allSessionsResponse.data?.success) {
            const allSessions = allSessionsResponse.data.data?.sessions || [];
            const unfinished = allSessions.filter(session => 
              ['paused', 'created', 'in_progress'].includes(session.sessionState?.status)
            );
            setUnfinishedSessions(unfinished);
          }
        }
      } catch (unfinishedError) {
        console.error('Error fetching unfinished sessions:', unfinishedError);
        setUnfinishedSessions([]);
      }

      // Fetch roadmap data
      try {
        const roadmapResponse = await getIntelliTestRoadmapHistoryApi({
          limit: 1
        });
        if (roadmapResponse.data?.success && roadmapResponse.data.data?.roadmaps?.length > 0) {
          setActiveRoadmap(roadmapResponse.data.data.roadmaps[0]);
        }
      } catch (roadmapError) {
        console.error('Error fetching roadmap:', roadmapError);
        setActiveRoadmap(null);
      }

    } catch (error) {
      console.error('Error fetching hub data:', error);
      showToast({
        message: 'Unable to load some data. Please try refreshing.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Calculate quick statistics from sessions
  const calculateQuickStats = useCallback((sessions) => {
    const stats = {
      totalAssessments: sessions.length,
      avgScore: 0,
      studyStreak: 0,
      improvementRate: 0,
    };

    if (sessions.length > 0) {
      const totalScore = sessions.reduce((sum, session) => {
        return sum + (session.overallStats?.scorePercentage || 0);
      }, 0);
      stats.avgScore = Math.round(totalScore / sessions.length);

      // Calculate improvement rate (mock calculation)
      if (sessions.length >= 2) {
        const recentScore = sessions[0]?.overallStats?.scorePercentage || 0;
        const olderScore = sessions[sessions.length - 1]?.overallStats?.scorePercentage || 0;
        stats.improvementRate = Math.round(((recentScore - olderScore) / olderScore) * 100) || 0;
      }

      // Calculate study streak (simplified)
      stats.studyStreak = Math.min(sessions.length, 7);
    }

    setQuickStats(stats);
  }, []);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHubData();
    setRefreshing(false);
  }, [fetchHubData]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      fetchHubData();
    }, [fetchHubData])
  );

  // Quick action handlers
  const handleStartAssessment = useCallback((examId = null) => {
    if (examId) {
      navigation.navigate(Routes.IntelliTestExamSelection, { preSelectedExam: examId });
    } else {
      navigation.navigate(Routes.IntelliTestExamSelection);
    }
  }, [navigation]);

  // Resume session handler
  const handleResumeSession = useCallback(async (session) => {
    try {
      setResumingSession(session.sessionId);
      
      if (session.sessionState?.status === 'paused') {
        // Resume paused session
        await resumeIntelliTestSessionApi({ sessionId: session.sessionId });
        showToast({ message: 'Session resumed successfully', type: 'success' });
      } else if (session.sessionState?.status === 'created') {
        // Start created but not started session
        await startIntelliTestSessionApi({ sessionId: session.sessionId });
        showToast({ message: 'Assessment started', type: 'success' });
      }
      
      // Navigate to assessment screen
      navigation.navigate(Routes.IntelliTestAssessment, {
        sessionId: session.sessionId,
        examId: session.examConfiguration?.examId || session.examId,
        examName: session.examConfiguration?.examName || session.examName,
        config: session.sessionConfig || {
          totalQuestions: session.examConfiguration?.totalQuestions || 30,
          timeLimit: session.examConfiguration?.timeLimit || 45,
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

  const handleViewRoadmap = useCallback(() => {
    if (activeRoadmap) {
      navigation.navigate(Routes.IntelliTestRoadmapDetails, { 
        roadmapId: activeRoadmap.roadmapId 
      });
    } else {
      navigation.navigate(Routes.IntelliTestCreateRoadmap);
    }
  }, [navigation, activeRoadmap]);

  // NEW: Analytics navigation handlers
  const handleViewAnalytics = useCallback((examId, examName) => {
    navigation.navigate(Routes.IntelliTestAnalyticsDashboard, {
      examId,
      examName,
    });
  }, [navigation]);

  const handleViewSessionHistory = useCallback(() => {
    navigation.navigate(Routes.IntelliTestSessionHistory);
  }, [navigation]);

  // Get session status display info
  const getSessionStatusInfo = (session) => {
    const status = session.sessionState?.status;
    const currentQuestion = session.sessionState?.currentQuestionIndex + 1 || 1;
    const totalQuestions = session.examConfiguration?.totalQuestions || session.questions?.length || 30;
    const timeSpent = Math.floor((session.sessionState?.timeSpent || 0) / 60);
    
    switch (status) {
      case 'paused':
        return {
          statusText: 'Paused',
          statusColor: '#F59E0B',
          progressText: `Question ${currentQuestion} of ${totalQuestions}`,
          timeText: `${timeSpent} min used`,
          icon: 'pause-circle',
          actionText: 'Resume',
        };
      case 'created':
        return {
          statusText: 'Ready to Start',
          statusColor: '#10B981',
          progressText: `${totalQuestions} questions`,
          timeText: `${session.sessionConfig?.timeLimit || 45} min limit`,
          icon: 'play-circle',
          actionText: 'Start Test',
        };
      case 'in_progress':
        return {
          statusText: 'In Progress',
          statusColor: '#3B82F6',
          progressText: `Question ${currentQuestion} of ${totalQuestions}`,
          timeText: `${timeSpent} min used`,
          icon: 'timelapse',
          actionText: 'Continue',
        };
      default:
        return {
          statusText: 'Unknown',
          statusColor: '#6B7280',
          progressText: '',
          timeText: '',
          icon: 'help-outline',
          actionText: 'View',
        };
    }
  };

  // Render welcome section with ScaleUp styling
  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text variant="bold20" color={COLORS.blue043142}>
            Welcome, {userData?.username || 'Student'}! 👋
          </Text>
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(4)}}>
            AI-powered assessments for your exam success
          </Text>
        </View>
        <View style={styles.welcomeIcon}>
          <Icon name="psychology" size={nw(32)} color={COLORS.yellowF5BE00} />
        </View>
      </View>
    </View>
  );

  // Render unfinished sessions section
  const renderUnfinishedSessions = () => {
    if (unfinishedSessions.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="bold16" color={COLORS.blue043142}>
            Continue Your Tests
          </Text>
          <View style={styles.unfinishedBadge}>
            <Text variant="bold12" color={COLORS.whiteFFFFFF}>
              {unfinishedSessions.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.unfinishedList}>
          {unfinishedSessions.slice(0, 3).map((session, index) => {
            const statusInfo = getSessionStatusInfo(session);
            const exam = examMetadata[session.examConfiguration?.examId || session.examId] || {
              name: session.examConfiguration?.examName || 'Assessment',
              icon: 'school',
              bgColor: COLORS.blue043142,
            };
            const isResuming = resumingSession === session.sessionId;
            
            return (
              <TouchableOpacity
                key={session.sessionId || index}
                style={styles.unfinishedCard}
                onPress={() => !isResuming && handleResumeSession(session)}
                disabled={isResuming}
                activeOpacity={0.8}
              >
                <View style={styles.unfinishedHeader}>
                  <View style={[styles.unfinishedExamIcon, {backgroundColor: exam.bgColor}]}>
                    <Icon name={exam.icon} size={nw(18)} color={COLORS.whiteFFFFFF} />
                  </View>
                  <View style={styles.unfinishedInfo}>
                    <Text variant="bold14" color={COLORS.blue043142}>
                      {exam.name}
                    </Text>
                    <View style={styles.statusRow}>
                      <Icon name={statusInfo.icon} size={nw(14)} color={statusInfo.statusColor} />
                      <Text variant="medium12" color={statusInfo.statusColor} style={{marginLeft: nw(4)}}>
                        {statusInfo.statusText}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.unfinishedAction}>
                    {isResuming ? (
                      <ActivityIndicator size="small" color={COLORS.yellowF5BE00} />
                    ) : (
                      <View style={styles.resumeButton}>
                        <Text variant="bold12" color={COLORS.yellowF5BE00}>
                          {statusInfo.actionText}
                        </Text>
                        <Icon name="arrow-forward" size={nw(16)} color={COLORS.yellowF5BE00} />
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.unfinishedDetails}>
                  <Text variant="medium12" color={COLORS.grey777777}>
                    {statusInfo.progressText}
                  </Text>
                  <Text variant="medium12" color={COLORS.grey999999}>
                    {statusInfo.timeText}
                  </Text>
                </View>
                
                {session.sessionState?.status !== 'created' && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${((session.sessionState?.currentQuestionIndex || 0) / (session.examConfiguration?.totalQuestions || 30)) * 100}%`,
                            backgroundColor: statusInfo.statusColor
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {unfinishedSessions.length > 3 && (
          <TouchableOpacity 
            style={styles.viewAllUnfinished}
            onPress={() => navigation.navigate(Routes.IntelliTestSessionHistory, { filter: 'unfinished' })}
          >
            <Text variant="medium14" color={COLORS.yellowF5BE00}>
              View All Unfinished Tests ({unfinishedSessions.length})
            </Text>
            <Icon name="arrow-forward" size={nw(16)} color={COLORS.yellowF5BE00} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // NEW: Enhanced quick stats with analytics integration
  const renderQuickStats = () => (
    <View style={styles.statsSection}>
      <View style={styles.statsHeader}>
        <Text variant="bold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          Your Progress
        </Text>
        {/* NEW: Analytics button */}
        <TouchableOpacity 
          style={styles.analyticsButton}
          onPress={() => {
            // Show general analytics if we have multiple exams
            const uniqueExams = [...new Set(recentSessions.map(s => s.examId || s.examConfiguration?.examId))];
            if (uniqueExams.length === 1) {
              // Navigate to specific exam analytics
              const examId = uniqueExams[0];
              const examName = examMetadata[examId]?.name || examId;
              handleViewAnalytics(examId, examName);
            } else {
              // Navigate to session history for exam selection
              handleViewSessionHistory();
            }
          }}
        >
          <Icon name="analytics" size={nw(16)} color={COLORS.blue043142} />
          <Text variant="medium12" color={COLORS.blue043142} style={{marginLeft: nw(4)}}>
            View Analytics
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, {backgroundColor: COLORS.blue043142 + '15'}]}>
            <Icon name="quiz" size={nw(20)} color={COLORS.blue043142} />
          </View>
          <Text variant="bold16" color={COLORS.blue043142}>
            {quickStats.totalAssessments}
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Tests Taken
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, {backgroundColor: COLORS.yellowF5BE00 + '15'}]}>
            <Icon name="trending-up" size={nw(20)} color={COLORS.yellowF5BE00} />
          </View>
          <Text variant="bold16" color={COLORS.blue043142}>
            {quickStats.avgScore}%
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Avg Score
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, {backgroundColor: '#e74c3c15'}]}>
            <Icon name="local-fire-department" size={nw(20)} color="#e74c3c" />
          </View>
          <Text variant="bold16" color={COLORS.blue043142}>
            {quickStats.studyStreak}
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Day Streak
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, {backgroundColor: '#27ae6015'}]}>
            <Icon name="show-chart" size={nw(20)} color="#27ae60" />
          </View>
          <Text variant="bold16" color={COLORS.blue043142}>
            {quickStats.improvementRate >= 0 ? '+' : ''}{quickStats.improvementRate}%
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Improvement
          </Text>
        </View>
      </View>
    </View>
  );

  // Main CTA with ScaleUp button style
  const renderMainCTA = () => (
    <View style={styles.ctaSection}>
      <TouchableOpacity
        style={styles.primaryCTA}
        onPress={() => handleStartAssessment()}
        activeOpacity={0.8}>
        <View style={styles.ctaContent}>
          <View style={styles.ctaIcon}>
            <Icon name="play-arrow" size={nw(24)} color={COLORS.whiteFFFFFF} />
          </View>
          <View style={styles.ctaText}>
            <Text variant="bold16" color={COLORS.whiteFFFFFF}>
              Start New Assessment
            </Text>
            <Text variant="medium12" color={COLORS.whiteFFFFFF} style={{opacity: 0.9}}>
              AI-powered adaptive testing
            </Text>
          </View>
          <Icon name="arrow-forward" size={nw(20)} color={COLORS.whiteFFFFFF} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Roadmap preview with ScaleUp design
  const renderRoadmapPreview = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="bold16" color={COLORS.blue043142}>
          Study Roadmap
        </Text>
        <TouchableOpacity onPress={handleViewRoadmap}>
          <Text variant="medium12" color={COLORS.yellowF5BE00}>
            View All →
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeRoadmap ? (
        <TouchableOpacity style={styles.roadmapCard} onPress={handleViewRoadmap}>
          <View style={styles.roadmapHeader}>
            <View style={[styles.roadmapIcon, {backgroundColor: COLORS.yellowF5BE00 + '15'}]}>
              <Icon name="map" size={nw(18)} color={COLORS.yellowF5BE00} />
            </View>
            <View style={styles.roadmapInfo}>
              <Text variant="bold14" color={COLORS.blue043142}>
                {activeRoadmap.examId} Preparation
              </Text>
              <Text variant="medium12" color={COLORS.grey777777}>
                {activeRoadmap.overallProgress?.completionPercentage || 0}% Complete
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${activeRoadmap.overallProgress?.completionPercentage || 0}%` }
                ]} 
              />
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.createRoadmapCard} onPress={handleViewRoadmap}>
          <Icon name="add-road" size={nw(24)} color={COLORS.yellowF5BE00} />
          <Text variant="medium14" color={COLORS.blue043142} style={{marginTop: nh(8)}}>
            Create Your Study Roadmap
          </Text>
          <Text variant="medium12" color={COLORS.grey777777}>
            Get AI-powered personalized study plans
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // NEW: Enhanced available exams grid with analytics buttons
  const renderExamsGrid = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="bold16" color={COLORS.blue043142}>
          Available Exams
        </Text>
        {availableExams.length > 4 && (
          <TouchableOpacity onPress={() => navigation.navigate(Routes.IntelliTestExamSelection)}>
            <Text variant="medium12" color={COLORS.yellowF5BE00}>
              View All →
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {availableExams.length > 0 ? (
        <FlatList
          data={availableExams.slice(0, 6)}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item.examId}
          renderItem={({item}) => {
            const exam = examMetadata[item.examId] || {
              name: item.examName,
              icon: 'school',
              bgColor: COLORS.blue043142,
              description: 'Competitive Exam',
              subjects: ['General'],
              difficulty: 'Medium',
              duration: '2 hours'
            };

            // Check if user has taken this exam before
            const hasAttempts = recentSessions.some(session => 
              (session.examId || session.examConfiguration?.examId) === item.examId
            );
            
            return (
              <View style={styles.examCard}>
                <TouchableOpacity
                  style={styles.examCardMain}
                  onPress={() => handleStartAssessment(item.examId)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.examHeader, {backgroundColor: exam.bgColor}]}>
                    <Icon name={exam.icon} size={nw(24)} color={COLORS.whiteFFFFFF} />
                    <Text variant="bold14" color={COLORS.whiteFFFFFF}>
                      {exam.name}
                    </Text>
                  </View>
                  <View style={styles.examBody}>
                    <Text variant="medium12" color={COLORS.grey777777}>
                      {exam.description}
                    </Text>
                    <Text variant="medium10" color={COLORS.grey999999} style={{marginTop: nh(4)}}>
                      {exam.subjects.slice(0, 2).join(' • ')}
                    </Text>
                    <View style={styles.examFooter}>
                      <Text variant="medium10" color={COLORS.yellowF5BE00}>
                        {exam.difficulty}
                      </Text>
                      <Text variant="medium10" color={COLORS.grey999999}>
                        {exam.duration}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {/* NEW: Analytics button for exams with attempts */}
                {hasAttempts && (
                  <TouchableOpacity
                    style={styles.examAnalyticsButton}
                    onPress={() => handleViewAnalytics(item.examId, exam.name)}
                    activeOpacity={0.7}
                  >
                    <Icon name="analytics" size={nw(14)} color={exam.bgColor} />
                    <Text variant="medium10" color={exam.bgColor} style={{marginLeft: nw(2)}}>
                      Analytics
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          columnWrapperStyle={styles.examRow}
        />
      ) : (
        <View style={styles.emptyExams}>
          <Icon name="school" size={nw(48)} color={COLORS.greyBBBBBB} />
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(8)}}>
            No exams available
          </Text>
          <Text variant="medium12" color={COLORS.grey999999}>
            Check back later for new assessments
          </Text>
        </View>
      )}
    </View>
  );

  // NEW: Enhanced recent activity with analytics access
  const renderRecentActivity = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="bold16" color={COLORS.blue043142}>
          Recent Activity
        </Text>
        <TouchableOpacity onPress={handleViewSessionHistory}>
          <Text variant="medium12" color={COLORS.yellowF5BE00}>
            View All →
          </Text>
        </TouchableOpacity>
      </View>
      
      {recentSessions.length > 0 ? (
        <View style={styles.activityList}>
          {recentSessions.slice(0, 3).map((session, index) => {
            const examId = session.examId || session.examConfiguration?.examId;
            const examName = session.examName || session.examConfiguration?.examName;
            const exam = examMetadata[examId] || { name: examName || 'Assessment', bgColor: COLORS.blue043142 };
            
            return (
              <View key={session.sessionId || index} style={styles.activityCard}>
                <View style={[styles.activityIcon, {backgroundColor: exam.bgColor + '15'}]}>
                  <Icon name="quiz" size={nw(16)} color={exam.bgColor} />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="medium14" color={COLORS.blue043142}>
                    {exam.name} Test
                  </Text>
                  <Text variant="medium12" color={COLORS.grey777777}>
                    Score: {session.overallStats?.scorePercentage || 0}% • {session.overallStats?.questionsAttempted || 0} questions
                  </Text>
                </View>
                <View style={styles.activityActions}>
                  <Text variant="medium10" color={COLORS.grey999999} style={{marginBottom: nh(4)}}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </Text>
                  {/* NEW: Mini analytics button for each session */}
                  <TouchableOpacity
                    style={styles.miniAnalyticsButton}
                    onPress={() => handleViewAnalytics(examId, exam.name)}
                  >
                    <Icon name="trending-up" size={nw(12)} color={COLORS.yellowF5BE00} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyActivity}>
          <Icon name="history" size={nw(32)} color={COLORS.greyBBBBBB} />
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(8)}}>
            No recent assessments
          </Text>
          <Text variant="medium12" color={COLORS.grey999999}>
            Start your first assessment to see activity here
          </Text>
        </View>
      )}
    </View>
  );

  // Main render with ScaleUp layout pattern
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
            Loading IntelliTest...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="IntelliTest" 
        rightIcon={false}
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            
            {renderWelcomeSection()}
            {renderQuickStats()}
            {renderUnfinishedSessions()}
            {renderMainCTA()}
            {renderRoadmapPreview()}
            {renderExamsGrid()}
            {renderRecentActivity()}
            
            <View style={{height: nh(20)}} />
          </ScrollView>
        </View>
      </View>
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
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  welcomeSection: {
    marginBottom: nh(24),
  },
  welcomeCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeIcon: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    backgroundColor: COLORS.yellowF5BE00 + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Unfinished Sessions Styles
  unfinishedBadge: {
    backgroundColor: '#EF4444',
    borderRadius: nw(10),
    paddingHorizontal: nw(8),
    paddingVertical: nh(2),
    minWidth: nw(20),
    alignItems: 'center',
  },
  unfinishedList: {
    gap: nh(12),
  },
  unfinishedCard: {
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
  unfinishedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  unfinishedExamIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  unfinishedInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(2),
  },
  unfinishedAction: {
    alignItems: 'flex-end',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '15',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
  },
  unfinishedDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(8),
  },
  viewAllUnfinished: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: nh(12),
    paddingVertical: nh(8),
  },

  // NEW: Enhanced Stats Section with Analytics
  statsSection: {
    marginBottom: nh(24),
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  sectionTitle: {
    // marginBottom: nh(12), // Removed since we have header now
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '10',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '20',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    padding: nw(12),
    marginHorizontal: nw(2),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  ctaSection: {
    marginBottom: nh(24),
  },
  primaryCTA: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    padding: nw(16),
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaIcon: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  ctaText: {
    flex: 1,
  },
  section: {
    marginBottom: nh(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  roadmapCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  roadmapIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  roadmapInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: nh(8),
  },
  progressBar: {
    height: nh(4),
    backgroundColor: COLORS.greyD6D6D6,
    borderRadius: nh(2),
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: nh(2),
  },
  createRoadmapCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(20),
    borderWidth: 2,
    borderColor: COLORS.yellowF5BE00,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  examRow: {
    justifyContent: 'space-between',
    marginBottom: nh(12),
  },
  // NEW: Enhanced Exam Card with Analytics
  examCard: {
    flex: 0.48,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  examCardMain: {
    flex: 1,
  },
  examHeader: {
    padding: nw(12),
    alignItems: 'center',
    minHeight: nh(60),
    justifyContent: 'center',
  },
  examBody: {
    padding: nw(12),
    minHeight: nh(80),
  },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(8),
  },
  examAnalyticsButton: {
    position: 'absolute',
    top: nw(8),
    right: nw(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyExams: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  activityList: {
    gap: nh(8),
  },
  // NEW: Enhanced Activity Card with Analytics
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    padding: nw(12),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
  },
  activityIcon: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  activityContent: {
    flex: 1,
  },
  activityActions: {
    alignItems: 'flex-end',
  },
  miniAnalyticsButton: {
    backgroundColor: COLORS.yellowF5BE00 + '15',
    padding: nw(4),
    borderRadius: nw(8),
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: nh(32),
  },
});

export default IntelliTestHub;