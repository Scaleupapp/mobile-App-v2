import React, {forwardRef, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Image, StyleSheet} from 'react-native';
import {COLORS} from '../../helper/colors';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import Icon from '../../helper/icon';
import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  isAndroid,
  nh,
  nw,
} from '../../helper/scales';

import {View} from 'react-native';
import {FlatList} from 'react-native';
import {createConversation, myInnerCircleAPI} from '../../services/apiService';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';

const ChatModal = forwardRef(({type, URL}, ref) => {
  const snapPoints = useMemo(() => ['60%'], []);

  const [loading, setLoading] = useState(false);

  const [myinnerCircle, setMyInnerCircle] = useState([]);

  useEffect(() => {
    getmyInnerCircleList();
  }, []);

  let getmyInnerCircleList = async () => {
    try {
      let resp = await myInnerCircleAPI();
      setMyInnerCircle(resp?.data);
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
      setLoading(false);
    }
  };
  let createConvo = async (id, item) => {
    try {
      let paylaod = {
        recipientId: id,
      };

      let resp = await createConversation(paylaod);
      ref?.current?.close();

      navigationRef.navigate(Routes.Chat, {
        chatId: resp?.data?._id,
        data: item?.firstname + ' ' + item?.lastname,
      });
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
    }
  };
  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      handleComponent={null}
      animateOnMount={false}
      containerStyle={{borderTopLeftRadius: 24}}
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        borderColor: COLORS.grey999999 + 80,
        borderWidth: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: COLORS.whiteFFFFFF,
          alignItems: 'center',
          justifyContent: 'center',
          height: DEVICE_HEIGHT,
          width: DEVICE_WIDTH,
        }}>
        <Icon
          type={'antdesign'}
          color={COLORS.black333333}
          name="close"
          size={nh(20)}
          style={{
            position: 'absolute',
            top: nh(isAndroid ? 10 : 10),
            right: nw(10),
            zIndex: 3,
          }}
          onPress={() => ref?.current?.close()}
        />
        {loading ? (
          <View
            style={{
              position: 'absolute',
              zIndex: 2,
              height: DEVICE_HEIGHT,
              width: DEVICE_WIDTH,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ActivityIndicator size="large" color={COLORS.black333333} />
          </View>
        ) : (
          <FlatList
            data={myinnerCircle}
            contentContainerStyle={{marginTop: 50}}
            renderItem={({item}) => {
              return (
                <View>
                  <View style={styles.card}>
                    <Image
                      source={{uri: item?.profilePicture}}
                      style={styles.image}
                    />

                    <View style={{width: nw(195)}}>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {item?.username}
                      </Text>

                      {/* <Text
                  variant="medium12"
                  color={COLORS.grey999999}
                  style={{width: nw(208)}}>
                  Designation
                </Text> */}
                    </View>

                    <Button
                      onPress={() => createConvo(item.userId, item)}
                      text="Message"
                      variant="outline"
                      width={nw(90)}
                      height={nh(35)}
                      textStyle={{fontSize: 14}}
                    />
                  </View>
                </View>
              );
            }}
          />
        )}
        <></>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
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
    // boxShadow: '0 2 5 0 #00000026',

    alignItems: 'center',
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    // borderRadius: nh(10),
    paddingBottom: 15,
    // marginBottom: nh(22),
    paddingTop: nh(22),
  },
});

export default ChatModal;
