import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import axios from 'axios';
import QuizCard from './components/QuizCard';
import { getProfile } from '../../services/apiService';

import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'https://api.scaleupapp.club/api';

const QuizList = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Fetch profile data and set token
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

  // Fetch quizzes when token is available
  useEffect(() => {
    if (token) {
      fetchQuizzes(1);
    }
  }, [token]);

  const fetchQuizzes = async (pageNum = 1) => {


    const userData = await AsyncStorage.getItem('userData');
    const parsedUser = JSON.parse(userData);

    console.log('userdataaaaaaaaaaaa',parsedUser);
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/quiz/list`, {
        params: {
          page: pageNum,
          pageSize: 10
        },
        headers: { 
          'Authorization': `Bearer ${parsedUser?.token}`,
          'Content-Type': 'application/json'
        }
      });

      const { quizzes: newQuizzes, pagination } = response.data;

      if (pageNum === 1) {
        setQuizzes(newQuizzes);
      } else {
        setQuizzes(prev => [...prev, ...newQuizzes]);
      }

      setHasMore(pagination.currentPage < pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching quizzes:', error.response || error);
      setError('Failed to fetch quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuizzes(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchQuizzes(page + 1);
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        renderItem={({ item }) => (
          <QuizCard
            quiz={item}
            onPress={() => navigation.navigate('QuizDetails', { 
              quizId: item._id,
              token: token // Pass token to quiz details screen
            })}
          />
        )}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading quizzes...' : 'No quizzes available'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ff0000',
  }
});

export default QuizList;