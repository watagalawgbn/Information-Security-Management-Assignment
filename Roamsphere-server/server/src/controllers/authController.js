import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendInvitationEmail } from '../config/nodemailer.js';

// Helper function to check if a user already exists by email or username
const checkUserExistence = async (email, userName) => {
  const [result] = await pool.query(`SELECT * FROM SystemUser WHERE email = ? OR user_name = ?`, [email, userName]);
  return result.length > 0; 
};

// Profile creation
const createProfile = async (req, res) => {
  const { firstName, lastName, email, role } = req.body;

  // Validate role
  if (!['super-admin', 'admin', 'tour-operator', 'driver'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    // Check for existing user
    const userName = email.split('@')[0]; 
    const userExists = await checkUserExistence(email, userName);
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists.' });
    }

    // Generate a random temporary password (plain text)
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // Define the user query
    const userQuery = `
      INSERT INTO SystemUser (user_id, first_name, last_name, user_name, password, role_name, email)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?)
    `;

    // Insert user into the database with plain text password
    await pool.query(userQuery, [firstName, lastName, userName, temporaryPassword, role, email]);

    // Send invitation email with the temporary password
    await sendInvitationEmail(email, `${firstName} ${lastName}, Your temporary password is: ${temporaryPassword}`);

    res.status(200).json({ 
      message: 'User profile created and invitation sent.',
      temporaryPassword: temporaryPassword // Include in response for testing
    });
  } catch (error) {
    console.error('Error creating user profile:', error.message);
    res.status(500).json({ message: 'Failed to create user profile.', error: error.message });
  }
};

// Modified signup function - More flexible user lookup
const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email and password are required.' });
  }

  // Split fullName properly
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  console.log('Signup attempt:', { firstName, lastName, email, password });

  try {
    // More flexible user lookup - try different combinations
    let user = null;
    let userQuery = null;
    
    // Try 1: Exact first name, last name, email match
    const [exactMatch] = await pool.query(
      `SELECT * FROM SystemUser WHERE first_name = ? AND last_name = ? AND email = ?`, 
      [firstName, lastName, email]
    );
    
    if (exactMatch.length > 0) {
      user = exactMatch[0];
      console.log('Found user with exact name match');
    } else {
      // Try 2: Just email match (more lenient)
      const [emailMatch] = await pool.query(
        `SELECT * FROM SystemUser WHERE email = ?`, 
        [email]
      );
      
      if (emailMatch.length > 0) {
        user = emailMatch[0];
        console.log('Found user with email match only');
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please contact admin for account creation.' });
    }

    console.log('User found:', { 
      id: user.user_id, 
      dbName: `${user.first_name} ${user.last_name}`,
      inputName: fullName,
      dbPassword: user.password,
      inputPassword: password
    });

    // Check if password matches OR if this is first signup (update password)
    if (user.password !== password) {
      // This might be first signup - update their password
      await pool.query(
        `UPDATE SystemUser SET password = ? WHERE user_id = ?`,
        [password, user.user_id]
      );
      console.log('Password updated for user:', user.user_id);
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpCreatedAt = new Date();

    await pool.query(`UPDATE SystemUser SET otp = ?, otp_created_at = ? WHERE email = ?`, 
      [otp, otpCreatedAt, email]);

    await sendInvitationEmail(email, `Your OTP is: ${otp}`);
    
    res.status(200).json({ message: 'Signup successful! OTP sent to your email.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Signup failed.', error: error.message });
  }
};

// Fixed login function - More flexible user lookup
const login = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email and password are required.' });
  }

  // Split fullName properly
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  console.log('Login attempt:', { firstName, lastName, email, password });

  try {
    // More flexible user lookup
    let user = null;
    
    // Try 1: Exact match
    const [exactMatch] = await pool.query(
      `SELECT * FROM SystemUser WHERE first_name = ? AND last_name = ? AND email = ? AND password = ?`, 
      [firstName, lastName, email, password]
    );
    
    if (exactMatch.length > 0) {
      user = exactMatch[0];
      console.log('Found user with exact match');
    } else {
      // Try 2: Email and password match (ignore name mismatch)
      const [emailMatch] = await pool.query(
        `SELECT * FROM SystemUser WHERE email = ? AND password = ?`, 
        [email, password]
      );
      
      if (emailMatch.length > 0) {
        user = emailMatch[0];
        console.log('Found user with email/password match');
      }
    }
    
    if (!user) {
      // Debug: Check what's actually in database
      const [debugUser] = await pool.query(
        `SELECT first_name, last_name, email, password FROM SystemUser WHERE email = ?`, 
        [email]
      );
      
      if (debugUser.length > 0) {
        console.log('User exists but credentials don\'t match:');
        console.log('DB:', debugUser[0]);
        console.log('Input:', { firstName, lastName, email, password });
        return res.status(401).json({ 
          message: 'Invalid credentials. Check your name format and password.',
          debug: process.env.NODE_ENV === 'development' ? {
            dbName: `${debugUser[0].first_name} ${debugUser[0].last_name}`,
            inputName: fullName,
            passwordMatch: debugUser[0].password === password
          } : undefined
        });
      }
      
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log('User logged in successfully:', user.user_id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.role_name,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      token, 
      message: 'Login successful.',
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

const verifyOTPHelper = async (email, otp) => {
  try {
    const [result] = await pool.query(`SELECT otp, otp_created_at FROM SystemUser WHERE email = ?`, [email]);
    
    if (result.length === 0) {
      return false; // User not found
    }

    const { otp: storedOtp, otp_created_at } = result[0];
    
    // Check if the OTP matches
    if (storedOtp !== otp) {
      return false; // OTP doesn't match
    }

    // Check if the OTP has expired (5 minutes validity)
    const otpAgeInMinutes = (new Date() - new Date(otp_created_at)) / 1000 / 60;
    if (otpAgeInMinutes > 5) {
      return false; // OTP expired
    }

    return true; // OTP is valid and not expired
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
};

// OTP Verification function
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = await verifyOTPHelper(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP.', error: error.message });
  }
};

// Update password function - Plain text password
const updatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password are required.' });
  }

  try {
    // Update password (plain text)
    const updatePasswordQuery = `
      UPDATE SystemUser 
      SET password = ? 
      WHERE email = ?
    `;

    const [result] = await pool.query(updatePasswordQuery, [password, email]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Failed to update password:', error);
    res.status(500).json({ message: 'Failed to update password.', error: error.message });
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
        su.mobile,
        su.image_url,
        d.license_type,
        d.license_number,
        d.experience_years,
        d.availability,
        d.preferred_trip_types,
        d.current_location_lat,
        d.current_location_lng,
        d.last_location_update,
        d.vehicle_id,
        v.model as vehicle_model,
        v.vehicle_type,
        v.license_plate,
        v.seating_capacity,
        ds.completed_trips,
        ds.total_earnings,
        ds.average_rating
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      LEFT JOIN Vehicle v ON d.vehicle_id = v.vehicle_id
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
      data: drivers,
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
        su.mobile,
        su.image_url,
        d.license_type,
        d.license_number,
        d.experience_years,
        d.availability,
        d.preferred_trip_types,
        d.current_location_lat,
        d.current_location_lng,
        d.last_location_update,
        d.vehicle_id,
        v.model as vehicle_model,
        v.vehicle_type,
        v.license_plate,
        v.seating_capacity,
        ds.completed_trips,
        ds.total_earnings,
        ds.average_rating,
        ds.total_trips
      FROM Driver d
      INNER JOIN SystemUser su ON d.user_id = su.user_id
      LEFT JOIN Vehicle v ON d.vehicle_id = v.vehicle_id
      LEFT JOIN DriverStatistics ds ON d.driver_id = ds.driver_id
      WHERE d.driver_id = ? AND su.role_name = 'driver'
    `, [driverId]);

    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({
      success: true,
      data: driver[0]
    });

  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
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

    // Update driver availability
    const [result] = await pool.query(
      `UPDATE Driver 
       SET availability = ?, 
           last_location_update = NOW() 
       WHERE driver_id = ?`,
      [availability, driverId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Log the change for audit purposes
    await pool.query(
      `INSERT INTO DriverStatusLog (driver_id, old_status, new_status, changed_by, reason, created_at)
       VALUES (?, 
               (SELECT availability FROM Driver WHERE driver_id = ?), 
               ?, 
               ?, 
               ?, 
               NOW())`,
      [driverId, driverId, availability, req.user?.email || 'tour_operator', reason || 'Updated by tour operator']
    );

    res.status(200).json({
      success: true,
      message: `Driver availability updated to ${availability}`,
      data: {
        driver_id: driverId,
        availability,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



export { verifyOTP, signup, createProfile, login, updatePassword };