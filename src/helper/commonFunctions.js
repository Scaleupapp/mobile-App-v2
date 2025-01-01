import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from '../../App';
import {actions} from '../redux/reducers';
import reduxStore from '../redux/store';
import Routes from './routes';
import Compressor from 'react-native-compressor';

export const logoutUser = async () => {
  try {
    await AsyncStorage.clear();
    reduxStore.dispatch(actions.logout());
    navigationRef.reset({
      index: 0,
      routes: [{name: Routes.LoginStack, params: {initialRoute: Routes.Login}}],
    });
  } catch (error) {
    console.log('🚀 ~ logoutUser ~ error:', error);
  }
};

export const isValidEmail = email => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return emailRegex.test(email);
};

export const isvalidMobileNumber = number => {
  const mobRegex = /^[5-9]\d{9}$/; // Matches Indian mobile numbers
  return mobRegex.test(number);
};

export const isvalidPassword = pass => {
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(pass);
};

// Debounce Function
export const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func?.(...args), delay);
  };
};

// Throttle Function
export const throttle = (func, limit) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func?.(...args);
    }
  };
};

export const formatDate = (date, day = false) => {
  let options = {year: 'numeric', month: 'short'}; // 'short' gives abbreviated month name
  if (day) options.day = 'numeric';
  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
  if (day) formattedDate.replace(/, /g, '-');
  formattedDate.replace(' ', '-');
  return formattedDate;
};

export const timeAgo = dateString => {
  const givenDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - givenDate) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    min: 60,
    sec: 1,
  };

  for (const [key, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

export const compressImage = async uri => {
  console.log(uri, 'uri======>');
  try {
    const compressedImage = await Compressor.Image.compress(uri, {
      compressionMethod: 'manual',
    });
    return compressedImage;
  } catch (error) {
    console.error('Error compressing image:', error);
  }
};

export const compressVideo = async uri => {
  console.log(uri, 'uri======>');
  try {
    const compressedVideo = await Compressor.Video.compress(
      uri,
      {
        //compressionMethod: 'manual',
        compressionMethod: 'auto', // Use auto compression method for better quality
        maxSize: 1920, // Max resolution to keep quality high
        quality: 'high', // Set quality to high
        bitrate: 2000000, // Set bitrate to 2Mbps
      },
      progress => {
        console.log(progress, 'progress====>');
      },
    );

    return compressedVideo;
  } catch (error) {
    console.error('Error compressing image:', error);
  }
};

export const getTimeAgo = date => {
  // Create dates in Asia/Kolkata timezone by adding 5 hours 30 minutes offset
  const now = new Date();
  const utcOffset = now.getTime() + now.getTimezoneOffset() * 60000; // Convert to UTC
  const indiaTime = new Date(utcOffset + 5.5 * 60 * 60000); // Add India offset (5.5 hours)

  // Convert post date to India time
  const postDate = new Date(date);
  const postIndiaTime = new Date(postDate.getTime());

  const diffTime = Math.abs(indiaTime - postIndiaTime);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  // Handle cases less than a day
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffMinutes < 120) return '1 hour ago';
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;

  // Handle longer time periods
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
