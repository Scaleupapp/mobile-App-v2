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


export const getPreferences = (payload: any) => {
  return axiosInstance.get(API.PREFERENCES, payload);
};

export const saveEducation = (payload: any) => {
  return axiosInstance.post(API.EDUCATION, payload);
};


export const getEducation = (payload: any) => {
  return axiosInstance.get(API.EDUCATION, payload);
};

export const saveWorkExperience = (payload: any) => {
  return axiosInstance.post(API.EXPERIENCE, payload);
};
export const getWorkExperience = (payload: any) => {
  return axiosInstance.get(API.EXPERIENCE, payload);
};

export const saveCertification = (payload: any) => {
  return axiosInstance.post(API.CERTIFICATION, payload);
};
export const getCertification = (payload: any) => {
  return axiosInstance.get(API.CERTIFICATION, payload);
};

export const saveProjects = (payload: any) => {
  return axiosInstance.post(API.PROJECTS, payload);
};

export const getProjects = (payload: any) => {
  return axiosInstance.get(API.PROJECTS, payload);
};



export const getProfile = (payload: any) => {
  return axiosInstance.get(API.PROFILE_DETAIL, payload);
};

export const updateProfile = (payload: any) => {
  return axiosInstance.put(API.PROFILE_DETAIL, payload);
};

