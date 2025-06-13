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
import {submitQuizinterest} from '../services/apiService';
import {nw} from '../helper/scales';

const InterestedQuiz = () => {
  const [visible, setVisible] = useState(true);

  const onClose = () => {
    setVisible(false);
  };

  const handleSubmit = async response => {
    try {
      let res = await submitQuizinterest({intrestedInCreatingQuiz: response});
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
          <Text style={styles.title}>
            Would you be interested in creating a quiz?{' '}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.laterButton}
              onPress={() => handleSubmit('no')}>
              <Text style={styles.laterText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.laterButton, {marginLeft: 20}]}
              onPress={() => handleSubmit('yes')}>
              <Text style={styles.laterText}>Yes</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
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
    // justifyContent: 'space-between',
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
    // backgroundColor: '#eee',
    width: nw(80),
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  laterText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default InterestedQuiz;
