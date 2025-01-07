import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const API_URL = 'http://192.168.185.240:3000/api';

const TABS = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
};

const EmptyStateImages = {
  UPCOMING: require('../../assets/images/intro4.png'),
  ACTIVE: require('../../assets/images/intro4.png'),
  COMPLETED: require('../../assets/images/intro4.png'),
};

const EmptyStateMessages = {
  UPCOMING: "You're all set for now! No quizzes are scheduled. Keep exploring and stay sharp!",
  ACTIVE: "You're not taking any quizzes at the moment. Ready to test your knowledge? Jump into a new challenge!",
  COMPLETED: "It looks like you haven't completed any quizzes. Start one today and track your progress!",
};

const QuizList = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(TABS.UPCOMING);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const res = await getProfile('');
        if (res?.data?.userProfileInfo?.id) {
          setToken(res.data.userProfileInfo.id);
        }
      } catch (error) {
        console.log('Profile data fetch error:', error?.response?.data?.message);
        setError('Failed to fetch user profile');
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (token) {
      fetchQuizzes();
    }
  }, [token, activeTab]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    const userData = await AsyncStorage.getItem('userData');
    const parsedUser = JSON.parse(userData);

    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/quiz/list`, {
        headers: {
          'Authorization': `Bearer ${parsedUser?.token}`,
          'Content-Type': 'application/json'
        }
      });

      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchQuizzes();
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const currentDate = new Date();
    const startDate = new Date(quiz.startTime);
    const endDate = new Date(quiz.endTime);

    switch (activeTab) {
      case TABS.UPCOMING:
        return matchesSearch && startDate > currentDate;
      case TABS.ACTIVE:
        return matchesSearch && startDate <= currentDate && endDate >= currentDate;
      case TABS.COMPLETED:
        return matchesSearch && endDate < currentDate;
      default:
        return false;
    }
  });

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={EmptyStateImages[activeTab]}
        style={styles.emptyStateImage}
      />
      <Text style={styles.emptyStateTitle}>
        {`No ${activeTab.toLowerCase()} Quizzes`}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {EmptyStateMessages[activeTab]}
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('ExploreContent')}
      >
        <Text style={styles.exploreButtonText}>Explore Content</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuizCard = ({ item }) => {
    const quizDate = new Date(item.startTime);
    const formattedDate = `${quizDate.getDate()}/${quizDate.getMonth() + 1}/${quizDate.getFullYear()}`;
    const formattedTime = quizDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.quizCard}
        onPress={() => navigation.navigate('QuizDetails', { quizId: item._id, token })}
      >
        <View style={styles.quizIconContainer}>
          <Image
            source={require('../../assets/images/ciclelogo.png')}
            style={styles.quizIcon}
          />
        </View>
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle}>{item.topic}</Text>
          <Text style={styles.quizSubtitle}>{item.difficulty}</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTime}>{formattedDate}</Text>
            <Text style={styles.dateTime2}>{formattedTime}</Text>
          </View>
          {item.isPaid && (
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>🎁 Surprise Reward for Top 3 Winners</Text>
            </View>
          )}
          {item.isRegistered && (
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredText}>Registered</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5BE00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search-outline" 
            size={20} 
            color="#000000" 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#000000"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {Object.values(TABS).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredQuizzes}
        renderItem={renderQuizCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#F5BE00']}
            tintColor="#F5BE00"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#F5BE00',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#F5BE00',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#043142',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ... rest of the existing styles remain the same
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizIconContainer: {
    marginRight: 12,
  },
  quizIcon: {
    width: 40,
    height: 40,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 12,
    color: '#666666',
  },
  dateTime2: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 12,
  },
  rewardContainer: {
    marginTop: 4,
  },
  rewardText: {
    fontSize: 12,
    color: 'black',
  },
  registeredBadge: {
    position: 'absolute',
    bottom: 16,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  registeredText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuizList;