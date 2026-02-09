import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material';
import { Close, MyLocation, Search } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPickerMap = ({ 
  open, 
  onClose, 
  onLocationSelect, 
  title = "Select Location",
  initialLocation = null 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);

  useEffect(() => {
    if (open && mapRef.current && !mapInstance.current) {
      initializeMap();
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (selectedLocation && mapInstance.current) {
      updateMarker(selectedLocation);
    }
  }, [selectedLocation]);

  const initializeMap = () => {
    try {
      // Default center (Colombo, Sri Lanka)
      const defaultCenter = [6.9271, 79.8612];
      const center = selectedLocation ? 
        [selectedLocation.lat, selectedLocation.lng] : defaultCenter;

      mapInstance.current = L.map(mapRef.current, {
        center: center,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance.current);

      // Add click event listener
      mapInstance.current.on('click', handleMapClick);

      // Add initial marker if location provided
      if (selectedLocation) {
        updateMarker(selectedLocation);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to load map');
    }
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    try {
      setLoading(true);
      
      // Get address using reverse geocoding
      const address = await reverseGeocode(lat, lng);
      
      const location = {
        lat: lat,
        lng: lng,
        address: address
      };
      
      setSelectedLocation(location);
      setSearchQuery(address);
      setError('');
    } catch (err) {
      console.error('Error getting address:', err);
      setError('Could not get address for this location');
    } finally {
      setLoading(false);
    }
  };

  const updateMarker = (location) => {
    if (!mapInstance.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstance.current.removeLayer(markerRef.current);
    }

    // Create new marker with custom icon
    const customIcon = L.divIcon({
      className: 'custom-location-marker',
      html: `
        <div style="
          width: 25px;
          height: 35px;
          background-color: #FDCB42;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: white;
            position: absolute;
            top: 6px;
            left: 6px;
          "></div>
        </div>
      `,
      iconSize: [25, 35],
      iconAnchor: [15, 30]
    });

    markerRef.current = L.marker([location.lat, location.lng], { 
      icon: customIcon 
    }).addTo(mapInstance.current);

    // Pan to location
    mapInstance.current.setView([location.lat, location.lng], 15);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a location to search');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=lk&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
        
        setSelectedLocation(location);
        updateMarker(location);
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setGettingCurrentLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          const location = {
            lat: latitude,
            lng: longitude,
            address: address
          };
          
          setSelectedLocation(location);
          setSearchQuery(address);
          updateMarker(location);
        } catch (err) {
          setError('Could not get address for current location');
        } finally {
          setGettingCurrentLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Could not get your current location. Please enable location services.');
        setGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    } else {
      setError('Please select a location on the map');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#FDCB42',
        color: 'black'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'black' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Search Bar */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          bgcolor: '#f9f9f9'
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            alignItems: 'center',
            mb: 1
          }}>
            <TextField
              fullWidth
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={searchLocation} 
                    disabled={loading}
                    size="small"
                  >
                    {loading ? <CircularProgress size={20} /> : <Search />}
                  </IconButton>
                )
              }}
            />
            <Button
              variant="outlined"
              onClick={getCurrentLocation}
              disabled={gettingCurrentLocation}
              startIcon={gettingCurrentLocation ? <CircularProgress size={16} /> : <MyLocation />}
              sx={{
                borderColor: '#FDCB42',
                color: '#FDCB42',
                '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' },
                minWidth: 'auto',
                px: 2
              }}
            >
              {isMobile ? '' : 'Current'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            Click on the map to select a location or search above
          </Typography>
        </Box>

        {/* Map Container */}
        <Box sx={{ 
          flexGrow: 1, 
          height: isMobile ? 'calc(100vh - 200px)' : '400px',
          position: 'relative'
        }}>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%'
            }}
          />
          
          {loading && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              zIndex: 1000
            }}>
              <CircularProgress size={20} sx={{ color: '#FDCB42' }} />
              <Typography variant="body2">Getting address...</Typography>
            </Box>
          )}
        </Box>

        {/* Selected Location Info */}
        {selectedLocation && (
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'rgba(253, 203, 66, 0.1)'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Selected Location:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedLocation.address}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#ccc',
            color: '#666'
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedLocation}
          sx={{
            bgcolor: '#FDCB42',
            color: 'black',
            '&:hover': { bgcolor: '#FFD700' },
            '&:disabled': { bgcolor: '#ccc' }
          }}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPickerMap;