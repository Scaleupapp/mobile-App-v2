import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import Icon from '../../helper/icon';
import Text from '../../components/Text';
import Header from '../../components/Header';

//import { COLORS } from '../../helper/colors';


// Updated color palette
const COLORS = {
  background: '#F7F9FC', // Light pale blue background
  primaryBlue: '#043142',  // Deep blue
  accentYellow: '#FFD700', // Golden yellow
  lightYellow: '#FFF9E6',  // Very light yellow
  grey: '#6B7280',         // Soft grey for text
  white: '#FFFFFF',
  lightGrey: '#E5E7EB',
  yellowF5BE00: '#F5BE00' // Added to match MyPlaylists styling
};

const PlaylistCommentsModal = ({ 
  visible, 
  playlistId, 
  userId, 
  username, 
  onClose 
}) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaylistOwner, setIsPlaylistOwner] = useState(false);


  const checkPlaylistOwnership = async () => {
    try {
      const response = await axios.get(`https://api.scaleupapp.club/api/playlists/${playlistId}/ownership`, {
        params: { userId }
      });
      setIsPlaylistOwner(response.data.isOwner);
    } catch (error) {
      console.error('Failed to check playlist ownership:', error);
    }
  };

  const fetchUsername = async (userId) => {
    try {
        const response = await fetch(`https://api.scaleupapp.club/api/user/${userId}`);
        
        if (!response.ok) {
            console.warn(`Failed to fetch username for user ${userId}. Status: ${response.status}`);
            return userId;
        }

        const userData = await response.json();
        console.log(userData);

        return userData?.username || userId;
    } catch (error) {
        console.warn(`Network error fetching username for user ${userId}:`, error);
        return userId;
    }
};


  useEffect(() => {
    if (visible && playlistId) {
      fetchComments();
      checkPlaylistOwnership();

    }
  }, [visible, playlistId]);


  const pinComment = async (commentId) => {
    try {
      setIsLoading(true);
      await axios.post('https://api.scaleupapp.club/api/playlists/comments/pin', {
        userId,
        playlistId,
        commentId
      });
      await fetchComments();
    } catch (error) {
      console.error('Failed to pin comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://api.scaleupapp.club/api/playlists/${playlistId}/comments`);
      
      // Fetch usernames for comment userIds and reply userIds
      const commentsWithUserData = await Promise.all(
        response.data.map(async (comment) => {
          const username = await fetchUsername(comment.userId);
  
          const repliesWithUserData = await Promise.all(
            comment.replies.map(async (reply) => {
              const replyUsername = await fetchUsername(reply.userId);
              return { ...reply, userData: { username: replyUsername } };
            })
          );
  
          return { ...comment, userData: { username }, replies: repliesWithUserData };
        })
      );
  
      // Sort comments with pinned comment first
      const sortedComments = commentsWithUserData.sort((a, b) =>
        (b.pinnedBy ? 1 : 0) - (a.pinnedBy ? 1 : 0)
      );
  
      setComments(sortedComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const addComment = async () => {
    if (!newCommentText.trim()) return;

    try {
      setIsLoading(true);
      await axios.post('https://api.scaleupapp.club/api/playlists/comments/add', {
        userId,
        playlistId,
        text: newCommentText,
        username
      });
      setNewCommentText('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Optionally add error handling
    } finally {
      setIsLoading(false);
    }
  };

  const replyToComment = async (commentId) => {
    if (!newCommentText.trim()) return;

    try {
      setIsLoading(true);
      await axios.post('https://api.scaleupapp.club/api/playlists/comments/reply', {
        userId,
        playlistId,
        commentId,
        text: newCommentText,
        username
      });
      setNewCommentText('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Failed to reply to comment:', error);
      // Optionally add error handling
    } finally {
      setIsLoading(false);
    }
  };

  const likeComment = async (commentId, replyId = null) => {
    try {
      setIsLoading(true);
      await axios.post('https://api.scaleupapp.club/api/playlists/comments/like', {
        userId,
        playlistId,
        commentId,
        replyId
      });
      await fetchComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
      // Optionally add error handling
    } finally {
      setIsLoading(false);
    }
  };

const renderComment = ({ item: comment }) => (
  <View
    style={[
      styles.commentContainer,
      comment.pinnedBy && styles.pinnedCommentContainer,
    ]}
  >
    <View style={styles.commentHeader}>
      <View style={styles.commentHeaderLeft}>
        {/* Render comment username or fallback to userId */}
        <Text style={styles.usernameText}>
          {comment.userData?.username || comment.userId}
        </Text>
        {comment.pinnedBy && (
          <Icon
            type="ionicon"
            name="pin"
            color={COLORS.primaryBlue}
            size={16}
          />
        )}
      </View>
      <View style={styles.commentActions}>
        {isPlaylistOwner && !comment.pinnedBy && (
          <TouchableOpacity
            onPress={() => pinComment(comment._id)}
            style={styles.pinButton}
          >
            <Icon
              type="ionicon"
              name="pin"
              color={COLORS.primaryBlue}
              size={20}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => likeComment(comment._id)}
          style={styles.actionButton}
        >
          <Icon
            type="ionicon"
            name="heart"
            color={
              comment.likes.includes(userId) ? COLORS.accentYellow : COLORS.grey
            }
            size={20}
          />
          <Text style={styles.likeCount}>{comment.likes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setReplyingTo(comment._id)}
          style={styles.actionButton}
        >
          <Icon type="ionicon" name="return-down-back" color={COLORS.primaryBlue} size={20} />
        </TouchableOpacity>
      </View>
    </View>
    <Text style={styles.commentText}>{comment.text}</Text>

    {/* Render Replies */}
    {comment.replies.map((reply) => (
      <View key={reply._id} style={styles.replyContainer}>
        <View style={styles.replyHeader}>
          {/* Render reply username or fallback to userId */}
          <Text style={styles.replyUsername}>
            {reply.userData?.username || reply.userId}
          </Text>
          <TouchableOpacity
            onPress={() => likeComment(comment._id, reply._id)}
            style={styles.replyLikeButton}
          >
            <Icon
              type="ionicon"
              name="heart"
              color={
                reply.likes.includes(userId) ? COLORS.accentYellow : COLORS.grey
              }
              size={16}
            />
            <Text style={styles.replyLikeCount}>{reply.likes.length}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.replyText}>{reply.text}</Text>
      </View>
    ))}
  </View>
);


  // Rest of the component remains the same
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.modalContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.yellowF5BE00}
        />
        
        {/* Added Header component to match MyPlaylists */}
        <Header 
          title="Comments" 
          onBackPress={onClose}
        />

        <View style={styles.contentContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No comments yet. Be the first to comment!</Text>
              </View>
            }
            refreshing={isLoading}
            onRefresh={fetchComments}
          />
          
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>Replying to a comment</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Icon type="ionicon" name="close" color={COLORS.primaryBlue} size={20} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.commentInputContainer}>
            <TextInput
              value={newCommentText}
              onChangeText={setNewCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.grey}
              style={styles.commentInput}
              multiline
            />
            <TouchableOpacity 
              onPress={replyingTo ? () => replyToComment(replyingTo) : addComment}
              disabled={!newCommentText.trim() || isLoading}
            >
              <Icon 
                type="ionicon" 
                name={replyingTo ? "send" : "paper-plane"} 
                size={24} 
                color={newCommentText.trim() && !isLoading ? COLORS.primaryBlue : COLORS.grey} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00, // Matches MyPlaylists background
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 32,
    marginHorizontal: 2,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    color: COLORS.grey,
    textAlign: 'center',
  },
  commentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinnedCommentContainer: {
    backgroundColor: COLORS.lightYellow,
    borderWidth: 1,
    borderColor: COLORS.accentYellow + '40',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  usernameText: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  commentText: {
    color: COLORS.grey,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likeCount: {
    fontSize: 12,
    color: COLORS.grey,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  replyUsername: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: 'bold',
  },
  replyText: {
    color: COLORS.grey,
    fontSize: 12,
  },
  replyLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  replyLikeCount: {
    fontSize: 10,
    color: COLORS.grey,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderRadius: 8,

    borderTopColor: COLORS.lightGrey,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    color: COLORS.grey,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.lightYellow,
  },
  replyingToText: {
    color: COLORS.primaryBlue,
    fontWeight: 'bold',
  },
  pinButton: {
    marginRight: 10,
  },
});

export default PlaylistCommentsModal;