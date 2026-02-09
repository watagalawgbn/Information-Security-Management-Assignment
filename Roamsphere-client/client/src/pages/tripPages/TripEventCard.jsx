import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Schedule,
  LocationOn,
  Person,
  DirectionsCar,
  Warning
} from '@mui/icons-material';

const TripEventCard = ({ trip, onClick, isMobile, showDetails = true }) => {
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Assignment';
      case 'confirmed':
        return 'Confirmed';
      case 'assigned':
        return 'Assigned';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const needsAssignment = !trip.assigned_driver_id || !trip.assigned_vehicle_id;
  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (time.includes(':')) return time;
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: needsAssignment ? '2px solid #ff9800' : '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s',
          borderColor: '#FDCB42'
        },
        position: 'relative'
      }}
      onClick={onClick}
    >
      {needsAssignment && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          <Tooltip title="Needs Driver/Vehicle Assignment">
            <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        {/* Trip Title and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography 
            variant={isMobile ? "subtitle2" : "h6"} 
            sx={{ 
              fontWeight: 'bold',
              pr: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {trip.title || 'Untitled Trip'}
          </Typography>
          
          <Chip
            label={getStatusLabel(trip.status)}
            size="small"
            sx={{
              bgcolor: getStatusColor(trip.status),
              color: 'white',
              fontWeight: 'bold',
              minWidth: 'fit-content'
            }}
          />
        </Box>

        {/* Time */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {formatTime(trip.preferred_time)}
            {trip.return_time && ` - ${formatTime(trip.return_time)}`}
          </Typography>
        </Box>

        {/* Route */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 1, mt: 0.2 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              From: {trip.origin || 'N/A'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              To: {trip.destination || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Customer Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {trip.contact_name || 'N/A'} ({trip.passenger_count || 1} pax)
          </Typography>
        </Box>

        {showDetails && (
          <>
            {/* Assignment Status */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {trip.assigned_driver_id ? (
                <Chip
                  icon={<Person />}
                  label="Driver ✓"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Person />}
                  label="No Driver"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}

              {trip.assigned_vehicle_id ? (
                <Chip
                  icon={<DirectionsCar />}
                  label="Vehicle ✓"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<DirectionsCar />}
                  label="No Vehicle"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Cost */}
            {trip.estimated_cost && (
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mt: 1, 
                  fontWeight: 'bold',
                  color: '#FDCB42',
                  textAlign: 'right'
                }}
              >
                ${trip.estimated_cost}
              </Typography>
            )}
          </>
        )}

        {/* Click to view details hint */}
        <Box sx={{ 
          mt: 1, 
          textAlign: 'center', 
          borderTop: '1px dashed #e0e0e0', 
          pt: 1 
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Click to view details & assign resources
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TripEventCard;