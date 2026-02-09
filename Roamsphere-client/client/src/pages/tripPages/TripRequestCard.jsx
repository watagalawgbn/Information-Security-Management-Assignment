import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Grid
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  Person,
  Phone,
  Email,
  DirectionsCar,
  Assignment,
  Close,
  Warning,
  AccessTime,
  Group,
  AttachMoney,
  Route
} from '@mui/icons-material';

const TripRequestCard = ({ request, onAssign, onReject, isMobile = false }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getVehicleTypeLabel = (type) => {
    const types = {
      'economy': 'Economy Car',
      'luxury': 'Luxury Car',
      'van': 'Van',
      'minibus': 'Mini Bus',
      'bus': 'Bus',
      'any': 'Any Vehicle'
    };
    return types[type?.toLowerCase()] || type || 'Any Vehicle';
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    
    try {
      // Handle different date formats
      let dateStr = date;
      let timeStr = time;
      
      // If date is already a valid Date object
      if (date instanceof Date) {
        return date.toLocaleString();
      }
      
      // If date is in ISO format, extract the date part
      if (typeof date === 'string' && date.includes('T')) {
        dateStr = date.split('T')[0];
      }
      
      // Ensure time is in proper format (HH:MM or HH:MM:SS)
      if (typeof time === 'string' && !time.includes(':')) {
        // If time is just numbers, try to format it
        if (time.length === 4) {
          timeStr = `${time.slice(0, 2)}:${time.slice(2)}`;
        }
      }
      
      // Create date object
      const combinedDateTime = new Date(`${dateStr} ${timeStr}`);
      
      // Check if the date is valid
      if (isNaN(combinedDateTime.getTime())) {
        // Try alternative parsing methods
        const altDate = new Date(dateStr);
        if (!isNaN(altDate.getTime())) {
          return altDate.toLocaleDateString();
        }
        return 'Invalid date format';
      }
      
      return combinedDateTime.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error, { date, time });
      return 'Invalid date';
    }
  };

  const getTimeUntilTrip = () => {
    if (!request.preferred_date || !request.preferred_time) return null;
    
    try {
      let dateStr = request.preferred_date;
      let timeStr = request.preferred_time;
      
      // Handle ISO date format
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      
      // Ensure time format
      if (typeof timeStr === 'string' && !timeStr.includes(':')) {
        if (timeStr.length === 4) {
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
        }
      }
      
      const tripDateTime = new Date(`${dateStr} ${timeStr}`);
      
      // Check if date is valid
      if (isNaN(tripDateTime.getTime())) {
        return null;
      }
      
      const now = new Date();
      const diffMs = tripDateTime.getTime() - now.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 0) return 'Overdue';
      if (diffHours < 1) return 'Soon';
      if (diffHours < 24) return `${diffHours}h`;
      if (diffHours < 168) return `${Math.ceil(diffHours / 24)}d`;
      return `${Math.ceil(diffHours / 168)}w`;
    } catch (error) {
      console.error('Time calculation error:', error, { 
        date: request.preferred_date, 
        time: request.preferred_time 
      });
      return null;
    }
  };

  // Extract passenger names if available
  const getPassengerInfo = () => {
    if (request.passenger_names) {
      try {
        const names = typeof request.passenger_names === 'string' 
          ? JSON.parse(request.passenger_names) 
          : request.passenger_names;
        return Array.isArray(names) ? names : [names];
      } catch {
        return [request.passenger_names];
      }
    }
    return [];
  };

  // Format distance display
  const formatDistance = (distance) => {
    if (!distance || distance === 0) return 'Calculating...';
    if (typeof distance !== 'number' || isNaN(distance)) return 'Calculating...';
    return `${distance} km`;
  };

  // Safe date formatting for timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Timestamp formatting error:', error);
      return 'Unknown';
    }
  };

  const timeUntilTrip = getTimeUntilTrip();
  const isUrgent = timeUntilTrip && (timeUntilTrip === 'Overdue' || timeUntilTrip === 'Soon' || timeUntilTrip.includes('h'));
  const passengerNames = getPassengerInfo();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: request.priority === 'high' ? '2px solid #ff5722' : '1px solid #e0e0e0',
        position: 'relative',
        maxWidth: isMobile ? '100%' : 400,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* Priority Badge */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Chip
          size="small"
          label={request.priority?.toUpperCase() || 'NORMAL'}
          color={getPriorityColor(request.priority)}
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Urgency Indicator */}
      {isUrgent && (
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          <Tooltip title={
            timeUntilTrip === 'Overdue' ? 'Trip is overdue!' : 
            timeUntilTrip === 'Soon' ? 'Trip is starting soon!' :
            'Urgent - less than 24 hours'
          }>
            <Warning color="error" />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
        {/* Header */}
        <Typography variant={isMobile ? "body1" : "h6"} gutterBottom noWrap>
          {request.title || 'Trip Request'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Request ID: {request.trip_id || request.id || 'N/A'}
        </Typography>

        {/* Route Information */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOn sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              <strong>From:</strong> {request.origin || 'Not specified'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              <strong>To:</strong> {request.destination || 'Not specified'}
            </Typography>
          </Box>
          
          {/* Distance Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Route sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
              <strong>Distance:</strong> {formatDistance(request.estimated_distance_km)}
            </Typography>
          </Box>

          {request.stops && (
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              <strong>Stops:</strong> {Array.isArray(request.stops) ? request.stops.length : request.stops}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Trip Details */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Schedule sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2">
              {formatDateTime(request.preferred_date, request.preferred_time)}
            </Typography>
          </Box>
          
          {timeUntilTrip && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTime sx={{ mr: 1, color: isUrgent ? 'error.main' : 'text.secondary', fontSize: 20 }} />
              <Typography 
                variant="body2" 
                color={isUrgent ? 'error.main' : 'text.primary'}
                fontWeight={isUrgent ? 'bold' : 'normal'}
              >
                {timeUntilTrip === 'Overdue' ? 'OVERDUE' : 
                 timeUntilTrip === 'Soon' ? 'STARTING SOON' : 
                 `In ${timeUntilTrip}`}
              </Typography>
            </Box>
          )}

          {/* Passenger Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Group sx={{ mr: 1, color: 'info.main', fontSize: 20 }} />
            <Typography variant="body2">
              {request.passenger_count || 1} passenger{(request.passenger_count || 1) !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Return Trip Info */}
          {request.category === 'round-trip' && request.return_date && request.return_time && (
            <Typography variant="body2" color="text.secondary">
              <strong>Return:</strong> {formatDateTime(request.return_date, request.return_time)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Customer Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Customer Details</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main', fontSize: 12 }}>
              {(request.customer_first_name?.[0] || request.contact_name?.[0] || 'C').toUpperCase()}
            </Avatar>
            <Typography variant="body2">
              {request.customer_first_name && request.customer_last_name 
                ? `${request.customer_first_name} ${request.customer_last_name}`
                : request.contact_name || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {request.contact_phone || request.customer_phone || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {request.contact_email || request.customer_email || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Passenger Details */}
        {passengerNames.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Passenger Names</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {passengerNames.slice(0, 3).map((name, index) => (
                  <Chip 
                    key={index}
                    label={name} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
                {passengerNames.length > 3 && (
                  <Chip 
                    label={`+${passengerNames.length - 3} more`} 
                    size="small" 
                    color="primary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </>
        )}

        {/* Vehicle Preferences - Budget section removed */}
        {request.vehicle_type && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Vehicle Preference</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DirectionsCar sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {getVehicleTypeLabel(request.vehicle_type)}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Special Requirements */}
        {request.special_requirements && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Special Requirements</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontSize: '0.8rem',
              fontStyle: 'italic',
              maxHeight: '3em',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {request.special_requirements}
            </Typography>
          </>
        )}

        {/* Notes */}
        {request.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Notes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontSize: '0.8rem',
              fontStyle: 'italic',
              maxHeight: '3em',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {request.notes}
            </Typography>
          </>
        )}

        {/* Request Timestamp */}
        <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
          <Typography variant="caption" color="text.secondary">
            Requested: {formatTimestamp(request.created_at)}
          </Typography>
        </Box>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Assignment />}
          onClick={onAssign}
          sx={{
            bgcolor: '#FDCB42',
            '&:hover': {
              bgcolor: '#fbbf24'
            },
            mr: 1
          }}
        >
          Assign Trip
        </Button>
        <Tooltip title="Reject Request">
          <IconButton
            onClick={onReject}
            color="error"
            sx={{
              border: '1px solid',
              borderColor: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white'
              }
            }}
          >
            <Close />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default TripRequestCard;