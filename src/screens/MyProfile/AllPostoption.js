import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import ToggleWithIconUnderline from '../../components/TogglewithIconUnderline';
import SavedPosts from '../Home/SavedPostsModal';
import {AllPost} from '../../components/AllPost';
import {VideoList} from './VideoList';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import {nh} from '../../helper/scales';
import {useToast} from '../../components/CustomToast';
import UserPlaylists from './UserPlaylists';
const AllPostoption = ({type, data, apicall}) => {
  // Navigation hook for screen transitions
  const navigation = useNavigation();
  const {showToast} = useToast();
  const [selected, setSelected] = useState(0);
  const [draftPosts, setDraftPosts] = useState({content: []}); // Initialize with proper structure

  useEffect(() => {
    if (selected === 2) {
      fetchDraftPosts();
    }
  }, [selected]);

  const fetchDraftPosts = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const {token} = JSON.parse(userData);

      if (!token) {
        showToast({
          text: 'Please login to view drafts',
          type: 'error',
        });
        return;
      }

      const response = await axios.get(
        'https://api.scaleupapp.club/api/content/drafts',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Structure the data properly with a content property
      setDraftPosts({content: response.data.drafts});
    } catch (error) {
      console.error('Error fetching drafts:', error);
      showToast({
        text: 'Failed to load draft posts',
        type: 'error',
      });
    }
  };

  const handlePublishDraft = async draftPost => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        showToast({
          text: 'Please login to publish drafts',
          type: 'error',
        });
        return;
      }

      navigation.navigate('CreatePost', {
        draftData: {
          heading: draftPost.heading,
          relatedTopics: draftPost.relatedTopics,
          captions: draftPost.captions,
          hashtags: draftPost.hashtags,
          contentType: draftPost.contentType,
          file: {
            uri: draftPost.contentURL,
            type:
              draftPost.contentType === 'Video' ? 'video/mp4' : 'image/jpeg',
            name: draftPost.contentURL.split('/').pop(),
          },
        },
      });
    } catch (error) {
      console.error('Error handling draft publish:', error);
      showToast({
        text: 'Failed to process draft publication',
        type: 'error',
      });
    }
  };

  return (
    <View style={{flex: 1}}>
      {type === 'user' ? (
        <>
          <ToggleWithIconUnderline onToggle={setSelected} />
          {selected === 0 && <AllPost data={data} apicall={apicall} />}
          {selected === 1 && <SavedPosts />}
          {selected === 2 && (
            <AllPost
              data={draftPosts}
              isDrafts={true}
              onPublish={handlePublishDraft}
            />
          )}
          {selected === 3 && <UserPlaylists />}
        </>
      ) : (
        <View style={{marginTop: nh(30), flex: 1}}>
          <View style={{marginBottom: nh(30)}}>
            <ToggleWithUnderline
              options={['ALL POSTS']}
              onToggle={setSelected}
            />
          </View>
          {selected === 0 && <AllPost data={data} myProfile={false} />}
        </View>
      )}
    </View>
  );
};

export default AllPostoption;
