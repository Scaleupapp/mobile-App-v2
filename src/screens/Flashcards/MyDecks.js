// =====================================================
// MY DECKS SCREEN - Fixed with Debug & Error Handling
// File: screens/Flashcards/MyDecks.js
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
  getUserFlashcardDecksApi,
  deleteFlashcardDeckApi,
  updateFlashcardDeckApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const MyDecks = ({navigation}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [decks, setDecks] = useState([]);
  const [filteredDecks, setFilteredDecks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Search timeout ref
  const searchTimeoutRef = useRef(null);

  // Subject options
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
    {value: 'recent', label: 'Most Recent', icon: 'access-time'},
    {value: 'alphabetical', label: 'A-Z', icon: 'sort-by-alpha'},
    {value: 'cards', label: 'Most Cards', icon: 'library-books'},
    {value: 'oldest', label: 'Oldest First', icon: 'history'},
  ];

  // Fetch user's decks with better error handling
  const fetchDecks = useCallback(async (page = 1, isRefresh = false) => {
    try {
      console.log('🔍 Fetching decks - Page:', page, 'Refresh:', isRefresh);
      
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = {
        page,
        limit: 20,
        ...(selectedSubject !== 'all' && {subject: selectedSubject}),
        ...(searchQuery && {search: searchQuery}),
      };
      
      console.log('📡 API Call params:', params);

      const response = await getUserFlashcardDecksApi(params);
      
      console.log('📥 API Response:', {
        success: response?.data?.success,
        decksCount: response?.data?.decks?.length,
        pagination: response?.data?.pagination,
        fullResponse: response?.data
      });

      if (response?.data?.success) {
        const newDecks = response.data.decks || [];
        console.log('✅ Decks received:', newDecks.length);
        
        if (page === 1 || isRefresh) {
          setDecks(newDecks);
          console.log('🔄 Set new decks:', newDecks.length);
        } else {
          setDecks(prev => {
            const updated = [...prev, ...newDecks];
            console.log('➕ Added to existing decks. Total:', updated.length);
            return updated;
          });
        }
        
        const pagination = response.data.pagination;
        if (pagination) {
          setHasMore(pagination.page < pagination.pages);
          setCurrentPage(pagination.page);
          console.log('📄 Pagination:', {
            currentPage: pagination.page,
            totalPages: pagination.pages,
            hasMore: pagination.page < pagination.pages
          });
        } else {
          setHasMore(false);
          console.log('❌ No pagination data');
        }
      } else {
        console.log('❌ API response not successful:', response?.data);
        showToast({
          type: 'error',
          title: 'API returned unsuccessful response'
        });
      }

    } catch (error) {
      console.error('💥 Error fetching decks:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      showToast({
        type: 'error',
        title: 'Failed to load decks',
        message: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedSubject, searchQuery]);

  // Apply local filtering and sorting
  const applyFiltersAndSort = useCallback(() => {
    console.log('🔧 Applying filters and sort to', decks.length, 'decks');
    let filtered = [...decks];

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'cards':
        filtered.sort((a, b) => (b.cardCount || 0) - (a.cardCount || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
    }

    console.log('📊 Filtered and sorted:', filtered.length, 'decks');
    setFilteredDecks(filtered);
  }, [decks, sortBy]);

  // Handle search with debounce
  const handleSearch = useCallback((query) => {
    console.log('🔍 Search query:', query);
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Search timeout triggered, fetching new results');
      setCurrentPage(1);
      setHasMore(true);
    }, 500);
  }, []);

  // Load more decks
  const loadMoreDecks = useCallback(() => {
    if (loadingMore || !hasMore) {
      console.log('⚠️ Skip load more - loading:', loadingMore, 'hasMore:', hasMore);
      return;
    }
    console.log('📄 Loading more decks, current page:', currentPage);
    fetchDecks(currentPage + 1);
  }, [currentPage, hasMore, loadingMore, fetchDecks]);

  // Handle deck options
  const handleDeckOptions = (deck) => {
    console.log('⚙️ Opening options for deck:', deck.title);
    setSelectedDeck(deck);
    setShowOptions(true);
  };

  const handleEditDeck = () => {
    setShowOptions(false);
    console.log('✏️ Edit deck:', selectedDeck?.title);
    navigation.navigate(Routes.CreateDeck, {
      deckId: selectedDeck._id,
      deckData: selectedDeck,
      isEdit: true
    });
  };

  const handleDeleteDeck = () => {
    setShowOptions(false);
    
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${selectedDeck?.title}"? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting deck:', selectedDeck._id);
              await deleteFlashcardDeckApi(selectedDeck._id);
              
              // Remove from local state
              setDecks(prev => prev.filter(deck => deck._id !== selectedDeck._id));
              
              showToast({
                type: 'success',
                title: 'Deck deleted successfully'
              });
            } catch (error) {
              console.error('Error deleting deck:', error);
              showToast({
                type: 'error',
                title: 'Failed to delete deck'
              });
            }
          },
        },
      ]
    );
  };

  const handleTogglePublic = async () => {
    setShowOptions(false);
    
    try {
      console.log('🌐 Toggle public for deck:', selectedDeck?.title);
      const updatedData = {
        isPublic: !selectedDeck.isPublic
      };
      
      await updateFlashcardDeckApi(selectedDeck._id, updatedData);
      
      // Update local state
      setDecks(prev => prev.map(deck => 
        deck._id === selectedDeck._id 
          ? {...deck, isPublic: !deck.isPublic}
          : deck
      ));
      
      showToast({
        type: 'success',
        title: `Deck ${!selectedDeck.isPublic ? 'made public' : 'made private'}`
      });
    } catch (error) {
      console.error('Error toggling deck visibility:', error);
      showToast({
        type: 'error',
        title: 'Failed to update deck visibility'
      });
    }
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Screen focused, fetching decks');
      fetchDecks(1, true);
    }, [fetchDecks])
  );

  useEffect(() => {
    console.log('🎯 Subject filter changed:', selectedSubject);
    fetchDecks(1, true);
  }, [selectedSubject]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      console.log('🔍 Search cleared, fetching all decks');
      fetchDecks(1, true);
    }
  }, [searchQuery, fetchDecks]);

  useEffect(() => {
    console.log('📊 Sort order changed:', sortBy);
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Render search and filters
  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={COLORS.grey999999} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your decks..."
            placeholderTextColor={COLORS.grey999999}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Icon name="clear" size={20} color={COLORS.grey999999} />
            </Pressable>
          )}
        </View>
        
        <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Icon name="tune" size={20} color={COLORS.blue043142} />
        </Pressable>
      </View>

      {/* Quick filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFiltersContainer}>
        {subjectOptions.slice(0, 6).map((subject) => (
          <Pressable
            key={subject.value}
            style={[
              styles.quickFilter,
              selectedSubject === subject.value && styles.quickFilterSelected
            ]}
            onPress={() => setSelectedSubject(subject.value)}>
            <Text 
              variant="medium12" 
              color={selectedSubject === subject.value ? COLORS.whiteFFFFFF : COLORS.blue043142}>
              {subject.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // Render deck card with debug info
  const renderDeckCard = ({item: deck, index}) => {
    console.log(`🎴 Rendering deck ${index}:`, deck.title);
    
    return (
      <Pressable 
        style={styles.deckCard}
        onPress={() => {
          console.log('👆 Deck tapped:', deck.title);
          navigation.navigate(Routes.DeckDetails, {deckId: deck._id});
        }}>
        <View style={styles.deckCardHeader}>
          <View style={styles.deckCardInfo}>
            <Text variant="semibold16" color={COLORS.blue043142} numberOfLines={2}>
              {deck.title}
            </Text>
            <Text variant="medium12" color={COLORS.grey777777} numberOfLines={2} style={styles.deckDescription}>
              {deck.description || 'No description'}
            </Text>
          </View>
          
          <Pressable 
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeckOptions(deck);
            }}>
            <Icon name="more-vert" size={20} color={COLORS.grey777777} />
          </Pressable>
        </View>
        
        <View style={styles.deckCardMeta}>
          <View style={styles.deckMetaItem}>
            <Icon name="style" size={16} color={COLORS.blue043142} />
            <Text variant="medium12" color={COLORS.blue043142}>
              {deck.cardCount || 0} cards
            </Text>
          </View>
          
          <View style={styles.deckMetaItem}>
            <Icon name="category" size={16} color={COLORS.grey777777} />
            <Text variant="medium12" color={COLORS.grey777777}>
              {deck.subject?.charAt(0).toUpperCase() + deck.subject?.slice(1) || 'General'}
            </Text>
          </View>
          
          {deck.isPublic && (
            <View style={styles.deckMetaItem}>
              <Icon name="public" size={16} color={COLORS.green34A853} />
              <Text variant="medium12" color={COLORS.green34A853}>
                Public
              </Text>
            </View>
          )}
        </View>
        
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
                +{deck.tags.length - 3}
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.deckCardFooter}>
          <Text variant="medium11" color={COLORS.grey999999}>
            Updated {formatRelativeTime(deck.updatedAt)}
          </Text>
          
          <View style={styles.deckActions}>
            <Pressable 
              style={styles.quickAction}
              onPress={(e) => {
                e.stopPropagation();
                console.log('📚 Study button tapped for:', deck.title);
                navigation.navigate(Routes.FlashcardViewer, {
                  deckId: deck._id,
                  studyMode: true
                });
              }}>
              <Icon name="school" size={16} color={COLORS.green34A853} />
              <Text variant="medium11" color={COLORS.green34A853}>
                Study
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

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
            <View style={styles.filterOptionsGrid}>
              {subjectOptions.map((subject) => (
                <Pressable
                  key={subject.value}
                  style={[
                    styles.filterOption,
                    selectedSubject === subject.value && styles.filterOptionSelected
                  ]}
                  onPress={() => setSelectedSubject(subject.value)}>
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
            </View>
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
                  onPress={() => setSortBy(sort.value)}>
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
          
          <Button
            text="Apply Filters"
            onPress={() => setShowFilters(false)}
            style={styles.applyFiltersButton}
          />
        </View>
      </View>
    </Modal>
  );

  // Render deck options modal
  const renderDeckOptionsModal = () => (
    <Modal
      visible={showOptions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowOptions(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.optionsModal}>
          <View style={styles.optionsHeader}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              {selectedDeck?.title}
            </Text>
            <Pressable onPress={() => setShowOptions(false)}>
              <Icon name="close" size={20} color={COLORS.grey777777} />
            </Pressable>
          </View>
          
          <Pressable style={styles.optionItem} onPress={handleEditDeck}>
            <Icon name="edit" size={20} color={COLORS.blue043142} />
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Edit Deck
            </Text>
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={handleTogglePublic}>
            <Icon 
              name={selectedDeck?.isPublic ? 'lock' : 'public'} 
              size={20} 
              color={COLORS.blue043142} 
            />
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Make {selectedDeck?.isPublic ? 'Private' : 'Public'}
            </Text>
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => {
            setShowOptions(false);
            navigation.navigate(Routes.UploadDocument, {
              deckId: selectedDeck._id,
              deckTitle: selectedDeck.title
            });
          }}>
            <Icon name="cloud-upload" size={20} color={COLORS.blue043142} />
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Add from Document
            </Text>
          </Pressable>
          
          <Pressable style={[styles.optionItem, styles.dangerOption]} onPress={handleDeleteDeck}>
            <Icon name="delete" size={20} color={COLORS.redEA4335} />
            <Text variant="medium14" color={COLORS.redEA4335} style={styles.optionText}>
              Delete Deck
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // Helper functions
  const formatRelativeTime = (date) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Debug info in loading state
  if (loading && !refreshing) {
    console.log('🔄 Showing loading state');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="My Decks" 
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
          rightIcon={true}
          rightIconName="add"
          onRightIconPress={() => navigation.navigate(Routes.CreateDeck)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading your decks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🖼️ Rendering main view with', filteredDecks.length, 'decks');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="My Decks" 
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightIcon={true}
        rightIconName="add"
        onRightIconPress={() => navigation.navigate(Routes.CreateDeck)}
      />

      <View style={styles.content}>
        {renderSearchAndFilters()}
        
        <FlatList
          data={filteredDecks}
          renderItem={renderDeckCard}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDecks(1, true)}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }
          onEndReached={loadMoreDecks}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={() => {
            console.log('📭 Showing empty state');
            return (
              <View style={styles.emptyContainer}>
                <Icon name="style" size={64} color={COLORS.greyBBBBBB} />
                <Text variant="medium18" color={COLORS.grey777777} style={styles.emptyTitle}>
                  {searchQuery || selectedSubject !== 'all' ? 'No decks found' : 'No decks yet'}
                </Text>
                <Text variant="medium12" color={COLORS.grey999999} style={styles.emptyDescription}>
                  {searchQuery || selectedSubject !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first flashcard deck to get started'
                  }
                </Text>
                {(!searchQuery && selectedSubject === 'all') && (
                  <Button
                    text="Create Your First Deck"
                    onPress={() => navigation.navigate(Routes.CreateDeck)}
                    style={styles.createFirstButton}
                    icon="add"
                    iconColor={COLORS.whiteFFFFFF}
                  />
                )}
              </View>
            );
          }}
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
            filteredDecks.length === 0 && styles.listContainerEmpty
          ]}
        />
      </View>

      {renderFiltersModal()}
      {renderDeckOptionsModal()}
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
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
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
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(8),
    padding: nw(8),
  },
  quickFiltersContainer: {
    paddingRight: nw(16),
  },
  quickFilter: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    backgroundColor: COLORS.greyF8F8F8,
    marginRight: nw(8),
  },
  quickFilterSelected: {
    backgroundColor: COLORS.blue043142,
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
    marginRight: nw(12),
  },
  deckDescription: {
    marginTop: nh(4),
  },
  optionsButton: {
    padding: nw(4),
  },
  deckCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  deckMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(16),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(8),
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
  deckActions: {
    flexDirection: 'row',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(60),
  },
  emptyTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptyDescription: {
    textAlign: 'center',
    paddingHorizontal: nw(32),
    marginBottom: nh(24),
  },
  createFirstButton: {
    width: nw(200),
  },
  
  // Loading More
  loadingMoreContainer: {
    paddingVertical: nh(16),
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: nh(8),
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(20),
    width: nw(320),
    maxHeight: nh(500),
    elevation: 8,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  optionsModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(16),
    width: nw(280),
    elevation: 8,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(12),
    paddingBottom: nh(8),
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
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -nw(4),
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    backgroundColor: COLORS.greyF8F8F8,
    marginHorizontal: nw(4),
    marginBottom: nh(8),
  },
  filterOptionSelected: {
    backgroundColor: COLORS.blue043142,
  },
  filterOptionText: {
    marginLeft: nw(6),
  },
  sortOptionsContainer: {},
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
  applyFiltersButton: {
    marginTop: nh(8),
  },
  
  // Options Modal
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    paddingHorizontal: nw(8),
  },
  optionText: {
    marginLeft: nw(12),
    flex: 1,
  },
  dangerOption: {
    marginTop: nh(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    paddingTop: nh(16),
  },
});

export default MyDecks;