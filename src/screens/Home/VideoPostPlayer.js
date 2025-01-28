import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import convertToProxyURL from 'react-native-video-cache';
import Icon from '../../helper/icon';

const VideoPostPlayer = ({
  videoUrl,
  thumbnail,
  isVisible,
  onProgress,
  onEnd,
  style,
  videoDimensions,
}) => {
  const videoRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizeMode, setResizeMode] = useState('cover');

  useEffect(() => {
    if (!isVisible) {
      if (videoRef.current) {
        videoRef.current.seek(0);
        setCurrentTime(0);
        setPaused(true);
        progressAnim.setValue(0);
      }
    } else {
      setPaused(false);
    }
  }, [isVisible]);

  // Handle orientation changes in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      // Set resizeMode to 'contain' in fullscreen
      setResizeMode('contain');
    } else {
      // Reset to 'cover' when exiting fullscreen
      setResizeMode('cover');
    }
  }, [isFullscreen]);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const remaining = duration - currentTime;
    return `-${formatTime(remaining)}`;
  };

  const handleProgress = progress => {
    const {currentTime: time} = progress;
    setCurrentTime(time);

    if (!scrubbing) {
      Animated.timing(progressAnim, {
        toValue: (time / duration) * 100,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }

    onProgress?.(progress);
  };

  const handleLoad = meta => {
    setDuration(meta.duration);
  };

  const handleEnd = () => {
    setPaused(true);
    videoRef.current?.seek(0);
    setCurrentTime(0);
    progressAnim.setValue(0);
    onEnd?.();
  };

  const handlePress = () => {
    setPaused(!paused);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.presentFullscreenPlayer();
      } else {
        videoRef.current.dismissFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={handlePress}>
        <Video
          ref={videoRef}
          source={{uri: convertToProxyURL(videoUrl)}}
          style={[
            styles.video,
            videoDimensions?.height
              ? {
                  aspectRatio: Number(
                    videoDimensions.width / videoDimensions.height,
                  ),
                  width: DEVICE_WIDTH - nw(32),
                }
              : {
                  height: nh(250),
                  width: DEVICE_WIDTH - nw(32),
                },
          ]}
          paused={paused}
          muted={muted}
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={handleEnd}
          resizeMode={resizeMode}
          repeat={false}
          poster={thumbnail}
          posterResizeMode="cover"
          playInBackground={false}
          playWhenInactive={false}
          onFullscreenPlayerWillDismiss={() => {
            setIsFullscreen(false);
            setResizeMode('cover');
          }}
          onFullscreenPlayerDidPresent={() => {
            setIsFullscreen(true);
            setResizeMode('contain');
          }}
          fullscreenAutorotate={true} // Enable auto-rotation in fullscreen
          fullscreenOrientation="all" // Allow all orientations in fullscreen
        />

        {/* Control overlay */}
        <View style={styles.controlsOverlay}>
          <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
            <Icon
              type="ionicon"
              name={muted ? 'volume-mute' : 'volume-medium'}
              size={24}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleFullscreen}
            style={styles.controlButton}>
            <Icon
              type="ionicon"
              name={isFullscreen ? 'contract' : 'expand'}
              size={24}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>
        </View>

        {/* Timer display */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{getRemainingTime()}</Text>
        </View>
      </Pressable>

      {/* Progress bar container */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground} />
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.progressIndicator,
            {
              left: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              transform: [{translateX: -6}],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: nh(12),
    overflow: 'hidden',
    backgroundColor: COLORS.whiteFFFFFF,
    marginVertical: nh(10),
  },
  video: {
    backgroundColor: COLORS.whiteFFFFFF,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#FF0000',
    position: 'absolute',
  },
  progressIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  timerContainer: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default VideoPostPlayer;
