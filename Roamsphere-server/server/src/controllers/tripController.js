import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import TripModel from '../models/tripModel.js';
import DriverModel from '../models/driverModel.js';
import VehicleModel from '../models/vehicleModel.js';
import CustomerModel from '../models/customerModel.js';

// ============================================================================
// BASIC TRIP MANAGEMENT (Original functionality)
// ============================================================================

// Create a new trip request (Basic version)
export const createTripRequest = async (req, res) => {
    try {
        const {
            title, category, origin, destination, stops,
            preferredDate, preferredTime, returnDate, returnTime,
            passengerCount, passengerNames, contactName, contactPhone, contactEmail,
            vehicleType, specialRequirements, budget, notes
        } = req.body;

        // Get customer ID from JWT token
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Validate required fields
        if (!title || !category || !origin || !destination || !preferredDate || !preferredTime || !contactName || !contactPhone || !contactEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const tripId = uuidv4();

        const query = `
            INSERT INTO Trip (
                trip_id, customer_id, title, category, origin, destination, stops,
                preferred_date, preferred_time, return_date, return_time,
                passenger_count, passenger_names, contact_name, contact_phone, contact_email,
                vehicle_type, special_requirements, budget, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            tripId, customerId, title, category, origin, destination, stops || null,
            preferredDate, preferredTime, returnDate || null, returnTime || null,
            passengerCount || 1, passengerNames || null, contactName, contactPhone, contactEmail,
            vehicleType || null, specialRequirements || null, budget || null, notes || null
        ];

        await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Trip request created successfully',
            data: {
                tripId,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Error creating trip request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create trip request',
            error: error.message
        });
    }
};

// Create a new trip request with enhanced features
export const createTripRequestEnhanced = async (req, res) => {
    try {
        const {
            title, category, origin, destination, stops,
            preferredDate, preferredTime, returnDate, returnTime,
            passengerCount, passengerNames, contactName, contactPhone, contactEmail,
            vehicleType, specialRequirements, budget, notes,
            originLatitude, originLongitude, destinationLatitude, destinationLongitude
        } = req.body;

        // Get customer ID from JWT token
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Validate required fields
        if (!title || !category || !origin || !destination || !preferredDate || !preferredTime || !contactName || !contactPhone || !contactEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const tripId = uuidv4();

        const tripData = {
            tripId, customerId, title, category, origin, destination, stops,
            preferredDate, preferredTime, returnDate, returnTime,
            passengerCount: passengerCount || 1, passengerNames, contactName, contactPhone, contactEmail,
            vehicleType, specialRequirements, budget, notes
        };

        await TripModel.createTrip(tripData);

        // Store location coordinates if provided
        if (originLatitude && originLongitude && destinationLatitude && destinationLongitude) {
            await pool.query(`
                INSERT INTO TripLocation (trip_id, origin_latitude, origin_longitude, 
                                        destination_latitude, destination_longitude, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [tripId, originLatitude, originLongitude, destinationLatitude, destinationLongitude]);
        }

        res.status(201).json({
            success: true,
            message: 'Trip request created successfully',
            data: {
                tripId,
                status: 'pending',
                estimatedProcessingTime: '2-4 hours'
            }
        });

    } catch (error) {
        console.error('Error creating trip request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create trip request',
            error: error.message
        });
    }
};

// Get specific trip by ID (Basic version)
export const getTripRequestById = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const [trips] = await pool.query(`
            SELECT t.*, 
                   d.user_id as driver_user_id, du.first_name as driver_first_name, 
                   du.last_name as driver_last_name, d.mobile as driver_mobile,
                   v.model as vehicle_model, v.license_plate as vehicle_plate, 
                   v.seating_capacity, v.color as vehicle_color
            FROM Trip t
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser du ON d.user_id = du.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE t.trip_id = ? AND t.customer_id = ?
        `, [tripId, customerId]);

        if (trips.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        res.status(200).json({
            success: true,
            data: trips[0]
        });

    } catch (error) {
        console.error('Error fetching trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip',
            error: error.message
        });
    }
};

// Get trip details with real-time tracking info (Enhanced version)
export const getTripDetails = async (req, res) => {
    try {
        const { tripId } = req.params;
        const userRole = req.user?.role;
        const customerId = req.user?.customer_id;
        const driverId = req.user?.driver_id;

        const trip = await TripModel.getTripById(tripId);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check access permissions
        if (userRole === 'customer' && trip.customer_id !== customerId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (userRole === 'driver' && trip.assigned_driver_id !== driverId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get real-time tracking data if trip is active
        let trackingData = null;
        if (trip.status === 'in-progress' && trip.assigned_driver_id) {
            const driver = await DriverModel.getDriverById(trip.assigned_driver_id);
            if (driver && driver.current_latitude && driver.current_longitude) {
                trackingData = {
                    driverLocation: {
                        latitude: driver.current_latitude,
                        longitude: driver.current_longitude,
                        heading: driver.current_heading,
                        speed: driver.current_speed,
                        lastUpdate: driver.last_location_update
                    },
                    isOnline: driver.is_online
                };
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ...trip,
                trackingData
            }
        });

    } catch (error) {
        console.error('Error fetching trip details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip details',
            error: error.message
        });
    }
};

// Update trip request
export const updateTripRequest = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if trip exists and belongs to customer
        const [existingTrip] = await pool.query(
            'SELECT status FROM Trip WHERE trip_id = ? AND customer_id = ?',
            [tripId, customerId]
        );

        if (existingTrip.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Only allow updates if trip is pending
        if (existingTrip[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update trip that is not pending'
            });
        }

        const updateFields = [];
        const updateValues = [];

        // Build dynamic update query
        const allowedFields = [
            'title', 'category', 'origin', 'destination', 'stops',
            'preferred_date', 'preferred_time', 'return_date', 'return_time',
            'passenger_count', 'passenger_names', 'contact_name', 'contact_phone', 'contact_email',
            'vehicle_type', 'special_requirements', 'budget', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(tripId, customerId);

        const query = `UPDATE Trip SET ${updateFields.join(', ')} WHERE trip_id = ? AND customer_id = ?`;
        
        await pool.query(query, updateValues);

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully'
        });

    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trip',
            error: error.message
        });
    }
};

// Get all trip requests for a customer
export const getCustomerTripRequests = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;
        const { status, page = 1, limit = 10 } = req.query;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        let query = `
            SELECT t.*, d.user_id as driver_user_id, su.first_name as driver_first_name, 
                   su.last_name as driver_last_name, v.model as vehicle_model, 
                   v.license_plate as vehicle_plate
            FROM Trip t
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser su ON d.user_id = su.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE t.customer_id = ?
        `;

        const queryParams = [customerId];

        if (status) {
            query += ' AND t.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY t.created_at DESC';

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [trips] = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM Trip WHERE customer_id = ?';
        const countParams = [customerId];

        if (status) {
            countQuery += ' AND status = ?';
            countParams.push(status);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            success: true,
            data: {
                trips,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching trip requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip requests',
            error: error.message
        });
    }
};

// Get trip statistics for customer dashboard
export const getTripStatistics = async (req, res) => {
    try {
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const query = `
            SELECT 
                COUNT(*) as total_trips,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_trips,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_trips,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as active_trips,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips
            FROM Trip 
            WHERE customer_id = ?
        `;

        const [result] = await pool.query(query, [customerId]);

        res.status(200).json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Error fetching trip statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip statistics',
            error: error.message
        });
    }
};

// Cancel trip request
export const cancelTripRequest = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if trip exists and belongs to customer
        const [existingTrip] = await pool.query(
            'SELECT status FROM Trip WHERE trip_id = ? AND customer_id = ?',
            [tripId, customerId]
        );

        if (existingTrip.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip request not found'
            });
        }

        if (['completed', 'cancelled'].includes(existingTrip[0].status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel trip that is ${existingTrip[0].status}`
            });
        }

        await pool.query(
            'UPDATE Trip SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND customer_id = ?',
            ['cancelled', tripId, customerId]
        );

        res.status(200).json({
            success: true,
            message: 'Trip request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling trip request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel trip request',
            error: error.message
        });
    }
};

// ============================================================================
// ADMIN/TOUR OPERATOR FUNCTIONS
// ============================================================================

// Get all trip requests (Basic version)
export const getAllTripRequests = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 10, startDate, endDate } = req.query;

        let query = `
            SELECT t.*, 
                   cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email,
                   c.phone as customer_phone, c.verification_status,
                   d.user_id as driver_user_id, du.first_name as driver_first_name, du.last_name as driver_last_name,
                   v.model as vehicle_model, v.license_plate as vehicle_plate, v.seating_capacity
            FROM Trip t
            JOIN Customer c ON t.customer_id = c.customer_id
            JOIN SystemUser cu ON c.user_id = cu.user_id
            LEFT JOIN Driver d ON t.assigned_driver_id = d.driver_id
            LEFT JOIN SystemUser du ON d.user_id = du.user_id
            LEFT JOIN Vehicle v ON t.assigned_vehicle_id = v.vehicle_id
            WHERE 1=1
        `;

        const queryParams = [];

        if (status) {
            query += ' AND t.status = ?';
            queryParams.push(status);
        }

        if (category) {
            query += ' AND t.category = ?';
            queryParams.push(category);
        }

        if (startDate) {
            query += ' AND t.preferred_date >= ?';
            queryParams.push(startDate);
        }

        if (endDate) {
            query += ' AND t.preferred_date <= ?';
            queryParams.push(endDate);
        }

        query += ' ORDER BY t.created_at DESC';

        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [trips] = await pool.query(query, queryParams);

        res.status(200).json({
            success: true,
            data: { trips }
        });

    } catch (error) {
        console.error('Error fetching all trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trips',
            error: error.message
        });
    }
};

// Get all trip requests with filtering (Enhanced version)
export const getAllTripRequestsEnhanced = async (req, res) => {
    try {
        const { 
            status, category, page = 1, limit = 10, 
            startDate, endDate, search, sortBy = 'created_at', sortOrder = 'DESC' 
        } = req.query;

        const filters = {
            status, category, startDate, endDate,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        const trips = await TripModel.getAllTrips(filters);

        // Get total count for pagination
        const total = await TripModel.getTripCount(filters);

        res.status(200).json({
            success: true,
            data: {
                trips,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching trip requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip requests',
            error: error.message
        });
    }
};

// Assign trip to driver (Basic version)
export const assignTripToDriver = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { driverId, vehicleId, estimatedCost } = req.body;

        await pool.query(`
            UPDATE Trip 
            SET assigned_driver_id = ?, assigned_vehicle_id = ?, 
                estimated_cost = ?, status = 'confirmed'
            WHERE trip_id = ?
        `, [driverId, vehicleId, estimatedCost, tripId]);

        res.status(200).json({
            success: true,
            message: 'Trip assigned successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign trip',
            error: error.message
        });
    }
};

// Assign trip to driver and vehicle (Enhanced version)
export const assignTripToDriverEnhanced = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { driverId, vehicleId, estimatedCost, estimatedDuration, notes } = req.body;

        if (!driverId || !vehicleId || !estimatedCost) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID, Vehicle ID, and estimated cost are required'
            });
        }

        // Check if trip exists and is pending
        const trip = await TripModel.getTripById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (trip.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not available for assignment'
            });
        }

        // Check driver availability
        const driver = await DriverModel.getDriverById(driverId);
        if (!driver || driver.availability_status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Driver is not available'
            });
        }

        // Check vehicle availability
        const vehicle = await VehicleModel.getVehicleById(vehicleId);
        if (!vehicle || vehicle.availability_status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Vehicle is not available'
            });
        }

        // Assign trip
        await TripModel.assignTrip(tripId, driverId, vehicleId, estimatedCost);

        // Update driver and vehicle status
        await DriverModel.updateDriverAvailability(driverId, 'assigned');
        await VehicleModel.updateVehicleAvailability(vehicleId, 'assigned');

        // Add assignment notes if provided
        if (notes) {
            await pool.query(`
                INSERT INTO TripAssignment (trip_id, driver_id, vehicle_id, 
                                         estimated_cost, estimated_duration, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [tripId, driverId, vehicleId, estimatedCost, estimatedDuration, notes]);
        }

        res.status(200).json({
            success: true,
            message: 'Trip assigned successfully',
            data: {
                tripId,
                driverId,
                vehicleId,
                estimatedCost,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Error assigning trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign trip',
            error: error.message
        });
    }
};

// Update trip status
export const updateTripStatus = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { status } = req.body;

        await pool.query(
            'UPDATE Trip SET status = ? WHERE trip_id = ?',
            [status, tripId]
        );

        res.status(200).json({
            success: true,
            message: 'Trip status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update trip status',
            error: error.message
        });
    }
};

// ============================================================================
// DRIVER TRIP MANAGEMENT
// ============================================================================

// Get assigned trips for driver
export const getDriverTrips = async (req, res) => {
    try {
        const driverId = req.user?.driver_id;
        const { status, page = 1, limit = 10 } = req.query;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: 'Driver authentication required'
            });
        }

        const filters = {
            status,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };

        const trips = await TripModel.getTripsByDriver(driverId, filters);
        const total = await TripModel.getTripCount({ driverId, status });

        res.status(200).json({
            success: true,
            data: {
                trips,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching driver trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch driver trips',
            error: error.message
        });
    }
};

// Start trip
export const startTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const driverId = req.user?.driver_id;
        const { startLatitude, startLongitude, startAddress } = req.body;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: 'Driver authentication required'
            });
        }

        const trip = await TripModel.getTripById(tripId);
        if (!trip || trip.assigned_driver_id !== driverId) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or not assigned to you'
            });
        }

        if (trip.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not confirmed'
            });
        }

        // Update trip status
        await TripModel.updateTripStatus(tripId, 'in-progress');

        // Update driver status
        await DriverModel.updateDriverAvailability(driverId, 'in-trip');

        // Update vehicle status
        if (trip.assigned_vehicle_id) {
            await VehicleModel.updateVehicleAvailability(trip.assigned_vehicle_id, 'in-use');
        }

        // Record trip start
        await pool.query(`
            INSERT INTO TripTracking (trip_id, driver_id, status, latitude, longitude, 
                                    address, timestamp, created_at)
            VALUES (?, ?, 'started', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [tripId, driverId, startLatitude, startLongitude, startAddress]);

        res.status(200).json({
            success: true,
            message: 'Trip started successfully',
            data: {
                tripId,
                status: 'in-progress',
                startTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error starting trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start trip',
            error: error.message
        });
    }
};

// Update location during trip
export const updateTripLocation = async (req, res) => {
    try {
        const { tripId } = req.params;
        const driverId = req.user?.driver_id;
        const { latitude, longitude, heading, speed, accuracy, address } = req.body;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: 'Driver authentication required'
            });
        }

        const trip = await TripModel.getTripById(tripId);
        if (!trip || trip.assigned_driver_id !== driverId) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or not assigned to you'
            });
        }

        if (trip.status !== 'in-progress') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not in progress'
            });
        }

        // Update driver location
        await DriverModel.updateDriverLocation(driverId, {
            latitude, longitude, heading, speed, accuracy, isOnline: true
        });

        // Record location update
        await pool.query(`
            INSERT INTO TripTracking (trip_id, driver_id, status, latitude, longitude, 
                                    heading, speed, accuracy, address, timestamp, created_at)
            VALUES (?, ?, 'location_update', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [tripId, driverId, latitude, longitude, heading, speed, accuracy, address]);

        res.status(200).json({
            success: true,
            message: 'Location updated successfully'
        });

    } catch (error) {
        console.error('Error updating trip location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            error: error.message
        });
    }
};

// Complete trip
export const completeTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const driverId = req.user?.driver_id;
        const { endLatitude, endLongitude, endAddress, actualCost, notes } = req.body;

        if (!driverId) {
            return res.status(401).json({
                success: false,
                message: 'Driver authentication required'
            });
        }

        const trip = await TripModel.getTripById(tripId);
        if (!trip || trip.assigned_driver_id !== driverId) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or not assigned to you'
            });
        }

        if (trip.status !== 'in-progress') {
            return res.status(400).json({
                success: false,
                message: 'Trip is not in progress'
            });
        }

        // Update trip status
        await TripModel.updateTripStatus(tripId, 'completed');

        // Update driver status
        await DriverModel.updateDriverAvailability(driverId, 'available');

        // Update vehicle status
        if (trip.assigned_vehicle_id) {
            await VehicleModel.updateVehicleAvailability(trip.assigned_vehicle_id, 'available');
        }

        // Record trip completion
        await pool.query(`
            INSERT INTO TripTracking (trip_id, driver_id, status, latitude, longitude, 
                                    address, actual_cost, notes, timestamp, created_at)
            VALUES (?, ?, 'completed', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [tripId, driverId, endLatitude, endLongitude, endAddress, actualCost, notes]);

        res.status(200).json({
            success: true,
            message: 'Trip completed successfully',
            data: {
                tripId,
                status: 'completed',
                endTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error completing trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete trip',
            error: error.message
        });
    }
};

// ============================================================================
// REAL-TIME TRACKING
// ============================================================================

// Customer: Track trip in real-time
export const trackTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const customerId = req.user?.customer_id;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const trip = await TripModel.getTripById(tripId);
        if (!trip || trip.customer_id !== customerId) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Get real-time tracking data
        let trackingData = null;
        if (trip.status === 'in-progress' && trip.assigned_driver_id) {
            const driver = await DriverModel.getDriverById(trip.assigned_driver_id);
            if (driver && driver.current_latitude && driver.current_longitude) {
                trackingData = {
                    driverLocation: {
                        latitude: driver.current_latitude,
                        longitude: driver.current_longitude,
                        heading: driver.current_heading,
                        speed: driver.current_speed,
                        lastUpdate: driver.last_location_update
                    },
                    isOnline: driver.is_online,
                    vehicle: {
                        model: trip.vehicle_model,
                        licensePlate: trip.vehicle_plate,
                        color: trip.vehicle_color
                    }
                };
            }
        }

        // Get trip tracking history
        const [trackingHistory] = await pool.query(`
            SELECT * FROM TripTracking 
            WHERE trip_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 50
        `, [tripId]);

        res.status(200).json({
            success: true,
            data: {
                trip: {
                    tripId: trip.trip_id,
                    status: trip.status,
                    origin: trip.origin,
                    destination: trip.destination,
                    preferredDate: trip.preferred_date,
                    preferredTime: trip.preferred_time
                },
                trackingData,
                trackingHistory
            }
        });

    } catch (error) {
        console.error('Error tracking trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track trip',
            error: error.message
        });
    }
};

// Get available drivers and vehicles for assignment
export const getAssignmentOptions = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { vehicleType, minSeatingCapacity, passengerCount } = req.query;

        const trip = await TripModel.getTripById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Get available drivers
        const drivers = await DriverModel.getAvailableDrivers(
            trip.category,
            { latitude: trip.origin_latitude, longitude: trip.origin_longitude }
        );

        // Get available vehicles
        const vehicleRequirements = {
            vehicleType: vehicleType || trip.vehicle_type,
            minSeatingCapacity: minSeatingCapacity || trip.passenger_count || passengerCount
        };

        const vehicles = await VehicleModel.getAvailableVehicles(vehicleRequirements);

        res.status(200).json({
            success: true,
            data: {
                drivers,
                vehicles,
                tripRequirements: {
                    category: trip.category,
                    passengerCount: trip.passenger_count,
                    vehicleType: trip.vehicle_type,
                    preferredDate: trip.preferred_date,
                    preferredTime: trip.preferred_time
                }
            }
        });

    } catch (error) {
        console.error('Error fetching assignment options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assignment options',
            error: error.message
        });
    }
};

