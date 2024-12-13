const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  playlistName: { type: String, required: true },
  items: { type: Array, required: true },
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
