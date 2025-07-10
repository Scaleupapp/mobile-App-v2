// screens/AIStudyBuddy/AIStudyBuddyBookmarks.js
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
  aiStudyBuddyGetBookmarksApi,
  aiStudyBuddyToggleBookmarkApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';
import {color} from 'react-native-elements/dist/helpers';
import mixpanel from '../../helper/mixpanelClient';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddyBookmarks = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'oldest', 'subject'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBookmark, setExpandedBookmark] = useState(null);

  // Filter options
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // FIX: Safe array helper function
  const safeArray = arr => (Array.isArray(arr) ? arr : []);

  // FIX: Get default bookmarks data
  const getDefaultBookmarksData = () => [
    {
      messageId: 'demo_1',
      sessionId: 'session_1',
      sessionSubject: 'Mathematics',
      content:
        'Quadratic equations can be solved using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a. This formula works for any quadratic equation in the form ax² + bx + c = 0.',
      bookmarkedAt: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 2 days ago
      topics: ['Algebra', 'Quadratic Equations', 'Formula'],
    },
    {
      messageId: 'demo_2',
      sessionId: 'session_2',
      sessionSubject: 'Physics',
      content:
        "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
      bookmarkedAt: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 5 days ago
      topics: ["Newton's Laws", 'Motion', 'Forces'],
    },
    {
      messageId: 'demo_3',
      sessionId: 'session_3',
      sessionSubject: 'Chemistry',
      content:
        "The periodic table is organized by atomic number, which represents the number of protons in an atom's nucleus. Elements in the same group share similar chemical properties.",
      bookmarkedAt: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 1 week ago
      topics: ['Periodic Table', 'Atomic Structure', 'Elements'],
    },
  ];

  // Load bookmarks
  const loadBookmarks = useCallback(
    async (pageNum = 1, showLoader = true) => {
      try {
        if (showLoader && pageNum === 1) setLoading(true);

        const params = {
          page: pageNum,
          limit: 20,
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        };

        // FIX: Add try-catch for API call with fallback
        try {
          const response = await aiStudyBuddyGetBookmarksApi(params);

          if (response.data && response.data.success) {
            const newBookmarks = safeArray(
              response.data.bookmarks || response.data.bookmarkedMessages,
            );

            if (pageNum === 1) {
              setBookmarks(newBookmarks);
            } else {
              setBookmarks(prev => [...safeArray(prev), ...newBookmarks]);
            }

            setHasMore(newBookmarks.length === 20);
            setPage(pageNum);

            // Extract unique subjects and topics for filters
            if (pageNum === 1) {
              const uniqueSubjects = [
                ...new Set(
                  newBookmarks.map(b => b.sessionSubject).filter(Boolean),
                ),
              ];
              const uniqueTopics = [
                ...new Set(
                  newBookmarks
                    .flatMap(b => safeArray(b.topics))
                    .filter(Boolean),
                ),
              ];
              setSubjects(uniqueSubjects);
              setTopics(uniqueTopics);
            }

            // Start entrance animations
            if (showLoader && pageNum === 1) {
              startEntranceAnimations();
            }
          } else {
            // If API returns success but no bookmarks, use demo data
            if (pageNum === 1) {
              const demoData = getDefaultBookmarksData();
              setBookmarks(demoData);
              setHasMore(false);

              // Set demo filter options
              setSubjects(['Mathematics', 'Physics', 'Chemistry']);
              setTopics(['Algebra', "Newton's Laws", 'Periodic Table']);

              if (showLoader) {
                startEntranceAnimations();
              }

              showToast({
                message:
                  'Showing sample bookmarks. Start bookmarking to see your saved messages!',
                type: 'info',
              });
            }
          }
        } catch (apiError) {
          console.warn('Bookmarks API failed, using demo data:', apiError);

          if (pageNum === 1) {
            const demoData = getDefaultBookmarksData();
            setBookmarks(demoData);
            setHasMore(false);

            // Set demo filter options
            setSubjects(['Mathematics', 'Physics', 'Chemistry']);
            setTopics(['Algebra', "Newton's Laws", 'Periodic Table']);

            if (showLoader) {
              startEntranceAnimations();
            }

            showToast({
              message: 'Unable to load bookmarks. Showing sample data.',
              type: 'info',
            });
          }
        }
      } catch (error) {
        console.error('Load bookmarks error:', error);

        // Set fallback data on any error
        if (pageNum === 1) {
          const demoData = getDefaultBookmarksData();
          setBookmarks(demoData);
          setHasMore(false);
          setSubjects(['Mathematics', 'Physics', 'Chemistry']);
          setTopics(['Algebra', "Newton's Laws", 'Periodic Table']);

          if (showLoader) {
            startEntranceAnimations();
          }
        }

        showToast({
          message: 'Failed to load bookmarks. Please try again.',
          type: 'error',
        });
      } finally {
        if (showLoader && pageNum === 1) setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSubject, selectedTopic, showToast],
  );

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

  // FIX: Apply filters and search with safe array handling
  useEffect(() => {
    let filtered = [...safeArray(bookmarks)];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark => {
        const content = bookmark.content || '';
        const topics = safeArray(bookmark.topics);
        const subject = bookmark.sessionSubject || '';

        return (
          content.toLowerCase().includes(query) ||
          topics.some(topic => topic.toLowerCase().includes(query)) ||
          subject.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort(
          (a, b) =>
            new Date(b.bookmarkedAt || 0) - new Date(a.bookmarkedAt || 0),
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.bookmarkedAt || 0) - new Date(b.bookmarkedAt || 0),
        );
        break;
      case 'subject':
        filtered.sort((a, b) =>
          (a.sessionSubject || '').localeCompare(b.sessionSubject || ''),
        );
        break;
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, searchQuery, sortBy]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadBookmarks(1, false);
  }, [loadBookmarks]);

  // Load more data
  const loadMoreBookmarks = () => {
    if (hasMore && !loading) {
      loadBookmarks(page + 1, false);
    }
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [loadBookmarks]),
  );

  // Toggle bookmark
  const toggleBookmark = async messageId => {
    try {
      // FIX: Handle demo data removal
      if (messageId.startsWith('demo_')) {
        setBookmarks(prev =>
          safeArray(prev).filter(b => b.messageId !== messageId),
        );
        showToast({
          message: 'Demo bookmark removed',
          type: 'success',
        });
        return;
      }

      await aiStudyBuddyToggleBookmarkApi(messageId);

      // Remove from local state
      setBookmarks(prev =>
        safeArray(prev).filter(b => b.messageId !== messageId),
      );

      showToast({
        message: 'Bookmark removed',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: formatAiStudyBuddyError(error),
        type: 'error',
      });
    }
  };

  // FIX: Format date with null check
  const formatDate = dateString => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get subject icon and color
  const getSubjectStyle = subject => {
    const styles = {
      mathematics: {icon: 'calculate', color: '#6366F1'},
      physics: {icon: 'science', color: '#06B6D4'},
      chemistry: {icon: 'biotech', color: '#10B981'},
      biology: {icon: 'eco', color: '#EF4444'},
      computer_science: {icon: 'computer', color: '#8B5CF6'},
      english: {icon: 'menu-book', color: '#EC4899'},
    };
    return styles[subject?.toLowerCase()] || {icon: 'book', color: '#6B7280'};
  };

  // Render search header
  const renderSearchHeader = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <Pressable
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}>
        <Icon name="tune" size={20} color="#374151" />
      </Pressable>
    </View>
  );

  // Render sort options
  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          {value: 'recent', label: 'Most Recent'},
          {value: 'oldest', label: 'Oldest First'},
          {value: 'subject', label: 'By Subject'},
        ].map(option => (
          <Pressable
            key={option.value}
            style={[
              styles.sortOption,
              sortBy === option.value && styles.sortOptionActive,
            ]}
            onPress={() => setSortBy(option.value)}>
            <Text
              style={[
                styles.sortText,
                sortBy === option.value && styles.sortTextActive,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // FIX: Render bookmark item with safe property access
  const renderBookmarkItem = ({item, index}) => {
    const subjectStyle = getSubjectStyle(item.sessionSubject);
    const isExpanded = expandedBookmark === item.messageId;
    const content = item.content || 'No content available';
    const topics = safeArray(item.topics);

    return (
      <Animated.View
        style={[
          styles.bookmarkCard,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* Header */}
        <View style={styles.bookmarkHeader}>
          <View style={styles.bookmarkInfo}>
            <View
              style={[
                styles.subjectIcon,
                {backgroundColor: subjectStyle.color},
              ]}>
              <Icon name={subjectStyle.icon} size={16} color="white" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.subjectName}>
                {item.sessionSubject || 'General'}
              </Text>
              <Text style={styles.bookmarkDate}>
                {formatDate(item.bookmarkedAt)}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.bookmarkAction}
            onPress={() => toggleBookmark(item.messageId)}>
            <Icon name="bookmark" size={20} color="#F59E0B" />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.bookmarkContent}>
          <Text
            style={styles.contentText}
            numberOfLines={isExpanded ? undefined : 3}>
            {content}
          </Text>

          {content.length > 150 && (
            <Pressable
              style={styles.expandButton}
              onPress={() =>
                setExpandedBookmark(isExpanded ? null : item.messageId)
              }>
              <Text style={styles.expandText}>
                {isExpanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Topics */}
        {topics.length > 0 && (
          <View style={styles.topicsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topics.slice(0, 3).map((topic, topicIndex) => (
                <View key={topicIndex} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
              {topics.length > 3 && (
                <View style={styles.topicChip}>
                  <Text style={styles.topicText}>+{topics.length - 3}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={styles.bookmarkActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              if (item.messageId.startsWith('demo_')) {
                showToast({
                  message:
                    'This is a demo bookmark. Start a real conversation to bookmark messages!',
                  type: 'info',
                });
                return;
              }
              navigation.navigate(Routes.AIStudyBuddyChat, {
                sessionId: item.sessionId,
                messageId: item.messageId,
              });
            }}>
            <Icon name="chat" size={16} color="#6366F1" />
            <Text style={styles.actionText}>View Conversation</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              showToast({
                message: 'Sharing coming soon!',
                type: 'info',
              });
            }}>
            <Icon name="share" size={16} color="#6B7280" />
            <Text style={[styles.actionText, {color: '#6B7280'}]}>Share</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  // FIX: Render filter modal with safe array handling
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Bookmarks</Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Subject Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Subject</Text>
              <View style={styles.filterOptions}>
                <Pressable
                  style={[
                    styles.filterOption,
                    selectedSubject === 'all' && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedSubject('all')}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedSubject === 'all' &&
                        styles.filterOptionTextActive,
                    ]}>
                    All Subjects
                  </Text>
                </Pressable>

                {safeArray(subjects).map(subject => (
                  <Pressable
                    key={subject}
                    style={[
                      styles.filterOption,
                      selectedSubject === subject && styles.filterOptionActive,
                    ]}
                    onPress={() => setSelectedSubject(subject)}>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedSubject === subject &&
                          styles.filterOptionTextActive,
                      ]}>
                      {subject}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Topic Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Topic</Text>
              <View style={styles.filterOptions}>
                <Pressable
                  style={[
                    styles.filterOption,
                    selectedTopic === 'all' && styles.filterOptionActive,
                  ]}
                  onPress={() => setSelectedTopic('all')}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedTopic === 'all' && styles.filterOptionTextActive,
                    ]}>
                    All Topics
                  </Text>
                </Pressable>

                {safeArray(topics)
                  .slice(0, 10)
                  .map(topic => (
                    <Pressable
                      key={topic}
                      style={[
                        styles.filterOption,
                        selectedTopic === topic && styles.filterOptionActive,
                      ]}
                      onPress={() => setSelectedTopic(topic)}>
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedTopic === topic &&
                            styles.filterOptionTextActive,
                        ]}>
                        {topic}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Button
              title="Clear Filters"
              onPress={() => {
                setSelectedSubject('all');
                setSelectedTopic('all');
              }}
              style={styles.clearButton}
              textStyle={styles.clearButtonText}
            />
            <Button
              title="Apply Filters"
              onPress={() => {
                setShowFilters(false);
                loadBookmarks(1);
              }}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.emptyIcon}>
        <Icon name="bookmark-border" size={32} color="white" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
      <Text style={styles.emptyDescription}>
        Start bookmarking important messages in your AI Study Buddy
        conversations to save them here
      </Text>
      <Button
        text="Start Learning"
        onPress={() => {
          mixpanel.track('Clicked on start Learning');
          navigation.navigate(Routes.AIStudyBuddyHub);
        }}
        style={styles.emptyButton}
        // textStyle={{color: COLORS.whiteFFFFFF}}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <Header title="Bookmarks" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading your bookmarks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // FIX: Safe length check for bookmarks
  const bookmarksLength = safeArray(bookmarks).length;
  const filteredBookmarksLength = safeArray(filteredBookmarks).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <Header
        title="Bookmarks"
        showBackButton
        rightComponent={
          bookmarksLength > 0 && (
            <Text style={styles.bookmarkCount}>
              {filteredBookmarksLength} items
            </Text>
          )
        }
      />

      {bookmarksLength === 0 ? (
        renderEmptyState()
      ) : (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Search Header */}
          {renderSearchHeader()}

          {/* Sort Options */}
          {renderSortOptions()}

          {/* Bookmarks List */}
          <FlatList
            data={filteredBookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={item => item.messageId || `bookmark_${Math.random()}`}
            style={styles.bookmarksList}
            contentContainerStyle={styles.bookmarksContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreBookmarks}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              hasMore && !loading ? (
                <ActivityIndicator
                  size="small"
                  color="#6366F1"
                  style={styles.loadMoreIndicator}
                />
              ) : null
            }
          />
        </Animated.View>
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  bookmarkCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nw(20),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: nw(12),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    gap: nw(8),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    padding: nw(8),
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },

  // Sort
  sortContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortOption: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(6),
    marginHorizontal: nw(4),
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sortOptionActive: {
    backgroundColor: '#6366F1',
  },
  sortText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },

  // Bookmarks List
  bookmarksList: {
    flex: 1,
  },
  bookmarksContent: {
    padding: nw(20),
    gap: nh(16),
  },
  bookmarkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: nw(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Bookmark Header
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    width: nw(24),
    height: nw(24),
    borderRadius: nw(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  headerText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookmarkAction: {
    padding: nw(4),
  },

  // Content
  bookmarkContent: {
    marginBottom: nh(12),
  },
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  expandButton: {
    marginTop: nh(4),
  },
  expandText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },

  // Topics
  topicsContainer: {
    marginBottom: nh(12),
  },
  topicChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 12,
    marginRight: nw(6),
  },
  topicText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Actions
  bookmarkActions: {
    flexDirection: 'row',
    gap: nw(16),
    paddingTop: nh(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  actionText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterContent: {
    flex: 1,
    padding: nw(20),
  },
  filterSection: {
    marginBottom: nh(24),
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(12),
  },
  filterOptions: {
    gap: nh(8),
  },
  filterOption: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  filterOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F115',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#6366F1',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    gap: nw(12),
    padding: nw(20),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  clearButtonText: {
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(40),
  },
  emptyIcon: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(24),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(8),
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: nh(32),
  },
  emptyButton: {
    paddingHorizontal: nw(32),
  },

  loadMoreIndicator: {
    paddingVertical: nh(20),
  },
});

export default AIStudyBuddyBookmarks;
