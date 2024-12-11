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
import Icon from '../helper/icon';
import {useNavigation} from '@react-navigation/native';
import Routes from '../helper/routes';
import {logoutUser} from '../helper/commonFunctions';

const MainHeader = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <View style={styles.subcontainer}>
        <Icon
          // onPress={logoutUser}
          onPress={() => navigation.navigate(Routes.EditProfile)}
          type="material-community"
          name="dots-horizontal-circle"
          color={COLORS.whiteFFFFFF}
          size={nh(24)}
        />

        {/* Title */}
        <View style={{flexDirection: 'row'}}>
          <Icon
            type="material-community"
            name="bell-badge"
            color={COLORS.whiteFFFFFF}
            size={nh(24)}
            style={{marginRight: nw(14)}}
            // onPress={() => navigation.navigate(Routes.Notifications)}
          />
          <Icon
            type="material-community"
            name="message-reply-text"
            color={COLORS.whiteFFFFFF}
            size={nh(24)}
            style={{marginRight: nw(14)}}
            onPress={() => navigation.navigate(Routes.EditProfile)}
          />
          <Icon
            type="font-awesome"
            name="bookmark"
            color={COLORS.whiteFFFFFF}
            size={nh(24)}
            onPress={() => navigation.navigate(Routes.CreatePost)}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: nh(6),
    paddingHorizontal: nh(16), // Add horizontal padding
    backgroundColor: COLORS.yellowF5BE00, // Set background color
    // Optional border for the header
  },
  subcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

export default MainHeader;
