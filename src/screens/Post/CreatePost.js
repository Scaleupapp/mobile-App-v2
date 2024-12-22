import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import Text from '../../components/Text';
import Button from '../../components/Button';
import DocumentPicker from 'react-native-document-picker';
import axios from 'axios';
import {useToast} from '../../components/CustomToast';
import {getProfile} from '../../services/apiService';

const CreatePost = ({navigation}) => {
  const {showToast} = useToast();

  // Form state
  const [heading, setHeading] = useState('');
  const [topics, setTopics] = useState('');
  const [captions, setCaptions] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [contentType, setContentType] = useState('image');
  
  // User data state
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data on component mount
  useEffect(() => {
    getProfileData();
  }, []);

  // Function to fetch profile data using AsyncStorage and API
  const getProfileData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(user);

      let res = await getProfile('');
      console.log('Profile data fetched:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
      showToast({
        text: 'Failed to load profile data',
        type: 'error',
      });
    }
  };

  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });
      console.log('Selected File:', res);
      setFile(res);

      const fileType = res.type || res.name.split('.').pop().toLowerCase();
      if (fileType.includes('image')) {
        setContentType('Image');
      } else if (fileType.includes('video')) {
        setContentType('Video');
        Alert.alert(
          'Thumbnail Required',
          'Please upload a thumbnail for your video',
          [{text: 'Upload Thumbnail', onPress: handleThumbnailUpload}],
        );
      } else if (fileType.includes('pdf') || fileType.includes('document')) {
        setContentType('Document');
      } else if (fileType.includes('gif')) {
        setContentType('GIF');
      } else {
        setContentType('Other');
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled document picker');
      } else {
        console.error('Error selecting file:', err);
        showToast({
          text: 'Failed to select file',
          type: 'error',
        });
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
        showToast({
          text: 'Failed to select thumbnail',
          type: 'error',
        });
      }
    }
  };

  const uploadFile = async (fileData, additionalFields = {}) => {
    try {
      // Get the authentication token from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const {token} = JSON.parse(userData);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      Object.keys(additionalFields).forEach(key => {
        formData.append(key, additionalFields[key]);
      });

      formData.append('media', {
        uri: fileData.uri,
        type: fileData.type,
        name: fileData.name,
      });

      const response = await axios.post(
        'http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/content/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  };

  const handlePost = async () => {
    // Validate user authentication
    if (!profileData?.id) {
      showToast({
        text: 'Please log in to create a post',
        type: 'error',
      });
      return;
    }

    // Validate form fields
    if (!heading || !topics || !hashtags || !file || !captions) {
      showToast({
        text: 'Please fill all fields and upload a file.',
        type: 'error',
      });
      return;
    }

    try {
      console.log('Uploading main file...');
      const additionalFields = {
        heading,
        relatedTopics: topics,
        hashtags,
        verify: 'Yes',
        captions,
        contentType,
      };

      const fileResponse = await uploadFile(file, additionalFields);
      console.log('File Upload Success:', fileResponse.data);

      if (contentType === 'Video' && thumbnailFile) {
        console.log('Uploading thumbnail...');
        const thumbnailResponse = await uploadFile(thumbnailFile, {
          isThumbnail: true,
        });
        console.log('Thumbnail Upload Success:', thumbnailResponse.data);
      }

      showToast({text: 'Post created successfully!', type: 'success'});
      navigation.goBack();
    } catch (error) {
      console.error('Upload Error:', error.response?.data || error.message);
      showToast({text: 'Failed to upload post.', type: 'error'});
    }
  };

  // Rest of the component remains the same...
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
          showsVerticalScrollIndicator={false}>
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
            <CustomTextInput
              label="Captions"
              value={captions}
              onChangeText={setCaptions}
            />
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

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    width: Dimensions.get('window').width,
    alignSelf: 'center',
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

export default CreatePost;