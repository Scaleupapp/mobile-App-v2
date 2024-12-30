import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import Video from 'react-native-video';
import { getProfile, getSavedPostsAPI } from '../../services/apiService';
import Text from '../../components/Text';

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    try {
      const res = await getProfile('');
      setProfileData(res?.data?.userProfileInfo);
      if (res?.data?.userProfileInfo?.id) {
        fetchSavedPosts();
      }
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await getSavedPostsAPI();
      if (response.data) {
        setSavedPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setError(error?.response?.data?.error || 'Failed to fetch saved posts');
    } finally {
      setLoading(false);
    }
  };

  const Postcard = ({ item }) => {
    return (
      <View>
        {(item?.contentType === 'Image' || item?.contentType === 'Document') && item?.contentURL ? (
          <Pressable style={{ marginVertical: nh(10) }}>
            <Image
              source={{ uri: item?.contentURL }}
              style={{
                height: 200,
                width: (DEVICE_WIDTH - nw(48)) / 2,
                backgroundColor: COLORS.whiteFFFFFF,
                borderRadius: nh(12),
                borderWidth: 1,
                borderColor: COLORS.grey333333 + 10,
              }}
              resizeMode="cover"
            />
          </Pressable>
        ) : null}
        {item?.contentType === 'Video' && item?.contentURL ? (
          <Pressable
            style={{
              borderRadius: nh(12),
              marginRight: 10,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: COLORS.grey333333 + 10,
            }}>
            <Video
              paused={true}
              controls
              source={{ uri: item?.contentURL }}
              style={{
                height: nh(250),
                width: (DEVICE_WIDTH - nw(48)) / 2,
                backgroundColor: COLORS.whiteFFFFFF,
                marginBottom: nh(6),
              }}
              resizeMode="cover"
              onBuffer={e => console.log('buffer ', e)}
              onError={e => console.log('error ', e)}
            />
          </Pressable>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="medium14" color={COLORS.grey333333}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="medium14" color={COLORS.grey333333}>
          {error}
        </Text>
      </View>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="medium14" color={COLORS.grey333333}>
          No saved posts yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={savedPosts}
        renderItem={({ item }) => <Postcard item={item} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  }
});

export default SavedPosts;