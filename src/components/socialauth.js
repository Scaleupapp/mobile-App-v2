import React from 'react';
import {View} from 'react-native';
import Button from './Button';
import {APP_FONTS} from '../assets/fonts';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {icons} from '../assets/icons';
import Text from './Text';
import {COLORS} from '../helper/colors';

const SocialLogin = ({signup = false}) => {
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
          textStyle={{fontSize: nh(12), fontFamily: APP_FONTS.PoppinsMedium}}
          width={DEVICE_WIDTH / 2 - nw(23)}
          leftIcon={icons.google}
        />
        <Button
          variant="outline"
          text="Apple"
          textStyle={{fontSize: 12, fontFamily: APP_FONTS.PoppinsMedium}}
          width={DEVICE_WIDTH / 2 - nw(23)}
          leftIcon={icons.apple}
        />
      </View>
    </View>
  );
};

export default SocialLogin;
