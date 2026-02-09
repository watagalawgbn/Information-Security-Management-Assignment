import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Grid,
  Paper,
  Chip,
  Tooltip,
  Badge,
  useTheme
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarViewMonth,
  CalendarViewWeek,
  ViewDay,
  Event,
  Schedule,
  Person,
  DirectionsCar
} from '@mui/icons-material';
import CalendarGrid from './CalendarGrid';
import TripEventCard from './TripEventCard';

const TripCalendar = ({
  trips = [],
  selectedDate,
  onDateSelect,
  onTripSelect,
  calendarView,
  onViewChange,
  loading,
  isMobile
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Memoized trip data organized by date
  const tripsByDate = useMemo(() => {
    const organized = {};
    
    trips.forEach(trip => {
      const dateKey = new Date(trip.preferred_date).toDateString();
      if (!organized[dateKey]) {
        organized[dateKey] = [];
      }
      organized[dateKey].push(trip);
    });
    
    return organized;
  }, [trips]);

  // Navigation functions
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
    onDateSelect && onDateSelect(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect && onDateSelect(today);
  };

  const handleNavigation = (direction) => {
    switch (calendarView) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
      default:
        navigateMonth(direction);
    }
  };

  const getViewTitle = () => {
    const options = { year: 'numeric', month: 'long' };
    
    switch (calendarView) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return currentDate.toLocaleDateString('en-US', options);
    }
  };

  const getTripsForDate = (date) => {
    const dateKey = date.toDateString();
    return tripsByDate[dateKey] || [];
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

  const renderDayView = () => {
    const dayTrips = getTripsForDate(currentDate);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Trips for {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
        
        {dayTrips.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
            <Event sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No trips scheduled for this date
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {dayTrips.map((trip) => (
              <Grid item xs={12} sm={6} md={4} key={trip.trip_id}>
                <TripEventCard
                  trip={trip}
                  onClick={() => onTripSelect && onTripSelect(trip)}
                  isMobile={isMobile}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={1}>
          {weekDays.map((day, index) => {
            const dayTrips = getTripsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate?.toDateString();
            
            return (
              <Grid item xs key={index} sx={{ minWidth: 0 }}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    minHeight: 200,
                    bgcolor: isSelected ? 'rgba(253, 203, 66, 0.1)' : 'white',
                    border: isToday ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.05)' }
                  }}
                  onClick={() => onDateSelect && onDateSelect(day)}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? '#FDCB42' : 'text.primary',
                      mb: 1
                    }}
                  >
                    {day.getDate()}
                  </Typography>
                  
                  {dayTrips.slice(0, 3).map((trip) => (
                    <Chip
                      key={trip.trip_id}
                      label={trip.title?.substring(0, 15) + (trip.title?.length > 15 ? '...' : '')}
                      size="small"
                      sx={{
                        mb: 0.5,
                        display: 'block',
                        bgcolor: getTripStatusColor(trip.status),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTripSelect && onTripSelect(trip);
                      }}
                    />
                  ))}
                  
                  {dayTrips.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayTrips.length - 3} more
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        mb: 2
      }}>
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => handleNavigation(-1)}>
            <ChevronLeft />
          </IconButton>
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ minWidth: isMobile ? 200 : 300, textAlign: 'center' }}
          >
            {getViewTitle()}
          </Typography>
          
          <IconButton onClick={() => handleNavigation(1)}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* View Controls */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={goToToday}
            sx={{
              borderColor: '#FDCB42',
              color: '#FDCB42',
              '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' }
            }}
          >
            Today
          </Button>
          
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => onViewChange('month')}
              variant={calendarView === 'month' ? 'contained' : 'outlined'}
              sx={{
                bgcolor: calendarView === 'month' ? '#FDCB42' : 'transparent',
                borderColor: '#FDCB42',
                color: calendarView === 'month' ? 'black' : '#FDCB42',
                '&:hover': { 
                  bgcolor: calendarView === 'month' ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)' 
                }
              }}
            >
              {isMobile ? <CalendarViewMonth /> : 'Month'}
            </Button>
            <Button
              onClick={() => onViewChange('week')}
              variant={calendarView === 'week' ? 'contained' : 'outlined'}
              sx={{
                bgcolor: calendarView === 'week' ? '#FDCB42' : 'transparent',
                borderColor: '#FDCB42',
                color: calendarView === 'week' ? 'black' : '#FDCB42',
                '&:hover': { 
                  bgcolor: calendarView === 'week' ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)' 
                }
              }}
            >
              {isMobile ? <CalendarViewWeek /> : 'Week'}
            </Button>
            <Button
              onClick={() => onViewChange('day')}
              variant={calendarView === 'day' ? 'contained' : 'outlined'}
              sx={{
                bgcolor: calendarView === 'day' ? '#FDCB42' : 'transparent',
                borderColor: '#FDCB42',
                color: calendarView === 'day' ? 'black' : '#FDCB42',
                '&:hover': { 
                  bgcolor: calendarView === 'day' ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)' 
                }
              }}
            >
              {isMobile ? <ViewDay /> : 'Day'}
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="Pending" size="small" sx={{ bgcolor: '#ff9800', color: 'white' }} />
        <Chip label="Confirmed" size="small" sx={{ bgcolor: '#2196f3', color: 'white' }} />
        <Chip label="In Progress" size="small" sx={{ bgcolor: '#4caf50', color: 'white' }} />
        <Chip label="Completed" size="small" sx={{ bgcolor: '#9e9e9e', color: 'white' }} />
      </Box>

      {/* Calendar Content */}
      {calendarView === 'month' && (
        <CalendarGrid
          currentDate={currentDate}
          tripsByDate={tripsByDate}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onTripSelect={onTripSelect}
          getTripStatusColor={getTripStatusColor}
          isMobile={isMobile}
        />
      )}
      
      {calendarView === 'week' && renderWeekView()}
      {calendarView === 'day' && renderDayView()}
    </Box>
  );
};

export default TripCalendar;