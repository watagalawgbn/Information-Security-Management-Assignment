import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  Fab,
  Container,
  Slide,
  RadioGroup,
  Radio,
  Checkbox
} from '@mui/material';
import {
  DirectionsCar,
  LocationOn,
  Notifications,
  Settings,
  Person,
  Assignment,
  CheckCircle,
  PlayArrow,
  Refresh,
  AccessTime,
  PowerSettingsNew,
  Coffee,
  Update,
  Diamond,
  Terrain,
  Map,
  Hiking,
  DriveEta
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import DriverServices from '../../services/DriverServices';
import TripCard from '../tripPages/TripCard';

const DriverDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('offline');
  const [statusChanging, setStatusChanging] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [locationTracking, setLocationTracking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentDriverId, setCurrentDriverId] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [preferredTripTypes, setPreferredTripTypes] = useState(['Casual']);

  const statusOptions = [
    { 
      value: 'offline', 
      label: 'Offline', 
      description: 'Not available for trips',
      icon: <PowerSettingsNew />,
      color: '#6c757d'
    },
    { 
      value: 'available', 
      label: 'Available', 
      description: 'Ready to accept trips',
      icon: <CheckCircle />,
      color: '#28a745'
    },
    { 
      value: 'on-trip', 
      label: 'On Trip', 
      description: 'Currently on a trip',
      icon: <DirectionsCar />,
      color: '#007bff'
    },
    { 
      value: 'on-leave', 
      label: 'On Break', 
      description: 'Taking a break',
      icon: <Coffee />,
      color: '#ffc107'
    }
  ];

  const tripTypeOptions = [
    { 
      value: 'Luxury', 
      label: 'Luxury', 
      icon: <Diamond />, 
      color: '#8e24aa',
      description: 'Premium luxury trips'
    },
    { 
      value: 'Safari', 
      label: 'Safari', 
      icon: <Terrain />, 
      color: '#558b2f',
      description: 'Wildlife and nature tours'
    },
    { 
      value: 'Tour', 
      label: 'Tour', 
      icon: <Map />, 
      color: '#1976d2',
      description: 'Sightseeing and cultural tours'
    },
    { 
      value: 'Adventure', 
      label: 'Adventure', 
      icon: <Hiking />, 
      color: '#d32f2f',
      description: 'Adventure and sports activities'
    },
    { 
      value: 'Casual', 
      label: 'Casual', 
      icon: <DriveEta />, 
      color: '#616161',
      description: 'Regular transport services'
    }
  ];

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (currentStatus !== 'offline') {
        refreshDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Reload trips when driver ID changes
  useEffect(() => {
    if (currentDriverId) {
      loadAssignedTrips();
    }
  }, [currentDriverId]);

  const checkAuthAndLoadData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const tokenData = jwtDecode(token);
      const email = tokenData.email;
      setCurrentUserEmail(email);

      if (tokenData.role !== 'driver') {
        navigate('/login');
        return;
      }

      await loadDashboardData(email);
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/login');
    }
  };

  const loadDashboardData = async (email) => {
    try {
      setLoading(true);
      setError('');

      // Get driver profile by email using DriverServices
      const profileResponse = await DriverServices.getDriverProfileByEmail(email || currentUserEmail);
      
      if (!profileResponse) {
        setError('Driver profile not found. Please complete your profile first.');
        setTimeout(() => navigate('/driver/profile'), 2000);
        return;
      }

      setDriver(profileResponse);
      setCurrentDriverId(profileResponse.driver_id); // Store driver ID
      setCurrentStatus(profileResponse.availability || 'offline');
      
      // Set preferred trip types from profile
      if (profileResponse.preferred_trip_types) {
        try {
          const types = typeof profileResponse.preferred_trip_types === 'string' 
            ? JSON.parse(profileResponse.preferred_trip_types)
            : profileResponse.preferred_trip_types;
          setPreferredTripTypes(Array.isArray(types) ? types : ['Casual']);
        } catch (error) {
          console.error('Error parsing preferred trip types:', error);
          setPreferredTripTypes(['Casual']);
        }
      }

      // Load dashboard data
      await loadCurrentTrip();
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedTrips = async () => {
    try {
      if (!currentDriverId) {
        setAssignedTrips([]);
        return;
      }

      // Get trips that are assigned to this specific driver
      const trips = await DriverServices.getAssignedTripsForDriver(currentDriverId);
      setAssignedTrips(Array.isArray(trips) ? trips : []);
      
    } catch (error) {
      console.error('Error loading assigned trips:', error);
      setAssignedTrips([]);
    }
  };

  const loadCurrentTrip = async () => {
    try {
      if (!currentDriverId) {
        setCurrentTrip(null);
        return;
      }

      // Get current active trip for this driver
      const trip = await DriverServices.getCurrentTripForDriver(currentDriverId);
      setCurrentTrip(trip);
      
    } catch (error) {
      console.error('Error loading current trip:', error);
      setCurrentTrip(null);
    }
  };

  const refreshDashboardData = async () => {
    try {
      await Promise.all([
        loadAssignedTrips(),
        loadCurrentTrip()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (statusChanging || newStatus === currentStatus) return;

    try {
      setStatusChanging(true);
      setError('');
      
      // Prepare location data if going online
      let locationData = {};
      if (newStatus === 'available' && navigator.geolocation) {
        try {
          const position = await getCurrentPosition();
          locationData = {
            last_location_lat: position.coords.latitude,
            last_location_lng: position.coords.longitude,
            last_location_update: new Date().toISOString()
          };
        } catch (locationError) {
          console.warn('Could not get location:', locationError);
        }
      }

      // Use PATCH method for availability updates
      await DriverServices.updateDriverAvailability(currentUserEmail, newStatus, locationData);
      
      setCurrentStatus(newStatus);
      setSuccess(`Status updated to ${statusOptions.find(s => s.value === newStatus)?.label}`);
      
      // Handle location tracking
      if (newStatus === 'offline') {
        setLocationTracking(false);
        stopLocationTracking();
      } else if (newStatus === 'available') {
        setLocationTracking(true);
        startLocationTracking();
      }
      
      // Refresh data after status change
      await refreshDashboardData();
      setStatusDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
      // Revert status if there was an error
      setCurrentStatus(driver?.availability || 'offline');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleTripTypePreferenceChange = async (newTypes) => {
    try {
      setPreferredTripTypes(newTypes);
      
      // Use PATCH method for trip preferences updates
      await DriverServices.updateTripPreferences(currentUserEmail, newTypes);
      
      setSuccess('Trip type preferences updated successfully!');
      
      // Refresh assigned trips with new preferences
      await loadAssignedTrips();
      
    } catch (error) {
      console.error('Error updating trip type preferences:', error);
      setError('Failed to update preferences. Please try again.');
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const handleLocationToggle = (enabled) => {
    setLocationTracking(enabled);
    
    if (enabled) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await DriverServices.updateDriverLocation({
            email: currentUserEmail,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Could not get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    window.driverLocationWatchId = watchId;
  };

  const stopLocationTracking = () => {
    if (window.driverLocationWatchId) {
      navigator.geolocation.clearWatch(window.driverLocationWatchId);
      window.driverLocationWatchId = null;
    }
  };

  const handleTripAction = async (tripId, action, data = {}) => {
    try {
      setError('');
      
      switch (action) {
        case 'accept':
          await DriverServices.acceptTrip(tripId);
          setSuccess('Trip accepted successfully!');
          break;
        case 'reject':
          await DriverServices.rejectTrip(tripId, data.reason || 'Not available');
          setSuccess('Trip rejected.');
          break;
        case 'start':
          await DriverServices.startTrip(tripId);
          await handleStatusChange('on-trip');
          setSuccess('Trip started!');
          break;
        case 'complete':
          await DriverServices.completeTrip(tripId, data);
          await handleStatusChange('available');
          setSuccess('Trip completed!');
          break;
        default:
          break;
      }
      
      await refreshDashboardData();
      
    } catch (error) {
      console.error(`Error ${action} trip:`, error);
      setError(`Failed to ${action} trip`);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = statusOptions.find(opt => opt.value === status);
    return (
      <Chip
        icon={statusConfig?.icon}
        label={statusConfig?.label}
        variant="outlined"
        size="medium"
        sx={{
          fontWeight: 'bold',
          borderColor: statusConfig?.color || '#6c757d',
          color: statusConfig?.color || '#6c757d',
          '& .MuiChip-icon': {
            color: statusConfig?.color || '#6c757d'
          },
          '&:hover': {
            backgroundColor: `${statusConfig?.color || '#6c757d'}15`
          }
        }}
      />
    );
  };

  const getTripTypeChip = (tripType) => {
    const typeConfig = tripTypeOptions.find(opt => opt.value === tripType);
    return (
      <Chip
        icon={typeConfig?.icon}
        label={typeConfig?.label}
        size="small"
        sx={{
          backgroundColor: `${typeConfig?.color || '#616161'}20`,
          color: typeConfig?.color || '#616161',
          fontWeight: 'bold',
          '& .MuiChip-icon': {
            color: typeConfig?.color || '#616161'
          }
        }}
      />
    );
  };

  const StatusHeader = () => (
    <Paper 
      elevation={1}
      sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 3,
        borderRadius: 2,
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            src={driver?.image_url} 
            sx={{ 
              width: isMobile ? 60 : 80,
              height: isMobile ? 60 : 80,
              fontSize: isMobile ? '1.5rem' : '2rem',
              border: '2px solid #e9ecef',
              backgroundColor: '#f0f0f0',
              color: '#666'
            }}
          >
            {driver?.first_name?.charAt(0)}{driver?.last_name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
              fontWeight: 'bold', 
              mb: 0.5,
              color: '#343a40'
            }}>
              {driver?.first_name} {driver?.last_name}
            </Typography>
            <Typography variant="body2" sx={{ 
              opacity: 0.7,
              mb: 1,
              color: '#6c757d'
            }}>
              ID: {driver?.driver_id || 'N/A'} | {driver?.license_type} | {driver?.experience_years}y exp
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                  Status:
                </Typography>
                {getStatusChip(currentStatus)}
              </Box>
              {currentStatus === 'available' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={locationTracking}
                      onChange={(e) => handleLocationToggle(e.target.checked)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#28a745'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#28a745'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                      GPS Tracking
                    </Typography>
                  }
                />
              )}
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} flexDirection={isMobile ? 'column' : 'row'}>
          <IconButton
            onClick={refreshDashboardData}
            size={isMobile ? "small" : "medium"}
            sx={{ color: '#6c757d' }}
          >
            <Refresh />
          </IconButton>
          <Box textAlign={isMobile ? 'center' : 'right'}>
            <Typography variant="caption" sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              opacity: 0.7,
              color: '#6c757d'
            }}>
              <Update sx={{ fontSize: 14 }} />
              Last updated
            </Typography>
            <Typography variant="caption" sx={{ 
              fontWeight: 'bold',
              display: 'block',
              color: '#495057'
            }}>
              {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );

  const StatusSelector = () => (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2, 
        mb: 3,
        borderRadius: 2,
        border: '1px solid #e9ecef'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', color: '#343a40' }}>
          <Settings sx={{ mr: 1, opacity: 0.7 }} />
          Availability & Preferences
        </Typography>
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            onClick={() => setPreferencesDialogOpen(true)}
            size={isMobile ? "small" : "medium"}
            sx={{
              borderColor: '#8e24aa',
              color: '#8e24aa',
              '&:hover': {
                backgroundColor: '#8e24aa',
                color: 'white'
              }
            }}
          >
            Trip Types
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setStatusDialogOpen(true)}
            size={isMobile ? "small" : "medium"}
            disabled={statusChanging}
            sx={{
              borderColor: '#6c757d',
              color: '#6c757d',
              '&:hover': {
                backgroundColor: '#6c757d',
                color: 'white'
              }
            }}
          >
            Change Status
          </Button>
        </Box>
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={2}>
        <Typography variant="body2" sx={{ opacity: 0.8, color: '#6c757d' }}>
          Current Status:
        </Typography>
        {getStatusChip(currentStatus)}
        <Typography variant="body2" sx={{ opacity: 0.6, fontStyle: 'italic', color: '#6c757d' }}>
          - {statusOptions.find(s => s.value === currentStatus)?.description}
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Typography variant="body2" sx={{ opacity: 0.8, color: '#6c757d' }}>
          Preferred Trip Types:
        </Typography>
        {preferredTripTypes.map(type => (
          <span key={type}>
            {getTripTypeChip(type)}
          </span>
        ))}
      </Box>
    </Paper>
  );

  const AssignedTripsCard = () => (
    <Card sx={{ height: 'fit-content', border: '1px solid #e9ecef', mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', color: '#343a40' }}>
            <Badge 
              badgeContent={assignedTrips.length} 
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#6c757d',
                  color: 'white'
                }
              }}
            >
              <Assignment sx={{ mr: 1, opacity: 0.7 }} />
            </Badge>
            Assigned Trips
          </Typography>
          <IconButton onClick={refreshDashboardData} size="small" sx={{ color: '#6c757d' }}>
            <Refresh />
          </IconButton>
        </Box>
        
        <Box>
          {assignedTrips.map((trip) => (
            <TripCard
              key={trip.trip_id || trip.id}
              trip={trip}
              onViewDetails={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onStart={() => navigate('/track-location')}
              onComplete={(id) => handleTripAction(id, 'complete')}
              isMobile={isMobile}
              horizontal={true}
            />
          ))}

          <TripCard
            trip={{
              trip_id: 'da8d7f29-2554-4033-be86-bb342371745c',
              title: 'City Tour',   
              status: 'confirmed',
              category: 'Casual',
              origin: 'Bandarawela',
              destination: 'Badulla',
              preferred_date: '2025-09-08',
              preferred_time: '17:00',
              passenger_count: 3, 
              driver_first_name: 'Shana',
              driver_last_name: 'Perera',
              driver_phone: '0776806037',
              vehicle_model: 'Toyota Prius',
              license_plate: 'WP-1234',
              seating_capacity: 4
            }}
            onViewDetails={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onStart={() => navigate('/track-location')}
            onComplete={() => {}}
            isMobile={isMobile}
            horizontal={true}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const CurrentTripCard = () => (
    <Grid item xs={12}>
      <Card sx={{ height: 'fit-content', border: '1px solid #e9ecef' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', color: '#343a40' }}>
            <DirectionsCar sx={{ mr: 1, opacity: 0.7 }} />
            Current Trip
          </Typography>
          {currentTrip ? (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#495057' }}>
                  {currentTrip.title}
                </Typography>
                {getTripTypeChip(currentTrip.category)}
                <Chip 
                  label={currentTrip.status} 
                  size="small" 
                  variant="filled"
                  sx={{ 
                    textTransform: 'capitalize',
                    backgroundColor: '#007bff',
                    color: 'white'
                  }} 
                />
              </Box>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                <strong>From:</strong> {currentTrip.origin}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                <strong>To:</strong> {currentTrip.destination}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                <Person sx={{ fontSize: 16, mr: 0.5 }} />
                <strong>Passengers:</strong> {currentTrip.passenger_count}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: '#6c757d' }}>
                <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                <strong>Time:</strong> {new Date(currentTrip.preferred_date).toLocaleDateString()} at {currentTrip.preferred_time}
              </Typography>
              
              {currentTrip.status === 'in-progress' && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => handleTripAction(currentTrip.trip_id, 'complete')}
                  fullWidth
                  sx={{
                    backgroundColor: '#28a745',
                    '&:hover': {
                      backgroundColor: '#1e7e34'
                    }
                  }}
                >
                  Complete Trip
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <DirectionsCar sx={{ fontSize: 60, opacity: 0.3, mb: 2, color: '#adb5bd' }} />
              <Typography variant="body2" color="text.secondary">
                No active trip
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your active trip will appear here when you start an assigned trip
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" sx={{ minHeight: '100vh' }}>
        {!isMobile && <Navbar />}
        <Box flexGrow={1}>
          {!isMobile && <Header />}
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="60vh"
          >
            <CircularProgress size={60} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
        }}>
          <Container 
            maxWidth="xl" 
            sx={{ 
              p: isMobile ? 1 : 3,
              pb: isMobile ? 10 : 3
            }}
          >
            {/* Status Messages */}
            {error && (
              <Slide direction="down" in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }} 
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Slide>
            )}
            
            {success && (
              <Slide direction="down" in={!!success}>
                <Alert 
                  severity="success" 
                  sx={{ mb: 2 }} 
                  onClose={() => setSuccess('')}
                >
                  {success}
                </Alert>
              </Slide>
            )}

            {/* Status Header */}
            <StatusHeader />

            {/* Status Selector */}
            <StatusSelector />

            {/* Assigned Trips */}
            <AssignedTripsCard />

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Current Trip */}
              <CurrentTripCard />
            </Grid>

            {/* Status Change Dialog */}
            <Dialog 
              open={statusDialogOpen} 
              onClose={() => setStatusDialogOpen(false)}
              fullScreen={isMobile}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ color: '#343a40' }}>
                Change Availability Status
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select your current availability status. This affects how trip assignments are sent to you.
                </Typography>
                
                <RadioGroup
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={
                        <Radio 
                          sx={{
                            color: option.color,
                            '&.Mui-checked': {
                              color: option.color
                            }
                          }}
                        />
                      }
                      disabled={statusChanging || (option.value === 'on-trip' && !currentTrip)}
                      label={
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                          <Box sx={{ color: option.color }}>
                            {option.icon}
                          </Box>
                          <Box flexGrow={1}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#495057' }}>
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ 
                        mb: 1,
                        '& .MuiFormControlLabel-label': {
                          width: '100%'
                        }
                      }}
                    />
                  ))}
                </RadioGroup>

                {statusChanging && (
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Updating status...</Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button 
                  onClick={() => setStatusDialogOpen(false)}
                  disabled={statusChanging}
                  sx={{
                    color: '#6c757d',
                    '&:hover': {
                      backgroundColor: '#6c757d15'
                    }
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </Dialog>

            {/* Trip Type Preferences Dialog */}
            <Dialog 
              open={preferencesDialogOpen} 
              onClose={() => setPreferencesDialogOpen(false)}
              fullScreen={isMobile}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ color: '#343a40' }}>
                Trip Type Preferences
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select the types of trips you prefer to receive. You'll be prioritized for these trip types.
                </Typography>
                
                <FormControl fullWidth>
                  {tripTypeOptions.map((option) => {
                    const isSelected = preferredTripTypes.includes(option.value);
                    return (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleTripTypePreferenceChange([...preferredTripTypes, option.value]);
                              } else {
                                handleTripTypePreferenceChange(preferredTripTypes.filter(type => type !== option.value));
                              }
                            }}
                            sx={{
                              color: option.color,
                              '&.Mui-checked': {
                                color: option.color
                              }
                            }}
                          />
                        }
                        label={
                          <Box display="flex" alignItems="center" gap={1} width="100%">
                            <Box sx={{ color: option.color }}>
                              {option.icon}
                            </Box>
                            <Box flexGrow={1}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                {option.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ 
                          mb: 1,
                          '& .MuiFormControlLabel-label': {
                            width: '100%'
                          }
                        }}
                      />
                    );
                  })}
                </FormControl>

                {preferredTripTypes.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please select at least one trip type to receive assignments.
                  </Alert>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button 
                  onClick={() => setPreferencesDialogOpen(false)}
                  sx={{
                    color: '#6c757d',
                    '&:hover': {
                      backgroundColor: '#6c757d15'
                    }
                  }}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => setPreferencesDialogOpen(false)}
                  variant="contained"
                  disabled={preferredTripTypes.length === 0}
                  sx={{
                    backgroundColor: '#8e24aa',
                    '&:hover': {
                      backgroundColor: '#7b1fa2'
                    }
                  }}
                >
                  Save Preferences
                </Button>
              </DialogActions>
            </Dialog>

            {/* Mobile Quick Status FAB */}
            {isMobile && (
              <Fab
                sx={{
                  position: 'fixed',
                  bottom: 16,
                  right: 16,
                  zIndex: 999,
                  backgroundColor: '#6c757d',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#495057'
                  }
                }}
                onClick={() => setStatusDialogOpen(true)}
                disabled={statusChanging}
              >
                <Settings />
              </Fab>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverDashboard;