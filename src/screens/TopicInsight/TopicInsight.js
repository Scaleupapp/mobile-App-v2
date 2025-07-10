import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Components & Services
import Text from '../../components/Text';
import Header from '../../components/Header';
import {COLORS} from '../../helper/colors';
import {
  getDetailedInsightApi,
  setLearningGoalApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import mixpanel from '../../helper/mixpanelClient';

const {width, height} = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

// Progress Step Component
const ProgressStep = ({step, index, isLast}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.progressStep, {opacity: fadeAnim}]}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
            {step.order}
          </Text>
        </View>
        <View style={styles.stepContent}>
          <Text variant="semibold15" color={COLORS.blue043142}>
            {step.title}
          </Text>
          <Text
            variant="regular13"
            color={COLORS.grey777777}
            style={styles.stepTime}>
            {step.estimatedTime}
          </Text>
        </View>
      </View>

      <Text
        variant="regular14"
        color={COLORS.grey333333}
        style={styles.stepDescription}>
        {step.description}
      </Text>

      {step.resources && step.resources.length > 0 && (
        <View style={styles.resourcesContainer}>
          <Text
            variant="semibold12"
            color={COLORS.blue043142}
            style={styles.resourcesLabel}>
            Resources:
          </Text>
          {step.resources.slice(0, 2).map((resource, idx) => (
            <TouchableOpacity key={idx} style={styles.resourceLink}>
              <MaterialIcons name="link" size={14} color={COLORS.blue043142} />
              <Text
                variant="regular12"
                color={COLORS.blue043142}
                numberOfLines={1}
                style={styles.resourceText}>
                Learning Resource {idx + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isLast && <View style={styles.stepConnector} />}
    </Animated.View>
  );
};

// Practice Question Component
const PracticeQuestion = ({question, index, onAnswer}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSelect = answer => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
    onAnswer?.(answer === question.correctAnswer);
  };

  const getOptionColor = option => {
    if (!showExplanation) return COLORS.greyF7F7F7;
    if (option === question.correctAnswer) return COLORS.greenSuccess + '15';
    if (option === selectedAnswer && option !== question.correctAnswer)
      return COLORS.redError + '15';
    return COLORS.greyF7F7F7;
  };

  const getOptionBorderColor = option => {
    if (!showExplanation) return COLORS.greyD6D6D6;
    if (option === question.correctAnswer) return COLORS.greenSuccess;
    if (option === selectedAnswer && option !== question.correctAnswer)
      return COLORS.redError;
    return COLORS.greyD6D6D6;
  };

  return (
    <View style={styles.practiceQuestion}>
      <View style={styles.questionHeader}>
        <Text variant="semibold14" color={COLORS.blue043142}>
          Practice Question {index + 1}
        </Text>
        <View
          style={[
            styles.difficultyBadge,
            styles[`difficulty${question.difficulty}`],
          ]}>
          <Text variant="semibold11" color={COLORS.whiteFFFFFF}>
            {question.difficulty}
          </Text>
        </View>
      </View>

      <Text
        variant="regular14"
        color={COLORS.grey333333}
        style={styles.questionText}>
        {question.questionText}
      </Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionButton,
              {
                backgroundColor: getOptionColor(option),
                borderColor: getOptionBorderColor(option),
              },
            ]}
            onPress={() => handleAnswerSelect(option)}
            disabled={showExplanation}>
            <Text
              variant="regular13"
              color={
                showExplanation && option === question.correctAnswer
                  ? COLORS.greenSuccess
                  : COLORS.grey333333
              }>
              {option}
            </Text>
            {showExplanation && option === question.correctAnswer && (
              <MaterialIcons
                name="check-circle"
                size={18}
                color={COLORS.greenSuccess}
              />
            )}
            {showExplanation &&
              option === selectedAnswer &&
              option !== question.correctAnswer && (
                <MaterialIcons
                  name="cancel"
                  size={18}
                  color={COLORS.redError}
                />
              )}
          </TouchableOpacity>
        ))}
      </View>

      {showExplanation && (
        <View style={styles.explanationContainer}>
          <Text
            variant="semibold13"
            color={COLORS.blue043142}
            style={styles.explanationLabel}>
            Explanation:
          </Text>
          <Text variant="regular13" color={COLORS.grey333333}>
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

// Memory Aid Component
const MemoryAidSection = ({memoryAids}) => {
  if (
    !memoryAids ||
    (!memoryAids.mnemonics?.length &&
      !memoryAids.quickTips?.length &&
      !memoryAids.visualAids?.length)
  ) {
    return null;
  }

  return (
    <View style={styles.memoryAidSection}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="psychology" size={20} color={COLORS.purple} />
        <Text
          variant="semibold16"
          color={COLORS.blue043142}
          style={{marginLeft: 8}}>
          Memory Aids
        </Text>
      </View>

      {memoryAids.mnemonics?.length > 0 && (
        <View style={styles.memoryAidGroup}>
          <Text variant="semibold14" color={COLORS.purple}>
            🧠 Mnemonics
          </Text>
          {memoryAids.mnemonics.map((mnemonic, idx) => (
            <Text
              key={idx}
              variant="regular13"
              color={COLORS.grey333333}
              style={styles.memoryAidItem}>
              • {mnemonic}
            </Text>
          ))}
        </View>
      )}

      {memoryAids.quickTips?.length > 0 && (
        <View style={styles.memoryAidGroup}>
          <Text variant="semibold14" color={COLORS.purple}>
            💡 Quick Tips
          </Text>
          {memoryAids.quickTips.map((tip, idx) => (
            <Text
              key={idx}
              variant="regular13"
              color={COLORS.grey333333}
              style={styles.memoryAidItem}>
              • {tip}
            </Text>
          ))}
        </View>
      )}

      {memoryAids.visualAids?.length > 0 && (
        <View style={styles.memoryAidGroup}>
          <Text variant="semibold14" color={COLORS.purple}>
            🎨 Visual Aids
          </Text>
          {memoryAids.visualAids.map((aid, idx) => (
            <Text
              key={idx}
              variant="regular13"
              color={COLORS.grey333333}
              style={styles.memoryAidItem}>
              • {aid}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Main Component
const TopicInsight = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {topic, basicInsight, patternData} = route.params;

  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [practiceProgress, setPracticeProgress] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    strategy: true,
    practice: false,
    memory: false,
    notes: false,
  });

  useEffect(() => {
    fetchDetailedInsight();
  }, [topic]);

  const fetchDetailedInsight = async () => {
    try {
      setLoading(true);
      const response = await getDetailedInsightApi(topic);
      setInsight(response.data);
    } catch (error) {
      console.error('Error fetching detailed insight:', error);
      Alert.alert('Error', 'Failed to load detailed insight');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePracticeAnswer = (questionIndex, isCorrect) => {
    setPracticeProgress(prev => ({
      ...prev,
      [questionIndex]: isCorrect,
    }));
  };

  const renderCollapsibleSection = (title, sectionKey, children, icon) => (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}>
        <View style={styles.collapsibleHeaderLeft}>
          <MaterialIcons name={icon} size={20} color={COLORS.blue043142} />
          <Text
            variant="semibold16"
            color={COLORS.blue043142}
            style={{marginLeft: 8}}>
            {title}
          </Text>
        </View>
        <MaterialIcons
          name={expandedSections[sectionKey] ? 'expand-less' : 'expand-more'}
          size={24}
          color={COLORS.grey777777}
        />
      </TouchableOpacity>

      {expandedSections[sectionKey] && (
        <View style={styles.collapsibleContent}>{children}</View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={topic} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text
            variant="regular14"
            color={COLORS.grey777777}
            style={{marginTop: 16}}>
            Generating AI insights...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!insight) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title={topic} />
        <View style={styles.errorContainer}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={COLORS.redError}
          />
          <Text
            variant="semibold16"
            color={COLORS.redError}
            style={{marginTop: 16}}>
            Failed to load insight
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text variant="semibold14" color={COLORS.blue043142}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const detailedInsight = insight.detailedInsight;
  const practiceCorrect =
    Object.values(practiceProgress).filter(Boolean).length;
  const practiceTotal = Object.keys(practiceProgress).length;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={topic}
        rightComponent={
          <TouchableOpacity style={styles.headerAction}>
            <MaterialIcons
              name="bookmark-border"
              size={24}
              color={COLORS.blue043142}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Topic Overview */}
        {renderCollapsibleSection(
          'Topic Overview',
          'overview',
          <View>
            <Text
              variant="regular14"
              color={COLORS.grey333333}
              style={styles.overviewContent}>
              {detailedInsight?.topicOverview?.content ||
                'Overview content not available.'}
            </Text>

            {detailedInsight?.topicOverview?.keyPoints?.length > 0 && (
              <View style={styles.keyPointsContainer}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.keyPointsLabel}>
                  Key Points:
                </Text>
                {detailedInsight.topicOverview.keyPoints.map((point, idx) => (
                  <Text
                    key={idx}
                    variant="regular13"
                    color={COLORS.grey333333}
                    style={styles.keyPoint}>
                    • {point}
                  </Text>
                ))}
              </View>
            )}

            {patternData && (
              <View style={styles.patternDataOverview}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.patternLabel}>
                  Your Performance:
                </Text>
                <View style={styles.patternStats}>
                  <View style={styles.patternStat}>
                    <Text
                      variant="bold16"
                      color={
                        patternData.accuracy > 70
                          ? COLORS.greenSuccess
                          : COLORS.orange
                      }>
                      {patternData.accuracy}%
                    </Text>
                    <Text variant="regular11" color={COLORS.grey777777}>
                      Accuracy
                    </Text>
                  </View>
                  <View style={styles.patternStat}>
                    <Text variant="bold16" color={COLORS.blue043142}>
                      {patternData.averageTime}s
                    </Text>
                    <Text variant="regular11" color={COLORS.grey777777}>
                      Avg Time
                    </Text>
                  </View>
                  <View style={styles.patternStat}>
                    <Text
                      variant="bold16"
                      color={
                        patternData.trajectory === 'improving'
                          ? COLORS.greenSuccess
                          : patternData.trajectory === 'declining'
                          ? COLORS.redError
                          : COLORS.grey777777
                      }>
                      {patternData.trajectory || 'Stable'}
                    </Text>
                    <Text variant="regular11" color={COLORS.grey777777}>
                      Trend
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>,
          'info',
        )}

        {/* Improvement Strategy */}
        {renderCollapsibleSection(
          'Improvement Strategy',
          'strategy',
          <View>
            <View style={styles.strategyHeader}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Total Estimated Time:{' '}
                {detailedInsight?.improvementStrategy?.totalEstimatedTime ||
                  'Variable'}
              </Text>
              <Text variant="regular12" color={COLORS.grey777777}>
                {detailedInsight?.improvementStrategy?.difficultyProgression ||
                  'Progressive learning approach'}
              </Text>
            </View>

            {detailedInsight?.improvementStrategy?.steps?.map((step, index) => (
              <ProgressStep
                key={index}
                step={step}
                index={index}
                isLast={
                  index === detailedInsight.improvementStrategy.steps.length - 1
                }
              />
            ))}
          </View>,
          'trending-up',
        )}

        {/* Practice Questions */}
        {renderCollapsibleSection(
          `Practice Questions ${
            practiceTotal > 0 ? `(${practiceCorrect}/${practiceTotal})` : ''
          }`,
          'practice',
          <View>
            {detailedInsight?.practiceQuestions?.map((question, index) => (
              <PracticeQuestion
                key={index}
                question={question}
                index={index}
                onAnswer={isCorrect => handlePracticeAnswer(index, isCorrect)}
              />
            ))}

            {practiceTotal > 0 && (
              <View style={styles.practiceProgress}>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  Progress: {practiceCorrect}/{practiceTotal} correct (
                  {Math.round((practiceCorrect / practiceTotal) * 100)}%)
                </Text>
              </View>
            )}
          </View>,
          'quiz',
        )}

        {/* Memory Aids */}
        {renderCollapsibleSection(
          'Memory Aids',
          'memory',
          <MemoryAidSection memoryAids={detailedInsight?.memoryAids} />,
          'psychology',
        )}

        {/* Revision Notes */}
        {renderCollapsibleSection(
          'Revision Notes',
          'notes',
          <View>
            <Text
              variant="regular14"
              color={COLORS.grey333333}
              style={styles.revisionSummary}>
              {detailedInsight?.revisionNotes?.summary ||
                'Revision summary not available.'}
            </Text>

            {detailedInsight?.revisionNotes?.mustRemember?.length > 0 && (
              <View style={styles.mustRememberContainer}>
                <Text
                  variant="semibold14"
                  color={COLORS.redError}
                  style={styles.mustRememberLabel}>
                  Must Remember:
                </Text>
                {detailedInsight.revisionNotes.mustRemember.map((item, idx) => (
                  <Text
                    key={idx}
                    variant="regular13"
                    color={COLORS.grey333333}
                    style={styles.mustRememberItem}>
                    🔥 {item}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.quickRecapContainer}>
              <Text
                variant="semibold14"
                color={COLORS.blue043142}
                style={styles.quickRecapLabel}>
                Quick Recap:
              </Text>
              <Text variant="regular13" color={COLORS.grey333333}>
                {detailedInsight?.revisionNotes?.quickRecap ||
                  'Quick recap not available.'}
              </Text>
            </View>
          </View>,
          'note',
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => {
              mixpanel.track(`Click on View Vault  Practice More`);
              navigation.navigate(Routes.QuizList);
            }}>
            <MaterialIcons name="quiz" size={18} color={COLORS.whiteFFFFFF} />
            <Text
              variant="semibold14"
              color={COLORS.whiteFFFFFF}
              style={{marginLeft: 8}}>
              Practice More
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              mixpanel.track(`Click on View Vault Button`);
              navigation.navigate(Routes.LearningVault);
            }}>
            <MaterialIcons
              name="bookmark"
              size={18}
              color={COLORS.blue043142}
            />
            <Text
              variant="semibold14"
              color={COLORS.blue043142}
              style={{marginLeft: 8}}>
              View Vault
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.blue043142 + '15',
  },
  headerAction: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Collapsible Section Styles
  collapsibleSection: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.greyF7F7F7 + '50',
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsibleContent: {
    padding: 16,
    paddingTop: 0,
  },

  // Overview Styles
  overviewContent: {
    lineHeight: 22,
    marginBottom: 16,
  },
  keyPointsContainer: {
    marginBottom: 16,
  },
  keyPointsLabel: {
    marginBottom: 8,
  },
  keyPoint: {
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 20,
  },
  patternDataOverview: {
    backgroundColor: COLORS.blue043142 + '08',
    borderRadius: 12,
    padding: 16,
  },
  patternLabel: {
    marginBottom: 12,
  },
  patternStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  patternStat: {
    alignItems: 'center',
  },

  // Strategy Styles
  strategyHeader: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: COLORS.yellowF5BE00 + '08',
    borderRadius: 8,
  },
  progressStep: {
    marginBottom: 24,
    position: 'relative',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue043142,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTime: {
    marginTop: 2,
  },
  stepDescription: {
    marginLeft: 44,
    lineHeight: 20,
    marginBottom: 12,
  },
  resourcesContainer: {
    marginLeft: 44,
  },
  resourcesLabel: {
    marginBottom: 6,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resourceText: {
    marginLeft: 6,
    flex: 1,
  },
  stepConnector: {
    position: 'absolute',
    left: 15,
    top: 40,
    bottom: -8,
    width: 2,
    backgroundColor: COLORS.greyD6D6D6,
  },

  // Practice Question Styles
  practiceQuestion: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyeasy: {
    backgroundColor: COLORS.greenSuccess,
  },
  difficultymedium: {
    backgroundColor: COLORS.orange,
  },
  difficultyhard: {
    backgroundColor: COLORS.redError,
  },
  questionText: {
    lineHeight: 20,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
  },
  explanationLabel: {
    marginBottom: 6,
  },
  practiceProgress: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.greenSuccess + '08',
    borderRadius: 8,
    alignItems: 'center',
  },

  // Memory Aid Styles
  memoryAidSection: {
    gap: 16,
  },
  memoryAidGroup: {
    marginBottom: 12,
  },
  memoryAidItem: {
    marginLeft: 8,
    marginTop: 4,
    lineHeight: 18,
  },

  // Revision Notes Styles
  revisionSummary: {
    lineHeight: 20,
    marginBottom: 16,
  },
  mustRememberContainer: {
    marginBottom: 16,
  },
  mustRememberLabel: {
    marginBottom: 8,
  },
  mustRememberItem: {
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
  quickRecapContainer: {
    padding: 12,
    backgroundColor: COLORS.blue043142 + '08',
    borderRadius: 8,
  },
  quickRecapLabel: {
    marginBottom: 8,
  },

  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.blue043142,
  },
  secondaryButton: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
});

export default TopicInsight;
