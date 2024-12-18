import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import CustomTextInput from '../../components/TextInput';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {
  getNotificationAPI,
  markReadNotificationAPI,
} from '../../services/apiService';

const Notifications = ({navigation, route}) => {
  const [notification, setNotification] = useState([]);
  const [read, setRead] = useState([]);
  const [unread, setUnRead] = useState([]);
  const [tab, setTab] = useState(0);
  const onToggle = index => {
    setTab(index);
    if (tab == 2) {
      readNotification();
    }
  };
  useEffect(() => {
    getNotification();
  }, []);

  const getNotification = async () => {
    try {
      let res = await getNotificationAPI();
      setNotification(res?.data);
      const readNot = res?.data?.filter(item => item.isRead === true);
      const unreadNot = res?.data?.filter(item => item.isRead === false);
      setRead(readNot);
      setUnRead(unreadNot);
    } catch (error) {
      console.log('🚀 ~ getNotification ~ error:', error?.response.data);
    }
  };

  const readNotification = async () => {
    try {
      let paylaod = {
        notificationIds: unread,
      };

      // let res = await markReadNotificationAPI(paylaod);

      setRead([...read, ...unread]);
      setUnRead();
      // console.log('🚀 ~ readNotification ~ res:', res);
    } catch (error) {
      console.log('🚀 ~ readNotification ~ error:', error);
    }
  };

  // Function to group by date and format data
  const transformNotifications = data => {
    const groupedData = {};

    data?.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const notification = {
        image: '', // Placeholder for image
        text: item.content,
        time: time,
        read: item?.read,
        ...item,
      };

      if (!groupedData[date]) {
        groupedData[date] = [];
      }

      groupedData[date].push(notification);
    });

    return Object.keys(groupedData).map(date => ({
      date,
      notifications: groupedData[date],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={images.ellipse}
        style={styles.semicirlce}
        resizeMode="stretch">
        <Header
          title="Notifications"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View style={{position: 'absolute', left: nw(16), right: 0, top: 80}}>
        <CustomTextInput width={DEVICE_WIDTH - 32} height={nh(50)} />
      </View>
      {notification.length > 0 ? (
        <View>
          <View style={{marginHorizontal: nw(16)}}>
            <ToggleWithUnderline
              options={['ALL', 'READ', 'UNREAD']}
              onToggle={onToggle}
            />
          </View>

          <FlatList
            data={transformNotifications(
              tab == 0 ? notification : tab == 1 ? read : unread,
            )}
            ListEmptyComponent={() => {
              return (
                <Text style={{textAlign: 'center', marginTop: nh(100)}}>
                  {tab == 1 && 'You have not reaaded Notifications'}
                  {tab == 2 && 'You have read All Notifications'}
                </Text>
              );
            }}
            renderItem={({item}) => {
              return (
                <View
                  style={{
                    marginHorizontal: nw(16),
                    marginTop: nh(15),
                    marginBottom: 5,
                  }}>
                  <Text variant="medium12" color={COLORS.greyBBBBBB}>
                    {item?.date}
                  </Text>
                  {item?.notifications?.map(u => (
                    <View style={styles.card}>
                      <Image
                        style={styles.image}
                        source={images.ciclelogo}
                        resizeMode="contain"
                      />
                      <Text
                        variant="medium12"
                        color={COLORS.blue043142}
                        style={{width: '70%'}}>
                        {u.text}
                      </Text>
                      <Text variant="medium12" color={COLORS.grey999999}>
                        {`\n${u.time}`}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }}
          />
        </View>
      ) : (
        <View>
          <Image
            source={images.notification}
            resizeMode="contain"
            style={styles.notimage}
          />

          <Text
            variant="semibold20"
            color={COLORS.blue043142}
            style={{textAlign: 'center', marginTop: nh(30)}}>
            You’re All Caught Up{' '}
          </Text>
          <Text
            variant="medium14"
            color={COLORS.grey999999}
            style={{
              textAlign: 'center',
              marginTop: nh(5),
              marginBottom: nh(20),
            }}>
            No new notifications right now. Check back later or explore more
            content in the meantime.
          </Text>
          <Button text="Explore Content" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Notifications;

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
    height: nh(40),
    width: nw(40),
    borderRadius: nh(20),
    marginRight: 10,
  },
  card: {
    flexDirection: 'row',
    boxShadow: '0 4 4 0 #0000001A',
    height: nh(60),
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.25)',
    borderRadius: nh(10),
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
});
