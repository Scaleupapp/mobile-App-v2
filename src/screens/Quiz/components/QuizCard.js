// // screens/Quiz/components/QuizCard.js
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { format } from 'date-fns';

// const QuizCard = ({ quiz, onPress }) => {
//   return (
//     <TouchableOpacity style={styles.card} onPress={onPress}>
//       <View style={styles.header}>
//         <Text style={styles.topic}>{quiz.topic}</Text>
//         <Text style={styles.difficulty}>{quiz.difficulty}</Text>
//       </View>
//       <View style={styles.details}>
//         <Text style={styles.startTime}>
//           Starts: {format(new Date(quiz.startTime), 'PPp')}
//         </Text>
//         {quiz.isPaid && (
//           <Text style={styles.entryFee}>
//             Entry Fee: ₹{quiz.entryFee}
//           </Text>
//         )}
//         <Text style={styles.participants}>
//           Participants: {quiz.participants.length}
//         </Text>
//       </View>
//       {quiz.isRegistered && (
//         <View style={styles.registeredBadge}>
//           <Text style={styles.registeredText}>Registered</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     margin: 8,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   topic: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   difficulty: {
//     fontSize: 14,
//     color: '#666',
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   details: {
//     gap: 8,
//   },
//   startTime: {
//     fontSize: 14,
//     color: '#666',
//   },
//   entryFee: {
//     fontSize: 14,
//     color: '#2196F3',
//     fontWeight: '500',
//   },
//   participants: {
//     fontSize: 14,
//     color: '#666',
//   },
//   registeredBadge: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: '#4CAF50',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   registeredText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '500',
//   },
// });

// export default QuizCard;