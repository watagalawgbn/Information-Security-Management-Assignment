import express from 'express';
import { 
    getAllUsers, 
    findUserByEmail, 
    getDriverProfileByEmail, 
    addDriver, 
    updateDriver,
    updateDriverAvailability,
    updateDriverLocation,
    getDriverStatistics,
    getAvailableDriversForTrip,
    getDriverStatus,
    updateDriverStatus,
    getDriverLocation,
    getNearbyDrivers,
    getAllDriversDetailed,
    getDriverById,
    updateDriverAvailabilityByAdmin,
    updateDriverPreferences,
    getAvailableDriversByTripType
} from '../controllers/userController.js';
import { 
    addVehicle, 
    updateVehicle, 
    getVehicleProfileByEmail, 
    getAllVehicles,
    updateVehicleAvailability,
    getAvailableVehicles 
} from '../controllers/vehicleController.js';
import { 
    registerCustomer, 
    loginCustomer, 
    getCustomerProfile, 
    updateCustomerProfile 
} from '../controllers/customerController.js';
import { 
    createTripRequest, 
    getCustomerTripRequests, 
    getTripRequestById, 
    updateTripRequest, 
    cancelTripRequest, 
    getTripStatistics,
    getAllTripRequests,
    assignTripToDriver,
    updateTripStatus,
    createTripRequestEnhanced,
    getTripDetails,
    getAllTripRequestsEnhanced,
    assignTripToDriverEnhanced,
    getDriverTrips,
    startTrip,
    updateTripLocation,
    completeTrip,
    trackTrip,
    getAssignmentOptions
} from '../controllers/tripController.js';
import { 
    Auth, 
    IsSuperAdmin, 
    IsAdmin, 
    IsTouroperator, 
    IsAdminOrTourOperator 
} from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/finduser', findUserByEmail);

router.get('/users', Auth, getAllUsers);
router.get('/profile', Auth, getDriverProfileByEmail);

// Driver management routes 
router.post('/add', Auth, addDriver);
router.put('/update', Auth, updateDriver);            
router.patch('/update', Auth, updateDriver);          

// Driver operational routes 
router.patch('/driver/availability', Auth, updateDriverAvailability);
router.put('/driver/location', Auth, updateDriverLocation);
router.get('/driver/statistics', Auth, getDriverStatistics);
router.get('/drivers/available', Auth, getAvailableDriversForTrip);
router.get('/drivers/available-by-type', getAvailableDriversByTripType);

// Vehicle management - Admin or Tour Operator access
router.post('/add-vehicle', Auth, IsAdminOrTourOperator, addVehicle);
router.put('/update-vehicle', Auth, IsAdminOrTourOperator, updateVehicle);
router.get('/vehicle-profile', Auth, getVehicleProfileByEmail);
router.get('/vehicles', Auth, IsAdminOrTourOperator, getAllVehicles);
router.patch('/vehicles/:vehicleId/availability', Auth, IsAdminOrTourOperator, updateVehicleAvailability);
router.get('/vehicles/available', Auth, IsAdminOrTourOperator, getAvailableVehicles);

// Customer authentication 
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);
router.get('/customer/profile', Auth, getCustomerProfile);
router.put('/customer/profile', Auth, updateCustomerProfile);

// Customer trip management
router.post('/trip/request', Auth, createTripRequest);
router.get('/trip/my-trips', Auth, getCustomerTripRequests);
router.get('/trip/my-trips/:tripId', Auth, getTripRequestById);
router.put('/trip/my-trips/:tripId', Auth, updateTripRequest);
router.patch('/trip/my-trips/:tripId/cancel', Auth, cancelTripRequest);
router.get('/trip/statistics', Auth, getTripStatistics);

// Admin/Tour Operator trip management - Both roles can access
router.get('/trip/all', Auth, IsAdminOrTourOperator, getAllTripRequests);
router.patch('/trip/:tripId/assign', Auth, IsAdminOrTourOperator, assignTripToDriver);
router.patch('/trip/:tripId/status', Auth, IsAdminOrTourOperator, updateTripStatus);

// Enhanced Trip Management Routes
// Customer enhanced trip management
router.post('/trip/request-enhanced', Auth, createTripRequestEnhanced);
router.get('/trip/details/:tripId', Auth, getTripDetails);
router.get('/trip/track/:tripId', Auth, trackTrip);

// Tour Operator enhanced trip management
router.get('/trip/all-enhanced', Auth, IsAdminOrTourOperator, getAllTripRequestsEnhanced);
router.patch('/trip/:tripId/assign-enhanced', Auth, IsAdminOrTourOperator, assignTripToDriverEnhanced);
router.get('/trip/:tripId/assignment-options', Auth, IsAdminOrTourOperator, getAssignmentOptions);

// Driver trip management
router.get('/driver/trips', Auth, getDriverTrips);
router.post('/driver/trips/:tripId/start', Auth, startTrip);
router.post('/driver/trips/:tripId/location', Auth, updateTripLocation);
router.post('/driver/trips/:tripId/complete', Auth, completeTrip);

// Driver status and location
router.get('/driver/status', Auth, getDriverStatus);
router.patch('/driver/status', Auth, updateDriverStatus);
router.get('/driver/location', Auth, getDriverLocation);
router.get('/driver/nearby', Auth, getNearbyDrivers);
router.get('/drivers/all', Auth, IsTouroperator, getAllDriversDetailed);
router.get('/drivers/:driverId/profile', Auth, IsTouroperator, getDriverById);
router.patch('/drivers/:driverId/availability', Auth, IsTouroperator, updateDriverAvailabilityByAdmin);
router.patch('/drivers/:driverId/preferences', Auth, IsTouroperator, updateDriverPreferences);
export default router;