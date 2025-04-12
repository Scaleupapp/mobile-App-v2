import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {icons} from '../assets/icons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Entypo from 'react-native-vector-icons/Entypo';
import Text from './Text';
import {nh, nw} from '../helper/scales';
import Icon from '../helper/icon';
import {useNavigation} from '@react-navigation/native';
import Routes from '../helper/routes';
import {logoutUser} from '../helper/commonFunctions';
import {io} from 'socket.io-client';
import {useSelector} from 'react-redux';
import {APP_FONTS} from '../assets/fonts';

const MainHeader = () => {
  const navigation = useNavigation();
  const userdata = useSelector(state => state?.userData);
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Connect to the Socket.IO server when the component mounts
    const socketInstance = io('http://192.168.68.240:3000', {
      // Your server URL
      auth: {
        token: userdata?.token, // If you have authentication
      },
    });
    socketInstance.on('totalUnreadUpdate', data => {
      console.log(data, 'data.....');
      setCount(data?.allUnreadCount);
    });
  }, []);
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
          onPress={() => navigation.navigate(Routes.MenuScreen)}
          type="material-community"
          name="dots-horizontal-circle"
          color={COLORS.whiteFFFFFF}
          size={nh(24)}
        />

        {/* Title */}
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View>
            {count > 0 && (
              <View
                style={{
                  height: nh(18),
                  width: nh(18),
                  borderRadius: nh(9),
                  backgroundColor: COLORS.black333333,
                  position: 'absolute',
                  zIndex: 1,
                  right: 4,
                  top: -2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: nh(8),
                    fontFamily: APP_FONTS.PoppinsBold,
                    fontWeight: '900',
                  }}
                  color={COLORS.whiteFFFFFF}>
                  {count}
                </Text>
              </View>
            )}
            <Icon
              // onPress={logoutUser}
              onPress={() => navigation.navigate(Routes.Conversation)}
              type="material-community"
              name="android-messages"
              color={COLORS.whiteFFFFFF}
              size={nh(24)}
              style={{marginRight: nw(10)}}
            />
          </View>
          <Ionicons
            name="list"
            color={COLORS.whiteFFFFFF}
            size={nh(24)}
            style={{marginRight: -nh(8)}}
            onPress={() => navigation.navigate(Routes.MyPlaylist)}
          />
          <Ionicons
            name="musical-note-outline"
            color={COLORS.whiteFFFFFF}
            size={nh(26)}
            onPress={() => navigation.navigate(Routes.MyPlaylist)}
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
