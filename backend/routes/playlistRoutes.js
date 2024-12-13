const express = require('express');
const router = express.Router();
const Playlist = require('./models/Playlist');

// Create a new playlist
router.post('/create', async (req, res) => {
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
router.get('/', async (req, res) => {
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
router.post('/add-to-playlist', async (req, res) => {
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

module.exports = router;

// In your main server.js, add:
// app.use('/api/playlists', playlistRoutes);