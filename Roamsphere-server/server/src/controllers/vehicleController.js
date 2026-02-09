import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

export const addVehicle = async (req, res) => {
  try {
    console.log('Received vehicle request body:', req.body);
    
    const {
      email,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (category && category.length > 50) {
      return res.status(400).json({ message: 'Category too long (max 50 chars)' });
    }

    console.log('Looking for user with email:', email);

    // First check if user exists in SystemUser table
    const [existingUser] = await pool.query(
      `SELECT user_id, first_name, last_name, role_name, email 
       FROM SystemUser 
       WHERE email = ?`,
      [email]
    );

    console.log('Database query result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found. Please register first.' 
      });
    }

    const user = existingUser[0];
    const { user_id, role_name } = user;

    // Check if user has appropriate role
    const allowedRoles = ['driver', 'admin', 'super-admin', 'tour-operator'];
    if (!allowedRoles.includes(role_name)) {
      return res.status(403).json({ 
        message: 'Only drivers, admins, and tour operators can have vehicle profiles.' 
      });
    }

    let driver_id;

    // Handle driver_id based on role
    if (role_name === 'driver') {
      const [driverData] = await pool.query(
        'SELECT driver_id FROM Driver WHERE user_id = ?',
        [user_id]
      );
      
      if (driverData.length === 0) {
        return res.status(404).json({ 
          message: 'Driver profile not found. Please complete driver registration first.' 
        });
      }
      
      driver_id = driverData[0].driver_id;
    } else {
      // For admin/tour-operator, check if they have a driver profile, if not create one
      const [existingDriver] = await pool.query(
        'SELECT driver_id FROM Driver WHERE user_id = ?',
        [user_id]
      );
      
      if (existingDriver.length > 0) {
        driver_id = existingDriver[0].driver_id;
      } else {
        // Create a driver profile for admin/tour-operator
        driver_id = uuidv4();
        await pool.query(
          'INSERT INTO Driver (driver_id, user_id, created_at) VALUES (?, ?, NOW())',
          [driver_id, user_id]
        );
        console.log('Created driver profile for admin/tour-operator:', driver_id);
      }
    }

    console.log('Using driver_id:', driver_id);

    // Check if vehicle record already exists for this driver
    const [existingVehicle] = await pool.query(
      'SELECT vehicle_id FROM Vehicle WHERE driver_id = ?',
      [driver_id]
    );

    if (existingVehicle.length > 0) {
      return res.status(409).json({ 
        message: 'Vehicle profile already exists for this user.' 
      });
    }

    // Insert into Vehicle table
    const vehicle_id = uuidv4();
    console.log('Inserting vehicle with ID:', vehicle_id);
    
    const vehicleQuery = `
      INSERT INTO Vehicle (
        vehicle_id, driver_id, vehicle_type, model, year, seating_capacity,
        color, ownership, registration_province, license_plate, chassis_no,
        registration_date, expiry_date, insurance, category, image_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const vehicleValues = [
      vehicle_id,
      driver_id,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    ];
    
    console.log('Vehicle values to insert:', vehicleValues);
    
    await pool.query(vehicleQuery, vehicleValues);

    console.log('Vehicle successfully inserted');

    res.status(201).json({ 
      message: 'Vehicle profile successfully added.',
      vehicle_id: vehicle_id,
      user_name: `${user.first_name} ${user.last_name}`,
      role: role_name
    });
  } catch (err) {
    console.error('Error adding vehicle - Full error:', err);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    console.log('Received vehicle update request body:', req.body);
    
    const {
      email,
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (category && category.length > 50) {
      return res.status(400).json({ message: 'Category too long (max 50 chars)' });
    }

    console.log('Looking for user with email:', email);

    // Get user and driver information
    const [userData] = await pool.query(
      `SELECT su.user_id, su.first_name, su.last_name, su.role_name, d.driver_id
       FROM SystemUser su
       LEFT JOIN Driver d ON su.user_id = d.user_id
       WHERE su.email = ?`,
      [email]
    );

    if (userData.length === 0) {
      return res.status(404).json({ 
        message: 'User not found.' 
      });
    }

    const user = userData[0];
    const driver_id = user.driver_id;

    if (!driver_id) {
      return res.status(404).json({ 
        message: 'No driver profile found for this user.' 
      });
    }

    console.log('Found driver_id:', driver_id);

    // Check if vehicle record exists
    const [existingVehicle] = await pool.query(
      'SELECT vehicle_id FROM Vehicle WHERE driver_id = ?',
      [driver_id]
    );

    if (existingVehicle.length === 0) {
      return res.status(404).json({ 
        message: 'Vehicle profile not found for this user.' 
      });
    }

    // Update vehicle record
    const updateQuery = `
      UPDATE Vehicle SET 
        vehicle_type = ?, model = ?, year = ?, seating_capacity = ?,
        color = ?, ownership = ?, registration_province = ?, license_plate = ?,
        chassis_no = ?, registration_date = ?, expiry_date = ?, insurance = ?,
        category = ?, image_url = ?
      WHERE driver_id = ?
    `;
    const updateValues = [
      vehicle_type,
      model,
      year,
      seating_capacity,
      color,
      ownership,
      registration_province,
      license_plate,
      chassis_no,
      registration_date,
      expiry_date,
      insurance,
      category,
      image_url,
      driver_id
    ];
    
    console.log('Vehicle values to update:', updateValues);
    
    const [result] = await pool.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Vehicle profile not found or no changes made.' 
      });
    }

    console.log('Vehicle successfully updated');

    res.status(200).json({ 
      message: 'Vehicle profile successfully updated.',
      vehicle_id: existingVehicle[0].vehicle_id,
      user_name: `${user.first_name} ${user.last_name}`
    });
  } catch (err) {
    console.error('Error updating vehicle - Full error:', err);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getVehicleProfileByEmail = async (req, res) => {
  const { email } = req.query;

  try {
    console.log('Fetching vehicle profile for email:', email);

    const [rows] = await pool.query(
      `SELECT 
        v.vehicle_id,
        v.vehicle_type,
        v.model,
        v.year,
        v.seating_capacity,
        v.color,
        v.ownership,
        v.registration_province,
        v.license_plate,
        v.chassis_no,
        v.registration_date,
        v.expiry_date,
        v.insurance,
        v.category,
        v.image_url,
        v.created_at,
        su.first_name,
        su.last_name,
        su.email,
        su.role_name
      FROM Vehicle v
      INNER JOIN Driver d ON v.driver_id = d.driver_id
      INNER JOIN SystemUser su ON d.user_id = su.user_id 
      WHERE su.email = ?`,
      [email]
    );

    console.log('Vehicle profile query result:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No vehicle profile found for this email.' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching vehicle profile:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    console.log('Fetching all vehicles...');

    const [rows] = await pool.query(`
      SELECT 
        v.vehicle_id,
        v.vehicle_type,
        v.model,
        v.year,
        v.seating_capacity,
        v.color,
        v.ownership,
        v.registration_province,
        v.license_plate,
        v.chassis_no,
        v.registration_date,
        v.expiry_date,
        v.insurance,
        v.category,
        v.image_url,
        v.created_at,
        su.first_name,
        su.last_name,
        su.email,
        d.mobile
      FROM Vehicle v
      INNER JOIN Driver d ON v.driver_id = d.driver_id
      INNER JOIN SystemUser su ON d.user_id = su.user_id 
      WHERE su.role_name IN ('driver', 'admin', 'super-admin', 'tour-operator')
      ORDER BY v.created_at DESC
    `);

    console.log(`Found ${rows.length} vehicles`);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching all vehicles:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateVehicleAvailability = async (req, res) => {
  const { vehicleId } = req.params;
  const { availability } = req.body;
  try {
    const allowedStatuses = ['Available', 'Unavailable', 'Maintenance', 'Booked'];
    if (!allowedStatuses.includes(availability)) {
      return res.status(400).json({ error: 'Invalid availability status.' });
    }
    await pool.query(
      'UPDATE Vehicle SET availability = ? WHERE vehicle_id = ?',
      [availability, vehicleId]
    );
    res.json({ success: true, vehicleId, availability });
  } catch (error) {
    console.error('Failed to update vehicle availability:', error.message);
    res.status(500).json({ error: 'Failed to update vehicle availability.' });
  }
};

export const getAvailableVehicles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Vehicle WHERE availability = 'Available'"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available vehicles.' });
  }
};