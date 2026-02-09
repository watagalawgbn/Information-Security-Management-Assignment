import axios from 'axios';
import { USER_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const DriverServices = {
  findUserByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/finduser`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  getDriverProfileByEmail: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/profile`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver profile by email:', error);
      throw error;
    }
  },

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

  // Full driver profile update (for complete profile updates)
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


  updateDriverAvailability: async (email, availability, locationData = {}) => {
    try {
      const updateData = {
        email,
        availability,
        ...locationData
      };
      
      console.log('Sending availability update:', updateData);
      
      const response = await axios.put(`${USER_URL}/update`, updateData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver availability:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },


  updateTripPreferences: async (email, preferred_trip_types) => {
    try {
      const updateData = {
        email,
        preferred_trip_types: Array.isArray(preferred_trip_types) 
          ? preferred_trip_types 
          : [preferred_trip_types]
      };
      
      console.log('Sending trip preferences update:', updateData);
      
      const response = await axios.put(`${USER_URL}/update`, updateData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trip preferences:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  getAvailableDrivers: async (tripType, passengerCount) => {
    try {
      const response = await axios.get(`${USER_URL}/drivers/available`, {
        params: { tripType, passengerCount },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      return { success: false, data: [] };
    }
  },

  getDriverAvailability: async () => {
    try {
      const response = await axios.get(`${USER_URL}/driver/availability`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver availability:', error);
      return { availability: 'offline' };
    }
  },

  updateDriverStatus: async (email, status) => {
    try {
      const response = await axios.patch(`${USER_URL}/driver/status`, { 
        email, 
        status 
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver status:', error);
      return { success: true, status };
    }
  },

  getDriverStatus: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/driver/status`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver status:', error);
      throw error;
    }
  },

  updateDriverLocation: async (locationData) => {
    try {
      const response = await axios.put(`${USER_URL}/driver/location`, locationData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  getDriverLocation: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/driver/location`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver location:', error);
      throw error;
    }
  },

  getNearbyDrivers: async (lat, lng, radius = 10) => {
    try {
      const response = await axios.get(`${USER_URL}/driver/nearby`, {
        params: { lat, lng, radius },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      throw error;
    }
  },

  getAssignedTrips: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${USER_URL}/trip/all${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned trips:', error);
      return [];
    }
  },

  getCurrentTrip: async () => {
    try {
      const response = await axios.get(`${USER_URL}/trip/my-trips`, {
        headers: getAuthHeaders()
      });
      const trips = response.data;
      return trips.find(trip => trip.status === 'in_progress') || null;
    } catch (error) {
      console.error('Error fetching current trip:', error);
      return null;
    }
  },

  acceptTrip: async (tripId, acceptanceData = {}) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/status`, { 
        status: 'accepted',
        ...acceptanceData 
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting trip:', error);
      throw error;
    }
  },

  rejectTrip: async (tripId, reason) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/status`, { 
        status: 'rejected',
        reason 
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting trip:', error);
      throw error;
    }
  },

  startTrip: async (tripId, startData = {}) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/status`, {
        status: 'in_progress',
        start_time: new Date().toISOString(),
        start_location: startData.start_location || null,
        ...startData
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error starting trip:', error);
      throw error;
    }
  },

  completeTrip: async (tripId, completionData) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/status`, {
        status: 'completed',
        end_time: new Date().toISOString(),
        end_location: completionData.end_location || null,
        ...completionData
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error completing trip:', error);
      throw error;
    }
  },

  getDriverStatistics: async (email) => {
    try {
      const response = await axios.get(`${USER_URL}/driver/statistics`, {
        params: { email },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver statistics:', error);
      return {
        totalTrips: 0,
        completedTrips: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalDistance: 0
      };
    }
  }
};

export default DriverServices;