import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
  ScrollView,
  Pressable,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import Text from '../../components/Text';
import Routes from '../../helper/routes';
import {icons} from '../../assets/icons';
import ConfirmDelete from './ConfirmDelete';
import {useFocusEffect} from '@react-navigation/native';
import {getReferralDetailsApi} from '../../services/apiService';

const menuItems = [
  {
    heading: 'Account',
    data: [
      {
        title: 'Change Password',
        icon: icons.changePass,
        navKey: Routes.ChangePassword,
      },
      {title: 'Block List', icon: icons.block, navKey: Routes.BlockUsers},
      {
        title: 'Delete Account',
        icon: icons.delete,
        navKey: 'delete',
      },
    ],
  },
  {
    heading: 'Help & Support',
    data: [
      {
        title: 'Raise a Query',
        icon: icons.questionsolid,
        navKey: Routes.SupportQueryScreen,
      },
    ],
  },
  {
    heading: 'Posts',
    data: [{title: 'Saved', icon: icons.saved, navKey: Routes.MyPlaylist}],
  },
];
// SupportQueryScreen
const Settings = ({navigation, route}) => {
  const [open, setOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchReferralCode = async () => {
        try {
          const response = await getReferralDetailsApi();
          setReferralCode(response.data.referralCode);
          setError('');
        } catch (err) {
          setError('Failed to load referral code');
          console.error('Error fetching referral code:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchReferralCode();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={images.ellipse}
        style={styles.semicirlce}
        resizeMode="stretch">
        <Header title="Settings" rightIcon={false} />
      </ImageBackground>

      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {menuItems.map((item, index) => (
          <View key={index}>
            <Text
              variant="medium12"
              color={COLORS.greyBBBBBB}
              style={{marginLeft: nw(16), marginBottom: nh(15)}}>
              {item?.heading}
            </Text>
            <View>
              <FlatList
                scrollEnabled={false}
                data={item?.data}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{marginBottom: nh(15)}}
                renderItem={({item, index}) => (
                  <Pressable
                    style={styles.card}
                    onPress={() => {
                      if (item?.navKey === 'delete') {
                        setOpen(true);
                      } else {
                        navigation.navigate(item?.navKey);
                      }
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={styles.image}>
                        <Image
                          source={item.icon}
                          style={{width: nw(21), height: nh(21)}}
                        />
                      </View>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {item.title}
                      </Text>
                    </View>
                    <Image
                      source={icons.arrowRight}
                      style={{width: nw(24), height: nh(24)}}
                    />
                  </Pressable>
                )}
              />
            </View>
          </View>
        ))}

        {/* Simple Referral Section */}
        <View style={styles.referralSection}>
          <Text
            variant="medium12"
            color={COLORS.greyBBBBBB}
            style={styles.sectionHeader}>
            Referral Code
          </Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading referral code...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.referralCodeContainer}>
              <Text variant="bold18" color={COLORS.yellowF5BE00}>
                {referralCode}
              </Text>
            </View>
          )}

          <Text
            variant="regular12"
            color={COLORS.grey999999}
            style={styles.referralMessage}>
            Share this code with your network
          </Text>
        </View>
      </ScrollView>

      <ConfirmDelete isVisible={open} setvisibleModal={setOpen} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  semicirlce: {
    width: DEVICE_WIDTH,
    height: nh(120),
    marginBottom: nh(20),
  },
  image: {
    height: nh(30),
    width: nw(30),
    borderRadius: nh(5),
    marginRight: nw(10),
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    marginBottom: nh(15),
  },
  referralSection: {
    marginTop: nh(20),
    paddingHorizontal: nw(16),
    marginBottom: nh(40),
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: nh(15),
  },
  referralCodeContainer: {
    padding: nh(15),
    marginBottom: nh(10),
  },
  referralMessage: {
    textAlign: 'center',
    marginHorizontal: nw(20),
  },
  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    marginVertical: nh(10),
  },
  loadingText: {
    color: COLORS.greyBBBBBB,
    textAlign: 'center',
    marginVertical: nh(10),
  },
});

export default Settings;
