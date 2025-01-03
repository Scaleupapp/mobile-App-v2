import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = 'https://api.scaleupapp.club/api';

const QuizResults = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [results, setResults] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First get profile data
        const profileRes = await getProfile('');
        const profile = profileRes?.data?.userProfileInfo;
        setProfileData(profile);

        const userData = await AsyncStorage.getItem('userData');
    const parsedUser = JSON.parse(userData);

        // Only fetch results if we have profile data
        if (parsedUser?.token) {
          const response = await axios.get(
            `${API_URL}/quiz/quiz-results/${quizId}`,
            {
              headers: { Authorization: `Bearer ${parsedUser?.token}` }
            }
          );
          setResults(response.data.results);
        } else {
          setError('Profile data not available');
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error?.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [quizId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!results?.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.noResultsText}>No results available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Quiz Results</Text>

      {results.slice(0, 3).map((result, index) => (
        <View key={result.userId} style={styles.topPlayerCard}>
          <View style={[styles.rankBadge, getTopThreeStyle(index)]}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <Image
            source={{ 
              uri: result.profilePicture || 'https://via.placeholder.com/50' 
            }}
            style={styles.profilePic}
          />
          <View style={styles.playerInfo}>
            <Text style={styles.username}>{result.username}</Text>
            <Text style={styles.score}>Score: {result.finalScore}</Text>
          </View>
        </View>
      ))}

      <View style={styles.statsContainer}>
        {results.slice(3).map((result) => (
          <View key={result.userId} style={styles.statRow}>
            <Text style={styles.rank}>#{result.rank}</Text>
            <Text style={styles.playerName}>{result.username}</Text>
            <Text style={styles.playerScore}>{result.finalScore}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const getTopThreeStyle = (index) => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  return {
    backgroundColor: colors[index] || '#2196F3'
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  topPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  score: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: {
    width: 40,
    fontSize: 16,
    color: '#666',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  playerScore: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default QuizResults;