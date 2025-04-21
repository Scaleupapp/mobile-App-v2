import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View, Image} from 'react-native';
import {COLORS} from '../helper/colors';
import {APP_FONTS} from '../assets/fonts';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import Icon from '../helper/icon';
// import { Ionicons } from '@expo/vector-icons'; // Replace with your icon library if needed.

const Button = ({
  text = '',
  leftIcon = null,
  leftimage = null,
  rightIcon = null,
  justIcon = null,
  icontype = 'ionicon',
  onPress = () => {},
  variant = 'solid', // 'solid' or 'outline'
  backgroundColor = COLORS.blue043142, // Default color for solid button
  outlineColor = COLORS.blue043142, // Default outline color for outline button
  textColor = COLORS.whiteFFFFFF, // Default text color
  height = 50, // Default height
  width = DEVICE_WIDTH - 32, // Default width
  textStyle = {},
  buttonStyle = {},
  disabled = false,
}) => {
  const isSolid = variant === 'solid';

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.button,
        {
          height,
          width,
        },
        isSolid
          ? {backgroundColor, ...styles.shadow}
          : {
              backgroundColor: 'transparent',
              borderColor: outlineColor,
              borderWidth: 1,
            },
        {...buttonStyle},
      ]}
      onPress={onPress}>
      <View style={styles.content}>
        {justIcon && (
          <Icon
            name={justIcon}
            size={26}
            color={isSolid ? textColor : outlineColor}
            type={icontype}
          />
        )}
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isSolid ? textColor : outlineColor}
            type="feather"
            style={{marginRight: 5}}
          />
        )}
        {leftimage && (
          <Image
            source={leftimage}
            style={{height: 20, width: 20, marginRight: 10}}
          />
        )}
        {text ? (
          <Text
            style={[
              styles.text,
              {color: isSolid ? textColor : outlineColor, ...textStyle},
            ]}>
            {text}
          </Text>
        ) : null}
        {/* {rightIcon && <Ionicons name={rightIcon} size={20} color={isSolid ? textColor : outlineColor} style={styles.icon} />} */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: nh(10),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  shadow: {
    boxShadow: '0 4 4 0  rgba(0,0,0,0.25)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,

    fontFamily: APP_FONTS.PoppinsSemiBold,
    // fontWeight: '600'
  },
  icon: {
    marginHorizontal: 5,
  },
  leftIcon: {height: nh(25), width: nw(25), marginRight: nw(5)},
});

export default Button;
//
