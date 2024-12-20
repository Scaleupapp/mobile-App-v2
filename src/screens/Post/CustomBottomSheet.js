import {
  View,
  StyleSheet,
  Image,
  FlatList,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import React, {forwardRef, useEffect, useMemo, useRef, useState} from 'react';
import {BottomSheetModal, BottomSheetView} from '@gorhom/bottom-sheet';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import CustomTextInput from '../../components/TextInput';
import {icons} from '../../assets/icons';
import {
  addComment,
  likeComment,
  replyComment,
  unlikeComment,
} from '../../services/apiService';
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import {timeAgo} from '../../helper/commonFunctions';
import {images} from '../../assets/images';
import {useSelector} from 'react-redux';

const RenderComment = ({item, index, onReplyPress}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false); // State to toggle replies visibility

  const likeHandler = async () => {
    try {
      setIsLiked(!isLiked);
      const res = isLiked
        ? await unlikeComment(item?._id)
        : await likeComment(item?._id);
      console.log('🚀 ~ likeHandler ~ res:', res?.data);
    } catch (error) {
      console.log(error, 'eeee');
    }
  };

  return (
    <View key={index}>
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: nw(24),
          marginBottom: nh(16),
          flex: 1,
        }}>
        <Image
          source={
            item?.userId?.profilePicture
              ? {uri: item?.userId?.profilePicture}
              : images.ciclelogo
          }
          style={{
            height: nw(65),
            width: nw(65),
            borderRadius: nw(65 / 2),
            marginRight: nw(11),
          }}
        />
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text
              variant="semibold16"
              style={{
                color: COLORS.black000000,
              }}>
              {item?.userId?.username}
            </Text>
            <Text
              variant="medium12"
              style={{
                color: COLORS.black333333,
                marginHorizontal: nw(30),
              }}>
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
          <TouchableOpacity onPress={onReplyPress}>
            <Text
              variant="semibold12"
              style={{
                color: COLORS.grey999999,
              }}>
              {'Reply'}
            </Text>
          </TouchableOpacity>
          {item?.replies?.length > 0 && (
            <TouchableOpacity onPress={() => setShowReplies(!showReplies)}>
              <Text
                variant="semibold12"
                style={{
                  color: COLORS.blue500, // Highlight "Show Replies" and "Hide Replies"
                  marginTop: nh(8),
                }}>
                {showReplies
                  ? 'Hide Replies'
                  : `Show ${item.replies.length} Replies`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Icon
          type={'antdesign'}
          color={COLORS.grey777777}
          name={isLiked ? 'like1' : 'like2'}
          size={nh(14)}
          onPress={likeHandler}
        />
      </View>
      {showReplies &&
        item?.replies?.map((reply, replyIndex) => (
          <View
            key={replyIndex}
            style={{
              marginLeft: nw(28), // Indentation for replies
              marginTop: nh(8),
            }}>
            <RenderComment
              item={reply}
              // item={{
              //   _id: '6762efb7d56881947a4f07fc',
              //   contentId: '6673c49515ce5d6b3aea1ac6',
              //   userId: {
              //     _id: '674f0edd92383a88cabf2bcb',
              //     username: 'vpd',
              //     profilePicture:
              //       'https://scaleupbucket.s3.ap-southeast-2.amazonaws.com/674f0edd92383a88cabf2bcb/674f0edd92383a88cabf2bcb.jpg',
              //   },
              //   username: 'vpd',
              //   commentText: 'Anskans',
              //   parentCommentId: null,
              //   replies: [],
              //   likes: [],
              //   likeCount: 0,
              //   commentDate: '2024-12-18T15:52:23.993Z',
              //   __v: 0,
              // }}
              index={replyIndex}
              onReplyPress={() => console.log('Reply to', reply?._id)}
            />
          </View>
        ))}
    </View>
  );
};

const CommentBottomSheetModal = forwardRef(
  ({postId, comments = [], setComments}, ref) => {
    const snapPoints = useMemo(() => ['100%', '90%'], []);
    const userData = useSelector(state => state?.userData);
    const [text, setText] = useState('');
    const [selectedComment, setSelectedComment] = useState(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const TextInputRef = useRef();
    const FlatRef = useRef();

    const sendComment = async () => {
      try {
        let paylaod = {
          contentId: postId,
          commentText: text,
        };
        const {data} = await addComment(paylaod);
        Keyboard.dismiss();
        FlatRef.current?.scrollToEnd();
        let newPayload = [
          {
            ...paylaod,
            userId: {
              profilePicture: userData?.profilePicture,
              username: userData?.username,
              commentDate: new Date(),
            },
          },
        ];
        setText('');
        setComments([...comments, ...newPayload]);
      } catch (error) {}
    };

    const sendReply = async () => {
      try {
        let paylaod = {
          contentId: postId,
          commentText: text,
          parentCommentId: selectedComment?._id,
        };
        console.log('🚀 ~ sendReply ~ paylaod:', paylaod);
        const {data} = await replyComment(paylaod);
        console.log('🚀 ~ sendReply ~ data:', data);
        Keyboard.dismiss();
        FlatRef.current?.scrollToEnd();
        // let newComments = comments?.map(u => {
        //   if (u?._id == selectedComment?._id) {
        //   }
        // });
        // let newPayload = [
        //   {
        //     ...paylaod,
        //     userId: {
        //       profilePicture: userData?.profilePicture,
        //       username: userData?.username,
        //       commentDate: new Date(),
        //     },
        //   },
        // ];
        setText('');
        // setComments([...comments, ...newPayload]);
      } catch (error) {}
    };

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        event => {
          ref.current?.snapToIndex(1);
          setKeyboardVisible(true);
        },
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          ref.current?.snapToIndex(0);
          setKeyboardVisible(false);
        },
      );

      // Clean up listeners when component unmounts
      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        // handleComponent={null}
        containerStyle={{
          borderTopLeftRadius: 24,
        }}
        // onDismiss={() => setSelectedComment(null)}
        style={{
          borderRadius: 24,
          boxShadow: '2 4 4 8 rgba(0, 0, 0, 0.15)',
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
            <View
              style={{
                height: nh(
                  isKeyboardVisible
                    ? selectedComment?.username
                      ? 260
                      : 280
                    : 400,
                ),
              }}>
              <FlatList
                keyboardShouldPersistTaps={'always'}
                ref={FlatRef}
                data={comments}
                contentContainerStyle={{marginTop: 30}}
                renderItem={({item, index}) => (
                  <RenderComment
                    item={item}
                    index={index}
                    onReplyPress={() => {
                      TextInputRef.current?.focus();
                      setSelectedComment(item);
                    }}
                  />
                )}
              />
            </View>
          )}
          <View
            style={{
              marginHorizontal: nw(16),
              paddingVertical: nh(10),
            }}>
            {selectedComment?.username && (
              <View
                style={{
                  marginBottom: nh(3),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Text
                  variant="medium12"
                  color={COLORS.grey333333}
                  style={{marginBottom: nh(3)}}>
                  reply to @{selectedComment?.username}
                </Text>
                <Icon
                  type={'antdesign'}
                  color={COLORS.grey333333}
                  name="close"
                  size={nh(16)}
                  onPress={() => setSelectedComment(null)}
                  style={{transform: [{scaleX: -1}]}}
                />
              </View>
            )}
            <CustomTextInput
              ref={TextInputRef}
              value={text}
              onChangeText={setText}
              placeholder={'Write here'}
              placeholderTextColor={COLORS.grey646464}
              rightIcon={icons.send}
              onRightIconPress={() => {
                if (selectedComment?.username) sendReply();
                else sendComment();
              }}
            />
          </View>
        </BottomSheetView>
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
