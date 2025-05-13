import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Text from '../../components/Text'; // Assuming this is your custom Text component
import { COLORS } from '../../helper/colors'; // Assuming this is your colors helper
import { nw, nh } from '../../helper/scales'; // Assuming these are your scaling helpers
import Ionicons from 'react-native-vector-icons/Ionicons'; // Assuming Ionicons is set up

const QuizInfoModal = ({ visible, onClose, quizInfo }) => {
  // Gracefully handle potentially missing quizInfo or its properties
  const rules = quizInfo?.rules || [];
  const rankWisePrizes = quizInfo?.rankWisePrizes || [];

  // Static instructions, can be moved to a constant if preferred
  const instructions = [
    {
      icon: 'timer-outline',
      text: 'Each question has a time limit. Answer faster for more points!',
    },
    {
      icon: 'checkmark-circle-outline',
      text: 'Correct answers earn points based on your speed.',
    },
    {
      icon: 'star-outline',
      text: 'Compete with others and climb the leaderboard!',
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent // Ensures modal content can go under status bar if needed
    >
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text variant="semibold20" color={COLORS.blue043142}>
                Quiz Information
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={nw(28)} color={COLORS.blue043142} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalContentScrollView}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}>
              
              {/* Rules Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list-outline" size={nw(22)} color={COLORS.yellowF5BE00} />
                  <Text variant="bold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                    Rules
                  </Text>
                </View>
                
                {rules.length > 0 ? (
                  rules.map((rule, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.bulletPoint}>
                        <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text variant="regular14" color={COLORS.blue043142} style={styles.listItemText}>
                        {rule}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="regular14Italic" color={COLORS.grey999999} style={styles.emptyText}>
                    No rules specified for this quiz.
                  </Text>
                )}
              </View>

              {/* Prizes Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy-outline" size={nw(22)} color={COLORS.yellowF5BE00} />
                  <Text variant="bold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                    Prizes
                  </Text>
                </View>
                
                {rankWisePrizes.length > 0 ? (
                  <View style={styles.prizesTable}>
                    <View style={styles.prizeRowHeader}>
                      <Text variant="semibold14" color={COLORS.blue043142} style={styles.rankColumn}>
                        Rank
                      </Text>
                      <Text variant="semibold14" color={COLORS.blue043142} style={styles.rewardColumn}>
                        Reward
                      </Text>
                    </View>
                    
                    {rankWisePrizes.map((prize, index) => (
                      <View key={index} style={styles.prizeRow}>
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
                  </View>
                ) : (
                  <Text variant="regular14Italic" color={COLORS.grey999999} style={styles.emptyText}>
                    No prizes specified for this quiz.
                  </Text>
                )}
              </View>

              {/* How to Play Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="help-circle-outline" size={nw(22)} color={COLORS.yellowF5BE00} />
                  <Text variant="bold18" color={COLORS.blue043142} style={styles.sectionTitle}>
                    How to Play
                  </Text>
                </View>
                
                {instructions.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.bulletPoint, styles.instructionIconContainer]}>
                      <Ionicons name={item.icon} size={nw(18)} color={COLORS.blue043142} />
                    </View>
                    <Text variant="regular14" color={COLORS.blue043142} style={styles.listItemText}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Main modal structure
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay for more focus
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(20), // Ensure modal doesn't touch screen edges
  },
  modalView: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20), // Slightly larger radius
    width: '100%', // Takes full width of centeredView
    maxHeight: '85%', // Adjusted maxHeight
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: nh(4), // Increased shadow offset
    },
    shadowOpacity: 0.15, // Softer shadow
    shadowRadius: nw(10),
    elevation: 8,
    overflow: 'hidden', // Ensures children respect border radius
  },
  
  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(16),
    paddingHorizontal: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyF5F5F5,
  },
  closeButton: {
    padding: nw(5), // Easier to tap
  },

  // Modal Content Area
  modalContentScrollView: {
    flexGrow: 1, // Allows scrollview to take available space
  },
  modalContentContainer: {
    paddingVertical: nh(10), // Padding for top/bottom of scroll content
    paddingHorizontal: nw(20),
  },

  // Reusable Section styles
  section: {
    marginBottom: nh(28), // Increased spacing between sections
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(16), // Increased spacing below header
  },
  sectionTitle: {
    marginLeft: nw(10), // Slightly more space from icon
    // Assuming 'bold18' is a defined variant in your Text component
  },

  // Reusable List Item styles (for Rules & Instructions)
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start for multi-line text
    marginBottom: nh(12),
  },
  bulletPoint: {
    backgroundColor: COLORS.yellowF5BE00,
    width: nw(26),
    height: nw(26),
    borderRadius: nw(13),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
    marginTop: nh(1), // Align with first line of text
  },
  listItemText: {
    flex: 1, // Allow text to wrap
    lineHeight: nh(20), // Improved readability for multi-line text
  },
  emptyText: {
    // Assuming 'regular14Italic' is a defined variant
    marginVertical: nh(10),
    textAlign: 'center',
  },

  // Prizes Section specific styles
  prizesTable: {
    borderWidth: 1,
    borderColor: COLORS.greyF5F5F5,
    borderRadius: nw(8),
    overflow: 'hidden', // Clip rows to border radius
  },
  prizeRowHeader: {
    flexDirection: 'row',
    paddingVertical: nh(10),
    paddingHorizontal: nw(12),
    backgroundColor: COLORS.greyF5F5F5, // Light background for header
  },
  prizeRow: {
    flexDirection: 'row',
    paddingVertical: nh(12),
    paddingHorizontal: nw(12),
    borderTopWidth: 1, // Separator line for items
    borderTopColor: COLORS.greyF5F5F5,
  },
  rankColumn: {
    flex: 3, // Adjusted flex for better balance
    justifyContent: 'center',
  },
  rewardColumn: {
    flex: 2, // Adjusted flex
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // Instructions Section specific styles
  instructionIconContainer: {
    backgroundColor: COLORS.yellowF5BE00_20, // Lighter shade of yellow or a neutral light grey
    // If COLORS.yellowF5BE00_20 is not defined, use something like:
    // backgroundColor: 'rgba(245, 190, 0, 0.15)', 
    // Or a light grey: COLORS.greyF5F5F5
    // Ensure the icon color (COLORS.blue043142) has good contrast
  },
});

export default QuizInfoModal;