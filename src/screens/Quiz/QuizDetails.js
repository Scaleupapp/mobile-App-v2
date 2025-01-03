import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { format } from 'date-fns';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.scaleupapp.club/api';

const QuizDetails = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [quiz, setQuiz] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const profileRes = await getProfile('');
        const profile = profileRes?.data?.userProfileInfo;
        setProfileData(profile);

        const userData = await AsyncStorage.getItem('userData');
        const parsedUser = JSON.parse(userData);

        if (profile?.id) {
          const response = await axios.get(
            `${API_URL}/quiz/list`,
            {
              headers: { Authorization: `Bearer ${parsedUser?.token}` }
            }
          );
          const foundQuiz = response.data.quizzes.find(q => q._id === quizId);
          if (foundQuiz) {
            setQuiz(foundQuiz);
          } else {
            setError('Quiz not found');
          }
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

  const handleJoinQuiz = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.token) {
        throw new Error('Profile data not available');
      }

      await axios.post(
        `${API_URL}/quiz/join`,
        { quizId },
        { headers: { Authorization: `Bearer ${parsedUser?.token}` }}
      );
      
      Alert.alert(
        'Success',
        'You have successfully joined the quiz!',
        [{ text: 'OK', onPress: () => navigation.navigate('QuizWaitingRoom', { quizId }) }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join quiz');
    }
  };

  const navigateToWaitingRoom = () => {
    navigation.navigate('QuizWaitingRoom', { quizId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
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

  if (!quiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.noQuizText}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.topic}>{quiz.topic}</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Difficulty:</Text>
        <Text style={styles.value}>{quiz.difficulty}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Start Time:</Text>
        <Text style={styles.value}>
          {format(new Date(quiz.startTime), 'PPp')}
        </Text>
      </View>
      {quiz.isPaid && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Entry Fee:</Text>
          <Text style={styles.value}>₹{quiz.entryFee}</Text>
        </View>
      )}
      <View style={styles.prizeContainer}>
        <Text style={styles.prizeTitle}>Prize Distribution</Text>
        <Text style={styles.prizeText}>1st Place: {quiz.prizeDistribution.firstPlace}%</Text>
        <Text style={styles.prizeText}>2nd Place: {quiz.prizeDistribution.secondPlace}%</Text>
        <Text style={styles.prizeText}>3rd Place: {quiz.prizeDistribution.thirdPlace}%</Text>
      </View>
      
      {!quiz.isRegistered ? (
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={handleJoinQuiz}
        >
          <Text style={styles.joinButtonText}>Join Quiz</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.joinButton, { backgroundColor: '#4CAF50' }]}
          onPress={navigateToWaitingRoom}
        >
          <Text style={styles.joinButtonText}>Go to Waiting Room</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  topic: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    width: 100,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  prizeContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  prizeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  prizeText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  noQuizText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  }
});

export default QuizDetails;