// screens/AIStudyBuddy/AIStudyBuddySessionDetails.js
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
  Animated,
  Dimensions,
  Share,
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
  aiStudyBuddyGetSessionDetailsApi,
  aiStudyBuddyUpdateSessionApi,
  aiStudyBuddyDeleteSessionApi,
  aiStudyBuddyExportConversationApi,
  aiStudyBuddyGenerateFlashcardsApi,
  aiStudyBuddyGenerateQuizApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddySessionDetails = ({navigation, route}) => {
  const {sessionId} = route.params;
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);
  const [messageAnalytics, setMessageAnalytics] = useState(null);
  const [integrationData, setIntegrationData] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Enhanced subject metadata with consistent colors
  const subjectMeta = {
    mathematics: { icon: 'calculate', color: COLORS.blue043142, name: 'Mathematics' },
    physics: { icon: 'science', color: COLORS.green34A853, name: 'Physics' },
    chemistry: { icon: 'biotech', color: COLORS.redEA4335, name: 'Chemistry' },
    biology: { icon: 'eco', color: COLORS.yellowF5BE00, name: 'Biology' },
    computer_science: { icon: 'computer', color: COLORS.blue043142, name: 'Computer Science' },
    english: { icon: 'menu-book', color: COLORS.green34A853, name: 'English' },
  };

  // Load session details
  const loadSessionDetails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await aiStudyBuddyGetSessionDetailsApi(sessionId);
      
      if (response.data.success) {
        setSession(response.data.session);
        setMessageAnalytics(response.data.messageAnalytics);
        setIntegrationData(response.data.integrationData);

        // Start entrance animations
        if (showLoader) {
          startEntranceAnimations();
        }
      }
    } catch (error) {
      console.error('Load session details error:', error);
      showToast({
        message: 'Failed to load session details. Please try again.',
        type: 'error',
      });
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, showToast]);

  // Start entrance animations
  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessionDetails(false);
  }, [loadSessionDetails]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadSessionDetails();
    }, [loadSessionDetails])
  );

  // Continue session
  const continueSession = () => {
    navigation.navigate(Routes.AIStudyBuddyChat, {
      sessionId: session.sessionId,
      subject: session.subject,
      syllabus: session.syllabus,
      isNewSession: false,
    });
  };

  // Update session status
  const updateSessionStatus = async (action) => {
    try {
      await aiStudyBuddyUpdateSessionApi(sessionId, { action });
      
      // Update local state
      setSession(prev => ({
        ...prev,
        status: action === 'pause' ? 'paused' : 
               action === 'resume' ? 'active' : 
               action === 'complete' ? 'completed' : prev.status
      }));

      showToast({
        message: `Session ${action}d successfully`,
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // Delete session
  const deleteSession = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to permanently delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiStudyBuddyDeleteSessionApi(sessionId, true);
              showToast({
                message: 'Session deleted successfully',
                type: 'success',
              });
              navigation.goBack();
            } catch (error) {
              showToast({
                message: formatAiStudyBuddyError(error),
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  // Export session
  const exportSession = async (format = 'pdf') => {
    try {
      setExporting(true);
      
      const response = await aiStudyBuddyExportConversationApi(sessionId, {
        format,
        includeAnalytics: true,
      });

      if (response.data.success) {
        showToast({
          message: `Conversation exported as ${format.toUpperCase()}`,
          type: 'success',
        });
        
        // Here you could implement download or sharing logic
        if (response.data.exportUrl) {
          Share.share({
            url: response.data.exportUrl,
            title: `${session.subject} Study Session`,
            message: `Check out my ${session.subject} study session!`,
          });
        }
      }
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  // Generate flashcards
  const generateFlashcards = async () => {
    try {
      const response = await aiStudyBuddyGenerateFlashcardsApi(sessionId, {
        cardCount: 15,
        topics: session.learningContext?.topicsDiscussed || [],
      });

      if (response.data.success) {
        showToast({
          message: `Created ${response.data.flashcards?.length || 15} flashcards!`,
          type: 'success',
        });
        
        // Navigate to flashcard deck if available
        if (response.data.deck?.deckId) {
          navigation.navigate(Routes.DeckDetails, {
            deckId: response.data.deck.deckId,
            isNewDeck: true,
          });
        }
      }
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // Generate quiz
  const generateQuiz = async () => {
    try {
      const response = await aiStudyBuddyGenerateQuizApi(sessionId, {
        questionCount: 10,
        topics: session.learningContext?.topicsDiscussed || [],
        difficulty: 'mixed',
      });

      if (response.data.success) {
        showToast({
          message: `Created quiz with ${response.data.questions?.length || 10} questions!`,
          type: 'success',
        });
        
        // Navigate to quiz if available
        if (response.data.quiz?.quizId) {
          navigation.navigate(Routes.QuizScreen, {
            quizId: response.data.quiz.quizId,
            isNewQuiz: true,
          });
        }
      }
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // Get relative time string
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Get session duration
  const getSessionDuration = () => {
    if (!session.startedAt) return 'Unknown';
    
    const start = new Date(session.startedAt);
    const end = session.completedAt ? new Date(session.completedAt) : new Date();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.green34A853;
      case 'paused': return COLORS.yellowF5BE00;
      case 'completed': return COLORS.blue043142;
      default: return COLORS.grey777777;
    }
  };

  // Render modern card-style header
  const renderSessionHeader = () => {
    if (!session) return null;

    const subject = subjectMeta[session.subject] || { 
      icon: 'school', 
      color: COLORS.blue043142, 
      name: session.subject 
    };

    return (
      <Animated.View 
        style={[
          styles.modernHeaderContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Clean white card with subject accent */}
        <View style={styles.modernHeaderCard}>
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: subject.color }]} />
          
          {/* Header content */}
          <View style={styles.modernHeaderContent}>
            {/* Subject info row */}
            <View style={styles.subjectRow}>
              <View style={[styles.modernIconContainer, { backgroundColor: subject.color + '15' }]}>
                <Icon name={subject.icon} size={24} color={subject.color} />
              </View>
              
              <View style={styles.subjectInfo}>
                <Text variant="semibold18" color={COLORS.grey333333} style={styles.modernSubjectTitle}>
                  {subject.name}
                </Text>
                <Text variant="medium13" color={COLORS.grey777777} style={styles.modernSubjectSubtitle}>
                  {session.syllabus?.replace('_', ' ').toUpperCase()}
                  {session.grade && ` • Grade ${session.grade}`}
                </Text>
              </View>

              <View style={[styles.modernStatusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                <View style={styles.statusDot} />
                <Text variant="medium10" color={COLORS.whiteFFFFFF} style={styles.modernStatusText}>
                  {session.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Session metrics row */}
            <View style={styles.metricsRow}>
 
              
              <View style={styles.metricItem}>
                <Icon name="chat" size={16} color={COLORS.grey777777} />
                <Text variant="medium12" color={COLORS.grey777777} style={styles.metricText}>
                  {session.messageCount || 0} messages
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render enhanced quick stats
  const renderQuickStats = () => {
    if (!session) return null;

    const stats = [
      {
        icon: 'chat',
        label: 'Messages',
        value: session.messageCount || 0,
        color: COLORS.blue043142,
      },
      {
        icon: 'topic',
        label: 'Topics',
        value: session.learningContext?.topicsDiscussed?.length || 0,
        color: COLORS.green34A853,
      },
      {
        icon: 'psychology',
        label: 'Concepts',
        value: messageAnalytics?.conceptsDiscussed || 0,
        color: COLORS.yellowF5BE00,
      },
      {
        icon: 'bookmark',
        label: 'Saved',
        value: session.bookmarkedMessages || 0,
        color: COLORS.redEA4335,
      },
    ];

    return (
      <Animated.View 
        style={[
          styles.statsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(fadeAnim, -10) }],
          }
        ]}
      >
        <Text variant="semibold16" color={COLORS.grey333333} style={styles.sectionTitle}>
          Session Overview
        </Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                <Icon name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text variant="semibold18" color={COLORS.grey333333} style={styles.statValue}>
                {stat.value}
              </Text>
              <Text variant="medium11" color={COLORS.grey777777} style={styles.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render learning goals with proper text handling
  const renderLearningGoals = () => {
    if (!session?.learningContext?.learningGoals?.length) return null;

    return (
      <Animated.View 
        style={[
          styles.contentSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(fadeAnim, -5) }],
          }
        ]}
      >
        <Text variant="semibold16" color={COLORS.grey333333} style={styles.sectionTitle}>
          Learning Goals
        </Text>
        <View style={styles.contentCard}>
          {session.learningContext.learningGoals.map((goal, index) => (
            <View key={index} style={styles.goalItem}>
              <View style={styles.goalIconContainer}>
                <Icon name="flag" size={14} color={COLORS.green34A853} />
              </View>
              <Text variant="medium13" color={COLORS.grey333333} style={styles.goalText} numberOfLines={2}>
                {goal}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render topics with better chip design
  const renderTopicsDiscussed = () => {
    if (!session?.learningContext?.topicsDiscussed?.length) return null;

    return (
      <Animated.View 
        style={[
          styles.contentSection,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text variant="semibold16" color={COLORS.grey333333} style={styles.sectionTitle}>
          Topics Covered
        </Text>
        <View style={styles.topicsContainer}>
          {session.learningContext.topicsDiscussed.map((topic, index) => (
            <View key={index} style={styles.topicChip}>
              <Text variant="medium11" color={COLORS.whiteFFFFFF} style={styles.topicText} numberOfLines={1}>
                {topic}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render enhanced action buttons
  const renderActionButtons = () => {
    if (!session) return null;

    const primaryActions = [
      {
        title: 'Continue Session',
        subtitle: 'Resume your learning',
        icon: 'chat',
        color: COLORS.blue043142,
        onPress: continueSession,
        primary: true,
      },
      {
        title: 'Generate Flashcards',
        subtitle: 'Create study cards',
        icon: 'style',
        color: COLORS.green34A853,
        onPress: generateFlashcards,
      },
    ];

    const secondaryActions = [
      {
        title: 'Create Quiz',
        icon: 'quiz',
        color: COLORS.yellowF5BE00,
        onPress: generateQuiz,
      },
      {
        title: 'Export Chat',
        icon: 'download',
        color: COLORS.redEA4335,
        onPress: () => exportSession('pdf'),
        loading: exporting,
      },
    ];

    return (
      <Animated.View 
        style={[
          styles.actionsSection,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text variant="semibold16" color={COLORS.grey333333} style={styles.sectionTitle}>
          Quick Actions
        </Text>
        
        {/* Primary Actions */}
        <View style={styles.primaryActionsContainer}>
          {primaryActions.map((action, index) => (
            <Pressable
              key={index}
              style={[
                styles.primaryActionButton,
                { backgroundColor: action.primary ? action.color : COLORS.whiteFFFFFF }
              ]}
              onPress={action.onPress}
              android_ripple={{ color: action.color + '30' }}
            >
              <View style={[
                styles.actionIconContainer,
                { backgroundColor: action.primary ? 'rgba(255,255,255,0.2)' : action.color + '15' }
              ]}>
                <Icon 
                  name={action.icon} 
                  size={20} 
                  color={action.primary ? COLORS.whiteFFFFFF : action.color} 
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text 
                  variant="semibold14" 
                  color={action.primary ? COLORS.whiteFFFFFF : COLORS.grey333333}
                  style={styles.actionTitle}
                  numberOfLines={1}
                >
                  {action.title}
                </Text>
                {action.subtitle && (
                  <Text 
                    variant="regular11" 
                    color={action.primary ? 'rgba(255,255,255,0.8)' : COLORS.grey777777}
                    style={styles.actionSubtitle}
                    numberOfLines={1}
                  >
                    {action.subtitle}
                  </Text>
                )}
              </View>
              {action.primary && (
                <Icon name="arrow-forward" size={16} color={COLORS.whiteFFFFFF} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Secondary Actions */}
        <View style={styles.secondaryActionsContainer}>
          {secondaryActions.map((action, index) => (
            <Pressable
              key={index}
              style={[styles.secondaryActionButton, { borderColor: action.color + '30' }]}
              onPress={action.onPress}
              disabled={action.loading}
              android_ripple={{ color: action.color + '20' }}
            >
              {action.loading ? (
                <ActivityIndicator size="small" color={action.color} />
              ) : (
                <Icon name={action.icon} size={18} color={action.color} />
              )}
              <Text 
                variant="medium12" 
                color={action.color} 
                style={styles.secondaryActionText}
                numberOfLines={1}
              >
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render session management with better layout
  const renderSessionManagement = () => {
    if (!session) return null;

    const canPause = session.status === 'active';
    const canResume = session.status === 'paused';
    const canComplete = session.status === 'active' || session.status === 'paused';

    const managementActions = [];

    if (canPause) {
      managementActions.push({
        title: 'Pause Session',
        icon: 'pause',
        color: COLORS.yellowF5BE00,
        action: () => updateSessionStatus('pause'),
      });
    }

    if (canResume) {
      managementActions.push({
        title: 'Resume Session',
        icon: 'play-arrow',
        color: COLORS.green34A853,
        action: () => updateSessionStatus('resume'),
      });
    }

    if (canComplete) {
      managementActions.push({
        title: 'Mark Complete',
        icon: 'check-circle',
        color: COLORS.blue043142,
        action: () => updateSessionStatus('complete'),
      });
    }

    managementActions.push({
      title: 'Delete Session',
      icon: 'delete',
      color: COLORS.redEA4335,
      action: deleteSession,
      dangerous: true,
    });

    return (
      <Animated.View 
        style={[
          styles.managementSection,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text variant="semibold16" color={COLORS.grey333333} style={styles.sectionTitle}>
          Session Management
        </Text>
        <View style={styles.managementCard}>
          {managementActions.map((action, index) => (
            <Pressable
              key={index}
              style={[
                styles.managementButton,
                { backgroundColor: action.color + '10' },
                action.dangerous && styles.dangerousButton
              ]}
              onPress={action.action}
              android_ripple={{ color: action.color + '20' }}
            >
              <Icon name={action.icon} size={18} color={action.color} />
              <Text 
                variant="medium13" 
                color={action.color} 
                style={styles.managementButtonText}
                numberOfLines={1}
              >
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.whiteFFFFFF} barStyle="dark-content" />
        <Header title="Session Details" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading session details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={COLORS.whiteFFFFFF} barStyle="dark-content" />
        <Header title="Session Details" showBackButton />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color={COLORS.redEA4335} />
          <Text variant="semibold18" color={COLORS.grey333333} style={styles.errorTitle}>
            Session Not Found
          </Text>
          <Text variant="medium14" color={COLORS.grey777777} style={styles.errorMessage}>
            This session may have been deleted or doesn't exist.
          </Text>
          <Button
            text="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            backgroundColor={COLORS.blue043142}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.whiteFFFFFF} barStyle="dark-content" />
      
      <Header 
        title="Session Details"
        showBackButton
        rightComponent={
          <Pressable
            style={styles.headerButton}
            onPress={() => exportSession('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.grey333333} />
            ) : (
              <Icon name="share" size={24} color={COLORS.grey333333} />
            )}
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Session Header */}
        {renderSessionHeader()}

        {/* Quick Stats */}
        {renderQuickStats()}

        {/* Learning Goals */}
        {renderLearningGoals()}

        {/* Topics Discussed */}
        {renderTopicsDiscussed()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Session Management */}
        {renderSessionManagement()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(40),
  },
  loadingText: {
    marginTop: nh(16),
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(40),
  },
  errorTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: nh(32),
  },
  errorButton: {
    minWidth: nw(120),
  },
  headerButton: {
    padding: nw(8),
    borderRadius: nw(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: nh(32),
  },

  // Modern Header Card Design
  modernHeaderContainer: {
    marginHorizontal: nw(16),
    marginTop: nh(12),
    marginBottom: nh(20),
  },
  modernHeaderCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    height: nh(4),
    width: '100%',
  },
  modernHeaderContent: {
    padding: nw(20),
  },
  
  // Subject info section
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  modernIconContainer: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  subjectInfo: {
    flex: 1,
    minWidth: 0,
  },
  modernSubjectTitle: {
    marginBottom: nh(2),
    lineHeight: 22,
  },
  modernSubjectSubtitle: {
    lineHeight: 16,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(10),
    paddingVertical: nh(6),
    borderRadius: 12,
    gap: nw(4),
  },
  statusDot: {
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  modernStatusText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Metrics section
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    paddingVertical: nh(12),
    paddingHorizontal: nw(16),
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: nw(6),
  },
  metricText: {
    lineHeight: 14,
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: nh(16),
    backgroundColor: COLORS.greyD6D6D6,
    marginHorizontal: nw(8),
  },

  // Enhanced Stats Section
  statsSection: {
    marginHorizontal: nw(16),
    marginBottom: nh(20),
  },
  sectionTitle: {
    marginBottom: nh(12),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: nw(8),
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(12),
    borderRadius: 12,
    alignItems: 'center',
    minHeight: nh(80),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(6),
  },
  statValue: {
    marginBottom: nh(2),
    lineHeight: 22,
  },
  statLabel: {
    textAlign: 'center',
    lineHeight: 12,
  },

  // Content Sections
  contentSection: {
    marginHorizontal: nw(16),
    marginBottom: nh(20),
  },
  contentCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Learning Goals
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(12),
  },
  goalIconContainer: {
    width: nw(20),
    height: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
    marginTop: nh(1),
  },
  goalText: {
    flex: 1,
    lineHeight: 18,
  },

  // Topics
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  topicChip: {
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: 16,
    maxWidth: nw(120), // Prevent chips from being too wide
  },
  topicText: {
    textAlign: 'center',
  },

  // Enhanced Actions Section
  actionsSection: {
    marginHorizontal: nw(16),
    marginBottom: nh(20),
  },
  primaryActionsContainer: {
    gap: nh(8),
    marginBottom: nh(12),
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(16),
    paddingHorizontal: nw(16),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    minHeight: nh(64),
  },
  actionIconContainer: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  actionTextContainer: {
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  actionTitle: {
    marginBottom: nh(2),
  },
  actionSubtitle: {
    lineHeight: 14,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: nw(8),
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(8),
    borderRadius: 8,
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    minHeight: nh(44),
    gap: nw(6),
  },
  secondaryActionText: {
    textAlign: 'center',
  },

  // Management Section
  managementSection: {
    marginHorizontal: nw(16),
    marginBottom: nh(20),
  },
  managementCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: nh(8),
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(16),
    borderRadius: 8,
    gap: nw(12),
  },
  dangerousButton: {
    borderWidth: 1,
    borderColor: COLORS.redEA4335 + '30',
  },
  managementButtonText: {
    flex: 1,
  },

  // Bottom spacing
  bottomSpacing: {
    height: nh(20),
  },
});
export default AIStudyBuddySessionDetails;