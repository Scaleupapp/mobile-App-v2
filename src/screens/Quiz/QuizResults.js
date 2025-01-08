import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const API_URL = 'http://192.168.135.240:3000/api';

const QuizResults = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [results, setResults] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };

  // Get medal color based on rank
  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#E0E0E0'; // Default
    }
  };

  const fetchResults = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(userData);
      
      if (!parsedUser?.token) {
        throw new Error('Authentication token not found');
      }

      // Fetch quiz results
      const response = await axios.get(
        `${API_URL}/quiz/quiz-results/${quizId}`,
        {
          headers: { Authorization: `Bearer ${parsedUser.token}` }
        }
      );

      if (!response.data?.results?.length) {
        throw new Error('No results available');
      }

      // Sort results by rank to ensure proper ordering
      const sortedResults = response.data.results.sort((a, b) => a.rank - b.rank);
      setResults(sortedResults);

      // Get user profile data
      const profileRes = await getProfile('');
      setProfileData(profileRes?.data?.userProfileInfo);

    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error?.response?.data?.message || error.message || 'Failed to load results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchResults();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchResults}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Winners Podium */}
      <View style={styles.podiumContainer}>
        {results.slice(0, 3).map((winner, index) => (
          <View 
            key={winner.userId}
            style={[
              styles.podiumBlock,
              { height: [120, 150, 100][index] }
            ]}
          >
            <Image
              source={{ uri: winner.profilePicture || 'https://via.placeholder.com/50' }}
              style={styles.podiumImage}
            />
            <View style={[styles.medalIcon, { backgroundColor: getMedalColor(index + 1) }]}>
              <Text style={styles.medalText}>{index + 1}</Text>
            </View>
            <Text style={styles.podiumUsername} numberOfLines={1}>
              {winner.username}
            </Text>
            <Text style={styles.podiumScore}>
              {formatNumber(winner.finalScore)}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Detailed Results</Text>
        {results.map((result, index) => (
          <View key={result.userId} style={styles.statCard}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>#{result.rank}</Text>
            </View>
            <Image
              source={{ uri: result.profilePicture || 'https://via.placeholder.com/40' }}
              style={styles.playerImage}
            />
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{result.username}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Score: </Text>
                <Text style={styles.statValue}>{formatNumber(result.finalScore)}</Text>
                <Text style={styles.statLabel}>  •  Correct: </Text>
                <Text style={styles.statValue}>{result.totalCorrectAnswers}</Text>
                <Text style={styles.statLabel}>  •  Time: </Text>
                <Text style={styles.statValue}>{result.totalTimeTaken.toFixed(1)}s</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  podiumBlock: {
    width: 100,
    margin: 5,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 10,
  },
  podiumImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  medalIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  podiumUsername: {
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 12,
  },
  podiumScore: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default QuizResults;