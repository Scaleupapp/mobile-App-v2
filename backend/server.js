const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

// Playlist Model
const Playlist = require('./models/Playlist');

// Check if a post is already in the user's playlist
app.get('/api/playlists/check', async (req, res) => {
  const { userId, postId } = req.query;

  if (!userId || !postId) {
    return res.status(400).json({ message: 'User ID and Post ID are required' });
  }

  try {
    // Find any playlist for the user that contains this post
    const existingPlaylist = await Playlist.findOne({
      userId: userId,
      'items.postId': postId
    });

    res.status(200).json({ 
      exists: !!existingPlaylist,
      message: existingPlaylist ? 'Post already in playlist' : 'Post not in playlist'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking playlist', 
      error: error.message 
    });
  }
});

// Create a new playlist
app.post('/api/playlists/create', async (req, res) => {
  const { userId, playlistName } = req.body;

  if (!userId || !playlistName) {
    return res.status(400).json({ message: 'User ID and Playlist Name are required' });
  }

  try {
    // Check if playlist with same name already exists
    const existingPlaylist = await Playlist.findOne({ 
      userId, 
      playlistName 
    });

    if (existingPlaylist) {
      return res.status(400).json({ message: 'Playlist with this name already exists' });
    }

    const newPlaylist = await Playlist.create({ 
      userId, 
      playlistName, 
      items: [] 
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
});

// Get all playlists for a user
app.get('/api/playlists', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const playlists = await Playlist.find({ userId });
    res.status(200).json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists', error: error.message });
  }
});

// Add post to a specific playlist
app.post('/api/playlists/add-to-playlist', async (req, res) => {
  const { userId, playlistId, postId } = req.body;

  if (!userId || !playlistId || !postId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Post ID are required' });
  }

  try {
    // Check if post already exists in the playlist
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      userId,
      'items.postId': postId 
    });

    if (playlist) {
      return res.status(400).json({ message: 'Post already exists in this playlist' });
    }

    // Add post to playlist
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId },
      { $push: { items: { postId } } },
      { new: true }
    );

    if (!updatedPlaylist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error adding post to playlist', error: error.message });
  }
});


// Delete a post from a specific playlist
app.delete('/api/playlists/remove-from-playlist', async (req, res) => {
  const { userId, playlistId, postId } = req.body;

  if (!userId || !playlistId || !postId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Post ID are required' });
  }

  try {
    // Remove the post from the playlist
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId },
      { $pull: { items: { postId } } },
      { new: true }
    );

    if (!updatedPlaylist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error removing post from playlist', error: error.message });
  }
});



app.put('/api/playlists/rename', async (req, res) => {
  const { userId, playlistId, newPlaylistName } = req.body;

  if (!userId || !playlistId || !newPlaylistName) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and New Playlist Name are required' });
  }

  try {
    // Check if a playlist with the new name already exists
    const existingPlaylist = await Playlist.findOne({ 
      userId, 
      playlistName: newPlaylistName 
    });

    if (existingPlaylist) {
      return res.status(400).json({ message: 'A playlist with this name already exists' });
    }

    // Update the playlist name
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { _id: playlistId, userId },
      { playlistName: newPlaylistName },
      { new: true }
    );

    if (!updatedPlaylist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json(updatedPlaylist);
  } catch (error) {
    res.status(500).json({ message: 'Error renaming playlist', error: error.message });
  }
});

// Delete a playlist
app.delete('/api/playlists/delete', async (req, res) => {
  const { userId, playlistId } = req.body;

  if (!userId || !playlistId) {
    return res.status(400).json({ message: 'User ID and Playlist ID are required' });
  }

  try {
    const deletedPlaylist = await Playlist.findOneAndDelete({ 
      _id: playlistId, 
      userId 
    });

    if (!deletedPlaylist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting playlist', error: error.message });
  }
});


// Update playlist order
app.put('/api/playlists/update-order', async (req, res) => {
  const { playlistId, items } = req.body;

  if (!playlistId || !items || !Array.isArray(items)) {
    return res.status(400).json({ message: 'Playlist ID and valid items array are required' });
  }

  try {
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      { _id: playlistId },
      { items },
      { new: true }
    );

    if (!updatedPlaylist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.status(200).json(updatedPlaylist);
  } catch (error) {
    handleErrorResponse(res, error, 'Error updating playlist order');
  }
});

// Toggle playlist visibility
app.put('/api/playlists/toggle-status', async (req, res) => {
  const { userId, playlistId } = req.body;

  if (!userId || !playlistId) {
    return res.status(400).json({ message: 'User ID and Playlist ID are required' });
  }

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Toggle status
    const newStatus = playlist.status === 'private' ? 'public' : 'private';
    playlist.status = newStatus;
    await playlist.save();

    res.status(200).json({ message: `Playlist is now ${newStatus}`, playlist });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling playlist status', error: error.message });
  }
});


// Fetch all public playlists
app.get('/api/playlists/public', async (req, res) => {
  try {
    const publicPlaylists = await Playlist.find({ status: 'public' });

    res.status(200).json(publicPlaylists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public playlists', error: error.message });
  }
});


// Fetch details of a specific public playlist
app.get('/api/playlists/public/:playlistId', async (req, res) => {
  const { playlistId } = req.params;

  try {
    // Find the playlist and populate post details
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      status: 'public' 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Public playlist not found' });
    }

    // You might want to add additional logic to fetch full post details here
    // For now, we'll return the playlist as is
    res.status(200).json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public playlist details', error: error.message });
  }
});

// Mark a post as viewed in a playlist
app.post('/api/playlists/mark-viewed', async (req, res) => {
  const { userId, playlistId, postId } = req.body;

  if (!userId || !playlistId || !postId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Post ID are required' });
  }

  try {
    const playlist = await Playlist.findOne({ _id: playlistId });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Find the specific item in the playlist
    const itemIndex = playlist.items.findIndex(item => item.postId === postId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Post not found in playlist' });
    }

    // Find or create the view status for this user
    const viewStatusIndex = playlist.items[itemIndex].viewedStatus.findIndex(
      status => status.userId === userId
    );

    if (viewStatusIndex === -1) {
      // Add new view status if not exists
      playlist.items[itemIndex].viewedStatus.push({
        userId,
        isViewed: true
      });
    } else {
      // Update existing view status
      playlist.items[itemIndex].viewedStatus[viewStatusIndex].isViewed = true;
    }

    await playlist.save();

    res.status(200).json({ message: 'Post marked as viewed', playlist });
  } catch (error) {
    res.status(500).json({ message: 'Error marking post as viewed', error: error.message });
  }
});

// Get playlist with viewed status for a specific user
app.get('/api/playlists/:playlistId/viewed-status', async (req, res) => {
  const { playlistId } = req.params;
  const { userId } = req.query;

  if (!userId || !playlistId) {
    return res.status(400).json({ message: 'User ID and Playlist ID are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Transform items to include viewed status for the specific user
    const itemsWithViewedStatus = playlist.items.map(item => {
      const userViewStatus = item.viewedStatus.find(status => status.userId === userId);
      return {
        ...item.toObject(),
        isViewed: userViewStatus ? userViewStatus.isViewed : false
      };
    });

    res.status(200).json({
      ...playlist.toObject(),
      items: itemsWithViewedStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlist viewed status', error: error.message });
  }
});


// Add a comment to a playlist
app.post('/api/playlists/comments/add', async (req, res) => {
  const { userId, playlistId, text, username } = req.body;

  if (!userId || !playlistId || !text || !username) {
    return res.status(400).json({ message: 'User ID, Playlist ID, Username, and Comment Text are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const newComment = {
      userId,
      username,
      text,
      likes: [],
      replies: []
    };

    playlist.comments.push(newComment);
    await playlist.save();

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Reply to a comment in a playlist
app.post('/api/playlists/comments/reply', async (req, res) => {
  const { userId, playlistId, commentId, text, username } = req.body;

  if (!userId || !playlistId || !commentId || !text || !username) {
    return res.status(400).json({ message: 'User ID, Playlist ID, Comment ID, Username, and Reply Text are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const newReply = {
      userId,
      username,
      text,
      likes: []
    };

    comment.replies.push(newReply);
    await playlist.save();

    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ message: 'Error adding reply', error: error.message });
  }
});

// Like a comment or reply
app.post('/api/playlists/comments/like', async (req, res) => {
  const { userId, playlistId, commentId, replyId } = req.body;

  if (!userId || !playlistId || !commentId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Comment ID are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    let targetLikes = comment.likes;
    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      targetLikes = reply.likes;
    }

    const likeIndex = targetLikes.indexOf(userId);
    if (likeIndex > -1) {
      // Unlike
      targetLikes.splice(likeIndex, 1);
    } else {
      // Like
      targetLikes.push(userId);
    }

    await playlist.save();

    res.status(200).json({ 
      message: likeIndex > -1 ? 'Unliked' : 'Liked',
      likes: targetLikes 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking/unliking', error: error.message });
  }
});

// Pin a comment (only playlist owner can do this)
app.post('/api/playlists/comments/pin', async (req, res) => {
  const { userId, playlistId, commentId } = req.body;

  if (!userId || !playlistId || !commentId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Comment ID are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if the user is the playlist owner
    if (playlist.userId !== userId) {
      return res.status(403).json({ message: 'Only playlist owner can pin comments' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Unpin any previously pinned comment
    playlist.comments.forEach(c => {
      if (c.pinnedBy === userId) {
        c.pinnedBy = null;
      }
    });

    // Pin the new comment
    comment.pinnedBy = userId;

    await playlist.save();

    res.status(200).json({ 
      message: 'Comment pinned successfully',
      comment 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error pinning comment', error: error.message });
  }
});

// Delete a comment or reply (owner of playlist or comment can delete)
app.delete('/api/playlists/comments/delete', async (req, res) => {
  const { userId, playlistId, commentId, replyId } = req.body;

  if (!userId || !playlistId || !commentId) {
    return res.status(400).json({ message: 'User ID, Playlist ID, and Comment ID are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has permission to delete
    const isPlaylistOwner = playlist.userId === userId;
    const isCommentOwner = comment.userId === userId;

    if (replyId) {
      const reply = comment.replies.id(replyId);
      const isReplyOwner = reply.userId === userId;

      if (!(isPlaylistOwner || isCommentOwner || isReplyOwner)) {
        return res.status(403).json({ message: 'Not authorized to delete this reply' });
      }

      comment.replies.pull(replyId);
    } else {
      if (!(isPlaylistOwner || isCommentOwner)) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      playlist.comments.pull(commentId);
    }

    await playlist.save();

    res.status(200).json({ 
      message: replyId ? 'Reply deleted successfully' : 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment/reply', error: error.message });
  }
});

// Fetch comments for a playlist
app.get('/api/playlists/:playlistId/comments', async (req, res) => {
  const { playlistId } = req.params;

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Sort comments by likes and creation date
    const sortedComments = playlist.comments.sort((a, b) => {
      // First sort by pinned status
      if (a.pinnedBy && !b.pinnedBy) return -1;
      if (!a.pinnedBy && b.pinnedBy) return 1;
      
      // Then sort by likes count
      const likeDiff = b.likes.length - a.likes.length;
      if (likeDiff !== 0) return likeDiff;
      
      // Finally sort by creation date
      return b.createdAt - a.createdAt;
    });

    res.status(200).json(sortedComments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

app.get('/api/playlists/public/comments/:playlistId', async (req, res) => {
  const { playlistId } = req.params;

  try {
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      status: 'public' 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Public playlist not found' });
    }

    // Sort comments by likes and creation date
    const sortedComments = playlist.comments.sort((a, b) => {
      // First sort by pinned status
      if (a.pinnedBy && !b.pinnedBy) return -1;
      if (!a.pinnedBy && b.pinnedBy) return 1;
      
      // Then sort by likes count
      const likeDiff = b.likes.length - a.likes.length;
      if (likeDiff !== 0) return likeDiff;
      
      // Finally sort by creation date
      return b.createdAt - a.createdAt;
    });

    res.status(200).json(sortedComments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public playlist comments', error: error.message });
  }
});

// Add a comment to a public playlist
app.post('/api/playlists/public/add-comment', async (req, res) => {
  const { playlistId, userId, username, comment } = req.body;

  if (!playlistId || !userId || !username || !comment) {
    return res.status(400).json({ message: 'Playlist ID, User ID, Username, and Comment are required' });
  }

  try {
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      status: 'public' 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Public playlist not found' });
    }

    const newComment = {
      userId,
      username,
      text: comment,
      likes: [],
      replies: []
    };

    playlist.comments.push(newComment);
    await playlist.save();

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment to public playlist', error: error.message });
  }
});

// Like a comment in a public playlist
app.post('/api/playlists/public/comments/like', async (req, res) => {
  const { playlistId, commentId, userId, replyId } = req.body;

  if (!playlistId || !commentId || !userId) {
    return res.status(400).json({ message: 'Playlist ID, Comment ID, and User ID are required' });
  }

  try {
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      status: 'public' 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Public playlist not found' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    let targetLikes = comment.likes;
    if (replyId) {
      const reply = comment.replies.id(replyId);
      if (!reply) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      targetLikes = reply.likes;
    }

    const likeIndex = targetLikes.indexOf(userId);
    if (likeIndex > -1) {
      // Unlike
      targetLikes.splice(likeIndex, 1);
    } else {
      // Like
      targetLikes.push(userId);
    }

    await playlist.save();

    res.status(200).json({ 
      message: likeIndex > -1 ? 'Unliked' : 'Liked',
      likes: targetLikes 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking/unliking public playlist comment', error: error.message });
  }
});

// Delete a comment or reply from a public playlist
app.delete('/api/playlists/public/comments/delete', async (req, res) => {
  const { playlistId, commentId, userId, replyId } = req.body;

  if (!playlistId || !commentId || !userId) {
    return res.status(400).json({ message: 'Playlist ID, Comment ID, and User ID are required' });
  }

  try {
    const playlist = await Playlist.findOne({ 
      _id: playlistId, 
      status: 'public' 
    });

    if (!playlist) {
      return res.status(404).json({ message: 'Public playlist not found' });
    }

    const comment = playlist.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isCommentOwner = comment.userId === userId;

    if (replyId) {
      const reply = comment.replies.id(replyId);
      const isReplyOwner = reply.userId === userId;

      if (!isReplyOwner) {
        return res.status(403).json({ message: 'Not authorized to delete this reply' });
      }

      comment.replies.pull(replyId);
    } else {
      if (!isCommentOwner) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      playlist.comments.pull(commentId);
    }

    await playlist.save();

    res.status(200).json({ 
      message: replyId ? 'Reply deleted successfully' : 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting public playlist comment/reply', error: error.message });
  }
});

app.get('/api/playlists/:playlistId/ownership', async (req, res) => {
  const { playlistId } = req.params;
  const { userId } = req.query;

  if (!userId || !playlistId) {
    return res.status(400).json({ message: 'User ID and Playlist ID are required' });
  }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    const isOwner = playlist.userId === userId;

    res.status(200).json({ isOwner });
  } catch (error) {
    res.status(500).json({ message: 'Error checking playlist ownership', error: error.message });
  }
});
// Start Server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));