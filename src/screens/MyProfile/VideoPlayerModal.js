import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Icon from '../../helper/icon';
import { COLORS } from '../../helper/colors';
import Text from '../../components/Text';

const VideoPlayerModal = ({ visible, videoUrl, onClose }) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [videoError, setVideoError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleRotate = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon
            type="ionicon"
            name="close"
            size={30}
            color={COLORS.whiteFFFFFF}
          />
        </TouchableOpacity>

        <View style={styles.videoContainer}>
          {isLoading && (
            <ActivityIndicator
              size="large"
              color={COLORS.whiteFFFFFF}
              style={styles.loadingIndicator}
            />
          )}
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={[
              styles.videoPlayer,
              { transform: [{ rotate: `${rotation}deg` }] },
            ]}
            paused={isPaused}
            muted={isMuted}
            resizeMode="contain"
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            onError={(error) => {
              console.error('Video Error:', error);
              setVideoError(error?.errorString || 'Unknown error');
            }}
          />

          {videoError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>
                Unable to load video: {videoError}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controlOverlay}>
          <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
            <Icon
              type="ionicon"
              name={isPaused ? 'play' : 'pause'}
              size={30}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <Icon
              type="ionicon"
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={30}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
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
    paddingVertical: 10,
  },
  controlButton: {
    marginHorizontal: 20,
    padding: 10,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    zIndex: 1,
  },
});

export default VideoPlayerModal;
