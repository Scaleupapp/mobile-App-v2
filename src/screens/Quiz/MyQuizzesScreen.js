// screens/Quiz/MyQuizzesScreen.js
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInDown} from 'react-native-reanimated';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QuizShareButton from '../../components/QuizShareButton';
// Import your Text component
const Text = ({children, style, variant, color, ...props}) => {
  let fontWeight = 'normal';
  let fontSize = 14;
  if (variant) {
    if (variant.includes('semibold')) fontWeight = '600';
    if (variant.includes('bold')) fontWeight = 'bold';
    if (variant.includes('10')) fontSize = 10;
    if (variant.includes('12')) fontSize = 12;
    if (variant.includes('14')) fontSize = 14;
    if (variant.includes('16')) fontSize = 16;
    if (variant.includes('18')) fontSize = 18;
    if (variant.includes('20')) fontSize = 20;
    if (variant.includes('24')) fontSize = 24;
  }
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

import {getMyQuizzesApi} from '../../services/apiService';
import Routes from '../../helper/routes';

const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  grey666666: '#666666',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
};

const QUIZ_FILTERS = [
  {id: 'all', label: 'All Quizzes'},
  {id: 'draft', label: 'Drafts'},
  {id: 'pending', label: 'Under Review'},
  {id: 'published', label: 'Published'},
  {id: 'rejected', label: 'Rejected'},
];

const SORT_OPTIONS = [
  {id: 'newest', label: 'Newest First'},
  {id: 'oldest', label: 'Oldest First'},
  {id: 'popular', label: 'Most Popular'},
  {id: 'rating', label: 'Highest Rated'},
];

const MyQuizzesScreen = ({navigation}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const loadQuizzes = async (pageNum = 1, refresh = false) => {
    try {
      if (pageNum === 1 && !refresh) setIsLoading(true);
      
      const response = await getMyQuizzesApi({
        status: activeFilter,
        page: pageNum,
        limit: 20,
        sortBy: sortBy,
      });
      
      const newQuizzes = response.data.data.quizzes;
      
      if (pageNum === 1) {
        setQuizzes(newQuizzes);
      } else {
        setQuizzes(prev => [...prev, ...newQuizzes]);
      }
      
      setHasMore(response.data.data.pagination.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };
  
  useEffect(() => {
    loadQuizzes(1);
  }, [activeFilter, sortBy]);
  
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadQuizzes(1, true);
  }, [activeFilter, sortBy]);
  
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadQuizzes(page + 1);
    }
  };
  
  const handleQuizPress = (quiz) => {
    if (quiz.status === 'draft') {
      navigation.navigate(Routes.EditQuiz, {quizId: quiz.id});
    } else {
      navigation.navigate(Routes.QuizAnalytics, {
        quizId: quiz.id,
        quizTitle: quiz.title,
      });
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return COLORS.grey666666;
      case 'pending_review':
      case 'manual_review': return COLORS.yellowF5BE00;
      case 'approved':
      case 'ai_approved': return COLORS.greenSuccess;
      case 'rejected': return COLORS.redError;
      default: return COLORS.grey999999;
    }
  };
  
  const renderQuizItem = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.quizCard}>
      <TouchableOpacity onPress={() => handleQuizPress(item)} activeOpacity={0.9}>
        <View style={styles.quizHeader}>
          <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '15'}]}>
            <View style={[styles.statusDot, {backgroundColor: getStatusColor(item.status)}]} />
            <Text variant="semibold12" color={getStatusColor(item.status)}>
              {item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          {item.statistics.pendingAccessRequests > 0 && (
            <View style={styles.requestsBadge}>
              <Text variant="bold10" color={COLORS.whiteFFFFFF}>
                {item.statistics.pendingAccessRequests} requests
              </Text>
            </View>
          )}
        </View>
        
        <Text variant="bold16" color={COLORS.blue043142} numberOfLines={2} style={styles.quizTitle}>
          {item.title}
        </Text>
        
        <Text variant="regular14" color={COLORS.grey666666} numberOfLines={2} style={styles.quizDescription}>
          {item.description}
        </Text>
        
        <View style={styles.quizInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.grey666666} />
            <Text variant="regular12" color={COLORS.grey666666} style={{marginLeft: 4}}>
              {moment(item.dates.created).format('MMM DD')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="help-circle-outline" size={14} color={COLORS.grey666666} />
            <Text variant="regular12" color={COLORS.grey666666} style={{marginLeft: 4}}>
              {item.questions.count} questions
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name={item.visibility === 'private' ? 'lock-closed' : 'globe-outline'} 
                     size={14} color={COLORS.grey666666} />
            <Text variant="regular12" color={COLORS.grey666666} style={{marginLeft: 4}}>
              {item.visibility}
            </Text>
          </View>
        </View>
        
        <View style={styles.quizStats}>
          <View style={styles.statItem}>
            <Text variant="bold16" color={COLORS.blue043142}>{item.statistics.attempts}</Text>
            <Text variant="regular12" color={COLORS.grey666666}>Attempts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="bold16" color={COLORS.blue043142}>
              {item.statistics.completionRate}%
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>Completion</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="bold16" color={COLORS.blue043142}>
              {item.statistics.rating || 'N/A'}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
            {/* Share Button for Published Quizzes */}
        {['approved', 'ai_approved'].includes(item.status) && item.shareId && (
          <View style={styles.shareButtonContainer}>
            <QuizShareButton 
              quiz={item} 
              variant="button"
              style={styles.shareButton}
            />
          </View>
        )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="quiz" size={64} color={COLORS.greyEEEEEE} />
      <Text variant="bold18" color={COLORS.grey666666} style={{marginTop: 16}}>
        No quizzes found
      </Text>
      <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 8, textAlign: 'center'}}>
        {activeFilter === 'draft' 
          ? "You don't have any draft quizzes"
          : activeFilter === 'pending'
          ? "No quizzes are currently under review"
          : activeFilter === 'published'
          ? "You haven't published any quizzes yet"
          : activeFilter === 'rejected'
          ? "No rejected quizzes"
          : "Create your first quiz to get started"}
      </Text>
      {activeFilter === 'all' && (
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate(Routes.CreateQuiz)}>
          <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
            Create Your First Quiz
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
          <Text variant="bold20" color={COLORS.whiteFFFFFF}>
            My Quizzes
          </Text>
          <TouchableOpacity 
            style={styles.createIconButton}
            onPress={() => navigation.navigate(Routes.CreateQuiz)}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}>
          {QUIZ_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterPill, activeFilter === filter.id && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter.id)}>
              <Text
                variant={activeFilter === filter.id ? 'semibold14' : 'regular14'}
                color={activeFilter === filter.id ? COLORS.whiteFFFFFF : COLORS.grey666666}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.sortButton} onPress={() => {/* Show sort modal */}}>
          <Ionicons name="funnel-outline" size={18} color={COLORS.grey666666} />
          <Text variant="regular12" color={COLORS.grey666666} style={{marginLeft: 4}}>
            Sort
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading && renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore && (
            <ActivityIndicator size="small" color={COLORS.yellowF5BE00} style={{marginVertical: 16}} />
          )
        }
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: nh(2),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  createIconButton: {
    padding: nw(2),
    marginRight: -nw(2),
  },
  filtersContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  filterScroll: {
    paddingHorizontal: nw(4),
  },
  filterPill: {
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderRadius: 20,
    backgroundColor: COLORS.greyF7F7F7,
    marginRight: nw(2),
  },
  filterPillActive: {
    backgroundColor: COLORS.blue043142,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: nw(4),
    top: nh(2),
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 16,
    backgroundColor: COLORS.greyF7F7F7,
  },
  listContent: {
    paddingHorizontal: nw(4),
    paddingTop: nh(2),
    paddingBottom: nh(10),
    flexGrow: 1,
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: nw(4),
    marginBottom: nh(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(1),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(2.5),
    paddingVertical: nh(0.6),
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  requestsBadge: {
    backgroundColor: COLORS.redError,
    paddingHorizontal: nw(2),
    paddingVertical: nh(0.4),
    borderRadius: 10,
  },
  quizTitle: {
    marginBottom: nh(0.8),
  },
  quizDescription: {
    marginBottom: nh(1.5),
  },
  quizInfo: {
    flexDirection: 'row',
    marginBottom: nh(2),
    paddingBottom: nh(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(4),
  },
  quizStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: nh(4),
    backgroundColor: COLORS.greyEEEEEE,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(8),
  },
  createButton: {
    marginTop: nh(3),
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(6),
    paddingVertical: nh(1.5),
    borderRadius: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MyQuizzesScreen;