import axios from 'axios';
import { USER_URL } from '../config';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const UserService = {
  // Public route - no auth required
  findUserByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/finduser`, { params: { email } });
      return response.data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${USER_URL}/users`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getDriverProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/profile`, { 
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  addDriver: async (driverData) => {
    try {
      const response = await axios.post(`${USER_URL}/add`, driverData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  updateDriver: async (driverData) => {
    try {
      const response = await axios.put(`${USER_URL}/update`, driverData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  addVehicle: async (vehicleData) => {
    try {
      const response = await axios.post(`${USER_URL}/add-vehicle`, vehicleData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  },

  // Protected route - requires Auth + IsAdmin
  updateVehicle: async (vehicleData) => {
    try {
      const response = await axios.put(`${USER_URL}/update-vehicle`, vehicleData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getVehicleProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/vehicle-profile`, { 
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle profile:', error);
      throw error;
    }
  },

  // Protected route - requires Auth
  getAllVehicles: async () => {
    try {
      const response = await axios.get(`${USER_URL}/vehicles`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      throw error;
    }
  },

  getAllDriversDetailed: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${USER_URL}/drivers/all${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all drivers:', error);
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    try {
      const response = await axios.get(`${USER_URL}/drivers/${driverId}/profile`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver by ID:', error);
      throw error;
    }
  },

  // Update driver availability (by tour operator)
  updateDriverAvailabilityByAdmin: async (driverId, availabilityData) => {
    try {
      const response = await axios.patch(`${USER_URL}/drivers/${driverId}/availability`, availabilityData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver availability:', error);
      throw error;
    }
  },

  // Update driver trip preferences (by tour operator)
  updateDriverPreferences: async (driverId, preferencesData) => {
    try {
      const response = await axios.patch(`${USER_URL}/drivers/${driverId}/preferences`, preferencesData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver preferences:', error);
      throw error;
    }
  },

  // Search drivers with filters
  searchDrivers: async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams(searchParams).toString();
      const response = await axios.get(`${USER_URL}/drivers/search${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }
  },

  getAvailableDriversByTripType: async (tripType) => {
    try {
      const response = await axios.get(`/api/drivers/available-by-type`, {
        params: { tripType },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available drivers by trip type:', error);
      throw error;
    }
  },

  updateVehicleAvailability: async (vehicleId, availability) => {
    try {
      const response = await axios.patch(
        `${USER_URL}/vehicles/${vehicleId}/availability`,
        { availability },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle availability:', error);
      throw error;
    }
  },

  getAvailableVehicles: async () => {
  try {
    const response = await axios.get(`${USER_URL}/vehicles/available`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    throw error;
  }
},
};  

export default UserService;