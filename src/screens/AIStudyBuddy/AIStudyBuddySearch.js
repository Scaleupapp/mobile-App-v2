// screens/AIStudyBuddy/AIStudyBuddySearch.js
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import API services
import {
  aiStudyBuddyGetActiveSessionsApi,
  aiStudyBuddyGetSessionHistoryApi,
  aiStudyBuddySearchMessagesApi,
  formatAiStudyBuddyError,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddySearch = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  const {initialQuery = ''} = route.params || {};

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    subject: 'all',
    dateRange: 'all',
    messageType: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
    loadAllSessions();
    if (initialQuery.trim()) {
      performSearch(initialQuery);
    }
  }, []);

  const loadAllSessions = async () => {
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        aiStudyBuddyGetActiveSessionsApi().catch(() => ({
          data: {activeSessions: []},
        })),
        aiStudyBuddyGetSessionHistoryApi({limit: 100}).catch(() => ({
          data: {sessions: []},
        })),
      ]);

      const activeSessions = activeResponse.data.activeSessions || [];
      const historySessions = historyResponse.data.sessions || [];

      // Combine and deduplicate sessions
      const allSessionsMap = new Map();
      [...activeSessions, ...historySessions].forEach(session => {
        allSessionsMap.set(session.sessionId, session);
      });

      setAllSessions(Array.from(allSessionsMap.values()));
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const performSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);

      // Prepare API parameters - aligned with backend expectations
      const searchParams = {
        query: query.trim(),
        page: 1,
        limit: 50,
        // Apply filters only if they're not 'all'
        subject: filters.subject !== 'all' ? filters.subject : undefined,
        dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
        messageType:
          filters.messageType !== 'all' ? filters.messageType : undefined,
      };

      // Remove undefined values to keep params clean
      Object.keys(searchParams).forEach(
        key => searchParams[key] === undefined && delete searchParams[key],
      );

      console.log('Searching with params:', searchParams);

      // Call the actual search API
      const response = await aiStudyBuddySearchMessagesApi(searchParams);

      if (response.data && response.data.success) {
        // Use the API results directly
        setSearchResults(response.data.results || []);
      } else {
        // Fallback to client-side search if API fails
        console.log('API search failed, falling back to client-side search');
        await performClientSideSearch(query);
      }
    } catch (error) {
      console.error('Search API error:', error);

      // Graceful fallback to client-side search
      showToast({
        message: 'Using offline search...',
        type: 'info',
      });

      await performClientSideSearch(query);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.subject !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.messageType !== 'all') count++;
    return count;
  };

  const renderSearchInput = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.grey777777} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="What are you looking for?"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => performSearch()}
          placeholderTextColor={COLORS.grey999999}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close" size={18} color={COLORS.grey777777} />
          </Pressable>
        )}
      </View>

      <View style={styles.searchActions}>
        <Pressable
          style={[
            styles.filterButton,
            getActiveFilterCount() > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}>
          <Icon
            name="tune"
            size={18}
            color={
              getActiveFilterCount() > 0
                ? COLORS.whiteFFFFFF
                : COLORS.grey777777
            }
          />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text variant="medium9" color={COLORS.whiteFFFFFF}>
                {getActiveFilterCount()}
              </Text>
            </View>
          )}
        </Pressable>

        <Button
          text="Search"
          onPress={() => performSearch()}
          style={styles.searchButton}
          backgroundColor={COLORS.blue043142}
          disabled={!searchQuery.trim()}
          loading={loading}
          width={nw(290)}
        />
      </View>
    </View>
  );

  const renderSearchResult = ({item}) => {
    const isSession = item.messageType === 'session';

    return (
      <Pressable
        style={styles.resultCard}
        onPress={() =>
          navigation.navigate(Routes.AIStudyBuddyChat, {
            sessionId: item.sessionId,
          })
        }>
        <View style={styles.resultHeader}>
          <View style={styles.resultMeta}>
            <View
              style={[
                styles.messageTypeIcon,
                {backgroundColor: COLORS.blue043142},
              ]}>
              <Icon name="school" size={12} color="white" />
            </View>
            <View style={styles.resultInfo}>
              <Text variant="semibold13" color={COLORS.grey333333}>
                {item.sessionSubject || 'Study Session'}
              </Text>
              <Text variant="regular11" color={COLORS.grey777777}>
                {formatDate(item.sentAt)} • Study session
              </Text>
            </View>
          </View>

          {item.userInteraction?.bookmarked && (
            <Icon name="bookmark" size={16} color={COLORS.yellowF5BE00} />
          )}
        </View>

        <Text
          variant="regular14"
          color={COLORS.grey333333}
          style={styles.resultContent}
          numberOfLines={3}>
          {item.content}
        </Text>

        {item.contentAnalysis?.topics?.length > 0 && (
          <View style={styles.resultTopics}>
            {item.contentAnalysis.topics.slice(0, 3).map((topic, index) => (
              <View key={index} style={styles.topicChip}>
                <Text variant="medium10" color={COLORS.blue043142}>
                  {topic}
                </Text>
              </View>
            ))}
            {item.contentAnalysis.topics.length > 3 && (
              <Text variant="regular10" color={COLORS.grey999999}>
                +{item.contentAnalysis.topics.length - 3} more
              </Text>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text
            variant="medium14"
            color={COLORS.grey777777}
            style={styles.centerText}>
            Searching...
          </Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="search" size={64} color={COLORS.grey999999} />
          <Text
            variant="semibold16"
            color={COLORS.grey333333}
            style={styles.centerTitle}>
            Search Your Conversations
          </Text>
          <Text
            variant="regular14"
            color={COLORS.grey777777}
            style={styles.centerDescription}>
            Find any message, topic, or concept from your study sessions
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="search-off" size={64} color={COLORS.grey999999} />
          <Text
            variant="semibold16"
            color={COLORS.grey333333}
            style={styles.centerTitle}>
            No Results Found
          </Text>
          <Text
            variant="regular14"
            color={COLORS.grey777777}
            style={styles.centerDescription}>
            Try different keywords or adjust your filters
          </Text>
          <Button
            text="Clear Search"
            onPress={clearSearch}
            style={styles.centerButton}
            backgroundColor={COLORS.greyF7F7F7}
            textColor={COLORS.grey777777}
          />
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <Text
          variant="medium14"
          color={COLORS.grey777777}
          style={styles.resultsHeader}>
          Found {searchResults.length} result
          {searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
        </Text>

        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item, index) => `${item.messageId}-${index}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
        />
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      // style={{height: 400}}
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text variant="semibold16" color={COLORS.grey333333}>
              Filter Results
            </Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color={COLORS.grey777777} />
            </Pressable>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Subject Filter */}
            <View style={styles.filterSection}>
              <Text
                variant="semibold14"
                color={COLORS.grey333333}
                style={styles.filterLabel}>
                Subject
              </Text>
              {[
                'all',
                'Mathematics',
                'Physics',
                'Chemistry',
                'Biology',
                'Computer Science',
              ].map(subject => (
                <Pressable
                  key={subject}
                  style={[
                    styles.filterOption,
                    filters.subject === subject && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters(prev => ({...prev, subject}))}>
                  <Text
                    variant="medium13"
                    style={[
                      styles.filterOptionText,
                      filters.subject === subject &&
                        styles.filterOptionTextActive,
                    ]}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </Text>
                  {filters.subject === subject && (
                    <Icon name="check" size={16} color={COLORS.blue043142} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text
                variant="semibold14"
                color={COLORS.grey333333}
                style={styles.filterLabel}>
                Time Period
              </Text>
              {[
                {value: 'all', label: 'All Time'},
                {value: 'today', label: 'Today'},
                {value: 'week', label: 'This Week'},
                {value: 'month', label: 'This Month'},
              ].map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.filterOption,
                    filters.dateRange === option.value &&
                      styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, dateRange: option.value}))
                  }>
                  <Text
                    variant="medium13"
                    style={[
                      styles.filterOptionText,
                      filters.dateRange === option.value &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                  {filters.dateRange === option.value && (
                    <Icon name="check" size={16} color={COLORS.blue043142} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Message Type Filter */}
            <View style={styles.filterSection}>
              <Text
                variant="semibold14"
                color={COLORS.grey333333}
                style={styles.filterLabel}>
                Message Type
              </Text>
              {[
                {value: 'all', label: 'All Messages'},
                {value: 'user', label: 'My Questions'},
                {value: 'ai', label: 'AI Responses'},
              ].map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.filterOption,
                    filters.messageType === option.value &&
                      styles.filterOptionActive,
                  ]}
                  onPress={() =>
                    setFilters(prev => ({...prev, messageType: option.value}))
                  }>
                  <Text
                    variant="medium13"
                    style={[
                      styles.filterOptionText,
                      filters.messageType === option.value &&
                        styles.filterOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                  {filters.messageType === option.value && (
                    <Icon name="check" size={16} color={COLORS.blue043142} />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <Button
              text="Clear Filters"
              onPress={() =>
                setFilters({
                  subject: 'all',
                  dateRange: 'all',
                  messageType: 'all',
                })
              }
              style={styles.filterActionButton}
              backgroundColor={COLORS.greyF7F7F7}
              textColor={COLORS.grey777777}
            />
            <Button
              text="Apply"
              onPress={() => {
                setShowFilters(false);
                if (searchQuery.trim()) {
                  performSearch();
                }
              }}
              style={styles.filterActionButton}
              backgroundColor={COLORS.blue043142}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.whiteFFFFFF} barStyle="dark-content" />

      <Header title="Search" showBackButton />

      <View style={styles.content}>
        {renderSearchInput()}
        {renderContent()}
      </View>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  content: {
    flex: 1,
  },

  // Search Section
  searchSection: {
    padding: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    paddingHorizontal: nw(12),
    paddingVertical: nh(12),
    marginBottom: nh(12),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.grey333333,
    marginHorizontal: nw(8),
  },
  clearButton: {
    padding: nw(4),
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  filterButton: {
    position: 'relative',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.blue043142,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: nw(16),
    height: nw(16),
    borderRadius: nw(8),
    backgroundColor: COLORS.redEA4335,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(8),
    // maxWidth: nw(20), // Fixed small width
  },

  // Center States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(40),
  },
  centerTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
    textAlign: 'center',
  },
  centerDescription: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: nh(24),
  },
  centerText: {
    marginTop: nh(12),
  },
  centerButton: {
    paddingHorizontal: nw(24),
  },

  // Results
  resultsContainer: {
    flex: 1,
    padding: nw(16),
  },
  resultsHeader: {
    marginBottom: nh(16),
  },
  resultsList: {
    paddingBottom: nh(20),
  },
  resultSeparator: {
    height: nh(12),
  },
  resultCard: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    padding: nw(16),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(8),
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageTypeIcon: {
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  resultInfo: {
    flex: 1,
  },
  resultContent: {
    lineHeight: 20,
    marginBottom: nh(8),
  },
  resultTopics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    flexWrap: 'wrap',
  },
  topicChip: {
    backgroundColor: COLORS.blue043142 + '15',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 8,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    height: 500,
  },
  filterModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: nh(500),
    maxHeight: screenHeight * 0.7,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  filterContent: {
    flex: 1,
    padding: nw(16),
  },
  filterSection: {
    marginBottom: nh(24),
  },
  filterLabel: {
    marginBottom: nh(12),
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    marginBottom: nh(4),
  },
  filterOptionActive: {
    backgroundColor: COLORS.blue043142 + '10',
  },
  filterOptionText: {
    color: COLORS.grey777777,
  },
  filterOptionTextActive: {
    color: COLORS.blue043142,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: nw(12),
    padding: nw(16),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  filterActionButton: {
    flex: 1,
  },
});

export default AIStudyBuddySearch;
