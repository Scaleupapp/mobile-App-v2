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
  
  // Animation value
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animate progress in a continuous loop
  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: normalizedProgress,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );

    loopAnimation.start();

    // Clean up animation on unmount
    return () => loopAnimation.stop();
  }, [normalizedProgress]);

  // Interpolate height based on progress
  const fillHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
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
