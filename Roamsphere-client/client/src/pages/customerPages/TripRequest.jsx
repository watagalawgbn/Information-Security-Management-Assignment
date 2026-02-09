import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
  Container,
  IconButton,
  Tooltip,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  Person,
  Send as SendIcon,
  CheckCircle,
  ArrowBack,
  Home,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FlightTakeoff,
  DirectionsCar,
  Terrain,
  Tour,
  Restaurant,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Map as MapIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import TripServices from '../../services/TripServices';
import LocationPickerMap from '../../components/location/LocationPickerMap';

const TripRequest = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [requestId, setRequestId] = useState('');

  // Map states
  const [mapOpen, setMapOpen] = useState(false);
  const [mapType, setMapType] = useState(''); // 'origin' or 'destination'
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  
  // Scroll state
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);
  
  const [requestData, setRequestData] = useState({
    // Trip Details
    title: '',
    category: 'Tour',
    origin: '',
    destination: '',
    stops: '',
    
    // Schedule
    preferredDate: '',
    preferredTime: '',
    returnDate: '',
    returnTime: '',
    
    // Passenger Info
    passengerCount: 1,
    passengerNames: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    
    // Preferences
    vehicleType: '',
    specialRequirements: ''
  });

  const [errors, setErrors] = useState({});

  const steps = ['Trip Details', 'Schedule', 'Passenger Info', 'Preferences', 'Review & Submit'];
  const shortSteps = ['Trip', 'Schedule', 'Passengers', 'Preferences', 'Review'];

  // Updated trip categories to match database ENUM
  const tripCategories = [
    { 
      value: 'Luxury', 
      label: 'Luxury Experience', 
      description: 'Premium vehicles and exclusive services',
      icon: <DirectionsCar />
    },
    { 
      value: 'Safari', 
      label: 'Safari Adventure', 
      description: 'Wildlife viewing and nature experiences',
      icon: <Terrain />
    },
    { 
      value: 'Tour', 
      label: 'Tour & Sightseeing', 
      description: 'City tours, cultural sites, and attractions',
      icon: <Tour />
    },
    { 
      value: 'Adventure', 
      label: 'Adventure Trip', 
      description: 'Hiking, trekking, and outdoor activities',
      icon: <FlightTakeoff />
    },
    { 
      value: 'Casual', 
      label: 'Casual Transport', 
      description: 'Simple transfers and daily transportation',
      icon: <Restaurant />
    }
  ];

  const vehicleTypes = [
    { value: 'economy', label: 'Economy Car (1-4 passengers)' },
    { value: 'luxury', label: 'Luxury Car (1-4 passengers)' },
    { value: 'van', label: 'Van (5-15 passengers)' },
    { value: 'minibus', label: 'Mini Bus (16-25 passengers)' },
    { value: 'bus', label: 'Bus (26+ passengers)' },
    { value: 'any', label: 'No Preference' }
  ];

  // Check authentication and load user data
  useEffect(() => {
    checkAuthAndLoadUser();
    
    // Add scroll event listener
    const handleScroll = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      
      // Show scroll to top if scrolled more than 300px
      setShowScrollToTop(scrollTop > 300);
      
      // Show scroll to bottom if not at bottom (with 100px threshold)
      setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - 100);
    };

    const scrollContainer = document.getElementById('trip-request-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      
      // Initial check
      handleScroll({ target: scrollContainer });
      
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [navigate]);

  const checkAuthAndLoadUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const customerData = localStorage.getItem('customerData');
      
      if (!token || !customerData) {
        navigate('/customer-login');
        return;
      }

      const parsedCustomerData = JSON.parse(customerData);
      setUser(parsedCustomerData);
      
      // Pre-populate contact information if available
      setRequestData(prev => ({
        ...prev,
        contactName: parsedCustomerData.first_name && parsedCustomerData.last_name 
          ? `${parsedCustomerData.first_name} ${parsedCustomerData.last_name}`
          : parsedCustomerData.name || '',
        contactEmail: parsedCustomerData.email || '',
        contactPhone: parsedCustomerData.phone || ''
      }));
      
    } catch (error) {
      console.error('Error checking auth:', error);
      navigate('/customer-login');
    } finally {
      setLoading(false);
    }
  };

  // Scroll functions
  const scrollToTop = () => {
    const scrollContainer = document.getElementById('trip-request-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    const scrollContainer = document.getElementById('trip-request-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setRequestData(prev => ({
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

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Trip Details
        if (!requestData.title.trim()) newErrors.title = 'Trip title is required';
        if (!requestData.category) newErrors.category = 'Trip category is required';
        if (!requestData.origin.trim()) newErrors.origin = 'Origin is required';
        if (!requestData.destination.trim()) newErrors.destination = 'Destination is required';
        break;
      
      case 1: // Schedule
        if (!requestData.preferredDate) newErrors.preferredDate = 'Preferred date is required';
        if (!requestData.preferredTime) newErrors.preferredTime = 'Preferred time is required';
        
        // Validate that the date is not in the past
        const selectedDate = new Date(requestData.preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.preferredDate = 'Date cannot be in the past';
        }
        break;
      
      case 2: // Passenger Info
        if (requestData.passengerCount < 1) newErrors.passengerCount = 'At least 1 passenger required';
        if (!requestData.contactName.trim()) newErrors.contactName = 'Contact name is required';
        if (!requestData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required';
        else if (!/^[\+]?[\d\s\-\(\)]{10,15}$/.test(requestData.contactPhone.trim())) {
          newErrors.contactPhone = 'Please enter a valid phone number';
        }
        if (!requestData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
        else if (!/\S+@\S+\.\S+/.test(requestData.contactEmail)) {
          newErrors.contactEmail = 'Please enter a valid email address';
        }
        break;
      
      case 3: // Preferences
        // All fields optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      // Scroll to top when moving to next step
      setTimeout(() => scrollToTop(), 100);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    // Scroll to top when moving to previous step
    setTimeout(() => scrollToTop(), 100);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      setSubmissionLoading(true);
      setErrors({});

      // Prepare the data for submission
      const submitData = {
        title: requestData.title.trim(),
        category: requestData.category,
        origin: requestData.origin.trim(),
        destination: requestData.destination.trim(),
        stops: requestData.stops.trim() || null,
        preferredDate: requestData.preferredDate,
        preferredTime: requestData.preferredTime,
        returnDate: requestData.returnDate || null,
        returnTime: requestData.returnTime || null,
        passengerCount: parseInt(requestData.passengerCount),
        passengerNames: requestData.passengerNames.trim() || null,
        contactName: requestData.contactName.trim(),
        contactPhone: requestData.contactPhone.trim(),
        contactEmail: requestData.contactEmail.trim(),
        vehicleType: requestData.vehicleType || null,
        specialRequirements: requestData.specialRequirements.trim() || null
      };

      console.log('Submitting trip request:', submitData);

      // Call the API to create trip request
      const response = await TripServices.createTripRequest(submitData);

      if (response.success) {
        setRequestId(response.data.tripId);
        setSubmitted(true);
        
        // Clear form data
        setRequestData({
          title: '', category: 'Tour', origin: '', destination: '', stops: '',
          preferredDate: '', preferredTime: '', returnDate: '', returnTime: '',
          passengerCount: 1, passengerNames: '', 
          contactName: user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user?.name || '',
          contactPhone: user?.phone || '',
          contactEmail: user?.email || '',
          vehicleType: '', specialRequirements: ''
        });
        setActiveStep(0);
      } else {
        setErrors({ submit: response.message || 'Failed to submit trip request' });
      }
      
    } catch (error) {
      console.error('Error submitting trip request:', error);
      
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        setTimeout(() => navigate('/customer-login'), 2000);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setSubmissionLoading(false);
    }
  };

  // Map handling functions
  const openMapPicker = (type) => {
    setMapType(type);
    setMapOpen(true);
  };

  const handleLocationSelect = (location) => {
    if (mapType === 'origin') {
      setOriginLocation(location);
      handleInputChange('origin', location.address);
    } else if (mapType === 'destination') {
      setDestinationLocation(location);
      handleInputChange('destination', location.address);
    }
    setMapOpen(false);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trip Title"
                value={requestData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="e.g., Airport Transfer, City Tour, Wedding Transport"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"} error={!!errors.category}>
                <InputLabel>Trip Category</InputLabel>
                <Select
                  value={requestData.category}
                  label="Trip Category"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {tripCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {category.icon}
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {category.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Pickup Location"
                  value={requestData.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
                  error={!!errors.origin}
                  helperText={errors.origin}
                  placeholder="Enter pickup address or use map"
                  size={isMobile ? "small" : "medium"}
                  multiline={originLocation ? true : false}
                  rows={originLocation ? 2 : 1}
                />
                <Tooltip title="Select on Map">
                  <IconButton
                    onClick={() => openMapPicker('origin')}
                    sx={{
                      bgcolor: 'rgba(253, 203, 66, 0.1)',
                      color: '#FDCB42',
                      '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.2)' },
                      mt: isMobile ? 0.5 : 1
                    }}
                  >
                    <MapIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {originLocation && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                  ✓ Location selected on map
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Drop-off Location"
                  value={requestData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  error={!!errors.destination}
                  helperText={errors.destination}
                  placeholder="Enter destination address or use map"
                  size={isMobile ? "small" : "medium"}
                  multiline={destinationLocation ? true : false}
                  rows={destinationLocation ? 2 : 1}
                />
                <Tooltip title="Select on Map">
                  <IconButton
                    onClick={() => openMapPicker('destination')}
                    sx={{
                      bgcolor: 'rgba(253, 203, 66, 0.1)',
                      color: '#FDCB42',
                      '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.2)' },
                      mt: isMobile ? 0.5 : 1
                    }}
                  >
                    <MapIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {destinationLocation && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                  ✓ Location selected on map
                </Typography>
              )}
            </Grid>

            {/* Route Preview */}
            {originLocation && destinationLocation && (
              <Grid item xs={12}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    bgcolor: 'rgba(253, 203, 66, 0.05)',
                    border: '1px solid rgba(253, 203, 66, 0.3)'
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#FDCB42' }}>
                      Route Preview
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOn sx={{ color: 'success.main', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>From:</Typography>
                      <Typography variant="body2">{originLocation.address}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ color: 'error.main', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>To:</Typography>
                      <Typography variant="body2">{destinationLocation.address}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                label="Additional Stops (Optional)"
                value={requestData.stops}
                onChange={(e) => handleInputChange('stops', e.target.value)}
                placeholder="List any additional stops or waypoints (one per line)"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Preferred Date"
                value={requestData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                error={!!errors.preferredDate}
                helperText={errors.preferredDate}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Preferred Time"
                value={requestData.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                error={!!errors.preferredTime}
                helperText={errors.preferredTime}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
                Return Schedule (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Return Date (Optional)"
                value={requestData.returnDate}
                onChange={(e) => handleInputChange('returnDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
                inputProps={{ min: requestData.preferredDate || new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Return Time (Optional)"
                value={requestData.returnTime}
                onChange={(e) => handleInputChange('returnTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Passengers"
                value={requestData.passengerCount}
                onChange={(e) => handleInputChange('passengerCount', parseInt(e.target.value) || 1)}
                error={!!errors.passengerCount}
                helperText={errors.passengerCount}
                inputProps={{ min: 1, max: 100 }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 2 : 2}
                label="Passenger Names (Optional)"
                value={requestData.passengerNames}
                onChange={(e) => handleInputChange('passengerNames', e.target.value)}
                placeholder="List passenger names (one per line)"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant={isMobile ? "h6" : "h6"} gutterBottom>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Contact Name"
                value={requestData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                error={!!errors.contactName}
                helperText={errors.contactName}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Phone Number"
                value={requestData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                error={!!errors.contactPhone}
                helperText={errors.contactPhone}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={requestData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Preferred Vehicle Type</InputLabel>
                <Select
                  value={requestData.vehicleType}
                  label="Preferred Vehicle Type"
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                >
                  {vehicleTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 3 : 4}
                label="Special Requirements"
                value={requestData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Child seats, wheelchair access, luggage space, etc."
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        );

      case 4:
        const selectedCategory = tripCategories.find(cat => cat.value === requestData.category);
        
        return (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <Typography variant={isMobile ? "h6" : "h6"} gutterBottom>
                Request Summary
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Card 
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  border: '2px solid #FDCB42',
                  background: 'rgba(253, 203, 66, 0.05)'
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    Trip Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Title: {requestData.title}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Category: {selectedCategory ? selectedCategory.label : requestData.category}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>From: {requestData.origin}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>To: {requestData.destination}</Typography>
                  {requestData.stops && (
                    <Typography variant="body2" sx={{ mb: 1 }}>Additional Stops: {requestData.stops}</Typography>
                  )}
                  
                  <Divider sx={{ my: 2, bgcolor: 'rgba(253, 203, 66, 0.3)' }} />
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    Schedule
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Date: {requestData.preferredDate}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>Time: {requestData.preferredTime}</Typography>
                  {requestData.returnDate && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Return: {requestData.returnDate} {requestData.returnTime && `at ${requestData.returnTime}`}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2, bgcolor: 'rgba(253, 203, 66, 0.3)' }} />
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    Contact
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Passengers: {requestData.passengerCount}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Contact: {requestData.contactName}</Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>Phone: {requestData.contactPhone}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>Email: {requestData.contactEmail}</Typography>
                  
                  {(requestData.vehicleType || requestData.specialRequirements) && (
                    <>
                      <Divider sx={{ my: 2, bgcolor: 'rgba(253, 203, 66, 0.3)' }} />
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                        Preferences
                      </Typography>
                      {requestData.vehicleType && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Vehicle: {vehicleTypes.find(v => v.value === requestData.vehicleType)?.label}
                        </Typography>
                      )}
                      {requestData.specialRequirements && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Special Requirements: {requestData.specialRequirements}
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  // Loading screen while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Navbar defaultOpen={false} />
        <Box 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#f5f5f5'
          }}
        >
          <CircularProgress size={60} sx={{ color: '#FDCB42' }} />
        </Box>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Navbar defaultOpen={false} />
        <Box 
          id="trip-request-scroll-container"
          sx={{ 
            flexGrow: 1,
            width: '100%',
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: '#f5f5f5',
            // Custom scrollbar styles
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#FDCB42',
              borderRadius: '10px',
              '&:hover': {
                background: '#FFD700',
              },
            },
            // Firefox scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: '#FDCB42 rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ 
            p: isMobile ? 2 : 3, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh' 
          }}>
            <Card 
              sx={{ 
                maxWidth: 500, 
                textAlign: 'center', 
                p: isMobile ? 2 : 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '2px solid #FDCB42'
              }}
            >
              <CheckCircle sx={{ 
                fontSize: isMobile ? 60 : 80, 
                color: '#FDCB42', 
                mb: 2 
              }} />
              <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ color: '#1a1a1a' }}>
                Request Submitted!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Your trip request has been successfully submitted. The System will review your request and get back to you soon.
              </Typography>
              {requestId && (
                <Typography variant="body2" color="text.secondary" sx={{ 
                  bgcolor: 'rgba(253, 203, 66, 0.1)', 
                  p: 1, 
                  borderRadius: 2,
                  mb: 3,
                  fontFamily: 'monospace'
                }}>
                  Request ID: {requestId}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/customer-dashboard')}
                  startIcon={<Home />}
                  sx={{ 
                    borderColor: '#FDCB42',
                    color: '#1a1a1a',
                    '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' }
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#FDCB42', color: 'black', '&:hover': { bgcolor: '#FFD700' } }}
                  onClick={() => {
                    setSubmitted(false);
                    setActiveStep(0);
                    setRequestId('');
                  }}
                >
                  New Request
                </Button>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar defaultOpen={false} />
      <Box 
        sx={{ 
          flexGrow: 1,
          width: '100%',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {/* Main Scrollable Container */}
        <Box
          id="trip-request-scroll-container"
          sx={{
            width: '100%',
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: '#f5f5f5',
            // Custom scrollbar styles
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#FDCB42',
              borderRadius: '10px',
              '&:hover': {
                background: '#FFD700',
              },
            },
            // Firefox scrollbar
            scrollbarWidth: 'thin',
            scrollbarColor: '#FDCB42 rgba(0,0,0,0.1)',
          }}
        >
          <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 3, pb: 8 }}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#1a1a1a',
                  flexGrow: 1
                }}
              >
                <LocationOn sx={{ mr: 2, color: '#FDCB42', fontSize: isMobile ? 32 : 40 }} />
                Request a Trip
              </Typography>
              
              <Tooltip title="Back to Dashboard">
                <IconButton 
                  onClick={() => navigate('/customer-dashboard')}
                  sx={{ 
                    bgcolor: 'rgba(253, 203, 66, 0.1)',
                    '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.2)' }
                  }}
                >
                  <ArrowBack sx={{ color: '#1a1a1a' }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Paper 
              sx={{ 
                p: isMobile ? 2 : 3,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '1px solid rgba(253, 203, 66, 0.2)'
              }}
            >
              {/* Enhanced Mobile Stepper with Numbers */}
              {isMobile ? (
                <Box sx={{ mb: 3 }}>
                  {/* Step Numbers with Progress */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    mb: 2,
                    gap: 1,
                    overflowX: 'auto',
                    pb: 1
                  }}>
                    {steps.map((step, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: index <= activeStep ? '#FDCB42' : 'rgba(253, 203, 66, 0.3)',
                            color: index <= activeStep ? 'black' : '#666',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            border: `2px solid ${index <= activeStep ? '#FDCB42' : 'rgba(253, 203, 66, 0.3)'}`,
                            transition: 'all 0.3s ease',
                            boxShadow: index === activeStep ? '0 0 10px rgba(253, 203, 66, 0.5)' : 'none'
                          }}
                        >
                          {index + 1}
                        </Box>
                        {index < steps.length - 1 && (
                          <Box
                            sx={{
                              width: 20,
                              height: 2,
                              backgroundColor: index < activeStep ? '#FDCB42' : 'rgba(253, 203, 66, 0.3)',
                              mx: 0.5,
                              transition: 'all 0.3s ease'
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Current Step Title */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      textAlign: 'center', 
                      color: '#1a1a1a', 
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    Step {activeStep + 1} of {steps.length}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      textAlign: 'center', 
                      color: '#666',
                      fontSize: '16px'
                    }}
                  >
                    {steps[activeStep]}
                  </Typography>
                </Box>
              ) : (
                // Desktop Stepper
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {(isSmall ? shortSteps : steps).map((label, index) => (
                    <Step key={label}>
                      <StepLabel
                        sx={{
                          '& .MuiStepLabel-root': {
                            color: '#1a1a1a'
                          },
                          '& .MuiStepIcon-root': {
                            color: 'rgba(253, 203, 66, 0.3)',
                            '&.Mui-active': {
                              color: '#FDCB42'
                            },
                            '&.Mui-completed': {
                              color: '#FDCB42'
                            }
                          }
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              )}

              {errors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.submit}
                </Alert>
              )}

              {renderStepContent(activeStep)}

              {/* Navigation Buttons */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 3,
                gap: 2,
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  variant="outlined"
                  startIcon={isMobile ? <KeyboardArrowLeft /> : <ArrowBack />}
                  sx={{ 
                    borderColor: '#FDCB42',
                    color: '#1a1a1a',
                    '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' },
                    '&:disabled': { 
                      borderColor: '#ccc',
                      color: '#999'
                    },
                    order: isMobile ? 2 : 1
                  }}
                >
                  Back
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submissionLoading}
                    startIcon={submissionLoading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ 
                      bgcolor: '#FDCB42', 
                      color: 'black',
                      '&:hover': { bgcolor: '#FFD700' },
                      '&:disabled': { bgcolor: '#ccc' },
                      order: isMobile ? 1 : 2,
                      fontWeight: 'bold'
                    }}
                  >
                    {submissionLoading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    endIcon={isMobile ? <KeyboardArrowRight /> : null}
                    sx={{ 
                      bgcolor: '#FDCB42', 
                      color: 'black',
                      '&:hover': { bgcolor: '#FFD700' },
                      order: isMobile ? 1 : 2,
                      fontWeight: 'bold'
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Floating Action Buttons */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1000
          }}
        >
          {/* Scroll to Top Button */}
          {showScrollToTop && (
            <Tooltip title="Scroll to Top" placement="left">
              <Fab
                size="medium"
                onClick={scrollToTop}
                sx={{
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': { 
                    bgcolor: '#FFD700',
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 25px rgba(253, 203, 66, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <KeyboardArrowUp />
              </Fab>
            </Tooltip>
          )}

          {/* Main Home Button */}
          <Tooltip title="Back to Dashboard" placement="left">
            <Fab
              onClick={() => navigate('/customer-dashboard')}
              sx={{
                bgcolor: '#FDCB42',
                color: 'black',
                '&:hover': { 
                  bgcolor: '#FFD700',
                  transform: 'scale(1.1)',
                  boxShadow: '0 8px 25px rgba(253, 203, 66, 0.3)'
                },
                width: 64,
                height: 64,
                transition: 'all 0.3s ease'
              }}
            >
              <Home sx={{ fontSize: 32 }} />
            </Fab>
          </Tooltip>

          {/* Scroll to Bottom Button */}
          {showScrollToBottom && (
            <Tooltip title="Scroll to Bottom" placement="left">
              <Fab
                size="medium"
                onClick={scrollToBottom}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#FDCB42',
                  '&:hover': { 
                    bgcolor: '#2d2d2d',
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 25px rgba(253, 203, 66, 0.3)'
                  },
                  border: '2px solid #FDCB42',
                  transition: 'all 0.3s ease'
                }}
              >
                <KeyboardArrowDown />
              </Fab>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Location Picker Map Dialog */}
      <LocationPickerMap
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onLocationSelect={handleLocationSelect}
        title={mapType === 'origin' ? 'Select Pickup Location' : 'Select Destination'}
        initialLocation={mapType === 'origin' ? originLocation : destinationLocation}
      />
    </Box>
  );
};

export default TripRequest;