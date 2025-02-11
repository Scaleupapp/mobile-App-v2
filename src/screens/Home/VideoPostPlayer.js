import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
  TouchableOpacity,
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
  globalMuted, // New prop

}) => {
  const videoRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef(null);
  
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizeMode, setResizeMode] = useState('cover');
  const [showControls1, setShowControls] = useState(true);
  

  // Function to hide controls
  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  // Function to show controls
  const showControls = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Reset and start the control hide timer
  const resetControlsTimer = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    if (!paused) {
      controlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 1000);
    }
  };

  // Handle video press
  const handleVideoPress = () => {
    if (showControls) {
      setPaused(!paused);
      resetControlsTimer();
    } else {
      showControls();
      resetControlsTimer();
    }
  };

  // Effect to manage controls visibility
  useEffect(() => {
    if (!isVisible) {
      if (videoRef.current) {
        videoRef.current.seek(0);
        setCurrentTime(0);
        setPaused(true);
        progressAnim.setValue(0);
      }
    } else {
      setPaused(true);
      resetControlsTimer();
    }
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [isVisible]);

  // Effect to handle control visibility when pausing
  useEffect(() => {
    if (paused) {
      showControls();
    } else {
      resetControlsTimer();
    }
  }, [paused]);

  // Effect for fullscreen mode
  useEffect(() => {
    setResizeMode(isFullscreen ? 'contain' : 'cover');
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
    if (!scrubbing) {
      setCurrentTime(progress.currentTime);
      Animated.timing(progressAnim, {
        toValue: (progress.currentTime / duration) * 100,
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
    showControls();
    onEnd?.();
  };

  const toggleMute = () => {
    setMuted(!muted);
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.presentFullscreenPlayer();
      } else {
        videoRef.current.dismissFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
      resetControlsTimer();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={handleVideoPress}>
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
          fullscreenAutorotate={true}
          fullscreenOrientation="all"
        />

        {/* Play/Pause Button */}
        <Animated.View 
          style={[
            styles.centerButton, 
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            onPress={handleVideoPress}
            style={styles.playPauseButton}
          >
            <Icon
              type="ionicon"
              name={paused ? 'play' : 'pause'}
              size={40}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Control overlay */}
        {showControls && (
          <Animated.View 
            style={[
              styles.controlsOverlay,
              { opacity: fadeAnim }
            ]}
          >
            <TouchableOpacity 
              onPress={toggleMute} 
              style={styles.controlButton}
            >
              <Icon
                type="ionicon"
                name={muted ? 'volume-mute' : 'volume-medium'}
                size={24}
                color={COLORS.whiteFFFFFF}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.controlButton}
            >
              <Icon
                type="ionicon"
                name={isFullscreen ? 'contract' : 'expand'}
                size={24}
                color={COLORS.whiteFFFFFF}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Timer display */}
        {showControls && (
          <Animated.View 
            style={[
              styles.timerContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.timerText}>{getRemainingTime()}</Text>
          </Animated.View>
        )}

        {/* Progress bar */}
        {showControls && (
          <Animated.View 
            style={[
              styles.progressContainer,
              { opacity: fadeAnim }
            ]}
          >
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
          </Animated.View>
        )}
      </Pressable>
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
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
  },
  playPauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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