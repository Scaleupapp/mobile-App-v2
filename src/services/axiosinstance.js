import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API} from './apiConstent';
import {logoutUser} from '../helper/commonFunctions';

const axiosInstance = axios.create({
  baseURL: API.BASE_URL,
});

export const setupAxiosInterceptors = showToast => {
  axiosInstance.interceptors.request.use(
    async config => {
      const user = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(user);
      if (parsedUser?.token) {
        config.headers.Authorization = `Bearer ${parsedUser?.token}`;
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    },
  );

  axiosInstance.interceptors.response.use(
    async config => {
      return config;
    },
    async error => {
      console.log(error, 'inaxiosss');
      if (
        error.response.status == 400 ||
        error.response.status == 429 ||
        error.response.status == 500
      ) {
        showToast({type: 'error', title: error?.response?.data?.message});
        console.log('error11', error?.response?.data?.message);
      }
      if (error.response.status == 422) {
        showToast({
          type: 'error',
          title: 'Somethig went wrong, Please try again.',
        });
        console.log('error22', 'Somethig went wrong, Please try again.');
      }
      if (error.response.status == 401) {
        showToast({type: 'error', title: error.response?.data?.message});
        console.log('error33', error.response?.data?.message);
        // setTimeout(() => {
        //   logoutUser();
        // }, 1000);
      }

      return Promise.reject(error);
    },
  );
};

export default axiosInstance;
