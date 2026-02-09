import axios from 'axios';
import { USER_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const TripServices = {
  // Customer trip request methods (matching backend routes)
  createTripRequest: async (tripData) => {
    try {
      const response = await axios.post(`${USER_URL}/trip/request`, tripData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating trip request:', error);
      throw error;
    }
  },

  getTripRequestById: async (tripId) => {
    try {
      const response = await axios.get(`${USER_URL}/trip/my-trips/${tripId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trip request:', error);
      throw error;
    }
  },

  updateTripRequest: async (tripId, updateData) => {
    try {
      const response = await axios.put(`${USER_URL}/trip/my-trips/${tripId}`, updateData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trip request:', error);
      throw error;
    }
  },

  getCustomerTripRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${USER_URL}/trip/my-trips${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer trip requests:', error);
      throw error;
    }
  },

  // Alias for dashboard compatibility
  getCustomerTrips: async (params = {}) => {
    // This calls the same endpoint as getCustomerTripRequests
    return await TripServices.getCustomerTripRequests(params);
  },

  getTripStatistics: async () => {
    try {
      const response = await axios.get(`${USER_URL}/trip/statistics`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trip statistics:', error);
      throw error;
    }
  },

  cancelTripRequest: async (tripId) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/my-trips/${tripId}/cancel`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling trip request:', error);
      throw error;
    }
  },

  // Alias for trip cancellation
  cancelTrip: async (tripId) => {
    return await TripServices.cancelTripRequest(tripId);
  },

  // Alias for getting trip by ID
  getTripById: async (tripId) => {
    return await TripServices.getTripRequestById(tripId);
  },

  // Trip tracking methods (these might need backend implementation)
  startTripTracking: async (tripId, trackingData) => {
    try {
      const response = await axios.post(`${USER_URL}/trip/${tripId}/tracking/start`, trackingData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error starting trip tracking:', error);
      throw error;
    }
  },

  updateTripProgress: async (tripId, progressData) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/tracking/progress`, progressData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trip progress:', error);
      throw error;
    }
  },

  stopTripTracking: async (tripId, trackingData) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/tracking/stop`, trackingData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error stopping trip tracking:', error);
      throw error;
    }
  },

  getTripTracking: async (tripId) => {
    try {
      const response = await axios.get(`${USER_URL}/trip/${tripId}/tracking`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trip tracking:', error);
      throw error;
    }
  },

  updateDriverLocation: async (locationData) => {
    try {
      const response = await axios.post(`${USER_URL}/driver/location`, locationData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  getDriverLocation: async (driverId) => {
    try {
      const response = await axios.get(`${USER_URL}/driver/${driverId}/location`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching driver location:', error);
      throw error;
    }
  },

  getActiveTripsWithTracking: async () => {
    try {
      const response = await axios.get(`${USER_URL}/trips/active/tracking`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active trips with tracking:', error);
      throw error;
    }
  },

  // Admin/Tour Operator methods (matching backend routes)
  getAllTripRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${USER_URL}/trip/all${queryParams ? `?${queryParams}` : ''}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all trip requests:', error);
      throw error;
    }
  },

  // Alias for admin trips
  getAllTrips: async (params = {}) => {
    return await TripServices.getAllTripRequests(params);
  },

  assignTripToDriver: async (tripId, assignmentData) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/assign`, assignmentData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning trip to driver:', error);
      throw error;
    }
  },

  updateTripStatus: async (tripId, statusData) => {
    try {
      const response = await axios.patch(`${USER_URL}/trip/${tripId}/status`, statusData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trip status:', error);
      throw error;
    }
  }
};

export default TripServices;