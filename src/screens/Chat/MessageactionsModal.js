import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {formatAMPM} from '../../helper/commonFunctions';
import {COLORS} from '../../helper/colors';
import Text from '../../components/Text';
import Video from 'react-native-video';
import {Image} from 'react-native';
import Icon from '../../helper/icon';
import EmojiSelector, {Categories} from 'react-native-emoji-selector';

const MessageModal = ({
  isVisible,
  onClose,
  item,
  onEdit,
  onDelete,
  isEditable,
  onReact,
}) => {
  const emojiReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose} // Closes modal when backdrop is pressed
      onBackButtonPress={onClose} // Handles back button press on Android
      backdropOpacity={0.7} // Adjust the background opacity
      backdropColor="black" // Background colo
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      useNativeDriver={true}
      transparent={true}
      //   customBackdrop={
      //     <View style={styles.customBackdrop}>
      //       <TouchableOpacity style={{flex: 1}} onPress={onClose} />
      //     </View>
      //   }
      style={styles.modal}>
      <View style={styles.modalContent}>
        {/* Emoji Reactions */}
        <View style={styles.reactionRow}>
          {emojiReactions.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiButton}
              onPress={() => onReact(emoji)}>
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.messageContainer,

            item?.edited && {
              paddingBottom: 18,
            },
          ]}>
          <View>
            {item?.message && !item?.mediaType && (
              <Text
                style={styles.messageText}
                variant="medium14"
                color={COLORS.black333333}>
                {item.message}
              </Text>
            )}
            {item?.media &&
              (item?.mediaType == 'Image' ||
                item?.mediaType?.includes('image')) && (
                <Image
                  source={{uri: item.media}}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
              )}

            {item?.media && item?.mediaType?.includes('video') && (
              <Video
                source={{uri: item.media}}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 10,
                }}
                resizeMode="cover"
                controls
              />
            )}
            {item?.message && item?.mediaType && (
              <Text
                style={[styles.messageText, {marginTop: 10}]}
                variant="medium14"
                color={COLORS.black333333}>
                {item.message}
              </Text>
            )}
            {/* {item.contentType === 'gif' && (
                <Image
                  source={{uri: item.message}}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
              )} */}
            <Text
              style={{
                fontSize: 10,
                alignSelf: 'flex-end',
                color: COLORS.grey777777,
              }}>
              {formatAMPM(item?.updatedAt)}
            </Text>
            {item?.edited && (
              <Text
                style={{
                  position: 'absolute',
                  bottom: -15,
                  right: -5,
                  fontSize: 10,
                  backgroundColor: COLORS.whiteFFFFFF,
                  paddingHorizontal: nh(3),
                  borderRadius: 5,
                  color: COLORS.yellowF5BE00,
                }}>
                {'edited'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon type="octicons" name="reply" size={20} color="black" />
            <Text variant="semibold14" style={styles.actionText}>
              Reply
            </Text>
          </TouchableOpacity>

          {isEditable && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Icon type="feather" name="edit" size={20} color="black" />
              <Text variant="semibold14" style={styles.actionText}>
                Edit
              </Text>
            </TouchableOpacity>
          )}
          {isEditable && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Icon type="antdesign" name="delete" size={20} color="black" />
              <Text variant="semibold14" style={styles.actionText}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MessageModal;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    // margin: 0,
    marginLeft: nw(70),
    marginRight: nw(10),
  },
  modalContent: {
    // backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // marginBottom: nh(16),
    backgroundColor: 'white',
    borderRadius: nh(20),
    paddingHorizontal: nw(10),
  },
  emojiButton: {
    padding: 10,
  },
  emoji: {
    fontSize: nh(14),
  },
  messageContainer: {
    maxWidth: DEVICE_WIDTH - nw(100),
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: 'white',
  },
  messageText: {
    color: 'black',
    fontSize: 16,
  },
  actionRow: {
    // flexDirection: 'row',
    // alignItems: 'flex-end',
    alignSelf: 'flex-end',
    width: nw(150),
    backgroundColor: 'white',
    borderRadius: nh(20),
    padding: nh(10),
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 5,
    flexDirection: 'row',
  },
  actionText: {
    color: 'black',
    fontSize: 14,
    marginLeft: 10,
  },
  customBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adjust opacity her
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
  },
});
