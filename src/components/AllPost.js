// AllPost.js
import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {Image} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import Routes from '../helper/routes';

const CARD_WIDTH = nw(163);

export const AllPost = ({data, isDrafts = false}) => {
  const navigation = useNavigation();

  // Navigate to CreatePost with the draft data
  const handlePublish = item => {
    // Create a file object from the content URL
    const fileExtension = item.contentURL.split('.').pop();
    const fileName = `draft_media.${fileExtension}`;

    // Determine the correct mime type based on content type and extension
    let mimeType = 'image/jpeg';
    if (item.contentType === 'Video') {
      mimeType = 'video/mp4';
    } else if (fileExtension === 'png') {
      mimeType = 'image/png';
    }

    // Format topics and hashtags properly
    const formattedTopics = Array.isArray(item.relatedTopics)
      ? item.relatedTopics.join(', ')
      : item.relatedTopics;

    const formattedHashtags = Array.isArray(item.hashtags)
      ? item.hashtags.join(' ')
      : item.hashtags;

    navigation.navigate('CreatePost', {
      draftData: {
        id: item._id, // Add the draft post ID
        heading: item.heading,
        relatedTopics: formattedTopics, // Changed from topics to relatedTopics
        captions: item.captions,
        hashtags: formattedHashtags,
        contentType: item.contentType,
        file: {
          uri: item.contentURL,
          type: mimeType,
          name: fileName,
        },
      },
    });
  };

  const Postcard = ({item, index}) => {
    return (
      <View style={styles.postContainer}>
        {/* Content Display */}
        <Pressable
          onPress={() =>
            navigation.navigate(Routes.UserPost, {data, item, index})
          }>
          {(item?.contentType === 'Image' ||
            item?.contentType === 'Document') &&
          item?.contentURL ? (
            <Pressable
              style={styles.imageContainer}
              onPress={() =>
                navigation.navigate(Routes.UserPost, {data, item, index})
              }>
              <Image
                source={{uri: item?.contentURL}}
                style={styles.mediaContent}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}

          {item?.contentType === 'Video' && item?.contentURL ? (
            <Pressable
              style={styles.videoContainer}
              onPress={() =>
                navigation.navigate(Routes.UserPost, {data, item, index})
              }>
              <Video
                paused={true}
                controls
                source={{uri: item?.contentURL}}
                style={styles.mediaContent}
                resizeMode="cover"
                onBuffer={e => console.log('buffer ', e)}
                onError={e => console.log('video error ', e)}
              />
            </Pressable>
          ) : null}
        </Pressable>

        {/* Draft Controls */}
        {isDrafts && (
          <View style={styles.draftControls}>
            <TouchableOpacity
              style={styles.publishButton}
              onPress={() => handlePublish(item)}>
              <Icon name="cloud-upload" size={20} color={COLORS.blue043142} />
              <Text style={styles.publishText}>Publish</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.content}
        renderItem={({item, index}) => <Postcard item={item} index={index} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isDrafts ? 'No draft posts yet' : 'No posts available'}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: nw(10),
  },
  postContainer: {
    marginVertical: nh(2),
  },
  imageContainer: {
    marginVertical: nh(2),
  },
  videoContainer: {
    borderRadius: nh(10),
    marginRight: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.grey333333 + '10',
  },
  mediaContent: {
    height: 200,
    width: (DEVICE_WIDTH - nw(48)) / 2,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(12),
    borderWidth: 1,
    borderColor: COLORS.grey333333 + '10',
  },
  draftControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(6),
    marginTop: nh(4),
  },
  draftLabel: {
    color: COLORS.grey999999,
    fontSize: 12,
    fontWeight: 'bold',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nh(4),
  },
  publishText: {
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.blue043142,
    marginLeft: nw(4),
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyText: {
    color: COLORS.grey999999,
    fontSize: 16,
  },
});
