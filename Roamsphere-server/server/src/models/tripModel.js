import { pool } from '../config/db.js';

const TripModel = {
  // Create a new trip
  createTrip: async (tripData) => {
    const {
      tripId, customerId, title, category, origin, destination, stops,
      preferredDate, preferredTime, returnDate, returnTime,
      passengerCount, passengerNames, contactName, contactPhone, contactEmail,
      vehicleType, specialRequirements, budget, notes
    } = tripData;

    const query = `
      INSERT INTO Trip (
        trip_id, customer_id, title, category, origin, destination, stops,
        preferred_date, preferred_time, return_date, return_time,
        passenger_count, passenger_names, contact_name, contact_phone, contact_email,
        vehicle_type, special_requirements, budget, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const values = [
      tripId, customerId, title, category, origin, destination, stops || null,
      preferredDate, preferredTime, returnDate || null, returnTime || null,
      passengerCount || 1, passengerNames || null, contactName, contactPhone, contactEmail,
      vehicleType || null, specialRequirements || null, budget || null, notes || null
    ];

    const [result] = await pool.query(query, values);
    return result;
  },

  // Get trip by ID
  getTripById: async (tripId) => {
    const query = `
      SELECT t.*, 
             cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.email as customer_email, c.phone as customer_phone,
             d.driver_id, d.user_id as driver_user_id, 
             du.first_name as driver_first_name, du.last_name as driver_last_name,
             d.mobile as driver_mobile, d.license_number,
             v.vehicle_id, v.model as vehicle_model, v.license_plate as vehicle_plate,
             v.seating_capacity, v.color as vehicle_color, v.year as vehicle_year
      FROM Trip t
      JOIN Customer c ON t.customer_id = c.customer_id
      JOIN SystemUser cu ON c.user_id = cu.user_id
      LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
      LEFT JOIN SystemUser du ON d.user_id = du.user_id
      LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
      WHERE t.trip_id = ?
    `;
    const [results] = await pool.query(query, [tripId]);
    return results[0];
  },

  // Get trips by customer ID
  getTripsByCustomer: async (customerId, filters = {}) => {
    let query = `
      SELECT t.*, 
             d.user_id as driver_user_id, du.first_name as driver_first_name, 
             du.last_name as driver_last_name, d.mobile as driver_mobile,
             v.model as vehicle_model, v.license_plate as vehicle_plate,
             v.seating_capacity, v.color as vehicle_color
      FROM Trip t
      LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
      LEFT JOIN SystemUser du ON d.user_id = du.user_id
      LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
      WHERE t.customer_id = ?
    `;

    const queryParams = [customerId];

    if (filters.status) {
      query += ' AND t.status = ?';
      queryParams.push(filters.status);
    }

    query += ' ORDER BY t.created_at DESC';

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

  // Get all trips for admin/tour operator
  getAllTrips: async (filters = {}) => {
    let query = `
      SELECT t.*, 
             cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.email as customer_email, c.phone as customer_phone,
             d.user_id as driver_user_id, du.first_name as driver_first_name, 
             du.last_name as driver_last_name, d.mobile as driver_mobile,
             v.model as vehicle_model, v.license_plate as vehicle_plate,
             v.seating_capacity, v.color as vehicle_color
      FROM Trip t
      JOIN Customer c ON t.customer_id = c.customer_id
      JOIN SystemUser cu ON c.user_id = cu.user_id
      LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
      LEFT JOIN SystemUser du ON d.user_id = du.user_id
      LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (filters.status) {
      query += ' AND t.status = ?';
      queryParams.push(filters.status);
    }

    if (filters.category) {
      query += ' AND t.category = ?';
      queryParams.push(filters.category);
    }

    if (filters.startDate) {
      query += ' AND t.preferred_date >= ?';
      queryParams.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND t.preferred_date <= ?';
      queryParams.push(filters.endDate);
    }

    query += ' ORDER BY t.created_at DESC';

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

  // Update trip
  updateTrip: async (tripId, updateData) => {
    const allowedFields = [
      'title', 'category', 'origin', 'destination', 'stops',
      'preferred_date', 'preferred_time', 'return_date', 'return_time',
      'passenger_count', 'passenger_names', 'contact_name', 'contact_phone', 'contact_email',
      'vehicle_type', 'special_requirements', 'budget', 'notes', 'status',
      'assigned_driver_id', 'assigned_vehicle_id', 'estimated_cost'
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
    updateValues.push(tripId);

    const query = `UPDATE Trip SET ${updateFields.join(', ')} WHERE trip_id = ?`;
    const [result] = await pool.query(query, updateValues);
    return result;
  },

  // Assign trip to driver and vehicle
  assignTrip: async (tripId, driverId, vehicleId, estimatedCost) => {
    const query = `
      UPDATE Trip 
      SET assigned_driver_id = ?, assigned_vehicle_id = ?, 
          estimated_cost = ?, status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = ?
    `;
    const [result] = await pool.query(query, [driverId, vehicleId, estimatedCost, tripId]);
    return result;
  },

  // Get trip statistics
  getTripStatistics: async (customerId = null) => {
    let query = `
      SELECT 
        COUNT(*) as total_trips,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_trips,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_trips,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as active_trips,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips
      FROM Trip
    `;

    const queryParams = [];

    if (customerId) {
      query += ' WHERE customer_id = ?';
      queryParams.push(customerId);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0];
  },

  // Get trips by driver ID
  getTripsByDriver: async (driverId, filters = {}) => {
    let query = `
      SELECT t.*, 
             cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
             cu.email as customer_email, c.phone as customer_phone,
             v.model as vehicle_model, v.license_plate as vehicle_plate,
             v.seating_capacity, v.color as vehicle_color
      FROM Trip t
      JOIN Customer c ON t.customer_id = c.customer_id
      JOIN SystemUser cu ON c.user_id = cu.user_id
      LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
      WHERE t.assigned_driver_id = ?
    `;

    const queryParams = [driverId];

    if (filters.status) {
      query += ' AND t.status = ?';
      queryParams.push(filters.status);
    }

    query += ' ORDER BY t.preferred_date ASC, t.preferred_time ASC';

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

  // Update trip status
  updateTripStatus: async (tripId, status) => {
    const query = `
      UPDATE Trip 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE trip_id = ?
    `;
    const [result] = await pool.query(query, [status, tripId]);
    return result;
  },

  // Get trip count
  getTripCount: async (filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM Trip WHERE 1=1';
    const queryParams = [];

    if (filters.customerId) {
      query += ' AND customer_id = ?';
      queryParams.push(filters.customerId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      queryParams.push(filters.status);
    }

    if (filters.driverId) {
      query += ' AND assigned_driver_id = ?';
      queryParams.push(filters.driverId);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0].total;
  }
};

export default TripModel;
