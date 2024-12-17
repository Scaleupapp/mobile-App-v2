import {
  View,
  StyleSheet,
  Text,
  Image,
  FlatList,
  Keyboard,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React, {forwardRef, useEffect, useMemo, useState} from 'react';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {COLORS} from '../../helper/colors';
import {APP_FONTS} from '../../assets/fonts';
import {nh, nw} from '../../helper/scales';
import CustomTextInput from '../../components/TextInput';
import Button from '../../components/Button';
import icon from '../../helper/icon';
import {icons} from '../../assets/icons';
import {addComment} from '../../services/apiService';

const CustomBottomSheetModal = forwardRef(({data = [], commentHandle}, ref) => {
  // console.log('🚀 ~ CustomBottomSheetModal ~ ref:', ref);
  // console.log({data, commentHandle});
  const snapPoints = useMemo(() => ['50%'], []);
  const [comments, setComments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [text, setText] = useState();
  const [isKeyboardVisible, setKeyboardVisible] = useState({
    height: 16,
    visible: false,
  });
  const sendComment = async () => {
    try {
      let paylaod = {
        contentId: '65095bcfa7de693f881c94e2',
        commentText: 'first coment',
      };
      let resp = await addComment(paylaod);
      console.log('🚀 ~ sendComment ~ resp:', resp);
    } catch (error) {}
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        // Get the keyboard height from the event
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardVisible({height: keyboardHeight, visible: true});
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible({height: 16, visible: false});
      },
    );

    // Clean up listeners when component unmounts
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const getData = async post_id => {
    // try {
    //     const { data } = await getCommentsApi(post_id)
    //     // console.log(data);
    //     setComments(data?.comments)
    // } catch (err) {
    //     console.log(err, 'eeee');
    // }
  };
  // console.log({comments});r
  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      containerStyle={{
        borderTopLeftRadius: 24,
      }}
      style={{
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.blue043142,
        overflow: 'hidden',
      }}>
      <BottomSheetView style={styles.contentContainer}>
        <Text style={styles.containerHeadline}>Comments</Text>

        {comments.length == 0 ? (
          <Text style={styles.emptyContainer}>
            {' No Comments on this Vibe yet..\nBe the first one to comment..'}
          </Text>
        ) : (
          <FlatList
            data={comments}
            renderItem={({item}) => {
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    marginHorizontal: nw(24),
                    marginBottom: nh(16),
                    flex: 1,
                  }}>
                  {/* <Image source={{ uri: appendExtenstion(item?.creator?.profile_picture) }} style={{ height: normalize(30), width: normalize(30), borderRadius: normalize(15), marginRight: normalize(11) }} /> */}
                  {/* <View style={{ flex: 1 }}>
                                            <Text style={{
                                                color: COLORS.black000000,
                                                fontSize: normalize(16),
                                                fontFamily: FONTS.CircularstdBold,
                                                fontWeight: '700',
                                                marginBottom: normalize(5)
                                            }}>{item?.creator?.user_name}</Text>
                                            <Text style={{
                                                color: COLORS.black000000,
                                                fontSize: normalize(14),
                                                fontFamily: FONTS.CircularstdMedium,
                                                fontWeight: '400'
                                            }}>{item?.content}</Text>

                                            <View style={{ flexDirection: 'row', marginTop: normalize(11), justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text style={{
                                                        color: '#828282',
                                                        fontSize: normalize(12),
                                                        fontFamily: FONTS.CircularstdMedium,
                                                        fontWeight: '400',

                                                    }}> {time(item?.createdAt) + ' ago'}</Text>
                                                    <Text style={{
                                                        color: COLORS.grey646464,
                                                        fontSize: normalize(12),
                                                        fontFamily: FONTS.CircularstdMedium,
                                                        fontWeight: '400',
                                                        marginLeft: normalize(20)
                                                    }}>{'Reply'}</Text>
                                                </View>

                                                <Icon

                                                    type={ICON_TYPE.Antdesign}

                                                    color={COLORS.greyA7A7A7}
                                                    name={"hearto"}
                                                    size={normalize(14)}


                                                />

                                            </View>

                                        </View> */}
                  <Text>{item}</Text>
                </View>
              );
            }}
          />
        )}
        <View style={{marginHorizontal: nw(16)}}>
          <CustomTextInput
            value={text}
            placeholder={'Write here'}
            placeholderTextColor={COLORS.grey646464}
            rightIcon={icons.send}
            onRightIconPress={() => sendComment()}
            // multiline={true}
          />
        </View>
      </BottomSheetView>
      {/* <ChatInput camera={false} gallery={false} mice={false} value={prompt} onChangeText={(e) => setPrompt(e)} btnStyle={{ marginBottom: isKeyboardVisible?.height + 10, paddingRight: normalize(95) }} handleComment={() => createComment()} handleGenai={() => setGenAI(true)} /> */}
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    // flex: 1,
    alignItems: 'center',
    color: COLORS.grey777777,
    fontSize: nh(14),
    // fontFamily: FONTS.CircularstdMedium,
    justifyContent: 'center',
    textAlign: 'center',
    marginTop: nh(20),
    lineHeight: nh(16),
    marginBottom: 30,
  },
  contentContainer: {
    flex: 1,
  },
  containerHeadline: {
    // fontFamily: FONTS.CircularstdMedium,
    fontSize: 16,
    fontWeight: '500',
    // color: COLORS.black333333,
    alignItems: 'center',
    textAlign: 'center',
    // padding: 20
  },
  textInput: {
    alignSelf: 'stretch',
    marginHorizontal: 12,
    marginBottom: 40,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'lightgrey',
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: '#eee',
  },
});

export default CustomBottomSheetModal;
