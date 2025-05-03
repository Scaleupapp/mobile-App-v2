import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import {checkVersion} from 'react-native-check-version';
import DeviceInfo from 'react-native-device-info';
import packageDetail from '../../package.json';
import {isAndroid} from '../helper/scales';
import {COLORS} from '../helper/colors';
import {isVersionLess} from '../helper/commonFunctions';
import {icons} from '../assets/icons';
import {navigationRef} from '../../App';
import Routes from '../helper/routes';

const QuizstartedPopup = ({activeQuiz}) => {
  console.log('🚀 ~ QuizstartedPopup ~ activeQuiz:', activeQuiz);
  const [updateAvailable, setUpdateAvailable] = useState(true);

  const handleUpdate = () => {
    setUpdateAvailable(false);
    navigationRef.navigate(Routes.QuizList, {from: 'popup'});
  };

  return (
    <Modal
      isVisible={updateAvailable}
      animationIn="bounceIn"
      animationOut="fadeOut">
      <View style={styles.modalContainer}>
        <Image source={icons.quizActive} style={styles.updateImage} />
        <Text style={styles.title}>
          The Quiz{' '}
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>
            {activeQuiz?.title}{' '}
          </Text>
          has been started
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateText}>Attend Now</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  updateImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 15,
    alignSelf: 'center',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  updateButton: {
    backgroundColor: COLORS.blue043142,
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  updateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default QuizstartedPopup;
