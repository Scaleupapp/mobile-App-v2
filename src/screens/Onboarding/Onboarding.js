import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {COLORS} from '../../helper/colors';
import Text from '../../components/Text';
import {images} from '../../assets/images';
import {
  getTrackingStatus,
  requestTrackingPermission,
} from 'react-native-tracking-transparency';

const data = [
  {
    image: images.intro1, // Replace with your image URL
    h1: 'Welcome to ScaleUp!',
    h2: 'Your journey to focused, distraction-free learning starts here. Discover a platform designed to enhance your knowledge and keep you engaged.',
    arrow: images.circlearrow1,
  },
  {
    image: images.intro2, // Replace with your image URL
    h1: 'Personalized Learning Paths',
    h2: 'Set your goals and interests to receive tailored course recommendations. We curate content just to help you stay motivated and achieve your objectives.',
    arrow: images.circlearrow2,
  },
  {
    image: images.intro3, // Replace with your image URL
    h1: 'Interactive & Engaging Features',
    h2: 'Dive into a variety of interactive modules, quizzes, and community discussions. We make learning fun and interactive, ensuring you stay on track.',
    arrow: images.circlearrow3,
  },
  {
    image: images.intro4, // Replace with your image URL
    h1: 'Track Your Progress',
    h2: 'Use our analytics tools to monitor your learning journey, get detailed feedback, insights, celebrate your achievements and identify areas for improvement.',
    arrow: images.circlearrow4,
  },
];

const OnboardingScreen = ({navigation}) => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < data.length - 1) {
      setIndex(index + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const attPopup = async () => {
    const trackingStatus = await getTrackingStatus();
    console.log('🚀 ~ attPopup ~ trackingStatus:', trackingStatus);
    if (trackingStatus === 'not-determined') {
      const trackingStatus1 = await requestTrackingPermission();
      if (
        trackingStatus1 === 'authorized' ||
        trackingStatus1 === 'unavailable'
      ) {
        // enable tracking features
      }
    }
  };
  useEffect(() => {
    if (Platform.OS === 'ios') {
      attPopup();
    }
  }, []);

  return (
    <View style={{flex: 1}}>
      <LinearGradient
        colors={['rgba(245, 190, 0, 0.15)', COLORS.yellowF5BE00]}
        style={styles.container}>
        <Image source={data[index].image} style={styles.image} />
        <Text variant="bold20" color={COLORS.blue043142}>
          {data[index].h1}
        </Text>
        <Text
          variant="semibold14"
          color={COLORS.blue043142}
          style={{textAlign: 'center', marginHorizontal: 16}}>
          {data[index].h2}
        </Text>
        <TouchableOpacity onPress={handleNext}>
          <Image
            source={data[index].arrow}
            style={styles.arrow}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    height: DEVICE_HEIGHT,
    width: DEVICE_WIDTH,
  },
  image: {
    width: nw(343),
    height: nh(343),
    marginBottom: nh(20),
    marginTop: nh(100),
  },
  arrow: {
    width: nw(60),
    height: nh(60),
    marginTop: nh(50),
  },
});

export default OnboardingScreen;
