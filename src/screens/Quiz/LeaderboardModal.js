import {useState, useEffect, useCallback, useRef} from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator, // Added for loading states
} from 'react-native';
import ViewShot from 'react-native-view-shot';
// Assuming Text component is correctly imported from your project structure
// For this example, I'll use a mock similar to the one in QuizList.
// const Text = ({children, style, variant, color, ...props}) => {
//   let fontWeight = 'normal';
//   let fontSize = 14;
//   if (variant) {
//     if (variant.includes('semibold')) fontWeight = '600';
//     if (variant.includes('bold')) fontWeight = 'bold';
//     const sizeMatch = variant.match(/\d+/);
//     if (sizeMatch) fontSize = parseInt(sizeMatch[0], 10);
//   }
//   return (
//     <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
//       {children}
//     </RNText>
//   );
// };
// import {Text as RNText} from 'react-native';
import Text from '../../components/Text';

// Import moment library
import moment from 'moment';

import {COLORS} from '../../helper/colors'; // Assuming this path is correct
import {navigationRef} from '../../../App'; // Assuming this path is correct
import Routes from '../../helper/routes'; // Assuming this path is correct
import {
  getUserRankingApi,
  getDetailedResultsApi,
  getLatestQuizAttemptIdApi,
} from '../../services/apiService'; // Assuming this path is correct
import Share from 'react-native-share';
import Ionicons from 'react-native-vector-icons/Ionicons'; // For icons
import Icon from '../../helper/icon';

const {width, height} = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

const TABS = {
  VIEW_RANK: 'Leaderboard', // Renamed for clarity
  QUIZ_DETAILS: 'My Answers', // Renamed for clarity
};



const LeaderboardModal = ({visible, onClose, quizId}) => {
  const [leaders, setLeaders] = useState([]);
  const [userRankData, setUserRankData] = useState(null); // Combined user's rank, score, profile from leaders list
  const [detailedResults, setDetailedResults] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.VIEW_RANK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef();


const getInitials = (username) => {
  // console.log('=== getInitials called ===');
  // console.log('Input username:', username);
  // console.log('Username type:', typeof username);
  
  if (!username) {
    console.log('No username provided, returning ??');
    return '??';
  }
  
  // Split by spaces to handle full names
  const nameParts = username.split(' ').filter(part => part.length > 0);
  console.log('Name parts:', nameParts);
  
  if (nameParts.length >= 2) {
    // If there are at least 2 name parts, use first letter of first two parts
    const initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[1].charAt(0).toUpperCase()}`;
    console.log('Two+ parts initials:', initials);
    return initials;
  } else if (nameParts.length === 1) {
    // If single name, use first two characters or just first if name is single character
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
        url: imagePath, // make sure this is a full file path
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
    // setActiveTab(TABS.VIEW_RANK); // Keep active tab or reset as preferred
    setIsLoading(false);
    setError(null);
  };

  useEffect(() => {
    if (visible) {
      fetchAttemptIdAndData();
    } else {
      resetState(); // Reset state when modal is closed
    }
  }, [visible, quizId]);

  const fetchAttemptIdAndData = async () => {
    if (!quizId) return;
    setIsLoading(true);
    setError(null);
    try {
      const attemptResponse = await getLatestQuizAttemptIdApi(quizId);
      const currentAttemptId = attemptResponse.data.attemptId;
      setAttemptId(currentAttemptId);

      if (currentAttemptId) {
        // Fetch both leaderboard and detailed results in parallel
        await Promise.all([
          fetchLeaderboardData(quizId),
          fetchDetailedResults(quizId, currentAttemptId),
        ]);
      } else {
        // If no attempt ID, still try to fetch leaderboard (might show global ranks)
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
      // Log the detailed results to check the structure
      // console.log("Fetched Detailed Results:", JSON.stringify(response.data, null, 2));
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
        console.log('profilePicture type:', typeof userRankData.profilePicture);
        console.log('profilePicture length:', userRankData.profilePicture?.length);
        console.log('Is profilePicture truthy?', !!userRankData.profilePicture);
        console.log('Is profilePicture default?', userRankData.profilePicture === 'default-profile-pic-url');
        console.log('userRankData.username:', userRankData.username);
        
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
                console.log('Failed URI:', userRankData.profilePicture);
              }}
              onLoad={() => {
                console.log('=== IMAGE LOADED SUCCESSFULLY ===');
                console.log('Loaded URI:', userRankData.profilePicture);
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
{leader.profilePicture && leader.profilePicture !== 'default-profile-pic-url' ? (  <Image
    source={{uri: leader.profilePicture}}
    style={[styles.podiumProfilePic, isFirstPlace && styles.podiumProfilePicFirst]}
    onError={e => console.log('Error loading podium profile image:', e.nativeEvent.error)}
  />
) : (
  (() => {
    console.log('=== PODIUM INITIALS DEBUG ===');
    console.log('Leader object:', leader);
    console.log('Leader username:', leader.username);
    console.log('Is first place:', isFirstPlace);
    const initials = getInitials(leader.username);
    console.log('Generated initials for podium:', initials);
    
    return (
      <View style={[
        styles.podiumProfilePic,
        isFirstPlace && styles.podiumProfilePicFirst,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.blue043142,
          // Add debugging styles
          borderWidth: 2,
          borderColor: 'red',
        },
      ]}>
        <Text 
          variant={isFirstPlace ? 'bold16' : 'bold14'}
          color={COLORS.whiteFFFFFF}
          style={{textAlign: 'center'}}
          onLayout={() => console.log('Podium Text component rendered with initials:', initials)}
        >
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
{leader.profilePicture && leader.profilePicture !== 'default-profile-pic-url' ? (  <Image
    source={{uri: leader.profilePicture}}
    style={styles.leaderProfilePic}
    onError={e => console.log('Error loading leader row profile image:', e.nativeEvent.error)}
  />
) : (
  (() => {
    console.log('=== LEADERBOARD INITIALS DEBUG ===');
    console.log('Leader object:', leader);
    console.log('Leader username:', leader.username);
    const initials = getInitials(leader.username);
    console.log('Generated initials for leaderboard:', initials);
    
    return (
      <View style={[
        styles.leaderProfilePic,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.blue043142,
          // Add debugging styles
          borderWidth: 2,
          borderColor: 'yellow',
        },
      ]}>
        <Text 
          variant="bold12"
          color={COLORS.whiteFFFFFF}
          style={{textAlign: 'center'}}
          onLayout={() => console.log('Leaderboard Text component rendered with initials:', initials)}
        >
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
        {(detailedResults.detailedAnswers || []).map((answer, index) => {
          // Log the structure of the first answer object to help debug
          if (index === 0) {
            console.log(
              'Detailed Answer Object (Structure Check):',
              JSON.stringify(answer, null, 2),
            );
          }

          const selectedOptionChar = answer.selectedOption; // User's selection char (e.g., "A", "B", "skip")
          // CRITICAL: Ensure 'answer.correctAnswer' from your API contains the TEXT of the correct option.
          // If it contains the CHARACTER (e.g., "A"), you'll need to adjust the logic.
          const correctAnswerText = answer.correctAnswer;
          const isAnswerCorrectBoolean =
            typeof answer.isCorrect === 'boolean' ? answer.isCorrect : null; // Check if API provides a direct boolean

          return (
            <View key={answer.questionId || index} style={styles.questionCard}>
              <Text variant="semibold14" style={styles.questionText}>
                {index + 1}. {answer.questionText}
              </Text>
              <View style={styles.optionsContainer}>
                {(answer.options || []).map((optionText, i) => {
                  const optionChar = String.fromCharCode(65 + i); // A, B, C, D

                  const isUserSelectedOption =
                    optionChar === selectedOptionChar;
                  // Determine if this specific option's text matches the correct answer's text
                  const isThisOptionTheCorrectOne =
                    optionText === correctAnswerText;

                  let optionStyle = [styles.optionText];
                  let icon = null;

                  if (isUserSelectedOption) {
                    if (isThisOptionTheCorrectOne) {
                      // User selected this, and it's the correct one
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
                      // User selected this, but it's incorrect
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
                    // This option was not selected by user, but it IS the correct answer
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

              {/* Display the correct answer text if available and user didn't select it or selected incorrectly */}
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
              {/* Message if correct answer text is missing from API and question wasn't skipped */}
              {!correctAnswerText && selectedOptionChar !== 'skip' && (
                <Text
                  variant="regular12Italic"
                  color={COLORS.grey999999}
                  style={styles.skippedText}>
                  Correct answer information not available for this question.
                </Text>
              )}

              <View style={styles.metadataContainer}>
                <Text variant="regular12" color={COLORS.darkGrey333333}>
                  Time Taken: {answer.timeTaken ?? 'N/A'}s
                </Text>
                {/* Determine overall correctness for the label */}
                {selectedOptionChar !== 'skip' ? (
                  isAnswerCorrectBoolean !== null ? ( // Prefer direct boolean if available
                    <Text
                      variant="semibold12"
                      style={
                        isAnswerCorrectBoolean
                          ? styles.correctText
                          : styles.incorrectText
                      }>
                      {isAnswerCorrectBoolean ? 'Correct' : 'Incorrect'}
                    </Text>
                  ) : correctAnswerText ? ( // Fallback to comparing selected option text with correct answer text
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
                  ) : null // If no way to determine, show nothing for the label
                ) : null}
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
  questionText: {
    marginBottom: 12,
    color: COLORS.blue043142,
    lineHeight: 20,
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
    // Style for displaying the correct answer text
    marginTop: 8,
    fontStyle: 'italic',
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
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
});

export default LeaderboardModal;