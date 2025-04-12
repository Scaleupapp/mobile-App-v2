import React, {useEffect} from 'react';
import {View, Alert} from 'react-native';
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

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId:
        '904486363410-s58snm1cq4nahervn6fvkoifsj5qn5k9.apps.googleusercontent.com',
        iosClientId: '904486363410-khm24rnus7cfdhq6culdepe4jhunrsof.apps.googleusercontent.com', // Added this line
      offlineAccess: true,
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    });
  };

  const saveUserDataAndNavigate = async (userData) => {
    try {
      console.log('Saving user data:', userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      dispatch(actions.setUserData(userData));
      navigation.navigate(Routes.Home);
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save user data. Please try again.');
    }
  };

  const processGoogleUser = (googleResponse) => {
    // Access the user data from the correct path in the response
    const user = googleResponse?.data?.user;
    console.log('Processing Google user:', user);
    
    if (!user || !user.email) {
      throw new Error('Invalid Google user data received');
    }

    const userData = {
      username: user.email.split('@')[0].toLowerCase().trim(),
      email: user.email.toLowerCase().trim(),
      password: `google_${user.id}`,
      firstname: user.givenName || user.name.split(' ')[0] || '',
      lastname: user.familyName || user.name.split(' ').slice(1).join(' ') || '',
      profilePicture: user.photo || '',
      isbasicProfileComplete: false,
    };
    
    console.log('Processed user data:', userData);
    return userData;
  };

  const attemptLogin = async (userData) => {
    try {
      const { data } = await loginApi({
        loginIdentifier: userData.email,
        password: userData.password
      });
      return { success: true, data };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false };
      }
      throw error; // Rethrow other errors
    }
  };

  const attemptRegistration = async (userData) => {
    console.log('Attempting registration with:', userData);
    
    try {
      const {data} = await registerApi({
        ...userData,
        // Ensure these fields are properly formatted for your API
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstname: userData.firstname || userData.username,
        lastname: userData.lastname || '',
        profilePicture: userData.profilePicture,
        isbasicProfileComplete: false,
      });
      return {success: true, data};
    } catch (error) {
      console.log('Registration error:', error.response?.data);
      throw error;
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // 1. Google Sign In
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo);
  
      // The email is nested in userInfo.user.email
      const googleUser = userInfo?.data?.user;
      console.log('bbbbbbbbbbb',googleUser)
      
      if (!googleUser?.email) {
        throw new Error('No email received from Google');
      }
  
      // 2. First try login
      try {
        const loginPayload = {
          loginIdentifier: googleUser.email,
          password: `google_${googleUser.id}`
        };
  
        console.log('Attempting login with:', loginPayload);
        const loginResponse = await loginApi(loginPayload);
        
        if (loginResponse?.data) {
          await saveUserDataAndNavigate(loginResponse?.data);
          return;
        }
  
      } catch (loginError) {
        console.log('Login error:', loginError.response?.data);
        
        // If login fails with 401, means user needs to register
        if (loginError.response?.status === 401) {
          console.log('Login failed, attempting registration');
  
          const registrationPayload = {
            username: googleUser.email.split('@')[0].toLowerCase(),
            email: googleUser.email.toLowerCase(),
            password: `google_${googleUser.id}`,
            firstname: googleUser.givenName || googleUser.name.split(' ')[0],
            lastname: googleUser.familyName || googleUser.name.split(' ').slice(1).join(' ') || '',
            profilePicture: googleUser.photo || '',
            isbasicProfileComplete: false,
          };
  
          console.log('Attempting registration with:', registrationPayload);
  
          try {
            const registerResponse = await registerApi(registrationPayload);
  
            if (registerResponse?.data?.message === "Registration successful") {
              console.log('Registration successful, navigating to Preferences');
              navigation.navigate(Routes.Preferences);
              return;
            }
            
          } catch (registrationError) {
            console.error('Registration error:', registrationError.response?.data);
            Alert.alert(
              'Registration Failed',
              registrationError.response?.data?.message || 'Registration failed. Please try again.'
            );
            return;
          }
        }
  
        // If not a 401 error or registration failed
        Alert.alert(
          'Login Failed',
          loginError.response?.data?.message || 'Authentication failed. Please try again.'
        );
      }
  
    } catch (error) {
      console.error('Google Auth Error:', error);
  
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return; // User cancelled the login flow
      }
  
      const errorMessages = {
        [statusCodes.IN_PROGRESS]: 'Sign in is already in progress',
        [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]: 'Please install or update Google Play Services',
        DEFAULT: 'Authentication failed. Please try again.'
      };
  
      Alert.alert(
        'Authentication Error',
        error.message || errorMessages[error.code] || errorMessages.DEFAULT
      );
    }
  };

  

  return (
    <View style={{marginTop: signup ? nh(60) : 0}}>
      <Text
        variant="medium12"
        color={COLORS.grey333333}
        style={{textAlign: 'center', marginVertical: nh(15)}}>
        {signup}
      </Text>
      {/* <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Button
          variant="outline"
          text="Google"
          textStyle={{
            fontSize: nh(12),
            fontFamily: APP_FONTS.PoppinsMedium
          }}
          width={DEVICE_WIDTH - nw(32)}
          leftimage={icons.google}
          onPress={handleGoogleAuth}
        />
      </View> */}
    </View>
  );
};

export default SocialLogin;