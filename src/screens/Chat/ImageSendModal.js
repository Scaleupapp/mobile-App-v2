import React from 'react';
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
  FlatList,
} from 'react-native';
import Modal from 'react-native-modal';
import Video from 'react-native-video';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';

const MediaModal = ({
  isVisible,
  onClose,
  file, // Now an array if multi=true
  onSend,
  input,
  setInput,
  loadingsmall,
  reply,
  multi = false,
}) => {
  const handleSend = () => {
    if (file?.length > 0) {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <Text style={styles.title}>Preview Media</Text>

          <View style={[styles.mediaContainer, multi ? {} : {height: nh(200)}]}>
            {multi ? (
              <FlatList
                data={file} // Expecting an array
                // horizontal
                numColumns={2}
                columnWrapperStyle={{justifyContent: 'space-between'}}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({item, index}) => (
                  <View key={index} style={styles.mediaItem}>
                    {item?.type?.includes('image') && (
                      <Image
                        source={{uri: item.uri}}
                        style={styles.mediaPreview}
                        resizeMode="cover"
                      />
                    )}
                    {item?.type?.includes('video') && (
                      <Video
                        source={{uri: item.uri}}
                        style={styles.mediaPreview}
                        resizeMode="contain"
                        controls
                      />
                    )}
                  </View>
                )}
              />
            ) : file?.type?.includes('image') ? (
              <Image
                source={{uri: file.uri}}
                style={styles.mediaPreview}
                resizeMode="cover"
              />
            ) : file?.type?.includes('video') ? (
              <Video
                source={{uri: file.uri}}
                style={styles.mediaPreview}
                resizeMode="contain"
                controls
              />
            ) : null}
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
                <Text style={styles.buttonText}>
                  {reply ? 'Reply' : 'Send'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    // height: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mediaItem: {
    width: nw(170), // Set width for each media item
    height: nh(180),
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
