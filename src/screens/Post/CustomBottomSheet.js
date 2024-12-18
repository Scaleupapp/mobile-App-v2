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
import {addComment} from '../../services/apiService';
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import {timeAgo} from '../../helper/commonFunctions';
import {images} from '../../assets/images';

const RenderComment = ({item, index, onReplyPress}) => {
  const [isLiked, setIsLiked] = useState(false);
  const likeHandler = async () => {
    setIsLiked(!isLiked);
    // try {
    //   setIsLiked(!isLiked);
    //   const res = isLiked
    //     ? await unlikePostApi(item?._id)
    //     : await likePostApi(item?._id);
    //   console.log('🚀 ~ likeHandler ~ res:', res?.data);

    //   setLikeCount(res?.data?.likeCount);
    // } catch (error) {
    //   console.log(error, 'eeee');
    // }
  };

  return (
    <View
      key={index}
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
        // source={{uri: item?.userId?.profilePicture}}
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
        <TouchableOpacity onPress={onReplyPress}>
          <Text
            variant="semibold12"
            style={{
              color: COLORS.grey999999,
            }}>
            {'Reply'}
          </Text>
        </TouchableOpacity>
      </View>
      <Icon
        type={'antdesign'}
        color={COLORS.grey777777}
        name={isLiked ? 'like1' : 'like2'}
        size={nh(14)}
        onPress={() => likeHandler()}
      />
    </View>
  );
};
const CommentBottomSheetModal = forwardRef(
  ({comments = [], setComments}, ref) => {
    const snapPoints = useMemo(() => ['100%', '90%'], []);
    const [contentId, setcontentId] = useState(
      comments?.length > 0 ? comments[0]?.contentId : '',
    );
    const [text, setText] = useState('');
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    const TextInputRef = useRef();
    const sendComment = async () => {
      try {
        let paylaod = {
          contentId: contentId,
          commentText: text,
        };
        let resp = await addComment(paylaod);
        console.log('🚀 ~ sendComment ~ resp:', resp.data);
        Keyboard.dismiss();
        setcontentId(comments?.length > 0 ? comments[0]?.contentId : '');
        setText('');
        setComments([...comments, ...[paylaod]]);
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
            <View style={{height: nh(isKeyboardVisible ? 280 : 400)}}>
              <FlatList
                data={comments}
                contentContainerStyle={{marginTop: 30}}
                renderItem={({item, index}) => (
                  <RenderComment
                    item={item}
                    index={index}
                    onReplyPress={() => {
                      TextInputRef.current?.focus();
                      setcontentId(item?.contentId);
                    }}
                  />
                )}
              />
            </View>
          )}
          <View style={{marginHorizontal: nw(16), paddingVertical: nh(10)}}>
            <CustomTextInput
              ref={TextInputRef}
              value={text}
              onChangeText={setText}
              placeholder={'Write here'}
              placeholderTextColor={COLORS.grey646464}
              rightIcon={icons.send}
              onRightIconPress={sendComment}
              // multiline={true}
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
