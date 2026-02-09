import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Badge
} from '@mui/material';

const CalendarGrid = ({
  currentDate,
  tripsByDate,
  selectedDate,
  onDateSelect,
  onTripSelect,
  getTripStatusColor,
  isMobile
}) => {
  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on Saturday of the week containing the last day
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

  const calendarDays = getCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getTripsForDate = (date) => {
    const dateKey = date.toDateString();
    return tripsByDate[dateKey] || [];
  };

  // Week day headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Box>
      {/* Week Headers */}
      <Grid container spacing={0.5} sx={{ mb: 1 }}>
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
              {isMobile ? day.charAt(0) : day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      <Grid container spacing={0.5}>
        {calendarDays.map((date, index) => {
          const dayTrips = getTripsForDate(date);
          const currentMonth = isCurrentMonth(date);
          const todayDate = isToday(date);
          const selectedDay = isSelected(date);
          
          return (
            <Grid item xs key={index}>
              <Paper
                sx={{
                  minHeight: isMobile ? 60 : 120,
                  p: 0.5,
                  cursor: 'pointer',
                  bgcolor: selectedDay 
                    ? 'rgba(253, 203, 66, 0.2)' 
                    : currentMonth 
                      ? 'white' 
                      : '#f5f5f5',
                  border: todayDate 
                    ? '2px solid #FDCB42' 
                    : selectedDay 
                      ? '2px solid #FDCB42'
                      : '1px solid #e0e0e0',
                  opacity: currentMonth ? 1 : 0.6,
                  '&:hover': {
                    bgcolor: 'rgba(253, 203, 66, 0.1)',
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s'
                  }
                }}
                onClick={() => onDateSelect && onDateSelect(date)}
              >
                {/* Date Number */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    sx={{
                      fontWeight: todayDate ? 'bold' : 'normal',
                      color: todayDate 
                        ? '#FDCB42' 
                        : currentMonth 
                          ? 'text.primary' 
                          : 'text.secondary'
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
                <Box sx={{ mt: 0.5, maxHeight: isMobile ? 30 : 80, overflow: 'hidden' }}>
                  {dayTrips.slice(0, isMobile ? 1 : 3).map((trip) => (
                    <Chip
                      key={trip.trip_id}
                      label={
                        isMobile 
                          ? '•' 
                          : (trip.title?.substring(0, 12) + (trip.title?.length > 12 ? '...' : ''))
                      }
                      size="small"
                      sx={{
                        mb: 0.25,
                        display: 'block',
                        bgcolor: getTripStatusColor(trip.status),
                        color: 'white',
                        fontSize: isMobile ? '0.6rem' : '0.7rem',
                        height: isMobile ? '16px' : '20px',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTripSelect && onTripSelect(trip);
                      }}
                    />
                  ))}
                  
                  {dayTrips.length > (isMobile ? 1 : 3) && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.6rem' : '0.7rem' }}
                    >
                      +{dayTrips.length - (isMobile ? 1 : 3)} more
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default CalendarGrid;