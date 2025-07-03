import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  FlatList,
  Animated,
  Modal,
  Alert,
  Share,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import debounce from 'lodash/debounce';

// Components & Services
import Text from '../../../components/Text';
import { COLORS } from '../../../helper/colors';
import { getLearningVaultApi, toggleFavoriteExplanationApi, addExplanationNoteApi } from '../../../services/apiService';

const { width, height } = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

// Enhanced Stats Card Component with better visual hierarchy
const StatsCard = ({ icon, label, value, color, index }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [value]);

  return (
    <Animated.View 
      style={[
        styles.statsCard, 
        { 
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }
      ]}>
      <View style={[styles.statsIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.statsContent}>
        <Text variant="bold20" color={COLORS.blue043142}>
          {value}
        </Text>
        <Text variant="regular11" color={COLORS.grey777777} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
};

// Enhanced Filter Chip Component
const FilterChip = ({ label, isActive, onPress, icon, count }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={handlePress}
        activeOpacity={0.8}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={14}
            color={isActive ? COLORS.whiteFFFFFF : COLORS.blue043142}
          />
        )}
        <Text
          variant={isActive ? 'semibold13' : 'regular13'}
          color={isActive ? COLORS.whiteFFFFFF : COLORS.blue043142}
          style={{ marginLeft: icon ? 6 : 0 }}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
            <Text variant="semibold11" color={isActive ? COLORS.blue043142 : COLORS.grey777777}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Enhanced Explanation Card Component
const ExplanationCard = ({ item, onToggleFavorite, onAddNote, onShare, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleExpanded = () => {
    setExpanded(!expanded);
    Animated.spring(rotateAnim, {
      toValue: expanded ? 0 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getTimeAgo = (date) => {
    return moment(date).fromNow();
  };

  return (
    <Animated.View 
      style={[
        styles.explanationCard, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}>
      <TouchableOpacity onPress={toggleExpanded} activeOpacity={0.95}>
        {/* Enhanced Header */}
        <View style={styles.cardTopSection}>
          <View style={styles.quizInfoContainer}>
            <View style={styles.quizTitleRow}>
              <MaterialIcons name="school" size={16} color={COLORS.blue043142} />
              <Text variant="semibold13" color={COLORS.blue043142} style={{ marginLeft: 6, flex: 1 }} numberOfLines={1}>
                {item.quizId?.title || 'Practice Quiz'}
              </Text>
            </View>
            <View style={styles.metaInfoRow}>
              <Text variant="regular11" color={COLORS.grey777777}>
                {getTimeAgo(item.createdAt)}
              </Text>
              {item.viewCount > 1 && (
                <>
                  <Text variant="regular11" color={COLORS.grey777777}> • </Text>
                  <View style={styles.viewInfo}>
                    <Ionicons name="eye-outline" size={12} color={COLORS.grey777777} />
                    <Text variant="regular11" color={COLORS.grey777777} style={{ marginLeft: 4 }}>
                      {item.viewCount} views
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.cardActionButtons}>
            <TouchableOpacity
              onPress={() => onShare(item)}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-outline" size={18} color={COLORS.grey777777} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onToggleFavorite(item._id)}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={item.isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={item.isFavorite ? COLORS.yellowF5BE00 : COLORS.grey777777}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Result Badge */}
        <View style={[
          styles.resultBadgeContainer,
          { backgroundColor: item.wasCorrect ? COLORS.greenSuccess + '08' : COLORS.redError + '08' }
        ]}>
          <View style={[
            styles.resultBadge,
            { backgroundColor: item.wasCorrect ? COLORS.greenSuccess + '15' : COLORS.redError + '15' }
          ]}>
            <Ionicons
              name={item.wasCorrect ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.wasCorrect ? COLORS.greenSuccess : COLORS.redError}
            />
            <Text
              variant="semibold12"
              color={item.wasCorrect ? COLORS.greenSuccess : COLORS.redError}
              style={{ marginLeft: 4 }}>
              {item.wasCorrect ? 'Correct Answer' : 'Incorrect Answer'}
            </Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionSection}>
          <Text
            variant="semibold15"
            color={COLORS.blue043142}
            style={styles.questionText}
            numberOfLines={expanded ? undefined : 2}>
            {item.questionText}
          </Text>
        </View>

        {/* Answer Cards */}
        <View style={styles.answersSection}>
          <View style={styles.answerCard}>
            <Text variant="regular12" color={COLORS.grey777777} style={{ marginBottom: 4 }}>
              Your Answer
            </Text>
            <View style={[
              styles.answerBox,
              item.wasCorrect ? styles.correctAnswerBox : styles.incorrectAnswerBox
            ]}>
              <Text
                variant="semibold13"
                color={item.wasCorrect ? COLORS.greenSuccess : COLORS.redError}>
                {item.userAnswer}
              </Text>
            </View>
          </View>
          
          {!item.wasCorrect && (
            <View style={styles.answerCard}>
              <Text variant="regular12" color={COLORS.grey777777} style={{ marginBottom: 4 }}>
                Correct Answer
              </Text>
              <View style={[styles.answerBox, styles.correctAnswerBox]}>
                <Text variant="semibold13" color={COLORS.greenSuccess}>
                  {item.correctAnswer}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Key Insight */}
        <View style={styles.insightSection}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIcon}>
              <MaterialIcons name="lightbulb" size={16} color={COLORS.yellowF5BE00} />
            </View>
            <Text variant="semibold13" color={COLORS.blue043142}>
              Key Insight
            </Text>
          </View>
          <Text
            variant="regular13"
            color={COLORS.grey333333}
            numberOfLines={expanded ? undefined : 2}
            style={styles.insightText}>
            {item.explanation?.core || 'No insight available'}
          </Text>
        </View>

        {/* Expand Button */}
        <TouchableOpacity
          onPress={toggleExpanded}
          style={styles.expandButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text variant="semibold13" color={COLORS.blue043142}>
            {expanded ? 'Show less' : 'View full explanation'}
          </Text>
          <Animated.View style={{ transform: [{ rotate }], marginLeft: 6 }}>
            <Ionicons name="chevron-down" size={18} color={COLORS.blue043142} />
          </Animated.View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {expanded && (
          <Animated.View style={styles.expandedContent}>
            {/* Detailed Explanations */}
            {item.explanation?.whyCorrect && (
              <View style={styles.explanationBlock}>
                <View style={styles.explanationBlockHeader}>
                  <View style={[styles.explanationBlockIcon, { backgroundColor: COLORS.greenSuccess + '15' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.greenSuccess} />
                  </View>
                  <Text variant="semibold13" color={COLORS.blue043142}>
                    Why This Answer Works
                  </Text>
                </View>
                <Text variant="regular13" color={COLORS.grey333333} style={styles.explanationBlockText}>
                  {item.explanation.whyCorrect}
                </Text>
              </View>
            )}

            {item.explanation?.whyIncorrect && !item.wasCorrect && (
              <View style={styles.explanationBlock}>
                <View style={styles.explanationBlockHeader}>
                  <View style={[styles.explanationBlockIcon, { backgroundColor: COLORS.orange + '15' }]}>
                    <MaterialIcons name="info" size={16} color={COLORS.orange} />
                  </View>
                  <Text variant="semibold13" color={COLORS.blue043142}>
                    Understanding Your Mistake
                  </Text>
                </View>
                <Text variant="regular13" color={COLORS.grey333333} style={styles.explanationBlockText}>
                  {item.explanation.whyIncorrect}
                </Text>
              </View>
            )}

            {/* Key Takeaway */}
            {item.explanation?.keyTakeaway && (
              <View style={styles.takeawaySection}>
                <LinearGradient
                  colors={[COLORS.yellowF5BE00 + '08', COLORS.yellowF5BE00 + '15']}
                  style={styles.takeawayGradient}>
                  <MaterialIcons name="star" size={20} color={COLORS.yellowF5BE00} />
                  <View style={styles.takeawayContent}>
                    <Text variant="semibold13" color={COLORS.blue043142}>
                      Key Takeaway
                    </Text>
                    <Text variant="regular13" color={COLORS.grey333333} style={{ marginTop: 4 }}>
                      {item.explanation.keyTakeaway}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Memory Tip */}
            {item.memoryTip && (
              <View style={styles.memoryTipSection}>
                <View style={styles.memoryTipHeader}>
                  <MaterialIcons name="psychology" size={18} color={COLORS.purple || COLORS.blue043142} />
                  <Text variant="semibold13" color={COLORS.blue043142} style={{ marginLeft: 8 }}>
                    Memory Trick
                  </Text>
                </View>
                <Text variant="regular13" color={COLORS.grey333333} style={styles.memoryTipText}>
                  💡 {item.memoryTip}
                </Text>
              </View>
            )}

            {/* User Notes */}
            {item.userNotes && (
              <View style={styles.userNotesSection}>
                <View style={styles.userNotesHeader}>
                  <MaterialIcons name="note" size={14} color={COLORS.grey777777} />
                  <Text variant="regular12" color={COLORS.grey777777} style={{ marginLeft: 6 }}>
                    Your Note
                  </Text>
                </View>
                <Text variant="regular13" color={COLORS.grey333333} style={styles.userNotesText}>
                  {item.userNotes}
                </Text>
              </View>
            )}

            {/* Related Topics */}
            {item.relatedTopics && item.relatedTopics.length > 0 && (
              <View style={styles.relatedTopicsSection}>
                <View style={styles.relatedTopicsHeader}>
                  <MaterialIcons name="topic" size={16} color={COLORS.grey777777} />
                  <Text variant="semibold13" color={COLORS.grey777777} style={{ marginLeft: 6 }}>
                    Related Topics
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topicsScrollContainer}
                  style={styles.topicsScrollView}>
                  {item.relatedTopics.map((topic, idx) => (
                    <View key={idx} style={styles.topicTag}>
                      <Text variant="regular12" color={COLORS.blue043142}>
                        {topic}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => onAddNote(item)}
              activeOpacity={0.8}>
              <MaterialIcons name="edit" size={16} color={COLORS.blue043142} />
              <Text variant="semibold13" color={COLORS.blue043142} style={{ marginLeft: 6 }}>
                {item.userNotes ? 'Edit Note' : 'Add Personal Note'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Enhanced Note Modal Component
const NoteModal = ({ visible, explanation, onClose, onSave }) => {
  const [note, setNote] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (explanation) {
      setNote(explanation.userNotes || '');
    }
  }, [explanation]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = async () => {
    if (explanation) {
      await onSave(explanation._id, note.trim());
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.noteModal,
                {
                  transform: [{ translateY: slideAnim }],
                  paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 30
                }
              ]}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text variant="semibold18" color={COLORS.blue043142}>
                    {explanation?.userNotes ? 'Edit Note' : 'Add Note'}
                  </Text>
                  <Text variant="regular12" color={COLORS.grey777777} style={{ marginTop: 2 }}>
                    Personal insights help reinforce learning
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={COLORS.grey777777} />
                </TouchableOpacity>
              </View>

              <View style={styles.questionPreviewCard}>
                <MaterialIcons name="help-outline" size={16} color={COLORS.grey777777} />
                <Text
                  variant="regular13"
                  color={COLORS.grey777777}
                  style={{ marginLeft: 8, flex: 1 }}
                  numberOfLines={2}>
                  {explanation?.questionText}
                </Text>
              </View>

              <View style={styles.noteInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add memory tricks, personal connections, or key insights..."
                  placeholderTextColor={COLORS.grey999999}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.characterCount}>
                  <Text 
                    variant="regular11" 
                    color={note.length > 450 ? COLORS.orange : COLORS.grey999999}>
                    {note.length}/500
                  </Text>
                </View>
              </View>

              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={onClose}
                  activeOpacity={0.8}>
                  <Text variant="semibold14" color={COLORS.grey777777}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.modalButtonSave,
                    !note.trim() && styles.modalButtonDisabled
                  ]}
                  onPress={handleSave}
                  disabled={!note.trim()}
                  activeOpacity={0.8}>
                  <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                    Save Note
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Main Knowledge Vault Tab Component
const KnowledgeVaultTab = () => {
  const navigation = useNavigation();
  const [explanations, setExplanations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = async (isRefresh = false, pageNum = 1) => {
    try {
      console.log('KnowledgeVaultTab: Starting fetchData...');
      if (pageNum === 1) {
        if (!isRefresh) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
        sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(activeFilter === 'favorites' && { favorites: true }),
        ...(activeFilter === 'correct' && { tags: 'correct' }),
        ...(activeFilter === 'incorrect' && { tags: 'incorrect' }),
      };

      const response = await getLearningVaultApi(params);
      console.log('KnowledgeVaultTab: API Response:', response?.data);
      
      const { explanations: newExplanations, stats: newStats, pagination } = response.data || {};

      if (pageNum === 1) {
        setExplanations(newExplanations || []);
        setStats(newStats);
      } else {
        setExplanations(prev => [...prev, ...(newExplanations || [])]);
      }

      const currentLength = pageNum === 1 ? (newExplanations || []).length : explanations.length + (newExplanations || []).length;
      setHasMore(pagination && currentLength < pagination.total);
      setPage(pageNum);
      
      console.log('KnowledgeVaultTab: Set explanations:', newExplanations?.length || 0);
    } catch (error) {
      console.error('KnowledgeVaultTab: Error fetching data:', error);
      Alert.alert('Error', 'Failed to load explanations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('KnowledgeVaultTab: useFocusEffect triggered');
      fetchData();
    }, [])
  );

  useEffect(() => {
    fetchData(false, 1);
  }, [activeFilter, sortBy]);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    fetchData(true, 1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchData(false, page + 1);
    }
  };

  const handleSearch = useCallback(
    debounce((text) => {
      setSearchQuery(text);
      setPage(1);
      fetchData(false, 1);
    }, 500),
    [sortBy, activeFilter]
  );

  const handleToggleFavorite = async (explanationId) => {
    try {
      await toggleFavoriteExplanationApi(explanationId);
      setExplanations(prev =>
        prev.map(exp =>
          exp._id === explanationId
            ? { ...exp, isFavorite: !exp.isFavorite }
            : exp
        )
      );
      // Update stats
      setStats(prev => ({
        ...prev,
        favorites: prev.favorites + (explanations.find(e => e._id === explanationId)?.isFavorite ? -1 : 1)
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const handleAddNote = (explanation) => {
    setSelectedExplanation(explanation);
    setShowNoteModal(true);
  };

  const handleSaveNote = async (explanationId, note) => {
    try {
      await addExplanationNoteApi(explanationId, note);
      setExplanations(prev =>
        prev.map(exp =>
          exp._id === explanationId
            ? { ...exp, userNotes: note }
            : exp
        )
      );
      Alert.alert('Success', 'Note saved successfully', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleShare = async (item) => {
    try {
      const message = `
📚 Question: ${item.questionText}

✅ Correct Answer: ${item.correctAnswer}

💡 Key Insight: ${item.explanation?.core || 'No insight available'}

🎯 Remember: ${item.explanation?.keyTakeaway || 'Focus on understanding the concept'}

Shared from ScaleUp Learning Vault 🚀
`;

      await Share.share({
        message,
        title: 'Learning Insight',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getFilterCounts = () => {
    if (!explanations || explanations.length === 0) return { correct: 0, incorrect: 0, favorites: 0 };

    return {
      correct: explanations.filter(e => e.wasCorrect).length,
      incorrect: explanations.filter(e => !e.wasCorrect).length,
      favorites: explanations.filter(e => e.isFavorite).length,
    };
  };

  const filterCounts = getFilterCounts();

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Header Title */}
      <View style={styles.headerTitle}>
        <Text variant="semibold18" color={COLORS.blue043142}>
          Knowledge Vault
        </Text>
        <Text variant="regular12" color={COLORS.grey777777}>
          Your personalized knowledge repository
        </Text>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
            bounces={false}>
            <StatsCard
              icon="collections-bookmark"
              label="Explanations"
              value={stats.totalExplanations || 0}
              color={COLORS.blue043142}
              index={0}
            />
            <StatsCard
              icon="visibility"
              label="Total Views"
              value={stats.totalViews || 0}
              color={COLORS.greenSuccess}
              index={1}
            />
            <StatsCard
              icon="bookmark"
              label="Favorites"
              value={stats.favorites || 0}
              color={COLORS.yellowF5BE00}
              index={2}
            />
            <StatsCard
              icon="school"
              label="Topics"
              value={stats.uniqueTopics || 0}
              color={COLORS.purple || COLORS.blue043142}
              index={3}
            />
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.grey999999} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions, answers, or insights..."
            placeholderTextColor={COLORS.grey999999}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                fetchData(false, 1);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={COLORS.grey999999} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          bounces={false}>
          <FilterChip
            label="All"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            count={explanations.length}
          />
          <FilterChip
            label="Favorites"
            icon="bookmark"
            isActive={activeFilter === 'favorites'}
            onPress={() => setActiveFilter('favorites')}
            count={filterCounts.favorites}
          />
          <FilterChip
            label="Correct"
            icon="check-circle"
            isActive={activeFilter === 'correct'}
            onPress={() => setActiveFilter('correct')}
            count={filterCounts.correct}
          />
          <FilterChip
            label="Review"
            icon="error"
            isActive={activeFilter === 'incorrect'}
            onPress={() => setActiveFilter('incorrect')}
            count={filterCounts.incorrect}
          />
          
          <View style={styles.filterDivider} />
          
          <FilterChip
            label="Recent"
            icon="schedule"
            isActive={sortBy === 'createdAt'}
            onPress={() => setSortBy('createdAt')}
          />
          <FilterChip
            label="Popular"
            icon="trending-up"
            isActive={sortBy === 'viewCount'}
            onPress={() => setSortBy('viewCount')}
          />
        </ScrollView>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconContainer}>
          <MaterialIcons name="collections-bookmark" size={64} color={COLORS.greyD6D6D6} />
        </View>
        <Text variant="semibold18" color={COLORS.blue043142} style={styles.emptyTitle}>
          {searchQuery ? 'No Results Found' : 'Your Vault is Empty'}
        </Text>
        <Text 
          variant="regular14" 
          color={COLORS.grey777777} 
          style={styles.emptyDescription}>
          {searchQuery
            ? 'Try adjusting your search terms or filters'
            : 'Start taking quizzes to build your personalized learning vault with AI-powered explanations'
          }
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => navigation.navigate('QuizList')}
            activeOpacity={0.8}>
            <LinearGradient
              colors={[COLORS.blue043142, COLORS.blue043142 + 'E6']}
              style={styles.emptyActionGradient}>
              <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                Start Learning
              </Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.whiteFFFFFF} style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.blue043142} />
        <Text variant="regular12" color={COLORS.grey777777} style={{ marginTop: 8 }}>
          Loading more insights...
        </Text>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="regular14" color={COLORS.grey777777} style={{ marginTop: 16 }}>
            Loading your learning insights...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={explanations}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ExplanationCard
            item={item}
            index={index}
            onToggleFavorite={handleToggleFavorite}
            onAddNote={handleAddNote}
            onShare={handleShare}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          explanations.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.blue043142]}
            tintColor={COLORS.blue043142}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={10}
      />

      <NoteModal
        visible={showNoteModal}
        explanation={selectedExplanation}
        onClose={() => {
          setShowNoteModal(false);
          setSelectedExplanation(null);
        }}
        onSave={handleSaveNote}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  header: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    overflow: 'hidden',
  },
  headerTitle: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statsSection: {
    paddingVertical: 16,
    backgroundColor: COLORS.greyF7F7F7,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statsCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: 16,
    minWidth: nw(30),
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statsContent: {
    alignItems: 'flex-start',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.blue043142,
  },
  filterSection: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  filterCount: {
    backgroundColor: COLORS.greyF7F7F7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
  },
  filterCountActive: {
    backgroundColor: COLORS.whiteFFFFFF + '20',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.greyD6D6D6,
    marginHorizontal: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  explanationCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  quizInfoContainer: {
    flex: 1,
    marginRight: 12,
  },
  quizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.greyF7F7F7,
  },
  resultBadgeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  questionSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  questionText: {
    lineHeight: 22,
  },
  answersSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  answerCard: {
    flex: 1,
  },
  answerBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  correctAnswerBox: {
    backgroundColor: COLORS.greenSuccess + '08',
    borderColor: COLORS.greenSuccess + '30',
  },
  incorrectAnswerBox: {
    backgroundColor: COLORS.redError + '08',
    borderColor: COLORS.redError + '30',
  },
  insightSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.yellowF5BE00 + '08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.yellowF5BE00 + '20',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    marginRight: 8,
  },
  insightText: {
    lineHeight: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  explanationBlock: {
    marginBottom: 16,
  },
  explanationBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationBlockIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  explanationBlockText: {
    lineHeight: 20,
    marginLeft: 36,
  },
  takeawaySection: {
    marginBottom: 16,
  },
  takeawayGradient: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  takeawayContent: {
    flex: 1,
    marginLeft: 10,
  },
  memoryTipSection: {
    backgroundColor: COLORS.purple + '08' || COLORS.blue043142 + '08',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.purple + '20' || COLORS.blue043142 + '20',
  },
  memoryTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memoryTipText: {
    lineHeight: 20,
  },
  userNotesSection: {
    backgroundColor: COLORS.greyF7F7F7,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  userNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userNotesText: {
    lineHeight: 20,
  },
  relatedTopicsSection: {
    marginBottom: 16,
  },
  relatedTopicsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicsScrollView: {
    marginHorizontal: -16,
  },
  topicsScrollContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  topicTag: {
    backgroundColor: COLORS.blue043142 + '08',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '15',
    marginRight: 8,
    flexShrink: 0,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue043142 + '08',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '20',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  noteModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.greyD6D6D6,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 4,
  },
  questionPreviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.greyF7F7F7,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  noteInputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    maxHeight: 200,
    fontSize: 14,
    color: COLORS.blue043142,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  modalActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.greyF7F7F7,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  modalButtonSave: {
    backgroundColor: COLORS.blue043142,
  },
  modalButtonDisabled: {
    backgroundColor: COLORS.greyD6D6D6,
  },
});

export default KnowledgeVaultTab;