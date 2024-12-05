import axios from 'axios';
import {API} from './apiConstent';
import axiosInstance from './axiosinstance';

export const loginApi = (payload: any) => {
  return axiosInstance.post(API.SIGNIN, payload);
};

export const getOtp = (payload: any) => {
  return axiosInstance.post(API.AUTH_OTP, payload);
};

export const verifyOtp = (payload: any) => {
  return axiosInstance.post(API.OTP_VERIFY, payload);
};

export const registerApi = (payload: any) => {
  return axiosInstance.post(API.REGISTER, payload);
};

// export const changePassword = (payload: any) => {
//   return axiosInstance.post(API.CHANGE_PASSWORD, payload);
// };

export const otpPassword = (payload: any) => {
  return axiosInstance.post(API.OTP_PASSWORD, payload);
};

export const resetMyPassword = (payload: any) => {
  return axiosInstance.post(API.AUTH_RESET, payload);
};

export const getHomePageData = (payload: any) => {
  return axiosInstance.get(`${API.HOMEPAGE}?page=${payload}&pageSize=10`);
};

export const savePreferences = (payload: any) => {
  return axiosInstance.post(API.PREFERENCES, payload);
};
