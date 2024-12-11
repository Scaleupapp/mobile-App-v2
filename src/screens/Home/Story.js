import React, { useState, useEffect, useRef } from 'react';
import { AddStory } from './AddStory'; // Adjust the path as needed
import axios from 'axios';
import { View, Image, TouchableOpacity, ScrollView, Modal, Dimensions, StyleSheet, Animated } from 'react-native';
import Video from 'react-native-video';
import Text from '../../components/Text';

const { width, height } = Dimensions.get('window');

export const Story = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [groupedStories, setGroupedStories] = useState([]);
  const [viewedStories, setViewedStories] = useState({});
  const progressAnims = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersResponse = await axios.get('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/user');
        const storiesResponse = await axios.get('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/stories');
  
        const users = usersResponse.data;
        const stories = storiesResponse.data;
  
        // Group stories by user ID
        const grouped = users
          .map(user => ({
            ...user,
            stories: stories.filter(story => story.user && story.user._id === user._id),
          }))
          .filter(user => user.stories.length > 0); // Only include users with stories
  
        setGroupedStories(grouped);
  
        // Initialize progress animations for all users
        progressAnims.current = grouped.map(() => new Animated.Value(0));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
     // Fetch data every second
     const interval = setInterval(fetchData, 1000);
  
     // Fetch data immediately on component mount
     fetchData();
   
     // Clear the interval when the component unmounts
     return () => clearInterval(interval);
  }, []);
  
  
  
  

  const startProgressAnimation = (duration) => {
    Animated.timing(progressAnims.current[currentUserIndex], {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNextStory();
    });
  };

  const handleNextStory = () => {
    const currentUser = groupedStories[currentUserIndex];
    const isLastStoryInUser = currentStoryIndex === currentUser.stories.length - 1;

    // Mark current story as viewed
    const updatedViewedStories = { ...viewedStories };
    if (!updatedViewedStories[currentUser._id]) {
      updatedViewedStories[currentUser._id] = new Set();
    }
    updatedViewedStories[currentUser._id].add(currentStoryIndex);
    setViewedStories(updatedViewedStories);

    if (isLastStoryInUser) {
      const isLastUser = currentUserIndex === groupedStories.length - 1;
      if (isLastUser) {
        setModalVisible(false);
      } else {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
      }
    } else {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(groupedStories[prevUserIndex].stories.length - 1);
    }
  };

  const handleStoryPress = (userIndex, storyIndex) => {
    setModalVisible(true);
    setCurrentUserIndex(userIndex);
    setCurrentStoryIndex(storyIndex);
    progressAnims.current[userIndex].setValue(0);
    startProgressAnimation(5000); // 5 seconds per story
  };

  const isStoryViewed = (userId, storyIndex) => {
    return viewedStories[userId] && viewedStories[userId].has(storyIndex);
  };

  const currentUser = groupedStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  
  return (
    <View style={styles.container}>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.thumbnailScroll}
      >
        <AddStory/>
        {groupedStories.map((user, userIndex) => (
          <View key={user._id} style={styles.thumbnailGroup}>
            <TouchableOpacity 
              onPress={() => handleStoryPress(userIndex, 0)}
              style={[
                styles.thumbnailBorder,
                {
                  borderColor: user.stories.every((_, index) => 
                    isStoryViewed(user._id, index)
                  ) ? 'green' : 'red'
                }
              ]}
            >
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
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {currentUser?.stories.map((_, index) => (
              <View 
                key={index} 
                style={styles.progressBarBackground}
              >
                <Animated.View 
                  style={[
                    styles.progressBarForeground,
                    {
                      width: progressAnims.current[currentUserIndex]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', index === currentStoryIndex ? '100%' : '0%']
                      })
                    }
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
          </View>

          {/* Story Content */}
          {currentStory?.type === 'image' ? (
              <Image
                source={{ uri: `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}` }}
                style={styles.storyImage}
                resizeMode="contain"
              />
            ) : currentStory?.type === 'video' ? (
              <Video
                source={{ uri: `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api${currentStory?.url}` }}
                style={styles.storyImage}
                resizeMode="contain"
                paused={false}
                onEnd={handleNextStory}
              />
            ) : null}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              onPress={handlePreviousStory} 
              style={styles.navButton}
            />
            <TouchableOpacity 
              onPress={handleNextStory} 
              style={styles.navButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  thumbnailScroll: { 
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  thumbnailGroup: { 
    alignItems: 'center', 
    marginHorizontal: 5 
  },
  thumbnailBorder: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 2,
  },
  thumbnailImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40 
  },
  username: { 
    fontSize: 12, 
    color: 'black', 
    textAlign: 'center', 
    marginTop: 5 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'black', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  progressContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
  },
  progressBarForeground: {
    height: '100%',
    backgroundColor: 'white',
  },
  userInfoContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  modalUserProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalUsername: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyImage: { 
    width: width * 0.9, 
    height: height * 0.7 
  },
  navigationButtons: {
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
});

export default Story;