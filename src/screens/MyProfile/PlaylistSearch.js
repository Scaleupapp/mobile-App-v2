import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from '../../helper/icon';
import { COLORS } from '../../helper/colors';
import { nw, nh } from '../../helper/scales';

const PlaylistSearch = ({ playlists, onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showClear, setShowClear] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((query) => {
    if (!playlists?.length) {
      onSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchLower = query.toLowerCase().trim();
      
      // If search is empty, return all playlists
      if (!searchLower) {
        onSearchResults(playlists);
        return;
      }

      const filteredPlaylists = playlists.filter(playlist => {
        // Safely handle undefined or null values
        const playlistName = playlist?.playlistName?.toLowerCase() || '';
        const username = playlist?.username?.toLowerCase() || '';
        
        return playlistName.includes(searchLower) || 
               username.includes(searchLower);
      });

      onSearchResults(filteredPlaylists);
    } catch (error) {
      console.error('Search error:', error);
      // In case of error, return original playlists
      onSearchResults(playlists);
    } finally {
      setIsSearching(false);
    }
  }, [playlists, onSearchResults]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300); // Debounce search for better performance

    setShowClear(searchQuery.length > 0);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, handleSearch]);

  const clearSearch = () => {
    setSearchQuery('');
    onSearchResults(playlists);
  };

  return (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchInputContainer,
        searchQuery.length > 0 && styles.searchInputContainerActive
      ]}>
        <Icon
          type="ionicon"
          name="search"
          size={20}
          color={COLORS.grey999999}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search playlists..."
          placeholderTextColor={COLORS.grey999999}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && (
          <ActivityIndicator 
            size="small" 
            color={COLORS.grey999999}
            style={styles.loader}
          />
        )}
        {showClear && !isSearching && (
          <TouchableOpacity 
            onPress={clearSearch} 
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              type="ionicon"
              name="close-circle"
              size={20}
              color={COLORS.grey999999}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = {
  searchContainer: {
    paddingHorizontal: nw(15),
    paddingVertical: nh(10),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    paddingHorizontal: nw(10),
  },
  searchInputContainerActive: {
    borderColor: COLORS.blue043142,
  },
  searchIcon: {
    marginRight: nw(10),
  },
  searchInput: {
    flex: 1,
    paddingVertical: nh(10),
    fontSize: 14,
    color: COLORS.blue043142,
  },
  clearButton: {
    padding: nw(5),
  },
  loader: {
    marginRight: nw(5),
  },
};

export default PlaylistSearch;