import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {icons} from '../assets/icons';

import Entypo from 'react-native-vector-icons/Entypo';
import Text from './Text';
import {nh, nw} from '../helper/scales';
import {navigationRef} from '../../App';

const Header = ({
  title = 'Header Title', // Default title
  onBackPress = () => {
    navigationRef.goBack();
  }, // Callback for back arrow press
  onRightIconPress = () => {}, // Callback for right icon press
  backIcon = icons.backarrow, // Back arrow icon source
  rightIcon = true, // Right icon source
}) => {
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <View style={styles.subcontainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.iconContainer}>
          {backIcon && <Image source={backIcon} style={styles.icon} />}
        </TouchableOpacity>
        {/* Title */}
        <Text
          variant="semibold18"
          style={styles.title}
          color={COLORS.whiteFFFFFF}>
          {title}
        </Text>
      </View>

      {/* Right Icon */}
      <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
        {rightIcon && (
          <Entypo
            name="dots-three-vertical"
            size={nh(20)}
            color={COLORS.whiteFFFFFF}
            style={styles.icon}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60, // Adjust header height as needed
    paddingHorizontal: 16, // Add horizontal padding
    backgroundColor: COLORS.yellowF5BE00, // Set background color

    // Optional border for the header
  },
  subcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40, // Fixed width for icon touchable area
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: nw(30),
    height: nh(30),
    resizeMode: 'contain',
  },
  title: {
    marginLeft: 7,
  },
});

export default Header;
