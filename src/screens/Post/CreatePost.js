import React, {useState} from 'react';
import { useSelector } from 'react-redux';

import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Alert,
  Dimensions,
  Image
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import Text from '../../components/Text';
import Button from '../../components/Button';
import DocumentPicker from 'react-native-document-picker';
import axios from 'axios';

const CreatePost = ({navigation}) => {
  const [heading, setHeading] = useState('');
  const [topics, setTopics] = useState('');
  const [captions, setCaptions] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [contentType, setContentType] = useState('image'); // Default content type
  
  
  const userData = useSelector((state) => state.auth.userData); // Fetch from state.auth
  const jwtToken = userData?.token; // Use optional chaining to avoid undefined errors

  // console.log('JWT Token:', jwtToken); // Log token to verify it's retrieved correctly // Debugging to check if the token is available
  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      console.log('Selected File:', res); // Logs selected file details
      setFile(res);
  
      // Check file type and set contentType accordingly
      const fileType = res.type || res.name.split('.').pop().toLowerCase();
      
      if (fileType.includes('image')) {
        setContentType('Image');
      } else if (fileType.includes('video')) {
        setContentType('Video');
        Alert.alert(
          'Thumbnail Required', 
          'Please upload a thumbnail for your video',
          [{
            text: 'Upload Thumbnail',
            onPress: handleThumbnailUpload
          }]
        );
      } else if (fileType.includes('pdf') || fileType.includes('document')) {
        setContentType('Document');
      } else if (fileType.includes('gif')) {
        setContentType('GIF');
      } else {
        setContentType('Other'); // For other types of files
      }
      
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled document picker');
      } else {
        console.error('Error selecting file:', err);
      }
    }
  };

  const handleThumbnailUpload = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });
      setThumbnailFile(res);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled thumbnail picker');
      } else {
        console.error('Error selecting thumbnail:', err);
      }
    }
  };
  

  const handlePost = async () => {
    if (!heading || !topics || !hashtags || !file || !captions) {
      Alert.alert('Error', 'Please fill all fields and upload a file.');
      return;
    }

     // Additional validation for video thumbnail
     if (contentType === 'Video' && !thumbnailFile) {
      Alert.alert('Error', 'Please upload a thumbnail for your video.');
      return;
    }

    const formData = new FormData();
    formData.append('heading', heading);
    formData.append('relatedTopics', topics);
    formData.append('hashtags', hashtags);
    formData.append('verify', 'Yes');
    formData.append('captions', captions); // Example: 'Nature'

    formData.append('media', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });
    if (contentType === 'Video' && thumbnailFile) {
      formData.append('thumbnail', {
        uri: thumbnailFile.uri,
        type: thumbnailFile.type,
        name: thumbnailFile.name,
      });
    }
    formData.append('contentType', contentType);

    // console.log('Form Data:', formData); // Logs the FormData object


      // Add thumbnail for video



    try {
      console.log('Sending POST request...');
      const response = await axios.post(
        'http://192.168.0.187:3000/api/content/create',
        formData,
        {headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwtToken}`, // Include the token

        }}
      );
      console.log('Response:', response.data); // Logs server response

      
      Alert.alert('Success', 'Post created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error Response:', error.response?.data); // Logs server error response
      console.log('Error Details:', error); // Logs additional error details
      Alert.alert('Error', 'Failed to upload post.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="New Post" />
      <View style={styles.layer1}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.layer2}>
            <CustomTextInput
              label="Heading"
              value={heading}
              onChangeText={setHeading}
            />
            <CustomTextInput
              label="Topics (Press comma after every category)"
              value={topics}
              onChangeText={setTopics}
            />
                        <CustomTextInput label="Captions" value={captions}
              onChangeText={setCaptions} textinputType="L" />

            <CustomTextInput
              label="Hashtags (Add # before each word)"
              value={hashtags}
              onChangeText={setHashtags}
            />
            <Text variant="medium14" color={COLORS.greyBBBBBB}>
              Upload Image/Video/Doc/GIF
            </Text>
            <View style={styles.uploadButtonContainer}>
              <Button
                leftIcon={'upload'}
                text="Upload"
                variant="outline"
                onPress={handleFileUpload}
                width={nw(96)}
                height={nh(35)}
                textStyle={{fontSize: 14}}
              />
            </View>
            {contentType === 'Video' && thumbnailFile && (
        <View style={styles.thumbnailPreview}>
          <Text>Thumbnail Preview:</Text>
          <Image 
            source={{uri: thumbnailFile.uri}} 
            style={styles.thumbnailImage} 
          />
        </View>
      )}
            <View style={styles.actionButtonContainer}>
              <Button
                variant="outline"
                text="Cancel"
                width={nw(85)}
                height={nh(35)}
                textStyle={{fontSize: 14}}
                onPress={() => navigation.goBack()}
              />
              <Button
                text="Next"
                width={nw(65)}
                height={nh(35)}
                textStyle={{fontSize: 14}}
                onPress={handlePost}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CreatePost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    width: Dimensions.get('window').width, // Ensure full width
    alignSelf: 'center', // Center the view
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  uploadButtonContainer: {
    marginTop: nh(10), 
    width: nw(96),
  },
  actionButtonContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width / 2 - 30,
    justifyContent: 'space-between',
    marginTop: nh(30),
  },
  thumbnailPreview: {
    marginTop: 10,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
});
