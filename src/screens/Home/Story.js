import React, {useState, useEffect, useRef} from 'react';
import {AddStory} from './AddStory';
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
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import Text from '../../components/Text';
import {deleteStory} from '../../services/apiService';
import Icon from '../../helper/icon';
import {COLORS} from '../../helper/colors';
import {useSelector} from 'react-redux';

const {width, height} = Dimensions.get('window');
const STORY_DURATION = 30000;
const API_BASE_URL = 'https://api.scaleupapp.club/api';

export const Story = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [groupedStories, setGroupedStories] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewers, setViewers] = useState([]);
  const progressAnimations = useRef([]);
  const currentAnimation = useRef(null);
  const userData = useSelector(state => state?.userData);
  const [profileData, setProfileData] = useState(userData);

  useEffect(() => {
    fetchStories();
  }, []);
  useEffect(() => {
    fetchStories();
    return () => {
      if (currentAnimation.current) {
        currentAnimation.current.stop();
      }
    };
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, storiesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/user`),
        axios.get(`${API_BASE_URL}/stories?userId=${userData?.id}`),
      ]);
      const users = usersResponse.data || [];
      const stories = storiesResponse.data || [];
      // Filter out expired stories
      const activeStories = stories.filter(
        story => getRemainingTime(story.expiresAt) > 0,
      );
      let grouped = users
        .map(user => ({
          ...user,
          stories:
            activeStories.filter(
              story => story.user && story.user._id === user._id,
            ) || [],
        }))
        .filter(user => user.stories.length > 0);
      grouped = grouped.map(user => ({
        ...user,
        allStoriesViewed: user.stories.every(story => story.isViewed),
      }));
      // Sort by view status and expiration time
      grouped.sort((a, b) => {
        if (a.allStoriesViewed !== b.allStoriesViewed) {
          return a.allStoriesViewed ? 1 : -1;
        }
        // Sort by earliest expiring story within each user's stories
        const aEarliestExpiry = Math.min(
          ...a.stories.map(s => new Date(s.expiresAt).getTime()),
        );
        const bEarliestExpiry = Math.min(
          ...b.stories.map(s => new Date(s.expiresAt).getTime()),
        );
        return aEarliestExpiry - bEarliestExpiry;
      });
      setGroupedStories(grouped);
      if (grouped.length > 0) {
        progressAnimations.current = grouped.map(user =>
          user.stories.map(() => new Animated.Value(0)),
        );
      }
    } catch (error) {
      console.error('Error fetching stories:', error?.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  // Add expiration polling to check for expired stories
  useEffect(() => {
    const checkExpiration = setInterval(() => {
      setGroupedStories(prevStories => {
        const updatedStories = prevStories
          .map(user => ({
            ...user,
            stories: user.stories.filter(
              story => getRemainingTime(story.expiresAt) > 0,
            ),
          }))
          .filter(user => user.stories.length > 0);
        if (updatedStories.length !== prevStories.length) {
          if (
            modalVisible &&
            currentUser &&
            !updatedStories.find(u => u._id === currentUser._id)?.stories[
              currentStoryIndex
            ]
          ) {
            setModalVisible(false);
            resetAllProgress();
          }
          return updatedStories;
        }
        return prevStories;
      });
    }, 100000000);
    return () => clearInterval(checkExpiration);
  }, [modalVisible, currentUser, currentStoryIndex]);

  const getRemainingTime = expiresAt => {
    if (!expiresAt) return null;
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = expiry - now;
    return remaining > 0 ? remaining : 0;
  };

  const markStoryAsViewed = async storyId => {
    if (!profileData?.id) return;
    try {
      await axios.post(`${API_BASE_URL}/stories/view`, {
        userId: profileData.id,
        storyId,
      });
      setGroupedStories(prev => {
        return prev.map(user => ({
          ...user,
          stories: user.stories.map(story =>
            story._id === storyId ? {...story, isViewed: true} : story,
          ),
        }));
      });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
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
    if (!progressAnimations.current[currentUserIndex]) {
      progressAnimations.current[currentUserIndex] = currentUserStories.map(
        () => new Animated.Value(0),
      );
    }
    currentUserStories.forEach((_, index) => {
      if (index > currentStoryIndex) {
        progressAnimations.current[currentUserIndex][index]?.setValue(0);
      }
    });
    if (progressAnimations.current[currentUserIndex][currentStoryIndex]) {
      const animation = Animated.timing(
        progressAnimations.current[currentUserIndex][currentStoryIndex],
        {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        },
      );
      currentAnimation.current = animation;
      animation.start(({finished}) => {
        if (finished && !isPaused) {
          handleNextStory();
        }
      });
    }
  };

  const handleNextStory = async () => {
    const currentUser = groupedStories[currentUserIndex];
    if (!currentUser) return;
    const currentStory = currentUser.stories[currentStoryIndex];
    if (currentStory && !currentStory.isViewed) {
      await markStoryAsViewed(currentStory._id);
    }
    const isLastStoryInUser =
      currentStoryIndex === currentUser.stories.length - 1;
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
      progressAnimations.current[currentUserIndex]?.[
        currentStoryIndex
      ]?.setValue(0);
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      const prevUserStories = groupedStories[prevUserIndex].stories;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  };

  const resetAllProgress = () => {
    progressAnimations.current.forEach(userProgressBars => {
      if (userProgressBars) {
        userProgressBars.forEach(progressBar => {
          if (progressBar) {
            progressBar.setValue(0);
          }
        });
      }
    });
  };

  const handleStoryPress = userIndex => {
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

  // Function to fetch viewers for the current story (only for creator)
  const fetchViewers = async () => {
    if (!currentStory || !profileData) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stories/${currentStory._id}/views`,
        {headers: {Authorization: `Bearer ${userData?.token}`}},
      );
      setViewers(response.data);
      setViewersModalVisible(true);
    } catch (error) {
      console.error(
        'Error fetching story viewers:',
        error.response?.data || error.message,
      );
    }
  };

  const currentUser = groupedStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  // Modified thumbnail rendering to show view status
  const renderThumbnail = (user, userIndex) => {
    const allStoriesViewed = user.allStoriesViewed;
    const earliestExpiry = Math.min(
      ...user.stories.map(s => getRemainingTime(s.expiresAt)),
    );
    const hoursRemaining = Math.floor(earliestExpiry / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      (earliestExpiry % (1000 * 60 * 60)) / (1000 * 60),
    );
    return (
      <View
        key={user._id}
        style={[
          styles.thumbnailGroup,
          allStoriesViewed && styles.viewedThumbnailGroup,
        ]}>
        <TouchableOpacity
          onPress={() => handleStoryPress(userIndex)}
          style={[
            styles.thumbnailBorder,
            {
              borderColor: allStoriesViewed ? 'grey' : '#ff3040',
              borderWidth: allStoriesViewed ? 3 : 3,
            },
          ]}>
          <Image
            source={{uri: user.profilePicture}}
            style={[
              styles.thumbnailImage,
              allStoriesViewed && styles.viewedThumbnailImage,
            ]}
          />
          <View style={styles.expiryBadge}>
            <Text style={styles.expiryText}>
              {hoursRemaining > 0
                ? `${hoursRemaining}h`
                : `${minutesRemaining}m`}
            </Text>
          </View>
        </TouchableOpacity>
        <Text
          style={[styles.username, allStoriesViewed && styles.viewedUsername]}>
          {user.username}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailScroll}>
        <AddStory onStoryAdded={fetchStories} />
        {groupedStories.map((user, userIndex) =>
          renderThumbnail(user, userIndex),
        )}
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
                      width:
                        progressAnimations.current[currentUserIndex]?.[
                          index
                        ]?.interpolate({
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
              source={{uri: currentUser?.profilePicture}}
              style={styles.modalUserProfilePicture}
            />
            <Text style={styles.modalUsername}>{currentUser?.username}</Text>
            {currentUser?._id === profileData?.id ? (
              <TouchableOpacity
                style={[styles.closeButton, {right: 45, top: 12}]}
                onPress={() => {
                  handleTouchStart();
                  Alert.alert(
                    'Delete Story',
                    'Are you sure you want to delete story?',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {
                          handleTouchEnd();
                        },
                        style: 'cancel',
                      },
                      {
                        text: 'Yes',
                        onPress: async () => {
                          try {
                            await axios.delete(API_BASE_URL + '/stories', {
                              headers: {
                                Authorization: `Bearer ${userData?.token}`,
                                'Content-Type': 'application/json',
                              },
                              data: {storyId: currentStory?._id},
                            });
                            setModalVisible(false);
                            resetAllProgress();
                            fetchStories();
                          } catch (error) {}
                        },
                      },
                    ],
                    {cancelable: true},
                  );
                }}>
                <Icon
                  type={'antdesign'}
                  color={COLORS.whiteFFFFFF}
                  name={'delete'}
                  size={20}
                />
              </TouchableOpacity>
            ) : null}
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
            {currentStory?.type === 'image/jpeg' ? (
              <>
                {console.log('Image URI:', currentStory?.url)}
                <Image
                  source={{
                    uri: currentStory?.url,
                  }}
                  style={styles.storyMedia}
                  resizeMode="contain"
                />
              </>
            ) : currentStory?.type === 'video' ? (
              <>
                {console.log('Video URI:', currentStory?.url)}
                <Video
                  source={{
                    uri: currentStory?.url,
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

          {/* "Viewers" button at the bottom (only for the story creator) */}
          {currentUser?._id === profileData?.id && (
            <TouchableOpacity
              style={styles.viewersButtonBottom}
              onPress={fetchViewers}>
              <Text style={styles.viewersButtonText}>Views</Text>
            </TouchableOpacity>
          )}

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

      {/* Viewers Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewersModalVisible}
        onRequestClose={() => setViewersModalVisible(false)}>
        <View style={styles.viewersModalContainer}>
          <View style={styles.viewersModalContent}>
            <Text style={styles.viewersModalTitle}>Viewers</Text>
            <ScrollView>
              {viewers.map((view, index) => (
                <View key={index} style={styles.viewerRow}>
                  <Image
                    source={{uri: view.user.profilePicture}}
                    style={styles.viewerImage}
                  />
                  <Text style={styles.viewerName}>{view.user.username}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeViewersButton}
              onPress={() => setViewersModalVisible(false)}>
              <Text style={styles.closeViewersButtonText}>Close</Text>
            </TouchableOpacity>
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
  expiryBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 3,
    minWidth: 25,
    alignItems: 'center',
  },
  expiryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
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
  viewersButtonBottom: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 110,
  },
  viewersButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewersModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewersModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  viewersModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  viewerName: {
    fontSize: 14,
    color: '#000',
  },
  closeViewersButton: {
    backgroundColor: '#ff3040',
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  closeViewersButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Story;
