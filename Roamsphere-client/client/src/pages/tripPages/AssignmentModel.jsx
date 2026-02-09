import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Rating
} from '@mui/material';
import {
  Close as CloseIcon,
  Person,
  DirectionsCar,
  Assignment,
  AttachMoney,
  Info,
  CheckCircle,
  Phone,
  Badge,
  Star,
  Route,
  Calculate
} from '@mui/icons-material';
import UserService from '../../services/UserService';

const AssignmentModal = ({ 
  open, 
  onClose, 
  trip, 
  onAssign, 
  isMobile 
}) => {
  const [assignmentData, setAssignmentData] = useState({
    driverId: '',
    vehicleId: '',
    estimatedCost: ''
  });
  
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && trip) {
      fetchAvailableResources();
      // Pre-fill with existing assignments if any
      setAssignmentData({
        driverId: trip.assigned_driver_id || '',
        vehicleId: trip.assigned_vehicle_id || '',
        estimatedCost: trip.estimated_cost || ''
      });
    }
  }, [open, trip]);

  // Auto-calculate cost when driver, vehicle, or trip changes
  useEffect(() => {
    if (assignmentData.driverId && assignmentData.vehicleId && trip) {
      const calculatedCost = calculateDistanceBasedCost();
      if (calculatedCost && !assignmentData.estimatedCost) {
        setAssignmentData(prev => ({
          ...prev,
          estimatedCost: calculatedCost
        }));
      }
    }
  }, [assignmentData.driverId, assignmentData.vehicleId, trip]);

  const fetchAvailableResources = async () => {
    try {
      setResourcesLoading(true);
      
      const [usersResponse, vehiclesResponse] = await Promise.all([
        UserService.getAllUsers().catch(() => []),
        UserService.getAllVehicles().catch(() => [])
      ]);

      // Enhanced driver fetching with profiles
      let driversData = [];
      if (usersResponse && Array.isArray(usersResponse)) {
        const driverUsers = usersResponse.filter(user => 
          user.role_name === 'driver' && user.status !== 'inactive'
        );

        // Fetch detailed profile for each driver
        const driversWithProfiles = await Promise.all(
          driverUsers.map(async (user) => {
            try {
              // Get driver profile details
              const driverProfile = await UserService.getDriverProfileByEmail(user.email);
              
              return {
                user_id: user.id,
                id: user.id,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
                email: user.email,
                profile_image: driverProfile?.image_url || user.image_url || '',
                avatar: driverProfile?.image_url || user.image_url || '',
                driver_image: driverProfile?.image_url || user.image_url || '',
                phone: driverProfile?.mobile || 'N/A',
                mobile: driverProfile?.mobile || 'N/A',
                license_no: driverProfile?.license_no || 'N/A',
                license_type: driverProfile?.license_type || 'N/A',
                experience_years: driverProfile?.experience_years || 0,
                address: driverProfile?.address || 'N/A',
                age: driverProfile?.age || 'N/A',
                availability: 'Available', // You can implement real availability check
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Random rating between 3.0-5.0
                total_trips: Math.floor(Math.random() * 200) + 50,
                base_rate: driverProfile?.base_rate || 50, // Driver's base rate per hour
                per_km_rate: driverProfile?.per_km_rate || 2 // Driver's rate per kilometer
              };
            } catch (profileError) {
              console.error(`Error fetching profile for ${user.email}:`, profileError);
              return {
                user_id: user.id,
                id: user.id,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
                email: user.email,
                profile_image: user.image_url || '',
                avatar: user.image_url || '',
                driver_image: user.image_url || '',
                phone: 'Profile not created',
                mobile: 'Profile not created',
                license_no: 'Profile not created',
                license_type: 'N/A',
                experience_years: 0,
                availability: 'Available',
                rating: 0,
                total_trips: 0,
                base_rate: 50,
                per_km_rate: 2
              };
            }
          })
        );

        driversData = driversWithProfiles.filter(driver => driver.availability === 'Available');
      }

      // Enhanced vehicle fetching with cost rates
      let vehiclesData = [];
      if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
        vehiclesData = vehiclesResponse
          .filter(vehicle => 
            vehicle.availability === 'Available' && 
            vehicle.seating_capacity >= (trip.passenger_count || 1)
          )
          .map(vehicle => ({
            ...vehicle,
            // Add vehicle-specific rates (you can store these in database)
            base_cost: getVehicleBaseCost(vehicle.vehicle_type),
            luxury_multiplier: getVehicleLuxuryMultiplier(vehicle.category),
            fuel_efficiency: getVehicleFuelEfficiency(vehicle.vehicle_type),
            per_km_cost: getVehiclePerKmCost(vehicle.vehicle_type)
          }));
      }

      setAvailableDrivers(driversData);
      setAvailableVehicles(vehiclesData);
      
    } catch (error) {
      console.error('Error fetching resources:', error);
      setErrors({ fetch: 'Failed to load available resources' });
    } finally {
      setResourcesLoading(false);
    }
  };

  // Vehicle cost calculation helpers
  const getVehicleBaseCost = (vehicleType) => {
    const baseCosts = {
      'Car': 30,
      'SUV': 40,
      'Van': 50,
      'Bus': 80,
      'Luxury Car': 100,
      'Mini Bus': 60,
      'Truck': 70
    };
    return baseCosts[vehicleType] || 30;
  };

  const getVehicleLuxuryMultiplier = (category) => {
    const multipliers = {
      'Luxury': 2.0,
      'Safari': 1.5,
      'Tour': 1.3,
      'Adventure': 1.4,
      'Casual': 1.0
    };
    return multipliers[category] || 1.0;
  };

  const getVehicleFuelEfficiency = (vehicleType) => {
    const efficiency = {
      'Car': 15, // km per liter
      'SUV': 12,
      'Van': 10,
      'Bus': 8,
      'Luxury Car': 12,
      'Mini Bus': 9,
      'Truck': 7
    };
    return efficiency[vehicleType] || 12;
  };

  const getVehiclePerKmCost = (vehicleType) => {
    const perKmCosts = {
      'Car': 1.5,
      'SUV': 2.0,
      'Van': 2.5,
      'Bus': 4.0,
      'Luxury Car': 3.5,
      'Mini Bus': 3.0,
      'Truck': 3.5
    };
    return perKmCosts[vehicleType] || 2.0;
  };

  // Enhanced distance-based cost calculation
  const calculateDistanceBasedCost = () => {
    if (!trip || !assignmentData.driverId || !assignmentData.vehicleId) {
      return '';
    }

    const selectedDriver = availableDrivers.find(d => d.user_id === assignmentData.driverId);
    const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

    if (!selectedDriver || !selectedVehicle) {
      return '';
    }

    // Get trip distance (from previous calculation or estimate)
    const distance = trip.estimated_distance_km || estimateDistance();
    
    // Base calculation components
    const driverBaseRate = selectedDriver.base_rate || 50;
    const driverPerKmRate = selectedDriver.per_km_rate || 2;
    const vehicleBaseCost = selectedVehicle.base_cost || 30;
    const vehiclePerKmCost = selectedVehicle.per_km_cost || 2;
    const luxuryMultiplier = selectedVehicle.luxury_multiplier || 1;
    
    // Calculate individual components
    const distanceCost = distance * (driverPerKmRate + vehiclePerKmCost);
    const baseCost = driverBaseRate + vehicleBaseCost;
    const passengerCost = (trip.passenger_count || 1) * 5; // $5 per passenger
    
    // Time-based calculation (estimate 2 hours minimum)
    const estimatedHours = Math.max(2, distance / 60); // Assuming 60 km/h average speed
    const timeCost = estimatedHours * 20; // $20 per hour
    
    // Round trip adjustment
    const roundTripMultiplier = trip.category === 'round-trip' ? 1.8 : 1.0;
    
    // Priority adjustment
    const priorityMultiplier = getPriorityMultiplier(trip.priority);
    
    // Final calculation
    let totalCost = (baseCost + distanceCost + passengerCost + timeCost) * luxuryMultiplier * roundTripMultiplier * priorityMultiplier;
    
    // Add fuel cost estimation
    const fuelCostPerLiter = 2.5; // $2.5 per liter
    const fuelCost = (distance / selectedVehicle.fuel_efficiency) * fuelCostPerLiter;
    totalCost += fuelCost;
    
    // Round to 2 decimal places
    return Math.max(50, totalCost).toFixed(2); // Minimum $50
  };

  const estimateDistance = () => {
    // Fallback distance estimation based on locations
    // This would normally use your existing distance calculation logic
    return 50; // Default 50km if no distance calculated
  };

  const getPriorityMultiplier = (priority) => {
    const multipliers = {
      'high': 1.5,
      'medium': 1.2,
      'low': 1.0
    };
    return multipliers[priority?.toLowerCase()] || 1.0;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleInputChange = (field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateAssignment = () => {
    const newErrors = {};

    if (!assignmentData.driverId) {
      newErrors.driverId = 'Driver selection is required';
    }

    if (!assignmentData.vehicleId) {
      newErrors.vehicleId = 'Vehicle selection is required';
    }

    if (!assignmentData.estimatedCost) {
      newErrors.estimatedCost = 'Estimated cost is required';
    } else if (isNaN(parseFloat(assignmentData.estimatedCost))) {
      newErrors.estimatedCost = 'Please enter a valid cost';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssign = async () => {
    if (!validateAssignment()) {
      return;
    }

    try {
      setLoading(true);
      await onAssign(assignmentData);
      handleClose();
    } catch (error) {
      console.error('Error assigning trip:', error);
      setErrors({ submit: 'Failed to assign trip. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAssignmentData({
      driverId: '',
      vehicleId: '',
      estimatedCost: ''
    });
    setErrors({});
    onClose();
  };

  // Enhanced driver display with rating and experience
  const DriverMenuItem = ({ driver }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
      <Avatar 
        src={driver.profile_image || driver.avatar || driver.driver_image} 
        sx={{ width: 40, height: 40, mr: 2, bgcolor: '#FDCB42' }}
      >
        {!driver.profile_image && !driver.avatar && !driver.driver_image && getInitials(driver.name)}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {driver.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {driver.license_type} • {driver.experience_years} years exp.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Rating
            value={driver.rating}
            readOnly
            precision={0.1}
            size="small"
            sx={{
              color: '#FFD700',
              '& .MuiRating-iconFilled': { color: '#FFD700' },
              '& .MuiRating-iconEmpty': { color: '#E0E0E0' },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            ({driver.rating})
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Base: ${driver.base_rate}/trip • ${driver.per_km_rate}/km
        </Typography>
        {driver.phone && driver.phone !== 'N/A' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            📞 {driver.phone}
          </Typography>
        )}
      </Box>
      <Chip
        label={driver.availability}
        size="small"
        color={driver.availability === 'Available' ? 'success' : 'default'}
        sx={{ ml: 1 }}
      />
    </Box>
  );

  // Enhanced vehicle display with cost information
  const VehicleMenuItem = ({ vehicle }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {vehicle.image_url ? (
        <Avatar 
          src={vehicle.image_url} 
          variant="rounded"
          sx={{ width: 32, height: 32, mr: 2 }}
        />
      ) : (
        <Avatar 
          variant="rounded"
          sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
        >
          <DirectionsCar fontSize="small" />
        </Avatar>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {vehicle.model || vehicle.vehicle_type || 'Vehicle'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {vehicle.vehicle_type || 'Type'} • Capacity: {vehicle.seating_capacity || 0}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          🚗 {vehicle.license_plate || 'N/A'} • ${vehicle.per_km_cost}/km
        </Typography>
        {vehicle.category && (
          <Chip 
            label={vehicle.category} 
            size="small" 
            sx={{ 
              fontSize: '10px', 
              height: '16px',
              bgcolor: vehicle.category === 'Luxury' ? '#FDCB42' : 'primary.light',
              color: vehicle.category === 'Luxury' ? 'black' : 'white'
            }} 
          />
        )}
      </Box>
    </Box>
  );

  // Get selected driver and vehicle for summary
  const selectedDriver = availableDrivers.find(d => d.user_id === assignmentData.driverId);
  const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

  if (!trip) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: isMobile ? '100vh' : '70vh',
          m: isMobile ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#FDCB42', 
        color: 'black', 
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          Assign Driver & Vehicle
        </Box>
        {isMobile && (
          <IconButton onClick={handleClose} sx={{ color: 'black' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors(prev => ({ ...prev, submit: undefined }))}>
            {errors.submit}
          </Alert>
        )}

        {errors.fetch && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {errors.fetch}
          </Alert>
        )}

        {/* Trip Information with Distance */}
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Info sx={{ mr: 1, color: '#FDCB42' }} />
              Trip Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>Title:</strong> {trip.title}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {trip.preferred_date}</Typography>
                <Typography variant="body2"><strong>Time:</strong> {trip.preferred_time}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {trip.category}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2"><strong>Passengers:</strong> {trip.passenger_count || 1}</Typography>
                <Typography variant="body2"><strong>Priority:</strong> 
                  <Chip 
                    label={trip.priority || 'Normal'} 
                    size="small" 
                    sx={{ 
                      ml: 1,
                      bgcolor: trip.priority === 'high' ? 'error.main' : 
                               trip.priority === 'medium' ? 'warning.main' : 'success.main',
                      color: 'white'
                    }}
                  />
                </Typography>
                <Typography variant="body2"><strong>Contact:</strong> {trip.contact_name}</Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Route sx={{ mr: 1, fontSize: 16 }} />
                  <strong>Distance:</strong> {trip.estimated_distance_km || 'Calculating...'} km
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2"><strong>Route:</strong></Typography>
                <Typography variant="caption" color="text.secondary">
                  From: {trip.origin}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  To: {trip.destination}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {resourcesLoading ? (
          <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading available resources...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Driver Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.driverId}>
                <InputLabel>Select Driver *</InputLabel>
                <Select
                  value={assignmentData.driverId}
                  label="Select Driver *"
                  onChange={(e) => handleInputChange('driverId', e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 400 }
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a driver</em>
                  </MenuItem>
                  {availableDrivers.map((driver) => (
                    <MenuItem key={driver.user_id} value={driver.user_id} sx={{ py: 1 }}>
                      <DriverMenuItem driver={driver} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.driverId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.driverId}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                  Available drivers: {availableDrivers.length}
                </Typography>
              </FormControl>
            </Grid>

            {/* Vehicle Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.vehicleId}>
                <InputLabel>Select Vehicle *</InputLabel>
                <Select
                  value={assignmentData.vehicleId}
                  label="Select Vehicle *"
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 400 }
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a vehicle</em>
                  </MenuItem>
                  {availableVehicles.map((vehicle) => (
                    <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id} sx={{ py: 1 }}>
                      <VehicleMenuItem vehicle={vehicle} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.vehicleId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.vehicleId}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                  Available vehicles (capacity ≥ {trip.passenger_count || 1}): {availableVehicles.length}
                </Typography>
              </FormControl>
            </Grid>

            {/* Cost Estimation with breakdown */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Estimated Cost *"
                value={assignmentData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                error={!!errors.estimatedCost}
                helperText={errors.estimatedCost || 'Automatically calculated based on distance, vehicle type, and driver rates'}
                placeholder="e.g., 150.00"
                InputProps={{
                  startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Calculate />}
                onClick={() => {
                  const calculatedCost = calculateDistanceBasedCost();
                  if (calculatedCost) {
                    handleInputChange('estimatedCost', calculatedCost);
                  }
                }}
                disabled={!assignmentData.driverId || !assignmentData.vehicleId}
                sx={{
                  height: '56px',
                  borderColor: '#FDCB42',
                  color: '#FDCB42',
                  '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' }
                }}
              >
                Auto-Calculate
              </Button>
            </Grid>

            {/* Cost Breakdown Display */}
            {assignmentData.driverId && assignmentData.vehicleId && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid rgba(253, 203, 66, 0.3)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Calculate sx={{ mr: 1, color: '#FDCB42' }} />
                      Cost Breakdown
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Base Cost</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${((selectedDriver?.base_rate || 50) + (selectedVehicle?.base_cost || 30)).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Distance Cost</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${((trip.estimated_distance_km || 50) * ((selectedDriver?.per_km_rate || 2) + (selectedVehicle?.per_km_cost || 2))).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Vehicle Category</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedVehicle?.category || 'Standard'} ({((selectedVehicle?.luxury_multiplier || 1) * 100).toFixed(0)}%)
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Priority</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {trip.priority || 'Normal'} ({(getPriorityMultiplier(trip.priority) * 100).toFixed(0)}%)
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Enhanced Assignment Summary */}
            {assignmentData.driverId && assignmentData.vehicleId && assignmentData.estimatedCost && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.1)', border: '1px solid #FDCB42' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#FDCB42' }}>
                      <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Assignment Summary
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {/* Enhanced Driver Summary */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, fontSize: 16 }} />
                            Selected Driver
                          </Typography>
                          {selectedDriver && (
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                              <Avatar 
                                src={selectedDriver.profile_image || selectedDriver.avatar || selectedDriver.driver_image} 
                                sx={{ width: 60, height: 60, mr: 2, bgcolor: '#FDCB42' }}
                              >
                                {!selectedDriver.profile_image && !selectedDriver.avatar && !selectedDriver.driver_image && getInitials(selectedDriver.name)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {selectedDriver.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {selectedDriver.license_type} • {selectedDriver.experience_years} years exp.
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Rating
                                    value={selectedDriver.rating}
                                    readOnly
                                    precision={0.1}
                                    size="small"
                                    sx={{
                                      color: '#FFD700',
                                      '& .MuiRating-iconFilled': { color: '#FFD700' },
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    ({selectedDriver.rating})
                                  </Typography>
                                </Box>
                                {selectedDriver.phone && selectedDriver.phone !== 'N/A' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    📞 {selectedDriver.phone}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {/* Vehicle Summary */}
                        <Box>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <DirectionsCar sx={{ mr: 1, fontSize: 16 }} />
                            Selected Vehicle
                          </Typography>
                          {selectedVehicle && (
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                              {selectedVehicle.image_url ? (
                                <Avatar 
                                  src={selectedVehicle.image_url} 
                                  variant="rounded"
                                  sx={{ width: 60, height: 60, mr: 2 }}
                                />
                              ) : (
                                <Avatar 
                                  variant="rounded"
                                  sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}
                                >
                                  <DirectionsCar />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {selectedVehicle.model || selectedVehicle.vehicle_type || 'Vehicle'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {selectedVehicle.vehicle_type || 'Type'} • Capacity: {selectedVehicle.seating_capacity || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  🚗 {selectedVehicle.license_plate || 'N/A'}
                                </Typography>
                                {selectedVehicle.category && (
                                  <Chip 
                                    label={selectedVehicle.category} 
                                    size="small" 
                                    sx={{ 
                                      mt: 0.5,
                                      fontSize: '10px', 
                                      height: '20px',
                                      bgcolor: selectedVehicle.category === 'Luxury' ? '#FDCB42' : 'primary.light',
                                      color: selectedVehicle.category === 'Luxury' ? 'black' : 'white'
                                    }} 
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Trip & Cost Summary */}
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoney sx={{ mr: 1, fontSize: 16 }} />
                            Trip Summary
                          </Typography>
                          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#FDCB42' }}>
                              ${assignmentData.estimatedCost}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Distance:</strong> {trip.estimated_distance_km || 'TBD'} km
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Trip Date:</strong> {trip.preferred_date} at {trip.preferred_time}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Route:</strong> {trip.origin} → {trip.destination}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Passengers:</strong> {trip.passenger_count || 1} people
                            </Typography>
                            {trip.category === 'round-trip' && (
                              <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                                ⚡ Round trip pricing applied
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleAssign}
          variant="contained"
          sx={{ 
            bgcolor: '#FDCB42', 
            '&:hover': { bgcolor: '#fbbf24' },
            fontWeight: 'bold'
          }}
          disabled={loading || !assignmentData.driverId || !assignmentData.vehicleId || !assignmentData.estimatedCost}
          fullWidth={isMobile}
        >
          {loading ? 'Assigning...' : `Assign Trip - $${assignmentData.estimatedCost}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentModal;