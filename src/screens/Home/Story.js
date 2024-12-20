import React, { useState, useEffect, useRef } from 'react';
import { AddStory } from './AddStory';
import axios from 'axios';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import Video from 'react-native-video';
import Text from '../../components/Text';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export const Story = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [groupedStories, setGroupedStories] = useState([]);
  const [viewedStories, setViewedStories] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const progressAnimations = useRef([]);
  const currentAnimation = useRef(null);

  useEffect(() => {
    fetchStories();
    return () => {
      // Cleanup animations on unmount
      if (currentAnimation.current) {
        currentAnimation.current.stop();
      }
    };
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, storiesResponse] = await Promise.all([
        axios.get('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/user'),
        axios.get('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/stories')
      ]);

      const users = usersResponse.data || [];
      const stories = storiesResponse.data || [];

      const grouped = users
        .map(user => ({
          ...user,
          stories: stories.filter(story => 
            story.user && story.user._id === user._id
          ) || [],
        }))
        .filter(user => user.stories.length > 0);

      setGroupedStories(grouped);
      
      // Initialize progress animations after setting grouped stories
      if (grouped.length > 0) {
        progressAnimations.current = grouped.map(user =>
          user.stories.map(() => new Animated.Value(0))
        );
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (modalVisible && !isPaused && !isLoading && groupedStories.length > 0) {
      startProgressAnimations();
    }
  }, [currentUserIndex, currentStoryIndex, modalVisible, isPaused, isLoading]);

  const startProgressAnimations = () => {
    if (!groupedStories[currentUserIndex]?.stories) return;

    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }

    const currentUserStories = groupedStories[currentUserIndex].stories;
    
    // Ensure the animation array exists for current user
    if (!progressAnimations.current[currentUserIndex]) {
      progressAnimations.current[currentUserIndex] = currentUserStories.map(() => new Animated.Value(0));
    }

    // Reset progress for upcoming stories
    currentUserStories.forEach((_, index) => {
      if (index > currentStoryIndex) {
        progressAnimations.current[currentUserIndex][index]?.setValue(0);
      }
    });

    // Create and start animation for current story
    if (progressAnimations.current[currentUserIndex][currentStoryIndex]) {
      const animation = Animated.timing(
        progressAnimations.current[currentUserIndex][currentStoryIndex],
        {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        }
      );

      currentAnimation.current = animation;
      animation.start(({ finished }) => {
        if (finished && !isPaused) {
          handleNextStory();
        }
      });
    }
  };

  const handleNextStory = () => {
    const currentUser = groupedStories[currentUserIndex];
    if (!currentUser) return;

    const isLastStoryInUser = currentStoryIndex === currentUser.stories.length - 1;
    
    // Mark current story as viewed
    const newViewedStories = { ...viewedStories };
    if (!newViewedStories[currentUser._id]) {
      newViewedStories[currentUser._id] = new Set();
    }
    newViewedStories[currentUser._id].add(currentStoryIndex);
    setViewedStories(newViewedStories);

    if (isLastStoryInUser) {
      if (currentUserIndex === groupedStories.length - 1) {
        setModalVisible(false);
        resetAllProgress();
      } else {
        setCurrentUserIndex(prev => prev + 1);
        setCurrentStoryIndex(0);
      }
    } else {
      setCurrentStoryIndex(prev => prev + 1);
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      progressAnimations.current[currentUserIndex]?.[currentStoryIndex]?.setValue(0);
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      const prevUserStories = groupedStories[prevUserIndex].stories;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  };

  const resetAllProgress = () => {
    progressAnimations.current.forEach((userProgressBars) => {
      if (userProgressBars) {
        userProgressBars.forEach((progressBar) => {
          if (progressBar) {
            progressBar.setValue(0);
          }
        });
      }
    });
  };

  const handleStoryPress = (userIndex) => {
    if (!groupedStories[userIndex]) return;
    
    setModalVisible(true);
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(0);
    resetAllProgress();
  };

  const handleTouchStart = () => {
    setIsPaused(true);
    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    startProgressAnimations();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading stories...</Text>
      </View>
    );
  }

  const currentUser = groupedStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailScroll}>
        <AddStory />
        {groupedStories.map((user, userIndex) => (
          <View key={user._id} style={styles.thumbnailGroup}>
            <TouchableOpacity
              onPress={() => handleStoryPress(userIndex)}
              style={[
                styles.thumbnailBorder,
                {
                  borderColor: user.stories.every((_, index) =>
                    viewedStories[user._id]?.has(index)
                  )
                    ? 'green'
                    : '#ff3040',
                },
              ]}>
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.thumbnailImage}
              />
            </TouchableOpacity>
            <Text style={styles.username}>{user.username}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetAllProgress();
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.progressContainer}>
            {currentUser?.stories.map((_, index) => (
              <View key={index} style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarForeground,
                    {
                      width: progressAnimations.current[currentUserIndex]?.[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }) || '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.userInfoContainer}>
            <Image
              source={{ uri: currentUser?.profilePicture }}
              style={styles.modalUserProfilePicture}
            />
            <Text style={styles.modalUsername}>{currentUser?.username}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                resetAllProgress();
              }}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.storyContent}>
              {currentStory?.type === 'image' ? (
                <>
                  {/* Log the URI for the image */}
                  {console.log('Image URI:', `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}`)}

                  <Image
                    source={{
                      uri: `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}`,
                    }}
                    style={styles.storyMedia}
                    resizeMode="contain"
                  />
                </>
              ) : currentStory?.type === 'video' ? (
                <>
                  {/* Log the URI for the video */}
                  {console.log('Video URI:', `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}`)}

                  <Video
                    source={{
                      uri: `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}`,
                    }}
                    style={styles.storyMedia}
                    resizeMode="contain"
                    paused={isPaused}
                    onEnd={handleNextStory}
                    repeat={false}
                  />
                </>
              ) : null}
          </View>



          <View style={styles.navigationContainer}>
            <Pressable
              style={[styles.navButton, styles.leftNav]}
              onPressIn={handleTouchStart}
              onPressOut={handleTouchEnd}
              onPress={handlePreviousStory}
            />
            <Pressable
              style={[styles.navButton, styles.rightNav]}
              onPressIn={handleTouchStart}
              onPressOut={handleTouchEnd}
              onPress={handleNextStory}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
  },
  container: {
    backgroundColor: 'white',
  },
  thumbnailScroll: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  thumbnailGroup: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  thumbnailBorder: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 2,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
  },
  progressContainer: {
    flexDirection: 'row',
    padding: 10,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarForeground: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    position: 'absolute',
    top: (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight) + 20,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  modalUserProfilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  modalUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMedia: {
    width: width,
    height: height * 0.8,
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
  },
  leftNav: {
    width: '30%',
  },
  rightNav: {
    width: '70%',
  },
});

export default Story;