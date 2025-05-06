import axios from 'axios';
import {API} from './apiConstent';
import axiosInstance from './axiosinstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const applyReferralCodeApi = (payload: {referralCode: string}) => {
  return axiosInstance.post(API.APPLY_REFERRAL_CODE, payload);
};

export const fetchUserQuizAttemptsApi = () => {
  return axiosInstance.get(API.USER_QUIZ_ATTEMPTS);
};

export const changePassword = (payload: any) => {
  return axiosInstance.post(API.CHANGE_PASSWORD, payload);
};

export const otpPassword = (payload: any) => {
  return axiosInstance.post(API.OTP_PASSWORD, payload);
};

export const resetMyPassword = (payload: any) => {
  return axiosInstance.post(API.AUTH_RESET, payload);
};

export const getHomePageData = (page: any, pageSize: any) => {
  return axiosInstance.get(`${API.HOMEPAGE}?page=${page}&pageSize=${pageSize}`);
};

export const getRecommendedContent = (page: any, pageSize: any) => {
  return axiosInstance.get(
    `${API.RECOMMEND}?page=${page}&pageSize=${pageSize}`,
  );
};

export const getvideoPageData = (payload: any) => {
  return axiosInstance.get(`${API.ALL_VIDEOS}?page=${payload}&pageSize=10`);
};

export const savePreferences = (payload: any) => {
  return axiosInstance.post(API.PREFERENCES, payload);
};

export const getPreferences = () => {
  return axiosInstance.get(API.PREFERENCES);
};

export const saveEducation = (payload: any) => {
  return axiosInstance.post(API.EDUCATION, payload);
};
export const getEducation = () => {
  return axiosInstance.get(API.EDUCATION);
};
export const deleteEducation = (id: any) => {
  return axiosInstance.delete(`${API.EDUCATION}/${id}`);
};

export const saveWorkExperience = (payload: any) => {
  return axiosInstance.post(API.EXPERIENCE, payload);
};
export const getWorkExperience = () => {
  return axiosInstance.get(API.EXPERIENCE);
};
export const deleteWorkExperience = (id: any) => {
  return axiosInstance.delete(`${API.EXPERIENCE}/${id}`);
};

export const saveCertification = (payload: any) => {
  return axiosInstance.post(API.CERTIFICATION, payload);
};
export const getCertification = () => {
  return axiosInstance.get(API.CERTIFICATION);
};
export const deleteCertification = (id: any) => {
  return axiosInstance.delete(`${API.CERTIFICATION}/${id}`);
};

export const saveProjects = (payload: any) => {
  return axiosInstance.post(API.PROJECTS, payload);
};
export const getProjects = () => {
  return axiosInstance.get(API.PROJECTS);
};
export const deleteProjects = (id: any) => {
  return axiosInstance.delete(`${API.PROJECTS}/${id}`);
};

export const getProfile = (payload: any) => {
  return axiosInstance.get(`${API.PROFILE_DETAIL}/${payload}`);
};
export const getProfiledetails = (id: any, page: any) => {
  return axiosInstance.get(
    `${API.PROFILE_CONTENT}/${id}?page=${page}&pageSize=10`,
  );
};

export const updateProfile = (payload: any) => {
  return axiosInstance.put(API.PROFILE_DETAIL, payload);
};

//post
export const likePostApi = (postId: any) => {
  return axiosInstance.put(`${API.LIKEPOST}/${postId}`);
};

export const unlikePostApi = (postId: any) => {
  return axiosInstance.put(`${API.UNLIKEPOST}/${postId}`);
};

export const savePostAPI = (postId: any) => {
  return axiosInstance.put(`${API.SAVE}/${postId}`);
};
export const unsavePostAPI = (postId: any) => {
  return axiosInstance.put(`${API.UNSAVE}/${postId}`);
};
export const getSavedPostsAPI = () => {
  return axiosInstance.get(`${API.BASE_URL}content/saved-content`);
};

export const getNotificationAPI = () => {
  return axiosInstance.get(`${API.NOTIFICATION}`);
};

export const markReadNotificationAPI = (payload: any) => {
  return axiosInstance.post(`${API.MARK_READ}`, payload);
};

export const myInnerCirclesentAPI = (page: any) => {
  return axiosInstance.get(`${API.INNERCIRCLE}?page=${page}`);
};
export const myInnerCirclerecievedAPI = (page: any) => {
  return axiosInstance.get(`${API.INNERCIRCLERECIVED}?page=${page}`);
};

export const myInnerCircleAPI = (page: any) => {
  return axiosInstance.get(`${API.GETINNERCIRCLE}?page=${page}`);
};

export const acceptInnerCircleRequestAPI = (payload: any) => {
  return axiosInstance.post(`${API.ACCEPTREQ}`, payload);
};
export const widrawInnerCircleRequestAPI = (payload: any) => {
  return axiosInstance.post(`${API.WIDRAW}`, payload);
};

export const declineInnerCircleRequestAPI = (payload: any) => {
  return axiosInstance.post(`${API.REMOVEREQ}`, payload);
};

export const addComment = (payload: any) => {
  return axiosInstance.post(`${API.ADD_COMMENT}`, payload);
};

export const getComment = (payload: any, page: any) => {
  return axiosInstance.post(`content/comment?page=${page}`, payload);
};
export const replyComment = (payload: any) => {
  return axiosInstance.post(`${API.COMMENT}/reply`, payload);
};
export const likeComment = (id: any) => {
  return axiosInstance.post(`${API.COMMENT}/like/${id}`);
};
export const unlikeComment = (id: any) => {
  return axiosInstance.post(`${API.COMMENT}/unlike/${id}`);
};

export const getFollowerlist = (id: any, page: any) => {
  return axiosInstance.get(`${API.FOLLOWERS_LIST}/${id}?page=${page}`);
};

export const getFollowinglist = (id: any, page: any) => {
  return axiosInstance.get(`${API.FOLLOWING_LIST}/${id}?page=${page}`);
};

export const followUser = (payload: any) => {
  return axiosInstance.post(`${API.FOLLOW_USER}/${payload}`);
};
export const unlfollowUser = (payload: any) => {
  return axiosInstance.delete(`${API.UNFOLLOW}/${payload}`);
};
export const globalSearch = (payload: any) => {
  return axiosInstance.post(`${API.SEARCH_USER}`, payload);
};

export const deleteAccont = (payload: any) => {
  return axiosInstance.post(`${API.DELETE_ACCOUNT}`, payload);
};
export const blockUSerList = () => {
  return axiosInstance.get(`${API.BLOCK_USER_LIST}`);
};
export const bockUser = (id: any) => {
  return axiosInstance.post(`${API.USER_BLOCK}/${id}`);
};
export const userUnBlock = (id: any) => {
  return axiosInstance.post(`${API.USER_UNBLOCK}/${id}`);
};

export const sendInnerCircle = (payload: any) => {
  return axiosInstance.post(`${API.SENDINNERREQUEST}`, payload);
};

export const ReportPost = (id: any, payload: any) => {
  return axiosInstance.post(`${API.REPORTPOST}/${id}`, payload);
};

export const SaveFcm = (payload: any) => {
  return axiosInstance.post(`${API.SAVE_FCM}`, payload);
};
export const UserAnalytics = () => {
  return axiosInstance.get(`${API.USERANALYTICS}`);
};

export const getconversation = (page: any) => {
  return axiosInstance.get(`${API.CONVERSATION}?page=${page}`);
};

export const createConversation = (payload: any) => {
  return axiosInstance.post(`${API.CREATECONVERSATION}`, payload);
};

export const getconversationbyID = (id: any, page: any) => {
  return axiosInstance.get(`${API.CHAT}/${id}?page=${page}`);
};
export const sendChat = (payload: any) => {
  return axiosInstance.post(`${API.SENDMESSAGE}`, payload);
};
export const sendChatReply = (payload: any) => {
  return axiosInstance.post(`${API.CHAT}/reply`, payload);
};

export const editChatMessage = (convid: any, messageid: any, payload: any) => {
  return axiosInstance.put(
    `${API.CHAT}/${convid}/messages/${messageid}/edit`,
    payload,
  );
};
export const reactChatMessage = (convid: any, messageid: any, payload: any) => {
  return axiosInstance.post(
    `${API.CHAT}/${convid}/${messageid}/reactions`,
    payload,
  );
};
export const deleteChatMessage = (convid: any, messageid: any) => {
  return axiosInstance.delete(
    `${API.CHAT}/${convid}/messages/${messageid}/delete`,
  );
};

export const deletemultipleChatMessage = (convid: any, payload: any) => {
  console.log("🚀 ~ deletemultipleChatMessage ~ payload:", payload)
  
  return axiosInstance.post(
    `${API.CHAT}/${convid}/messages/delete-for-me`, payload
  );
};

// export const deletemultipleChatMessage = async (convid: any, payload: any) => {
//   try {
//     const user = await AsyncStorage.getItem('userData');
//     const parsedUser = JSON.parse(user);
//     const response = await axios.delete(`https://api.scaleupapp.club/api/${API.CHAT}/${convid}/messages/delete-for-me`, {
//       data:{payload}, // Payload for DELETE request
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${parsedUser?.token}`,
//       },
//     });

//     console.log('Message deleted:', response.data);
//   } catch (error) {
//     console.error('Error deleting message:', error.response?.data || error);
//   }
// };

export const markReadAPI = (payload: any) => {
  return axiosInstance.post(`${API.CHAT}/mark-read`, payload);
};

// Create a new quiz event (Admin)
export const createQuizEventApi = (payload: any) => {
  return axiosInstance.post(API.RAPIDFIRE_CREATE, payload);
};

// Edit an existing quiz event (Admin)
export const editQuizEventApi = (payload: any) => {
  return axiosInstance.put(API.RAPIDFIRE_EDIT, payload);
};

// List all upcoming quiz events
export const listAllQuizEventsApi = (
  page: number = 1,
  pageSize: number = 10,
  includeCompleted = false
) => {
  return axiosInstance.get(
    `${API.RAPIDFIRE_LIST}?page=${page}&pageSize=${pageSize}&includeCompleted=${includeCompleted}`,
  );
};

// Search quiz events
export const searchQuizEventsApi = (query: string) => {
  return axiosInstance.get(
    `${API.RAPIDFIRE_SEARCH}?query=${encodeURIComponent(query)}`,
  );
};

// Recommend quiz events
export const recommendQuizEventsApi = () => {
  return axiosInstance.get(API.RAPIDFIRE_RECOMMEND);
};

// Register for a quiz event
export const registerForQuizApi = (quizId: string) => {
  return axiosInstance.post(`rapidfire-quiz/${quizId}/register`);
};

export const fetchUserRegisteredQuizzesApi = () => {
  return axiosInstance.get('rapidfire-quiz/user-registered');
};

// Start a quiz attempt for a user
export const startQuizAttemptApi = (quizId: string) => {
  return axiosInstance.post(`rapidfire-quiz/${quizId}/start`);
};

// Get the next unanswered question for an attempt
export const getNextQuestionApi = (attemptId: string) => {
  return axiosInstance.get(`rapidfire-quiz/attempt/${attemptId}/next-question`);
};

// Submit an answer for a specific quiz attempt
export const submitAnswerApi = (
  quizId: string,
  attemptId: string,
  payload: any,
) => {
  return axiosInstance.post(
    `rapidfire-quiz/${quizId}/attempt/${attemptId}/answer`,
    payload,
  );
};

// Get current leaderboard and user's ranking for a quiz
export const getUserRankingApi = (quizId: string) => {
  return axiosInstance.get(`rapidfire-quiz/${quizId}/ranking`);
};

// Get detailed results for a user's quiz attempt
export const getDetailedResultsApi = (quizId: string, attemptId: string) => {
  return axiosInstance.get(
    `rapidfire-quiz/${quizId}/attempt/${attemptId}/results`,
  );
};

// Get the latest attempt ID for a specific quiz
export const getLatestQuizAttemptIdApi = (quizId: string) => {
  return axiosInstance.get(`rapidfire-quiz/${quizId}/latest-attempt`);
};

export const getReferralDetailsApi = () => {
  return axiosInstance.get(API.GET_REFERRAL_CODE);
};

export const deleteContent = (contentId: any) => {
  return axiosInstance.delete(`content/delete/${contentId}`);
};

export const deleteStory = (payload: any) => {
  return axiosInstance.delete(`stories`, payload);
};


export const clearChat = (id: any) => {
  return axiosInstance.delete(`${API.CHAT}/${id}/messages/clear-chat`);
};
// study groups
export const getStudyGroups = () => {
  return axiosInstance.get(`${API.CHAT}/`);
};

export const getStudyGroupMsg = (groupId: any, page: any) => {
  return axiosInstance.get(
    `${API.CHAT}/group/${groupId}/messages?page=${page}`,
  );
};

export const deleteStudyGroup = (groupId: any) => {
  return axiosInstance.delete(`${API.CHAT}/group/${groupId}`);
};

export const deleteGroupMsg = (groupId: any, messageid: any) => {
  return axiosInstance.delete(
    `${API.CHAT}/${groupId}/group/${messageid}/delete`,
  );
};

export const editGroupMsg = (groupId: any, messageid: any, payload: any) => {
  return axiosInstance.put(
    `${API.CHAT}/${groupId}/group/${messageid}/edit`,
    payload,
  );
};

export const reactGroupMsg = (groupId: any, messageid: any, payload: any) => {
  return axiosInstance.post(
    `${API.CHAT}/group/${groupId}/messages/${messageid}/reactions`,
    payload,
  );
};

export const markReadGrpMsg = (payload: any) => {
  return axiosInstance.post(`${API.CHAT}/group/mark-read`, payload);
};

export const leaveStudyGroup = (groupId: any) => {
  return axiosInstance.post(`${API.CHAT}/group/${groupId}/leave`);
};


export const getGrouprequest = (groupId: any) => {
  return axiosInstance.get(`${API.CHAT}/group/all-requests`);
};


export const acceptgroupRequest = (payload: any) => {
  return axiosInstance.post(`${API.CHAT}/group/handle-requests`,payload);
};

export const getActiveQuiz = (groupId: any) => {
  return axiosInstance.get(`rapidfire-quiz/unattempted-live`);
};




