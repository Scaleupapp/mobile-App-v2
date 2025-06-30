// Add these functions to your apiService.js file

export const createContentPaymentOrder = async (contentId) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(
      `${BASE_URL}/content/create-payment-order`,
      { contentId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Create payment order error:', error);
    throw error;
  }
};

export const verifyContentPayment = async (paymentData) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await axios.post(
      `${BASE_URL}/content/verify-payment`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Verify payment error:', error);
    throw error;
  }
};