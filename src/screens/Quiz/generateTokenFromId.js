// utils/jwtUtils.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'scaleupkey'; // Replace with your actual JWT secret key

const generateTokenFromId = (userId) => {
  try {
    const token = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: '24h', // Token expires in 24 hours
    });
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateTokenFromId,
  verifyToken,
};