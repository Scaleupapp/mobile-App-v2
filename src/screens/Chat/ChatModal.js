import React, {forwardRef, useEffect, useMemo, useRef, useState} from 'react';
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
import {useDispatch} from 'react-redux';
import {actions} from '../../redux/reducers';

const ChatModal = forwardRef(
  ({group, edit = false, grpMembers = [], setGrpMembers}, ref) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [myInnerCircle, setMyInnerCircle] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const page = useRef(1);
    const [allFetched, setAllFetched] = useState(false); // Indicates if all messages are loaded

    useEffect(() => {
      if (edit) setMyInnerCircle(grpMembers);
    }, [grpMembers]);

    useEffect(() => {
      if (!edit) getMyInnerCircleList();
    }, []);

    const getMyInnerCircleList = async () => {
      try {
        if (loading || allFetched) return;
        setLoading(true);
        let resp = await myInnerCircleAPI(page?.current);
        const myArray = [...myInnerCircle, ...resp?.data?.users];
        dispatch(actions.setInnerCircle(myArray));
        setMyInnerCircle(myArray);
        if (page?.current == resp?.data?.totalPages) {
          setAllFetched(true);
        }
        page.current += 1;
      } catch (error) {
        console.log(error, 'error fetching inner circle');
      } finally {
        setLoading(false);
      }
    };

    const toggleSelection = id => {
      setSelectedMembers(prev =>
        prev.includes(id)
          ? prev.filter(member => member !== id)
          : [...prev, id],
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
        onDismiss={() => setSelectedMembers([])}
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
                renderItem={({item, index}) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      if (group) toggleSelection(item.userId);
                      else createConvo(item.userId, item);
                    }}
                    style={styles.card}>
                    {item?.profilePicture ? (
                      <Image
                        source={{uri: item?.profilePicture}}
                        style={styles.image}
                      />
                    ) : (
                      <View
                        style={{
                          ...styles.image,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: COLORS.greyD6D6D6,
                        }}>
                        <Text variant="semibold16" color={COLORS.black333333}>
                          {`${item?.firstname
                            ?.charAt(0)
                            .toUpperCase()}${item?.lastname
                            ?.charAt(0)
                            .toUpperCase()}`}
                        </Text>
                      </View>
                    )}
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
                      if (edit) {
                        setGrpMembers(members);
                      } else {
                        navigationRef.navigate(Routes.EditGroupProfile, {
                          groupMembers: selectedMembers,
                          groupMembersDetails: members,
                        });
                        setSelectedMembers([]);
                      }
                      ref?.current?.close();
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
  },
);

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
