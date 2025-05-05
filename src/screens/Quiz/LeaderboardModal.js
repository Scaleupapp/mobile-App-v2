import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {
  getUserRankingApi,
  getDetailedResultsApi,
  getLatestQuizAttemptIdApi,
} from '../../services/apiService';

const {width, height} = Dimensions.get('window');

const TABS = {
  VIEW_RANK: 'View Rank',
  QUIZ_DETAILS: 'Quiz Details',
};

const LeaderboardModal = ({visible, onClose, quizId}) => {
  const [leaders, setLeaders] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.VIEW_RANK);

  useEffect(() => {
    const fetchAttemptId = async () => {
      if (visible && quizId) {
        try {
          const response = await getLatestQuizAttemptIdApi(quizId);
          setAttemptId(response.data.attemptId);
        } catch (error) {
          console.error('Error fetching latest attempt ID:', error);
        }
      }
    };

    fetchAttemptId();
  }, [visible, quizId]);

  useEffect(() => {
    if (visible && quizId && attemptId) {
      fetchLeaderboardData();
      fetchDetailedResults();
    }
  }, [visible, quizId, attemptId]);

  const fetchLeaderboardData = async () => {
    try {
      const response = await getUserRankingApi(quizId);
      setLeaders(response.data.leaders);
      setUserRanking(response.data.userRanking);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchDetailedResults = async () => {
    try {
      const response = await getDetailedResultsApi(quizId, attemptId);
      setDetailedResults(response.data);
    } catch (error) {
      console.error('Error fetching detailed results:', error);
    }
  };

  const setUserData = userId => {
    onClose(); // Close the modal first
    navigationRef.navigate(Routes.OtherProfile, {
      id: userId,
    });
  };

  const renderLeaderboard = () => (
    <View style={styles.leaderboardContainer}>
      <Text variant="semibold16" style={styles.sectionTitle}>
        Leaderboard
      </Text>

      {detailedResults && (
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text variant="semibold16" style={styles.scoreLabel}>
              Total Score
            </Text>
            <Text variant="bold18" style={styles.scoreValue}>
              {detailedResults.totalScore.toFixed(2)} pts
            </Text>
          </View>
          <View style={styles.rankBox}>
            <Text variant="semibold16" style={styles.rankLabel}>
              Final Rank
            </Text>
            <Text variant="bold18" style={styles.rankValue}>
              {detailedResults.finalRank}
            </Text>
          </View>
        </View>
      )}

      {leaders.map((leader, index) => (
        <TouchableOpacity
          key={leader.userId}
          style={[
            styles.leaderRow,
            userRanking === leader.rank && styles.userRankHighlight,
          ]}
          onPress={() => setUserData(leader.userId)}>
          <View style={styles.leaderProfile}>
            <Image
              source={{uri: leader.profilePicture}}
              style={styles.profilePicture}
            />
            <Text variant="regular14" style={{color: 'black'}}>
              {leader.rank}. {leader.username}
            </Text>
          </View>
          <Text variant="semibold14" style={{color: 'black'}}>
            {leader.score.toFixed(2)} pts
          </Text>
        </TouchableOpacity>
      ))}

      {/* Last Place User */}
      {/* {leaders.length > 10 && (
        <TouchableOpacity 
          style={styles.lastPlaceContainer}
          onPress={() => setUserData(leaders[leaders.length - 1].userId)}
        >
          <Text variant="regular14" style={{ color: 'black' }}>
            Last Place (500th)
          </Text>
          <View style={styles.leaderProfile}>
            <Image 
              source={{ uri: leaders[leaders.length - 1].profilePicture }} 
              style={styles.profilePicture} 
            />
            <Text variant="regular14" style={{ color: 'black' }}>
              {leaders[leaders.length - 1].username}
            </Text>
          </View>
          <Text variant="semibold14" style={{ color: 'black' }}>
            {leaders[leaders.length - 1].score.toFixed(2)} pts
          </Text>
        </TouchableOpacity>
      )} */}

      {userRanking && (
        <Text variant="regular14" style={styles.userRankText}>
          Your Rank: {userRanking}
        </Text>
      )}
    </View>
  );

  const renderDetailedQuizResults = () => {
    if (!detailedResults) return null;

    return (
      <View style={styles.detailsContainer}>
        <Text variant="semibold16" style={styles.sectionTitle}>
          Quiz Details
        </Text>
        {detailedResults.detailedAnswers.slice(0, -1).map((answer, index) => {
          return (
            <View
              key={`${answer.questionId}-${index}`}
              style={styles.questionCard}>
              <Text variant="semibold14" style={styles.questionText}>
                {index + 1}. {answer.questionText}
              </Text>
              <View style={styles.optionsContainer}>
                {answer.options.map((option, i) => {
                  return (
                    <Text
                      key={`${answer.questionId}-${option}`}
                      variant="regular14"
                      style={[
                        styles.optionText,

                        ((i == 0 && answer.selectedOption == 'A') ||
                          (i == 1 && answer.selectedOption == 'B') ||
                          (i == 2 && answer.selectedOption == 'C') ||
                          (i == 3 && answer.selectedOption == 'D')) &&
                          styles.correctAnswerStyle,
                      ]}>
                      {option}{' '}
                      {(i == 0 && answer.selectedOption == 'A') ||
                      (i == 1 && answer.selectedOption == 'B') ||
                      (i == 2 && answer.selectedOption == 'C') ||
                      (i == 3 && answer.selectedOption == 'D')
                        ? answer?.correctAnswer == option
                          ? '✅'
                          : '❌'
                        : null}
                    </Text>
                  );
                })}
              </View>
              <Text variant="regular12" color={COLORS.blue043142}>
                {'Correct Answer'}{' '}
                <Text variant="regular12" color={COLORS.black333333}>
                  - {answer.correctAnswer}
                </Text>
              </Text>
              <View style={styles.metadataContainer}>
                <Text variant="regular12" style={{color: 'black'}}>
                  Time Taken: {answer.timeTaken} seconds
                </Text>
                <Text
                  variant="regular12"
                  style={
                    answer.isCorrect ? styles.correctText : styles.incorrectText
                  }>
                  {answer?.selectedOption == 'skip' ? 'Not attempted' : null}
                </Text>
              </View>
              {answer.relatedTopics && (
                <View style={styles.tagsContainer}>
                  <Text variant="regular12" style={styles.tagTitle}>
                    Related Topics:
                  </Text>
                  {answer.relatedTopics.map(topic => (
                    <Text
                      key={`${answer.questionId}-${topic}`}
                      variant="regular12"
                      style={styles.tagText}>
                      {topic}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text variant="semibold16" color={COLORS.grey999999}>
              Close
            </Text>
          </TouchableOpacity>

          <View style={styles.tabContainer}>
            {Object.values(TABS).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}>
                <Text
                  variant={activeTab === tab ? 'semibold14' : 'regular14'}
                  color={
                    activeTab === tab ? COLORS.yellowF5BE00 : COLORS.grey999999
                  }>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView>
            {activeTab === TABS.VIEW_RANK
              ? renderLeaderboard()
              : renderDetailedQuizResults()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.greyF5F5F5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 16,
    width: width, // Use full device width
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: width / 2, // Divide width equally between two tabs
    alignItems: 'center', // Center tab text
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.yellowF5BE00,
  },
  leaderboardContainer: {
    backgroundColor: COLORS.greyF5F5F5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    color: COLORS.blue043142,
  },
  summaryContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: COLORS.blue043142,
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.blue043142,
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    color: COLORS.blue043142,
  },
  userRankHighlight: {
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 8,
    color: COLORS.blue043142,
  },
  userRankText: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
    color: 'black',
  },
  leaderboardContainer: {
    backgroundColor: COLORS.greyF5F5F5, // Light background
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    color: 'black',
  },
  sectionTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    color: COLORS.blue043142,
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    color: 'black',
  },
  userRankHighlight: {
    backgroundColor: COLORS.greyEEEEEE, // Soft highlight
    borderRadius: 8,
    color: 'black',
  },
  userRankText: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
    color: 'black',
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF, // White background
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    marginBottom: 12,
    color: COLORS.blue043142,
  },
  optionsContainer: {
    marginBottom: 12,
    backgroundColor: COLORS.greyF5F5F5,
    borderRadius: 8,
    padding: 8,
  },
  optionText: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    color: 'black',
  },
  selectedOptionStyle: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)', // Soft blue
    color: COLORS.blue043142,
  },
  correctAnswerStyle: {
    color: COLORS.greenSuccess,
    fontWeight: '600',
    color: COLORS.blue043142,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  correctText: {
    color: 'green',
  },
  incorrectText: {
    color: 'red',
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'black',
  },
  tagText: {
    marginRight: 8,
    color: COLORS.blue043142,
  },
  leaderProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  lastPlaceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    color: 'black',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  scoreBox: {
    backgroundColor: COLORS.blue043142,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  rankBox: {
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  scoreLabel: {
    color: COLORS.whiteFFFFFF,
    marginBottom: 6,
  },
  scoreValue: {
    color: COLORS.whiteFFFFFF,
  },
  rankLabel: {
    color: COLORS.blue043142,
    marginBottom: 6,
  },
  rankValue: {
    color: COLORS.blue043142,
  },
});

export default LeaderboardModal;
