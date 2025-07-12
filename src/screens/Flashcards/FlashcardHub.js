// =====================================================
// ENHANCED FLASHCARD HUB - Beautiful Header & UI
// File: screens/Flashcards/FlashcardHub.js
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Routes from '../../helper/routes';
import {
  getUserFlashcardDecksApi,
  getDueCardsCountApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';
import mixpanel from '../../helper/mixpanelClient';

const {width: screenWidth} = Dimensions.get('window');

const FlashcardHub = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentDecks, setRecentDecks] = useState([]);
  const [deckDueCards, setDeckDueCards] = useState({});
  const [overallStats, setOverallStats] = useState({
    totalDecks: 0,
    totalDueCards: 0,
    totalNewCards: 0,
    decksNeedingAttention: 0,
  });

  // Add ref to track if data has been loaded
  const dataLoadedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Get current time greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return {
        text: 'Good Morning',
        icon: 'wb-sunny',
        color: COLORS.yellowF5BE00,
      };
    if (hour < 17)
      return {
        text: 'Good Afternoon',
        icon: 'wb-sunny',
        color: COLORS.yellowF5BE00,
      };
    if (hour < 20)
      return {
        text: 'Good Evening',
        icon: 'wb-twilight',
        color: COLORS.blue043142,
      };
    return {text: 'Good Night', icon: 'nights-stay', color: COLORS.blue043142};
  };

  // Get motivational message based on user's activity
  const getMotivationalMessage = () => {
    if (recentDecks.length === 0) {
      return "Let's start your learning journey! 🚀";
    }

    if (overallStats.totalDueCards > 20) {
      return "You've got this! Time to ace those reviews! 💪";
    }

    if (overallStats.totalDueCards > 0) {
      return 'Ready to level up your knowledge? 📚';
    }

    if (overallStats.totalNewCards > 10) {
      return 'Exciting new content awaits! 🌟';
    }

    return 'Keep up the amazing work! 🎉';
  };

  // Fetch due cards for all decks
  const fetchDueCardsForDecks = async decks => {
    const dueCardsData = {};
    let totalDue = 0;
    let totalNew = 0;
    let needsAttention = 0;

    await Promise.all(
      decks.map(async deck => {
        try {
          const response = await getDueCardsCountApi(deck._id);
          if (response?.data?.success) {
            const data = response.data.data;
            dueCardsData[deck._id] = data;
            totalDue += data.dueCards || 0;
            totalNew += data.newCards || 0;

            if (
              data.dueCards > 5 ||
              (data.studyProgress < 50 && data.totalCards > 0)
            ) {
              needsAttention++;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching due cards for deck ${deck._id}:`,
            error,
          );
          dueCardsData[deck._id] = {
            totalCards: deck.cardCount || 0,
            dueCards: 0,
            newCards: 0,
            studyProgress: 0,
          };
        }
      }),
    );

    setDeckDueCards(dueCardsData);
    setOverallStats(prev => ({
      ...prev,
      totalDueCards: totalDue,
      totalNewCards: totalNew,
      decksNeedingAttention: needsAttention,
    }));
  };

  // Fetch dashboard data with intelligent caching
  const fetchDashboardData = useCallback(
    async (isRefresh = false, forceRefresh = false) => {
      try {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // Skip fetching if data was recently loaded and it's not a forced refresh
        if (
          !forceRefresh &&
          !isRefresh &&
          dataLoadedRef.current &&
          timeSinceLastFetch < CACHE_DURATION
        ) {
          return;
        }

        if (isRefresh) setRefreshing(true);
        else if (!dataLoadedRef.current) setLoading(true);

        const decksResponse = await getUserFlashcardDecksApi({
          page: 1,
          limit: 6,
        });

        if (decksResponse?.data?.success) {
          const decks = decksResponse.data.decks || [];
          setRecentDecks(decks);
          setOverallStats(prev => ({
            ...prev,
            totalDecks: decksResponse.data.pagination?.total || 0,
          }));

          if (decks.length > 0) {
            await fetchDueCardsForDecks(decks);
          }

          // Mark data as loaded and update timestamp
          dataLoadedRef.current = true;
          lastFetchTimeRef.current = now;
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        showToast({
          type: 'error',
          title: 'Failed to load data',
          message: 'Please check your connection and try again',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast],
  );

  // Use useFocusEffect with intelligent refresh logic
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  // Separate effect for initial load
  useEffect(() => {
    if (!dataLoadedRef.current) {
      fetchDashboardData(false, true);
    }
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true, true);
  }, [fetchDashboardData]);

  // Render beautiful header
  const renderBeautifulHeader = () => {
    const greeting = getTimeGreeting();
    const motivationalMsg = getMotivationalMessage();

    return (
      <View style={styles.headerContainer}>
        {/* Background Gradient Effect */}
        <View style={styles.headerBackground}>
          <View style={styles.gradientOverlay} />

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.floatingIcon, styles.floatingIcon1]}>
              <Icon
                name="auto-awesome"
                size={16}
                color={COLORS.whiteFFFFFF + '40'}
              />
            </View>
            <View style={[styles.floatingIcon, styles.floatingIcon2]}>
              <Icon name="school" size={20} color={COLORS.whiteFFFFFF + '30'} />
            </View>
            <View style={[styles.floatingIcon, styles.floatingIcon3]}>
              <Icon
                name="psychology"
                size={14}
                color={COLORS.whiteFFFFFF + '25'}
              />
            </View>
          </View>

          {/* Header Content */}
          <View style={styles.headerContent}>
            {/* Top Row */}
            <View style={styles.headerTopRow}>
              <View style={styles.greetingSection}>
                <View style={styles.greetingRow}>
                  <Icon
                    name={greeting.icon}
                    size={24}
                    color={COLORS.whiteFFFFFF}
                  />
                  <Text
                    variant="medium16"
                    color={COLORS.whiteFFFFFF}
                    style={styles.greetingText}>
                    {greeting.text}
                  </Text>
                </View>
                <Text
                  variant="bold28"
                  color={COLORS.whiteFFFFFF}
                  style={styles.userName}>
                  {userData?.username || 'Student'}! 👋
                </Text>
              </View>

              {/* Quick Stats Badge */}
              {recentDecks.length > 0 && (
                <View style={styles.quickStatsBadge}>
                  <View style={styles.statRow}>
                    <Text variant="bold20" color={COLORS.whiteFFFFFF}>
                      {overallStats.totalDecks}
                    </Text>
                    <Text variant="medium10" color={COLORS.whiteFFFFFF + 'CC'}>
                      {overallStats.totalDecks === 1 ? 'Deck' : 'Decks'}
                    </Text>
                  </View>
                  {(overallStats.totalDueCards > 0 ||
                    overallStats.totalNewCards > 0) && (
                    <View style={styles.activityIndicator}>
                      <Icon
                        name="radio-button-checked"
                        size={8}
                        color={COLORS.yellowF5BE00}
                      />
                      <Text variant="medium9" color={COLORS.whiteFFFFFF + 'CC'}>
                        {overallStats.totalDueCards +
                          overallStats.totalNewCards}{' '}
                        active
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Motivational Message */}
            <View style={styles.motivationalSection}>
              <Text
                variant="medium16"
                color={COLORS.whiteFFFFFF + 'DD'}
                style={styles.motivationalText}>
                {motivationalMsg}
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.headerActions}>
              <Pressable
                style={styles.primaryHeaderAction}
                onPress={handleCreateDeck}>
                <Icon name="add" size={20} color={COLORS.blue043142} />
                <Text variant="semibold14" color={COLORS.blue043142}>
                  Create Deck
                </Text>
              </Pressable>

              {recentDecks.length > 0 && (
                <Pressable
                  style={styles.secondaryHeaderAction}
                  onPress={handleUploadDocument}>
                  <Icon
                    name="cloud-upload"
                    size={18}
                    color={COLORS.whiteFFFFFF}
                  />
                  <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                    Upload
                  </Text>
                </Pressable>
              )}

              {recentDecks.length > 0 && (
                <Pressable
                  style={styles.secondaryHeaderAction}
                  onPress={() =>
                    navigation.navigate(Routes.FlashcardAnalytics)
                  }>
                  <Icon name="analytics" size={18} color={COLORS.whiteFFFFFF} />
                  <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                    Analytics
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Get priority recommendation based on real data
  const getPriorityRecommendation = () => {
    if (overallStats.totalDueCards > 15) {
      return {
        title: '🔥 Focus on Review',
        subtitle: `${overallStats.totalDueCards} cards need your attention`,
        icon: 'schedule',
        color: COLORS.redEA4335,
        bgColor: COLORS.redEA4335 + '15',
        actionText: 'Start Reviewing',
      };
    }

    if (overallStats.totalNewCards > 10) {
      return {
        title: '✨ Ready to Learn',
        subtitle: `${overallStats.totalNewCards} new cards waiting to be learned`,
        icon: 'lightbulb',
        color: COLORS.blue043142,
        bgColor: COLORS.blue043142 + '15',
        actionText: 'Start Learning',
      };
    }

    if (overallStats.decksNeedingAttention > 0) {
      return {
        title: '⚡ Boost Performance',
        subtitle: `${overallStats.decksNeedingAttention} deck${
          overallStats.decksNeedingAttention > 1 ? 's' : ''
        } need attention`,
        icon: 'trending-up',
        color: COLORS.yellowF5BE00,
        bgColor: COLORS.yellowF5BE00 + '15',
        actionText: 'Improve Now',
      };
    }

    return {
      title: '🎉 All Caught Up!',
      subtitle: 'Amazing work! Your study game is absolutely on point',
      icon: 'check-circle',
      color: COLORS.green34A853,
      bgColor:
        'linear-gradient(135deg, ' +
        COLORS.green34A853 +
        '15, ' +
        COLORS.yellowF5BE00 +
        '10)',
      actionText: 'Keep Crushing It!',
      celebration: true, // Add this flag
    };
  };

  // Enhanced overview stats
  const renderEnhancedOverview = () => {
    if (recentDecks.length === 0) return null;

    const recommendation = getPriorityRecommendation();

    return (
      <View style={styles.overviewContainer}>
        {/* Enhanced Priority Card */}
        <View
          style={[
            styles.priorityCard,
            {backgroundColor: recommendation.bgColor},
          ]}>
          <View style={styles.priorityCardHeader}>
            <View style={styles.priorityCardLeft}>
              <Text variant="semibold18" color={COLORS.blue043142}>
                {recommendation.title}
              </Text>
              <Text
                variant="medium14"
                color={COLORS.grey666666}
                style={styles.prioritySubtitle}>
                {recommendation.subtitle}
              </Text>
            </View>
            <View
              style={[
                styles.priorityIconCircle,
                {backgroundColor: recommendation.color},
              ]}>
              <Icon
                name={recommendation.icon}
                size={24}
                color={COLORS.whiteFFFFFF}
              />
            </View>
          </View>

          <Pressable
            style={[
              styles.priorityAction,
              {backgroundColor: recommendation.color},
            ]}>
            <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
              {recommendation.actionText}
            </Text>
            <Icon name="arrow-forward" size={16} color={COLORS.whiteFFFFFF} />
          </Pressable>
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.enhancedStatsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardIcon}>
              <Icon name="library-books" size={20} color={COLORS.blue043142} />
            </View>
            <Text variant="bold20" color={COLORS.blue043142}>
              {overallStats.totalDecks}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777}>
              Total Decks
            </Text>
          </View>

          {overallStats.totalDueCards > 0 && (
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statCardIcon,
                  {backgroundColor: COLORS.redEA4335 + '15'},
                ]}>
                <Icon name="schedule" size={20} color={COLORS.redEA4335} />
              </View>
              <Text variant="bold20" color={COLORS.redEA4335}>
                {overallStats.totalDueCards}
              </Text>
              <Text variant="medium11" color={COLORS.grey777777}>
                Due Today
              </Text>
            </View>
          )}

          {overallStats.totalNewCards > 0 && (
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statCardIcon,
                  {backgroundColor: COLORS.green34A853 + '15'},
                ]}>
                <Icon
                  name="auto-awesome"
                  size={20}
                  color={COLORS.green34A853}
                />
              </View>
              <Text variant="bold20" color={COLORS.green34A853}>
                {overallStats.totalNewCards}
              </Text>
              <Text variant="medium11" color={COLORS.grey777777}>
                New Cards
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Enhanced deck card
  const renderEnhancedDeck = ({item}) => {
    const dueData = deckDueCards[item._id] || {
      totalCards: item.cardCount || 0,
      dueCards: 0,
      newCards: 0,
      studyProgress: 0,
    };

    const hasActivity = dueData.dueCards > 0 || dueData.newCards > 0;
    const progressPercentage = Math.round(dueData.studyProgress || 0);
    const needsAttention =
      dueData.dueCards > 5 ||
      (dueData.studyProgress < 50 && dueData.totalCards > 0);

    return (
      <Pressable
        style={[
          styles.enhancedDeckCard,
          needsAttention && styles.deckCardNeedsAttention,
        ]}
        onPress={() => handleDeckPress(item)}>
        {/* Enhanced Header */}
        <View style={styles.enhancedDeckHeader}>
          <View style={styles.deckIconContainer}>
            <Icon name="style" size={20} color={COLORS.blue043142} />
          </View>
          <View style={styles.deckInfoExpanded}>
            <Text
              variant="semibold16"
              color={COLORS.blue043142}
              numberOfLines={2}>
              {item.title || 'Untitled Deck'}
            </Text>
            <View style={styles.deckMetaRow}>
              <View style={styles.subjectChip}>
                <Text variant="medium10" color={COLORS.blue043142}>
                  {item.subject?.charAt(0).toUpperCase() +
                    item.subject?.slice(1) || 'General'}
                </Text>
              </View>
              <Text variant="medium12" color={COLORS.grey777777}>
                {dueData.totalCards} cards
              </Text>
            </View>
          </View>

          {/* Activity Status */}
          <View style={styles.activityStatus}>
            {hasActivity && (
              <View style={styles.activeIndicator}>
                <View style={styles.pulseDot} />
              </View>
            )}
            {progressPercentage > 0 && (
              <View style={styles.progressBadge}>
                <Text variant="medium10" color={COLORS.green34A853}>
                  {progressPercentage}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Activity Summary */}
        {(dueData.dueCards > 0 || dueData.newCards > 0) && (
          <View style={styles.activitySummary}>
            {dueData.dueCards > 0 && (
              <View style={styles.activityBadge}>
                <Icon name="schedule" size={12} color={COLORS.redEA4335} />
                <Text variant="medium11" color={COLORS.redEA4335}>
                  {dueData.dueCards} due
                </Text>
              </View>
            )}
            {dueData.newCards > 0 && (
              <View style={styles.activityBadge}>
                <Icon name="fiber-new" size={12} color={COLORS.green34A853} />
                <Text variant="medium11" color={COLORS.green34A853}>
                  {dueData.newCards} new
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Progress Bar */}
        {dueData.totalCards > 0 && (
          <View style={styles.enhancedProgressSection}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {width: `${Math.min(progressPercentage, 100)}%`},
                  ]}
                />
              </View>
              <Text variant="medium10" color={COLORS.grey777777}>
                {progressPercentage}% studied
              </Text>
            </View>
          </View>
        )}

        {/* Enhanced Action Buttons */}
        <View style={styles.enhancedDeckActions}>
          <Pressable
            style={[
              styles.enhancedStudyButton,
              hasActivity && styles.studyButtonUrgent,
            ]}
            onPress={() => handleStudyDeck(item)}>
            <Icon name="play-arrow" size={16} color={COLORS.whiteFFFFFF} />
            <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
              {hasActivity ? 'Study Now' : 'Study'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.enhancedBrowseButton}
            onPress={() => handleBrowseDeck(item)}>
            <Icon name="visibility" size={16} color={COLORS.blue043142} />
          </Pressable>

          <Pressable
            style={styles.enhancedBrowseButton}
            onPress={() => navigateToCramMode(item)}>
            <Icon name="flash-on" size={16} color={COLORS.redEA4335} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const navigateToCramMode = deck => {
    navigation.navigate(Routes.CramMode, {
      deckId: deck._id,
      deckTitle: deck.title,
    });
  };

  // Action handlers
  const handleCreateDeck = () => {
    mixpanel.track(`Click on Create Deck Button`);
    navigation.navigate(Routes.CreateDeck);
  };

  const handleUploadDocument = () => {
    if (recentDecks.length === 0) {
      Alert.alert(
        'Create a Deck First',
        'You need to create at least one deck before uploading documents.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Create Deck', onPress: handleCreateDeck},
        ],
      );
      return;
    }
    navigation.navigate(Routes.UploadDocument);
  };

  const handleViewAllDecks = () => navigation.navigate(Routes.MyDecks);
  const handleDeckPress = deck =>
    navigation.navigate(Routes.DeckDetails, {deckId: deck._id});
  const handleStudyDeck = deck =>
    navigation.navigate(Routes.FlashcardViewer, {
      deckId: deck._id,
      studyMode: true,
    });
  const handleBrowseDeck = deck =>
    navigation.navigate(Routes.FlashcardViewer, {
      deckId: deck._id,
      studyMode: false,
    });

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.blue043142}
        />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.blue043142} />
            <Text
              variant="medium14"
              color={COLORS.grey777777}
              style={styles.loadingText}>
              Loading your flashcards...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />

      {renderBeautifulHeader()}

      <View style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }>
          {/* Enhanced Overview Stats */}
          {renderEnhancedOverview()}

          {/* Decks Section */}
          <View style={styles.decksSection}>
            <View style={styles.sectionHeader}>
              <Text variant="semibold20" color={COLORS.blue043142}>
                {recentDecks.length === 0
                  ? '🎯 Get Started'
                  : '📚 Your Study Decks'}
              </Text>
              {recentDecks.length > 0 && overallStats.totalDecks > 6 && (
                <Pressable
                  onPress={handleViewAllDecks}
                  style={styles.viewAllButton}>
                  <Text variant="medium14" color={COLORS.blue043142}>
                    View All
                  </Text>
                  <Icon
                    name="arrow-forward"
                    size={16}
                    color={COLORS.blue043142}
                  />
                </Pressable>
              )}
            </View>

            {recentDecks.length > 0 ? (
              <FlatList
                data={recentDecks}
                renderItem={renderEnhancedDeck}
                keyExtractor={(item, index) => item._id || index.toString()}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.decksList}
              />
            ) : (
              <View style={styles.enhancedEmptyState}>
                <View style={styles.emptyStateIcon}>
                  <Icon
                    name="auto-awesome"
                    size={48}
                    color={COLORS.blue043142}
                  />
                </View>
                <Text
                  variant="bold22"
                  color={COLORS.blue043142}
                  style={styles.emptyStateTitle}>
                  Start Your Learning Journey
                </Text>
                <Text
                  variant="medium14"
                  color={COLORS.grey666666}
                  style={styles.emptyStateDescription}>
                  Create your first flashcard deck and unlock the power of
                  spaced repetition learning
                </Text>

                <View style={styles.emptyStateActions}>
                  <Button
                    text="Create Your First Deck"
                    onPress={handleCreateDeck}
                    style={styles.emptyStatePrimary}
                    icon="add"
                    iconColor={COLORS.whiteFFFFFF}
                  />
                  <Pressable
                    style={styles.emptyStateSecondary}
                    onPress={() => {
                      mixpanel.track(`Click on Create Deck Button`);
                      navigation.navigate(Routes.PublicDecks);
                    }}>
                    <Icon name="explore" size={18} color={COLORS.blue043142} />
                    <Text variant="medium14" color={COLORS.blue043142}>
                      Explore Public Decks
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue043142,
  },

  // Beautiful Header Styles
  headerContainer: {
    backgroundColor: COLORS.blue043142,
  },
  headerBackground: {
    position: 'relative',
    paddingTop: nh(20),
    paddingBottom: nh(30),
    paddingHorizontal: nw(20),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `linear-gradient(135deg, ${COLORS.blue043142} 0%, ${COLORS.blue043142}DD 100%)`,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    borderRadius: nw(20),
    backgroundColor: COLORS.whiteFFFFFF + '10',
    padding: nw(8),
  },
  floatingIcon1: {
    top: nh(30),
    right: nw(40),
  },
  floatingIcon2: {
    top: nh(80),
    left: nw(30),
  },
  floatingIcon3: {
    top: nh(120),
    right: nw(80),
  },
  headerContent: {
    zIndex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(16),
  },
  greetingSection: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(4),
    gap: nw(8),
  },
  greetingText: {
    opacity: 0.9,
  },
  userName: {
    lineHeight: nh(32),
  },
  quickStatsBadge: {
    backgroundColor: COLORS.whiteFFFFFF + '20',
    borderRadius: nw(16),
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.whiteFFFFFF + '30',
  },
  statRow: {
    alignItems: 'center',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(4),
    gap: nw(4),
  },
  motivationalSection: {
    marginBottom: nh(20),
  },
  motivationalText: {
    lineHeight: nh(22),
  },
  headerActions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  primaryHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderRadius: nw(20),
    gap: nw(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF + '20',
    paddingHorizontal: nw(12),
    paddingVertical: nh(10),
    borderRadius: nw(16),
    borderWidth: 1,
    borderColor: COLORS.whiteFFFFFF + '30',
    gap: nw(2),
  },

  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nh(24),
    borderTopRightRadius: nh(24),
    paddingTop: nh(20),
    paddingHorizontal: nw(20),
  },

  // Enhanced Overview
  overviewContainer: {
    marginBottom: nh(24),
  },
  priorityCard: {
    borderRadius: nw(16),
    padding: nw(20),
    marginBottom: nh(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priorityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(16),
  },
  priorityCardLeft: {
    flex: 1,
  },
  prioritySubtitle: {
    marginTop: nh(4),
    lineHeight: nh(20),
  },
  priorityIconCircle: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    borderRadius: nw(12),
    gap: nw(6),
  },
  enhancedStatsGrid: {
    flexDirection: 'row',
    gap: nw(12),
  },
  celebrationCard: {
    borderWidth: 2,
    borderColor: COLORS.green34A853 + '30',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  celebrationIcon: {
    elevation: 2,
    shadowColor: COLORS.green34A853,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  celebrationAction: {
    elevation: 2,
    shadowColor: COLORS.green34A853,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statCardIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(8),
  },

  // Enhanced Deck Cards
  decksSection: {
    marginBottom: nh(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  decksList: {
    gap: nh(12),
  },
  enhancedDeckCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE + '80',
  },
  deckCardNeedsAttention: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.yellowF5BE00,
  },
  enhancedDeckHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(12),
    gap: nw(12),
  },
  deckIconContainer: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckInfoExpanded: {
    flex: 1,
  },
  deckMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(4),
    gap: nw(8),
  },
  subjectChip: {
    backgroundColor: COLORS.blue043142 + '15',
    paddingHorizontal: nw(8),
    paddingVertical: nh(2),
    borderRadius: nw(8),
  },
  activityStatus: {
    alignItems: 'center',
    gap: nh(4),
  },
  activeIndicator: {
    position: 'relative',
  },
  pulseDot: {
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    backgroundColor: COLORS.redEA4335,
  },
  progressBadge: {
    backgroundColor: COLORS.green34A853 + '15',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(8),
  },
  activitySummary: {
    flexDirection: 'row',
    gap: nw(8),
    marginBottom: nh(12),
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF8F8F8,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(8),
    gap: nw(4),
  },
  enhancedProgressSection: {
    marginBottom: nh(12),
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  progressBarTrack: {
    flex: 1,
    height: nh(6),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nh(3),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(3),
  },
  enhancedDeckActions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  enhancedStudyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(12),
    borderRadius: nw(12),
    gap: nw(6),
  },
  studyButtonUrgent: {
    backgroundColor: COLORS.redEA4335,
  },
  enhancedBrowseButton: {
    width: nw(44),
    height: nw(44),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },

  // Enhanced Empty State
  enhancedEmptyState: {
    alignItems: 'center',
    paddingVertical: nh(40),
    paddingHorizontal: nw(20),
  },
  emptyStateIcon: {
    width: nw(96),
    height: nw(96),
    borderRadius: nw(48),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(20),
  },
  emptyStateTitle: {
    marginBottom: nh(8),
    textAlign: 'center',
  },
  emptyStateDescription: {
    textAlign: 'center',
    lineHeight: nh(20),
    marginBottom: nh(32),
  },
  emptyStateActions: {
    alignItems: 'center',
    gap: nh(12),
    width: '100%',
  },
  emptyStatePrimary: {
    width: '100%',
  },
  emptyStateSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(20),
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(12),
    gap: nw(6),
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    padding: nw(40),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: nh(16),
    textAlign: 'center',
  },

  // Bottom spacing
  bottomSpacing: {
    height: nh(40),
  },
});

export default FlashcardHub;
