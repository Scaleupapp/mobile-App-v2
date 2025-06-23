// =====================================================
// ENHANCED DECK DETAILS SCREEN - Complete with Study Summary
// File: screens/Flashcards/DeckDetails.js
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
  Share,
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
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  getFlashcardDeckDetailsApi,
  deleteFlashcardDeckApi,
  getFlashcardStudyStatsApi,
  exportFlashcardDeckApi,
  deleteFlashcardApi, 
  updateFlashcardDeckApi,
  getDueCardsCountApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const {width: screenWidth} = Dimensions.get('window');

const DeckDetails = ({navigation, route}) => {
  const {deckId, isNewDeck, fromUpload} = route.params;
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // State management
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [studyStats, setStudyStats] = useState(null);
  const [dueCardsInfo, setDueCardsInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Animation
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch deck details
  const fetchDeckDetails = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await getFlashcardDeckDetailsApi(deckId, {
        page,
        limit: 20,
      });

      if (response?.data?.success) {
        setDeck(response.data.deck);
        
        if (page === 1 || isRefresh) {
          setCards(response.data.cards || []);
        } else {
          setCards(prev => [...prev, ...(response.data.cards || [])]);
        }
        
        setHasMore(response.data.cards?.length === 20);
        setCurrentPage(page);

        // Fetch additional data if user owns the deck
        if (response.data.deck?.userId === userData?.id || response.data.deck?.userId?._id === userData?.id) {
          try {
            // Fetch study stats
            const statsResponse = await getFlashcardStudyStatsApi(deckId);
            if (statsResponse?.data?.success) {
              setStudyStats(statsResponse.data.stats);
            }

            // Fetch due cards info
            const dueCardsResponse = await getDueCardsCountApi(deckId);
            if (dueCardsResponse?.data?.success) {
              setDueCardsInfo(dueCardsResponse.data.data);
            }
          } catch (error) {
            console.log('Additional data fetch error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Deck details fetch error:', error);
      showToast('Failed to load deck details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [deckId, userData?.id, showToast]);

  // Show celebration for new decks
  useEffect(() => {
    if (isNewDeck && fromUpload) {
      setShowCelebration(true);
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCelebration(false));
    }

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isNewDeck, fromUpload, celebrationAnim, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchDeckDetails();
    }, [fetchDeckDetails])
  );

  // Navigation handlers
  const handleStartStudy = (sessionType = 'mixed') => {
    if (cards.length === 0) {
      showToast('No cards available to study', 'info');
      return;
    }
    
    navigation.navigate(Routes.FlashcardViewer, {
      deckId,
      cardIndex: 0,
      studyMode: true,
      sessionType,
    });
  };

  const handleCramMode = () => {
    navigation.navigate(Routes.CramMode, {
      deckId,
      deckTitle: deck?.title,
    });
  };

  const handleAnalytics = () => {
    navigation.navigate(Routes.FlashcardAnalytics, {
      deckId,
      deckTitle: deck?.title,
    });
  };

  const handleAddCards = () => {
    navigation.navigate(Routes.UploadDocument, {
      deckId: deck._id,
      deckTitle: deck.title,
    });
  };

  const handleViewCard = (card, index) => {
    navigation.navigate(Routes.FlashcardViewer, {
      deckId: deck._id,
      cardIndex: index,
      studyMode: false,
    });
  };

  // Study Summary handlers
  const handleQuickSummary = () => {
    navigation.navigate(Routes.StudySummary, {
      deckId: deck._id,
      deckTitle: deck.title,
      summaryType: 'quick',
      timeAvailable: 15
    });
  };
  
  const handleFormulaSummary = () => {
    navigation.navigate(Routes.StudySummary, {
      deckId: deck._id,
      deckTitle: deck.title,
      summaryType: 'formula'
    });
  };
  
  const handleComprehensiveSummary = () => {
    navigation.navigate(Routes.StudySummary, {
      deckId: deck._id,
      deckTitle: deck.title,
      summaryType: 'comprehensive'
    });
  };

  const handleAISummary = () => {
    navigation.navigate(Routes.StudySummary, {
      deckId: deck._id,
      deckTitle: deck.title,
      summaryType: 'generated'
    });
  };

  const handleEditCard = (card) => {
    navigation.navigate(Routes.AddEditCard, {
      deckId: deck._id,
      cardId: card._id,
      cardData: card,
      isEdit: true
    });
  };

  // Deck management handlers
  const handleEditDeck = () => {
    navigation.navigate(Routes.CreateDeck, {
      isEdit: true,
      deckId: deck._id,
      deckData: {
        title: deck.title,
        description: deck.description,
        subject: deck.subject,
        subjectDetails: deck.subjectDetails,
        tags: deck.tags || [],
        isPublic: deck.isPublic || false
      }
    });
  };

  const handleDeleteCard = (card) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFlashcardApi(card._id);
              
              const updatedCards = cards.filter(c => c._id !== card._id);
              setCards(updatedCards);
              
              setDeck(prev => ({
                ...prev,
                cardCount: (prev.cardCount || 0) - 1
              }));
              
              showToast('Card deleted successfully', 'success');
            } catch (error) {
              showToast('Failed to delete card', 'error');
            }
          },
        },
      ]
    );
  };

  const loadMoreCards = () => {
    if (hasMore && !loadingMore) {
      fetchDeckDetails(currentPage + 1);
    }
  };

  const handleShareDeck = async () => {
    try {
      const result = await Share.share({
        message: `Check out this flashcard deck: "${deck?.title}" on StudyApp!\n\n${deck?.cardCount || 0} cards on ${deck?.subject || 'various topics'}`,
        title: deck?.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleExportDeck = async () => {
    try {
      setLoading(true);
      const response = await exportFlashcardDeckApi(deckId);
      
      if (response?.data?.success) {
        showToast('Deck exported successfully!', 'success');
        console.log('Export data:', response.data.data);
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export deck', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = () => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck?.title}"? This will permanently delete all ${deck?.cardCount || 0} cards in this deck. This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteFlashcardDeckApi(deckId);
              
              showToast('Deck deleted successfully', 'success');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting deck:', error);
              showToast('Failed to delete deck', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddCard = () => {
    navigation.navigate(Routes.AddEditCard, {
      deckId: deck._id,
      isEdit: false,
      deckTitle: deck.title
    });
  };

  // Render deck header
  const renderDeckHeader = () => (
    <Animated.View style={[styles.headerContainer, {opacity: fadeAnim}]}>
      <View style={styles.deckBasicInfo}>
        <View style={styles.deckIconContainer}>
          <Icon name="style" size={32} color={COLORS.blue043142} />
        </View>
        
        <View style={styles.deckTitleContainer}>
          <Text variant="semibold20" color={COLORS.blue043142} style={styles.deckTitle}>
            {deck?.title}
          </Text>
          
          <View style={styles.deckMetaRow}>
            <View style={styles.metaChip}>
              <Icon name="category" size={14} color={COLORS.grey777777} />
              <Text variant="medium12" color={COLORS.grey777777} style={styles.metaText}>
                {deck?.subject?.charAt(0).toUpperCase() + deck?.subject?.slice(1) || 'General'}
              </Text>
            </View>
            
            <View style={styles.metaChip}>
              <Icon name="style" size={14} color={COLORS.grey777777} />
              <Text variant="medium12" color={COLORS.grey777777} style={styles.metaText}>
                {deck?.cardCount || 0} cards
              </Text>
            </View>
            
            {deck?.isPublic && (
              <View style={[styles.metaChip, styles.publicChip]}>
                <Icon name="public" size={14} color={COLORS.green34A853} />
                <Text variant="medium12" color={COLORS.green34A853} style={styles.metaText}>
                  Public
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {deck?.description && (
        <View style={styles.descriptionContainer}>
          <Text variant="medium14" color={COLORS.grey777777} style={styles.deckDescription}>
            {deck.description}
          </Text>
        </View>
      )}
      
      {deck?.tags && deck.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {deck.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text variant="medium11" color={COLORS.blue043142}>
                #{tag}
              </Text>
            </View>
          ))}
          {deck.tags.length > 4 && (
            <Text variant="medium11" color={COLORS.grey777777} style={styles.moreTagsText}>
              +{deck.tags.length - 4} more
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );

  // Render study stats
  const renderStudyStats = () => {
    if (!studyStats && !dueCardsInfo) return null;

    return (
      <Animated.View style={[styles.statsContainer, {opacity: fadeAnim}]}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          Your Progress
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, {backgroundColor: COLORS.blue043142 + '15'}]}>
              <Icon name="school" size={20} color={COLORS.blue043142} />
            </View>
            <Text variant="bold18" color={COLORS.blue043142} style={styles.statNumber}>
              {studyStats?.totalCardsStudied || dueCardsInfo?.totalCards || 0}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777} style={styles.statLabel}>
              {studyStats ? 'Cards Studied' : 'Total Cards'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, {backgroundColor: COLORS.green34A853 + '15'}]}>
              <Icon name="trending-up" size={20} color={COLORS.green34A853} />
            </View>
            <Text variant="bold18" color={COLORS.green34A853} style={styles.statNumber}>
              {studyStats ? `${Math.round(studyStats.averageAccuracy || 0)}%` : dueCardsInfo?.dueCards || 0}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777} style={styles.statLabel}>
              {studyStats ? 'Accuracy' : 'Due Cards'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, {backgroundColor: COLORS.yellowF5BE00 + '15'}]}>
              <Icon name="local-fire-department" size={20} color={COLORS.yellowF5BE00} />
            </View>
            <Text variant="bold18" color={COLORS.yellowF5BE00} style={styles.statNumber}>
              {studyStats?.currentStreak || dueCardsInfo?.newCards || 0}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777} style={styles.statLabel}>
              {studyStats ? 'Day Streak' : 'New Cards'}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, {backgroundColor: COLORS.redEA4335 + '15'}]}>
              <Icon name="schedule" size={20} color={COLORS.redEA4335} />
            </View>
            <Text variant="bold18" color={COLORS.redEA4335} style={styles.statNumber}>
              {studyStats ? `${Math.round(studyStats.totalStudyTime || 0)}m` : `${Math.round((dueCardsInfo?.masteryProgress || 0) * 100)}%`}
            </Text>
            <Text variant="medium11" color={COLORS.grey777777} style={styles.statLabel}>
              {studyStats ? 'Study Time' : 'Mastered'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => (
    <Animated.View style={[styles.actionsContainer, {opacity: fadeAnim}]}>
      <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
        Study Options
      </Text>
      
      {/* Primary Actions */}
      <View style={styles.primaryActionsRow}>
        <Pressable 
          style={[styles.primaryActionButton, styles.studyButton]}
          onPress={() => handleStartStudy('mixed')}>
          <Icon name="school" size={24} color={COLORS.whiteFFFFFF} />
          <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={styles.actionButtonText}>
            Start Studying
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.primaryActionButton, styles.cramButton]}
          onPress={handleCramMode}>
          <Icon name="flash-on" size={24} color={COLORS.whiteFFFFFF} />
          <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={styles.actionButtonText}>
            Cram Mode
          </Text>
        </Pressable>
      </View>
      
      {/* Study Summary Actions */}
      <View style={styles.summaryActionsContainer}>
        <Text variant="medium14" color={COLORS.grey777777} style={styles.summaryTitle}>
          Study Summaries
        </Text>
        <View style={styles.summaryActionsRow}>
          <Pressable style={styles.summaryActionButton} onPress={handleQuickSummary}>
            <Icon name="flash-on" size={18} color={COLORS.yellowF5BE00} />
            <Text variant="medium11" color={COLORS.blue043142} style={styles.summaryActionText}>
              Quick Review
            </Text>
            <Text variant="medium9" color={COLORS.grey777777} style={styles.summaryActionSubtext}>
              15 min
            </Text>
          </Pressable>
          
          <Pressable style={styles.summaryActionButton} onPress={handleFormulaSummary}>
            <Icon name="functions" size={18} color={COLORS.blue043142} />
            <Text variant="medium11" color={COLORS.blue043142} style={styles.summaryActionText}>
              Formulas
            </Text>
            <Text variant="medium9" color={COLORS.grey777777} style={styles.summaryActionSubtext}>
              Key concepts
            </Text>
          </Pressable>
          
          <Pressable style={styles.summaryActionButton} onPress={handleComprehensiveSummary}>
            <Icon name="menu-book" size={18} color={COLORS.green34A853} />
            <Text variant="medium11" color={COLORS.blue043142} style={styles.summaryActionText}>
              Complete
            </Text>
            <Text variant="medium9" color={COLORS.grey777777} style={styles.summaryActionSubtext}>
              Full guide
            </Text>
          </Pressable>
          
          <Pressable style={styles.summaryActionButton} onPress={handleAISummary}>
            <Icon name="auto-awesome" size={18} color={COLORS.redEA4335} />
            <Text variant="medium11" color={COLORS.blue043142} style={styles.summaryActionText}>
              AI Summary
            </Text>
            <Text variant="medium9" color={COLORS.grey777777} style={styles.summaryActionSubtext}>
              Custom
            </Text>
          </Pressable>
        </View>
      </View>
      
      {/* Secondary Actions */}
      <View style={styles.secondaryActionsRow}>
        
        
        <Pressable style={styles.secondaryActionButton} onPress={() => handleStartStudy('review')}>
          <Icon name="refresh" size={18} color={COLORS.blue043142} />
          <Text variant="medium12" color={COLORS.blue043142} style={styles.secondaryActionText}>
            Review
          </Text>
        </Pressable>
        
        <Pressable style={styles.secondaryActionButton} onPress={handleAnalytics}>
          <Icon name="analytics" size={18} color={COLORS.blue043142} />
          <Text variant="medium12" color={COLORS.blue043142} style={styles.secondaryActionText}>
            Analytics
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  // Render card item
  const renderCard = ({item, index}) => (
    <Pressable 
      style={styles.cardItem}
      onPress={() => handleViewCard(item, index)}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIndexContainer}>
            <Text variant="medium11" color={COLORS.whiteFFFFFF}>
              {index + 1}
            </Text>
          </View>
          
          <View style={styles.cardTextContainer}>
            <Text variant="medium14" color={COLORS.blue043142} numberOfLines={2} style={styles.cardQuestion}>
              {item.question}
            </Text>
            <Text variant="medium12" color={COLORS.grey777777} numberOfLines={1} style={styles.cardAnswer}>
              {item.answer}
            </Text>
          </View>
          
          <View style={styles.cardMeta}>
            {item.difficulty && (
              <View style={[
                styles.difficultyBadge,
                item.difficulty === 'easy' && styles.difficultyEasy,
                item.difficulty === 'medium' && styles.difficultyMedium,
                item.difficulty === 'hard' && styles.difficultyHard,
              ]}>
                <Text variant="medium9" color={COLORS.whiteFFFFFF}>
                  {item.difficulty.toUpperCase()}
                </Text>
              </View>
            )}
            
            {(deck?.userId === userData?.id || deck?.userId?._id === userData?.id) && (
              <View style={styles.cardActions}>
                <Pressable 
                  onPress={() => handleEditCard(item)}
                  style={styles.cardActionButton}>
                  <Icon name="edit" size={16} color={COLORS.blue043142} />
                </Pressable>
                <Pressable 
                  onPress={() => handleDeleteCard(item)}
                  style={styles.cardActionButton}>
                  <Icon name="delete" size={16} color={COLORS.redEA4335} />
                </Pressable>
              </View>
            )}
            
            {item.studyMetrics?.timesReviewed > 0 && (
              <View style={styles.progressDot}>
                <View style={[
                  styles.progressIndicator,
                  {backgroundColor: item.studyMetrics.correctAnswers > item.studyMetrics.incorrectAnswers 
                    ? COLORS.green34A853 
                    : COLORS.yellowF5BE00
                  }
                ]} />
              </View>
            )}
            
            <View style={styles.cardActionHint}>
              <Icon name="visibility" size={14} color={COLORS.grey999999} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );

  // Render cards list
  const renderCardsList = () => (
    <Animated.View style={[styles.cardsContainer, {opacity: fadeAnim}]}>
      <View style={styles.cardsHeader}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          Flashcards ({cards.length})
        </Text>
        
        {(deck?.userId === userData?.id || deck?.userId?._id === userData?.id) && (
          <View style={styles.cardsHeaderActions}>
            <Pressable onPress={handleAddCard} style={styles.addCardButton}>
              <Icon name="add" size={20} color={COLORS.blue043142} />
              <Text variant="medium12" color={COLORS.blue043142} style={styles.addCardText}>
                Add Card
              </Text>
            </Pressable>
            
            <Pressable onPress={handleAddCards} style={styles.addCardsButton}>
              <Icon name="upload-file" size={20} color={COLORS.blue043142} />
              <Text variant="medium12" color={COLORS.blue043142} style={styles.addCardsText}>
                Upload
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      
      {cards.length > 0 ? (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item, index) => item._id || index.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          onEndReached={loadMoreCards}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.blue043142} />
                <Text variant="medium12" color={COLORS.grey777777} style={styles.loadingText}>
                  Loading more cards...
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyCards}>
          <Icon name="style" size={48} color={COLORS.greyBBBBBB} />
          <Text variant="medium16" color={COLORS.grey777777} style={styles.emptyTitle}>
            No cards in this deck yet
          </Text>
          <Text variant="medium12" color={COLORS.grey999999} style={styles.emptyDescription}>
            Add your first flashcard to start studying
          </Text>
          {(deck?.userId === userData?.id || deck?.userId?._id === userData?.id) && (
            <View style={styles.emptyActions}>
              <Button
                title="Add Card Manually"
                onPress={handleAddCard}
                style={styles.addFirstCardButton}
              />
              <Button
                title="Upload Document"
                onPress={handleAddCards}
                style={[styles.addFirstCardButton, styles.uploadButton]}
                variant="outline"
              />
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );

  // Render deck options
  const renderDeckOptions = () => {
    if (deck?.userId !== userData?.id && deck?.userId?._id !== userData?.id) return null;

    return (
      <Animated.View style={[styles.optionsContainer, {opacity: fadeAnim}]}>
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          Deck Management
        </Text>
        
        <View style={styles.optionsList}>
          <Pressable style={styles.optionItem} onPress={handleEditDeck}>
            <View style={styles.optionIcon}>
              <Icon name="edit" size={18} color={COLORS.blue043142} />
            </View>
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Edit Deck Details
            </Text>
            <Icon name="chevron-right" size={18} color={COLORS.grey999999} />
          </Pressable>

          <Pressable style={styles.optionItem} onPress={handleShareDeck}>
            <View style={styles.optionIcon}>
              <Icon name="share" size={18} color={COLORS.blue043142} />
            </View>
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Share Deck
            </Text>
            <Icon name="chevron-right" size={18} color={COLORS.grey999999} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={handleExportDeck}>
            <View style={styles.optionIcon}>
              <Icon name="download" size={18} color={COLORS.blue043142} />
            </View>
            <Text variant="medium14" color={COLORS.blue043142} style={styles.optionText}>
              Export Deck
            </Text>
            <Icon name="chevron-right" size={18} color={COLORS.grey999999} />
          </Pressable>
          
          <Pressable style={[styles.optionItem, styles.dangerOption]} onPress={handleDeleteDeck}>
            <View style={styles.optionIcon}>
              <Icon name="delete" size={18} color={COLORS.redEA4335} />
            </View>
            <Text variant="medium14" color={COLORS.redEA4335} style={styles.optionText}>
              Delete Deck
            </Text>
            <Icon name="chevron-right" size={18} color={COLORS.grey999999} />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  // Render celebration overlay
  const renderCelebration = () => {
    if (!showCelebration) return null;

    return (
      <Animated.View 
        style={[
          styles.celebrationOverlay,
          {
            opacity: celebrationAnim,
            transform: [{
              scale: celebrationAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
          }
        ]}>
        <View style={styles.celebrationContent}>
          <Icon name="celebration" size={64} color={COLORS.yellowF5BE00} />
          <Text variant="semibold20" color={COLORS.whiteFFFFFF} style={styles.celebrationTitle}>
            Cards Added! 🎉
          </Text>
          <Text variant="medium14" color={COLORS.whiteFFFFFF} style={styles.celebrationText}>
            Your new flashcards are ready to study
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="Deck Details" 
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading deck details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header
        title={deck?.title || 'Deck Details'}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightIcon={(deck?.userId === userData?.id || deck?.userId?._id === userData?.id)}
        rightIconName="more-vert"
        onRightIconPress={() => setShowOptions(!showOptions)}
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchDeckDetails(1, true)}
                colors={[COLORS.blue043142]}
                tintColor={COLORS.blue043142}
              />
            }>
            
            {renderDeckHeader()}
            {renderStudyStats()}
            {renderActionButtons()}
            {renderCardsList()}
            {renderDeckOptions()}
            
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </View>

      {renderCelebration()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
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
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: nw(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(47),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  loadingText: {
    marginTop: nh(16),
  },
  
  // Header Styles
  headerContainer: {
    paddingVertical: nh(24),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  deckBasicInfo: {
    flexDirection: 'row',
    marginBottom: nh(16),
  },
  deckIconContainer: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  deckTitleContainer: {
    flex: 1,
  },
  deckTitle: {
    marginBottom: nh(8),
    lineHeight: nh(24),
  },
  deckMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(12),
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    marginRight: nw(8),
    marginBottom: nh(4),
  },
  publicChip: {
    backgroundColor: COLORS.green34A853 + '15',
  },
  metaText: {
    marginLeft: nw(4),
  },
  descriptionContainer: {
    marginBottom: nh(16),
  },
  deckDescription: {
    lineHeight: nh(20),
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: nw(12),
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    marginRight: nw(8),
    marginBottom: nh(4),
  },
  moreTagsText: {
    marginLeft: nw(4),
  },
  
  // Stats Styles
  statsContainer: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(16),
    padding: nw(20),
    marginVertical: nh(16),
  },
  sectionTitle: {
    marginBottom: nh(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  statNumber: {
    marginBottom: nh(4),
  },
  statLabel: {
    textAlign: 'center',
  },
  
  // Actions Styles
  actionsContainer: {
    marginBottom: nh(24),
  },
  primaryActionsRow: {
    flexDirection: 'row',
    marginBottom: nh(16),
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(16),
    borderRadius: nw(12),
    marginHorizontal: nw(4),
  },
  studyButton: {
    backgroundColor: COLORS.blue043142,
  },
  cramButton: {
    backgroundColor: COLORS.redEA4335,
  },
  actionButtonText: {
    marginLeft: nw(8),
  },
  
  // Summary Actions
  summaryActionsContainer: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(16),
  },
  summaryTitle: {
    marginBottom: nh(12),
  },
  summaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    marginHorizontal: nw(2),
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryActionText: {
    marginTop: nh(4),
    marginBottom: nh(2),
    textAlign: 'center',
  },
  summaryActionSubtext: {
    textAlign: 'center',
  },
  
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: nh(12),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(8),
    marginHorizontal: nw(4),
  },
  secondaryActionText: {
    marginTop: nh(4),
  },
  
  // Cards Styles
  cardsContainer: {
    marginBottom: nh(24),
  },
  cardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  cardsHeaderActions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '10',
    borderRadius: nw(20),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
  },
  addCardText: {
    marginLeft: nw(4),
  },
  addCardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '20',
    borderRadius: nw(20),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
  },
  addCardsText: {
    marginLeft: nw(4),
  },
  cardItem: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    elevation: 1,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    padding: nw(16),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIndexContainer: {
    width: nw(24),
    height: nw(24),
    borderRadius: nw(12),
    backgroundColor: COLORS.blue043142,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
    marginTop: nh(2),
  },
  cardTextContainer: {
    flex: 1,
    marginRight: nw(12),
  },
  cardQuestion: {
    marginBottom: nh(4),
    lineHeight: nh(18),
  },
  cardAnswer: {
    lineHeight: nh(16),
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    borderRadius: nw(8),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    marginBottom: nh(4),
  },
  difficultyEasy: {
    backgroundColor: COLORS.green34A853,
  },
  difficultyMedium: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  difficultyHard: {
    backgroundColor: COLORS.redEA4335,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(4),
  },
  cardActionButton: {
    padding: nw(6),
    marginLeft: nw(4),
    borderRadius: nw(4),
    backgroundColor: COLORS.greyF8F8F8,
  },
  progressDot: {
    marginTop: nh(4),
  },
  progressIndicator: {
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
  },
  cardActionHint: {
    marginTop: nh(4),
  },
  cardSeparator: {
    height: nh(12),
  },
  emptyCards: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: nh(24),
    paddingHorizontal: nw(20),
  },
  emptyActions: {
    gap: nh(12),
    alignItems: 'center',
  },
  addFirstCardButton: {
    marginTop: nh(8),
  },
  uploadButton: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: nh(16),
  },
  
  // Options Styles
  optionsContainer: {
    marginBottom: nh(24),
  },
  optionsList: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(12),
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(16),
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  optionIcon: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  optionText: {
    flex: 1,
  },
  dangerOption: {
    borderBottomWidth: 0,
  },
  
  // Celebration Styles
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 49, 66, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  celebrationText: {
    textAlign: 'center',
  },
  bottomSpacing: {
    height: nh(24),
  },
});

export default DeckDetails;