import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Fab,
  Tooltip,
  Container,
  Zoom,
  Divider
} from '@mui/material';
import {
  DirectionsCar,
  Star,
  History,
  Settings,
  Notifications,
  Add,
  Cancel,
  Favorite,
  Support,
  Receipt,
  Navigation,
  Home,
  Work,
  LocalAirport,
  LocationOn,
  MonetizationOn,
  ThumbUp,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Person,
  Edit,
  Visibility,
  AccessTime,
  CalendarToday
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar'; 
import TripServices from '../../services/TripServices';
import logo from '../../assets/Logo.png';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tripStats, setTripStats] = useState({
    thisMonth: 0,
    totalSaved: 0,
    averageRating: 5.0,
    totalTrips: 0
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(true);

  useEffect(() => {
    checkAuthAndFetchData();
    
    const handleScroll = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      setShowScrollToTop(scrollTop > 300);
      setShowScrollToBottom(scrollTop < scrollHeight - clientHeight - 100);
    };

    const scrollContainer = document.getElementById('dashboard-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll({ target: scrollContainer });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const customerData = localStorage.getItem('customerData');
      
      if (!token || !customerData) {
        navigate('/customer-login');
        return;
      }

      const parsedCustomerData = JSON.parse(customerData);
      setUser(parsedCustomerData);
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const tripRequestsResponse = await TripServices.getCustomerTrips();
      
      let requests = [];
      
      if (tripRequestsResponse && tripRequestsResponse.success) {
        if (Array.isArray(tripRequestsResponse.data)) {
          requests = tripRequestsResponse.data;
        } else if (Array.isArray(tripRequestsResponse.data?.trips)) {
          requests = tripRequestsResponse.data.trips;
        } else if (Array.isArray(tripRequestsResponse.trips)) {
          requests = tripRequestsResponse.trips;
        }
      }
      
      console.log('Full API Response:', tripRequestsResponse);
      console.log('Processed requests:', requests);
      
      if (requests.length > 0) {
        console.log('First trip raw data:', JSON.stringify(requests[0], null, 2));
        console.log('All keys in first trip:', Object.keys(requests[0]));
        console.log('Date fields check:');
        console.log('  preferredDate:', requests[0].preferredDate, typeof requests[0].preferredDate);
        console.log('  preferred_date:', requests[0].preferred_date, typeof requests[0].preferred_date);
        console.log('Time fields check:');
        console.log('  preferredTime:', requests[0].preferredTime, typeof requests[0].preferredTime);
        console.log('  preferred_time:', requests[0].preferred_time, typeof requests[0].preferred_time);
      }
      
      setTripRequests(requests);
      
      const thisMonth = requests.filter(trip => {
        try {
          const dateField = trip.preferredDate || trip.preferred_date;
          const tripDate = new Date(dateField);
          const now = new Date();
          return tripDate.getMonth() === now.getMonth() && 
                 tripDate.getFullYear() === now.getFullYear();
        } catch {
          return false;
        }
      }).length;

      const completedTrips = requests.filter(trip => trip.status === 'completed');
      const averageRating = completedTrips.length > 0 
        ? completedTrips.reduce((sum, trip) => sum + (parseFloat(trip.rating) || 5), 0) / completedTrips.length
        : 5.0;

      setTripStats({
        thisMonth,
        totalSaved: 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalTrips: requests.length
      });

      setFavoriteLocations([
        {
          id: 1,
          name: 'Home',
          address: '123 Residential St, Suburb',
          type: 'home',
          useCount: 0
        },
        {
          id: 2,
          name: 'Work',
          address: '456 Business Ave, Downtown',
          type: 'work',
          useCount: 0
        }
      ]);
      setNotifications([]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load trip requests. Please try again.');
      setTripRequests([]);
      setTripStats({
        thisMonth: 0,
        totalSaved: 0,
        averageRating: 5.0,
        totalTrips: 0
      });
    }
  };

  const scrollToTop = () => {
    const scrollContainer = document.getElementById('dashboard-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    const scrollContainer = document.getElementById('dashboard-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#FDCB42';
      case 'in-progress': return '#FFD700';
      case 'completed': return '#32CD32';
      case 'cancelled': return '#FF6B6B';
      case 'rejected': return '#DC3545';
      default: return '#808080';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'confirmed': return 'Confirmed';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Luxury': return <DirectionsCar sx={{ color: '#FFD700' }} />;
      case 'Safari': return <DirectionsCar sx={{ color: '#8B4513' }} />;
      case 'Tour': return <DirectionsCar sx={{ color: '#FDCB42' }} />;
      case 'Adventure': return <DirectionsCar sx={{ color: '#32CD32' }} />;
      case 'Casual': return <DirectionsCar sx={{ color: '#87CEEB' }} />;
      default: return <DirectionsCar sx={{ color: '#666' }} />;
    }
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'home': return <Home sx={{ color: '#FDCB42' }} />;
      case 'work': return <Work sx={{ color: '#FFD700' }} />;
      case 'travel': return <LocalAirport sx={{ color: '#FFA500' }} />;
      default: return <LocationOn sx={{ color: '#696969' }} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('customerData');
    navigate('/customer-login');
  };

  const handleCancelTripRequest = async (tripId) => {
    try {
      const response = await TripServices.cancelTrip(tripId);
      if (response && response.success) {
        await fetchDashboardData();
        setCancelDialogOpen(false);
        setSelectedTrip(null);
      } else {
        setError('Failed to cancel trip request');
      }
    } catch (error) {
      console.error('Error cancelling trip:', error);
      setError('Failed to cancel trip request');
    }
  };

  const confirmCancelTrip = () => {
    if (selectedTrip) {
      handleCancelTripRequest(selectedTrip.id || selectedTrip.trip_id);
    }
  };

  const submitFeedback = () => {
    console.log('Submitting feedback:', feedback, 'for trip:', selectedTrip.id || selectedTrip.trip_id);
    setFeedbackDialogOpen(false);
    setFeedback({ rating: 5, comment: '' });
    setSelectedTrip(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    console.log('formatDate input:', dateString, typeof dateString);
    
    try {
      let date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateString.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (dateString.includes('T')) {
          date = new Date(dateString);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString || 'Invalid Date';
      }
      
      const result = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      console.log('formatDate result:', result);
      return result;
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return dateString || 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    
    console.log('formatTime input:', timeString, typeof timeString);
    
    try {
      if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        const timeParts = timeString.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        
        const result = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        console.log('formatTime result:', result);
        return result;
      }
      
      if (typeof timeString === 'string' && timeString.includes('T')) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        }
      }
      
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error, 'Input:', timeString);
      return timeString || 'Invalid Time';
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: '#f5f5f5'
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="RoamSphere Logo"
          sx={{
            width: 120,
            height: 'auto',
            mb: 3,
          }}
        />
        <CircularProgress size={60} sx={{ color: '#FDCB42', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#1a1a1a' }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  const safeTrips = Array.isArray(tripRequests) ? tripRequests : [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Navbar defaultOpen={false} />

      <Box 
        sx={{ 
          flexGrow: 1,
          width: '100%',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <Box
          id="dashboard-scroll-container"
          sx={{
            width: '100%',
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: '#f5f5f5',
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
            scrollbarWidth: 'thin',
            scrollbarColor: '#FDCB42 rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ pb: 6 }}>
            <Box
              sx={{
                bgcolor: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                p: 3,
                mb: 3
              }}
            >
              <Container maxWidth="lg">
                <Grid container spacing={3} alignItems="center">
                  <Grid item>
                    <Avatar
                      sx={{ 
                        width: 80, 
                        height: 80,
                        bgcolor: '#FDCB42',
                        color: 'black',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </Avatar>
                  </Grid>
                  
                  <Grid item xs>
                    <Typography variant="h4" gutterBottom sx={{ color: '#1a1a1a' }}>
                      Welcome back, {user?.first_name || user?.name?.split(' ')[0] || 'User'}!
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                      Ready for your next journey?
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ color: '#FDCB42', mr: 1 }} />
                        <Typography variant="body1" sx={{ color: '#1a1a1a' }}>
                          {tripStats.averageRating} rating
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                        <Typography variant="body1" sx={{ color: '#1a1a1a' }}>
                          {tripStats.totalTrips} trips
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Email: {user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Tooltip title="Notifications">
                        <Badge badgeContent={notifications?.filter(n => !n.read).length} color="error">
                          <IconButton 
                            sx={{ 
                              bgcolor: '#f5f5f5', 
                              color: '#1a1a1a',
                              '&:hover': { bgcolor: '#e0e0e0' }
                            }}
                          >
                            <Notifications />
                          </IconButton>
                        </Badge>
                      </Tooltip>
                      
                      <Tooltip title="Settings">
                        <IconButton 
                          onClick={() => navigate('/customer-profile')}
                          sx={{ 
                            bgcolor: '#f5f5f5', 
                            color: '#1a1a1a',
                            '&:hover': { bgcolor: '#e0e0e0' }
                          }}
                        >
                          <Settings />
                        </IconButton>
                      </Tooltip>

                      <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{
                          borderColor: '#FDCB42',
                          color: '#1a1a1a',
                          '&:hover': { bgcolor: '#FDCB42', color: 'black' }
                        }}
                      >
                        Logout
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Container>
            </Box>

            <Container maxWidth="lg">
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <DirectionsCar sx={{ fontSize: 40, mb: 1, color: '#FDCB42' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1a1a1a' }}>
                        {tripStats.thisMonth}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#666' }}>
                        Trips This Month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <MonetizationOn sx={{ fontSize: 40, mb: 1, color: '#FDCB42' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1a1a1a' }}>
                        ${tripStats.totalSaved}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#666' }}>
                        Total Saved
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <ThumbUp sx={{ fontSize: 40, mb: 1, color: '#FDCB42' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1a1a1a' }}>
                        {tripStats.averageRating}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#666' }}>
                        Avg Rating
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <DirectionsCar sx={{ fontSize: 40, mb: 1, color: '#FDCB42' }} />
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: '#1a1a1a' }}>
                        {tripStats.totalTrips}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#666' }}>
                        Total Trips
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={4}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <DirectionsCar sx={{ mr: 2, color: '#1a1a1a', fontSize: 28 }} />
                        <Typography variant="h5" sx={{ fontWeight: '600', color: '#1a1a1a' }}>
                          Your Trip Requests
                        </Typography>
                        {safeTrips.length > 0 && (
                          <Chip 
                            label={safeTrips.length} 
                            size="small" 
                            sx={{ 
                              ml: 2, 
                              bgcolor: '#FDCB42', 
                              color: 'black',
                              fontWeight: 'bold'
                            }} 
                          />
                        )}
                      </Box>
                      
                      {safeTrips.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                          <Box
                            sx={{
                              width: 120,
                              height: 120,
                              margin: '0 auto 24px',
                              bgcolor: '#f5f5f5',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '3px solid #FDCB42'
                            }}
                          >
                            <DirectionsCar sx={{ fontSize: 60, color: '#FDCB42' }} />
                          </Box>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No trip requests yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Ready to explore? Book your next adventure!
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/request-trip')}
                            sx={{ 
                              bgcolor: '#FDCB42', 
                              color: 'black',
                              '&:hover': { bgcolor: '#FFD700' },
                              px: 4,
                              py: 1.5,
                              fontWeight: 'bold'
                            }}
                          >
                            Book Your First Trip
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {safeTrips.map((trip) => (
                            <Card
                              key={trip.id || trip.trip_id}
                              sx={{
                                mb: 3,
                                border: `2px solid ${getStatusColor(trip.status)}`,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {getCategoryIcon(trip.category)}
                                    <Box>
                                      <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 'bold' }}>
                                        {trip.title || 'Trip Request'}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#666' }}>
                                        {trip.category || 'General'} Trip
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Chip
                                    label={getStatusText(trip.status)}
                                    sx={{
                                      bgcolor: getStatusColor(trip.status),
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                </Box>

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <LocationOn sx={{ color: '#FDCB42', mr: 1, fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        <strong>From:</strong> {trip.origin || 'Not specified'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <Navigation sx={{ color: '#FDCB42', mr: 1, fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        <strong>To:</strong> {trip.destination || 'Not specified'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <CalendarToday sx={{ color: '#FDCB42', mr: 1, fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        <strong>Date:</strong> {formatDate(trip.preferredDate || trip.preferred_date)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <AccessTime sx={{ color: '#FDCB42', mr: 1, fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        <strong>Time:</strong> {formatTime(trip.preferredTime || trip.preferred_time)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                  <Person sx={{ color: '#FDCB42', mr: 1, fontSize: 18 }} />
                                  <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                    <strong>Passengers:</strong> {trip.passengerCount || trip.passenger_count || 1}
                                  </Typography>
                                  {(trip.vehicleType || trip.vehicle_type) && (
                                    <>
                                      <DirectionsCar sx={{ color: '#FDCB42', mr: 1, ml: 3, fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                        <strong>Vehicle:</strong> {trip.vehicleType || trip.vehicle_type}
                                      </Typography>
                                    </>
                                  )}
                                </Box>

                                {trip.stops && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                                      <strong>Additional Stops:</strong> {trip.stops}
                                    </Typography>
                                  </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    Request ID: {trip.id || trip.trip_id}
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="View Details">
                                      <IconButton
                                        size="small"
                                        onClick={() => navigate(`/trip-requests/${trip.id || trip.trip_id}`)}
                                        sx={{ 
                                          color: '#FDCB42',
                                          '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' }
                                        }}
                                      >
                                        <Visibility />
                                      </IconButton>
                                    </Tooltip>
                                    
                                    {trip.status === 'pending' && (
                                      <>
                                        <Tooltip title="Edit Request">
                                          <IconButton
                                            size="small"
                                            onClick={() => navigate(`/edit-trip-request/${trip.id || trip.trip_id}`)}
                                            sx={{ 
                                              color: '#FFA500',
                                              '&:hover': { bgcolor: 'rgba(255, 165, 0, 0.1)' }
                                            }}
                                          >
                                            <Edit />
                                          </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="Cancel Request">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              setSelectedTrip(trip);
                                              setCancelDialogOpen(true);
                                            }}
                                            sx={{ 
                                              color: '#FF6B6B',
                                              '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)' }
                                            }}
                                          >
                                            <Cancel />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a' }}>
                            Quick Actions
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => navigate('/request-trip')}
                                sx={{
                                  bgcolor: '#FDCB42',
                                  color: 'black',
                                  '&:hover': { bgcolor: '#FFD700' }
                                }}
                              >
                                Book Trip
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<History />}
                                onClick={() => navigate('/trip-history')}
                                sx={{
                                  borderColor: '#FDCB42',
                                  color: '#1a1a1a',
                                  '&:hover': { bgcolor: '#FDCB42', color: 'black' }
                                }}
                              >
                                History
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Receipt />}
                                onClick={() => navigate('/receipts')}
                                sx={{
                                  borderColor: '#FDCB42',
                                  color: '#1a1a1a',
                                  '&:hover': { bgcolor: '#FDCB42', color: 'black' }
                                }}
                              >
                                Receipts
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Support />}
                                onClick={() => navigate('/support')}
                                sx={{
                                  borderColor: '#FDCB42',
                                  color: '#1a1a1a',
                                  '&:hover': { bgcolor: '#FDCB42', color: 'black' }
                                }}
                              >
                                Support
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Card sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Favorite sx={{ mr: 2, color: '#FDCB42' }} />
                            <Typography variant="h6" sx={{ color: '#1a1a1a' }}>
                              Favorite Places
                            </Typography>
                          </Box>
                          
                          <List dense>
                            {favoriteLocations?.map((location) => (
                              <ListItem
                                key={location.id}
                                button
                                onClick={() => navigate(`/request-trip?to=${location.id}`)}
                                sx={{
                                  borderRadius: 1,
                                  mb: 1,
                                  border: '1px solid #e0e0e0',
                                  '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                              >
                                <ListItemIcon>
                                  {getLocationIcon(location.type)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={location.name}
                                  secondary={`Used ${location.useCount} times`}
                                  primaryTypographyProps={{ color: '#1a1a1a' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                          
                          <Button
                            fullWidth
                            size="small"
                            startIcon={<Add />}
                            onClick={() => navigate('/manage-locations')}
                            sx={{ 
                              mt: 2,
                              color: '#1a1a1a',
                              '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                          >
                            Add New Location
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </Box>

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
          <Zoom in={showScrollToTop}>
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
              <Tooltip title="Scroll to Top" placement="left">
                <KeyboardArrowUp />
              </Tooltip>
            </Fab>
          </Zoom>

          <Fab
            color="primary"
            onClick={() => navigate('/request-trip')}
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
            <Tooltip title="Book a Trip" placement="left">
              <Add sx={{ fontSize: 32 }} />
            </Tooltip>
          </Fab>

          <Zoom in={showScrollToBottom}>
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
                width: 56,
                height: 56,
                border: '2px solid #FDCB42',
                transition: 'all 0.3s ease'
              }}
            >
              <Tooltip title="Scroll to Bottom" placement="left">
                <KeyboardArrowDown sx={{ fontSize: 28 }} />
              </Tooltip>
            </Fab>
          </Zoom>
        </Box>
      </Box>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle sx={{ color: '#1a1a1a' }}>Cancel Trip Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#1a1a1a', mb: 2 }}>
            Are you sure you want to cancel your trip request?
          </Typography>
          {selectedTrip && (
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Trip:</strong> {selectedTrip.title || 'Trip Request'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>From:</strong> {selectedTrip.origin || 'Not specified'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>To:</strong> {selectedTrip.destination || 'Not specified'}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDate(selectedTrip.preferredDate || selectedTrip.preferred_date)}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. Your trip request will be permanently cancelled.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ color: '#1a1a1a' }}>
            Keep Request
          </Button>
          <Button 
            onClick={confirmCancelTrip} 
            sx={{ bgcolor: '#FF6B6B', color: 'white', '&:hover': { bgcolor: '#FF5252' } }}
          >
            Cancel Request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#1a1a1a' }}>Rate Your Trip</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a' }}>
              How was your experience?
            </Typography>
            <Rating
              value={feedback.rating}
              onChange={(e, newValue) => setFeedback(prev => ({ ...prev, rating: newValue }))}
              size="large"
              sx={{ color: '#FDCB42' }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            value={feedback.comment}
            onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Tell us about your experience..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#FDCB42',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#FDCB42',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)} sx={{ color: '#1a1a1a' }}>
            Skip
          </Button>
          <Button 
            onClick={submitFeedback} 
            variant="contained"
            sx={{ bgcolor: '#FDCB42', color: 'black', '&:hover': { bgcolor: '#FFD700' } }}
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;