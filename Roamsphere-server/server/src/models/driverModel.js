import { pool } from '../config/db.js';

const DriverModel = {
  // Create a new driver
  createDriver: async (driverData) => {
    const {
      driverId, userId, licenseNumber, licenseExpiry, mobile,
      emergencyContact, emergencyPhone, address, city, state,
      zipCode, preferredTripTypes, availabilityStatus, isOnline
    } = driverData;

    const query = `
      INSERT INTO Driver (
        driver_id, user_id, license_number, license_expiry, mobile,
        emergency_contact, emergency_phone, address, city, state,
        zip_code, preferred_trip_types, availability_status, is_online,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const values = [
      driverId, userId, licenseNumber, licenseExpiry, mobile,
      emergencyContact, emergencyPhone, address, city, state,
      zipCode, preferredTripTypes || '[]', availabilityStatus || 'available', isOnline || false
    ];

    const [result] = await pool.query(query, values);
    return result;
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    const query = `
      SELECT d.*, 
             su.first_name, su.last_name, su.email, su.phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Driver d
      JOIN SystemUser su ON d.user_id = su.user_id
      WHERE d.driver_id = ?
    `;
    const [results] = await pool.query(query, [driverId]);
    return results[0];
  },

  // Get driver by user ID
  getDriverByUserId: async (userId) => {
    const query = `
      SELECT d.*, 
             su.first_name, su.last_name, su.email, su.phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Driver d
      JOIN SystemUser su ON d.user_id = su.user_id
      WHERE d.user_id = ?
    `;
    const [results] = await pool.query(query, [userId]);
    return results[0];
  },

  // Get all drivers
  getAllDrivers: async (filters = {}) => {
    let query = `
      SELECT d.*, 
             su.first_name, su.last_name, su.email, su.phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Driver d
      JOIN SystemUser su ON d.user_id = su.user_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (filters.availabilityStatus) {
      query += ' AND d.availability_status = ?';
      queryParams.push(filters.availabilityStatus);
    }

    if (filters.isOnline !== undefined) {
      query += ' AND d.is_online = ?';
      queryParams.push(filters.isOnline);
    }

    if (filters.tripType) {
      query += ' AND JSON_CONTAINS(d.preferred_trip_types, ?)';
      queryParams.push(`"${filters.tripType}"`);
    }

    query += ' ORDER BY d.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      queryParams.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      queryParams.push(filters.offset);
    }

    const [results] = await pool.query(query, queryParams);
    return results;
  },

  // Get available drivers for trip
  getAvailableDrivers: async (tripType = null, location = null) => {
    let query = `
      SELECT d.*, 
             su.first_name, su.last_name, su.email, su.phone,
             su.profile_picture, d.current_latitude, d.current_longitude
      FROM Driver d
      JOIN SystemUser su ON d.user_id = su.user_id
      WHERE d.availability_status = 'available' 
        AND d.is_online = true
    `;

    const queryParams = [];

    if (tripType) {
      query += ' AND JSON_CONTAINS(d.preferred_trip_types, ?)';
      queryParams.push(`"${tripType}"`);
    }

    // If location is provided, order by distance (simplified)
    if (location && location.latitude && location.longitude) {
      query += `
        ORDER BY (
          6371 * acos(
            cos(radians(?)) * cos(radians(d.current_latitude)) * 
            cos(radians(d.current_longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(d.current_latitude))
          )
        ) ASC
      `;
      queryParams.push(location.latitude, location.longitude, location.latitude);
    } else {
      query += ' ORDER BY d.updated_at DESC';
    }

    const [results] = await pool.query(query, queryParams);
    return results;
  },

  // Update driver
  updateDriver: async (driverId, updateData) => {
    const allowedFields = [
      'license_number', 'license_expiry', 'mobile', 'emergency_contact',
      'emergency_phone', 'address', 'city', 'state', 'zip_code',
      'preferred_trip_types', 'availability_status', 'is_online',
      'current_latitude', 'current_longitude', 'current_heading',
      'current_speed', 'last_location_update'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(driverId);

    const query = `UPDATE Driver SET ${updateFields.join(', ')} WHERE driver_id = ?`;
    const [result] = await pool.query(query, updateValues);
    return result;
  },

  // Update driver location
  updateDriverLocation: async (driverId, locationData) => {
    const {
      latitude, longitude, heading, speed, accuracy, isOnline
    } = locationData;

    const query = `
      UPDATE Driver 
      SET current_latitude = ?, current_longitude = ?, current_heading = ?,
          current_speed = ?, last_location_update = CURRENT_TIMESTAMP,
          is_online = ?, updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = ?
    `;

    const [result] = await pool.query(query, [
      latitude, longitude, heading, speed, accuracy, isOnline, driverId
    ]);
    return result;
  },

  // Update driver availability
  updateDriverAvailability: async (driverId, availabilityStatus) => {
    const query = `
      UPDATE Driver 
      SET availability_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE driver_id = ?
    `;
    const [result] = await pool.query(query, [availabilityStatus, driverId]);
    return result;
  },

  // Update driver preferences
  updateDriverPreferences: async (driverId, preferences) => {
    const { preferredTripTypes, workingHours, maxDistance } = preferences;

    const query = `
      UPDATE Driver 
      SET preferred_trip_types = ?, working_hours = ?, max_distance = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = ?
    `;

    const [result] = await pool.query(query, [
      JSON.stringify(preferredTripTypes || []),
      workingHours || null,
      maxDistance || null,
      driverId
    ]);
    return result;
  },

  // Get driver statistics
  getDriverStatistics: async (driverId) => {
    const query = `
      SELECT 
        COUNT(t.trip_id) as total_trips,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
        SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as active_trips,
        SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips,
        AVG(t.estimated_cost) as average_earnings,
        SUM(CASE WHEN t.status = 'completed' THEN t.estimated_cost ELSE 0 END) as total_earnings
      FROM Driver d
      LEFT JOIN Trip t ON d.driver_id = t.assigned_driver_id
      WHERE d.driver_id = ?
    `;

    const [results] = await pool.query(query, [driverId]);
    return results[0];
  },

  // Get nearby drivers
  getNearbyDrivers: async (latitude, longitude, radiusKm = 10) => {
    const query = `
      SELECT d.*, 
             su.first_name, su.last_name, su.email, su.phone,
             su.profile_picture,
             (6371 * acos(
               cos(radians(?)) * cos(radians(d.current_latitude)) * 
               cos(radians(d.current_longitude) - radians(?)) + 
               sin(radians(?)) * sin(radians(d.current_latitude))
             )) AS distance
      FROM Driver d
      JOIN SystemUser su ON d.user_id = su.user_id
      WHERE d.availability_status = 'available' 
        AND d.is_online = true
        AND d.current_latitude IS NOT NULL 
        AND d.current_longitude IS NOT NULL
      HAVING distance <= ?
      ORDER BY distance ASC
    `;

    const [results] = await pool.query(query, [latitude, longitude, latitude, radiusKm]);
    return results;
  },

  // Get driver count
  getDriverCount: async (filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM Driver WHERE 1=1';
    const queryParams = [];

    if (filters.availabilityStatus) {
      query += ' AND availability_status = ?';
      queryParams.push(filters.availabilityStatus);
    }

    if (filters.isOnline !== undefined) {
      query += ' AND is_online = ?';
      queryParams.push(filters.isOnline);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0].total;
  }
};

export default DriverModel;
