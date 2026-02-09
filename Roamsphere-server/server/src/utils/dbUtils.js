import { pool } from '../config/db.js';

const systemuserTableQuery=`CREATE TABLE IF NOT EXISTS SystemUser (
    user_id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_name VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role_name ENUM('super-admin', 'admin', 'tour-operator', 'driver'),
    email VARCHAR(255) UNIQUE,
    otp VARCHAR(4),
    otp_created_at TIMESTAMP NULL
);`

const adminTableQuery=`CREATE TABLE IF NOT EXISTS Admin (
    admin_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`

const driverTableQuery = `
CREATE TABLE IF NOT EXISTS Driver (
    driver_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    mobile VARCHAR(15),
    license_no VARCHAR(100),
    issuing_date DATE,
    expiry_date DATE,
    license_type VARCHAR(50),
    experience_years INT,
    image_url TEXT,
    address TEXT,
    age INT,
    availability ENUM('available', 'on-trip', 'on-leave', 'offline', 'maintenance') DEFAULT 'offline',
    preferred_trip_types JSON,
    last_location_lat DECIMAL(10, 8) NULL,
    last_location_lng DECIMAL(11, 8) NULL,
    last_location_update TIMESTAMP NULL,
    status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`;

const vehicleTableQuery = `
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id VARCHAR(255) PRIMARY KEY,
    driver_id VARCHAR(255),
    vehicle_type VARCHAR(100),
    model VARCHAR(100),
    year INT,
    seating_capacity INT,
    color VARCHAR(50),
    ownership VARCHAR(100),
    registration_province VARCHAR(100),
    license_plate VARCHAR(50) UNIQUE,
    chassis_no VARCHAR(100) UNIQUE,
    registration_date DATE,
    expiry_date DATE,
    insurance TEXT,
    category ENUM('Luxury', 'Safari', 'Tour', 'Adventure', 'Casual'),
    availability ENUM('Available', 'Unavailable', 'Maintenance', 'Booked'),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_driver FOREIGN KEY (driver_id) REFERENCES Driver(driver_id)
);`;

const customerTableQuery = `
CREATE TABLE IF NOT EXISTS Customer (
    customer_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    marketing_emails BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    address TEXT,
    loyalty_points INT DEFAULT 0,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SystemUser(user_id)
);`;

const tripTableQuery = `
CREATE TABLE IF NOT EXISTS Trip (
    trip_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category ENUM('Luxury', 'Safari', 'Tour', 'Adventure', 'Casual') NOT NULL,
    origin VARCHAR(500) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    stops TEXT,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    return_date DATE NULL,
    return_time TIME NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    passenger_names TEXT,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    special_requirements TEXT,
    budget VARCHAR(100),
    notes TEXT,
    status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_driver_id VARCHAR(255) NULL,
    assigned_vehicle_id VARCHAR(255) NULL,
    estimated_cost DECIMAL(10,2) NULL,
    actual_cost DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (assigned_driver_id) REFERENCES Driver(driver_id),
    FOREIGN KEY (assigned_vehicle_id) REFERENCES Vehicle(vehicle_id)
);`;

// Driver Statistics Table for dashboard metrics
const driverStatisticsQuery = `
CREATE TABLE IF NOT EXISTS DriverStatistics (
    stat_id VARCHAR(255) PRIMARY KEY,
    driver_id VARCHAR(255),
    total_trips INT DEFAULT 0,
    completed_trips INT DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_distance DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id)
);`;

// Enhanced Trip Management Tables
const tripLocationTableQuery = `
CREATE TABLE IF NOT EXISTS TripLocation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(255) NOT NULL,
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id) ON DELETE CASCADE
);`;

const tripAssignmentTableQuery = `
CREATE TABLE IF NOT EXISTS TripAssignment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(255) NOT NULL,
    driver_id VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(255) NOT NULL,
    estimated_cost DECIMAL(10, 2),
    estimated_duration INT,
    notes TEXT,
    assigned_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE
);`;

const tripTrackingTableQuery = `
CREATE TABLE IF NOT EXISTS TripTracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id VARCHAR(255) NOT NULL,
    driver_id VARCHAR(255) NOT NULL,
    status ENUM('started', 'location_update', 'completed', 'cancelled') NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    accuracy DECIMAL(5, 2),
    address TEXT,
    actual_cost DECIMAL(10, 2),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES Driver(driver_id) ON DELETE CASCADE
);`;

const vehicleMaintenanceTableQuery = `
CREATE TABLE IF NOT EXISTS VehicleMaintenance (
    maintenance_id VARCHAR(255) PRIMARY KEY,
    vehicle_id VARCHAR(255) NOT NULL,
    maintenance_type ENUM('routine', 'repair', 'inspection', 'emergency') NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2),
    maintenance_date DATE NOT NULL,
    next_maintenance_date DATE,
    service_provider VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE
);`;

const createTable = async (tableName,query) => {
    try {
        await pool.query(query);
        console.log(`${tableName} table created or already exists`);
    } catch (error) {
        console.error(`Failed to create table ${tableName}`, error.message);
        throw error;
    }
}

const addEnhancedColumns = async () => {
    try {
        // Enhanced Trip table columns
        const tripEnhancements = [
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS origin_latitude DECIMAL(10, 8)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS origin_longitude DECIMAL(11, 8)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS destination_latitude DECIMAL(10, 8)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS destination_longitude DECIMAL(11, 8)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS actual_duration INT',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS start_time TIMESTAMP NULL',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS end_time TIMESTAMP NULL',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS trip_rating INT CHECK (trip_rating >= 1 AND trip_rating <= 5)',
            'ALTER TABLE Trip ADD COLUMN IF NOT EXISTS trip_review TEXT'
        ];

        // Enhanced Driver table columns
        const driverEnhancements = [
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8)',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8)',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS current_heading DECIMAL(5, 2)',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS current_speed DECIMAL(5, 2)',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP NULL',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS working_hours JSON',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS max_distance INT',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS preferred_trip_types JSON DEFAULT "[]"',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE',
            'ALTER TABLE Driver ADD COLUMN IF NOT EXISTS availability_status ENUM("available", "assigned", "in-trip", "offline", "maintenance") DEFAULT "offline"'
        ];

        // Enhanced Vehicle table columns
        const vehicleEnhancements = [
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS make VARCHAR(100)',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS year YEAR',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS fuel_type ENUM("petrol", "diesel", "hybrid", "electric")',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS transmission ENUM("manual", "automatic", "semi-automatic")',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS mileage INT',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS insurance_expiry DATE',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS registration_expiry DATE',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS features JSON DEFAULT "[]"',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS maintenance_notes TEXT',
            'ALTER TABLE Vehicle ADD COLUMN IF NOT EXISTS availability_status ENUM("available", "assigned", "in-use", "maintenance", "unavailable") DEFAULT "available"'
        ];

        // Enhanced Customer table columns
        const customerEnhancements = [
            'ALTER TABLE Customer ADD COLUMN IF NOT EXISTS preferences JSON DEFAULT "{}"',
            'ALTER TABLE Customer ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE'
        ];

        // Execute all enhancements
        const allEnhancements = [
            ...tripEnhancements,
            ...driverEnhancements,
            ...vehicleEnhancements,
            ...customerEnhancements
        ];

        for (const query of allEnhancements) {
            try {
                await pool.query(query);
            } catch (error) {
                // Ignore errors for columns that already exist
                if (!error.message.includes('Duplicate column name')) {
                    // console.warn(`Warning: ${error.message}`);
                }
            }
        }

        console.log('Enhanced columns added successfully');
    } catch (error) {
        console.error('Error adding enhanced columns:', error.message);
        throw error;
    }
}

const createIndexes = async () => {
    try {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_trip_status ON Trip(status)',
            'CREATE INDEX IF NOT EXISTS idx_trip_customer ON Trip(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_trip_driver ON Trip(assigned_driver_id)',
            'CREATE INDEX IF NOT EXISTS idx_trip_vehicle ON Trip(assigned_vehicle_id)',
            'CREATE INDEX IF NOT EXISTS idx_trip_date ON Trip(preferred_date)',
            'CREATE INDEX IF NOT EXISTS idx_driver_availability ON Driver(availability_status)',
            'CREATE INDEX IF NOT EXISTS idx_driver_online ON Driver(is_online)',
            'CREATE INDEX IF NOT EXISTS idx_driver_location ON Driver(current_latitude, current_longitude)',
            'CREATE INDEX IF NOT EXISTS idx_vehicle_availability ON Vehicle(availability_status)',
            'CREATE INDEX IF NOT EXISTS idx_vehicle_type ON Vehicle(vehicle_type)',
            'CREATE INDEX IF NOT EXISTS idx_tracking_trip ON TripTracking(trip_id)',
            'CREATE INDEX IF NOT EXISTS idx_tracking_timestamp ON TripTracking(timestamp)'
        ];

        for (const indexQuery of indexes) {
            try {
                await pool.query(indexQuery);
            } catch (error) {
                // console.warn(`Warning creating index: ${error.message}`);
            }
        }

        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error.message);
        throw error;
    }
}

const paymentIntentsTableQuery = `
CREATE TABLE IF NOT EXISTS PaymentIntents (
    payment_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255),
    trip_id VARCHAR(255) NULL,
    trip_data JSON,
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'LKR',
    payment_method VARCHAR(50),
    payment_details JSON,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (trip_id) REFERENCES Trip(trip_id)
);`;

const createAllTable = async () => {
    try{
    // Core tables
    await createTable('SystemUser',systemuserTableQuery);
    await createTable('Admin',adminTableQuery);	
    await createTable('Driver',driverTableQuery);
    await createTable('Vehicle', vehicleTableQuery);
    await createTable('Customer', customerTableQuery);
    await createTable('Trip', tripTableQuery);
    await createTable('DriverStatistics', driverStatisticsQuery);
    
    // Enhanced trip management tables
    await createTable('TripLocation', tripLocationTableQuery);
    await createTable('TripAssignment', tripAssignmentTableQuery);
    await createTable('TripTracking', tripTrackingTableQuery);
    await createTable('VehicleMaintenance', vehicleMaintenanceTableQuery);
    
    // Payment tables
    await createTable('PaymentIntents', paymentIntentsTableQuery);
    
    // Add enhanced columns to existing tables
    await addEnhancedColumns();
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log('All tables and enhancements created successfully');
} catch (error) {
    throw error;
}
};

export default createAllTable;