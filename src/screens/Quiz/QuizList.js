import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import Text from '../../components/Text';

import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import LeaderboardModal from './LeaderboardModal';
const API_URL = 'https://api.scaleupapp.club/api';

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
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);

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
    // Check if topic matches search query
    const matchesSearch = quiz.topic.toLowerCase().includes(searchQuery.toLowerCase());
  
    // Convert current time to IST
    const currentDate = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds  
    const currentDateIST = new Date(currentDate.getTime() + istOffset);
  
    // Convert quiz times to IST for comparison
    const startDateIST = new Date(new Date(quiz.startTime).getTime() + istOffset);
    const endDateIST = new Date(new Date(quiz.endTime).getTime() + istOffset);
  
    switch (activeTab) {
      case TABS.UPCOMING:
        // Quiz hasn't started yet
        return matchesSearch && !quiz.hasStarted && startDateIST > currentDateIST;
        
      case TABS.ACTIVE:
        // Quiz has started but hasn't ended
        return matchesSearch && quiz.hasStarted && !quiz.hasEnded;
        
      case TABS.COMPLETED:
        // Use hasEnded flag instead of date comparison
        return matchesSearch && quiz.hasEnded;
        
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
      <Text variant="semibold20" color={COLORS.blue043142} style={styles.emptyStateTitle}>
        {`No ${activeTab.toLowerCase()} Quizzes`}
      </Text>
      <Text variant="regular16" color={COLORS.blue043142} style={styles.emptyStateMessage}>
        {EmptyStateMessages[activeTab]}
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('ExploreContent')}
      >
        <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
          Explore Content
        </Text>
      </TouchableOpacity>
    </View>
  );


  const handleViewLeaderboard = (quizId) => {
    setSelectedQuizId(quizId);
    setIsLeaderboardVisible(true);
  };

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
            source={require('../../assets/images/image.png')}
            style={styles.quizIcon}
          />
        </View>
        <View style={styles.quizInfo}>
          <Text variant="semibold16" color={COLORS.blue043142} style={styles.quizTitle}>
            {item.topic}
          </Text>
          <Text variant="regular16" color={COLORS.blue043142} style={styles.quizSubtitle}>
            {item.difficulty}
          </Text>
          <View style={styles.dateTimeContainer}>
            <Text variant="regular14" color={COLORS.blue043142}>
              {formattedDate}
            </Text>
            <Text variant="regular14" color={COLORS.blue043142} style={styles.dateTime2}>
              {formattedTime}
            </Text>
          </View>
          {item.isPaid && (
            <View style={styles.rewardContainer}>
              <Text variant="regular14" color={COLORS.blue043142}>
                🎁 Surprise Reward for Top 3 Winners
              </Text>
            </View>
          )}
          {activeTab === TABS.COMPLETED ? (
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => handleViewLeaderboard(item._id)}
            >
              <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                View Leaderboard
              </Text>
            </TouchableOpacity>
          ) : (
            item.isRegistered && (
              <View style={styles.registeredBadge}>
                <Text variant="regular14" color={COLORS.whiteFFFFFF}>
                  Registered
                </Text>
              </View>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={require('../../assets/images/Ellipse.png')}
        style={styles.semicircle}
        resizeMode="stretch">
        <Header
          title="Quizzes"
          rightIcon={false}
        />
      </ImageBackground>

      <View style={styles.searchWrapper}>
        <CustomTextInput 
          width={DEVICE_WIDTH - 32} 
          height={nh(50)}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        {Object.values(TABS).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text 
              variant={activeTab === tab ? "semibold14" : "regular14"}
              color={activeTab === tab ? COLORS.yellowF5BE00 : COLORS.grey999999}
            >
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
            colors={[COLORS.yellowF5BE00]}
            tintColor={COLORS.yellowF5BE00}
          />
        }
      />
      <LeaderboardModal
        visible={isLeaderboardVisible}
        onClose={() => setIsLeaderboardVisible(false)}
        quizId={selectedQuizId}
      />
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
  semicircle: {
    width: DEVICE_WIDTH,
    height: nh(120),
    marginBottom: nh(20),
  },
  searchWrapper: {
    position: 'absolute',
    left: nw(16),
    right: 0,
    top: 80,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: nh(30),
  },
  tab: {
    paddingVertical: nh(12),
    paddingHorizontal: nw(16),
    marginRight: nw(16),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.yellowF5BE00,
  },
  listContainer: {
    padding: nw(16),
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(16),
    marginTop: nh(10),
  },
  emptyStateImage: {
    width: nw(200),
    height: nh(200),
    marginBottom: nh(24),
  },
  emptyStateMessage: {
    textAlign: 'center',
    marginBottom: nh(24),
  },
  exploreButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(12),
    paddingHorizontal: nw(48),
    borderRadius: 8,
  },
  quizCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(16),
    marginBottom: nh(16),
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizIconContainer: {
    marginRight: nw(12),
  },
  quizIcon: {
    width: nw(40),
    height: nh(40),
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    marginBottom: nh(4),
  },
  quizSubtitle: {
    marginBottom: nh(8),
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: nh(8),
  },
  dateTime2: {
    marginLeft: nw(12),
  },
  rewardContainer: {
    marginTop: nh(4),
  },
  registeredBadge: {
    position: 'absolute',
    bottom: nh(2),
    right: nw(8),
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 4,
  },
  leaderboardButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: nh(-20),
    left: nw(8),
    
  },
});


export default QuizList;