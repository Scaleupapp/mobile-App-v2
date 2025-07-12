// components/AIStudyBuddy/AIStudyBuddyIntegrationFlows.js
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../Text';
import Button from '../Button';
import Routes from '../../helper/routes';
import {useToast} from '../CustomToast';

// Import AI Study Buddy API services
import {
  aiStudyBuddyGenerateFlashcardsApi,
  aiStudyBuddyGenerateQuizApi,
  formatAiStudyBuddyError,
  isAiStudyBuddyUpgradeRequired,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddyIntegrationFlows = ({
  sessionId,
  sessionData,
  navigation,
  onSuccess,
  onClose,
}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // State management
  const [activeFlow, setActiveFlow] = useState(null); // 'flashcards' | 'quiz' | null
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: options, 2: generating, 3: success

  // Flashcard generation state
  const [flashcardOptions, setFlashcardOptions] = useState({
    cardCount: 10,
    deckName: '',
    topics: [],
    difficulty: 'mixed',
  });

  // Quiz generation state
  const [quizOptions, setQuizOptions] = useState({
    questionCount: 15,
    quizTitle: '',
    topics: [],
    difficulty: 'mixed',
  });

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Generated content state
  const [generatedContent, setGeneratedContent] = useState(null);

  useEffect(() => {
    if (activeFlow) {
      startEntranceAnimation();
    }
  }, [activeFlow]);

  // Start entrance animation
  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Close modal with animation
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveFlow(null);
      setStep(1);
      setGeneratedContent(null);
      onClose?.();
    });
  };

  // Generate flashcards
  const generateFlashcards = async () => {
    try {
      setLoading(true);
      setStep(2);

      const payload = {
        cardCount: flashcardOptions.cardCount,
        deckName:
          flashcardOptions.deckName ||
          `${sessionData?.subject || 'Study'} Flashcards`,
        topics: flashcardOptions.topics,
        sessionId: sessionId,
      };

      const response = await aiStudyBuddyGenerateFlashcardsApi(
        sessionId,
        payload,
      );

      if (response.data.success) {
        setGeneratedContent(response.data);
        setStep(3);

        showToast({
          title: `Generated ${response.data.cardsCreated} flashcards successfully!`,
          type: 'success',
        });

        // Call success callback
        onSuccess?.('flashcards', response.data);
      }
    } catch (error) {
      console.error('Generate flashcards error:', error);

      if (isAiStudyBuddyUpgradeRequired(error)) {
        showUpgradeModal('flashcard generation');
      } else {
        showToast({
          message: formatAiStudyBuddyError(error),
          type: 'error',
        });
      }
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Generate quiz
  const generateQuiz = async () => {
    try {
      setLoading(true);
      setStep(2);

      const payload = {
        questionCount: quizOptions.questionCount,
        quizTitle:
          quizOptions.quizTitle || `${sessionData?.subject || 'Study'} Quiz`,
        topics: quizOptions.topics,
        difficulty: quizOptions.difficulty,
        sessionId: sessionId,
      };

      const response = await aiStudyBuddyGenerateQuizApi(sessionId, payload);

      if (response.data.success) {
        setGeneratedContent(response.data);
        setStep(3);

        showToast({
          title: `Generated ${response.data.questionsCreated} questions successfully!`,
          type: 'success',
        });

        // Call success callback
        onSuccess?.('quiz', response.data);
      }
    } catch (error) {
      console.error('Generate quiz error:', error);

      if (isAiStudyBuddyUpgradeRequired(error)) {
        showUpgradeModal('quiz generation');
      } else {
        showToast({
          title: formatAiStudyBuddyError(error),
          type: 'error',
        });
      }
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade modal
  const showUpgradeModal = feature => {
    Alert.alert(
      'Upgrade to Pro',
      `${feature} is a Pro feature. Upgrade to unlock unlimited access.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Upgrade Now',
          onPress: () => navigation.navigate(Routes.AIStudyBuddyUpgrade),
        },
      ],
    );
  };

  // Get extracted topics from session
  const getExtractedTopics = () => {
    if (!sessionData?.learningContext?.topicsDiscussed) return [];
    return sessionData.learningContext.topicsDiscussed.slice(-5); // Last 5 topics
  };

  // Render floating action buttons
  const renderFloatingButtons = () => {
    if (activeFlow) return null;

    return (
      <View style={styles.floatingButtons}>
        <Pressable
          style={[styles.floatingButton, {backgroundColor: '#6366F1'}]}
          onPress={() => setActiveFlow('flashcards')}>
          <Icon name="style" size={20} color="white" />
          <Text style={styles.floatingButtonText}>Flashcards</Text>
        </Pressable>

        <Pressable
          style={[styles.floatingButton, {backgroundColor: '#10B981'}]}
          onPress={() => setActiveFlow('quiz')}>
          <Icon name="quiz" size={20} color="white" />
          <Text style={styles.floatingButtonText}>Quiz</Text>
        </Pressable>
      </View>
    );
  };

  // Render flashcard options
  const renderFlashcardOptions = () => (
    <View style={styles.optionsContainer}>
      <View style={styles.modalHeader}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.headerIcon}>
            <Icon name="style" size={24} color="white" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.modalTitle}>Generate Flashcards</Text>
            <Text style={styles.modalSubtitle}>
              Create flashcards from this conversation
            </Text>
          </View>
        </View>
        <Pressable style={styles.closeButton} onPress={closeModal}>
          <Icon name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.optionsContent}
        showsVerticalScrollIndicator={false}>
        {/* Card Count */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Number of Cards</Text>
          <View style={styles.cardCountOptions}>
            {[5, 10, 15, 20].map(count => (
              <Pressable
                key={count}
                style={[
                  styles.countOption,
                  flashcardOptions.cardCount === count &&
                    styles.countOptionActive,
                ]}
                onPress={() =>
                  setFlashcardOptions(prev => ({...prev, cardCount: count}))
                }>
                <Text
                  style={[
                    styles.countText,
                    flashcardOptions.cardCount === count &&
                      styles.countTextActive,
                  ]}>
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Deck Name */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Deck Name (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`${sessionData?.subject || 'Study'} Flashcards`}
            value={flashcardOptions.deckName}
            onChangeText={text =>
              setFlashcardOptions(prev => ({...prev, deckName: text}))
            }
            maxLength={50}
          />
        </View>

        {/* Topics Selection */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Topics Discussed</Text>
          <Text style={styles.optionDescription}>
            Select specific topics to focus on (leave empty for all topics)
          </Text>
          <View style={styles.topicsContainer}>
            {getExtractedTopics().map((topic, index) => (
              <Pressable
                key={index}
                style={[
                  styles.topicChip,
                  flashcardOptions.topics.includes(topic) &&
                    styles.topicChipActive,
                ]}
                onPress={() => {
                  setFlashcardOptions(prev => ({
                    ...prev,
                    topics: prev.topics.includes(topic)
                      ? prev.topics.filter(t => t !== topic)
                      : [...prev.topics, topic],
                  }));
                }}>
                <Text
                  style={[
                    styles.topicChipText,
                    flashcardOptions.topics.includes(topic) &&
                      styles.topicChipTextActive,
                  ]}>
                  {topic}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            onPress={closeModal}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title="Generate Flashcards"
            onPress={generateFlashcards}
            style={styles.generateButton}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );

  // Render quiz options
  const renderQuizOptions = () => (
    <View style={styles.optionsContainer}>
      <View style={styles.modalHeader}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.headerIcon}>
            <Icon name="quiz" size={24} color="white" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.modalTitle}>Generate Quiz</Text>
            <Text style={styles.modalSubtitle}>
              Create a quiz from this conversation
            </Text>
          </View>
        </View>
        <Pressable style={styles.closeButton} onPress={closeModal}>
          <Icon name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.optionsContent}
        showsVerticalScrollIndicator={false}>
        {/* Question Count */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Number of Questions</Text>
          <View style={styles.cardCountOptions}>
            {[10, 15, 20, 25].map(count => (
              <Pressable
                key={count}
                style={[
                  styles.countOption,
                  quizOptions.questionCount === count &&
                    styles.countOptionActive,
                ]}
                onPress={() =>
                  setQuizOptions(prev => ({...prev, questionCount: count}))
                }>
                <Text
                  style={[
                    styles.countText,
                    quizOptions.questionCount === count &&
                      styles.countTextActive,
                  ]}>
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quiz Title */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Quiz Title (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`${sessionData?.subject || 'Study'} Quiz`}
            value={quizOptions.quizTitle}
            onChangeText={text =>
              setQuizOptions(prev => ({...prev, quizTitle: text}))
            }
            maxLength={50}
          />
        </View>

        {/* Difficulty Level */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Difficulty Level</Text>
          <View style={styles.difficultyOptions}>
            {[
              {value: 'easy', label: 'Easy', color: '#10B981'},
              {value: 'medium', label: 'Medium', color: '#F59E0B'},
              {value: 'hard', label: 'Hard', color: '#EF4444'},
              {value: 'mixed', label: 'Mixed', color: '#6366F1'},
            ].map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.difficultyOption,
                  quizOptions.difficulty === option.value && [
                    styles.difficultyOptionActive,
                    {borderColor: option.color},
                  ],
                ]}
                onPress={() =>
                  setQuizOptions(prev => ({...prev, difficulty: option.value}))
                }>
                <Text
                  style={[
                    styles.difficultyText,
                    quizOptions.difficulty === option.value && {
                      color: option.color,
                    },
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Topics Selection */}
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Topics Discussed</Text>
          <Text style={styles.optionDescription}>
            Select specific topics to focus on (leave empty for all topics)
          </Text>
          <View style={styles.topicsContainer}>
            {getExtractedTopics().map((topic, index) => (
              <Pressable
                key={index}
                style={[
                  styles.topicChip,
                  quizOptions.topics.includes(topic) && styles.topicChipActive,
                ]}
                onPress={() => {
                  setQuizOptions(prev => ({
                    ...prev,
                    topics: prev.topics.includes(topic)
                      ? prev.topics.filter(t => t !== topic)
                      : [...prev.topics, topic],
                  }));
                }}>
                <Text
                  style={[
                    styles.topicChipText,
                    quizOptions.topics.includes(topic) &&
                      styles.topicChipTextActive,
                  ]}>
                  {topic}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            onPress={closeModal}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title="Generate Quiz"
            onPress={generateQuiz}
            style={styles.generateButton}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );

  // Render generating state
  const renderGeneratingState = () => (
    <View style={styles.generatingContainer}>
      <LinearGradient
        colors={
          activeFlow === 'flashcards'
            ? ['#6366F1', '#8B5CF6']
            : ['#10B981', '#059669']
        }
        style={styles.generatingContent}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.generatingTitle}>
          {activeFlow === 'flashcards'
            ? 'Generating Flashcards...'
            : 'Generating Quiz...'}
        </Text>
        <Text style={styles.generatingSubtitle}>
          Our AI is analyzing your conversation and creating personalized
          content
        </Text>
      </LinearGradient>
    </View>
  );

  // Render success state
  const renderSuccessState = () => (
    <View style={styles.successContainer}>
      <View style={styles.successContent}>
        <LinearGradient
          colors={
            activeFlow === 'flashcards'
              ? ['#6366F1', '#8B5CF6']
              : ['#10B981', '#059669']
          }
          style={styles.successIcon}>
          <Icon name="check" size={32} color="white" />
        </LinearGradient>

        <Text style={styles.successTitle}>
          {activeFlow === 'flashcards'
            ? 'Flashcards Created!'
            : 'Quiz Created!'}
        </Text>

        <Text style={styles.successDescription}>
          {activeFlow === 'flashcards'
            ? `Successfully generated ${
                generatedContent?.cardsCreated || 0
              } flashcards`
            : `Successfully generated ${
                generatedContent?.questionsCreated || 0
              } questions`}
        </Text>

        <View style={styles.successActions}>
          <Button
            title={
              activeFlow === 'flashcards' ? 'Study Flashcards' : 'Take Quiz'
            }
            onPress={() => {
              closeModal();
              if (activeFlow === 'flashcards') {
                navigation.navigate(Routes.DeckDetails, {
                  deckId: generatedContent?.deckId,
                });
              } else {
                navigation.navigate(Routes.QuizScreen, {
                  quizId: generatedContent?.quizId,
                });
              }
            }}
            style={styles.primaryAction}
          />

          <Button
            title="Close"
            onPress={closeModal}
            style={styles.secondaryAction}
            textStyle={styles.secondaryActionText}
          />
        </View>
      </View>
    </View>
  );

  // Render modal content based on step
  const renderModalContent = () => {
    switch (step) {
      case 1:
        return activeFlow === 'flashcards'
          ? renderFlashcardOptions()
          : renderQuizOptions();
      case 2:
        return renderGeneratingState();
      case 3:
        return renderSuccessState();
      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      {renderFloatingButtons()}

      {/* Modal */}
      <Modal
        visible={activeFlow !== null}
        transparent
        animationType="none"
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={closeModal} />

          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            {renderModalContent()}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Floating Buttons
  floatingButtons: {
    position: 'absolute',
    bottom: nh(20),
    right: nw(20),
    gap: nh(12),
    zIndex: 1000,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: nw(8),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: nw(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(2),
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: nw(4),
  },

  // Options Content
  optionsContainer: {
    flex: 1,
  },
  optionsContent: {
    flex: 1,
    padding: nw(20),
  },
  optionGroup: {
    marginBottom: nh(24),
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: nh(8),
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: nh(12),
  },

  // Text Input
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: nw(12),
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },

  // Count Options
  cardCountOptions: {
    flexDirection: 'row',
    gap: nw(12),
  },
  countOption: {
    flex: 1,
    paddingVertical: nh(12),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  countOptionActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F115',
  },
  countText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  countTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Difficulty Options
  difficultyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  difficultyOption: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(8),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
  },
  difficultyOptionActive: {
    borderWidth: 2,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Topics
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  topicChip: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  topicChipActive: {
    backgroundColor: '#6366F1',
  },
  topicChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  topicChipTextActive: {
    color: '#FFFFFF',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: nw(12),
    marginTop: nh(20),
    paddingBottom: nh(20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  generateButton: {
    flex: 2,
  },

  // Generating State
  generatingContainer: {
    height: nh(300),
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingContent: {
    padding: nw(40),
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: nw(20),
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  generatingSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },

  // Success State
  successContainer: {
    height: nh(400),
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    padding: nw(20),
  },
  successIcon: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(20),
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(8),
  },
  successDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: nh(32),
  },
  successActions: {
    width: '100%',
    gap: nh(12),
  },
  primaryAction: {
    width: '100%',
  },
  secondaryAction: {
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  secondaryActionText: {
    color: '#6B7280',
  },
});

export default AIStudyBuddyIntegrationFlows;
