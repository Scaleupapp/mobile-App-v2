import React, {useState} from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {nh, nw} from '../helper/scales';
import {COLORS} from '../helper/colors';
import {APP_FONTS} from '../assets/fonts';

const CustomTextInput = ({
  placeholder = 'Enter text', // Placeholder text
  errorMessage = '', // Error message (icon + text)
  successMessage = '', // Success message (icon + text)
  rightIcon, // Component for the right-side icon
  onRightIconPress = () => {}, // Callback for right icon press
  marginBottom = 15,
  dropDown = false,
  label = '',
  textinputType = '',
  width = '',
  height = 40,
  ...props
}) => {
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'India',
    flag: '🇮🇳',
    code: '+91',
  });
  return (
    <View>
      {/* Input field */}
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: APP_FONTS.PoppinsMedium,
            color: COLORS.greyBBBBBB,
            marginBottom: 5,
          }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            marginBottom: marginBottom,
            height: textinputType == 'L' ? nh(150) : nh(height),
            borderColor: errorMessage
              ? COLORS.redEA4335
              : 'rgba(214, 214, 214, 0.2)',
          },
          width && {
            width: width,
          },
        ]}>
        {/* Country Dropdown */}
        {dropDown && (
          <TouchableOpacity
            style={styles.countryDropdown}
            // onPress={() => setModalVisible(true)}
          >
            <Text style={styles.flagIcon}>{selectedCountry.flag}</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={[
            styles.input,
            {
              height: textinputType == 'L' ? nh(150) : nh(40),
              textAlignVertical: textinputType === 'L' ? 'top' : 'center',
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.grey999999}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Image source={rightIcon} style={styles.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error or Success Message */}
      {(errorMessage || successMessage) &&
        (errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: nw(20),
    paddingRight: nw(10),
    paddingTop: 5,

    borderWidth: 1,
    borderRadius: nh(10),
    height: nh(40),
    backgroundColor: COLORS.whiteFFFFFF,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    alignItems: 'center',

    height: nh(40),
    fontSize: nh(12),
    color: '#000',
    fontFamily: APP_FONTS.PoppinsMedium,
  },

  errorMessage: {
    marginTop: -10,
    color: COLORS.redEA4335,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
    textAlign: 'right',
    marginBottom: nh(10),
  },

  successMessage: {
    marginTop: -10,
    color: COLORS.green34A853,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsSemiBold,
    textAlign: 'right',
    marginBottom: nh(10),
  },
  icon: {
    height: nh(20),
    width: nw(20),
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(10),
    marginLeft: nw(-13),
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  flagIcon: {
    fontSize: 25,
    marginRight: nw(15),
    marginTop: -5,
  },
});

export default CustomTextInput;
