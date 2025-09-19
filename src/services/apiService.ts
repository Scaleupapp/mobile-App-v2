//src/services/apiService.ts
import axios from 'axios';
import {API} from './apiConstent';
import axiosInstance from './axiosinstance';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginApi = (payload: any) => {
  return axiosInstance.post(API.SIGNIN, payload);
};

// Add these new API functions to your apiService.ts file

export const checkUserPaymentDetailsApi = () => {
  return axiosInstance.get(API.USER_PAYMENT_DETAILS_CHECK);
};

export const getContentWithPremiumCheck = async (contentId: string) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axiosInstance.get(`${API.CONTENT_ACCESS}/${contentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const saveUserUpiDetailsApi = (upiId: string) => {
  return axiosInstance.post(API.SAVE_UPI_DETAILS, { upiId });
};

export const saveUserBankDetailsApi = (bankDetails: any) => {
  return axiosInstance.post(API.SAVE_BANK_DETAILS, bankDetails);
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

export const fetchUserRegisteredQuizzesApi = async () => {
  try {
    const response = await axiosInstance.get('rapidfire-quiz/user-registered');
    console.log('Raw registered quizzes response:', response.data);
    
    // Ensure consistent format
    if (response.data && response.data.registeredQuizIds) {
      const formattedIds = response.data.registeredQuizIds.map((id: any) => {
        if (typeof id === 'string') {
          return id;
        } else if (id && (id.id || id._id)) {
          return (id.id || id._id).toString();
        }
        return null;
      }).filter((id: string | null) => id !== null);
      
      return {
        ...response,
        data: {
          ...response.data,
          registeredQuizIds: formattedIds
        }
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching registered quizzes:', error);
    throw error;
  }
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

export const submitApprating = (payload: any) => {
  return axiosInstance.post(`users/feedback-rating`,payload);
};

export const submitAppfeedback = (payload: any) => {
  return axiosInstance.post(`users/feedback-comment`,payload);
};

export const submitQuizfeedback = (payload: any) => {
  return axiosInstance.post(`rapidfire-quiz/feedback`,payload);
};

export const submitquery = (payload: any) => {
  return axiosInstance.post(`users/save-query`,payload);
};

export const submitQuizinterest = (payload: any) => {
  return axiosInstance.post(`users/set-quiz-creation-intrest-status`,payload);
};

// ==========================================
// USER QUIZ - CREATION AND MANAGEMENT
// ==========================================

// Create a new quiz (draft)
export const createUserQuizApi = (payload: any) => {
  return axiosInstance.post(API.USER_QUIZ_CREATE, payload);
};

// Update a draft quiz
export const updateQuizDraftApi = (quizId: string, payload: any) => {
  return axiosInstance.put(API.USER_QUIZ_UPDATE_DRAFT.replace(':id', quizId), payload);
};

// Submit quiz for review
export const submitQuizForReviewApi = (quizId: string) => {
  return axiosInstance.post(API.USER_QUIZ_SUBMIT.replace(':id', quizId));
};

// Get user's drafts
export const getMyDraftsApi = (page: number = 1, limit: number = 10) => {
  return axiosInstance.get(`${API.USER_QUIZ_DRAFTS}?page=${page}&limit=${limit}`);
};

// Delete a draft
export const deleteQuizDraftApi = (quizId: string) => {
  return axiosInstance.delete(API.USER_QUIZ_DELETE_DRAFT.replace(':id', quizId));
};

// Get public quizzes
export const getPublicQuizzesApi = (params: {
  page?: number;
  limit?: number;
  topics?: string;
  difficulty?: string;
  sortBy?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.USER_QUIZ_PUBLIC}?${queryString}`);
};

// Search quizzes
export const searchUserQuizzesApi = (query: string, page: number = 1, limit: number = 20) => {
  return axiosInstance.get(`${API.USER_QUIZ_SEARCH}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};

// Get quiz by share ID
export const getQuizByShareIdApi = (shareId: string) => {
  return axiosInstance.get(API.USER_QUIZ_BY_SHARE_ID.replace(':shareId', shareId));
};

// Get quiz details by ID (for editing)
export const getQuizByIdApi = (quizId: string) => {
  return axiosInstance.get(API.USER_QUIZ_BY_ID.replace(':id', quizId));
};

// Delete quiz
export const deleteUserQuizApi = (quizId: string) => {
  return axiosInstance.delete(API.USER_QUIZ_DELETE.replace(':id', quizId));
};

// ==========================================
// AI QUESTION GENERATION
// ==========================================

// Generate questions using AI
export const generateAIQuestionsApi = (payload: {
  quizId: string;
  topic: string;
  difficulty: string;
  count: number;
  additionalContext?: string;
}) => {
  return axiosInstance.post(API.USER_QUIZ_AI_GENERATE, payload);
};

// Calculate price for AI questions
export const calculateAIPriceApi = (quizId: string, count: number) => {
  return axiosInstance.post(API.USER_QUIZ_AI_PRICE, { quizId, count });
};

// Get AI usage statistics
export const getAIUsageApi = (period: 'today' | 'week' | 'month' | 'all' = 'month') => {
  return axiosInstance.get(`${API.USER_QUIZ_AI_USAGE}?period=${period}`);
};

// Get AI transaction history
export const getAITransactionsApi = (params: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.USER_QUIZ_AI_TRANSACTIONS}?${queryString}`);
};

// Initiate AI payment
export const initiateAIPaymentApi = (transactionId: string) => {
  return axiosInstance.post(API.USER_QUIZ_AI_PAYMENT_INIT, { transactionId });
};

// Verify AI payment
export const verifyAIPaymentApi = (payload: {
  transactionId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  return axiosInstance.post(API.USER_QUIZ_AI_PAYMENT_VERIFY, payload);
};

// Request refund
export const requestAIRefundApi = (transactionId: string, reason: string) => {
  return axiosInstance.post(
    API.USER_QUIZ_AI_REFUND.replace(':transactionId', transactionId),
    { reason }
  );
};

// ==========================================
// CREATOR DASHBOARD
// ==========================================

// Get dashboard overview
export const getCreatorDashboardApi = () => {
  return axiosInstance.get(API.USER_QUIZ_DASHBOARD);
};

// Get detailed stats
export const getCreatorStatsApi = (period: 'week' | 'month' | 'year' | 'all' = 'month') => {
  return axiosInstance.get(`${API.USER_QUIZ_STATS}?period=${period}`);
};

// Get my quizzes
export const getMyQuizzesApi = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return axiosInstance.get(`${API.USER_QUIZ_MY_QUIZZES}${queryString ? '?' + queryString : ''}`);
};

// Get quiz analytics
export const getQuizAnalyticsApi = (quizId: string, period: 'hour' | 'day' | 'week' | 'all' = 'all') => {
  return axiosInstance.get(
    `${API.USER_QUIZ_ANALYTICS.replace(':id', quizId)}?period=${period}`
  );
};

// Get quiz participants
export const getQuizParticipantsApi = (
  quizId: string,
  status: string = 'all',
  page: number = 1,
  limit: number = 50
) => {
  return axiosInstance.get(
    `${API.USER_QUIZ_PARTICIPANTS.replace(':id', quizId)}?status=${status}&page=${page}&limit=${limit}`
  );
};

// Get creator badges
export const getCreatorBadgesApi = () => {
  return axiosInstance.get(API.USER_QUIZ_BADGES);
};

// Get earnings
export const getCreatorEarningsApi = (period: 'week' | 'month' | 'year' | 'all' = 'all') => {
  return axiosInstance.get(`${API.USER_QUIZ_EARNINGS}?period=${period}`);
};

// Get creator leaderboard
export const getCreatorLeaderboardApi = (
  period: 'week' | 'month' | 'all' = 'month',
  page: number = 1,
  limit: number = 20
) => {
  return axiosInstance.get(
    `${API.USER_QUIZ_CREATOR_LEADERBOARD}?period=${period}&page=${page}&limit=${limit}`
  );
};

// ==========================================
// ACCESS CONTROL
// ==========================================

// Request access to private quiz
export const requestQuizAccessApi = (quizId: string, message?: string) => {
  return axiosInstance.post(
    API.USER_QUIZ_ACCESS_REQUEST.replace(':quizId', quizId),
    { message }
  );
};

// Get my access requests
export const getMyAccessRequestsApi = (
  status: string = 'all',
  page: number = 1,
  limit: number = 20
) => {
  return axiosInstance.get(
    `${API.USER_QUIZ_ACCESS_MY_REQUESTS}?status=${status}&page=${page}&limit=${limit}`
  );
};

// Get access requests for a quiz (creator)
export const getQuizAccessRequestsApi = (
  quizId: string,
  status: string = 'pending',
  page: number = 1,
  limit: number = 50
) => {
  return axiosInstance.get(
    `${API.USER_QUIZ_ACCESS_QUIZ_REQUESTS.replace(':quizId', quizId)}?status=${status}&page=${page}&limit=${limit}`
  );
};

// Approve access request
export const approveAccessRequestApi = (requestId: string, note?: string) => {
  return axiosInstance.post(
    API.USER_QUIZ_ACCESS_APPROVE.replace(':id', requestId),
    { note }
  );
};

// Reject access request
export const rejectAccessRequestApi = (requestId: string, reason?: string) => {
  return axiosInstance.post(
    API.USER_QUIZ_ACCESS_REJECT.replace(':id', requestId),
    { reason }
  );
};

// Bulk approve requests
export const bulkApproveRequestsApi = (requestIds: string[], note?: string) => {
  return axiosInstance.post(API.USER_QUIZ_ACCESS_BULK_APPROVE, { requestIds, note });
};

// Bulk reject requests
export const bulkRejectRequestsApi = (requestIds: string[], reason?: string) => {
  return axiosInstance.post(API.USER_QUIZ_ACCESS_BULK_REJECT, { requestIds, reason });
};

// ==========================================
// SHARING
// ==========================================

// Generate QR code
export const generateQuizQRCodeApi = (quizId: string, url: string, size: number = 300) => {
  return axiosInstance.post(
    `${API.USER_QUIZ_SHARE_QR.replace(':id', quizId)}?size=${size}`,
    { url }
  );
};

// Track share
export const trackQuizShareApi = (quizId: string, platform: string, metadata?: any) => {
  return axiosInstance.post(
    API.USER_QUIZ_SHARE_TRACK.replace(':id', quizId),
    { platform, metadata }
  );
};

// Get share stats
export const getQuizShareStatsApi = (quizId: string, period: string = 'all') => {
  return axiosInstance.get(
    `${API.USER_QUIZ_SHARE_STATS.replace(':id', quizId)}?period=${period}`
  );
};

// Get creator share analytics
export const getCreatorShareAnalyticsApi = () => {
  return axiosInstance.get(API.USER_QUIZ_SHARE_ANALYTICS);
};

// ==========================================
// ADMIN REVIEW (if needed for admin panel)
// ==========================================

// Get pending reviews
export const getPendingReviewsApi = (params: {
  page?: number;
  limit?: number;
  priority?: string;
  sortBy?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.USER_QUIZ_REVIEW_PENDING}?${queryString}`);
};

// Get review details
export const getReviewDetailsApi = (quizId: string) => {
  return axiosInstance.get(API.USER_QUIZ_REVIEW_DETAILS.replace(':id', quizId));
};

// Approve quiz (admin)
export const approveQuizReviewApi = (quizId: string, note?: string) => {
  return axiosInstance.post(
    API.USER_QUIZ_REVIEW_APPROVE.replace(':id', quizId),
    { note }
  );
};

// Reject quiz (admin)
export const rejectQuizReviewApi = (quizId: string, reason: string, issues?: string[]) => {
  return axiosInstance.post(
    API.USER_QUIZ_REVIEW_REJECT.replace(':id', quizId),
    { reason, issues }
  );
};

// Trigger AI review
export const triggerAIReviewApi = (quizId: string) => {
  return axiosInstance.post(API.USER_QUIZ_REVIEW_AI_TRIGGER.replace(':id', quizId));
};

// Get review stats
export const getReviewStatsApi = () => {
  return axiosInstance.get(API.USER_QUIZ_REVIEW_STATS);
};

// ==========================================
// LEARNING ASSISTANT - EXPLANATION SYSTEM
// ==========================================

// Get AI explanation for a quiz answer
export const explainAnswerApi = (payload: {
  questionId: string;
  userAnswer: string;
  attemptId?: string;
}) => {
  return axiosInstance.post(API.EXPLAIN_ANSWER, payload);
};

// Get user's explanation quota status
export const getExplanationQuotaApi = () => {
  return axiosInstance.get(API.EXPLANATION_QUOTA);
};

// Purchase explanation bundle
export const purchaseExplanationsApi = (payload: {
  bundleSize: 10 | 30 | 50;
  paymentId: string;
}) => {
  return axiosInstance.post(API.PURCHASE_EXPLANATIONS, payload);
};

// ==========================================
// LEARNING ASSISTANT - LEARNING VAULT
// ==========================================

// Get saved explanations with filters
export const getLearningVaultApi = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  topics?: string;
  favorites?: boolean;
  sortBy?: 'createdAt' | 'viewCount' | 'questionText';
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.LEARNING_VAULT}?${queryString}`);
};

// Toggle favorite status
export const toggleFavoriteExplanationApi = (explanationId: string) => {
  return axiosInstance.post(
    API.LEARNING_VAULT_FAVORITE.replace(':explanationId', explanationId)
  );
};

// Add/Update note on explanation
export const addExplanationNoteApi = (explanationId: string, note: string) => {
  return axiosInstance.post(
    API.LEARNING_VAULT_NOTE.replace(':explanationId', explanationId),
    { note }
  );
};

// Download learning vault as PDF
export const downloadLearningVaultApi = () => {
  return axiosInstance.get(API.LEARNING_VAULT_DOWNLOAD, {
    responseType: 'blob'
  });
};

// ==========================================
// LEARNING ASSISTANT - AREA INSIGHTS
// ==========================================

// Get area of improvement insights
export const getAreaInsightsApi = (params?: {
  page?: number;
  limit?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.AREA_INSIGHTS}?${queryString}`);
};

// Get detailed insight for specific topic
export const getDetailedInsightApi = (topic: string) => {
  return axiosInstance.get(
    API.AREA_INSIGHTS_DETAIL.replace(':topic', encodeURIComponent(topic))
  );
};

// Purchase detailed insights
export const purchaseDetailedInsightApi = (payload: {
  topics: string[];
  paymentId: string;
}) => {
  return axiosInstance.post(API.AREA_INSIGHTS_PURCHASE, payload);
};

// Set learning goal for a topic
export const setLearningGoalApi = (
  topic: string,
  payload: {
    targetDate: string;
    targetErrorRate: number;
  }
) => {
  return axiosInstance.post(
    API.AREA_INSIGHTS_SET_GOAL.replace(':topic', encodeURIComponent(topic)),
    payload
  );
};

// ==========================================
// LEARNING ASSISTANT - ANALYTICS & PAYMENT
// ==========================================

// Get overall learning analytics
export const getLearningAnalyticsApi = () => {
  return axiosInstance.get(API.LEARNING_ANALYTICS);
};

// Create Razorpay order for explanation bundles
export const createExplanationOrderApi = (payload: {
  bundleSize: 10 | 30 | 50;
  amount: number;
}) => {
  return axiosInstance.post(API.LEARNING_CREATE_ORDER, payload);
};

// Verify Razorpay payment
export const verifyExplanationPaymentApi = (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bundleSize: 10 | 30 | 50;
  amount: number;
}) => {
  return axiosInstance.post(API.LEARNING_VERIFY_PAYMENT, payload);
};

// ==========================================
// FLASHCARD API FUNCTIONS
// ==========================================

// DECK MANAGEMENT
export const createFlashcardDeckApi = (payload: {
  title: string;
  description?: string;
  subject: string;
  subjectDetails?: any;
  tags?: string[];
  isPublic?: boolean;
  originalDeckId?: string; // NEW: for copying decks
}) => {
  return axiosInstance.post(API.FLASHCARD_DECK_CREATE, payload);
};

export const getUserFlashcardDecksApi = (params?: {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.FLASHCARD_DECKS}?${queryString}`);
};

export const getFlashcardDeckDetailsApi = (deckId: string, params?: {
  page?: number;
  limit?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.FLASHCARD_DECK_DETAILS.replace(':deckId', deckId)}?${queryString}`
  );
};

export const updateFlashcardDeckApi = (deckId: string, payload: any) => {
  return axiosInstance.put(
    API.FLASHCARD_DECK_UPDATE.replace(':deckId', deckId),
    payload
  );
};

export const deleteFlashcardDeckApi = (deckId: string) => {
  return axiosInstance.delete(
    API.FLASHCARD_DECK_DELETE.replace(':deckId', deckId)
  );
};

// DOCUMENT PROCESSING
export const uploadFlashcardDocumentApi = (formData: FormData) => {
  return axiosInstance.post(API.FLASHCARD_UPLOAD_DOCUMENT, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getFlashcardProcessingStatusApi = (processingId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_PROCESSING_STATUS.replace(':processingId', processingId)
  );
};

// ==========================================
// ENHANCED STUDY SESSIONS - Priority 1
// ==========================================

// NEW: Enhanced study session with planning data
export const startFlashcardStudySessionApi = (
  deckId: string,
  params?: {
    sessionType?: 'new' | 'review' | 'mixed';
    cardCount?: number;
    timeLimit?: number;
    includePlanning?: boolean;
  }
) => {
  const enhancedParams = {
    ...params,
    includePlanning: 'true', // Always include planning data for Priority 1
  };
  
  const queryString = new URLSearchParams(enhancedParams as any).toString();
  return axiosInstance.get(
    `${API.FLASHCARD_STUDY_START.replace(':deckId', deckId)}?${queryString}`
  );
};

// NEW: Enhanced answer submission with detailed feedback
export const submitFlashcardAnswerApi = (
  cardId: string,
  payload: {
    wasCorrect: boolean;
    responseTime?: number;
    difficulty?: string;
    userAnswer?: string; // NEW: Track user's actual answer
  }
) => {
  return axiosInstance.post(
    API.FLASHCARD_STUDY_ANSWER.replace(':cardId', cardId),
    payload
  );
};

// NEW: Get due cards count for session planning
export const getDueCardsCountApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_DUE_CARDS.replace(':deckId', deckId)
  );
};

// Enhanced study stats with real-time data
export const getFlashcardStudyStatsApi = (
  deckId: string,
  timeframe?: string
) => {
  return axiosInstance.get(
    `${API.FLASHCARD_STUDY_STATS.replace(':deckId', deckId)}?timeframe=${timeframe || '7d'}`
  );
};

// NEW: Study session summary for planning
export const getStudySessionSummaryApi = (deckId: string) => {
  return axiosInstance.get(
    `${API.FLASHCARD_STUDY_STATS.replace(':deckId', deckId)}?summary=true`
  );
};

// NEW: Get user progress for a specific deck
export const getUserProgressApi = (deckId: string) => {
  return axiosInstance.get(
    `flashcards/progress/${deckId}`
  );
};

// NEW: Get mastery statistics
export const getMasteryStatsApi = (deckId: string) => {
  return axiosInstance.get(
    `flashcards/mastery/${deckId}`
  );
};

// ==========================================
// CARD MANAGEMENT
// ==========================================

export const updateFlashcardApi = (cardId: string, payload: any) => {
  return axiosInstance.put(
    API.FLASHCARD_CARD_UPDATE.replace(':cardId', cardId),
    payload
  );
};

export const deleteFlashcardApi = (cardId: string) => {
  return axiosInstance.delete(
    API.FLASHCARD_CARD_DELETE.replace(':cardId', cardId)
  );
};

export const createFlashcardApi = (payload: {
  deckId: string;
  question: string;
  answer: string;
  explanation?: string;
  hints?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  cardType?: 'text' | 'multiple_choice' | 'true_false';
}) => {
  return axiosInstance.post(API.FLASHCARD_CARDS, payload);
};

// ==========================================
// PUBLIC DECKS
// ==========================================

export const getPublicFlashcardDecksApi = (params?: {
  subject?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.FLASHCARD_PUBLIC_DECKS}?${queryString}`);
};

export const getPopularFlashcardSubjectsApi = () => {
  return axiosInstance.get(API.FLASHCARD_PUBLIC_SUBJECTS);
};

export const getTrendingFlashcardDecksApi = () => {
  return axiosInstance.get(API.FLASHCARD_PUBLIC_TRENDING);
};

export const searchFlashcardDecksApi = (params: {
  query: string;
  subject?: string;
  difficulty?: string;
  minCards?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.FLASHCARD_PUBLIC_SEARCH}?${queryString}`);
};

export const getFlashcardDeckPreviewApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_PUBLIC_PREVIEW.replace(':deckId', deckId)
  );
};

// ==========================================
// CRAM MODE
// ==========================================

export const generateFlashcardCramSessionApi = (
  deckId: string,
  params?: {
    timeUntilExam?: string;
    focusArea?: string;
    confidenceMode?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.FLASHCARD_CRAM_SESSION.replace(':deckId', deckId)}?${queryString}`
  );
};

export const getFlashcardCramRecommendationsApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_CRAM_RECOMMENDATIONS.replace(':deckId', deckId)
  );
};

// ==========================================
// SUMMARIES & AI FEATURES
// ==========================================

export const generateFlashcardStudySummaryApi = (deckId: string) => {
  return axiosInstance.post(
    API.FLASHCARD_SUMMARY_GENERATE.replace(':deckId', deckId)
  );
};

export const getFlashcardQuickReviewApi = (
  deckId: string,
  timeAvailable?: number
) => {
  return axiosInstance.get(
    `${API.FLASHCARD_SUMMARY_QUICK_REVIEW.replace(':deckId', deckId)}?timeAvailable=${timeAvailable || 15}`
  );
};

export const getFlashcardFormulaSheetApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_SUMMARY_FORMULA_SHEET.replace(':deckId', deckId)
  );
};

export const getFlashcardComprehensiveSummaryApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_SUMMARY_COMPREHENSIVE.replace(':deckId', deckId)
  );
};

// ==========================================
// EXPORT
// ==========================================

export const exportFlashcardDeckApi = (deckId: string) => {
  return axiosInstance.get(
    API.FLASHCARD_DECK_EXPORT.replace(':deckId', deckId)
  );
};

// ==========================================
// AI STUDY BUDDY - CORE CONVERSATION
// ==========================================

// Initialize new study session
export const aiStudyBuddyInitSessionApi = (payload: {
  subject: string;
  syllabus: string;
  grade?: string;
  initialQuery?: string;
  learningGoals?: string[];
}) => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_SESSION_INIT, payload);
};

// Send message in session
export const aiStudyBuddySendMessageApi = (sessionId: string, payload: {
  message: string;
  sessionId?:any;
  attachments?: Array<{
    type: 'image' | 'code' | 'formula' | 'diagram' | 'file';
    url?: string;
    filename?: string;
    metadata?: any;
   
  }>;
}) => {
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_SEND_MESSAGE.replace(':sessionId', sessionId),
    payload
  );
};

// Get conversation history
export const aiStudyBuddyGetHistoryApi = (
  sessionId: string,
  params?: {
    page?: number;
    limit?: number;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.AI_STUDY_BUDDY_GET_HISTORY.replace(':sessionId', sessionId)}${queryString ? '?' + queryString : ''}`
  );
};

// ==========================================
// AI STUDY BUDDY - SESSION MANAGEMENT
// ==========================================

// Get user's active sessions
export const aiStudyBuddyGetActiveSessionsApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_ACTIVE_SESSIONS);
};

// Get session history with filters
export const aiStudyBuddyGetSessionHistoryApi = (params?: {
  page?: number;
  limit?: number;
  subject?: string;
  status?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_SESSION_HISTORY}${queryString ? '?' + queryString : ''}`);
};

// Get specific session details
export const aiStudyBuddyGetSessionDetailsApi = (sessionId: string) => {
  return axiosInstance.get(
    API.AI_STUDY_BUDDY_SESSION_DETAILS.replace(':sessionId', sessionId)
  );
};

// Update session (pause, resume, complete, etc.)
export const aiStudyBuddyUpdateSessionApi = (sessionId: string, payload: {
  action: 'pause' | 'resume' | 'complete' | 'archive' | 'update_goals' | 'add_tags';
  metadata?: {
    learningGoals?: string[];
    tags?: string[];
  };
}) => {
  return axiosInstance.patch(
    API.AI_STUDY_BUDDY_UPDATE_SESSION.replace(':sessionId', sessionId),
    payload
  );
};

// Delete session
export const aiStudyBuddyDeleteSessionApi = (sessionId: string, permanent: boolean = false) => {
  return axiosInstance.delete(
    `${API.AI_STUDY_BUDDY_DELETE_SESSION.replace(':sessionId', sessionId)}${permanent ? '?permanent=true' : ''}`
  );
};

// Get user analytics
export const aiStudyBuddyGetAnalyticsApi = (timeframe: '7d' | '30d' | '90d' | '1y' = '30d') => {
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_USER_ANALYTICS}?timeframe=${timeframe}`);
};

// Get bookmarked messages
export const aiStudyBuddyGetBookmarksApi = (params?: {
  page?: number;
  limit?: number;
  subject?: string;
  topic?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_BOOKMARKS}${queryString ? '?' + queryString : ''}`);
};

// ==========================================
// AI STUDY BUDDY - MESSAGE INTERACTIONS
// ==========================================

// React to message
export const aiStudyBuddyReactToMessageApi = (messageId: string, payload: {
  reaction?: 'helpful' | 'not_helpful' | 'partially_helpful' | 'confusing';
  rating?: number; // 1-5
}) => {
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_MESSAGE_REACT.replace(':messageId', messageId),
    payload
  );
};

// Toggle bookmark on message
export const aiStudyBuddyToggleBookmarkApi = (messageId: string) => {
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_MESSAGE_BOOKMARK.replace(':messageId', messageId)
  );
};

// ==========================================
// AI STUDY BUDDY - QUOTA MANAGEMENT
// ==========================================

// Get quota status
export const aiStudyBuddyGetQuotaApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_QUOTA_STATUS);
};

// Add bonus quota (admin/referral)
export const aiStudyBuddyAddBonusQuotaApi = (payload: {
  amount: number;
  reason: string;
  expiresInDays?: number;
}) => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_ADD_BONUS_QUOTA, payload);
};

// Reset daily quota (admin)
export const aiStudyBuddyResetQuotaApi = () => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_RESET_QUOTA);
};

// ==========================================
// AI STUDY BUDDY - SUBSCRIPTION (Future Phase)
// ==========================================

// Get subscription plans
export const aiStudyBuddyGetPlansApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_SUBSCRIPTION_PLANS);
};

// Create subscription order
export const aiStudyBuddyCreateOrderApi = (payload: {
  planType: 'monthly' | 'yearly';
  couponCode?: string;
}) => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_CREATE_ORDER, payload);
};

// Verify subscription payment
export const aiStudyBuddyVerifyPaymentApi = (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  subscriptionId: string;
}) => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_VERIFY_PAYMENT, payload);
};

// Get current subscription
export const aiStudyBuddyGetSubscriptionApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_CURRENT_SUBSCRIPTION);
};

// Cancel subscription
export const aiStudyBuddyCancelSubscriptionApi = (payload: {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
}) => {
  return axiosInstance.post(API.AI_STUDY_BUDDY_CANCEL_SUBSCRIPTION, payload);
};

// ==========================================
// AI STUDY BUDDY - INTEGRATIONS
// ==========================================

// Generate flashcards from conversation
export const aiStudyBuddyGenerateFlashcardsApi = (sessionId: string, payload: {
  cardCount?: number;
  deckName?: string;
  topics?: string[];
  sessionId?: string
}) => {
  console.log(payload,sessionId,'helll')
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_GENERATE_FLASHCARDS.replace(':sessionId', sessionId),
    payload
  );
};

// Generate quiz from conversation
export const aiStudyBuddyGenerateQuizApi = (sessionId: string, payload: {
  questionCount?: number;
  quizTitle?: string;
  topics?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  sessionId: string
}) => {
  console.log(payload);
  
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_GENERATE_QUIZ.replace(':sessionId', sessionId),
    payload
  );
};

// Update areas of improvement
export const aiStudyBuddyUpdateAreasApi = (sessionId: string) => {
  return axiosInstance.post(
    API.AI_STUDY_BUDDY_UPDATE_AREAS.replace(':sessionId', sessionId)
  );
};

// Export conversation
export const aiStudyBuddyExportConversationApi = (
  sessionId: string,
  params?: {
    format?: 'pdf' | 'markdown' | 'txt';
    includeAnalytics?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.AI_STUDY_BUDDY_EXPORT_CONVERSATION.replace(':sessionId', sessionId)}${queryString ? '?' + queryString : ''}`
  );
};

// Download exported file
export const aiStudyBuddyDownloadFileApi = (filename: string) => {
  return axiosInstance.get(
    API.AI_STUDY_BUDDY_DOWNLOAD_EXPORT.replace(':filename', filename),
    { responseType: 'blob' }
  );
};

// ==========================================
// AI STUDY BUDDY - CONFIGURATION & UTILITIES
// ==========================================

// Get available subjects and syllabi
export const aiStudyBuddyGetSubjectsApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_SUBJECTS_CONFIG);
};

// Get feature availability
export const aiStudyBuddyGetFeaturesApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_FEATURES);
};

// Health check
export const aiStudyBuddyHealthCheckApi = () => {
  return axiosInstance.get(API.AI_STUDY_BUDDY_HEALTH);
};

// ==========================================
// AI STUDY BUDDY - HELPER FUNCTIONS
// ==========================================

// Parse API response and handle errors
export const handleAiStudyBuddyResponse = (response: any) => {
  if (response.data && response.data.success) {
    return response.data;
  } else {
    throw new Error(response.data?.message || 'API request failed');
  }
};

// Format error messages for UI
export const formatAiStudyBuddyError = (error: any) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'Something went wrong. Please try again.';
  }
};

// Check if quota exceeded from error
export const isAiStudyBuddyQuotaExceeded = (error: any) => {
  return error.response?.status === 429 || 
         error.response?.data?.message?.includes('quota') ||
         error.response?.data?.message?.includes('limit');
};

export const aiStudyBuddySearchMessagesApi = (params: {
  query?: string;
  page?: number;
  limit?: number;
  subject?: string;
  dateRange?: string;
  messageType?: string;
  sessionId?: string;
  userId?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_SEARCH_MESSAGES}?${queryString}`);
};

// Alternative: If you want to keep it simple like other functions
export const aiStudyBuddySearchMessagesApiSimple = (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_SEARCH_MESSAGES}?${queryString}`);
};

interface AIStudyBuddySearchParams {
  query?: string;
  page?: number;
  limit?: number;
  subject?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  messageType?: 'user' | 'ai' | 'all';
  sessionId?: string;
  userId?: string;
}

// Alternative approach - you can also define it inline like other APIs in your codebase:
export const aiStudyBuddySearchMessagesApiAlternative = (params: {
  query?: string;
  page?: number;
  limit?: number;
  subject?: string;
  dateRange?: string;
  messageType?: string;
  sessionId?: string;
  userId?: string;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_SEARCH_MESSAGES}?${queryString}`);
};

// If you want to keep it consistent with your existing pattern, use this version:
export const aiStudyBuddySearchMessagesApiConsistent = (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  return axiosInstance.get(`${API.AI_STUDY_BUDDY_SEARCH_MESSAGES}?${queryString}`);
};

// Check if Pro upgrade required
export const isAiStudyBuddyUpgradeRequired = (error: any) => {
  return error.response?.data?.upgradeRequired === true ||
         error.response?.status === 403;
};

// Format quota display text
export const formatAiStudyBuddyQuota = (quota: any) => {
  if (quota.subscriptionType === 'pro') {
    return 'Unlimited questions';
  }
  
  const { used, limit, remaining } = quota.dailyQuota;
  return `${remaining}/${limit} questions remaining today`;
};

// Calculate time until quota reset
export const getAiStudyBuddyTimeUntilReset = (resetTime?: Date) => {
  if (!resetTime) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    resetTime = tomorrow;
  }
  
  const now = new Date();
  const diff = resetTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Soon';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Validate session initialization payload
export const validateAiStudyBuddySession = (payload: {
  subject: string;
  syllabus: string;
  grade?: string;
  initialQuery?: string;
  learningGoals?: string[];
}) => {
  const errors: string[] = [];
  
  if (!payload.subject?.trim()) {
    errors.push('Subject is required');
  }
  
  if (!payload.syllabus?.trim()) {
    errors.push('Syllabus is required');
  }
  
  if (payload.initialQuery && payload.initialQuery.length > 1000) {
    errors.push('Initial query too long (max 1000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate message payload
export const validateAiStudyBuddyMessage = (payload: {
  message: string;
  attachments?: any[];
}) => {
  const errors: string[] = [];
  
  if (!payload.message?.trim()) {
    errors.push('Message cannot be empty');
  }
  
  if (payload.message && payload.message.length > 5000) {
    errors.push('Message too long (max 5000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ==========================================
// INTELLITEST - AI-POWERED ASSESSMENT SYSTEM
// ==========================================

// ==========================================
// CORE ASSESSMENT FLOW
// ==========================================

// Get available exams for IntelliTest
export const getIntelliTestAvailableExamsApi = () => {
  return axiosInstance.get(API.INTELLITEST_AVAILABLE_EXAMS);
};

// Create new assessment session
export const createIntelliTestSessionApi = (payload: {
  examId: string;
  sessionType: 'initial_assessment' | 'practice' | 'mock_test' | 'custom_topic';
  totalQuestions: number;
  timeLimit: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  includeCustomTopics?: boolean;
  customTopicIds?: string[];
  hasNegativeMarking?: boolean;
  allowQuestionNavigation?: boolean;
}) => {
  return axiosInstance.post(API.INTELLITEST_CREATE_SESSION, payload);
};

// Start assessment session
export const startIntelliTestSessionApi = (payload: {
  sessionId: string;
}) => {
  return axiosInstance.post(API.INTELLITEST_START_SESSION, payload);
};

// Get current question in session
export const getCurrentIntelliTestQuestionApi = (sessionId: string) => {
  return axiosInstance.get(
    API.INTELLITEST_CURRENT_QUESTION.replace(':sessionId', sessionId)
  );
};

// Submit answer for current question
export const submitIntelliTestAnswerApi = (payload: {
  sessionId: string;
  questionId: string;
  selectedOption?: string;
  numericalAnswer?: number;
  confidenceLevel?: 'low' | 'medium' | 'high';
  timeSpent: number;
  optionChangeCount?: number;
}) => {
  return axiosInstance.post(API.INTELLITEST_SUBMIT_ANSWER, payload);
};

// Navigate to specific question
export const navigateIntelliTestQuestionApi = (payload: {
  sessionId: string;
  questionNumber: number;
}) => {
  return axiosInstance.post(API.INTELLITEST_NAVIGATE_QUESTION, payload);
};

// End assessment session
export const endIntelliTestSessionApi = (payload: {
  sessionId: string;
  reason?: 'completed_manually' | 'time_up' | 'user_quit';
}) => {
  return axiosInstance.post(API.INTELLITEST_END_SESSION, payload);
};

// ==========================================
// SESSION MANAGEMENT
// ==========================================

// Pause active session
export const pauseIntelliTestSessionApi = (payload: {
  sessionId: string;
  reason?: 'user_requested' | 'system_pause' | 'break_time';
}) => {
  return axiosInstance.post(API.INTELLITEST_PAUSE_SESSION, payload);
};

// Resume paused session
export const resumeIntelliTestSessionApi = (payload: {
  sessionId: string;
}) => {
  return axiosInstance.post(API.INTELLITEST_RESUME_SESSION, payload);
};

// Get session summary and results
export const getIntelliTestSessionSummaryApi = (sessionId: string) => {
  return axiosInstance.get(
    API.INTELLITEST_SESSION_SUMMARY.replace(':sessionId', sessionId)
  );
};

// Get user's session history
export const getIntelliTestSessionHistoryApi = (params?: {
  examId?: string;
  status?: string;
  limit?: number;
  page?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.INTELLITEST_SESSION_HISTORY}${queryString ? '?' + queryString : ''}`);
};

// ==========================================
// PERFORMANCE ANALYTICS
// ==========================================

// Get detailed performance analysis
export const getIntelliTestPerformanceAnalysisApi = (
  examId: string,
  params?: {
    includeInsights?: boolean;
    timeRange?: number;
    includeTopicBreakdown?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.INTELLITEST_PERFORMANCE_ANALYSIS.replace(':examId', examId)}${queryString ? '?' + queryString : ''}`
  );
};

// Generate AI-powered performance insights
export const generateIntelliTestInsightsApi = (payload: {
  examId: string;
  timeRange: number;
  includeWeakAreas?: boolean;
  includePeerComparison?: boolean;
  includeRecommendations?: boolean;
}) => {
  return axiosInstance.post(API.INTELLITEST_GENERATE_INSIGHTS, payload);
};

// Get peer comparison data
export const getIntelliTestPeerComparisonApi = (
  examId: string,
  params?: {
    includeAnonymizedData?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.INTELLITEST_PEER_COMPARISON.replace(':examId', examId)}${queryString ? '?' + queryString : ''}`
  );
};

// ==========================================
// LEARNING ROADMAPS
// ==========================================

// Generate personalized learning roadmap
export const generateIntelliTestRoadmapApi = (payload: {
  examId: string;
  targetDate: string;
  dailyStudyTime: number;
  currentPreparationLevel?: 'beginner' | 'intermediate' | 'advanced';
  strongSubjects?: string[];
  weakSubjects?: string[];
  studyIntensity?: 'light' | 'moderate' | 'intensive';
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
}) => {
  return axiosInstance.post(API.INTELLITEST_GENERATE_ROADMAP, payload);
};

// Get roadmap details
export const getIntelliTestRoadmapApi = (
  roadmapId: string,
  params?: {
    includeDetails?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.INTELLITEST_GET_ROADMAP.replace(':roadmapId', roadmapId)}${queryString ? '?' + queryString : ''}`
  );
};

// Get daily study plan
export const getIntelliTestDailyPlanApi = (roadmapId: string) => {
  return axiosInstance.get(
    API.INTELLITEST_DAILY_PLAN.replace(':roadmapId', roadmapId)
  );
};

// Get plan for specific date
export const getIntelliTestSpecificDatePlanApi = (roadmapId: string, date: string) => {
  return axiosInstance.get(
    API.INTELLITEST_SPECIFIC_DATE_PLAN
      .replace(':roadmapId', roadmapId)
      .replace(':date', date)
  );
};

// Update daily progress
export const updateIntelliTestDailyProgressApi = (roadmapId: string, payload: {
  date: string;
  timeSpent: number;
  topicsCompleted?: string[];
  difficultyRating?: 'easy' | 'medium' | 'hard';
  comprehensionLevel?: number;
  strugglingAreas?: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  studyNotes?: string;
}) => {
  return axiosInstance.post(
    API.INTELLITEST_UPDATE_DAILY_PROGRESS.replace(':roadmapId', roadmapId),
    payload
  );
};

// Complete milestone
export const completeIntelliTestMilestoneApi = (
  roadmapId: string,
  milestoneId: string,
  payload: {
    completionNotes?: string;
    performanceScore?: number;
  }
) => {
  return axiosInstance.post(
    API.INTELLITEST_COMPLETE_MILESTONE
      .replace(':roadmapId', roadmapId)
      .replace(':milestoneId', milestoneId),
    payload
  );
};

// Adapt roadmap based on performance
export const adaptIntelliTestRoadmapApi = (roadmapId: string, payload: {
  reason: 'performance_change' | 'time_constraint' | 'preference_update' | 'external_factors';
  performanceData?: {
    recentAssessmentScore: number;
    strugglingTopics: string[];
    improvedTopics: string[];
    timeEfficiency?: 'above_average' | 'average' | 'below_average';
    confidenceLevel?: 'low' | 'medium' | 'high';
  };
  timeConstraints?: {
    availableDailyTime: number;
    examDate?: string;
    urgentTopics?: string[];
  };
  learningPreferences?: {
    preferredDifficulty?: 'easy' | 'medium' | 'hard';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    studyIntensity?: 'light' | 'moderate' | 'intensive';
  };
}) => {
  return axiosInstance.post(
    API.INTELLITEST_ADAPT_ROADMAP.replace(':roadmapId', roadmapId),
    payload
  );
};

// Get roadmap analytics
export const getIntelliTestRoadmapAnalyticsApi = (
  roadmapId: string,
  params?: {
    includeProgressTrends?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.INTELLITEST_ROADMAP_ANALYTICS.replace(':roadmapId', roadmapId)}${queryString ? '?' + queryString : ''}`
  );
};

// Get roadmap history
export const getIntelliTestRoadmapHistoryApi = (params?: {
  examId?: string;
  limit?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.INTELLITEST_ROADMAP_HISTORY}${queryString ? '?' + queryString : ''}`);
};

// ==========================================
// CUSTOM TOPICS
// ==========================================

// Get custom topics with filters
export const getIntelliTestCustomTopicsApi = (params?: {
  examId?: string;
  subjectId?: string;
  visibility?: 'public' | 'private' | 'community';
  createdBy?: 'me' | string;
  search?: string;
  sortBy?: 'popularityScore' | 'createdAt' | 'validationScore';
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.INTELLITEST_CUSTOM_TOPICS}${queryString ? '?' + queryString : ''}`);
};

// Create new custom topic
export const createIntelliTestCustomTopicApi = (payload: {
  topicName: string;
  topicDescription: string;
  targetExamId: string;
  targetSubjectId: string;
  learningObjectives?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard';
  visibility?: 'private' | 'public' | 'community';
  generateQuestions?: number;
}) => {
  return axiosInstance.post(API.INTELLITEST_CREATE_CUSTOM_TOPIC, payload);
};

// Get custom topic details
export const getIntelliTestCustomTopicDetailsApi = (
  topicId: string,
  params?: {
    includeQuestions?: boolean;
  }
) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(
    `${API.INTELLITEST_CUSTOM_TOPIC_DETAILS.replace(':topicId', topicId)}${queryString ? '?' + queryString : ''}`
  );
};

// Update custom topic
export const updateIntelliTestCustomTopicApi = (topicId: string, payload: {
  topicName?: string;
  topicDescription?: string;
  learningObjectives?: string[];
  estimatedMasteryTime?: number;
  visibility?: 'private' | 'public' | 'community';
  prerequisites?: any[];
  suggestedResources?: any[];
  tags?: string[];
}) => {
  return axiosInstance.put(
    API.INTELLITEST_UPDATE_CUSTOM_TOPIC.replace(':topicId', topicId),
    payload
  );
};

// Delete custom topic
export const deleteIntelliTestCustomTopicApi = (topicId: string) => {
  return axiosInstance.delete(
    API.INTELLITEST_DELETE_CUSTOM_TOPIC.replace(':topicId', topicId)
  );
};

// Get trending custom topics
export const getIntelliTestTrendingTopicsApi = (params?: {
  examId?: string;
  limit?: number;
  timeframe?: '24h' | '7d' | '30d';
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.INTELLITEST_TRENDING_TOPICS}${queryString ? '?' + queryString : ''}`);
};

// Search custom topics
export const searchIntelliTestTopicsApi = (params: {
  q: string;
  examId?: string;
  subjectId?: string;
  difficulty?: string;
  minRating?: number;
  limit?: number;
}) => {
  const queryString = new URLSearchParams(params as any).toString();
  return axiosInstance.get(`${API.INTELLITEST_SEARCH_TOPICS}?${queryString}`);
};

// ==========================================
// ADMIN & TESTING
// ==========================================

// Health check for IntelliTest service
export const intelliTestHealthCheckApi = () => {
  return axiosInstance.get(API.INTELLITEST_HEALTH);
};

// Seed exam configurations (development/testing)
export const seedIntelliTestExamsApi = () => {
  return axiosInstance.post(API.INTELLITEST_SEED_EXAMS);
};

// ==========================================
// INTELLITEST HELPER FUNCTIONS
// ==========================================

// Validate session creation payload
export const validateIntelliTestSessionPayload = (payload: any) => {
  const errors: string[] = [];
  
  if (!payload.examId?.trim()) {
    errors.push('Exam ID is required');
  }
  
  if (!payload.sessionType?.trim()) {
    errors.push('Session type is required');
  }
  
  if (!payload.totalQuestions || payload.totalQuestions < 1) {
    errors.push('Total questions must be at least 1');
  }
  
  if (!payload.timeLimit || payload.timeLimit < 1) {
    errors.push('Time limit must be at least 1 minute');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate session progress percentage
export const calculateIntelliTestProgress = (currentQuestion: number, totalQuestions: number) => {
  return Math.round((currentQuestion / totalQuestions) * 100);
};

// Format time remaining for display
export const formatIntelliTestTimeRemaining = (timeInSeconds: number) => {
  if (timeInSeconds <= 0) return 'Time up!';
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

// Check if IntelliTest quota exceeded
export const isIntelliTestQuotaExceeded = (error: any) => {
  return error.response?.status === 429 || 
         error.response?.data?.message?.includes('quota') ||
         error.response?.data?.message?.includes('limit');
};

// Format IntelliTest error messages
export const formatIntelliTestError = (error: any) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'Something went wrong with IntelliTest. Please try again.';
  }
};

// Parse difficulty distribution
export const parseIntelliTestDifficultyDistribution = (easy: number, medium: number, hard: number) => {
  const total = easy + medium + hard;
  if (total !== 100) {
    const ratio = 100 / total;
    return {
      easy: Math.round(easy * ratio),
      medium: Math.round(medium * ratio),
      hard: Math.round(hard * ratio)
    };
  }
  return { easy, medium, hard };
};

// ==========================================
// DOMAIN VERIFICATION API FUNCTIONS
// ==========================================

export const sendDomainVerificationOTPApi = (payload: { email: string; userId: string }) => {
  return axiosInstance.post(API.SEND_DOMAIN_OTP, payload);
};

export const verifyDomainOTPApi = (payload: { email: string; otp: string; userId: string }) => {
  return axiosInstance.post(API.VERIFY_DOMAIN_OTP, payload);
};

export const checkDomainTypeApi = (payload: { email: string }) => {
  return axiosInstance.post(API.DOMAIN_CHECK_TYPE, payload);
};

export const sendDomainVerificationApi = (payload: any) => {
  return axiosInstance.post(API.DOMAIN_SEND_VERIFICATION_OTP, payload);
};

export const verifyDomainApi = (payload: any) => {
  return axiosInstance.post(API.DOMAIN_VERIFY_OTP, payload);
};

export const requestManualVerificationApi = (payload: any) => {
  return axiosInstance.post(API.DOMAIN_REQUEST_MANUAL_VERIFICATION, payload);
};

export const getDomainWhitelistApi = () => {
  return axiosInstance.get(API.DOMAIN_WHITELIST);
};

export const addDomainToWhitelistApi = (payload: any) => {
  return axiosInstance.post(API.DOMAIN_WHITELIST_ADD, payload);
};


// ==========================================
// COMMUNITY FEATURE API SERVICES
// ==========================================

// -- Community Management & Discovery --

/**
 * Creates a new community.
 * @param payload - The community creation data.
 */
export const createCommunityApi = (payload: any) => {
  return axiosInstance.post(API.COMMUNITY_CREATE, payload);
};

/**
 * Fetches a paginated or filtered list of all communities.
 * @param params - Optional query parameters for filtering, sorting, and pagination.
 */
export const listAllCommunitiesApi = (params?: any) => {
  return axiosInstance.get(API.COMMUNITY_LIST_ALL, { params });
};

/**
 * Retrieves detailed information for a single community by its ID.
 * @param communityId - The ID of the community.
 */
export const getCommunityDetailsApi = (communityId: string) => {
  return axiosInstance.get(`${API.COMMUNITY_DETAILS}${communityId}`);
};

/**
 * Updates an existing community's information.
 * @param communityId - The ID of the community to update.
 * @param payload - The data to be updated.
 */
export const updateCommunityApi = (communityId: string, payload: any) => {
  return axiosInstance.put(`${API.COMMUNITY_UPDATE}${communityId}`, payload);
};

/**
 * Searches for communities based on various criteria.
 * @param params - Search query parameters (e.g., q, type, tags).
 */
export const searchCommunitiesApi = (params: any) => {
  return axiosInstance.get(API.COMMUNITY_SEARCH, { params });
};

/**
 * Gets personalized community recommendations for the current user.
 * @param params - Optional query parameters (e.g., limit, type).
 */
export const getCommunityRecommendationsApi = (params?: any) => {
  return axiosInstance.get(API.COMMUNITY_RECOMMENDATIONS, { params });
};

/**
 * Fetches a list of currently trending communities.
 * @param params - Optional query parameters (e.g., period, limit).
 */
export const getTrendingCommunitiesApi = (params?: any) => {
  return axiosInstance.get(API.COMMUNITY_TRENDING, { params });
};

// -- Community Membership --

/**
 * Allows a user to join or request to join a community.
 * @param communityId - The ID of the community.
 * @param payload - Reason for joining, if required.
 */
export const joinCommunityApi = (communityId: string, payload: any) => {
  return axiosInstance.post(API.COMMUNITY_JOIN.replace(':communityId', communityId), payload);
};

/**
 * Allows a user to leave a community.
 * @param communityId - The ID of the community.
 * @param payload - Optional reason for leaving.
 */
export const leaveCommunityApi = (communityId: string, payload?: any) => {
  return axiosInstance.post(API.COMMUNITY_LEAVE.replace(':communityId', communityId), payload);
};

/**
 * Fetches the list of members for a specific community.
 * @param communityId - The ID of the community.
 * @param params - Optional query parameters for filtering and pagination.
 */
export const getCommunityMembersApi = (communityId: string, params?: any) => {
  return axiosInstance.get(API.COMMUNITY_MEMBERS.replace(':communityId', communityId), { params });
};

/**
 * Updates the role of a community member (promote/demote).
 * @param communityId - The ID of the community.
 * @param memberId - The ID of the member.
 * @param payload - The new role and reason.
 */
export const updateMemberRoleApi = (communityId: string, memberId: string, payload: any) => {
  return axiosInstance.post(
    API.COMMUNITY_UPDATE_MEMBER_ROLE.replace(':communityId', communityId).replace(':memberId', memberId),
    payload
  );
};

/**
 * Removes a member from a community.
 * @param communityId - The ID of the community.
 * @param memberId - The ID of the member to remove.
 */
export const removeMemberApi = (communityId: string, memberId: string) => {
  return axiosInstance.delete(
    API.COMMUNITY_REMOVE_MEMBER.replace(':communityId', communityId).replace(':memberId', memberId)
  );
};

// -- Join Requests (For Admins) --

/**
 * Fetches pending join requests for a community.
 * @param communityId - The ID of the community.
 * @param params - Optional query parameters for status filtering.
 */
export const getJoinRequestsApi = (communityId: string, params?: any) => {
  return axiosInstance.get(API.COMMUNITY_LIST_JOIN_REQUESTS.replace(':communityId', communityId), { params });
};

/**
 * Responds to a join request (approve/reject).
 * @param communityId - The ID of the community.
 * @param requestId - The ID of the join request.
 * @param payload - The action ('approve' or 'reject') and a message.
 */
export const respondToJoinRequestApi = (communityId: string, requestId: string, payload: any) => {
  return axiosInstance.post(
    API.COMMUNITY_RESPOND_JOIN_REQUEST.replace(':communityId', communityId).replace(':requestId', requestId),
    payload
  );
};

// -- Content Management (Posts, Polls, Events) --

/**
 * Creates a new post, poll, or event within a community.
 * @param communityId - The ID of the community.
 * @param payload - The content of the post.
 */
export const createCommunityPostApi = (communityId: string, payload: any) => {
  return axiosInstance.post(API.COMMUNITY_CREATE_POST.replace(':communityId', communityId), payload);
};

/**
 * Fetches the content feed for a community.
 * @param communityId - The ID of the community.
 * @param params - Optional query parameters for sorting and pagination.
 */
export const getCommunityFeedApi = (communityId: string, params?: any) => {
  return axiosInstance.get(API.COMMUNITY_GET_FEED.replace(':communityId', communityId), { params });
};

/**
 * Retrieves a single post by its ID.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 */
export const getCommunityPostApi = (communityId: string, postId: string) => {
  return axiosInstance.get(`${API.COMMUNITY_GET_POST.replace(':communityId', communityId)}${postId}`);
};

/**
 * Updates an existing post.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post to update.
 * @param payload - The updated post data.
 */
export const updateCommunityPostApi = (communityId: string, postId: string, payload: any) => {
  return axiosInstance.put(`${API.COMMUNITY_UPDATE_POST.replace(':communityId', communityId)}${postId}`, payload);
};

/**
 * Deletes a post.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post to delete.
 */
export const deleteCommunityPostApi = (communityId: string, postId: string) => {
  return axiosInstance.delete(`${API.COMMUNITY_DELETE_POST.replace(':communityId', communityId)}${postId}`);
};

// -- User Interactions on Content --

// Types for better type safety
interface VotePayload {
  voteType: 'upvote' | 'downvote';
}

interface CommentPayload {
  content: {
    text: string;
    html?: string;
  };
  parentCommentId?: string;
  attachments?: Array<{
    type: 'image' | 'gif' | 'link';
    url: string;
    thumbnailUrl?: string;
    metadata?: any;
  }>;
  markAsBestAnswer?: boolean;
}

interface PollVotePayload {
  optionIds: string[];
}

interface EventRSVPPayload {
  status: 'going' | 'interested' | 'not_going';
  seats?: number; // 1-10
}

interface BookmarkPayload {
  notes?: string;
  tags?: string[];
  collectionId?: string;
  isPrivate?: boolean;
}

interface SharePayload {
  platform: 'internal' | 'whatsapp' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'copy_link' | 'email' | 'other';
  message?: string;
  sharedTo?: {
    communities?: string[];
    users?: string[];
  };
}

interface ReportPayload {
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
  description: string;
}

interface InteractionsParams {
  includeComments?: boolean;
  includeVoters?: boolean;
  commentSort?: 'best' | 'newest' | 'oldest' | 'top';
  page?: number;
  limit?: number;
}

/**
 * Votes on a post (upvote/downvote with toggle).
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param payload - Vote type (upvote or downvote).
 */
export const voteCommunityPostApi = (
  communityId: string, 
  postId: string, 
  payload: VotePayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POST_VOTE.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Adds a comment to a post with rich content support.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param payload - The comment content with optional mentions, attachments, and parent comment.
 */
export const commentOnCommunityPostApi = (
  communityId: string, 
  postId: string, 
  payload: CommentPayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POST_COMMENT.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Submits a vote on a poll with support for multiple choice.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the poll post.
 * @param payload - Array of selected option IDs.
 */
export const voteOnPollApi = (
  communityId: string, 
  postId: string, 
  payload: PollVotePayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POLL_VOTE.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Responds to an event invitation (RSVP) with seat selection.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the event post.
 * @param payload - RSVP status and optional seat count.
 */
export const rsvpToEventApi = (
  communityId: string, 
  postId: string, 
  payload: EventRSVPPayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_EVENT_RSVP.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Bookmarks or unbookmarks a post (toggle).
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param payload - Optional bookmark metadata (notes, tags, collection).
 */
export const bookmarkCommunityPostApi = (
  communityId: string, 
  postId: string, 
  payload?: BookmarkPayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POST_BOOKMARK.replace(':communityId', communityId).replace(':postId', postId),
    payload || {}
  );
};

/**
 * Shares a post to various platforms with tracking.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param payload - Share platform and optional message.
 */
export const shareCommunityPostApi = (
  communityId: string, 
  postId: string, 
  payload: SharePayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POST_SHARE.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Reports a post for moderation review.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param payload - Report reason and description.
 */
export const reportCommunityPostApi = (
  communityId: string, 
  postId: string, 
  payload: ReportPayload
) => {
  return axiosInstance.post(
    API.COMMUNITY_POST_REPORT.replace(':communityId', communityId).replace(':postId', postId),
    payload
  );
};

/**
 * Gets comprehensive interaction analytics for a post.
 * @param communityId - The ID of the community.
 * @param postId - The ID of the post.
 * @param params - Query parameters for filtering interactions.
 */
export const getPostInteractionsApi = (
  communityId: string, 
  postId: string, 
  params?: InteractionsParams
) => {
  return axiosInstance.get(
    API.COMMUNITY_POST_INTERACTIONS.replace(':communityId', communityId).replace(':postId', postId),
    { params }
  );
};

// -- Administration --

/**
 * Updates detailed settings for a community.
 * @param communityId - The ID of the community.
 * @param payload - The settings object.
 */
export const updateCommunitySettingsApi = (communityId: string, payload: any) => {
  return axiosInstance.put(API.COMMUNITY_UPDATE_SETTINGS.replace(':communityId', communityId), payload);
};

/**
 * Fetches analytics data for a community.
 * @param communityId - The ID of the community.
 * @param params - Optional query parameters for time period and metrics.
 */
export const getCommunityAnalyticsApi = (communityId: string, params?: any) => {
  return axiosInstance.get(API.COMMUNITY_ANALYTICS.replace(':communityId', communityId), { params });
};

// -- File & Media Uploads --

/**
 * Uploads a file to be used in posts, profiles, etc.
 * @param formData - The file data packaged as FormData.
 */
export const uploadFileApi = (formData: FormData) => {
  return axiosInstance.post(API.FILE_UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ==========================================
// BACKWARD COMPATIBILITY & ALIASES
// ==========================================

// Maintain backward compatibility with existing naming
export const createIntelliTestApi = createIntelliTestSessionApi;
export const getIntelliTestResultsApi = getIntelliTestSessionSummaryApi;
export const getIntelliTestAnalyticsApi = getIntelliTestPerformanceAnalysisApi;

// Maintain backward compatibility
export const submitForReviewApi = submitQuizForReviewApi;