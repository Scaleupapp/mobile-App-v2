const mongoose = require('mongoose');


const CommentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: String }], // Array of user IDs who liked the comment
  replies: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: String }]
  }],
  pinnedBy: { type: String, default: null }, // User ID who pinned the comment
}, { timestamps: true });

const PlaylistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  playlistName: { type: String, required: true },
  items: [{
    postId: { type: String, required: true },
    viewedStatus: [{
      userId: { type: String, required: true },
      isViewed: { type: Boolean, default: false }
    }]
  }],
  status: { type: String, enum: ['public', 'private'], default: 'private' },
  comments: [CommentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Playlist', PlaylistSchema);
