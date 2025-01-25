import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Modal from 'react-native-modal';
import Video from 'react-native-video';
import {COLORS} from '../../helper/colors';
import {nh} from '../../helper/scales';

const MediaModal = ({
  isVisible,
  onClose,
  file,
  onSend,
  input,
  setInput,
  loadingsmall,
}) => {
  console.log('🚀 ~ MediaModal ~ isVisible:', isVisible);
  const [selectedMedia, setSelectedMedia] = useState(null); // { type: 'image' | 'video', uri: string }

  const handleSend = () => {
    console.log('herr');
    if (file?.fileName) {
      console.log('her1');
      onSend();
    }
  };

  return (
    <Modal
      visible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.1}
      style={styles.modal}>
      {/* <View style={styles.container}> */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <Text style={styles.title}>Preview Media</Text>
          <View style={styles.mediaContainer}>
            {file?.type?.includes('image') && (
              <Image
                source={{uri: file.uri}}
                style={styles.mediaPreview}
                resizeMode="cover"
              />
            )}
            {file?.type?.includes('video') && (
              <Video
                source={{uri: file?.uri}}
                style={styles.mediaPreview}
                resizeMode="contain"
                controls
              />
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={handleSend}>
              {loadingsmall ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      {/* </View> */}
    </Modal>
  );
};

export default MediaModal;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 0,
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingTop: nh(200),
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  mediaContainer: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    color: '#888',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: 'black',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  sendButton: {
    backgroundColor: COLORS.blue043142,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
