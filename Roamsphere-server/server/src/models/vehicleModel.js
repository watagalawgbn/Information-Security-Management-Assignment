import { pool } from '../config/db.js';

const VehicleModel = {
  // Create a new vehicle
  createVehicle: async (vehicleData) => {
    const {
      vehicleId, model, make, year, licensePlate, color,
      seatingCapacity, vehicleType, fuelType, transmission,
      mileage, insuranceExpiry, registrationExpiry, availabilityStatus,
      features, maintenanceNotes
    } = vehicleData;

    const query = `
      INSERT INTO Vehicle (
        vehicle_id, model, make, year, license_plate, color,
        seating_capacity, vehicle_type, fuel_type, transmission,
        mileage, insurance_expiry, registration_expiry, availability_status,
        features, maintenance_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const values = [
      vehicleId, model, make, year, licensePlate, color,
      seatingCapacity, vehicleType, fuelType, transmission,
      mileage, insuranceExpiry, registrationExpiry, availabilityStatus || 'available',
      JSON.stringify(features || []), maintenanceNotes || null
    ];

    const [result] = await pool.query(query, values);
    return result;
  },

  // Get vehicle by ID
  getVehicleById: async (vehicleId) => {
    const query = `
      SELECT * FROM Vehicle WHERE vehicle_id = ?
    `;
    const [results] = await pool.query(query, [vehicleId]);
    return results[0];
  },

  // Get all vehicles
  getAllVehicles: async (filters = {}) => {
    let query = `
      SELECT * FROM Vehicle WHERE 1=1
    `;

    const queryParams = [];

    if (filters.availabilityStatus) {
      query += ' AND availability_status = ?';
      queryParams.push(filters.availabilityStatus);
    }

    if (filters.vehicleType) {
      query += ' AND vehicle_type = ?';
      queryParams.push(filters.vehicleType);
    }

    if (filters.minSeatingCapacity) {
      query += ' AND seating_capacity >= ?';
      queryParams.push(filters.minSeatingCapacity);
    }

    query += ' ORDER BY created_at DESC';

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

  // Get available vehicles for trip
  getAvailableVehicles: async (tripRequirements = {}) => {
    let query = `
      SELECT * FROM Vehicle 
      WHERE availability_status = 'available'
    `;

    const queryParams = [];

    if (tripRequirements.vehicleType) {
      query += ' AND vehicle_type = ?';
      queryParams.push(tripRequirements.vehicleType);
    }

    if (tripRequirements.minSeatingCapacity) {
      query += ' AND seating_capacity >= ?';
      queryParams.push(tripRequirements.minSeatingCapacity);
    }

    if (tripRequirements.passengerCount) {
      query += ' AND seating_capacity >= ?';
      queryParams.push(tripRequirements.passengerCount);
    }

    query += ' ORDER BY seating_capacity ASC, created_at DESC';

    const [results] = await pool.query(query, queryParams);
    return results;
  },

  // Update vehicle
  updateVehicle: async (vehicleId, updateData) => {
    const allowedFields = [
      'model', 'make', 'year', 'license_plate', 'color',
      'seating_capacity', 'vehicle_type', 'fuel_type', 'transmission',
      'mileage', 'insurance_expiry', 'registration_expiry', 'availability_status',
      'features', 'maintenance_notes'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(field => {
      if (allowedFields.includes(field) && updateData[field] !== undefined) {
        if (field === 'features') {
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
    updateValues.push(vehicleId);

    const query = `UPDATE Vehicle SET ${updateFields.join(', ')} WHERE vehicle_id = ?`;
    const [result] = await pool.query(query, updateValues);
    return result;
  },

  // Update vehicle availability
  updateVehicleAvailability: async (vehicleId, availabilityStatus) => {
    const query = `
      UPDATE Vehicle 
      SET availability_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE vehicle_id = ?
    `;
    const [result] = await pool.query(query, [availabilityStatus, vehicleId]);
    return result;
  },

  // Get vehicle statistics
  getVehicleStatistics: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN availability_status = 'available' THEN 1 ELSE 0 END) as available_vehicles,
        SUM(CASE WHEN availability_status = 'in-use' THEN 1 ELSE 0 END) as in_use_vehicles,
        SUM(CASE WHEN availability_status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
        SUM(CASE WHEN availability_status = 'unavailable' THEN 1 ELSE 0 END) as unavailable_vehicles,
        AVG(seating_capacity) as average_seating_capacity,
        COUNT(DISTINCT vehicle_type) as unique_vehicle_types
      FROM Vehicle
    `;

    const [results] = await pool.query(query);
    return results[0];
  },

  // Get vehicles by type
  getVehiclesByType: async (vehicleType) => {
    const query = `
      SELECT * FROM Vehicle 
      WHERE vehicle_type = ? AND availability_status = 'available'
      ORDER BY seating_capacity ASC
    `;
    const [results] = await pool.query(query, [vehicleType]);
    return results;
  },

  // Get vehicle count
  getVehicleCount: async (filters = {}) => {
    let query = 'SELECT COUNT(*) as total FROM Vehicle WHERE 1=1';
    const queryParams = [];

    if (filters.availabilityStatus) {
      query += ' AND availability_status = ?';
      queryParams.push(filters.availabilityStatus);
    }

    if (filters.vehicleType) {
      query += ' AND vehicle_type = ?';
      queryParams.push(filters.vehicleType);
    }

    const [results] = await pool.query(query, queryParams);
    return results[0].total;
  },

  // Check vehicle availability for date range
  checkVehicleAvailability: async (vehicleId, startDate, endDate) => {
    const query = `
      SELECT COUNT(*) as conflicting_trips
      FROM Trip t
      WHERE t.assigned_vehicle_id = ?
        AND t.status IN ('confirmed', 'in-progress')
        AND (
          (t.preferred_date BETWEEN ? AND ?) OR
          (t.return_date BETWEEN ? AND ?) OR
          (t.preferred_date <= ? AND t.return_date >= ?)
        )
    `;

    const [results] = await pool.query(query, [
      vehicleId, startDate, endDate, startDate, endDate, startDate, endDate
    ]);

    return results[0].conflicting_trips === 0;
  },

  // Get vehicle maintenance history
  getVehicleMaintenanceHistory: async (vehicleId) => {
    const query = `
      SELECT * FROM VehicleMaintenance 
      WHERE vehicle_id = ? 
      ORDER BY maintenance_date DESC
    `;
    const [results] = await pool.query(query, [vehicleId]);
    return results;
  },

  // Add maintenance record
  addMaintenanceRecord: async (vehicleId, maintenanceData) => {
    const {
      maintenanceId, maintenanceType, description, cost,
      maintenanceDate, nextMaintenanceDate, serviceProvider
    } = maintenanceData;

    const query = `
      INSERT INTO VehicleMaintenance (
        maintenance_id, vehicle_id, maintenance_type, description, cost,
        maintenance_date, next_maintenance_date, service_provider, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const values = [
      maintenanceId, vehicleId, maintenanceType, description, cost,
      maintenanceDate, nextMaintenanceDate, serviceProvider
    ];

    const [result] = await pool.query(query, values);
    return result;
  }
};

export default VehicleModel;
