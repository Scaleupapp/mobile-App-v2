import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInDown} from 'react-native-reanimated';
import moment from 'moment';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Text component
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

// Header component
const Header = ({title, subtitle, onBack}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text variant="bold18" color={COLORS.whiteFFFFFF}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="regular12" color={COLORS.whiteFFFFFF} style={{opacity: 0.8, marginTop: 4}}>
          {subtitle}
        </Text>
      )}
    </View>
  </View>
);

import {
  getQuizParticipantsApi,
} from '../../services/apiService';

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
  greyF8F9FA: '#F8F9FA',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  purpleCommunity: '#8B5CF6',
};

const QuizParticipantsScreen = ({navigation, route}) => {
  const {quizId, quizTitle} = route.params;
  const userdata = useSelector(state => state?.userData);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Load participants
  useEffect(() => {
    loadParticipants();
  }, [filterStatus]);
  
  const loadParticipants = async (refresh = false, loadMore = false) => {
    try {
      if (!refresh && !loadMore) setIsLoading(true);
      
      const currentPage = loadMore ? page + 1 : 1;
      const response = await getQuizParticipantsApi(quizId, filterStatus, currentPage, 50);
      
      const newParticipants = response.data.data.participants || [];
      
      if (loadMore) {
        setParticipants([...participants, ...newParticipants]);
      } else {
        setParticipants(newParticipants);
      }
      
      setPage(currentPage);
      setHasMore(response.data.data.hasMore || false);
      
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Error', 'Failed to load participants');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadParticipants(true);
  }, [filterStatus]);
  
  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadParticipants(false, true);
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return COLORS.greenSuccess;
      case 'in_progress':
        return COLORS.yellowF5BE00;
      case 'not_started':
        return COLORS.grey999999;
      default:
        return COLORS.grey666666;
    }
  };
  
  // Render participant item
  const renderParticipantItem = ({item, index}) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Image
              source={{uri: item.profilePicture}}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={COLORS.grey666666} />
            </View>
          )}
        </View>
        
        <View style={styles.participantInfo}>
          <Text variant="semibold16" color={COLORS.blue043142}>
            {item.username}
          </Text>
          <Text variant="regular12" color={COLORS.grey666666}>
            Registered {moment(item.registeredAt).fromNow()}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
          <View style={[styles.statusDot, {backgroundColor: getStatusColor(item.status)}]} />
          <Text variant="semibold12" color={getStatusColor(item.status)}>
            {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>
      
      {item.attempts > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="bold14" color={COLORS.blue043142}>
              {item.attempts}
            </Text>
            <Text variant="regular10" color={COLORS.grey666666}>
              Attempts
            </Text>
          </View>
          
          {item.bestScore !== null && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="bold14" color={COLORS.yellowF5BE00}>
                  {item.bestScore}%
                </Text>
                <Text variant="regular10" color={COLORS.grey666666}>
                  Best Score
                </Text>
              </View>
            </>
          )}
          
          {item.completedAt && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="bold14" color={COLORS.greenSuccess}>
                  {moment(item.completedAt).format('MMM DD')}
                </Text>
                <Text variant="regular10" color={COLORS.grey666666}>
                  Completed
                </Text>
              </View>
            </>
          )}
        </View>
      )}
      
      {item.isApprovedUser && (
        <View style={styles.approvedBadge}>
          <Ionicons name="key" size={12} color={COLORS.purpleCommunity} />
          <Text variant="regular10" color={COLORS.purpleCommunity} style={{marginLeft: 4}}>
            Approved Access
          </Text>
        </View>
      )}
    </Animated.View>
  );
  
  if (isLoading && !isRefreshing && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text variant="regular16" color={COLORS.blue043142} style={{marginTop: 16}}>
          Loading participants...
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header
          title="Quiz Participants"
          subtitle={quizTitle}
          onBack={() => navigation.goBack()}
        />
      </LinearGradient>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'completed', 'in_progress', 'not_started'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.activeFilterTab
            ]}
            onPress={() => {
              setFilterStatus(status);
              setPage(1);
            }}>
            <Text
              variant={filterStatus === status ? 'semibold14' : 'regular14'}
              color={filterStatus === status ? COLORS.yellowF5BE00 : COLORS.grey666666}>
              {status === 'all' ? 'All' : status.replace('_', ' ').split(' ').map(
                word => word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text variant="bold24" color={COLORS.blue043142}>
            {participants.length}
          </Text>
          <Text variant="regular12" color={COLORS.grey666666}>
            Total Participants
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text variant="bold24" color={COLORS.greenSuccess}>
            {participants.filter(p => p.status === 'completed').length}
          </Text>
          <Text variant="regular12" color={COLORS.grey666666}>
            Completed
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text variant="bold24" color={COLORS.yellowF5BE00}>
            {participants.filter(p => p.status === 'in_progress').length}
          </Text>
          <Text variant="regular12" color={COLORS.grey666666}>
            In Progress
          </Text>
        </View>
      </View>
      
      {/* Participants List */}
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          isLoading && page > 1 ? (
            <ActivityIndicator style={{marginVertical: 20}} color={COLORS.yellowF5BE00} />
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color={COLORS.greyEEEEEE} />
            <Text variant="semibold18" color={COLORS.grey666666} style={{marginTop: 16}}>
              No participants yet
            </Text>
            <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 8, textAlign: 'center'}}>
              {filterStatus === 'all' 
                ? 'No one has registered for this quiz yet'
                : `No ${filterStatus.replace('_', ' ')} participants`}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF8F9FA,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  headerContent: {
    flex: 1,
    marginLeft: nw(4),
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  filterTab: {
    marginRight: nw(4),
    paddingVertical: nh(1),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: COLORS.yellowF5BE00,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(2),
    marginBottom: nh(1),
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: nh(4),
    backgroundColor: COLORS.greyEEEEEE,
  },
  listContainer: {
    paddingVertical: nh(2),
    paddingHorizontal: nw(4),
  },
  participantCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(4),
    marginBottom: nh(1.5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: nw(3),
  },
  avatar: {
    width: nw(10),
    height: nw(10),
    borderRadius: nw(5),
  },
  avatarPlaceholder: {
    width: nw(10),
    height: nw(10),
    borderRadius: nw(5),
    backgroundColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(2.5),
    paddingVertical: nh(0.6),
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(1.5),
    paddingTop: nh(1.5),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: nh(3),
    backgroundColor: COLORS.greyEEEEEE,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(1),
    paddingTop: nh(1),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
  },
});

export default QuizParticipantsScreen;