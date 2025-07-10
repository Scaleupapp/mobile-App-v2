import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API} from './apiConstent';

const axiosInstance = axios.create({
  // MODIFIED: I see your previous file used API.BASE_URL.
  // The QuizList file seems to use APIs from BASE_URL1.
  // Ensure you are using the correct one here. I'll use BASE_URL1 as an example.
  baseURL: API.BASE_URL,
});

export const setupAxiosInterceptors = showToast => {
  // Request interceptor (your code is perfect, no changes needed)
  axiosInstance.interceptors.request.use(
    async config => {
      const user = await AsyncStorage.getItem('userData');
      if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser?.token) {
          config.headers.Authorization = `Bearer ${parsedUser?.token}`;
        }
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    },
  );

  // Response interceptor (this part is updated with detailed logs)
  axiosInstance.interceptors.response.use(
    // ADDED: A handler for successful responses to see what's working
    response => {
      console.log(
        `✅ [API SUCCESS] ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {status: response.status},
      );
      return response;
    },
    // MODIFIED: Updated the error handler with detailed logs
    async error => {
      // ADDED: Detailed logging for all API errors
      if (error.response) {
        // This logs errors where the server actually responded
        console.error(
          `❌ [API ERROR] ${error.config.method?.toUpperCase()} ${
            error.config.url
          }`,
          {
            status: error.response.status,
            // THIS IS THE MOST IMPORTANT PART FOR DEBUGGING "VALIDATION FAILED"
            responseData: JSON.stringify(error.response.data, null, 2),
          },
        );
      } else if (error.request) {
        // This logs errors where the request was made but no response was received
        console.error(
          '❌ [NETWORK ERROR] No response received:',
          error.request,
        );
      } else {
        // This logs errors in setting up the request
        console.error('❌ [REQUEST SETUP ERROR]', error.message);
      }

      // --- YOUR EXISTING LOGIC IS PRESERVED BELOW ---
      if (error.response) {
        if (
          error.response.status === 400 ||
          error.response.status === 429 ||
          error.response.status === 500 ||
          error.response.status === 401 ||
          error.response.status === 403
        ) {
          showToast({type: 'error', title: error?.response?.data?.message});
        }
        if (error.response.status === 422) {
          // You can make this message more specific by using the server's response
          const errorMessage =
            error.response?.data?.message ||
            'Something went wrong, Please try again.';
          showToast({
            type: 'error',
            title: errorMessage,
          });
        }
        // Uncomment this if you want to automatically log out on 401 errors
        // if (error.response.status === 401) {
        //   setTimeout(() => {
        //     logoutUser();
        //   }, 1000);
        // }
      }

      return Promise.reject(error);
    },
  );
};

export default axiosInstance;
