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
import {actions} from '../redux/reducers'; // Adjust import based on your Redux setup
import Routes from '../helper/routes'; // Adjust import based on your route configuration

const SocialLogin = ({signup = false}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '280212722139-1hp4dvf54v6l755blp4ghbvmma1oqf6d.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleAuth = async () => {
    try {
      // Ensure Google Play services are available
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Initiate Google Sign-In
      const userInfo = await GoogleSignin.signIn();

      // Extract user data
      const user = userInfo.data.user;
      const userData = {
        username: (user.name || `${user.givenName}${user.familyName}`)?.trim(),
        email: user.email?.trim() || '',
        password: user.id?.toString() || '', // Use Google ID as password
        firstname: user.givenName?.trim() || '',
        lastname: user.familyName?.trim() || '',
        profilePicture: user.photo || '',
        isbasicProfileComplete: true,
      };

      try {
        // First, try to login
        const {data: loginData} = await loginApi({
          loginIdentifier: userData.email,
          password: userData.password,
        });

        // Login successful
        const stringifiedUserData = JSON.stringify(loginData);
        await AsyncStorage.setItem('userData', stringifiedUserData);
        dispatch(actions.setUserData(stringifiedUserData));
        navigation.reset({
          index: 0,
          routes: [{name: Routes.Home}],
        });
      } catch (loginError) {
        // If login fails, attempt to register
        try {
          const {data: registrationData} = await registerApi(userData);

          // Registration successful, now login
          const stringifiedUserData = JSON.stringify(registrationData);
          await AsyncStorage.setItem('userData', stringifiedUserData);
          dispatch(actions.setUserData(registrationData));
          navigation.reset({
            index: 0,
            routes: [{name: Routes.Home}],
          });
        } catch (registrationError) {
          // Handle registration error
          console.error('Registration Error:', registrationError);
          Alert.alert(
            'Registration Failed',
            registrationError.response?.data?.message ||
              'Unable to create account. Please try again.',
          );
        }
      }
    } catch (error) {
      // Handle Google Sign-In errors
      console.error('Google Auth Error:', JSON.stringify(error, null, 2));

      const errorHandlers = {
        [statusCodes.SIGN_IN_CANCELLED]: 'Login Cancelled',
        [statusCodes.IN_PROGRESS]: 'Sign in is already in progress',
        [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]:
          'Google Play services is not available',
      };

      const errorMessage =
        errorHandlers[error.code] || `Unexpected error: ${error.message}`;

      Alert.alert('Authentication Error', errorMessage);
    }
  };

  return (
    <View style={{marginTop: signup ? nh(60) : 0}}>
      <Text
        variant="medium12"
        color={COLORS.grey333333}
        style={{textAlign: 'center', marginVertical: nh(15)}}>
        {signup ? 'Connect to your social media handles' : 'Or continue with'}
      </Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Button
          variant="outline"
          text="Google"
          textStyle={{
            fontSize: nh(12),
            fontFamily: APP_FONTS.PoppinsMedium,
          }}
          width={DEVICE_WIDTH - nw(32)}
          leftimage={icons.google}
          onPress={handleGoogleAuth}
        />

        {/* <Button
          variant="outline"
          text="Apple"
          textStyle={{
            fontSize: 12,
            fontFamily: APP_FONTS.PoppinsMedium,
          }}
          width={DEVICE_WIDTH / 2 - nw(23)}
          leftimage={icons.apple}
          // Add Apple login logic here if needed
        /> */}
      </View>
    </View>
  );
};

export default SocialLogin;
