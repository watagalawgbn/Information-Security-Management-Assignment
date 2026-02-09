import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Customer Registration
export const registerCustomer = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            password,
            preferredLanguage = 'en',
            marketingEmails = false
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if email already exists
        const [existingUser] = await pool.query(
            'SELECT email FROM SystemUser WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate IDs
        const userId = uuidv4();
        const customerId = uuidv4();

        // Create username from email
        const userName = email.split('@')[0];

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert into SystemUser (using direct password)
            await connection.query(`
                INSERT INTO SystemUser (
                    user_id, first_name, last_name, user_name, password, 
                    role_name, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, firstName, lastName, userName, password, 'customer', email]);

            // Insert into Customer
            await connection.query(`
                INSERT INTO Customer (
                    customer_id, user_id, phone, date_of_birth, 
                    preferred_language, marketing_emails
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [customerId, userId, phone, dateOfBirth || null, preferredLanguage, marketingEmails]);

            await connection.commit();
            connection.release();

            // Generate JWT token
            const token = jwt.sign(
                { 
                    user_id: userId, 
                    customer_id: customerId,
                    role: 'customer',
                    email: email 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Customer registered successfully',
                data: {
                    userId,
                    customerId,
                    firstName,
                    lastName,
                    email,
                    token
                }
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Customer Login
export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get user data with customer info (direct password comparison)
        const [users] = await pool.query(`
            SELECT su.*, c.customer_id, c.phone, c.date_of_birth, 
                   c.preferred_language, c.marketing_emails, c.verification_status
            FROM SystemUser su
            JOIN Customer c ON su.user_id = c.user_id
            WHERE su.email = ? AND su.role_name = 'customer' AND su.password = ?
        `, [email, password]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                customer_id: user.customer_id,
                role: 'customer',
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete user.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Error logging in customer:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Get Customer Profile
export const getCustomerProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const [customers] = await pool.query(`
            SELECT su.user_id, su.first_name, su.last_name, su.email, su.user_name,
                   c.customer_id, c.phone, c.date_of_birth, c.preferred_language,
                   c.marketing_emails, c.profile_image_url, c.address,
                   c.emergency_contact_name, c.emergency_contact_phone,
                   c.loyalty_points, c.verification_status, c.created_at
            FROM SystemUser su
            JOIN Customer c ON su.user_id = c.user_id
            WHERE su.user_id = ?
        `, [userId]);

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: customers[0]
        });

    } catch (error) {
        console.error('Error fetching customer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

// Update Customer Profile
export const updateCustomerProfile = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const customerId = req.user?.customer_id;

        if (!userId || !customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const {
            firstName,
            lastName,
            phone,
            dateOfBirth,
            preferredLanguage,
            marketingEmails,
            address,
            emergencyContactName,
            emergencyContactPhone
        } = req.body;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update SystemUser table
            if (firstName || lastName) {
                await connection.query(`
                    UPDATE SystemUser 
                    SET first_name = COALESCE(?, first_name), 
                        last_name = COALESCE(?, last_name)
                    WHERE user_id = ?
                `, [firstName, lastName, userId]);
            }

            // Update Customer table
            await connection.query(`
                UPDATE Customer 
                SET phone = COALESCE(?, phone),
                    date_of_birth = COALESCE(?, date_of_birth),
                    preferred_language = COALESCE(?, preferred_language),
                    marketing_emails = COALESCE(?, marketing_emails),
                    address = COALESCE(?, address),
                    emergency_contact_name = COALESCE(?, emergency_contact_name),
                    emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                    updated_at = CURRENT_TIMESTAMP
                WHERE customer_id = ?
            `, [
                phone, dateOfBirth, preferredLanguage, marketingEmails, 
                address, emergencyContactName, emergencyContactPhone, customerId
            ]);

            await connection.commit();
            connection.release();

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully'
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error updating customer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};