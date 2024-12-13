import React, { useEffect, useState, useRef } from 'react';
import {
  View, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import { APP_FONTS } from '../../assets/fonts';
import Video from 'react-native-video';
import Icon from '../../helper/icon';
import Header from '../../components/Header';
import { images } from '../../assets/images';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { navigationRef } from '../../../App';

// Video Player Modal Component (Kept from original code)
const VideoPlayerModal = ({ 
  visible, 
  videoUrl, 
  onClose 
}) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [videoError, setVideoError] = useState(null);

  const handleRotate = () => {
    setRotation((prevRotation) => {
      const newRotation = (prevRotation + 90) % 360;
      return newRotation;
    });
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Icon 
            type="ionicon" 
            name="close" 
            size={30} 
            color={COLORS.whiteFFFFFF} 
          />
        </TouchableOpacity>

        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={[
              styles.videoPlayer,
              { 
                transform: [{ rotate: `${rotation}deg` }],
                aspectRatio: 16/9,
                width: '100%',
                height: '100%'
              }
            ]}
            paused={isPaused}
            muted={isMuted}
            controls={false}
            fullscreen={true}
            resizeMode="contain"
            onLoadStart={() => console.log('Video loading started:', videoUrl)}
            onLoad={() => console.log('Video loaded successfully')}
            onError={(error) => {
              console.error('Video Error:', error);
              setVideoError(error);
            }}
            pictureInPicture={true}
          />

          {videoError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>
                Unable to load video: {videoError.toString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controlOverlay}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={togglePlayPause}
          >
            <Icon 
              type="ionicon" 
              name={isPaused ? "play" : "pause"} 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleMute}
          >
            <Icon 
              type="ionicon" 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleRotate}
          >
            <Icon 
              type="ionicon" 
              name="refresh" 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
    // Combine styles from both original implementations
    container: { 
      flex: 1, 
      backgroundColor: COLORS.yellowF5BE00 
    },
    layer1: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginTop: nh(32),
      marginHorizontal: nw(16),
      borderTopLeftRadius: nh(25),
      borderTopRightRadius: 25,
    },
    layer2: {
      flex: 1,
      backgroundColor: COLORS.whiteFFFFFF,
      marginTop: nh(15),
      marginHorizontal: nw(-16),
      borderTopLeftRadius: nh(25),
      borderTopRightRadius: nh(25),
      paddingHorizontal: nw(16),
      paddingTop: nh(30),
    },
    images: {
      height: nh(175),
      width: DEVICE_WIDTH - 32,
      alignSelf: 'center',
      marginBottom: nh(10),
    },
    videoListContainer: {
      marginTop: nh(20),
    },
    videoItem: {
      flexDirection: 'row',
      marginBottom: nh(15),
      alignItems: 'center',
    },
    videoThumbnail: {
      width: nw(100),
      height: nh(80),
      borderRadius: 10,
      overflow: 'hidden',
      marginRight: nw(15),
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    videoDetails: {
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      marginTop: nh(50),
    },
    loadingText: {
      textAlign: 'center', 
      marginTop: 20,
      color: COLORS.blue043142
    },
    errorText: {
      textAlign: 'center', 
      marginTop: 20,
      color: 'red'
    },
    // Original video player modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    },
    videoContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    },
    videoPlayer: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10
    },
    controlOverlay: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: 10
    },
    controlButton: {
      marginHorizontal: 20,
      padding: 10
    },
    errorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)'
    }
  });
  
  export default VideoPlayerModal;