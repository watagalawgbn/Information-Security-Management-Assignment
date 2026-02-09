import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  Chip,
  CircularProgress,
  Fab,
  Container,
  Alert,
} from '@mui/material';
import {
  MyLocation,
  Map,
  Navigation,
  Share,
} from '@mui/icons-material';
import LeafletLocationService from '../../services/LocationService';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';

function CustomerTripTracker({ embedded = false }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  // Bandarawela and Badulla coordinates
  const origin = { lat: 6.8370, lng: 80.9999 };
  const destination = { lat: 6.9810, lng: 81.0570 };

  useEffect(() => {
    initializeMapAndRoute();
    return () => {
      LeafletLocationService.cleanup();
    };
    // eslint-disable-next-line
  }, []);

  const initializeMapAndRoute = async () => {
    try {
      setLoading(true);
      await LeafletLocationService.initializeMap(mapRef.current);

      // Add origin and destination markers
      LeafletLocationService.updateCurrentLocationMarker(origin);
      LeafletLocationService.addDestinationMarker(destination, 'Badulla');

      // Calculate and draw route
      const route = await LeafletLocationService.calculateRoute(
        origin,
        destination,
        'driving'
      );
      if (route && route.coordinates?.length > 0) {
        setRouteInfo(route);
        LeafletLocationService.drawRoute(route.coordinates);
        setSuccess('Route from Bandarawela to Badulla displayed!');
      } else {
        setError('No route found');
      }
      setMapLoaded(true);
    } catch (err) {
      setError('Failed to load map or route.');
    } finally {
      setLoading(false);
    }
  };

  const centerOnOrigin = () => {
    LeafletLocationService.updateCurrentLocationMarker(origin);
  };

  const shareRoute = async () => {
    try {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Trip Route',
          text: 'Route from Bandarawela to Badulla',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setSuccess('Route link copied to clipboard!');
      }
    } catch {
      setError('Unable to share route');
    }
  };

  const renderMapAndControls = () => (
    <>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '8px',
          }}
        />
        {loading && !mapLoaded && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.8)',
            zIndex: 1000,
          }}>
            <CircularProgress sx={{ color: '#FDCB42' }} />
          </Box>
        )}
        <Box sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}>
          <Fab
            size="small"
            sx={{
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': { bgcolor: '#fbbf24' },
            }}
            onClick={centerOnOrigin}
          >
            <MyLocation />
          </Fab>
          <Fab
            size="small"
            sx={{
              bgcolor: 'green',
              color: 'white',
              '&:hover': { bgcolor: '#45a049' },
            }}
            onClick={shareRoute}
          >
            <Share />
          </Fab>
        </Box>
      </Box>
      <Paper sx={{
        p: 3,
        borderRadius: '8px 8px 0 0',
        maxHeight: '40vh',
        overflow: 'auto',
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#FDCB42', mb: 2 }}>
              Route Information
            </Typography>
          </Grid>
          {routeInfo && (
            <>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Distance
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                    {routeInfo.distance}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#FDCB42' }}>
                    {routeInfo.duration}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip label="Ready" color="success" size="small" />
                </Card>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Fab
                variant="extended"
                color="primary"
                onClick={shareRoute}
                sx={{
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': { bgcolor: '#fbbf24' },
                }}
              >
                <Navigation sx={{ mr: 1 }} />
                Open in Maps
              </Fab>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  );

  if (embedded) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderMapAndControls()}
      </Box>
    );
  }

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      <Navbar />
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box sx={{
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 64px)',
        }}>
          <Container maxWidth="xl" sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 1,
          }}>
            <Paper sx={{ p: 2, mb: 1 }}>
              <Typography variant="h6" sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#FDCB42',
              }}>
                <Map sx={{ mr: 1 }} />
                Trip Tracker (Customer)
                <Chip
                  label="Bandarawela → Badulla"
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>
            </Paper>
            <Box sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}>
              {renderMapAndControls()}
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default CustomerTripTracker;