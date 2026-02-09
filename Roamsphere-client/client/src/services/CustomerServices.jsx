import axios from 'axios';
import { USER_URL } from '../config';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CustomerService = {
  // Customer Authentication
  registerCustomer: async (customerData) => {
    try {
      const response = await axios.post(`${USER_URL}/customer/register`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error registering customer:', error);
      throw error;
    }
  },

  loginCustomer: async (loginData) => {
    try {
      const response = await axios.post(`${USER_URL}/customer/login`, loginData);
      return response.data;
    } catch (error) {
      console.error('Error logging in customer:', error);
      throw error;
    }
  },

  // Customer Profile
  getCustomerProfile: async () => {
    try {
      const response = await axios.get(`${USER_URL}/customer/profile`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      throw error;
    }
  },

  updateCustomerProfile: async (profileData) => {
    try {
      const response = await axios.put(`${USER_URL}/customer/profile`, profileData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }
};

export default CustomerService;