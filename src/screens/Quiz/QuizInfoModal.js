import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Text from '../../components/Text';
import { COLORS } from '../../helper/colors';
import { nw, nh } from '../../helper/scales';
import Ionicons from 'react-native-vector-icons/Ionicons';

const QuizInfoModal = ({ visible, onClose, quizInfo }) => {
  // Handle missing quizInfo gracefully
  const rules = quizInfo?.rules || [];
  const rankWisePrizes = quizInfo?.rankWisePrizes || [];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text variant="semibold20" color={COLORS.blue043142}>
              Quiz Information
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.blue043142} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            
            {/* Rules Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={20} color={COLORS.yellowF5BE00} />
                <Text variant="semibold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                  Rules
                </Text>
              </View>
              
              {rules.length > 0 ? (
                rules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <View style={styles.ruleBullet}>
                      <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="regular14" color={COLORS.blue043142} style={styles.ruleText}>
                      {rule}
                    </Text>
                  </View>
                ))
              ) : (
                <Text variant="regular14" color={COLORS.grey999999} style={styles.emptyText}>
                  No rules specified for this quiz.
                </Text>
              )}
            </View>

            {/* Prizes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={20} color={COLORS.yellowF5BE00} />
                <Text variant="semibold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                  Prizes
                </Text>
              </View>
              
              {rankWisePrizes.length > 0 ? (
                <>
                  <View style={styles.prizeHeader}>
                    <Text variant="semibold14" color={COLORS.blue043142} style={styles.rankColumn}>
                      Rank
                    </Text>
                    <Text variant="semibold14" color={COLORS.blue043142} style={styles.rewardColumn}>
                      Reward
                    </Text>
                  </View>
                  
                  {rankWisePrizes.map((prize, index) => (
                    <View key={index} style={styles.prizeItem}>
                      <View style={styles.rankColumn}>
                        <Text variant="regular14" color={COLORS.blue043142}>
                          {prize.rankStart === prize.rankEnd 
                            ? `Rank ${prize.rankStart}` 
                            : `Rank ${prize.rankStart} - ${prize.rankEnd}`}
                        </Text>
                      </View>
                      <View style={styles.rewardColumn}>
                        <Text variant="semibold14" color={COLORS.greenSuccess}>
                          ₹{prize.reward}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text variant="regular14" color={COLORS.grey999999} style={styles.emptyText}>
                  No prizes specified for this quiz.
                </Text>
              )}
            </View>

            {/* Instructions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle" size={20} color={COLORS.yellowF5BE00} />
                <Text variant="semibold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                  How to Play
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="timer-outline" size={18} color={COLORS.blue043142} />
                </View>
                <Text variant="regular14" color={COLORS.blue043142} style={styles.instructionText}>
                  Each question has a time limit. Answer faster for more points!
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.blue043142} />
                </View>
                <Text variant="regular14" color={COLORS.blue043142} style={styles.instructionText}>
                  Correct answers earn points based on your speed.
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="star-outline" size={18} color={COLORS.blue043142} />
                </View>
                <Text variant="regular14" color={COLORS.blue043142} style={styles.instructionText}>
                  Compete with others and climb the leaderboard!
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyF5F5F5,
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ruleBullet: {
    backgroundColor: COLORS.yellowF5BE00,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  ruleText: {
    flex: 1,
  },
  emptyText: {
    fontStyle: 'italic',
    marginVertical: 5,
  },
  prizeHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyF5F5F5,
  },
  prizeItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyF5F5F5,
  },
  rankColumn: {
    flex: 2,
  },
  rewardColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.greyF5F5F5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
  },
});

export default QuizInfoModal;