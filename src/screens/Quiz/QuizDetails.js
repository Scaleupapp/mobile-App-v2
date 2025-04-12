// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   View,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { COLORS } from '../../helper/colors';
// import { DEVICE_HEIGHT, nh, nw } from '../../helper/scales';
// import Text from '../../components/Text';
// import Header from '../../components/Header';
// import axios from 'axios';
// import { format } from 'date-fns';
// import { getProfile } from '../../services/apiService';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import LeaderboardModal from './LeaderboardModal';


// const API_URL = 'http://192.168.68.240:3000/api';

// const QuizDetails = ({ route, navigation }) => {
//   const { quizId } = route.params;
//   const [quiz, setQuiz] = useState(null);
//   const [profileData, setProfileData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [leaderboardVisible, setLeaderboardVisible] = useState(false);


//   useEffect(() => {
//     const initializeData = async () => {
//       try {
//         const profileRes = await getProfile('');
//         const profile = profileRes?.data?.userProfileInfo;
//         setProfileData(profile);

//         const userData = await AsyncStorage.getItem('userData');
//         const parsedUser = JSON.parse(userData);

//         if (profile?.id) {
//           const response = await axios.get(
//             `${API_URL}/quiz/list`,
//             {
//               headers: { Authorization: `Bearer ${parsedUser?.token}` }
//             }
//           );
//           const foundQuiz = response.data.quizzes.find(q => q._id === quizId);
//           console.log('foundddddddddddd',foundQuiz)
//           if (foundQuiz) {
//             setQuiz(foundQuiz);
//             await AsyncStorage.setItem(`quiz_${quizId}_total_questions`, 
//               JSON.stringify(foundQuiz.questions.length));
//           } else {
//             setError('Quiz not found');
//           }
//         } else {
//           setError('Profile data not available');
//         }
//       } catch (error) {
//         console.error('Error:', error);
//         setError(error?.response?.data?.message || 'An error occurred');
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeData();
//   }, [quizId]);

//   const handleJoinQuiz = async () => {
//     try {
//       const userData = await AsyncStorage.getItem('userData');
//       const parsedUser = JSON.parse(userData);
//       if (!parsedUser?.token) {
//         throw new Error('Profile data not available');
//       }

//       await axios.post(
//         `${API_URL}/quiz/join`,
//         { quizId },
//         { headers: { Authorization: `Bearer ${parsedUser?.token}` }}
//       );

//       const totalQuestions = quiz?.questions?.length || 0;

//       console.log('handlequizjoin',totalQuestions)
//       Alert.alert(
//         'Success',
//         'You have successfully joined the quiz!',
//         [{ text: 'OK', onPress: () => navigation.navigate('QuizWaitingRoom', { quizId, 
//           totalQuestions: totalQuestions 

//          }) }]
//       );
//     } catch (error) {
//       Alert.alert('Error', error.response?.data?.message || 'Failed to join quiz');
//     }
//   };

//   const navigateToWaitingRoom = () => {
//     // Calculate total questions from foundQuiz data
//     const totalQuestions = quiz?.questions?.length || 0;
//     console.log('Total questions:', totalQuestions); // Add this for debugging
//     navigation.navigate('QuizWaitingRoom', { 
//       quizId,
//       totalQuestions: totalQuestions // This will be 16 based on your console log
//     });
//   };

//   const renderContent = () => {
//     if (loading) {
//       return (
//         <View style={[styles.container, styles.centerContent]}>
//           <ActivityIndicator size="large" color={COLORS.blue043142} />
//         </View>
//       );
//     }

//     if (error) {
//       return (
//         <View style={[styles.container, styles.centerContent]}>
//           <Text variant="semibold16" color={COLORS.red}>
//             {error}
//           </Text>
//         </View>
//       );
//     }

//     if (!quiz) {
//       return (
//         <View style={[styles.container, styles.centerContent]}>
//           <Text variant="semibold16" color={COLORS.blue043142}>
//             Quiz not found
//           </Text>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.contentContainer}>
//         <Text variant="semibold20" color={COLORS.blue043142} style={styles.topic}>
//           {quiz.topic}
//         </Text>

//         <View style={styles.infoSection}>
//           <View style={styles.infoRow}>
//             <Text variant="regular16" color={COLORS.blue043142}>
//               Difficulty:
//             </Text>
//             <Text variant="semibold16" color={COLORS.blue043142}>
//               {quiz.difficulty}
//             </Text>
//           </View>

//           <View style={styles.infoRow}>
//             <Text variant="regular16" color={COLORS.blue043142}>
//               Start Time:
//             </Text>
//             <Text variant="semibold16" color={COLORS.blue043142}>
//               {format(new Date(quiz.startTime), 'PPp')}
//             </Text>
//           </View>

//           {quiz.isPaid && (
//             <View style={styles.infoRow}>
//               <Text variant="regular16" color={COLORS.blue043142}>
//                 Entry Fee:
//               </Text>
//               <Text variant="semibold16" color={COLORS.blue043142}>
//                 ₹{quiz.entryFee}
//               </Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.prizeSection}>
//           <Text
//             variant="semibold20"
//             color={COLORS.blue043142}
//             style={styles.prizeTitle}>
//             Prize Distribution
//           </Text>
//           <View style={styles.prizeRow}>
//             <Text variant="regular16" color={COLORS.blue043142}>
//               1st Place:
//             </Text>
//             <Text variant="semibold16" color={COLORS.blue043142}>
//               {quiz.prizeDistribution.firstPlace}%
//             </Text>
//           </View>
//           <View style={styles.prizeRow}>
//             <Text variant="regular16" color={COLORS.blue043142}>
//               2nd Place:
//             </Text>
//             <Text variant="semibold16" color={COLORS.blue043142}>
//               {quiz.prizeDistribution.secondPlace}%
//             </Text>
//           </View>
//           <View style={styles.prizeRow}>
//             <Text variant="regular16" color={COLORS.blue043142}>
//               3rd Place:
//             </Text>
//             <Text variant="semibold16" color={COLORS.blue043142}>
//               {quiz.prizeDistribution.thirdPlace}%
//             </Text>
//           </View>
//         </View>

//         {quiz.hasEnded ? (
//   <TouchableOpacity
//     style={[styles.joinButton, { backgroundColor: COLORS.blue043142 }]}
//     onPress={() => setLeaderboardVisible(true)}>
//     <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
//       View Leaderboard
//     </Text>
//   </TouchableOpacity>
// ) : (
//   <TouchableOpacity
//     style={[
//       styles.joinButton,
//       quiz.isRegistered && { backgroundColor: COLORS.blue043142 },
//     ]}
//     onPress={quiz.isRegistered ? navigateToWaitingRoom : handleJoinQuiz}>
//     <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
//       {quiz.isRegistered ? 'Go to Waiting Room' : 'Join Quiz'}
//     </Text>
//   </TouchableOpacity>
// )}

// <LeaderboardModal
//   visible={leaderboardVisible}
//   onClose={() => setLeaderboardVisible(false)}
//   quizId={quizId}
// />
//       </View>
      
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar
//         barStyle="dark-content"
//         backgroundColor={COLORS.yellowF5BE00}
//       />
      
//       <View style={styles.headerContainer}>
//         <Header
//           title="Quiz Details"
//           onBackPress={() => navigation.navigate('QuizList')}
//         />
//       </View>
      
//       <View style={styles.layer1}>
//         <View style={styles.layer2}>
//           {renderContent()}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.yellowF5BE00,
//   },
//   headerContainer: {
//     paddingTop: nh(10),
//     paddingBottom: nh(10),
//   },
//   centerContent: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   layer1: {
//     flex: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.5)',
//     marginTop: nh(26),
//     marginHorizontal: nw(16),
//     borderTopLeftRadius: nh(25),
//     borderTopRightRadius: nh(25),
//   },
//   layer2: {
//     flex: 1,
//     backgroundColor: COLORS.whiteFFFFFF,
//     marginTop: nh(15),
//     marginHorizontal: nw(-16),
//     borderTopLeftRadius: nh(25),
//     borderTopRightRadius: nh(25),
//     paddingTop: nh(20),
//   },
//   contentContainer: {
//     padding: nw(16),
    
//   },
//   topic: {
//     marginBottom: nh(20),
//   },
//   infoSection: {
//     backgroundColor: COLORS.whiteFFFFFF,
//     borderRadius: nh(8),
//     padding: nw(16),
//     marginBottom: nh(20),
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: nh(12),
//   },
//   prizeSection: {
//     backgroundColor: COLORS.whiteFFFFFF,
//     borderRadius: nh(8),
//     padding: nw(16),
//     marginBottom: nh(20),
//   },
//   prizeTitle: {
//     marginBottom: nh(16),
//   },
//   prizeRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: nh(8),
//   },
//   joinButton: {
//     backgroundColor: COLORS.blue043142,
//     padding: nw(16),
//     borderRadius: nh(8),
//     alignItems: 'center',
//     marginTop: nh(20),
//   },
// });

// export default QuizDetails;