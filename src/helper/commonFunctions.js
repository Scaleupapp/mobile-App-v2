import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigationRef} from '../../App';
import {actions} from '../redux/reducers';
import reduxStore from '../redux/store';
import Routes from './routes';
import Compressor from 'react-native-compressor';
import moment from 'moment';
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

export const formatDateforchat = updatedAt => {
  const date = moment(updatedAt);
  const now = moment();

  if (date.isSame(now, 'day')) {
    // If the date is today, return time in 10:00 AM/PM format
    return date.format('h:mm A');
  } else if (date.isSame(now.clone().subtract(1, 'day'), 'day')) {
    // If the date is yesterday
    return 'Yesterday';
  } else {
    // Otherwise, return the full date
    return date.format('DD/MM/YYYY');
  }
};

export function formatAMPM(isoTimestamp) {
  const date = new Date(isoTimestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert 24-hour time to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Add leading zero to minutes if necessary
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesFormatted} ${ampm}`;
}

export function groupMessagesByDate(messages) {
  const groupedMessages = messages.reduce((acc, message) => {
    // Extract the date part from the 'createdAt' field
    const createdAt = message?.createdAt || message?.timestamp;
    const date = new Date(createdAt).toISOString().split('T')[0];

    // Initialize a new group if it doesn't exist
    if (!acc[date]) {
      acc[date] = [];
    }

    // Add the message to the corresponding date group
    acc[date].push(message);

    return acc;
  }, {});

  // Convert grouped messages into an array of objects for easier rendering
  return Object.entries(groupedMessages).map(([date, messages]) => ({
    date,
    messages,
  }));
}

export function checkDate(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Convert the string input to a Date object
  const date = new Date(dateStr);

  // Remove the time part for comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return moment(dateStr).format('DD/MM/YYYY'); // Return the original YYYY-MM-DD string
  }
}

export const checkIfTenMinutesPassed = timestamp => {
  const currentTime = new Date(); // Get current time
  const messageTime = new Date(timestamp); // Convert the given timestamp to Date

  // Calculate the difference in milliseconds
  const timeDifference = currentTime - messageTime;

  // Convert 10 minutes to milliseconds (10 * 60 * 1000)
  const tenMinutesInMs = 10 * 60 * 1000;

  // Check if the difference is greater than or equal to 10 minutes
  if (timeDifference >= tenMinutesInMs) {
    return true; // 10 minutes have passed
  } else {
    return false; // Less than 10 minutes
  }
};

export const isVersionLess = (v1, v2) => {
  const splitV1 = v1.split('.').map(Number);
  const splitV2 = v2.split('.').map(Number);
  const maxLength = Math.max(splitV1.length, splitV2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = splitV1[i] || 0; // Default to 0 if missing
    const num2 = splitV2[i] || 0; // Default to 0 if missing

    if (num1 < num2) return true; // v1 is less than v2
    if (num1 > num2) return false; // v1 is greater than v2
  }
  return false; // v1 and v2 are equal
};
