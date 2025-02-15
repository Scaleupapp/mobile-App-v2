import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../../helper/colors';
import { DEVICE_HEIGHT, nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';
import axios from 'axios';
import { getProfile } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const API_URL = 'https://api.scaleupapp.club/api';

const QuestionDetails = ({ question, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.questionCard}>
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)}
        style={styles.questionHeader}
      >
        <Text variant="semibold16" color={COLORS.blue043142}>
          Question {index + 1}
        </Text>
        <Icon 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={COLORS.blue043142}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.questionContent}>
          <Text variant="regular16" color={COLORS.blue043142} style={styles.questionText}>
            {question.text}
          </Text>

          {question.relatedTopics && question.relatedTopics.length > 0 && (
            <View style={styles.topicsContainer}>
              {question.relatedTopics.map((topic, i) => (
                <View key={i} style={styles.topicBadge}>
                  <Text variant="regular12" color={COLORS.blue043142}>
                    {topic}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {question.hashtags && question.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {question.hashtags.map((hashtag, i) => (
                <View key={i} style={styles.hashtagBadge}>
                  <Text variant="regular12" color={COLORS.gray666666}>
                    #{hashtag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.optionsContainer}>
            {question.options.map((option, optionIndex) => (
              <View
                key={optionIndex}
                style={[
                  styles.optionItem,
                  option === question.correctAnswer && styles.correctOption
                ]}
              >
                <Text
                  variant="regular14"
                  color={option === question.correctAnswer ? COLORS.whiteFFFFFF : COLORS.blue043142}
                >
                  {`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.correctAnswerContainer}>
            <Text variant="semibold14" color={COLORS.green}>
              Correct Answer: {question.correctAnswer}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const QuizResults = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [results, setResults] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [quizInfo, setQuizInfo] = useState(null);

  const formatNumber = (num) => {
    if (!num) return "0";
    const fixedNum = Number(num).toFixed(2);
    return fixedNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#E0E0E0';
    }
  };

  const fetchResults = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(userData);
      
      if (!parsedUser?.token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(
        `${API_URL}/quiz/quiz-results/${quizId}`,
        {
          headers: { Authorization: `Bearer ${parsedUser.token}` }
        }
      );

      if (!response.data?.results?.length) {
        throw new Error('No results available');
      }

      const sortedResults = response.data.results.sort((a, b) => a.rank - b.rank);
      setResults(sortedResults);
      setQuizInfo(response.data.quizInfo);

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

  const renderQuizInfo = () => {
    if (!quizInfo) return null;

    return (
      <View style={styles.quizInfoContainer}>
        <Text variant="semibold20" color={COLORS.blue043142}>
          {quizInfo.topic}
        </Text>
        <View style={styles.quizMetaContainer}>
          <View style={styles.difficultyBadge}>
            <Text variant="regular12" color={COLORS.blue043142}>
              {quizInfo.difficulty}
            </Text>
          </View>
          {quizInfo.quizTopics?.map((topic, index) => (
            <View key={index} style={styles.topicBadge}>
              <Text variant="regular12" color={COLORS.blue043142}>
                {topic}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <Icon name="alert-circle-outline" size={50} color={COLORS.red} />
          <Text variant="semibold16" color={COLORS.red} style={styles.errorText}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResults}>
            <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderQuizInfo()}

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
                <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="semibold12" color={COLORS.whiteFFFFFF} numberOfLines={1}>
                {winner.username}
              </Text>
              <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
                {formatNumber(winner.finalScore)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <Text variant="semibold20" color={COLORS.blue043142} style={styles.sectionTitle}>
            Detailed Results
          </Text>
          {results.map((result) => (
            <View key={result.userId} style={styles.statCard}>
              <View style={styles.rankContainer}>
                <Text variant="semibold16" color={COLORS.blue043142}>
                  #{result.rank}
                </Text>
              </View>
              <Image
                source={{ uri: result.profilePicture || 'https://via.placeholder.com/40' }}
                style={styles.playerImage}
              />
              <View style={styles.playerDetails}>
                <Text variant="semibold16" color={COLORS.blue043142}>
                  {result.username}
                </Text>
                <View style={styles.statsRow}>
                  <Text variant="regular12" color={COLORS.gray666666}>Score: </Text>
                  <Text variant="semibold12" color={COLORS.blue043142}>{formatNumber(result.finalScore)}</Text>
                  <Text variant="regular12" color={COLORS.gray666666}>  •  Correct: </Text>
                  <Text variant="semibold12" color={COLORS.blue043142}>{result.totalCorrectAnswers}</Text>
                  <Text variant="regular12" color={COLORS.gray666666}>  •  Time: </Text>
                  <Text variant="semibold12" color={COLORS.blue043142}>{result.totalTimeTaken.toFixed(1)}s</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.questionsContainer}>
          <Text variant="semibold20" color={COLORS.blue043142} style={styles.sectionTitle}>
            Quiz Questions
          </Text>
          {results[0]?.questions.map((question, index) => (
            <QuestionDetails
              key={question._id}
              question={question}
              index={index}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      
      <View style={styles.headerContainer}>
        <Header
          title="Quiz Results"
          onBackPress={() => navigation.navigate('QuizList')}
        />
      </View>
      
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          {renderContent()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  headerContainer: {
    paddingTop: nh(10),
    paddingBottom: nh(10),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(26),
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
    paddingTop: nh(20),
  },
  scrollContent: {
    flex: 1,
  },
  quizInfoContainer: {
    padding: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayEEEEEE,
  },
  quizMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(8),
  },
  difficultyBadge: {
    backgroundColor: COLORS.blueF5F8FF,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nh(4),
    marginRight: nw(8),
    marginBottom: nh(8),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: nw(20),
    backgroundColor: COLORS.whiteFFFFFF,
    marginBottom: nh(10),
  },
  podiumBlock: {
    width: nw(100),
    margin: nw(5),
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(10),
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: nw(10),
  },
  podiumImage: {
    width: nw(60),
    height: nh(60),
    borderRadius: nh(30),
    borderWidth: 2,
    borderColor: COLORS.whiteFFFFFF,
  },
  medalIcon: {
    position: 'absolute',
    top: nh(10),
    right: nw(10),
    width: nw(24),
    height: nh(24),
    borderRadius: nh(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    padding: nw(16),
  },
  sectionTitle: {
    marginBottom: nh(10),
  },
  statsContainer: {
    padding: nw(16),
  },
  sectionTitle: {
    marginBottom: nh(10),
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(12),
    borderRadius: nh(10),
    marginBottom: nh(10),
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  rankContainer: {
    width: nw(32),
    height: nh(32),
    backgroundColor: 'rgba(4, 49, 66, 0.1)',
    borderRadius: nh(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
    flexShrink: 0,
  },
  playerImage: {
    width: nw(32),
    height: nh(32),
    borderRadius: nh(16),
    marginRight: nw(8),
    flexShrink: 0,
  },
  playerDetails: {
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  statsRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(4),
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: nw(4),
  },
  errorText: {
    marginTop: nh(10),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: nh(20),
    padding: nw(10),
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(5),
  },
  questionsContainer: {
    padding: nw(16),
    marginTop: nh(10),
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(8),
    marginBottom: nh(16),
    padding: nw(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionContent: {
    marginTop: nh(16),
  },
  questionText: {
    marginBottom: nh(16),
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(12),
  },
  topicBadge: {
    backgroundColor: COLORS.blueF5F8FF,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nh(4),
    marginRight: nw(8),
    marginBottom: nh(8),
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(16),
  },
  hashtagBadge: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    marginRight: nw(8),
    marginBottom: nh(8),
  },
  optionsContainer: {
    marginBottom: nh(16),
  },
  optionItem: {
    padding: nw(12),
    borderRadius: nh(8),
    marginBottom: nh(8),
    backgroundColor: COLORS.grayF8F8F8,
    borderWidth: 1,
    borderColor: COLORS.grayEEEEEE,
  },
  correctOption: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  correctAnswerContainer: {
    padding: nw(12),
    backgroundColor: COLORS.greenLight,
    borderRadius: nh(8),
  },
});

export default QuizResults;