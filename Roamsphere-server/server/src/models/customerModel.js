import { pool } from '../config/db.js';

const CustomerModel = {
  // Create a new customer
  createCustomer: async (customerData) => {
    const {
      customerId, userId, phone, address, city, state,
      zipCode, emergencyContact, emergencyPhone, preferences,
      verificationStatus, isActive
    } = customerData;

    const query = `
      INSERT INTO Customer (
        customer_id, user_id, phone, address, city, state,
        zip_code, emergency_contact, emergency_phone, preferences,
        verification_status, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const values = [
      customerId, userId, phone, address, city, state,
      zipCode, emergencyContact, emergencyPhone, JSON.stringify(preferences || {}),
      verificationStatus || 'pending', isActive !== false
    ];

    const [result] = await pool.query(query, values);
    return result;
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    const query = `
      SELECT c.*, 
             su.first_name, su.last_name, su.email, su.phone as user_phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Customer c
      JOIN SystemUser su ON c.user_id = su.user_id
      WHERE c.customer_id = ?
    `;
    const [results] = await pool.query(query, [customerId]);
    return results[0];
  },

  // Get customer by user ID
  getCustomerByUserId: async (userId) => {
    const query = `
      SELECT c.*, 
             su.first_name, su.last_name, su.email, su.phone as user_phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Customer c
      JOIN SystemUser su ON c.user_id = su.user_id
      WHERE c.user_id = ?
    `;
    const [results] = await pool.query(query, [userId]);
    return results[0];
  },

  // Get all customers
  getAllCustomers: async (filters = {}) => {
    let query = `
      SELECT c.*, 
             su.first_name, su.last_name, su.email, su.phone as user_phone,
             su.profile_picture, su.date_of_birth, su.gender
      FROM Customer c
      JOIN SystemUser su ON c.user_id = su.user_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (filters.verificationStatus) {
      query += ' AND c.verification_status = ?';
      queryParams.push(filters.verificationStatus);
    }

    if (filters.isActive !== undefined) {
      query += ' AND c.is_active = ?';
      queryParams.push(filters.isActive);
    }

    if (filters.city) {
      query += ' AND c.city = ?';
      queryParams.push(filters.city);
    }

    query += ' ORDER BY c.created_at DESC';

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

  // Update customer
  updateCustomer: async (customerId, updateData) => {
    const allowedFields = [
      'phone', 'address', 'city', 'state', 'zip_code',
      'emergency_contact', 'emergency_phone', 'preferences',
      'verification_status', 'is_active'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        if (field === 'preferences') {
          updateFields.push(`${field} = ?`);
          updateValues.push(JSON.stringify(updateData[field]));
        } else {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(customerId);

    const query = `UPDATE Customer SET ${updateFields.join(', ')} WHERE customer_id = ?`;
    const [result] = await pool.query(query, updateValues);
    return result;
  },

  // Update customer verification status
  updateVerificationStatus: async (customerId, verificationStatus) => {
    const query = `
      UPDATE Customer 
      SET verification_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE customer_id = ?
    `;
    const [result] = await pool.query(query, [verificationStatus, customerId]);
    return result;
  },

  // Get customer statistics
  getCustomerStatistics: async (customerId = null) => {
    let query = `
      SELECT 
        COUNT(*) as total_customers,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_customers,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_customers,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_customers,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_customers,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_customers
      FROM Customer
    `;

    const queryParams = [];

    if (customerId) {
      query = `
        SELECT 
          COUNT(t.trip_id) as total_trips,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
          SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips,
          SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as active_trips,
          AVG(t.estimated_cost) as average_trip_cost,
          SUM(CASE WHEN t.status = 'completed' THEN t.estimated_cost ELSE 0 END) as total_spent
        FROM Customer c
        LEFT JOIN Trip t ON c.customer_id = t.customer_id
        WHERE c.customer_id = ?
      `;
      queryParams.push(customerId);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0];
  },

  // Get customer trip history
  getCustomerTripHistory: async (customerId, filters = {}) => {
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

  // Get customer count
  getCustomerCount: async (filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM Customer WHERE 1=1';
    const queryParams = [];

    if (filters.verificationStatus) {
      query += ' AND verification_status = ?';
      queryParams.push(filters.verificationStatus);
    }

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      queryParams.push(filters.isActive);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0].total;
  },

  // Search customers
  searchCustomers: async (searchTerm) => {
    const query = `
      SELECT c.*, 
             su.first_name, su.last_name, su.email, su.phone as user_phone
      FROM Customer c
      JOIN SystemUser su ON c.user_id = su.user_id
      WHERE (
        su.first_name LIKE ? OR 
        su.last_name LIKE ? OR 
        su.email LIKE ? OR 
        c.phone LIKE ? OR
        CONCAT(su.first_name, ' ', su.last_name) LIKE ?
      )
      ORDER BY c.created_at DESC
    `;

    const searchPattern = `%${searchTerm}%`;
    const [results] = await pool.query(query, [
      searchPattern, searchPattern, searchPattern, searchPattern, searchPattern
    ]);
    return results;
  }
};

export default CustomerModel;
