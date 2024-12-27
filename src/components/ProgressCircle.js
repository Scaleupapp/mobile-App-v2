import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../helper/colors';

const ProgressCircle = ({ 
  progress, 
  size = 40, 
  strokeWidth = 4, 
  style 
}) => {
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Animation values
  const waveOffset = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress to target value
    Animated.timing(progressAnim, {
      toValue: normalizedProgress,
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Continuous wave animation
    const waveAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(waveOffset, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(waveOffset, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );

    waveAnimation.start();

    return () => waveAnimation.stop();
  }, [normalizedProgress]);

  // Create wave pattern using multiple sine waves
  const createWavePattern = () => {
    const amplitude = size * 0.1; // Wave height
    const frequency = size * 0.15; // Wave frequency
    
    return waveOffset.interpolate({
      inputRange: [0, 1],
      outputRange: [0, size],
    }).interpolate({
      inputRange: Array.from({ length: 10 }, (_, i) => i * (size / 9)),
      outputRange: Array.from({ length: 10 }, (_, i) => 
        amplitude * Math.sin((i / frequency) * Math.PI)
      ),
    });
  };

  // Calculate fill height based on progress
  const fillHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size],
  });

  return (
    <View 
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: COLORS.grey999999,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#2fa7b4',
          height: fillHeight,
          transform: [
            { 
              translateY: createWavePattern()
            }
          ],
        }}
      />
      
      <Text 
        style={{
          color: COLORS.blue043142,
          fontSize: size / 3.5,
          fontWeight: 'bold',
          zIndex: 1,
        }}
      >
        {`${Math.round(normalizedProgress * 100)}%`}
      </Text>
    </View>
  );
};

export default ProgressCircle;