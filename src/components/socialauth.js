import React, {useEffect, useState} from 'react';
import {
  View,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import Button from './Button';
import Text from './Text';
import {APP_FONTS} from '../assets/fonts';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {icons} from '../assets/icons';
import {COLORS} from '../helper/colors';
import {loginApi, registerApi} from '../services/apiService';
import {actions} from '../redux/reducers';
import Routes from '../helper/routes';

const SocialLogin = ({signup = false}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      // iOS client ID
      iosClientId: '904486363410-khm24rnus7cfdhq6culdepe4jhunrsof.apps.googleusercontent.com',
      // Android client ID
      webClientId: '904486363410-gj81qip7agmdniss7tkt74fkan4alcf1.apps.googleusercontent.com',
      offlineAccess: false,
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: false,
    });
  };

  const extractUserData = (user) => ({
    username: (user.name || `${user.givenName}${user.familyName}`)?.trim(),
    email: user.email?.trim() || '',
    password: user.id?.toString() || '',
    firstname: user.givenName?.trim() || '',
    lastname: user.familyName?.trim() || '',
    profilePicture: user.photo || '',
    isbasicProfileComplete: true,
  });

  const handleAuthentication = async (userData) => {
    try {
      // Attempt login first
      const {data: loginData} = await loginApi({
        loginIdentifier: userData.email,
        password: userData.password,
      });

      await handleSuccessfulAuth(loginData);
    } catch (loginError) {
      // If login fails, attempt registration
      try {
        const {data: registrationData} = await registerApi(userData);
        await handleSuccessfulAuth(registrationData);
      } catch (registrationError) {
        throw new Error(
          registrationError.response?.data?.message ||
            'Unable to create account. Please try again.',
        );
      }
    }
  };

  const handleSuccessfulAuth = async (data) => {
    const stringifiedUserData = JSON.stringify(data);
    await AsyncStorage.setItem('userData', stringifiedUserData);
    dispatch(actions.setUserData(data));
    navigation.reset({
      index: 0,
      routes: [{name: Routes.Home}],
    });
  };

  const handleGoogleAuth = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign out first to ensure a fresh login attempt
      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.user) {
        throw new Error('Failed to get user information');
      }

      const userData = extractUserData(userInfo.user);
      await handleAuthentication(userData);
    } catch (error) {
      console.error('Google Auth Error:', error);

      const errorMessages = {
        [statusCodes.SIGN_IN_CANCELLED]: 'Sign in was cancelled',
        [statusCodes.IN_PROGRESS]: 'Sign in is already in progress',
        [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]:
          Platform.select({
            android: 'Google Play services is not available',
            ios: 'Google Sign In services are not available',
          }) || 'Google services are not available',
        DEFAULT: 'An unexpected error occurred. Please try again.',
      };

      Alert.alert(
        'Authentication Error',
        errorMessages[error.code] || errorMessages.DEFAULT,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container(signup)}>
      <Text
        variant="medium12"
        color={COLORS.grey333333}
        style={styles.headerText}>
        {signup ? 'Connect to your social media handles' : 'Or continue with'}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          variant="outline"
          text="Google"
          textStyle={styles.buttonText}
          width={DEVICE_WIDTH - nw(32)}
          leftimage={icons.google}
          onPress={handleGoogleAuth}
          disabled={isLoading}
        >
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loader}
            />
          )}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: (signup) => ({
    marginTop: signup ? nh(60) : 0,
  }),
  headerText: {
    textAlign: 'center',
    marginVertical: nh(15),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  loader: {
    marginLeft: nw(8),
  },
});

export default SocialLogin;