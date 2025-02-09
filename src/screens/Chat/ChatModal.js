import React, {forwardRef, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  FlatList,
  Pressable,
} from 'react-native';
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
import {createConversation, myInnerCircleAPI} from '../../services/apiService';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {CheckBox} from 'react-native-elements';

const ChatModal = forwardRef(({group}, ref) => {
  const [loading, setLoading] = useState(false);
  const [myInnerCircle, setMyInnerCircle] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    getMyInnerCircleList();
  }, []);

  const getMyInnerCircleList = async () => {
    try {
      setLoading(true);
      let resp = await myInnerCircleAPI();
      setMyInnerCircle(resp?.data || []);
    } catch (error) {
      console.log(error, 'error fetching inner circle');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = id => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(member => member !== id) : [...prev, id],
    );
  };

  const createConvo = async (id, item) => {
    try {
      let payload = {recipientId: id};
      let resp = await createConversation(payload);
      ref?.current?.close();

      navigationRef.navigate(Routes.Chat, {
        chatId: resp?.data?._id,
        data: `${item?.firstname} ${item?.lastname}`,
      });
    } catch (error) {
      console.log(error, 'error creating conversation');
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      maxDynamicContentSize={nh(600)}
      handleComponent={null}
      animateOnMount={false}
      containerStyle={{borderTopLeftRadius: 24}}
      style={styles.modalContainer}>
      <BottomSheetView style={styles.bottomSheetView}>
        <Icon
          type={'antdesign'}
          color={COLORS.black333333}
          name="close"
          size={nh(20)}
          style={styles.closeIcon}
          onPress={() => ref?.current?.close()}
        />
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.black333333} />
          </View>
        ) : (
          <BottomSheetView>
            <FlatList
              scrollEnabled
              data={myInnerCircle}
              contentContainerStyle={{marginTop: nh(30)}}
              ListHeaderComponent={() => (
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={{textAlign: 'center'}}>
                  {group ? 'Selelct group members' : 'Start conversation'}
                </Text>
              )}
              ListFooterComponent={() => <View style={{height: nh(80)}} />}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => {
                    if (group) toggleSelection(item.userId);
                    else createConvo(item.userId, item);
                  }}
                  style={styles.card}>
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image}
                  />
                  <View style={{width: nw(195)}}>
                    <Text variant="medium14" color={COLORS.blue043142}>
                      {item?.username}
                    </Text>
                  </View>
                  {group ? (
                    <CheckBox
                      checkedIcon="check-box"
                      uncheckedIcon="check-box-outline-blank"
                      iconType="material"
                      checked={selectedMembers.includes(item.userId)}
                      onPress={() => toggleSelection(item.userId)}
                      checkedColor={COLORS.grey999999}
                      uncheckedColor={COLORS.grey999999}
                    />
                  ) : (
                    <Button
                      onPress={() => createConvo(item.userId, item)}
                      text="Message"
                      variant="outline"
                      width={nw(90)}
                      height={nh(35)}
                      textStyle={{fontSize: 14}}
                    />
                  )}
                </Pressable>
              )}
            />
            {group && selectedMembers?.length > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  height: nh(70),
                  bottom: 0,
                  right: 0,
                  backgroundColor: COLORS.whiteFFFFFF,
                }}>
                <Button
                  text="Next"
                  onPress={() => {
                    let members = [];
                    selectedMembers.map(u => {
                      const member = myInnerCircle.filter(f => f.userId == u);
                      if (member?.length > 0) members.push(member[0]);
                    });
                    navigationRef.navigate(Routes.EditGroupProfile, {
                      groupMembers: selectedMembers,
                      groupMembersDetails: members,
                    });
                    ref?.current?.close();
                    setSelectedMembers([]);
                  }}
                  // width={DEVICE_WIDTH - 32}
                  width={nw(80)}
                  textStyle={{fontSize: 20}}
                />
              </View>
            ) : null}
          </BottomSheetView>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: COLORS.grey999999 + '80',
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetView: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    alignItems: 'center',
    justifyContent: 'center',
    height: DEVICE_HEIGHT,
    width: DEVICE_WIDTH,
  },
  closeIcon: {
    position: 'absolute',
    top: nh(isAndroid ? 10 : 10),
    right: nw(10),
    zIndex: 3,
  },
  loadingContainer: {
    position: 'absolute',
    zIndex: 2,
    height: DEVICE_HEIGHT,
    width: DEVICE_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    paddingBottom: 15,
    paddingTop: nh(22),
  },
});

export default ChatModal;
