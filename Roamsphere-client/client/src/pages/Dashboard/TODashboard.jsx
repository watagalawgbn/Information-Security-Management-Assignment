import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Chip,
  Badge
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Person,
  DirectionsCar
} from '@mui/icons-material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import TripScheduler from '../tripPages/TripScheduler';
import AssignmentModal from '../tripPages/AssignmentModel';
import TripServices from '../../services/TripServices';

function TODashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Statistics
  const [stats, setStats] = useState({
    totalTrips: 0,
    pendingAssignments: 0,
    activeTrips: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [trips]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await TripServices.getAllTrips();
      
      if (response && response.success) {
        const tripsData = response.data?.trips || [];
        setTrips(tripsData);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to fetch trip data. Please try again.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setStats({
      totalTrips: trips.length,
      pendingAssignments: trips.filter(t => 
        t.status === 'pending' || (!t.assigned_driver_id || !t.assigned_vehicle_id)
      ).length,
      activeTrips: trips.filter(t => t.status === 'in-progress').length,
      completedToday: trips.filter(t => {
        if (t.status !== 'completed') return false;
        const tripDate = new Date(t.preferred_date);
        return tripDate >= today && tripDate < tomorrow;
      }).length
    });
  };

  // Calendar functions
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getTripsForDate = (date) => {
    return trips.filter(trip => {
      const tripDate = new Date(trip.preferred_date);
      return tripDate.toDateString() === date.toDateString();
    });
  };

  const getTripStatusColor = (status) => {
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

  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    if (trip.status === 'pending' || !trip.assigned_driver_id || !trip.assigned_vehicle_id) {
      setAssignmentOpen(true);
    }
  };

  const handleSaveTrip = async (tripData) => {
    try {
      setLoading(true);
      
      const response = await TripServices.createTripRequest(tripData);
      
      if (response.success) {
        await fetchTrips();
        setSchedulerOpen(false);
      } else {
        setError('Failed to create trip');
      }
    } catch (err) {
      console.error('Error saving trip:', err);
      setError('Failed to save trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrip = async (assignmentData) => {
    try {
      setLoading(true);
      
      const response = await TripServices.assignTripToDriver(
        selectedTrip.trip_id, 
        assignmentData
      );
      
      if (response.success) {
        await fetchTrips();
        setAssignmentOpen(false);
        setSelectedTrip(null);
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

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && trips.length === 0) {
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
        
        <Box sx={{ p: isMobile ? 2 : 3, flexGrow: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                <Typography variant="h4" sx={{ color: '#FDCB42', fontWeight: 'bold' }}>
                  {stats.totalTrips}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Trips
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3cd' }}>
                <Typography variant="h4" sx={{ color: '#856404', fontWeight: 'bold' }}>
                  {stats.pendingAssignments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Assignments
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#d1ecf1' }}>
                <Typography variant="h4" sx={{ color: '#0c5460', fontWeight: 'bold' }}>
                  {stats.activeTrips}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Trips
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#d4edda' }}>
                <Typography variant="h4" sx={{ color: '#155724', fontWeight: 'bold' }}>
                  {stats.completedToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Today
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Calendar */}
          <Paper sx={{ p: 3 }}>
            {/* Calendar Header - Month Navigation Only */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3
            }}>
              <IconButton onClick={() => navigateMonth(-1)}>
                <ChevronLeft />
              </IconButton>
              
              <Typography variant="h5" sx={{ minWidth: 200, textAlign: 'center' }}>
                {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </Typography>
              
              <IconButton onClick={() => navigateMonth(1)}>
                <ChevronRight />
              </IconButton>
            </Box>

            {/* Status Legend */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="Pending" size="small" sx={{ bgcolor: '#ff9800', color: 'white' }} />
              <Chip label="Confirmed" size="small" sx={{ bgcolor: '#2196f3', color: 'white' }} />
              <Chip label="In Progress" size="small" sx={{ bgcolor: '#4caf50', color: 'white' }} />
              <Chip label="Completed" size="small" sx={{ bgcolor: '#9e9e9e', color: 'white' }} />
            </Box>

            {/* Week Headers */}
            <Grid container spacing={1} sx={{ mb: 1 }}>
              {weekDays.map((day) => (
                <Grid item xs key={day}>
                  <Typography 
                    variant="subtitle2" 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'text.secondary',
                      py: 1
                    }}
                  >
                    {day}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Grid */}
            <Grid container spacing={1}>
              {calendarDays.map((date, index) => {
                const dayTrips = getTripsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                  <Grid item xs key={index}>
                    <Paper
                      sx={{
                        minHeight: isMobile ? 80 : 140,
                        p: 1,
                        bgcolor: isCurrentMonth ? 'white' : '#f5f5f5',
                        border: isToday ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                        opacity: isCurrentMonth ? 1 : 0.6,
                        position: 'relative'
                      }}
                    >
                      {/* Date Number */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? '#FDCB42' : isCurrentMonth ? 'text.primary' : 'text.secondary'
                          }}
                        >
                          {date.getDate()}
                        </Typography>
                        
                        {dayTrips.length > 0 && (
                          <Badge 
                            badgeContent={dayTrips.length} 
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: '#FDCB42',
                                color: 'black',
                                fontSize: '0.6rem',
                                minWidth: 16,
                                height: 16
                              }
                            }}
                          />
                        )}
                      </Box>

                      {/* Trip Chips */}
                      <Box sx={{ maxHeight: isMobile ? 50 : 100, overflow: 'hidden' }}>
                        {dayTrips.slice(0, isMobile ? 2 : 4).map((trip) => (
                          <Box
                            key={trip.trip_id}
                            sx={{
                              mb: 0.5,
                              p: 0.5,
                              bgcolor: getTripStatusColor(trip.status),
                              color: 'white',
                              borderRadius: 1,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.02)'
                              }
                            }}
                            onClick={() => handleTripSelect(trip)}
                          >
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.7rem'
                            }}>
                              {trip.preferred_time} - {trip.title?.substring(0, 15)}
                            </Typography>
                            
                            {!isMobile && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                {!trip.assigned_driver_id && (
                                  <Person sx={{ fontSize: 12 }} />
                                )}
                                {!trip.assigned_vehicle_id && (
                                  <DirectionsCar sx={{ fontSize: 12 }} />
                                )}
                              </Box>
                            )}
                          </Box>
                        ))}
                        
                        {dayTrips.length > (isMobile ? 2 : 4) && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.6rem' }}
                          >
                            +{dayTrips.length - (isMobile ? 2 : 4)} more
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Trip Scheduler Modal */}
          <TripScheduler
            open={schedulerOpen}
            onClose={() => setSchedulerOpen(false)}
            onSave={handleSaveTrip}
            isMobile={isMobile}
          />

          {/* Assignment Modal */}
          <AssignmentModal
            open={assignmentOpen}
            onClose={() => {
              setAssignmentOpen(false);
              setSelectedTrip(null);
            }}
            trip={selectedTrip}
            onAssign={handleAssignTrip}
            isMobile={isMobile}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default TODashboard;