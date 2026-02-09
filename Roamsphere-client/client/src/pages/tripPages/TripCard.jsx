import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  Person,
  DirectionsCar,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Stop,
  Route,
  Group
} from '@mui/icons-material';

function TripCard({ trip, onViewDetails, onEdit, onDelete, onStart, onComplete, isMobile = false, horizontal = false }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
      case 'assigned':
        return 'primary';
      case 'in-progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
      case 'assigned':
        return <Schedule fontSize="small" />;
      case 'in-progress':
        return <PlayArrow fontSize="small" />;
      case 'completed':
        return <Stop fontSize="small" />;
      default:
        return <Schedule fontSize="small" />;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not set';
    return new Date(dateTime).toLocaleString();
  };

  const getTripTypeIcon = (type) => {
    switch (type) {
      case 'round-trip':
        return '⟲';
      case 'multi-stop':
        return '⚬⚬⚬';
      default:
        return '→';
    }
  };

  // Extract passenger names if available
  const getPassengerInfo = () => {
    if (trip.passenger_names) {
      try {
        const names = typeof trip.passenger_names === 'string' 
          ? JSON.parse(trip.passenger_names) 
          : trip.passenger_names;
        return Array.isArray(names) ? names : [names];
      } catch {
        return [trip.passenger_names];
      }
    }
    return [];
  };

  const passengerNames = getPassengerInfo();

  // Get driver info
  const getDriverInfo = () => {
    const firstName = trip.driver_first_name || '';
    const lastName = trip.driver_last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || trip.driverName || 'Not assigned';
    const avatar = trip.driver_avatar || trip.driver_image || '';
    const license = trip.driver_license || '';
    const phone = trip.driver_phone || '';
    
    return { fullName, avatar, license, phone };
  };

  // Get vehicle info
  const getVehicleInfo = () => {
    const model = trip.vehicle_model || trip.vehicleName || 'Not assigned';
    const image = trip.vehicle_image || trip.vehicle_photo || '';
    const plateNumber = trip.vehicle_plate_number || trip.license_plate || '';
    const capacity = trip.vehicle_capacity || trip.seating_capacity || '';
    const type = trip.vehicle_type || '';
    
    return { model, image, plateNumber, capacity, type };
  };

  const driverInfo = getDriverInfo();
  const vehicleInfo = getVehicleInfo();

  // Horizontal Layout for List View
  if (horizontal) {
    return (
      <Card sx={{ 
        width: '100%',
        mb: isMobile ? 1 : 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        }
      }}>
        <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
          <Grid container spacing={2} alignItems="center">
            {/* Left Section - Trip Info */}
            <Grid item xs={12} sm={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography 
                    variant={isMobile ? "body1" : "h6"} 
                    sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}
                    noWrap
                  >
                    {trip.title}
                  </Typography>
                  <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 1 }}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={getStatusIcon(trip.status)}
                    label={trip.status}
                    color={getStatusColor(trip.status)}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                  <Chip
                    label={`${getTripTypeIcon(trip.category || trip.tripType)} ${trip.category || trip.tripType || 'one-way'}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Center Section - Route & Schedule */}
            <Grid item xs={12} sm={3}>
              <Box>
                {/* Route */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      <strong>From:</strong> {trip.origin}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Route sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      <strong>To:</strong> {trip.destination}
                    </Typography>
                  </Box>
                </Box>

                {/* Schedule */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {formatDateTime(trip.preferred_date && trip.preferred_time 
                      ? `${trip.preferred_date} ${trip.preferred_time}` 
                      : trip.start_date_time || trip.startDateTime)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Driver Section */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  src={driverInfo.avatar} 
                  sx={{ width: 32, height: 32, mr: 1 }}
                >
                  {driverInfo.fullName !== 'Not assigned' ? driverInfo.fullName[0] : 'D'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }} noWrap>
                    {driverInfo.fullName}
                  </Typography>
                  {driverInfo.license && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {driverInfo.license}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Vehicle Section */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {vehicleInfo.image ? (
                  <Avatar 
                    src={vehicleInfo.image} 
                    variant="rounded"
                    sx={{ width: 32, height: 32, mr: 1 }}
                  />
                ) : (
                  <Avatar 
                    variant="rounded"
                    sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}
                  >
                    <DirectionsCar fontSize="small" />
                  </Avatar>
                )}
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }} noWrap>
                    {vehicleInfo.model}
                  </Typography>
                  {vehicleInfo.plateNumber && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {vehicleInfo.plateNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} sm={2}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                flexDirection: isMobile ? 'row' : 'column',
                justifyContent: isMobile ? 'flex-start' : 'center',
                flexWrap: 'wrap'
              }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => onViewDetails(trip.trip_id || trip.id)}
                  sx={{ 
                    borderColor: '#FDCB42',
                    color: '#FDCB42',
                    fontSize: '0.7rem',
                    minWidth: isMobile ? 'auto' : '100%',
                    '&:hover': {
                      backgroundColor: '#FDCB42',
                      color: 'white'
                    }
                  }}
                >
                  <Visibility fontSize="small" sx={{ mr: 0.5 }} />
                  View
                </Button>
                
                {(trip.status === 'scheduled' || trip.status === 'confirmed' || trip.status === 'assigned') && (
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => onStart(trip.trip_id || trip.id)}
                    sx={{ 
                      bgcolor: '#4CAF50',
                      fontSize: '0.7rem',
                      minWidth: isMobile ? 'auto' : '100%'
                    }}
                  >
                    <PlayArrow fontSize="small" sx={{ mr: 0.5 }} />
                    Start
                  </Button>
                )}
                
                {trip.status === 'in-progress' && (
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => onComplete(trip.trip_id || trip.id)}
                    sx={{ 
                      bgcolor: '#FF9800',
                      fontSize: '0.7rem',
                      minWidth: isMobile ? 'auto' : '100%'
                    }}
                  >
                    <Stop fontSize="small" sx={{ mr: 0.5 }} />
                    Complete
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit(trip); handleMenuClose(); }}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => { onViewDetails(trip.trip_id || trip.id); handleMenuClose(); }}>
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem 
            onClick={() => { onDelete(trip.trip_id || trip.id); handleMenuClose(); }}
            sx={{ color: 'error.main' }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </Card>
    );
  }

  // Original Vertical Layout (when horizontal=false)
  return (
    <Card sx={{ 
      maxWidth: isMobile ? '100%' : 400,
      margin: isMobile ? 1 : 2,
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-2px)',
        transition: 'all 0.3s ease'
      }
    }}>
      <CardContent>
        {/* Header with Title and Menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography 
            gutterBottom 
            variant={isMobile ? "body1" : "h6"} 
            component="div" 
            sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}
          >
            {trip.title}
          </Typography>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        {/* Status and Trip Type */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={getStatusIcon(trip.status)}
            label={trip.status}
            color={getStatusColor(trip.status)}
            size="small"
          />
          <Chip
            label={`${getTripTypeIcon(trip.category || trip.tripType)} ${trip.category || trip.tripType || 'one-way'}`}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* Route Information */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOn color="action" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              <strong>From:</strong> {trip.origin}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Route color="action" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              <strong>To:</strong> {trip.destination}
            </Typography>
          </Box>
          {trip.stops && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              <strong>Stops:</strong> {Array.isArray(trip.stops) ? trip.stops.length : trip.stops} stops
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Schedule Information */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Schedule color="action" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(trip.preferred_date && trip.preferred_time 
                  ? `${trip.preferred_date} ${trip.preferred_time}` 
                  : trip.start_date_time || trip.startDateTime)}
              </Typography>
            </Box>
          </Grid>
          {trip.estimated_duration && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                Duration: {trip.estimated_duration} hours
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Passenger Information */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Group color="action" fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>Passengers:</strong> {trip.passenger_count || 1}
            </Typography>
          </Box>
          
          {/* Passenger Names */}
          {passengerNames.length > 0 && (
            <Box sx={{ ml: 3 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Passenger Names:
              </Typography>
              {passengerNames.slice(0, 3).map((name, index) => (
                <Chip 
                  key={index}
                  label={name} 
                  size="small" 
                  variant="outlined" 
                  sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
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
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Driver Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1, fontSize: 16 }} />
            Driver Details
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Avatar 
              src={driverInfo.avatar} 
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {driverInfo.fullName !== 'Not assigned' ? driverInfo.fullName[0] : 'D'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {driverInfo.fullName}
              </Typography>
              {driverInfo.license && (
                <Typography variant="caption" color="text.secondary">
                  License: {driverInfo.license}
                </Typography>
              )}
              {driverInfo.phone && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Phone: {driverInfo.phone}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Vehicle Information */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsCar sx={{ mr: 1, fontSize: 16 }} />
            Vehicle Details
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {vehicleInfo.image ? (
              <Avatar 
                src={vehicleInfo.image} 
                variant="rounded"
                sx={{ width: 40, height: 40, mr: 2 }}
              />
            ) : (
              <Avatar 
                variant="rounded"
                sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}
              >
                <DirectionsCar />
              </Avatar>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {vehicleInfo.model}
              </Typography>
              {vehicleInfo.plateNumber && (
                <Typography variant="caption" color="text.secondary">
                  Plate: {vehicleInfo.plateNumber}
                </Typography>
              )}
              {vehicleInfo.capacity && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Capacity: {vehicleInfo.capacity} seats
                </Typography>
              )}
              {vehicleInfo.type && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Type: {vehicleInfo.type}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Distance and Budget */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {trip.distance && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Distance:</strong> {trip.distance} km
              </Typography>
            </Grid>
          )}
          {trip.budget && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Budget:</strong> {trip.budget}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Special Requirements */}
        {trip.special_requirements && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Special Requirements:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontSize: '0.8rem',
              fontStyle: 'italic',
              maxHeight: '3em',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {trip.special_requirements}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mt: 2,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => onViewDetails(trip.trip_id || trip.id)}
            sx={{ 
              borderColor: '#FDCB42',
              color: '#FDCB42',
              '&:hover': {
                backgroundColor: '#FDCB42',
                color: 'white'
              }
            }}
          >
            <Visibility fontSize="small" sx={{ mr: 0.5 }} />
            View
          </Button>
          
          {(trip.status === 'scheduled' || trip.status === 'confirmed' || trip.status === 'assigned') && (
            <Button 
              size="small" 
              variant="contained"
              onClick={() => onStart(trip.trip_id || trip.id)}
              sx={{ bgcolor: '#4CAF50' }}
            >
              <PlayArrow fontSize="small" sx={{ mr: 0.5 }} />
              Start
            </Button>
          )}
          
          {trip.status === 'in-progress' && (
            <Button 
              size="small" 
              variant="contained"
              onClick={() => onComplete(trip.trip_id || trip.id)}
              sx={{ bgcolor: '#FF9800' }}
            >
              <Stop fontSize="small" sx={{ mr: 0.5 }} />
              Complete
            </Button>
          )}
        </Box>
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(trip); handleMenuClose(); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { onViewDetails(trip.trip_id || trip.id); handleMenuClose(); }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={() => { onDelete(trip.trip_id || trip.id); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default TripCard;