import {
  View,
  StyleSheet,
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
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import {timeAgo} from '../../helper/commonFunctions';

const CommentBottomSheetModal = forwardRef(
  ({data = [], commentHandle}, ref) => {
    // console.log('🚀 ~ CustomBottomSheetModal ~ ref:', ref);
    // console.log({data, commentHandle});
    const snapPoints = useMemo(() => ['80%'], []);
    const [comments, setComments] = useState(data);
    // console.log('sbdjbs ', JSON.stringify(comments));
    const [modalVisible, setModalVisible] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState({
      height: 16,
      visible: false,
    });

    useEffect(() => {
      // getData(data?.post_id);
    }, []);

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
    // console.log({comments});
    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        handleComponent={null}
        containerStyle={{
          borderTopLeftRadius: 24,
        }}
        style={{
          borderRadius: 24,
          // borderWidth: 1,
          boxShadow: '2 4 4 8 rgba(0, 0, 0, 0.15)',
          // borderColor: COLORS.blue043142,
          overflow: 'hidden',
        }}>
        <BottomSheetView style={styles.contentContainer}>
          <Text variant="semibold18" style={styles.containerHeadline}>
            Comments
          </Text>

          {comments.length == 0 ? (
            <>
              <Text variant="semibold20" style={styles.emptyContainer}>
                {'No Comments Yet'}
              </Text>
              <Text variant="medium14" style={styles.emptyContainer1}>
                {
                  'It’s a bit quiet here. Start the conversation by leaving a comment on a post you find interesting.'
                }
              </Text>
            </>
          ) : (
            <FlatList
              data={comments}
              contentContainerStyle={{marginTop: 30}}
              renderItem={({item}) => {
                console.log('🚀 ~ item:', item);
                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginHorizontal: nw(24),
                      marginBottom: nh(16),
                      flex: 1,
                    }}>
                    <Image
                      source={{uri: item?.userId?.profilePicture}}
                      style={{
                        height: nw(65),
                        width: nw(65),
                        borderRadius: nw(65 / 2),
                        marginRight: nw(11),
                      }}
                    />
                    <View style={{flex: 1}}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text
                          variant="semibold16"
                          style={{
                            color: COLORS.black000000,
                            // marginBottom: nh(5),
                          }}>
                          {item?.userId?.username}
                        </Text>
                        <Text
                          variant="medium12"
                          style={{
                            color: COLORS.black333333,
                            marginHorizontal: nw(30),
                          }}>
                          {' '}
                          {timeAgo(item?.commentDate)}
                        </Text>
                      </View>
                      <Text
                        variant="medium12"
                        style={{
                          color: COLORS.black333333,
                        }}>
                        {item?.commentText}
                      </Text>
                      <Text
                        variant="semibold12"
                        style={{
                          color: COLORS.grey999999,
                        }}>
                        {'Reply'}
                      </Text>
                    </View>
                    <Icon
                      type={'antdesign'}
                      color={COLORS.grey777777}
                      name={'hearto'}
                      size={nh(14)}
                    />
                  </View>
                );
              }}
            />
          )}
        </BottomSheetView>
        {/* <ChatInput camera={false} gallery={false} mice={false} value={prompt} onChangeText={(e) => setPrompt(e)} btnStyle={{ marginBottom: isKeyboardVisible?.height + 10, paddingRight: normalize(95) }} handleComment={() => createComment()} handleGenai={() => setGenAI(true)} /> */}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  emptyContainer: {
    textAlign: 'center',
    color: COLORS.black333333,
    marginTop: nh(100),
  },
  emptyContainer1: {
    textAlign: 'center',
    color: COLORS.grey999999,
    marginHorizontal: 16,
    marginBottom: nh(100),
  },
  contentContainer: {
    flex: 1,
  },
  containerHeadline: {
    letterSpacing: 0.3,
    color: COLORS.black333333,
    textAlign: 'center',
    marginTop: 16,
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

export default CommentBottomSheetModal;
