import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  Text as RNText,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import Button from '../../components/Button';
import {APP_FONTS} from '../../assets/fonts';
import {images} from '../../assets/images';
import Routes from '../../helper/routes';

const Verification = ({navigation, route}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Image source={images.verify} style={styles.logo} />
          <Text variant="semibold18" color={COLORS.blue043142}>
            Enter Verification Code
          </Text>
          <Text
            variant="medium14"
            color={COLORS.grey999999}
            style={{marginBottom: 30}}>
            We’ve sent code to your email
          </Text>

          <CustomTextInput placeholder="Email" errorMessage="" />

          <CustomTextInput placeholder="Code" />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end', // Centers content horizontally
              alignItems: 'center', // Aligns items vertically
              marginBottom: nh(50),
            }}>
            <Text
              style={{
                color: COLORS.grey999999,
                fontSize: nh(12),
                fontFamily: APP_FONTS.PoppinsMedium,
              }}>
              Didn’t receive the email?{' '}
            </Text>
            <Text
              style={{
                color: COLORS.yellowF5BE00,
                fontSize: nh(12),
                fontFamily: APP_FONTS.PoppinsMedium,
                textDecorationLine: 'underline',
              }}>
              Click to resend
            </Text>
          </View>

          <Button
            text={'Reset password'}
            onPress={() => navigation.navigate('SetNewPassword')}
          />

          <View
            style={{
              position: 'absolute',
              bottom: 10, // Distance from the bottom
              left: 0, // Full-width alignment
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center', // Centers content horizontally
              alignItems: 'center', // Aligns items vertically
            }}>
            <Text
              style={{
                color: COLORS.grey999999,
                fontSize: nh(12),
                fontFamily: APP_FONTS.PoppinsMedium,
              }}>
              Back to{' '}
            </Text>
            <RNText
              onPress={() => navigation.navigate(Routes.Login)}
              style={{
                color: COLORS.yellowF5BE00,
                fontSize: nh(12),
                fontFamily: APP_FONTS.PoppinsMedium,
              }}>
              Login
            </RNText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(30),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },

  logo: {
    height: nh(150),
    width: nh(167),
    alignSelf: 'center',
    marginBottom: nh(30),
  },
});
