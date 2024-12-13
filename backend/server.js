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





// Start Server
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));