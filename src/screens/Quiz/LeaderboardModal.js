import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Text from '../../components/Text';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.scaleupapp.club/api';

const LeaderboardModal = ({ visible, onClose, quizId }) => {
  const [loading, setLoading] = React.useState(true);
  const [results, setResults] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (visible) {
      fetchLeaderboardData();
    }
  }, [visible]);

  const fetchLeaderboardData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(userData);
      
      const response = await axios.get(
        `${API_URL}/quiz/quiz-results/${quizId}`,
        {
          headers: { Authorization: `Bearer ${parsedUser?.token}` }
        }
      );
      
      // Add winners from quizInfo to results if they exist
      const formattedResults = [];
      const winners = response.data.quizInfo.winners;
      
      if (winners.first) {
        formattedResults.push({
          userId: winners.first.userId,
          rank: 1,
          finalScore: winners.first.totalPoints
        });
      }
      
      if (winners.second) {
        formattedResults.push({
          userId: winners.second.userId,
          rank: 2,
          finalScore: winners.second.totalPoints
        });
      }
      
      if (winners.third) {
        formattedResults.push({
          userId: winners.third.userId,
          rank: 3,
          finalScore: winners.third.totalPoints
        });
      }
      
      console.log('Formatted results:', formattedResults);
      setResults({ results: formattedResults });
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error?.response?.data?.message || 'Failed to fetch leaderboard');
      setLoading(false);
    }
  };

  const renderMedal = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const renderParticipant = (participant, index) => (
    <View key={participant.userId} style={styles.participantRow}>
      <View style={styles.rankContainer}>
        <Text variant="semibold16" color={COLORS.blue043142}>
          {renderMedal(participant.rank) || `#${participant.rank}`}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Image
          source={{ uri: participant.userId.profilePicture }}
          style={styles.profilePic}
        />
        <Text variant="regular16" color={COLORS.blue043142} numberOfLines={1} style={styles.username}>
          {participant.userId.username}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text variant="semibold16" color={COLORS.blue043142}>
          {participant.finalScore.toFixed(1)}
        </Text>
        {participant.additionalPoints > 0 && (
          <Text variant="regular12" color={COLORS.green} style={styles.bonusPoints}>
            +{participant.additionalPoints}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={COLORS.blue043142} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="semibold20" color={COLORS.blue043142}>
              Leaderboard
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text variant="semibold16" color={COLORS.blue043142}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text variant="regular16" color={COLORS.red} style={styles.errorText}>
              {error}
            </Text>
          ) : (
            <ScrollView style={styles.scrollView}>
              {results?.results?.map(renderParticipant)}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: nw(16),
    paddingTop: nh(16),
    paddingBottom: nh(32),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    marginTop: nh(8),
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  rankContainer: {
    width: nw(40),
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(8),
  },
  profilePic: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    marginRight: nw(8),
  },
  username: {
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  bonusPoints: {
    marginTop: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: nh(16),
  },
});

export default LeaderboardModal;