import SystemUser from "../models/systemUserModel.js";
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await SystemUser.findAllUsers();
    res.status(200).json(users); 
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const findUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    const user = await SystemUser.findUserByEmail(email);
    if (!user || user.length === 0) {
      return res.status(200).json({ exists: false });
    }
    // Return the first user record with exists: true
    res.status(200).json({ 
      exists: true, 
      ...user[0] 
    });
  } catch (error) {
    console.error('Error finding user by email:', error);
    res.status(500).json({ message: 'Error finding user by email', error: error.message });
  }
};

export const addDriver = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const {
      email,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
      preferred_trip_types = ['Casual'] // Default value
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for user with email:', email);

    // Check if user exists by email and get their details
    const [existingUser] = await pool.query(
      'SELECT user_id, role_name, first_name, last_name FROM SystemUser WHERE email = ?',
      [email]
    );

    console.log('Database query result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found. Please register as a user first.' 
      });
    }

    const user_id = existingUser[0].user_id;
    console.log('Found user_id:', user_id);
    
    // Update role to driver if not already
    if (existingUser[0].role_name !== 'driver') {
      console.log('Updating user role to driver');
      await pool.query(
        'UPDATE SystemUser SET role_name = ? WHERE user_id = ?',
        ['driver', user_id]
      );
    }

    // Check if driver record already exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id FROM Driver WHERE user_id = ?',
      [user_id]
    );

    if (existingDriver.length > 0) {
      return res.status(409).json({ 
        message: 'Driver profile already exists for this user.' 
      });
    }

    // Insert into Driver table with all fields
    const driver_id = uuidv4();
    console.log('Inserting driver with ID:', driver_id);
    
    const driverQuery = `
      INSERT INTO Driver (
        driver_id, user_id, mobile, license_no, issuing_date,
        expiry_date, license_type, experience_years, image_url, 
        address, age, availability, preferred_trip_types, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const driverValues = [
      driver_id,
      user_id,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
      'offline', // Default availability
      JSON.stringify(preferred_trip_types) // Store as JSON
    ];
    
    console.log('Driver values to insert:', driverValues);
    
    await pool.query(driverQuery, driverValues);

    // Create initial driver statistics record
    const stat_id = uuidv4();
    const statsQuery = `
      INSERT INTO DriverStatistics (
        stat_id, driver_id, total_trips, completed_trips, 
        total_earnings, average_rating, total_distance
      ) VALUES (?, ?, 0, 0, 0.00, 0.00, 0.00)
    `;
    await pool.query(statsQuery, [stat_id, driver_id]);

    console.log('Driver successfully inserted with statistics');

    res.status(201).json({ 
      message: 'Driver profile successfully added.',
      driver_id: driver_id,
      user_id: user_id,
      driver_name: `${existingUser[0].first_name} ${existingUser[0].last_name}`,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error adding driver - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const updateDriver = async (req, res) => {
  try {
    console.log('Received update request body:', req.body);
    console.log('Request method:', req.method);
    
    const {
      email,
      mobile,
      license_no,
      issuing_date,
      expiry_date,
      license_type,
      experience_years,
      image_url,
      address,
      age,
      preferred_trip_types,
      availability,
      last_location_lat,
      last_location_lng,
      last_location_update
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    console.log('Looking for user with email:', email);

    // Check if user exists by email and get their details
    const [existingUser] = await pool.query(
      'SELECT user_id, role_name, first_name, last_name FROM SystemUser WHERE email = ?',
      [email]
    );

    console.log('Database query result:', existingUser);

    if (existingUser.length === 0) {
      return res.status(404).json({ 
        message: 'User not found. Please register as a user first.' 
      });
    }

    const user_id = existingUser[0].user_id;
    console.log('Found user_id:', user_id);

    // Check if driver record exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id FROM Driver WHERE user_id = ?',
      [user_id]
    );

    if (existingDriver.length === 0) {
      return res.status(404).json({ 
        message: 'Driver profile not found for this user.' 
      });
    }

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    // Handle basic profile fields - only update if provided
    if (mobile !== undefined) {
      updateFields.push('mobile = ?');
      updateValues.push(mobile);
    }
    if (license_no !== undefined) {
      updateFields.push('license_no = ?');
      updateValues.push(license_no);
    }
    if (issuing_date !== undefined) {
      updateFields.push('issuing_date = ?');
      updateValues.push(issuing_date);
    }
    if (expiry_date !== undefined) {
      updateFields.push('expiry_date = ?');
      updateValues.push(expiry_date);
    }
    if (license_type !== undefined) {
      updateFields.push('license_type = ?');
      updateValues.push(license_type);
    }
    if (experience_years !== undefined) {
      updateFields.push('experience_years = ?');
      updateValues.push(experience_years);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(image_url);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (age !== undefined) {
      updateFields.push('age = ?');
      updateValues.push(age);
    }

    // Handle frequently updated fields
    if (preferred_trip_types !== undefined) {
      updateFields.push('preferred_trip_types = ?');
      let tripTypesJson;
      
      // Handle different input formats
      if (Array.isArray(preferred_trip_types)) {
        tripTypesJson = JSON.stringify(preferred_trip_types);
      } else if (typeof preferred_trip_types === 'string') {
        // Check if it's already a JSON string
        try {
          JSON.parse(preferred_trip_types);
          tripTypesJson = preferred_trip_types;
        } catch (e) {
          // If not valid JSON, treat as single value
          tripTypesJson = JSON.stringify([preferred_trip_types]);
        }
      } else {
        // Default fallback
        tripTypesJson = JSON.stringify(['Casual']);
      }
      
      updateValues.push(tripTypesJson);
      console.log('Trip types JSON to save:', tripTypesJson);
    }

    if (availability !== undefined) {
      // Validate availability enum
      const validAvailability = ['available', 'on-trip', 'on-leave', 'offline', 'maintenance'];
      if (!validAvailability.includes(availability)) {
        return res.status(400).json({ 
          message: 'Invalid availability status. Valid values: ' + validAvailability.join(', ')
        });
      }
      updateFields.push('availability = ?');
      updateValues.push(availability);
      updateFields.push('status_updated_at = NOW()');
    }

    // Handle location updates
    if (last_location_lat !== undefined) {
      updateFields.push('last_location_lat = ?');
      updateValues.push(last_location_lat);
    }
    if (last_location_lng !== undefined) {
      updateFields.push('last_location_lng = ?');
      updateValues.push(last_location_lng);
    }
    if (last_location_update !== undefined) {
      updateFields.push('last_location_update = ?');
      updateValues.push(last_location_update);
    }
    
    // If location coordinates are provided, update the timestamp
    if (last_location_lat !== undefined || last_location_lng !== undefined) {
      if (last_location_update === undefined) {
        updateFields.push('last_location_update = NOW()');
      }
    }

    // Check if there are any fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        message: 'No valid fields provided for update.' 
      });
    }

    // Add user_id to WHERE clause
    updateValues.push(user_id);

    // Construct and execute update query
    const updateQuery = `UPDATE Driver SET ${updateFields.join(', ')} WHERE user_id = ?`;
    
    console.log('Update query:', updateQuery);
    console.log('Update values:', updateValues);
    
    const [result] = await pool.query(updateQuery, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Driver profile not found or no changes made.' 
      });
    }

    console.log('Driver successfully updated');

    // Prepare response data
    const responseData = {
      message: 'Driver profile successfully updated.',
      driver_id: existingDriver[0].driver_id,
      user_id: user_id,
      driver_name: `${existingUser[0].first_name} ${existingUser[0].last_name}`,
      updated_fields: Object.keys(req.body).filter(key => key !== 'email')
    };

    // Include updated availability in response if it was changed
    if (availability !== undefined) {
      responseData.availability = availability;
    }

    // Include updated preferences in response if they were changed
    if (preferred_trip_types !== undefined) {
      responseData.preferred_trip_types = Array.isArray(preferred_trip_types) 
        ? preferred_trip_types 
        : (typeof preferred_trip_types === 'string' ? JSON.parse(preferred_trip_types) : preferred_trip_types);
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error('Error updating driver - Full error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const getDriverProfileByEmail = async (req, res) => {
  const { email } = req.query;

  try {
    console.log('Fetching driver profile for email:', email);

    // Check what columns exist in the Driver table
    const [columns] = await pool.query("SHOW COLUMNS FROM Driver");
    const columnNames = columns.map(col => col.Field);
    
    console.log('Available columns in Driver table:', columnNames);

    // Build the base query with required columns
    let selectFields = `
      su.user_id,
      su.first_name, 
      su.last_name, 
      su.email,
      d.driver_id,
      d.mobile,
      d.license_no,
      d.issuing_date,
      d.expiry_date,
      d.license_type,
      d.experience_years,
      d.image_url,
      d.address,
      d.age,
      d.created_at
    `;

    // Conditionally add optional columns if they exist
    const optionalColumns = [
      'availability',
      'preferred_trip_types',
      'last_location_lat',
      'last_location_lng',
      'last_location_update',
      'status_updated_at'
    ];

    optionalColumns.forEach(column => {
      if (columnNames.includes(column)) {
        selectFields += `, d.${column}`;
      }
    });

    const [rows] = await pool.query(
      `SELECT ${selectFields}
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    console.log('Driver profile query result:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No driver profile found for this email.' });
    }

    const driverProfile = rows[0];
    
    // Add default values for missing columns
    if (!columnNames.includes('availability')) {
      driverProfile.availability = 'offline';
    }
    
    if (!columnNames.includes('preferred_trip_types')) {
      driverProfile.preferred_trip_types = ['Casual'];
    } else if (driverProfile.preferred_trip_types) {
      try {
        driverProfile.preferred_trip_types = JSON.parse(driverProfile.preferred_trip_types);
      } catch (error) {
        console.error('Error parsing preferred_trip_types:', error);
        driverProfile.preferred_trip_types = ['Casual'];
      }
    } else {
      driverProfile.preferred_trip_types = ['Casual'];
    }

    // Set default null values for location fields if they don't exist
    if (!columnNames.includes('last_location_lat')) {
      driverProfile.last_location_lat = null;
    }
    
    if (!columnNames.includes('last_location_lng')) {
      driverProfile.last_location_lng = null;
    }
    
    if (!columnNames.includes('last_location_update')) {
      driverProfile.last_location_update = null;
    }
    
    if (!columnNames.includes('status_updated_at')) {
      driverProfile.status_updated_at = null;
    }

    res.status(200).json(driverProfile);
  } catch (err) {
    console.error('Error fetching driver profile:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

export const updateDriverAvailability = async (req, res) => {
  try {
    const { email, availability } = req.body;

    if (!email || !availability) {
      return res.status(400).json({ message: 'Email and availability are required.' });
    }

    // Validate availability enum
    const validAvailability = ['available', 'on-trip', 'on-leave', 'offline', 'maintenance'];
    if (!validAvailability.includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status.' });
    }

    // Get user by email
    const [user] = await pool.query(
      'SELECT user_id FROM SystemUser WHERE email = ? AND role_name = "driver"',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    // Update driver availability
    const [result] = await pool.query(
      'UPDATE Driver SET availability = ?, status_updated_at = NOW() WHERE user_id = ?',
      [availability, user[0].user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Driver profile not found.' });
    }

    res.status(200).json({ 
      message: 'Driver availability updated successfully.',
      availability: availability
    });
  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateDriverLocation = async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;

    if (!email || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Email, latitude, and longitude are required.' });
    }

    // Get user by email
    const [user] = await pool.query(
      'SELECT user_id FROM SystemUser WHERE email = ? AND role_name = "driver"',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    // Update driver location
    const [result] = await pool.query(
      `UPDATE Driver SET 
        last_location_lat = ?, 
        last_location_lng = ?, 
        last_location_update = NOW() 
       WHERE user_id = ?`,
      [latitude, longitude, user[0].user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Driver profile not found.' });
    }

    res.status(200).json({ 
      message: 'Driver location updated successfully.',
      location: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getDriverStatistics = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Get driver statistics
    const [stats] = await pool.query(
      `SELECT 
        ds.total_trips,
        ds.completed_trips,
        ds.total_earnings,
        ds.average_rating,
        ds.total_distance,
        ds.last_updated
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      INNER JOIN DriverStatistics ds ON d.driver_id = ds.driver_id
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    if (stats.length === 0) {
      return res.status(404).json({ message: 'Driver statistics not found.' });
    }

    res.status(200).json(stats[0]);
  } catch (error) {
    console.error('Error fetching driver statistics:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAvailableDriversForTrip = async (req, res) => {
  try {
    const { tripType, passengerCount } = req.query;

    let query = `
      SELECT 
        su.user_id, su.first_name, su.last_name, su.email,
        d.driver_id, d.mobile, d.license_type, d.experience_years,
        d.image_url, d.preferred_trip_types, d.availability,
        d.last_location_lat, d.last_location_lng,
        v.vehicle_id, v.vehicle_type, v.model, v.seating_capacity,
        v.license_plate, v.category, v.availability as vehicle_availability
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      LEFT JOIN Vehicle v ON d.driver_id = v.driver_id
      WHERE su.role_name = 'driver'
        AND d.availability = 'available'
        AND (v.availability = 'Available' OR v.availability IS NULL)
    `;

    const queryParams = [];

    if (passengerCount) {
      query += ' AND (v.seating_capacity >= ? OR v.seating_capacity IS NULL)';
      queryParams.push(parseInt(passengerCount));
    }

    query += ' ORDER BY d.experience_years DESC';

    const [drivers] = await pool.query(query, queryParams);

    // Filter by trip type preferences if specified
    let filteredDrivers = drivers;

    if (tripType) {
      filteredDrivers = drivers.filter(driver => {
        if (!driver.preferred_trip_types) return true; // Include drivers without preferences
        
        try {
          const preferredTypes = JSON.parse(driver.preferred_trip_types);
          return preferredTypes.includes(tripType);
        } catch (error) {
          console.error('Error parsing preferred trip types for driver:', driver.driver_id);
          return true; // Include on error
        }
      });
    }

    // Parse preferred_trip_types for each driver
    filteredDrivers = filteredDrivers.map(driver => ({
      ...driver,
      preferred_trip_types: driver.preferred_trip_types ? 
        JSON.parse(driver.preferred_trip_types) : ['Casual']
    }));

    res.status(200).json({
      success: true,
      data: filteredDrivers
    });

  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available drivers',
      error: error.message
    });
  }
};

// Add these functions to your existing userController.js file

export const updateDriverStatus = async (req, res) => {
  try {
    const { email, status } = req.body;

    if (!email || !status) {
      return res.status(400).json({ message: 'Email and status are required.' });
    }

    // Validate status - you can customize these status values
    const validStatuses = ['available', 'busy', 'offline', 'on-break'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ') });
    }

    // Get user by email
    const [user] = await pool.query(
      'SELECT user_id FROM SystemUser WHERE email = ? AND role_name = "driver"',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    // Update driver status (using availability field since it's closest match in your schema)
    const statusMapping = {
      'available': 'available',
      'busy': 'on-trip',
      'offline': 'offline',
      'on-break': 'on-leave'
    };

    const [result] = await pool.query(
      'UPDATE Driver SET availability = ?, status_updated_at = NOW() WHERE user_id = ?',
      [statusMapping[status], user[0].user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Driver profile not found.' });
    }

    res.status(200).json({ 
      message: 'Driver status updated successfully.',
      status: status,
      availability: statusMapping[status]
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getDriverStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Get driver status
    const [driver] = await pool.query(
      `SELECT 
        d.availability,
        d.status_updated_at,
        d.last_location_update,
        su.first_name,
        su.last_name
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    // Map availability back to status
    const availabilityToStatus = {
      'available': 'available',
      'on-trip': 'busy',
      'offline': 'offline',
      'on-leave': 'on-break',
      'maintenance': 'offline'
    };

    const driverData = driver[0];
    const status = availabilityToStatus[driverData.availability] || 'offline';

    res.status(200).json({
      status: status,
      availability: driverData.availability,
      last_updated: driverData.status_updated_at,
      last_location_update: driverData.last_location_update,
      driver_name: `${driverData.first_name} ${driverData.last_name}`
    });
  } catch (error) {
    console.error('Error fetching driver status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getDriverLocation = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Get driver location
    const [driver] = await pool.query(
      `SELECT 
        d.last_location_lat,
        d.last_location_lng,
        d.last_location_update,
        d.availability,
        su.first_name,
        su.last_name
      FROM SystemUser su 
      INNER JOIN Driver d ON su.user_id = d.user_id 
      WHERE su.email = ? AND su.role_name = 'driver'`,
      [email]
    );

    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const driverData = driver[0];

    res.status(200).json({
      lat: driverData.last_location_lat,
      lng: driverData.last_location_lng,
      last_updated: driverData.last_location_update,
      availability: driverData.availability,
      driver_name: `${driverData.first_name} ${driverData.last_name}`,
      has_location: !!(driverData.last_location_lat && driverData.last_location_lng)
    });
  } catch (error) {
    console.error('Error fetching driver location:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      return res.status(400).json({ message: 'Invalid latitude, longitude, or radius values.' });
    }

    // Query to find nearby drivers using Haversine formula
    // This calculates the distance between two points on Earth using latitude and longitude
    const query = `
      SELECT 
        su.user_id,
        su.first_name,
        su.last_name,
        su.email,
        d.driver_id,
        d.mobile,
        d.license_type,
        d.experience_years,
        d.image_url,
        d.availability,
        d.last_location_lat,
        d.last_location_lng,
        d.last_location_update,
        d.preferred_trip_types,
        v.vehicle_id,
        v.vehicle_type,
        v.model,
        v.seating_capacity,
        v.license_plate,
        v.category,
        (
          6371 * acos(
            cos(radians(?)) * 
            cos(radians(d.last_location_lat)) * 
            cos(radians(d.last_location_lng) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(d.last_location_lat))
          )
        ) AS distance_km
      FROM SystemUser su
      INNER JOIN Driver d ON su.user_id = d.user_id
      LEFT JOIN Vehicle v ON d.driver_id = v.driver_id
      WHERE su.role_name = 'driver'
        AND d.availability = 'available'
        AND d.last_location_lat IS NOT NULL
        AND d.last_location_lng IS NOT NULL
        AND (v.availability = 'Available' OR v.availability IS NULL)
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
      LIMIT 20
    `;

    const [nearbyDrivers] = await pool.query(query, [
      latitude, longitude, latitude, searchRadius
    ]);

    // Process the results
    const processedDrivers = nearbyDrivers.map(driver => {
      let preferredTripTypes = ['Casual']; // Default value
      
      if (driver.preferred_trip_types) {
        try {
          preferredTripTypes = JSON.parse(driver.preferred_trip_types);
        } catch (error) {
          console.error('Error parsing preferred trip types for driver:', driver.driver_id);
        }
      }

      return {
        ...driver,
        preferred_trip_types: preferredTripTypes,
        distance_km: Math.round(driver.distance_km * 100) / 100, // Round to 2 decimal places
        location: {
          lat: driver.last_location_lat,
          lng: driver.last_location_lng,
          last_updated: driver.last_location_update
        }
      };
    });

    res.status(200).json({
      success: true,
      search_params: {
        center: { lat: latitude, lng: longitude },
        radius_km: searchRadius
      },
      total_found: processedDrivers.length,
      drivers: processedDrivers
    });

  } catch (error) {
    console.error('Error fetching nearby drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby drivers',
      error: error.message
    });
  }
};



// Update driver availability (by tour operator)
export const updateDriverAvailabilityByAdmin = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { availability, reason } = req.body;

    // Validate availability status
    const validStatuses = ['available', 'on-trip', 'on-leave', 'offline', 'maintenance'];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({ 
        message: 'Invalid availability status',
        validStatuses 
      });
    }

    // Check if driver exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id, user_id FROM Driver WHERE driver_id = ?',
      [driverId]
    );

    if (existingDriver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update driver availability
    const [result] = await pool.query(
      `UPDATE Driver 
       SET availability = ?, 
           status_updated_at = NOW() 
       WHERE driver_id = ?`,
      [availability, driverId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to update driver availability' });
    }

    res.status(200).json({
      success: true,
      message: `Driver availability updated to ${availability}`,
      data: {
        driver_id: driverId,
        availability,
        reason: reason || 'Updated by tour operator',
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Update driver trip preferences (by tour operator)
export const updateDriverPreferences = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { preferred_trip_types, notes } = req.body;

    // Validate trip types
    const validTripTypes = ['Luxury', 'Safari', 'Tour', 'Adventure', 'Casual', 'Cultural', 'Business', 'Airport'];
    
    if (!Array.isArray(preferred_trip_types)) {
      return res.status(400).json({ 
        message: 'preferred_trip_types must be an array',
        validTripTypes 
      });
    }

    const invalidTypes = preferred_trip_types.filter(type => !validTripTypes.includes(type));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ 
        message: `Invalid trip types: ${invalidTypes.join(', ')}`,
        validTripTypes 
      });
    }

    // Check if driver exists
    const [existingDriver] = await pool.query(
      'SELECT driver_id FROM Driver WHERE driver_id = ?',
      [driverId]
    );

    if (existingDriver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update driver preferences
    const [result] = await pool.query(
      `UPDATE Driver 
       SET preferred_trip_types = ? 
       WHERE driver_id = ?`,
      [JSON.stringify(preferred_trip_types), driverId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to update driver preferences' });
    }

    res.status(200).json({
      success: true,
      message: 'Driver preferences updated successfully',
      data: {
        driver_id: driverId,
        preferred_trip_types,
        notes: notes || 'Updated by tour operator',
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating driver preferences:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Search drivers with filters (optional - for advanced searching)
export const searchDrivers = async (req, res) => {
  try {
    const { 
      availability, 
      tripType, 
      experience_min, 
      experience_max,
      location_radius,
      lat,
      lng,
      search 
    } = req.query;

    let query = `
      SELECT 
        d.driver_id,
        d.user_id,
        su.first_name,
        su.last_name,
        su.email,
        su.mobile,
        d.license_type,
        d.experience_years,
        d.availability,
        d.preferred_trip_types,
        d.last_location_lat,
        d.last_location_lng,
        ds.completed_trips,
        ds.average_rating
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      LEFT JOIN DriverStatistics ds ON d.driver_id = ds.driver_id
      WHERE su.role_name = 'driver'
    `;

    const queryParams = [];

    // Add filters
    if (availability) {
      query += ' AND d.availability = ?';
      queryParams.push(availability);
    }

    if (tripType) {
      query += ' AND JSON_CONTAINS(d.preferred_trip_types, ?)';
      queryParams.push(`"${tripType}"`);
    }

    if (experience_min) {
      query += ' AND d.experience_years >= ?';
      queryParams.push(parseInt(experience_min));
    }

    if (experience_max) {
      query += ' AND d.experience_years <= ?';
      queryParams.push(parseInt(experience_max));
    }

    if (search) {
      query += ' AND (su.first_name LIKE ? OR su.last_name LIKE ? OR su.email LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Location-based search (if lat, lng, and radius provided)
    if (lat && lng && location_radius) {
      query += ` AND (
        6371 * acos(
          cos(radians(?)) * cos(radians(d.last_location_lat)) *
          cos(radians(d.last_location_lng) - radians(?)) +
          sin(radians(?)) * sin(radians(d.last_location_lat))
        )
      ) <= ?`;
      queryParams.push(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(location_radius));
    }

    query += ' ORDER BY ds.average_rating DESC, d.experience_years DESC';

    const [drivers] = await pool.query(query, queryParams);

    // Process preferred_trip_types for each driver
    const processedDrivers = drivers.map(driver => {
      let preferredTripTypes = ['Casual'];
      if (driver.preferred_trip_types) {
        try {
          preferredTripTypes = JSON.parse(driver.preferred_trip_types);
        } catch (error) {
          console.error('Error parsing preferred trip types:', error);
        }
      }
      return {
        ...driver,
        preferred_trip_types: preferredTripTypes
      };
    });

    res.status(200).json({
      success: true,
      data: processedDrivers,
      filters_applied: {
        availability,
        tripType,
        experience_range: experience_min || experience_max ? `${experience_min || 0}-${experience_max || '∞'}` : null,
        location_search: lat && lng ? { lat, lng, radius: location_radius } : null,
        search_term: search
      }
    });

  } catch (error) {
    console.error('Error searching drivers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAllDriversDetailed = async (req, res) => {
  try {
    const { page = 1, limit = 20, availability, tripType, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        d.driver_id,
        d.user_id,
        su.first_name,
        su.last_name,
        su.email,
        su.image_url,
        d.mobile,
        d.license_type,
        d.license_no,
        d.experience_years,
        d.availability,
        d.preferred_trip_types,
        d.last_location_lat,
        d.last_location_lng,
        d.last_location_update,
        d.address,
        d.age,
        ds.completed_trips,
        ds.total_earnings,
        ds.average_rating,
        ds.total_trips
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      LEFT JOIN DriverStatistics ds ON d.driver_id = ds.driver_id
      WHERE su.role_name = 'driver'
    `;

    const queryParams = [];

    // Add filters
    if (availability) {
      query += ' AND d.availability = ?';
      queryParams.push(availability);
    }

    if (tripType) {
      query += ' AND JSON_CONTAINS(d.preferred_trip_types, ?)';
      queryParams.push(`"${tripType}"`);
    }

    if (search) {
      query += ' AND (su.first_name LIKE ? OR su.last_name LIKE ? OR su.email LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY su.first_name, su.last_name';
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [drivers] = await pool.query(query, queryParams);

    // Process preferred_trip_types for each driver
    const processedDrivers = drivers.map(driver => {
      let preferredTripTypes = ['Casual'];
      if (driver.preferred_trip_types) {
        try {
          preferredTripTypes = JSON.parse(driver.preferred_trip_types);
        } catch (error) {
          console.error('Error parsing preferred trip types:', error);
        }
      }
      return {
        ...driver,
        preferred_trip_types: preferredTripTypes
      };
    });

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      WHERE su.role_name = 'driver'
    `;
    
    const countParams = [];
    if (availability) {
      countQuery += ' AND d.availability = ?';
      countParams.push(availability);
    }
    if (tripType) {
      countQuery += ' AND JSON_CONTAINS(d.preferred_trip_types, ?)';
      countParams.push(`"${tripType}"`);
    }
    if (search) {
      countQuery += ' AND (su.first_name LIKE ? OR su.last_name LIKE ? OR su.email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: processedDrivers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get driver by ID (for tour operators)
export const getDriverById = async (req, res) => {
  try {
    const { driverId } = req.params;

    const [driver] = await pool.query(`
      SELECT 
        d.driver_id,
        d.user_id,
        su.first_name,
        su.last_name,
        su.email,
        su.image_url,
        d.mobile,
        d.license_type,
        d.license_no,
        d.experience_years,
        d.availability,
        d.preferred_trip_types,
        d.last_location_lat,
        d.last_location_lng,
        d.last_location_update,
        d.address,
        d.age,
        d.issuing_date,
        d.expiry_date,
        ds.completed_trips,
        ds.total_earnings,
        ds.average_rating,
        ds.total_trips,
        ds.total_distance
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      LEFT JOIN DriverStatistics ds ON d.driver_id = ds.driver_id
      WHERE d.driver_id = ? AND su.role_name = 'driver'
    `, [driverId]);

    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driverData = driver[0];
    
    // Parse preferred trip types
    let preferredTripTypes = ['Casual'];
    if (driverData.preferred_trip_types) {
      try {
        preferredTripTypes = JSON.parse(driverData.preferred_trip_types);
      } catch (error) {
        console.error('Error parsing preferred trip types:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...driverData,
        preferred_trip_types: preferredTripTypes
      }
    });

  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAvailableDriversByTripType = async (req, res) => {
  try {
    const { tripType } = req.query;
    if (!tripType) {
      return res.status(400).json({ message: 'tripType is required.' });
    }

    const query = `
      SELECT 
        d.driver_id,
        d.user_id,
        su.first_name,
        su.last_name,
        su.email,
        d.availability,
        d.preferred_trip_types
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      WHERE su.role_name = 'driver'
        AND d.availability = 'available'
        AND JSON_CONTAINS(d.preferred_trip_types, ?)
    `;
    const [drivers] = await pool.query(query, [`"${tripType}"`]);

    // Parse preferred_trip_types for each driver
    const processedDrivers = drivers.map(driver => {
      let preferredTripTypes = ['Casual'];
      if (driver.preferred_trip_types) {
        try {
          preferredTripTypes = JSON.parse(driver.preferred_trip_types);
        } catch {}
      }
      return {
        ...driver,
        preferred_trip_types: preferredTripTypes
      };
    });

    res.status(200).json({ success: true, data: processedDrivers });
  } catch (error) {
    console.error('Error fetching available drivers by trip type:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

