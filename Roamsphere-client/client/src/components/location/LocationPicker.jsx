import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  MyLocation,
  LocationOn,
  Search,
  History,
  Home,
  Work,
  Star,
  Add,
  Edit,
  Delete,
  Navigation
} from '@mui/icons-material';

const LocationPicker = ({ onLocationSelect, initialLocation = null, type = 'pickup' }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentLocations, setRecentLocations] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  // Mock data for demonstration
  const mockRecentLocations = [
    {
      id: 1,
      name: 'Downtown Office Building',
      address: '123 Business District, City Center',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      name: 'Grand Central Terminal',
      address: '89 E 42nd St, New York, NY 10017',
      coordinates: { lat: 40.7527, lng: -73.9772 },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      name: 'JFK International Airport',
      address: 'Queens, NY 11430, USA',
      coordinates: { lat: 40.6413, lng: -73.7781 },
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const mockFavoriteLocations = [
    {
      id: 1,
      name: 'Home',
      address: '456 Residential St, Suburb, NY 10001',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      type: 'home',
      icon: <Home />
    },
    {
      id: 2,
      name: 'Office',
      address: '789 Corporate Ave, Business District',
      coordinates: { lat: 40.7614, lng: -73.9776 },
      type: 'work',
      icon: <Work />
    },
    {
      id: 3,
      name: 'Favorite Restaurant',
      address: '321 Food St, Downtown',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      type: 'favorite',
      icon: <Star />
    }
  ];

  useEffect(() => {
    // Load saved locations from localStorage
    const saved = localStorage.getItem('recentLocations');
    if (saved) {
      setRecentLocations(JSON.parse(saved));
    } else {
      setRecentLocations(mockRecentLocations);
    }

    const savedFavorites = localStorage.getItem('favoriteLocations');
    if (savedFavorites) {
      setFavoriteLocations(JSON.parse(savedFavorites));
    } else {
      setFavoriteLocations(mockFavoriteLocations);
    }

    // Check geolocation permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Mock reverse geocoding - replace with actual service
          const location = {
            coordinates: { lat: latitude, lng: longitude },
            name: 'Current Location',
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            formatted_address: 'Your current location'
          };
          
          setCurrentLocation(location);
          setSelectedLocation(location);
          
          if (onLocationSelect) {
            onLocationSelect(location);
          }
        } catch (error) {
          console.error('Error getting location details:', error);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            alert('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            alert('Location request timed out.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const searchLocations = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    try {
      // Mock search results - replace with actual geocoding service
      const mockResults = [
        {
          id: 1,
          name: `${query} - Central Station`,
          address: `123 ${query} St, City Center`,
          coordinates: { lat: 40.7589 + Math.random() * 0.01, lng: -73.9851 + Math.random() * 0.01 }
        },
        {
          id: 2,
          name: `${query} - Airport`,
          address: `${query} International Airport`,
          coordinates: { lat: 40.7589 + Math.random() * 0.01, lng: -73.9851 + Math.random() * 0.01 }
        },
        {
          id: 3,
          name: `${query} - Shopping Mall`,
          address: `456 ${query} Mall, Shopping District`,
          coordinates: { lat: 40.7589 + Math.random() * 0.01, lng: -73.9851 + Math.random() * 0.01 }
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching locations:', error);
    }
    
    setLoading(false);
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    
    // Add to recent locations
    const updatedRecent = [location, ...recentLocations.filter(loc => loc.id !== location.id)].slice(0, 5);
    setRecentLocations(updatedRecent);
    localStorage.setItem('recentLocations', JSON.stringify(updatedRecent));
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const addToFavorites = (location) => {
    const newFavorite = {
      ...location,
      type: 'favorite',
      icon: <Star />
    };
    
    const updatedFavorites = [...favoriteLocations, newFavorite];
    setFavoriteLocations(updatedFavorites);
    localStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
  };

  const removeFavorite = (locationId) => {
    const updatedFavorites = favoriteLocations.filter(loc => loc.id !== locationId);
    setFavoriteLocations(updatedFavorites);
    localStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Select {type === 'pickup' ? 'Pickup' : 'Drop-off'} Location
      </Typography>

      {/* Current Location Button */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <MyLocation />}
            onClick={getCurrentLocation}
            disabled={loading}
            sx={{
              py: 2,
              bgcolor: '#FDCB42',
              '&:hover': { bgcolor: '#fbbf24' }
            }}
          >
            {loading ? 'Getting Location...' : 'Use Current Location'}
          </Button>
          
          {locationPermission === 'denied' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Location access is denied. Please enable location services in your browser settings.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchLocations(e.target.value);
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          {searchResults.length > 0 && (
            <List sx={{ mt: 2 }}>
              {searchResults.map((location) => (
                <ListItem
                  key={location.id}
                  button
                  onClick={() => selectLocation(location)}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={location.address}
                  />
                  <IconButton onClick={(e) => {
                    e.stopPropagation();
                    addToFavorites(location);
                  }}>
                    <Add />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Favorite Locations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
                Favorite Locations
              </Typography>
              
              {favoriteLocations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No favorite locations saved
                </Typography>
              ) : (
                <List>
                  {favoriteLocations.map((location) => (
                    <ListItem
                      key={location.id}
                      button
                      onClick={() => selectLocation(location)}
                      sx={{
                        border: selectedLocation?.id === location.id ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        {location.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={location.name}
                        secondary={location.address}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(location.id);
                        }}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Locations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Locations
              </Typography>
              
              {recentLocations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recent locations
                </Typography>
              ) : (
                <List>
                  {recentLocations.map((location) => (
                    <ListItem
                      key={location.id}
                      button
                      onClick={() => selectLocation(location)}
                      sx={{
                        border: selectedLocation?.id === location.id ? '2px solid #FDCB42' : '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemIcon>
                        <LocationOn color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={location.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">{location.address}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(location.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          addToFavorites(location);
                        }}
                        size="small"
                      >
                        <Add />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Selected Location Display */}
      {selectedLocation && (
        <Card sx={{ mt: 3, border: '2px solid #FDCB42' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Selected Location
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: '#FDCB42' }} />
              <Box>
                <Typography variant="subtitle1">{selectedLocation.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLocation.address}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LocationPicker;