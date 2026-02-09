import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule,
  LocationOn,
  Person,
  DirectionsCar,
  Phone,
  Email,
  Edit,
  Assignment,
  CheckCircle,
  Warning,
  Info,
  Star,
  Speed,
  CalendarToday,
  AttachMoney
} from '@mui/icons-material';
import UserService from '../../services/UserService';
import TripServices from '../../services/TripServices';

const TripDetailsModal = ({ 
  open, 
  onClose, 
  trip, 
  onAssign,
  onUpdate,
  isMobile 
}) => {
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // details, drivers, vehicles

  useEffect(() => {
    if (open && trip) {
      fetchAvailableResources();
      setSelectedDriver(trip.assigned_driver_id || '');
      setSelectedVehicle(trip.assigned_vehicle_id || '');
      setEstimatedCost(trip.estimated_cost || '');
    }
  }, [open, trip]);

  const fetchAvailableResources = async () => {
    if (!trip) return; // Add safety check
    
    try {
      setResourcesLoading(true);
      setError('');
      
      const [usersResponse, vehiclesResponse] = await Promise.all([
        UserService.getAllUsers().catch(() => ({ data: [] })),
        UserService.getAllVehicles().catch(() => ({ data: [] }))
      ]);

      // Filter drivers from users
      let driversData = [];
      if (usersResponse && usersResponse.data) {
        driversData = usersResponse.data.filter(user => 
          user.role_name === 'driver' && user.status !== 'inactive'
        );
      }

      // Filter vehicles by capacity and availability
      let vehiclesData = [];
      if (vehiclesResponse && vehiclesResponse.data) {
        vehiclesData = vehiclesResponse.data.filter(vehicle => 
          vehicle.availability === 'Available' && 
          vehicle.seating_capacity >= (trip.passenger_count || 1)
        );
      }

      setAvailableDrivers(driversData);
      setAvailableVehicles(vehiclesData);
      
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load available resources');
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleAssignResources = async () => {
    if (!trip) {
      setError('Trip information is not available');
      return;
    }

    if (!selectedDriver || !selectedVehicle || !estimatedCost) {
      setError('Please select both driver and vehicle, and enter estimated cost');
      return;
    }

    try {
      setLoading(true);
      const assignmentData = {
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
        estimatedCost: estimatedCost
      };

      await onAssign(trip.trip_id, assignmentData);
      handleClose();
    } catch (error) {
      console.error('Error assigning resources:', error);
      setError('Failed to assign resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDriver('');
    setSelectedVehicle('');
    setEstimatedCost('');
    setError('');
    setActiveTab('details');
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'confirmed':
      case 'assigned':
        return '#2196f3';
      case 'in-progress':
        return '#4caf50';
      case 'completed':
        return '#9e9e9e';
      case 'cancelled':
        return '#f44336';
      default:
        return '#FDCB42';
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (time.includes(':')) return time;
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateEstimatedCost = () => {
    if (!trip) return;
    
    const baseRate = 50;
    const distanceRate = 2;
    const passengerRate = 10;
    
    const distance = Math.floor(Math.random() * 200) + 20;
    const estimated = baseRate + (distance * distanceRate) + ((trip.passenger_count || 1) * passengerRate);
    
    setEstimatedCost(estimated.toFixed(2));
  };

  const getDriverDisplayInfo = (driver) => {
    if (!driver) return { name: 'Unknown Driver', license: 'N/A', experience: 0, rating: 0, phone: 'N/A', email: 'N/A' };
    
    return {
      name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Unknown Driver',
      license: driver.license_type || 'Standard License',
      experience: driver.experience_years || 0,
      rating: driver.rating || 4.5,
      phone: driver.phone || 'N/A',
      email: driver.email || 'N/A'
    };
  };

  const getVehicleDisplayInfo = (vehicle) => {
    if (!vehicle) return { model: 'Unknown Vehicle', type: 'N/A', capacity: 0, plate: 'N/A', fuelType: 'N/A', year: 'N/A' };
    
    return {
      model: vehicle.model || vehicle.vehicle_type || 'Vehicle',
      type: vehicle.vehicle_type || 'Standard',
      capacity: vehicle.seating_capacity || 0,
      plate: vehicle.license_plate || 'N/A',
      fuelType: vehicle.fuel_type || 'Petrol',
      year: vehicle.year || 'N/A'
    };
  };

  // Early return if no trip data
  if (!trip) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
            <Warning color="warning" />
            <Typography variant="body1">No trip data available</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const needsAssignment = !trip.assigned_driver_id || !trip.assigned_vehicle_id;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: isMobile ? '100vh' : '80vh',
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
          <Info sx={{ mr: 1 }} />
          Trip Details & Assignment
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'black' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {needsAssignment && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Assignment Required</Typography>
            <Typography variant="body2">
              This trip needs driver and vehicle assignment to proceed.
            </Typography>
          </Alert>
        )}

        {/* Trip Information Card */}
        <Card sx={{ mb: 3, border: `2px solid ${getStatusColor(trip.status)}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {trip.title || 'Untitled Trip'}
              </Typography>
              <Chip
                label={trip.status?.toUpperCase() || 'UNKNOWN'}
                sx={{
                  bgcolor: getStatusColor(trip.status),
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                    <Typography variant="body1">
                      {formatDate(trip.preferred_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(trip.preferred_time)}
                      {trip.return_time && ` - ${formatTime(trip.return_time)}`}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                    <Typography variant="body2">
                      <strong>From:</strong> {trip.origin || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>To:</strong> {trip.destination || 'N/A'}
                    </Typography>
                    {trip.stops && (
                      <Typography variant="body2">
                        <strong>Stops:</strong> {trip.stops}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Customer Information</Typography>
                    <Typography variant="body1">
                      {trip.contact_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trip.passenger_count || 1} passenger(s)
                    </Typography>
                    {trip.contact_phone && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                        {trip.contact_phone}
                      </Typography>
                    )}
                    {trip.contact_email && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ fontSize: 14, mr: 0.5 }} />
                        {trip.contact_email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {trip.estimated_cost && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Estimated Cost</Typography>
                      <Typography variant="h6" sx={{ color: '#FDCB42', fontWeight: 'bold' }}>
                        ${trip.estimated_cost}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>

            {trip.special_requirements && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Special Requirements</Typography>
                <Typography variant="body2">{trip.special_requirements}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        {/* Resource Assignment Section */}
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1, color: '#FDCB42' }} />
          Resource Assignment
        </Typography>

        {resourcesLoading ? (
          <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading available resources...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Driver Selection */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: '#FDCB42' }} />
                    Available Drivers ({availableDrivers.length})
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Driver</InputLabel>
                    <Select
                      value={selectedDriver}
                      label="Select Driver"
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a driver</em>
                      </MenuItem>
                      {availableDrivers.map((driver) => {
                        const info = getDriverDisplayInfo(driver);
                        return (
                          <MenuItem key={driver.user_id} value={driver.user_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Avatar sx={{ mr: 1, bgcolor: '#FDCB42', color: 'black', width: 32, height: 32 }}>
                                {info.name.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {info.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {info.license} • {info.experience} years exp.
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Star sx={{ fontSize: 14, color: '#FFD700', mr: 0.5 }} />
                                <Typography variant="caption">{info.rating}</Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {/* Selected Driver Details */}
                  {selectedDriver && (
                    <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.1)', border: '1px solid #FDCB42' }}>
                      <CardContent sx={{ p: 2 }}>
                        {(() => {
                          const driver = availableDrivers.find(d => d.user_id === selectedDriver);
                          if (!driver) return null;
                          const info = getDriverDisplayInfo(driver);
                          return (
                            <>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Selected Driver
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar sx={{ mr: 1, bgcolor: '#FDCB42', color: 'black' }}>
                                  {info.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {info.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {info.license} • {info.experience} years experience
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 12, mr: 0.5 }} />
                                {info.phone}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Vehicle Selection */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                    Available Vehicles ({availableVehicles.length})
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Vehicle</InputLabel>
                    <Select
                      value={selectedVehicle}
                      label="Select Vehicle"
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a vehicle</em>
                      </MenuItem>
                      {availableVehicles.map((vehicle) => {
                        const info = getVehicleDisplayInfo(vehicle);
                        return (
                          <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {info.model}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {info.type} • Capacity: {info.capacity} • {info.plate}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {/* Selected Vehicle Details */}
                  {selectedVehicle && (
                    <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.1)', border: '1px solid #FDCB42' }}>
                      <CardContent sx={{ p: 2 }}>
                        {(() => {
                          const vehicle = availableVehicles.find(v => v.vehicle_id === selectedVehicle);
                          if (!vehicle) return null;
                          const info = getVehicleDisplayInfo(vehicle);
                          return (
                            <>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Selected Vehicle
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {info.model}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {info.type} • {info.year} • {info.fuelType}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="caption">
                                Capacity: {info.capacity} passengers • Plate: {info.plate}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Cost Estimation */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1, color: '#FDCB42' }} />
                    Cost Estimation
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Estimated Cost"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        placeholder="e.g., 150.00"
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={calculateEstimatedCost}
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
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Assignment Summary */}
            {selectedDriver && selectedVehicle && estimatedCost && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '2px solid #4caf50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#4caf50' }}>
                      <CheckCircle sx={{ mr: 1 }} />
                      Assignment Ready
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All resources have been selected. Click "Assign Resources" to confirm the assignment.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          fullWidth={isMobile}
        >
          Close
        </Button>
        
        {needsAssignment && (
          <Button 
            onClick={handleAssignResources}
            variant="contained"
            sx={{ 
              bgcolor: '#FDCB42', 
              '&:hover': { bgcolor: '#fbbf24' },
              fontWeight: 'bold'
            }}
            disabled={loading || !selectedDriver || !selectedVehicle || !estimatedCost}
            fullWidth={isMobile}
          >
            {loading ? 'Assigning...' : 'Assign Resources'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TripDetailsModal;