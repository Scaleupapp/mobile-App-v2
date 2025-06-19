import {useState, useEffect, useCallback, useRef} from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Text from '../../components/Text';
import moment from 'moment';
import {COLORS} from '../../helper/colors';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {
  getUserRankingApi,
  getDetailedResultsApi,
  getLatestQuizAttemptIdApi,
  explainAnswerApi,
  getExplanationQuotaApi,
} from '../../services/apiService';
import Share from 'react-native-share';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from '../../helper/icon';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

const TABS = {
  VIEW_RANK: 'Leaderboard',
  QUIZ_DETAILS: 'My Answers',
};



// Explanation Quota Banner Component
const QuotaBanner = ({ quota, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);


 

 
};

// Explanation Card Component
const ExplanationCard = ({ explanation, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Animated.View 
      style={[
        styles.explanationOverlay,
        { transform: [{ translateY: slideAnim }] }
      ]}>
      <View style={styles.explanationCard}>
        <View style={styles.explanationHeader}>
          <View style={styles.explanationTitleContainer}>
            <MaterialIcons name="lightbulb" size={24} color={COLORS.yellowF5BE00} />
            <Text variant="semibold16" color={COLORS.blue043142} style={{marginLeft: 8}}>
              AI Explanation
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.explanationCloseBtn}>
            <Ionicons name="close-circle" size={28} color={COLORS.grey999999} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.explanationContent} showsVerticalScrollIndicator={false}>
          {/* Core Explanation */}
          <View style={styles.explanationSection}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionHeader}>
              Understanding the Concept
            </Text>
            <Text variant="regular14" color={COLORS.darkGrey333333} style={styles.explanationText}>
              {explanation.explanation?.core || explanation.core}
            </Text>
          </View>

          {/* Why Correct */}
          <View style={styles.explanationSection}>
            <View style={styles.correctHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.greenSuccess} />
              <Text variant="semibold14" color={COLORS.greenSuccess} style={{marginLeft: 6}}>
                Why This Answer is Correct
              </Text>
            </View>
            <Text variant="regular14" color={COLORS.darkGrey333333} style={styles.explanationText}>
              {explanation.explanation?.whyCorrect || explanation.whyCorrect}
            </Text>
          </View>

          {/* Why Incorrect (if user was wrong) */}
          {(explanation.explanation?.whyIncorrect || explanation.whyIncorrect) && (
            <View style={styles.explanationSection}>
              <View style={styles.incorrectHeader}>
                <Ionicons name="close-circle" size={20} color={COLORS.redError} />
                <Text variant="semibold14" color={COLORS.redError} style={{marginLeft: 6}}>
                  Why Your Answer Was Wrong
                </Text>
              </View>
              <Text variant="regular14" color={COLORS.darkGrey333333} style={styles.explanationText}>
                {explanation.explanation?.whyIncorrect || explanation.whyIncorrect}
              </Text>
            </View>
          )}

          {/* Key Takeaway */}
          <View style={[styles.explanationSection, styles.takeawaySection]}>
            <MaterialIcons name="star" size={20} color={COLORS.yellowF5BE00} />
            <Text variant="semibold14" color={COLORS.blue043142} style={{marginLeft: 8}}>
              Key Takeaway
            </Text>
          </View>
          <Text variant="regular14" color={COLORS.blue043142} style={[styles.explanationText, {fontWeight: '500'}]}>
            {explanation.explanation?.keyTakeaway || explanation.keyTakeaway}
          </Text>

          {/* Memory Tip */}
          {(explanation.memoryTip || explanation.explanation?.memoryTip) && (
            <View style={styles.memoryTipContainer}>
              <MaterialIcons name="psychology" size={20} color={COLORS.blue043142} />
              <Text variant="regular13" color={COLORS.blue043142} style={{marginLeft: 8, flex: 1}}>
                💡 <Text variant="semibold13">Memory Tip:</Text> {explanation.memoryTip || explanation.explanation?.memoryTip}
              </Text>
            </View>
          )}

          {/* Related Topics */}
          {(explanation.relatedTopics || explanation.explanation?.relatedTopics) && (explanation.relatedTopics || explanation.explanation?.relatedTopics).length > 0 && (
            <View style={styles.explanationSection}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionHeader}>
                Related Topics to Study
              </Text>
              <View style={styles.relatedTopicsContainer}>
                {(explanation.relatedTopics || explanation.explanation?.relatedTopics).map((topic, idx) => (
                  <View key={idx} style={styles.relatedTopicChip}>
                    <Text variant="regular12" color={COLORS.blue043142}>
                      {topic}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Saved Info */}
          <View style={styles.savedInfoContainer}>
            <MaterialIcons name="bookmark" size={16} color={COLORS.yellowF5BE00} />
            <Text variant="regular12" color={COLORS.grey999999} style={{marginLeft: 6}}>
              This explanation is saved in your Learning Vault
            </Text>
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const LeaderboardModal = ({visible, onClose, quizId}) => {
  const [leaders, setLeaders] = useState([]);
  const [userRankData, setUserRankData] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.VIEW_RANK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef();

  // New state for explanations
  const [explanations, setExplanations] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState({});
  const [quota, setQuota] = useState(null);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState(null);

  const getInitials = (username) => {
    if (!username) {
      console.log('No username provided, returning ??');
      return '??';
    }
    
    const nameParts = username.split(' ').filter(part => part.length > 0);
    console.log('Name parts:', nameParts);
    
    if (nameParts.length >= 2) {
      const initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[1].charAt(0).toUpperCase()}`;
      console.log('Two+ parts initials:', initials);
      return initials;
    } else if (nameParts.length === 1) {
      const name = nameParts[0];
      const initials = name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.charAt(0).toUpperCase();
      console.log('Single part initials:', initials);
      return initials;
    }
    
    console.log('Fallback to ??');
    return '??';
  };

  const takeScreenShot = () => {
    ref.current.capture().then(uri => {
      console.log({uri});
      shareToWhatsApp(uri);
    });
  };

  const shareToWhatsApp = async imagePath => {
    try {
      const shareOptions = {
        title: 'Share via',
        url: imagePath,
        type: 'image/png',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.log('Error sharing to WhatsApp', error);
    }
  };

  const resetState = () => {
    setLeaders([]);
    setUserRankData(null);
    setDetailedResults(null);
    setAttemptId(null);
    setIsLoading(false);
    setError(null);
    setExplanations({});
    setLoadingExplanation({});
    setSelectedExplanation(null);
  };

  useEffect(() => {
    if (visible) {
      fetchAttemptIdAndData();
    } else {
      resetState();
    }
  }, [visible, quizId]);

  useEffect(() => {
    if (activeTab === TABS.QUIZ_DETAILS && visible) {
      fetchQuota();
    }
  }, [activeTab, visible]);

  const fetchQuota = async () => {
    try {
      const response = await getExplanationQuotaApi();
      setQuota(response.data);
      if (response.data.quotaStatus.remaining > 0) {
        setShowQuotaBanner(true);
        setTimeout(() => setShowQuotaBanner(false), 5000);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const fetchAttemptIdAndData = async () => {
    if (!quizId) return;
    setIsLoading(true);
    setError(null);
    try {
      const attemptResponse = await getLatestQuizAttemptIdApi(quizId);
      const currentAttemptId = attemptResponse.data.attemptId;
      setAttemptId(currentAttemptId);

      if (currentAttemptId) {
        await Promise.all([
          fetchLeaderboardData(quizId),
          fetchDetailedResults(quizId, currentAttemptId),
        ]);
      } else {
        await fetchLeaderboardData(quizId);
        console.warn(
          "Could not find user's attempt ID for detailed results for quiz:",
          quizId,
        );
      }
    } catch (err) {
      console.error('Error fetching initial modal data:', err);
      setError('Could not load details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboardData = async currentQuizId => {
    try {
      const response = await getUserRankingApi(currentQuizId);
      const allLeaders = response.data.leaders || [];
      setLeaders(allLeaders);

      const userRankingApiResponse = response.data.userRanking;
      let finalUserRankData = null;

      if (userRankingApiResponse) {
        if (
          userRankingApiResponse.username &&
          (userRankingApiResponse.profilePicture !== undefined ||
            userRankingApiResponse.profilePicture === null) &&
          userRankingApiResponse.score !== undefined &&
          userRankingApiResponse.rank !== undefined
        ) {
          finalUserRankData = userRankingApiResponse;
        } else {
          const userInLeadersList = allLeaders.find(
            leader => leader.rank === userRankingApiResponse.rank,
          );
          if (userInLeadersList) {
            finalUserRankData = userInLeadersList;
          } else {
            finalUserRankData = {
              rank: userRankingApiResponse.rank,
              score: userRankingApiResponse.score,
              username: 'You',
              profilePicture: null,
            };
          }
        }
      }
      setUserRankData(finalUserRankData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      if (!detailedResults && !error) setError('Could not load leaderboard.');
    }
  };

  const fetchDetailedResults = async (currentQuizId, currentAttemptId) => {
    try {
      const response = await getDetailedResultsApi(
        currentQuizId,
        currentAttemptId,
      );
      setDetailedResults(response.data);
    } catch (err) {
      console.error('Error fetching detailed results:', err);
      if (!leaders.length && !error) setError('Could not load your answers.');
    }
  };

  const navigateToUserProfile = userId => {
    if (!userId) {
      console.warn('Navigate to user profile called with no userId');
      return;
    }
    onClose();
    if (navigationRef.isReady()) {
      navigationRef.navigate(Routes.OtherProfile, {id: userId});
    } else {
      console.warn('Navigation is not ready to navigate to user profile.');
    }
  };

  const getMedalColor = rank => {
    if (rank === 1) return COLORS.yellowF5BE00;
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return COLORS.blue043142;
  };

  const handleExplainAnswer = async (questionId, answer) => {
    if (!quota || quota.quotaStatus.remaining === 0) {
      Alert.alert(
        'No Explanations Left',
        `You've used all 3 free explanations for today. They will reset at midnight.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoadingExplanation(prev => ({ ...prev, [questionId]: true }));

    try {
      const response = await explainAnswerApi({
        questionId,
        userAnswer: answer.selectedOption,
        attemptId,
      });

      const explanationData = response.data.explanation;
      setExplanations(prev => ({ ...prev, [questionId]: explanationData }));
      setSelectedExplanation(explanationData);
      
      setQuota(prev => ({
        ...prev,
        quotaStatus: {
          ...prev.quotaStatus,
          remaining: response.data.remaining,
        },
      }));

      // Don't show alert, just let the explanation slide up

    } catch (error) {
      console.error('Error getting explanation:', error);
      Alert.alert(
        'Error',
        'Could not generate explanation. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingExplanation(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const renderLeaderboard = () => {
    if (isLoading && !leaders.length && !userRankData) {
      return (
        <ActivityIndicator
          size="large"
          color={COLORS.yellowF5BE00}
          style={styles.loader}
        />
      );
    }

    if (error && !leaders.length && !userRankData) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    const topThree = leaders.slice(0, 3);
    const बाकीLeaders = leaders.slice(3);

    return (
      <View style={styles.contentContainer}>
        <ViewShot
          ref={ref}
          style={{flex: 1, backgroundColor: COLORS.whiteFFFFFF}}>
          {userRankData && (
            <View style={styles.userPerformanceCard}>
              <View style={styles.userPerformanceHeader}>
                {(() => {
                  console.log('=== USER PERFORMANCE PROFILE DEBUG ===');
                  console.log('userRankData:', userRankData);
                  console.log('userRankData.profilePicture:', userRankData.profilePicture);
                  
                  const hasValidProfilePic = userRankData.profilePicture && 
                                            userRankData.profilePicture !== 'default-profile-pic-url' &&
                                            userRankData.profilePicture.trim() !== '' &&
                                            userRankData.profilePicture !== 'null' &&
                                            userRankData.profilePicture !== 'undefined';
                  
                  console.log('hasValidProfilePic:', hasValidProfilePic);
                  
                  if (hasValidProfilePic) {
                    return (
                      <Image
                        source={{uri: userRankData.profilePicture}}
                        style={styles.userPerformanceProfilePic}
                        onError={e => {
                          console.log('=== IMAGE LOAD ERROR ===');
                          console.log('Error loading user profile image:', e.nativeEvent.error);
                        }}
                        onLoad={() => {
                          console.log('=== IMAGE LOADED SUCCESSFULLY ===');
                        }}
                      />
                    );
                  } else {
                    const initials = getInitials(userRankData.username);
                    console.log('Showing initials instead:', initials);
                    return (
                      <View style={[
                        styles.userPerformanceProfilePic,
                        {
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: COLORS.greyD6D6D6,
                        },
                      ]}>
                        <Text variant="semibold16" color={COLORS.black333333}>
                          {initials}
                        </Text>
                      </View>
                    );
                  }
                })()}
                <View style={{flex: 1}}>
                  <Text
                    variant="semibold16"
                    color={COLORS.blue043142}
                    numberOfLines={1}>
                    {userRankData.username || 'Your Performance'}
                  </Text>
                  <Text variant="regular12" color={COLORS.grey999999}>
                    Quiz Score & Rank
                  </Text>
                </View>
              </View>
              <View style={styles.userPerformanceStats}>
                <View style={styles.statBox}>
                  <Text variant="bold20" color={COLORS.blue043142}>
                    {detailedResults?.totalScore?.toFixed(2) ||
                      userRankData.score?.toFixed(2) ||
                      'N/A'}
                  </Text>
                  <Text variant="regular12" color={COLORS.grey999999}>
                    Total Score
                  </Text>
                </View>
                <View style={styles.statBoxSeparator} />
                <View style={styles.statBox}>
                  <Text variant="bold20" color={COLORS.blue043142}>
                    #{userRankData.rank || detailedResults?.finalRank || 'N/A'}
                  </Text>
                  <Text variant="regular12" color={COLORS.grey999999}>
                    Your Rank
                  </Text>
                </View>
              </View>
            </View>
          )}

          {topThree.length > 0 && (
            <View style={styles.podiumContainer}>
              <Text variant="semibold18" style={styles.sectionTitle}>
                Top Rankers
              </Text>
              <View style={styles.podiumRow}>
                {[
                  topThree.find(l => l.rank === 2),
                  topThree.find(l => l.rank === 1),
                  topThree.find(l => l.rank === 3),
                ].map((leader, index) => {
                  if (!leader)
                    return (
                      <View
                        key={`podium-empty-${index}`}
                        style={styles.podiumItemPlaceholder}
                      />
                    );
                  const medalColor = getMedalColor(leader.rank);
                  const isFirstPlace = leader.rank === 1;
                  let podiumItemSpecificStyle = isFirstPlace
                    ? styles.podiumItemFirst
                    : leader.rank === 2
                    ? styles.podiumItemSecond
                    : styles.podiumItemThird;

                  return (
                    <TouchableOpacity
                      key={leader.userId || `podium-${leader.rank}`}
                      style={[styles.podiumItem, podiumItemSpecificStyle]}
                      onPress={() => navigateToUserProfile(leader.userId)}>
                      <View style={styles.podiumProfilePicContainer}>
                        {leader.profilePicture && leader.profilePicture !== 'default-profile-pic-url' ? (
                          <Image
                            source={{uri: leader.profilePicture}}
                            style={[styles.podiumProfilePic, isFirstPlace && styles.podiumProfilePicFirst]}
                            onError={e => console.log('Error loading podium profile image:', e.nativeEvent.error)}
                          />
                        ) : (
                          (() => {
                            const initials = getInitials(leader.username);
                            return (
                              <View style={[
                                styles.podiumProfilePic,
                                isFirstPlace && styles.podiumProfilePicFirst,
                                {
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: COLORS.blue043142,
                                },
                              ]}>
                                <Text 
                                  variant={isFirstPlace ? 'bold16' : 'bold14'}
                                  color={COLORS.whiteFFFFFF}
                                  style={{textAlign: 'center'}}>
                                  {initials}
                                </Text>
                              </View>
                            );
                          })()
                        )}
                        {leader.rank <= 3 && (
                          <View
                            style={[
                              styles.medalIconContainer,
                              {
                                backgroundColor: medalColor,
                                borderColor: COLORS.whiteFFFFFF,
                                borderWidth: isFirstPlace ? 2 : 1,
                              },
                            ]}>
                            <Ionicons
                              name="medal"
                              size={isFirstPlace ? 16 : 12}
                              color={COLORS.whiteFFFFFF}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        variant={isFirstPlace ? 'semibold14' : 'semibold12'}
                        color={COLORS.blue043142}
                        numberOfLines={1}
                        style={styles.podiumUsername}>
                        {leader.username}
                      </Text>
                      <Text
                        variant={isFirstPlace ? 'bold14' : 'regular12'}
                        style={{
                          color: medalColor,
                          fontWeight: isFirstPlace ? '700' : '500',
                        }}>
                        Rank {leader.rank}
                      </Text>
                      <Text
                        variant="semibold12"
                        color={COLORS.grey999999}
                        style={{marginTop: 2}}>
                        {leader.score?.toFixed(2)} pts
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ViewShot>
        {बाकीLeaders.length > 0 && (
          <>
            <Text
              variant="semibold16"
              style={[styles.sectionTitle, {marginTop: 20, marginBottom: 10}]}>
              Full Leaderboard
            </Text>
            {बाकीLeaders.map(leader => (
              <TouchableOpacity
                key={leader.userId || `leader-${leader.rank}`}
                style={[
                  styles.leaderRow,
                  userRankData &&
                    userRankData.rank === leader.rank &&
                    styles.userRankHighlight,
                ]}
                onPress={() => navigateToUserProfile(leader.userId)}>
                <View style={styles.leaderInfo}>
                  <Text
                    variant="semibold14"
                    color={COLORS.blue043142}
                    style={styles.leaderRank}>
                    {leader.rank}.
                  </Text>
                  {leader.profilePicture && leader.profilePicture !== 'default-profile-pic-url' ? (
                    <Image
                      source={{uri: leader.profilePicture}}
                      style={styles.leaderProfilePic}
                      onError={e => console.log('Error loading leader row profile image:', e.nativeEvent.error)}
                    />
                  ) : (
                    (() => {
                      const initials = getInitials(leader.username);
                      return (
                        <View style={[
                          styles.leaderProfilePic,
                          {
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.blue043142,
                          },
                        ]}>
                          <Text 
                            variant="bold12"
                            color={COLORS.whiteFFFFFF}
                            style={{textAlign: 'center'}}>
                            {initials}
                          </Text>
                        </View>
                      );
                    })()
                  )}
                  <Text
                    variant="regular14"
                    color={COLORS.darkGrey333333}
                    numberOfLines={1}
                    style={{flexShrink: 1}}>
                    {leader.username}
                  </Text>
                </View>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  {leader.score?.toFixed(2)} pts
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {leaders.length === 0 && !isLoading && (
          <Text style={styles.emptyListText}>
            Leaderboard data is not available yet.
          </Text>
        )}
        {leaders.length > 0 &&
          topThree.length === 0 &&
          बाकीLeaders.length === 0 &&
          !isLoading && (
            <Text style={styles.emptyListText}>
              Leaderboard data is available but could not be displayed.
            </Text>
          )}
      </View>
    );
  };

  const renderDetailedQuizResults = () => {
    if (isLoading && !detailedResults) {
      return (
        <ActivityIndicator
          size="large"
          color={COLORS.yellowF5BE00}
          style={styles.loader}
        />
      );
    }
    if (!detailedResults) {
      return (
        <Text style={styles.errorText}>
          {error || 'Your detailed answers are not available yet.'}
        </Text>
      );
    }

    const quizEndTime = moment(detailedResults.quizEndTime);
    const currentTime = moment();

    if (currentTime.isBefore(quizEndTime)) {
      return (
        <View style={styles.waitMessageContainer}>
          <Ionicons name="time-outline" size={48} color={COLORS.yellowF5BE00} />
          <Text variant="semibold16" style={styles.waitMessage}>
            Answers Revealed After Quiz Ends
          </Text>
          <Text variant="regular14" style={styles.waitTimeText}>
            Please check back after {quizEndTime.format('MMM DD, hh:mm A')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Quota Banner */}
        {showQuotaBanner && quota && (
          <QuotaBanner 
            quota={quota} 
            onClose={() => setShowQuotaBanner(false)} 
          />
        )}

        {/* Quota Status Pill with Learning Vault Link */}
        {quota && (
          <View style={styles.quotaHeaderContainer}>
            <TouchableOpacity 
              style={styles.quotaStatusPill}
              onPress={() => setShowQuotaBanner(!showQuotaBanner)}>
              <MaterialIcons 
                name="auto-awesome" 
                size={16} 
                color={quota.quotaStatus.remaining > 0 ? COLORS.yellowF5BE00 : COLORS.grey999999} 
              />
              <Text 
                variant="regular12" 
                color={quota.quotaStatus.remaining > 0 ? COLORS.blue043142 : COLORS.grey999999}
                style={{marginLeft: 4}}>
                {quota.quotaStatus.remaining} AI explanations left today • Reset at midnight !
              </Text>
  
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.learningVaultBtn}
              onPress={() => {
                onClose();
                navigationRef.navigate(Routes.LearningVault); // You'll need to add this route
              }}>
              <MaterialIcons name="collections-bookmark" size={16} color={COLORS.blue043142} />
              <Text variant="regular12" color={COLORS.blue043142} style={{marginLeft: 4}}>
                Learning Vault
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(detailedResults.detailedAnswers || []).map((answer, index) => {
          if (index === 0) {
            console.log(
              'Detailed Answer Object (Structure Check):',
              JSON.stringify(answer, null, 2),
            );
          }

          const questionId = answer.questionId;
          const hasExplanation = explanations[questionId];
          const isLoadingThis = loadingExplanation[questionId];
          const selectedOptionChar = answer.selectedOption;
          const correctAnswerText = answer.correctAnswer;
          const isAnswerCorrectBoolean =
            typeof answer.isCorrect === 'boolean' ? answer.isCorrect : null;

          return (
            <View key={answer.questionId || index} style={styles.questionCard}>
              <View style={styles.questionHeaderRow}>
                <Text variant="semibold14" style={styles.questionText}>
                  {index + 1}. {answer.questionText}
                </Text>
                {hasExplanation && (
                  <View style={styles.savedIndicator}>
                    <MaterialIcons name="bookmark" size={16} color={COLORS.yellowF5BE00} />
                  </View>
                )}
              </View>
              <View style={styles.optionsContainer}>
                {(answer.options || []).map((optionText, i) => {
                  const optionChar = String.fromCharCode(65 + i);

                  const isUserSelectedOption =
                    optionChar === selectedOptionChar;
                  const isThisOptionTheCorrectOne =
                    optionText === correctAnswerText;

                  let optionStyle = [styles.optionText];
                  let icon = null;

                  if (isUserSelectedOption) {
                    if (isThisOptionTheCorrectOne) {
                      icon = (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.greenSuccess}
                          style={styles.optionIcon}
                        />
                      );
                      optionStyle.push(styles.correctSelectedOptionText);
                    } else {
                      icon = (
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={COLORS.redError}
                          style={styles.optionIcon}
                        />
                      );
                      optionStyle.push(styles.incorrectSelectedOptionText);
                    }
                  } else if (isThisOptionTheCorrectOne) {
                    optionStyle.push(styles.correctOptionHighlightStyle);
                    icon = (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={COLORS.greenSuccess}
                        style={styles.optionIcon}
                      />
                    );
                  }

                  return (
                    <View
                      key={`opt-q${answer.questionId}-i${i}`}
                      style={styles.optionRow}>
                      <Text variant="regular14" style={optionStyle}>
                        {optionChar}. {optionText}
                      </Text>
                      {icon}
                    </View>
                  );
                })}
              </View>

              {correctAnswerText &&
                selectedOptionChar !== 'skip' &&
                answer.options.find(
                  opt =>
                    String.fromCharCode(65 + answer.options.indexOf(opt)) ===
                    selectedOptionChar,
                ) !== correctAnswerText && (
                  <Text
                    variant="regular12"
                    color={COLORS.blue043142}
                    style={styles.correctAnswerDisplay}>
                    Correct Answer:{' '}
                    <Text variant="semibold12" color={COLORS.greenSuccess}>
                      {correctAnswerText}
                    </Text>
                  </Text>
                )}

              {selectedOptionChar === 'skip' && (
                <Text
                  variant="regular12Italic"
                  color={COLORS.grey999999}
                  style={styles.skippedText}>
                  You skipped this question.
                </Text>
              )}
              {!correctAnswerText && selectedOptionChar !== 'skip' && (
                <Text
                  variant="regular12Italic"
                  color={COLORS.grey999999}
                  style={styles.skippedText}>
                  Correct answer information not available for this question.
                </Text>
              )}

              <View style={styles.questionFooter}>
                <View style={styles.metadataContainer}>
                  <Text variant="regular12" color={COLORS.darkGrey333333}>
                    Time Taken: {answer.timeTaken ?? 'N/A'}s
                  </Text>
                  {selectedOptionChar !== 'skip' ? (
                    isAnswerCorrectBoolean !== null ? (
                      <Text
                        variant="semibold12"
                        style={
                          isAnswerCorrectBoolean
                            ? styles.correctText
                            : styles.incorrectText
                        }>
                        {isAnswerCorrectBoolean ? 'Correct' : 'Incorrect'}
                      </Text>
                    ) : correctAnswerText ? (
                      <Text
                        variant="semibold12"
                        style={
                          answer.options.find(
                            opt =>
                              String.fromCharCode(
                                65 + answer.options.indexOf(opt),
                              ) === selectedOptionChar,
                          ) === correctAnswerText
                            ? styles.correctText
                            : styles.incorrectText
                        }>
                        {answer.options.find(
                          opt =>
                            String.fromCharCode(
                              65 + answer.options.indexOf(opt),
                            ) === selectedOptionChar,
                        ) === correctAnswerText
                          ? 'Correct'
                          : 'Incorrect'}
                      </Text>
                    ) : null
                  ) : null}
                </View>

                {/* AI Explanation Button */}
                {selectedOptionChar !== 'skip' && (
                  <TouchableOpacity
                    style={[
                      styles.explainButton,
                      hasExplanation && styles.explainButtonViewed,
                      (!quota || quota.quotaStatus.remaining === 0) && !hasExplanation && styles.explainButtonDisabled,
                    ]}
                    onPress={() => {
                      if (hasExplanation) {
                        setSelectedExplanation(hasExplanation);
                      } else {
                        handleExplainAnswer(questionId, answer);
                      }
                    }}
                    disabled={isLoadingThis || (!hasExplanation && (!quota || quota.quotaStatus.remaining === 0))}>
                    {isLoadingThis ? (
                      <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
                    ) : (
                      <>
                        <MaterialIcons 
                          name={hasExplanation ? "lightbulb" : "lightbulb-outline"} 
                          size={16} 
                          color={COLORS.whiteFFFFFF} 
                        />
                        <Text variant="semibold12" color={COLORS.whiteFFFFFF} style={{marginLeft: 6}}>
                          {hasExplanation ? 'View Explanation' : 'Get AI Explanation'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {answer.relatedTopics && answer.relatedTopics.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text variant="semibold12" style={styles.tagTitle}>
                    Related Topics:
                  </Text>
                  <View style={styles.tagsInnerContainer}>
                    {answer.relatedTopics.map((topic, idx) => (
                      <Text
                        key={`topic-${answer.questionId}-${idx}`}
                        variant="regular10"
                        style={styles.tagText}>
                        {topic}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
        {(detailedResults.detailedAnswers || []).length === 0 && (
          <Text style={styles.emptyListText}>
            No detailed answers to display.
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle" size={30} color={COLORS.grey999999} />
          </TouchableOpacity>

          <View style={styles.tabBar}>
            {Object.values(TABS).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabItem,
                  activeTab === tab && styles.activeTabItem,
                ]}
                onPress={() => setActiveTab(tab)}>
                <Text
                  variant={activeTab === tab ? 'semibold14' : 'regular14'}
                  color={
                    activeTab === tab ? COLORS.yellowF5BE00 : COLORS.blue043142
                  }>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeTab === TABS.VIEW_RANK ? (
            <Icon
              onPress={takeScreenShot}
              type="feather"
              name="share-2"
              size={20}
              color={COLORS.blue043142}
              style={{alignSelf: 'flex-end', marginRight: 16, marginBottom: 10}}
            />
          ) : null}
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {activeTab === TABS.VIEW_RANK
              ? renderLeaderboard()
              : renderDetailedQuizResults()}
          </ScrollView>
        </View>
      </View>

      {/* Explanation Modal */}
      {selectedExplanation && (
        <ExplanationCard
          explanation={selectedExplanation}
          onClose={() => setSelectedExplanation(null)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    paddingTop: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    marginHorizontal: nw(4),
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: COLORS.yellowF5BE00,
  },
  contentContainer: {
    paddingHorizontal: nw(4),
  },
  loader: {
    marginTop: nh(10),
  },
  errorText: {
    textAlign: 'center',
    marginTop: nh(5),
    color: COLORS.redError,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: nh(5),
    color: COLORS.grey999999,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  // User Performance Card
  userPerformanceCard: {
    backgroundColor: COLORS.lightBlueE6F0FF,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '40',
  },
  userPerformanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userPerformanceProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  userPerformanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.blue043142 + '33',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxSeparator: {
    width: 1,
    backgroundColor: COLORS.blue043142 + '33',
    height: '80%',
    alignSelf: 'center',
  },

  // Podium Styles
  podiumContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.blue043142,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
  },
  podiumItem: {
    alignItems: 'center',
    width: width / 3.8,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: COLORS.whiteFFFFFF,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 140,
    justifyContent: 'flex-end',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  podiumItemPlaceholder: {
    width: width / 3.8,
    marginHorizontal: 4,
  },
  podiumItemFirst: {
    minHeight: 160,
    backgroundColor: COLORS.yellowF5BE00 + '15',
    elevation: 4,
    shadowOpacity: 0.15,
    borderColor: COLORS.yellowF5BE00,
    transform: [{translateY: -10}],
  },
  podiumItemSecond: {
    minHeight: 150,
    backgroundColor: '#C0C0C0' + '15',
    borderColor: '#C0C0C0',
    transform: [{translateY: -5}],
  },
  podiumItemThird: {
    borderColor: '#CD7F32',
    backgroundColor: '#CD7F32' + '15',
  },
  podiumProfilePicContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.greyEEEEEE,
  },
  podiumProfilePicFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: COLORS.yellowF5BE00,
  },
  medalIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 15,
    padding: 3,
    elevation: 3,
  },
  podiumUsername: {
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },

  // Leader List Styles
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  userRankHighlight: {
    backgroundColor: COLORS.yellowF5BE00 + '33',
    borderColor: COLORS.yellowF5BE00,
    borderWidth: 1.5,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderRank: {
    marginRight: 10,
    width: 30,
    textAlign: 'center',
  },
  leaderProfilePic: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },

  // Detailed Quiz Results Styles
  waitMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: nh(10),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    marginHorizontal: nw(5),
  },
  waitMessage: {
    color: COLORS.blue043142,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  waitTimeText: {
    color: COLORS.grey999999,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionText: {
    flex: 1,
    color: COLORS.blue043142,
    lineHeight: 20,
  },
  savedIndicator: {
    backgroundColor: COLORS.yellowF5BE00 + '20',
    padding: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  optionText: {
    color: COLORS.darkGrey333333,
    flex: 0.9,
  },
  correctSelectedOptionText: {
    color: COLORS.greenSuccess,
    fontWeight: '600',
  },
  incorrectSelectedOptionText: {
    color: COLORS.redError,
  },
  correctOptionHighlightStyle: {
    color: COLORS.greenSuccess,
  },
  optionIcon: {},
  skippedText: {
    fontStyle: 'italic',
    marginVertical: 5,
    textAlign: 'center',
    color: COLORS.grey999999,
  },
  correctAnswerDisplay: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  correctText: {
    color: COLORS.greenSuccess,
    fontWeight: '600',
  },
  incorrectText: {
    color: COLORS.redError,
    fontWeight: '600',
  },
  tagsContainer: {
    marginTop: 12,
  },
  tagTitle: {
    color: COLORS.blue043142,
    marginBottom: 4,
    fontWeight: '600',
  },
  tagsInnerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagText: {
    backgroundColor: COLORS.greyEEEEEE,
    color: COLORS.blue043142,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 11,
  },

  // Quota Banner Styles
  quotaBanner: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quotaGradient: {
    padding: 16,
  },
  quotaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quotaTextContainer: {
    marginLeft: 12,
  },
  quotaRight: {
    alignItems: 'flex-end',
  },
  resetTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotaCloseBtn: {
    marginTop: 4,
    padding: 4,
  },

  // Quota Header Container
  quotaHeaderContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },

  // Quota Status Pill
  quotaStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },

  // Learning Vault Button
  learningVaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '30',
  },

  // Question Footer
  questionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },

  // Explain Button
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  explainButtonViewed: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  explainButtonDisabled: {
    backgroundColor: COLORS.grey999999,
    elevation: 0,
  },

  // Explanation Card Styles
  explanationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  explanationCard: {
    flex: 1,
    paddingTop: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  explanationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  explanationCloseBtn: {
    padding: 4,
  },
  explanationContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  explanationSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  explanationText: {
    lineHeight: 22,
  },
  correctHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  incorrectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  takeawaySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.yellowF5BE00 + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.yellowF5BE00 + '30',
  },
  relatedTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  relatedTopicChip: {
    backgroundColor: COLORS.blue043142 + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '20',
  },
  savedInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.yellowF5BE00 + '20',
  },
});

export default LeaderboardModal;