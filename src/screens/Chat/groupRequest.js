import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {Image} from 'react-native';
import Text from '../../components/Text';
import Routes from '../../helper/routes';

import {images} from '../../assets/images';
import ChatModal from './ChatModal';
import {formatDateforchat} from '../../helper/commonFunctions';
import {useFocusEffect} from '@react-navigation/native';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Icon from '../../helper/icon';
import {io} from 'socket.io-client';
import {acceptgroupRequest} from '../../services/apiService';

const GroupRequest = ({navigation, route}) => {
  const [request, setRequest] = useState(route?.params?.data);
  console.log('🚀 ~ groupRequest ~ request:', request);

  let acceptRequest = async (_id, type) => {
    try {
      let payload = {
        requestId: _id,
        action: type,
      };
      let resp = await acceptgroupRequest(payload);
      console.log('🚀 ~ acceptRequest ~ resp:', resp?.data);
      let data = request.filter(user => user._id !== _id);
      setRequest(data);
    } catch (error) {}
  };

  const GroupCard = ({item, index}) => {
    console.log('item?.unreadMessageCount ', item);

    // console.log('🚀 ~ GroupCard ~ item:', JSON.stringify(item));
    return (
      <Pressable
        key={index}
        style={styles.card}
        // onPress={() =>
        //   navigation.navigate(Routes.GroupChat, {
        //     groupId: item?._id,
        //     data: item,
        //   })
        // }
      >
        {item?.profilePicture ? (
          <Image
            source={{
              uri: `${item?.profilePicture}?timestamp=${new Date().getTime()}`,
            }}
            // source={{uri: item?.profilePicture}}
            style={styles.image}
          />
        ) : (
          <View
            style={[
              styles.image,
              {
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.greyD6D6D6,
              },
            ]}>
            <Icon
              type="material-community"
              name="account-group"
              style={{marginLeft: 0.5}}
              size={nh(30)}
            />
          </View>
        )}
        <View style={{flex: 9}}>
          <Text variant="medium12" color={COLORS.grey333333}>
            {item?.senderId?.firstname + ' ' + item?.senderId?.lastname} has
            been invited you to join group
            <Text variant="bold12" color={COLORS.blue043142}>
              {' '}
              {item?.studyGroupId?.name}
            </Text>
            as a {item?.role} on {formatDateforchat(item?.receivedAt)}
          </Text>
        </View>
        <View style={{flex: 4, alignItems: 'center', flexDirection: 'row'}}>
          <Icon
            type="antdesign"
            name="closecircle"
            color={COLORS.redEA4335}
            size={25}
            style={{marginLeft: 16}}
            onPress={() => acceptRequest(item?._id, 'reject')}
          />
          <Icon
            type="antdesign"
            name="checkcircle"
            color={COLORS.green34A853}
            size={25}
            style={{marginLeft: 16}}
            onPress={() => acceptRequest(item?._id, 'accept')}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="Group Request"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            data={request}
            renderItem={({item, index}) => (
              <GroupCard item={item} index={index} />
            )}
            ListEmptyComponent={() => {
              return (
                <View
                  style={{
                    marginTop: nh(250),
                    alignItems: 'center',
                  }}>
                  <Text variant="bold20" color={COLORS.grey333333}>
                    No pending requests
                  </Text>
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GroupRequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
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
  image: {
    height: nh(50),
    width: nh(50),
    borderRadius: nh(25),
    marginRight: 10,
    borderColor: COLORS.grey777777,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    marginBottom: nh(15),
    alignItems: 'center',
    flex: 1,
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
