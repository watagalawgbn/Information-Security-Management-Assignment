import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Badge,
  Chip,
  useTheme,
  useMediaQuery,
  Fab,
  IconButton,
  Drawer,
  Stack
} from '@mui/material';
import {
  Search,
  Schedule,
  LocationOn,
  PendingActions,
  Assignment,
  CheckCircle,
  FilterList,
  Close as CloseIcon,
  KeyboardArrowUp
} from '@mui/icons-material';
import TripCard from './TripCard';
import TripScheduler from './TripScheduler';
import TripRequestCard from './TripRequestCard';
import TripDetailsModal from '../tripPages/AssignmentModel'; 
import Navbar from '../../components/common/Navbar'; 
import Header from '../../components/common/Header'; 
import TripServices from '../../services/TripServices';

function TripSchedule() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [trips, setTrips] = useState([]);
  const [tripRequests, setTripRequests] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Add state for trip details modal
  const [tripDetailsOpen, setTripDetailsOpen] = useState(false);
  const [selectedTripForDetails, setSelectedTripForDetails] = useState(null);

  const tabs = [
    { 
      label: isMobile ? 'Requests' : 'Pending Requests', 
      value: 'requests',
      icon: <PendingActions />,
      count: tripRequests.filter(r => r.status === 'pending').length
    },
    { 
      label: isMobile ? 'Assigned' : 'Assigned Trips', 
      value: 'assigned',
      icon: <Assignment />,
      count: trips.filter(t => t.status === 'scheduled' || t.status === 'assigned' || t.status === 'confirmed').length
    },
    { 
      label: isMobile ? 'Active' : 'Active Trips', 
      value: 'active',
      icon: <Schedule />,
      count: trips.filter(t => t.status === 'in-progress').length
    },
    { 
      label: 'Completed', 
      value: 'completed',
      icon: <CheckCircle />,
      count: trips.filter(t => t.status === 'completed').length
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [trips, tripRequests, tabValue, searchQuery, statusFilter]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Function to calculate distance using Haversine formula
  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Function to get coordinates from location string using geocoding
  const getCoordinatesFromLocation = async (locationString) => {
    try {
      // First check if the location already contains coordinates
      const coordMatch = locationString.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        return {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      }

      // Use geocoding service for Sri Lankan locations
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&countrycodes=lk&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      // Fallback to mock coordinates for common Sri Lankan locations
      return getMockCoordinates(locationString);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      return getMockCoordinates(locationString);
    }
  };

  // Mock coordinates for common Sri Lankan locations
  const getMockCoordinates = (locationString) => {
    const location = locationString.toLowerCase();
    
    const sriLankanLocations = {
      'colombo': { lat: 6.9271, lng: 79.8612 },
      'kandy': { lat: 7.2906, lng: 80.6337 },
      'galle': { lat: 6.0535, lng: 80.2210 },
      'negombo': { lat: 7.2084, lng: 79.8380 },
      'nuwara eliya': { lat: 6.9497, lng: 80.7891 },
      'sigiriya': { lat: 7.9568, lng: 80.7598 },
      'anuradhapura': { lat: 8.3114, lng: 80.4037 },
      'polonnaruwa': { lat: 7.9403, lng: 81.0188 },
      'trincomalee': { lat: 8.5874, lng: 81.2152 },
      'batticaloa': { lat: 7.7172, lng: 81.7000 },
      'jaffna': { lat: 9.6615, lng: 80.0255 },
      'matara': { lat: 5.9549, lng: 80.5550 },
      'ratnapura': { lat: 6.6828, lng: 80.4015 },
      'badulla': { lat: 6.9895, lng: 81.0555 },
      'ella': { lat: 6.8667, lng: 81.0500 },
      'mirissa': { lat: 5.9487, lng: 80.4607 },
      'unawatuna': { lat: 6.0108, lng: 80.2497 },
      'bentota': { lat: 6.4261, lng: 79.9951 },
      'hikkaduwa': { lat: 6.1407, lng: 80.1020 },
      'dambulla': { lat: 7.8731, lng: 80.6511 },
      'airport': { lat: 7.1808, lng: 79.8841 }, // Bandaranaike International Airport
      'katunayake': { lat: 7.1808, lng: 79.8841 }
    };

    // Find matching location
    for (const [key, coords] of Object.entries(sriLankanLocations)) {
      if (location.includes(key)) {
        return coords;
      }
    }

    // Default to Colombo if no match found
    return { lat: 6.9271, lng: 79.8612 };
  };

  // Function to calculate distance between origin and destination
  const calculateTripDistance = async (origin, destination) => {
    try {
      if (!origin || !destination) {
        return null;
      }

      const originCoords = await getCoordinatesFromLocation(origin);
      const destCoords = await getCoordinatesFromLocation(destination);

      if (originCoords && destCoords) {
        const distance = calculateHaversineDistance(
          originCoords.lat, 
          originCoords.lng, 
          destCoords.lat, 
          destCoords.lng
        );
        return distance;
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating trip distance:', error);
      return null;
    }
  };

  // Function to enhance trips with distance information
  const enhanceTripsWithDistance = async (tripsData) => {
    const enhancedTrips = await Promise.all(
      tripsData.map(async (trip) => {
        if (!trip.estimated_distance_km) {
          const distance = await calculateTripDistance(trip.origin, trip.destination);
          return {
            ...trip,
            estimated_distance_km: distance || 0
          };
        }
        return trip;
      })
    );
    
    return enhancedTrips;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch trip requests and trips from the same endpoint with different filters
      const [requestsResponse, tripsResponse] = await Promise.all([
        TripServices.getAllTripRequests({ status: 'pending' }),
        TripServices.getAllTrips()
      ]);

      console.log('Requests Response:', requestsResponse);
      console.log('Trips Response:', tripsResponse);

      // Handle trip requests data
      let requestsData = [];
      if (requestsResponse && requestsResponse.success) {
        const allData = requestsResponse.data?.trips || [];
        requestsData = allData.filter(trip => trip.status === 'pending');
        // Enhance requests with distance
        requestsData = await enhanceTripsWithDistance(requestsData);
      }

      // Handle trips data
      let tripsData = [];
      if (tripsResponse && tripsResponse.success) {
        const allData = tripsResponse.data?.trips || [];
        tripsData = allData.filter(trip => trip.status !== 'pending');
        // Enhance trips with distance
        tripsData = await enhanceTripsWithDistance(tripsData);
      }

      setTripRequests(requestsData);
      setTrips(tripsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch trip data. Please try again.');
      
      // Set empty arrays to prevent errors
      setTrips([]);
      setTripRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filteredTripsData = trips;
    let filteredRequestsData = tripRequests;

    // Filter based on tab
    switch (tabs[tabValue].value) {
      case 'requests':
        filteredRequestsData = tripRequests.filter(r => r.status === 'pending');
        break;
      case 'assigned':
        filteredTripsData = trips.filter(t => 
          t.status === 'scheduled' || t.status === 'assigned' || t.status === 'confirmed'
        );
        break;
      case 'active':
        filteredTripsData = trips.filter(t => t.status === 'in-progress');
        break;
      case 'completed':
        filteredTripsData = trips.filter(t => t.status === 'completed');
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTripsData = filteredTripsData.filter(trip =>
        trip.title?.toLowerCase().includes(query) ||
        trip.origin?.toLowerCase().includes(query) ||
        trip.destination?.toLowerCase().includes(query) ||
        trip.customer_first_name?.toLowerCase().includes(query) ||
        trip.customer_last_name?.toLowerCase().includes(query) ||
        trip.contact_name?.toLowerCase().includes(query)
      );
      
      filteredRequestsData = filteredRequestsData.filter(request =>
        request.title?.toLowerCase().includes(query) ||
        request.origin?.toLowerCase().includes(query) ||
        request.destination?.toLowerCase().includes(query) ||
        request.customer_first_name?.toLowerCase().includes(query) ||
        request.customer_last_name?.toLowerCase().includes(query) ||
        request.contact_name?.toLowerCase().includes(query)
      );
    }

    setFilteredTrips(filteredTripsData);
    setFilteredRequests(filteredRequestsData);
  };

  // Add function to handle trip card click
  const handleTripClick = async (trip) => {
    // Ensure distance is calculated for the selected trip
    if (!trip.estimated_distance_km) {
      const distance = await calculateTripDistance(trip.origin, trip.destination);
      trip.estimated_distance_km = distance || 0;
    }
    setSelectedTripForDetails(trip);
    setTripDetailsOpen(true);
  };

  const handleAssignTrip = async (request) => {
    // Ensure distance is calculated for the selected request
    if (!request.estimated_distance_km) {
      const distance = await calculateTripDistance(request.origin, request.destination);
      request.estimated_distance_km = distance || 0;
    }
    setSelectedRequest(request);
    setSchedulerOpen(true);
  };

  // Add function to handle assignment from trip details modal
  const handleAssignFromDetails = async (tripId, assignmentData) => {
    try {
      setLoading(true);
      
      const response = await TripServices.assignTripToDriver(tripId, assignmentData);
      
      if (response.success) {
        await fetchData();
        setTripDetailsOpen(false);
        setSelectedTripForDetails(null);
      } else {
        setError('Failed to assign trip');
      }
      
    } catch (err) {
      console.error('Error assigning trip:', err);
      setError('Failed to assign trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async (tripData) => {
    try {
      setLoading(true);
      
      if (selectedRequest) {
        // Assigning a trip request to a driver/vehicle
        const assignmentData = {
          driverId: tripData.driverId,
          vehicleId: tripData.vehicleId,
          estimatedCost: tripData.estimatedCost
        };

        const response = await TripServices.assignTripToDriver(selectedRequest.trip_id, assignmentData);
        
        if (response.success) {
          await fetchData();
          setSchedulerOpen(false);
          setSelectedRequest(null);
        } else {
          setError('Failed to assign trip');
        }
        
      } else if (editingTrip) {
        // Updating existing trip
        const response = await TripServices.updateTrip(editingTrip.trip_id, tripData);
        
        if (response.success) {
          await fetchData();
          setSchedulerOpen(false);
          setEditingTrip(null);
        } else {
          setError('Failed to update trip');
        }
      }
      
    } catch (err) {
      console.error('Error saving trip:', err);
      setError('Failed to save trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      try {
        setLoading(true);
        const response = await TripServices.rejectTripRequest(requestId, 'Rejected by admin');
        
        if (response.success) {
          await fetchData();
        } else {
          setError('Failed to reject request');
        }
      } catch (err) {
        console.error('Error rejecting request:', err);
        setError('Failed to reject request');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      const response = await TripServices.updateTripStatus(tripId, { status: 'in-progress' });
      if (response.success) {
        await fetchData();
      } else {
        setError('Failed to start trip');
      }
    } catch (err) {
      console.error('Error starting trip:', err);
      setError('Failed to start trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      const response = await TripServices.updateTripStatus(tripId, { status: 'completed' });
      if (response.success) {
        await fetchData();
      } else {
        setError('Failed to complete trip');
      }
    } catch (err) {
      console.error('Error completing trip:', err);
      setError('Failed to complete trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const response = await TripServices.cancelTrip(tripId);
        if (response.success) {
          await fetchData();
        } else {
          setError('Failed to delete trip');
        }
      } catch (err) {
        console.error('Error deleting trip:', err);
        setError('Failed to delete trip');
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const getPendingRequestsCount = () => {
    return tripRequests.filter(r => r.status === 'pending').length;
  };

  // Filter Drawer Component for Mobile
  const FilterDrawer = () => (
    <Drawer
      anchor="right"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      PaperProps={{
        sx: { width: '100%', maxWidth: 400, p: 2 }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setFilterDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="outlined"
          onClick={clearFilters}
          sx={{
            borderColor: '#FDCB42',
            color: '#FDCB42',
            '&:hover': {
              backgroundColor: '#FDCB42',
              color: 'white'
            }
          }}
        >
          Clear Filters
        </Button>
      </Stack>
    </Drawer>
  );

  if (loading) {
    return (
      <Box display="flex">
        {!isMobile && <Navbar />}
        <Box flexGrow={1}>
          {!isMobile && <Header />}
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress sx={{ color: '#FDCB42' }} />
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
        
        {/* MAIN CONTENT - IMPROVED SCROLLING */}
        <Box sx={{ 
          p: isMobile ? 1 : 2, 
          flexGrow: 1,
          overflow: 'auto',
          height: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)',
          scrollBehavior: 'smooth',
          paddingBottom: isMobile ? '80px' : '40px',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#FDCB42',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#fbbf24',
            },
          },
        }}>
          {/* Minimal Header - Only show on mobile */}
          {isMobile && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1
            }}>
              {getPendingRequestsCount() > 0 && (
                <Badge 
                  badgeContent={getPendingRequestsCount()} 
                  color="error"
                >
                  <PendingActions color="action" />
                </Badge>
              )}
              
              <IconButton 
                onClick={() => setFilterDrawerOpen(true)}
                sx={{ color: '#FDCB42' }}
              >
                <FilterList />
              </IconButton>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Compact Desktop Filters */}
          {!isMobile && (
            <Paper sx={{ p: 1.5, mb: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search trips, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    sx={{
                      height: '40px',
                      borderColor: '#FDCB42',
                      color: '#FDCB42',
                      '&:hover': {
                        backgroundColor: '#FDCB42',
                        color: 'white'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Compact Tabs */}
          <Paper sx={{ 
            mb: 2,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1
          }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              indicatorColor="primary"
              sx={{
                minHeight: isMobile ? 48 : 56,
                '& .MuiTab-root': {
                  minWidth: isMobile ? 100 : 'auto',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  minHeight: isMobile ? 48 : 56,
                  padding: isMobile ? '6px 8px' : '12px 16px'
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#FDCB42'
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#FDCB42'
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index} 
                  label={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5,
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      {React.cloneElement(tab.icon, { 
                        sx: { fontSize: isMobile ? 16 : 20 } 
                      })}
                      <Typography variant={isMobile ? "caption" : "body2"}>
                        {tab.label}
                      </Typography>
                      {tab.count > 0 && (
                        <Chip 
                          label={tab.count} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#FDCB42', 
                            color: 'black',
                            height: isMobile ? 14 : 20,
                            fontSize: isMobile ? '0.6rem' : '0.7rem',
                            '& .MuiChip-label': {
                              px: isMobile ? 0.5 : 1
                            }
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>

          {/* CONTENT GRID - IMPROVED SPACING AND EXTRA BOTTOM SPACE */}
          <Box sx={{ 
            minHeight: '400px',
            paddingBottom: isMobile ? '60px' : '40px' 
          }}>
            <Grid container spacing={isMobile ? 1 : 2}>
              {tabs[tabValue].value === 'requests' ? (
                // Show pending requests
                filteredRequests.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: isMobile ? 2 : 3, textAlign: 'center' }}>
                      <PendingActions sx={{ 
                        fontSize: isMobile ? 40 : 48, 
                        color: 'text.secondary', 
                        mb: 1 
                      }} />
                      <Typography 
                        variant={isMobile ? "body2" : "h6"} 
                        color="text.secondary" 
                        gutterBottom
                      >
                        No pending requests
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        All customer requests have been processed.
                      </Typography>
                    </Paper>
                  </Grid>
                ) : (
                  filteredRequests.map((request) => (
                    <Grid item xs={12} sm={6} lg={4} key={request.trip_id}>
                      <TripRequestCard
                        request={request}
                        onAssign={() => handleAssignTrip(request)}
                        onReject={() => handleRejectRequest(request.trip_id)}
                        isMobile={isMobile}
                      />
                    </Grid>
                  ))
                )
              ) : (
                // Show trips
                filteredTrips.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: isMobile ? 2 : 3, textAlign: 'center' }}>
                      <LocationOn sx={{ 
                        fontSize: isMobile ? 40 : 48, 
                        color: 'text.secondary', 
                        mb: 1 
                      }} />
                      <Typography 
                        variant={isMobile ? "body2" : "h6"} 
                        color="text.secondary" 
                        gutterBottom
                      >
                        No trips found
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        No trips match the current filter.
                      </Typography>
                    </Paper>
                  </Grid>
                ) : (
                  filteredTrips.map((trip) => (
                    <Grid item xs={12} sm={6} lg={4} key={trip.trip_id}>
                      <TripCard
                        trip={trip}
                        onViewDetails={() => handleTripClick(trip)}
                        onEdit={(trip) => {
                          setEditingTrip(trip);
                          setSchedulerOpen(true);
                        }}
                        onDelete={handleDeleteTrip}
                        onStart={handleStartTrip}
                        onComplete={handleCompleteTrip}
                        isMobile={isMobile}
                      />
                    </Grid>
                  ))
                )
              )}
            </Grid>
          </Box>

          {/* Mobile Filter Drawer */}
          <FilterDrawer />

          {/* Trip Scheduler Dialog */}
          <TripScheduler
            open={schedulerOpen}
            onClose={() => {
              setSchedulerOpen(false);
              setEditingTrip(null);
              setSelectedRequest(null);
            }}
            onSave={handleSaveTrip}
            editTrip={editingTrip}
            requestData={selectedRequest}
            isMobile={isMobile}
          />

          {/* Trip Details Modal */}
          <TripDetailsModal
            open={tripDetailsOpen}
            onClose={() => {
              setTripDetailsOpen(false);
              setSelectedTripForDetails(null);
            }}
            trip={selectedTripForDetails}
            onAssign={handleAssignFromDetails}
            isMobile={isMobile}
          />
        </Box>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Fab
            size="small"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': {
                bgcolor: '#fbbf24'
              },
              zIndex: 1000
            }}
            onClick={scrollToTop}
          >
            <KeyboardArrowUp />
          </Fab>
        )}
      </Box>
    </Box>
  );
}

export default TripSchedule;