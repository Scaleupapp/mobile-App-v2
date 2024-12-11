import React, { useEffect } from 'react';
import { View, Alert } from 'react-native';
import Button from './Button';
import { APP_FONTS } from '../assets/fonts';
import { DEVICE_WIDTH, nh, nw } from '../helper/scales';
import { icons } from '../assets/icons';
import Text from './Text';
import { COLORS } from '../helper/colors';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useSelector } from 'react-redux';
import {jwtDecode} from 'jwt-decode';








const SocialLogin = ({ signup = false }) => {


  // const userData=useSelector((state) => state.auth.userData.token);
  // console.log('token',JSON.parse(userData));
  // Static token and secret for demonstration purposes
const staticToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU5NDg4MGVjNWI5MWIzY2Q4MDZhMzIiLCJpYXQiOjE3MzM5MDQ1NTQsImV4cCI6MTc1OTgyNDU1NH0.ECK2gJxt4a76lzxY0lHHPF_VDR-2ZH26dUHxPNkr2Fk";
// Replace with your actual secret

const API_URL = 'https://api.scaleupapp.club/api/auth/register';

const handleGoogleLogin = async () => {
 try {
   await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

   const userInfo = await GoogleSignin.signIn();
   const user = userInfo.data.user;

   const token =staticToken;
   const decodedToken = jwtDecode(token);
   
   const userData = {
     username: user.name || 'Unknown',
     email: user.email || `demo@anonymous.com`,
     profilePicture: user.photo || '',
     firstname: user.givenName || '',
     lastname: user.familyName || '',
     isbasicProfileComplete: true,
     password: decodedToken.userId,
   };

   console.log('Prepared user data for backend:', userData);

   const response = await fetch(API_URL, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Bearer ${token}`,
     },
     body: JSON.stringify(userData),
   });

   if (response.ok) {
     const responseData = await response.json();
     console.log('User data successfully saved:', responseData);
     Alert.alert('Success', 'Your account has been created successfully!');
   } else {
     const errorData = await response.json();
     console.error('Failed to save user data:', errorData);
     Alert.alert('Error', errorData.message || 'Failed to save user data. Please try again.');
   }
 } catch (error) {
   console.error('Error during Google login:', error);
   Alert.alert('Error', `An error occurred: ${error.message}`);
 }
};




  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '280212722139-rqi3g53qtp54othg98lrfqlp0gjk0h7v.apps.googleusercontent.com',
      offlineAccess: true, // Enables refresh token
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: true, // Obtain a refresh token
    });
  }, []);

  return (
    <View style={{ marginTop: signup ? nh(60) : 0 }}>
      <Text
        variant="medium12"
        color={COLORS.grey333333}
        style={{ textAlign: 'center', marginVertical: nh(15) }}
      >
        {signup ? 'Connect to your social media handles' : 'Or continue with'}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button
          variant="outline"
          text="Google"
          textStyle={{ fontSize: nh(12), fontFamily: APP_FONTS.PoppinsMedium }}
          width={DEVICE_WIDTH / 2 - nw(23)}
          leftIcon={icons.google}
          onPress={handleGoogleLogin} // Trigger Google login
        />

        <Button
          variant="outline"
          text="Apple"
          textStyle={{ fontSize: 12, fontFamily: APP_FONTS.PoppinsMedium }}
          width={DEVICE_WIDTH / 2 - nw(23)}
          leftIcon={icons.apple}
        />
      </View>
    </View>
  );
};

export default SocialLogin;
