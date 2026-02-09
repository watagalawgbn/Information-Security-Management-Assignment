import axios from 'axios';
import { API_URL } from '../config';

const AuthService = {
  login: async (data) => {
    try {
      console.log('Sending login request with:', data );
      const response = await axios.post(`${API_URL}/login`,  data );
      console.log('Login response:', response.data);
      if (response.data.token) {
        console.log('JWT Token:', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.message || 'Login error');
    }
  },
  
  getUser: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Fetching user failed:', error);
      throw new Error(error.response?.data?.message || 'User fetch error');
    }
  },

  sendOTP: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/sendotp`, { email });
      return response.data;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      throw new Error(error.response?.data?.message || 'OTP sending failed');
    }
  },

  signup: async (UserData) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, UserData);
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.message || 'Signup error');
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await axios.patch(`${API_URL}/verifyotp`, data);
      return response.data;
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw new Error(error.response?.data?.message || 'OTP verification error');
    }
  },

  createProfile: async (newUser, token) => {
  try {
    const response = await axios.post(`${API_URL}/createprofile`, {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('Profile creation failed:', error);
    throw new Error(error.response?.data?.message || 'Profile creation error');
  }
},

  updatePassword: async (email, password) => {
    try {
      const response = await axios.patch(`${API_URL}/setpassword`, { email, password });
      return response.data;
    } catch (error) {
      console.error('Password update failed:', error);
      throw new Error(error.response?.data?.message || 'Password update error');
    }
  }
};

export default AuthService;