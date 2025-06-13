import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {submitQuizfeedback} from '../../services/apiService';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';

const overallExperienceOptions = ['Poor', 'Good', 'Average', 'Excellent'];

const QuizFeedbackScreen = ({route}) => {
  const [rating, setRating] = useState(0);
  const [overAllExperience, setOverAllExperience] = useState('');
  const [comment, setComment] = useState('');

  const submitFeedback = async () => {
    if (!rating || !overAllExperience) {
      Alert.alert('Please complete all fields.');
      return;
    }

    try {
      console.log(
        route?.params?.quizEventId,
        rating,
        comment,

        overAllExperience,
      );

      const response = await submitQuizfeedback({
        quizEventId: route?.params?.quizEventId,
        rating,
        comment,

        overAllExperience,
      });
      console.log('🚀 ~ submitFeedback ~ response:', response?.data);

      setRating(0);
      setOverAllExperience('');
      setComment('');
      navigationRef.reset({
        index: 0,
        routes: [{name: Routes.QuizList}],
      });
    } catch (error) {
      navigationRef.reset({
        index: 0,
        routes: [{name: Routes.QuizList}],
      });
      console.error(error, 'eee');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Rate the Quiz</Text>

      {/* Star Rating */}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(val => (
          <TouchableOpacity key={val} onPress={() => setRating(val)}>
            <Text style={val <= rating ? styles.starSelected : styles.star}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Difficulty Level */}
      {/* <Text style={styles.label}>Difficulty Level</Text>
      <View style={styles.optionRow}>
        {difficultyLevels.map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.option,
              difficultyLevel === level && styles.selectedOption,
            ]}
            onPress={() => setDifficultyLevel(level)}>
            <Text
              style={
                difficultyLevel === level
                  ? styles.selectedOptionText
                  : styles.optionText
              }>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* Overall Experience */}
      <Text style={styles.label}>Overall Experience</Text>
      <View style={styles.optionRow}>
        {overallExperienceOptions.map(exp => (
          <TouchableOpacity
            key={exp}
            style={[
              styles.option,
              overAllExperience === exp && styles.selectedOption,
            ]}
            onPress={() => setOverAllExperience(exp)}>
            <Text
              style={
                overAllExperience === exp
                  ? styles.selectedOptionText
                  : styles.optionText
              }>
              {exp}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Comment Box */}
      <TextInput
        placeholder="Write a comment (optional)"
        style={styles.textArea}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
        <Text style={styles.submitText}>Submit Feedback</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    fontSize: 32,
    color: '#ccc',
    marginHorizontal: 5,
  },
  starSelected: {
    fontSize: 32,
    color: '#FFD700',
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#043142',
    borderColor: '#043142',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textArea: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
    borderRadius: 10,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#043142',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default QuizFeedbackScreen;
