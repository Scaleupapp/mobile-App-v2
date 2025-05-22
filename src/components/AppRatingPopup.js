import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Modal from 'react-native-modal';
import {COLORS} from '../helper/colors';
import {submitAppfeedback, submitApprating} from '../services/apiService';

const AppRatingPopup = ({activeQuiz}) => {
  const [visible, setVisible] = useState(true);
  console.log('🚀 ~ AppRatingPopup ~ visible:', visible);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleRating = async value => {
    setRating(value);
    try {
      let res = await submitApprating({rating: value});
      console.log('🚀 ~ AppRatingPopup ~ res:', res?.data);
    } catch (error) {
      console.log('🚀 ~ AppRatingPopup ~ error:', error);
    }
  };
  const onClose = () => {
    setVisible(false);
  };

  const handleSubmit = async () => {
    try {
      let res = await submitAppfeedback({comment: comment});
      //   console.log('🚀 ~ handleSubmit ~ res:', res);
    } catch (error) {
      console.log('🚀 ~ handleSubmit ~ error:', error);
    } finally {
      onClose();
      setRating(0);
      setComment('');
    }
  };

  return (
    <Modal
      isVisible={visible}
      animationIn="bounceIn"
      animationOut="fadeOut"
      onBackdropPress={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Rate Our App</Text>
          <Text style={styles.message}>We’d love to hear your feedback!</Text>

          {/* Star Rating */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map(val => (
              <TouchableOpacity key={val} onPress={() => handleRating(val)}>
                <Text style={val <= rating ? styles.starSelected : styles.star}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment Box */}
          {rating ? (
            <>
              <TextInput
                placeholder="Leave a comment(optional)"
                style={styles.commentBox}
                value={comment}
                onChangeText={setComment}
                multiline
              />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                  <Text style={styles.laterText}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}>
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  star: {
    fontSize: 30,
    color: '#ccc',
    marginHorizontal: 5,
  },
  starSelected: {
    fontSize: 30,
    color: '#FFD700',
    marginHorizontal: 5,
  },
  commentBox: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 10,
    marginLeft: 30,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  laterButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  laterText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default AppRatingPopup;
