// =====================================================
// BROWSE PUBLIC DECKS - Community Flashcard Discovery
// File: screens/Flashcards/BrowsePublicDecks.js
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  getPublicFlashcardDecksApi,
  searchFlashcardDecksApi,
  getTrendingFlashcardDecksApi,
  getPopularFlashcardSubjectsApi,
  getFlashcardDeckPreviewApi,
  createFlashcardDeckApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const BrowsePublicDecks = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [decks, setDecks] = useState([]);
  const [trendingDecks, setTrendingDecks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [previewDeck, setPreviewDeck] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Search debounce
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Subject options with icons
  const subjectOptions = [
    {value: 'all', label: 'All Subjects', icon: 'apps'},
    {value: 'engineering', label: 'Engineering', icon: 'engineering'},
    {value: 'medical', label: 'Medical', icon: 'medical-services'},
    {value: 'science', label: 'Science', icon: 'science'},
    {value: 'mathematics', label: 'Mathematics', icon: 'calculate'},
    {value: 'business', label: 'Business', icon: 'business'},
    {value: 'languages', label: 'Languages', icon: 'translate'},
    {value: 'competitive_exams', label: 'Competitive Exams', icon: 'quiz'},
    {value: 'history', label: 'History', icon: 'history-edu'},
    {value: 'general', label: 'General', icon: 'school'},
  ];

  // Sort options
  const sortOptions = [
    {value: 'popular', label: 'Most Popular', icon: 'trending-up'},
    {value: 'newest', label: 'Newest', icon: 'new-releases'},
    {value: 'cards', label: 'Most Cards', icon: 'library-books'},
  ];

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parallel fetch for better performance
      const [decksResponse, trendingResponse, subjectsResponse] = await Promise.all([
        getPublicFlashcardDecksApi({
          subject: selectedSubject !== 'all' ? selectedSubject : undefined,
          page: 1,
          limit: 10,
          sortBy,
          search: searchQuery || undefined,
        }),
        getTrendingFlashcardDecksApi(),
        getPopularFlashcardSubjectsApi(),
      ]);

      if (decksResponse?.data?.success) {
        setDecks(decksResponse.data.decks || []);
        setHasMore(decksResponse.data.pagination?.page < decksResponse.data.pagination?.pages);
        setCurrentPage(1);
      }

      if (trendingResponse?.data?.success) {
        setTrendingDecks(trendingResponse.data.trending || []);
      }

      if (subjectsResponse?.data?.success) {
        setSubjects(subjectsResponse.data.subjects || []);
      }

    } catch (error) {
      console.error('Error fetching public decks:', error);
      showToast({
        type: 'error',
        title: 'Failed to load decks',
        message: 'Please check your internet connection'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, sortBy, searchQuery]);

  // Load more decks (pagination)
  const loadMoreDecks = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      
      const response = await getPublicFlashcardDecksApi({
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        page: nextPage,
        limit: 10,
        sortBy,
        search: searchQuery || undefined,
      });

      if (response?.data?.success) {
        const newDecks = response.data.decks || [];
        setDecks(prev => [...prev, ...newDecks]);
        setCurrentPage(nextPage);
        setHasMore(response.data.pagination?.page < response.data.pagination?.pages);
      }
    } catch (error) {
      console.error('Error loading more decks:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, selectedSubject, sortBy, searchQuery]);

  // Handle search with debounce
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
    }, 500);
  }, []);

  // Handle filter changes
  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setCurrentPage(1);
    setHasMore(true);
    setShowFilters(false);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
    setHasMore(true);
    setShowFilters(false);
  };

  // Deck preview functionality
  const handleDeckPreview = async (deck) => {
    try {
      setPreviewLoading(true);
      const response = await getFlashcardDeckPreviewApi(deck._id);
      
      if (response?.data?.success) {
        setPreviewDeck({
          ...deck,
          sampleCards: response.data.sampleCards || [],
          requiresAuth: response.data.requiresAuth || false,
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching deck preview:', error);
      showToast({
        type: 'error',
        title: 'Preview not available'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Copy deck functionality
  const handleCopyDeck = async (deck) => {
    try {
      Alert.alert(
        'Copy Deck',
        `Copy "${deck.title}" to your collection? This will create a personal copy you can edit.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Copy Deck',
            onPress: async () => {
              try {
                const copyData = {
                  title: `${deck.title} (Copy)`,
                  description: deck.description,
                  subject: deck.subject,
                  tags: deck.tags || [],
                  isPublic: false,
                  originalDeckId: deck._id, // Backend should handle copying cards
                };

                const response = await createFlashcardDeckApi(copyData);
                
                if (response?.data?.success) {
                  showToast({
                    type: 'success',
                    title: 'Deck copied successfully!',
                    message: 'Check your decks to start studying'
                  });
                  
                  // Navigate to the new deck
                  navigation.navigate(Routes.DeckDetails, {
                    deckId: response.data.deck._id,
                    isNewDeck: true
                  });
                }
              } catch (error) {
                showToast({
                  type: 'error',
                  title: 'Failed to copy deck'
                });
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error copying deck:', error);
    }
  };

  // Handle study deck
  const handleStudyDeck = (deck) => {
    navigation.navigate(Routes.FlashcardViewer, {
      deckId: deck._id,
      studyMode: true
    });
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  useEffect(() => {
    fetchInitialData();
  }, [selectedSubject, sortBy]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      fetchInitialData();
    }
  }, [searchQuery, fetchInitialData]);

  // Render trending section
  const renderTrendingSection = () => {
    if (trendingDecks.length === 0) return null;

    return (
      <View style={styles.trendingContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={20} color={COLORS.redEA4335} />
          <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
            Trending This Week
          </Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingScrollContainer}>
          {trendingDecks.map((deck, index) => (
            <Pressable
              key={deck._id || index}
              style={styles.trendingCard}
              onPress={() => handleDeckPreview(deck)}>
              <View style={styles.trendingCardHeader}>
                <View style={[styles.subjectBadge, {backgroundColor: getSubjectColor(deck.subject)}]}>
                  <Text variant="medium10" color={COLORS.whiteFFFFFF}>
                    {deck.subject?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.trendingStats}>
                  <Icon name="visibility" size={12} color={COLORS.grey777777} />
                  <Text variant="medium10" color={COLORS.grey777777} style={styles.statText}>
                    {deck.studyStats?.totalReviews || 0}
                  </Text>
                </View>
              </View>
              
              <Text variant="semibold14" color={COLORS.blue043142} numberOfLines={2}>
                {deck.title}
              </Text>
              
              <Text variant="medium11" color={COLORS.grey777777} numberOfLines={2} style={styles.trendingDescription}>
                {deck.description}
              </Text>
              
              <View style={styles.trendingFooter}>
                <Text variant="medium10" color={COLORS.grey999999}>
                  {deck.cardCount} cards
                </Text>
                <Text variant="medium10" color={COLORS.grey999999}>
                  by {deck.creator?.username || 'Anonymous'}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render search and filters
  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color={COLORS.grey999999} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search decks..."
          placeholderTextColor={COLORS.grey999999}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          onSubmitEditing={() => searchInputRef.current?.blur()}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch('')}>
            <Icon name="clear" size={20} color={COLORS.grey999999} />
          </Pressable>
        )}
      </View>
      
      <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
        <Icon name="tune" size={20} color={COLORS.blue043142} />
        <Text variant="medium12" color={COLORS.blue043142}>
          Filters
        </Text>
      </Pressable>
    </View>
  );

  // Render deck card
  const renderDeckCard = ({item: deck}) => (
    <Pressable style={styles.deckCard} onPress={() => handleDeckPreview(deck)}>
      <View style={styles.deckCardHeader}>
        <View style={styles.deckCardInfo}>
          <View style={[styles.subjectBadge, {backgroundColor: getSubjectColor(deck.subject)}]}>
            <Text variant="medium10" color={COLORS.whiteFFFFFF}>
              {deck.subject?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.deckStats}>
            <View style={styles.statItem}>
              <Icon name="style" size={14} color={COLORS.grey777777} />
              <Text variant="medium11" color={COLORS.grey777777}>
                {deck.cardCount}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="visibility" size={14} color={COLORS.grey777777} />
              <Text variant="medium11" color={COLORS.grey777777}>
                {deck.studyStats?.totalReviews || 0}
              </Text>
            </View>
          </View>
        </View>
        
        <Pressable 
          style={styles.copyButton}
          onPress={() => handleCopyDeck(deck)}>
          <Icon name="content-copy" size={16} color={COLORS.blue043142} />
        </Pressable>
      </View>
      
      <Text variant="semibold16" color={COLORS.blue043142} numberOfLines={2} style={styles.deckTitle}>
        {deck.title}
      </Text>
      
      <Text variant="medium12" color={COLORS.grey777777} numberOfLines={3} style={styles.deckDescription}>
        {deck.description}
      </Text>
      
      {deck.tags && deck.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {deck.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text variant="medium10" color={COLORS.grey777777}>
                #{tag}
              </Text>
            </View>
          ))}
          {deck.tags.length > 3 && (
            <Text variant="medium10" color={COLORS.grey999999}>
              +{deck.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.deckCardFooter}>
        <View style={styles.creatorInfo}>
          <Icon name="person" size={14} color={COLORS.grey777777} />
          <Text variant="medium11" color={COLORS.grey777777}>
            {deck.creator?.username || 'Anonymous'}
          </Text>
        </View>
        
        <View style={styles.deckActions}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => handleStudyDeck(deck)}>
            <Icon name="school" size={16} color={COLORS.green34A853} />
            <Text variant="medium11" color={COLORS.green34A853}>
              Study
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  // Render filters modal
  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filtersModal}>
          <View style={styles.modalHeader}>
            <Text variant="semibold18" color={COLORS.blue043142}>
              Filter & Sort
            </Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color={COLORS.grey777777} />
            </Pressable>
          </View>
          
          {/* Subject Filter */}
          <View style={styles.filterSection}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.filterSectionTitle}>
              Subject
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterOptionsContainer}>
              {subjectOptions.map((subject) => (
                <Pressable
                  key={subject.value}
                  style={[
                    styles.filterOption,
                    selectedSubject === subject.value && styles.filterOptionSelected
                  ]}
                  onPress={() => handleSubjectChange(subject.value)}>
                  <Icon 
                    name={subject.icon} 
                    size={16} 
                    color={selectedSubject === subject.value ? COLORS.whiteFFFFFF : COLORS.grey777777} 
                  />
                  <Text 
                    variant="medium12" 
                    color={selectedSubject === subject.value ? COLORS.whiteFFFFFF : COLORS.grey777777}
                    style={styles.filterOptionText}>
                    {subject.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          
          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.filterSectionTitle}>
              Sort By
            </Text>
            <View style={styles.sortOptionsContainer}>
              {sortOptions.map((sort) => (
                <Pressable
                  key={sort.value}
                  style={[
                    styles.sortOption,
                    sortBy === sort.value && styles.sortOptionSelected
                  ]}
                  onPress={() => handleSortChange(sort.value)}>
                  <Icon 
                    name={sort.icon} 
                    size={16} 
                    color={sortBy === sort.value ? COLORS.blue043142 : COLORS.grey777777} 
                  />
                  <Text 
                    variant="medium12" 
                    color={sortBy === sort.value ? COLORS.blue043142 : COLORS.grey777777}
                    style={styles.sortOptionText}>
                    {sort.label}
                  </Text>
                  {sortBy === sort.value && (
                    <Icon name="check" size={16} color={COLORS.blue043142} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render deck preview modal
  const renderDeckPreviewModal = () => (
    <Modal
      visible={showPreview}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPreview(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.previewModal}>
          {previewDeck && (
            <>
              <View style={styles.previewHeader}>
                <View style={styles.previewTitleContainer}>
                  <Text variant="semibold18" color={COLORS.blue043142} numberOfLines={2}>
                    {previewDeck.title}
                  </Text>
                  <Text variant="medium12" color={COLORS.grey777777}>
                    by {previewDeck.creator?.username || 'Anonymous'}
                  </Text>
                </View>
                <Pressable onPress={() => setShowPreview(false)}>
                  <Icon name="close" size={24} color={COLORS.grey777777} />
                </Pressable>
              </View>
              
              <Text variant="medium14" color={COLORS.grey777777} style={styles.previewDescription}>
                {previewDeck.description}
              </Text>
              
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Icon name="style" size={16} color={COLORS.blue043142} />
                  <Text variant="medium12" color={COLORS.blue043142}>
                    {previewDeck.cardCount} cards
                  </Text>
                </View>
                <View style={styles.previewStat}>
                  <Icon name="visibility" size={16} color={COLORS.green34A853} />
                  <Text variant="medium12" color={COLORS.green34A853}>
                    {previewDeck.studyStats?.totalReviews || 0} studied
                  </Text>
                </View>
              </View>
              
              {previewDeck.sampleCards && previewDeck.sampleCards.length > 0 && (
                <View style={styles.sampleCardsContainer}>
                  <Text variant="semibold14" color={COLORS.blue043142} style={styles.sampleCardsTitle}>
                    Sample Cards
                  </Text>
                  {previewDeck.sampleCards.map((card, index) => (
                    <View key={index} style={styles.sampleCard}>
                      <Text variant="medium12" color={COLORS.blue043142} style={styles.sampleQuestion}>
                        Q: {card.question}
                      </Text>
                      <View style={styles.sampleCardMeta}>
                        <View style={[
                          styles.difficultyBadge,
                          {backgroundColor: getDifficultyColor(card.difficulty)}
                        ]}>
                          <Text variant="medium10" color={COLORS.whiteFFFFFF}>
                            {card.difficulty || 'Medium'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {previewDeck.requiresAuth && (
                    <Text variant="medium11" color={COLORS.grey777777} style={styles.authRequired}>
                      Sign in to see all {previewDeck.cardCount} cards
                    </Text>
                  )}
                </View>
              )}
              
              <View style={styles.previewActions}>
                <Button
                  text="Study Now"
                  width={nw(120)}
                  height={nh(40)}
                  onPress={() => {
                    setShowPreview(false);
                    handleStudyDeck(previewDeck);
                  }}
                  icon="school"
                  iconColor={COLORS.whiteFFFFFF}
                />
                <Button
                  text="Copy Deck"
                  width={nw(120)}
                  height={nh(40)}
                  backgroundColor={COLORS.whiteFFFFFF}
                  textColor={COLORS.blue043142}
                  borderWidth={1}
                  borderColor={COLORS.blue043142}
                  onPress={() => {
                    setShowPreview(false);
                    handleCopyDeck(previewDeck);
                  }}
                  icon="content-copy"
                  iconColor={COLORS.blue043142}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Helper functions
  const getSubjectColor = (subject) => {
    const colors = {
      engineering: COLORS.blue043142,
      medical: COLORS.redEA4335,
      science: COLORS.green34A853,
      mathematics: COLORS.yellowF5BE00,
      business: COLORS.blue043142,
      languages: COLORS.green34A853,
      competitive_exams: COLORS.redEA4335,
      history: COLORS.yellowF5BE00,
      general: COLORS.grey777777,
    };
    return colors[subject] || COLORS.grey777777;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: COLORS.green34A853,
      medium: COLORS.yellowF5BE00,
      hard: COLORS.redEA4335,
    };
    return colors[difficulty] || COLORS.yellowF5BE00;
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="Browse Decks" 
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading public decks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Browse Decks" 
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightIcon={true}
        rightIconName="search"
        onRightIconPress={() => searchInputRef.current?.focus()}
      />

      <View style={styles.content}>
        {renderSearchAndFilters()}
        
        <FlatList
          data={decks}
          renderItem={renderDeckCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchInitialData().finally(() => setRefreshing(false));
              }}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }
          onEndReached={loadMoreDecks}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderTrendingSection}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={48} color={COLORS.greyBBBBBB} />
              <Text variant="medium16" color={COLORS.grey777777} style={styles.emptyTitle}>
                {searchQuery ? 'No decks found' : 'No public decks available'}
              </Text>
              <Text variant="medium12" color={COLORS.grey999999} style={styles.emptyDescription}>
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Be the first to share a deck with the community!'
                }
              </Text>
            </View>
          )}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.blue043142} />
                <Text variant="medium12" color={COLORS.grey777777} style={styles.loadingMoreText}>
                  Loading more decks...
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.listContainer,
            decks.length === 0 && styles.listContainerEmpty
          ]}
        />
      </View>

      {renderFiltersModal()}
      {renderDeckPreviewModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingText: {
    marginTop: nh(16),
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.greyF8F8F8,
  },
  
  // Search and Filters
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    marginRight: nw(12),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.blue043142,
    marginLeft: nw(8),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  
  // Trending Section
  trendingContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(16),
    marginBottom: nh(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    marginBottom: nh(12),
  },
  sectionTitle: {
    marginLeft: nw(8),
  },
  trendingScrollContainer: {
    paddingLeft: nw(16),
  },
  trendingCard: {
    width: nw(200),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(12),
    marginRight: nw(12),
    elevation: 2,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: nw(4),
  },
  trendingDescription: {
    marginTop: nh(4),
    marginBottom: nh(8),
  },
  trendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(8),
  },
  
  // Deck Cards
  listContainer: {
    padding: nw(16),
  },
  listContainerEmpty: {
    flex: 1,
  },
  deckCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(12),
    elevation: 2,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deckCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(8),
  },
  deckCardInfo: {
    flex: 1,
  },
  deckStats: {
    flexDirection: 'row',
    marginTop: nh(4),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(12),
  },
  copyButton: {
    padding: nw(8),
    borderRadius: nw(8),
    backgroundColor: COLORS.blue043142 + '15',
  },
  deckTitle: {
    marginBottom: nh(4),
  },
  deckDescription: {
    marginBottom: nh(8),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(12),
  },
  tag: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(4),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    marginRight: nw(6),
    marginBottom: nh(4),
  },
  deckCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deckActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
  },
  
  // Badges
  subjectBadge: {
    borderRadius: nw(4),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
  },
  difficultyBadge: {
    borderRadius: nw(4),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filtersModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    paddingTop: nh(20),
    paddingHorizontal: nw(16),
    paddingBottom: nh(32),
    maxHeight: DEVICE_WIDTH * 0.8,
  },
  previewModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    paddingTop: nh(20),
    paddingHorizontal: nw(16),
    paddingBottom: nh(32),
    maxHeight: DEVICE_WIDTH * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(16),
    paddingBottom: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  
  // Filter Modal
  filterSection: {
    marginBottom: nh(20),
  },
  filterSectionTitle: {
    marginBottom: nh(8),
  },
  filterOptionsContainer: {
    paddingRight: nw(16),
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(20),
    backgroundColor: COLORS.greyF8F8F8,
    marginRight: nw(8),
  },
  filterOptionSelected: {
    backgroundColor: COLORS.blue043142,
  },
  filterOptionText: {
    marginLeft: nw(6),
  },
  sortOptionsContainer: {
    // Vertical layout for sort options
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(8),
  },
  sortOptionSelected: {
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: nw(8),
  },
  sortOptionText: {
    marginLeft: nw(12),
    flex: 1,
  },
  
  // Preview Modal
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(12),
  },
  previewTitleContainer: {
    flex: 1,
    marginRight: nw(12),
  },
  previewDescription: {
    marginBottom: nh(12),
  },
  previewStats: {
    flexDirection: 'row',
    marginBottom: nh(16),
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(16),
  },
  sampleCardsContainer: {
    marginBottom: nh(16),
  },
  sampleCardsTitle: {
    marginBottom: nh(8),
  },
  sampleCard: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(8),
    padding: nw(12),
    marginBottom: nh(8),
  },
  sampleQuestion: {
    marginBottom: nh(6),
  },
  sampleCardMeta: {
    flexDirection: 'row',
  },
  authRequired: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: nh(8),
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptyDescription: {
    textAlign: 'center',
    paddingHorizontal: nw(32),
  },
  
  // Loading More
  loadingMoreContainer: {
    paddingVertical: nh(16),
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: nh(8),
  },
});

export default BrowsePublicDecks;