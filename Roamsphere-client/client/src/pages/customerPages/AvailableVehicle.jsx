import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  DirectionsCar,
  People,
  AcUnit,
  Wifi,
  LocalGasStation,
  Star,
  FilterList,
  ExpandMore,
  CheckCircle,
  AccessTime,
  LocationOn,
  Phone,
  Person,
  Sort,
  Tune
} from '@mui/icons-material';

const AvailableVehicles = ({ pickupLocation, dropoffLocation, tripDate, tripTime, passengers }) => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [0, 500],
    vehicleType: '',
    seatingCapacity: '',
    rating: 0,
    features: []
  });
  const [sortBy, setSortBy] = useState('price');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Mock vehicle data
  const mockVehicles = [
    {
      id: 1,
      name: 'Honda Civic',
      type: 'Economy',
      category: 'economy',
      image: '/api/placeholder/300/200',
      price: 85,
      priceUnit: 'per trip',
      seatingCapacity: 4,
      luggage: 2,
      rating: 4.5,
      reviewCount: 127,
      features: ['AC', 'Music System', 'GPS'],
      fuelType: 'Petrol',
      transmission: 'Automatic',
      year: 2022,
      licensePlate: 'NYC-123',
      driver: {
        name: 'John Smith',
        rating: 4.8,
        experience: '5 years',
        phone: '+1-555-0123',
        photo: '/api/placeholder/50/50',
        languages: ['English', 'Spanish']
      },
      availability: 'Available',
      estimatedArrival: '5-10 mins',
      description: 'Comfortable and fuel-efficient car perfect for city rides and short trips.',
      policies: {
        cancellation: 'Free cancellation up to 1 hour before trip',
        waiting: 'First 15 minutes free, then $5 per 15 mins',
        luggage: 'Up to 2 large bags included'
      }
    },
    {
      id: 2,
      name: 'BMW X5',
      type: 'Luxury',
      category: 'luxury',
      image: '/api/placeholder/300/200',
      price: 180,
      priceUnit: 'per trip',
      seatingCapacity: 5,
      luggage: 4,
      rating: 4.9,
      reviewCount: 89,
      features: ['AC', 'WiFi', 'Leather Seats', 'Premium Sound'],
      fuelType: 'Petrol',
      transmission: 'Automatic',
      year: 2023,
      licensePlate: 'LUX-789',
      driver: {
        name: 'Michael Johnson',
        rating: 4.9,
        experience: '8 years',
        phone: '+1-555-0456',
        photo: '/api/placeholder/50/50',
        languages: ['English', 'French']
      },
      availability: 'Available',
      estimatedArrival: '3-8 mins',
      description: 'Premium luxury vehicle with top-tier amenities for a comfortable journey.',
      policies: {
        cancellation: 'Free cancellation up to 2 hours before trip',
        waiting: 'First 20 minutes free, then $10 per 15 mins',
        luggage: 'Up to 4 large bags included'
      }
    },
    {
      id: 3,
      name: 'Mercedes Sprinter',
      type: 'Van',
      category: 'van',
      image: '/api/placeholder/300/200',
      price: 250,
      priceUnit: 'per trip',
      seatingCapacity: 12,
      luggage: 8,
      rating: 4.6,
      reviewCount: 156,
      features: ['AC', 'USB Charging', 'Spacious Interior'],
      fuelType: 'Diesel',
      transmission: 'Manual',
      year: 2021,
      licensePlate: 'VAN-456',
      driver: {
        name: 'Sarah Davis',
        rating: 4.7,
        experience: '6 years',
        phone: '+1-555-0789',
        photo: '/api/placeholder/50/50',
        languages: ['English']
      },
      availability: 'Available',
      estimatedArrival: '10-15 mins',
      description: 'Perfect for group travel with ample space for passengers and luggage.',
      policies: {
        cancellation: 'Free cancellation up to 3 hours before trip',
        waiting: 'First 30 minutes free, then $15 per 15 mins',
        luggage: 'Up to 8 large bags included'
      }
    },
    {
      id: 4,
      name: 'Tesla Model S',
      type: 'Electric Luxury',
      category: 'electric',
      image: '/api/placeholder/300/200',
      price: 200,
      priceUnit: 'per trip',
      seatingCapacity: 5,
      luggage: 3,
      rating: 4.8,
      reviewCount: 92,
      features: ['Autopilot', 'Supercharger', 'Premium Audio', 'WiFi'],
      fuelType: 'Electric',
      transmission: 'Automatic',
      year: 2023,
      licensePlate: 'ECO-321',
      driver: {
        name: 'David Wilson',
        rating: 4.9,
        experience: '4 years',
        phone: '+1-555-0987',
        photo: '/api/placeholder/50/50',
        languages: ['English', 'German']
      },
      availability: 'Available',
      estimatedArrival: '7-12 mins',
      description: 'Eco-friendly electric luxury vehicle with cutting-edge technology.',
      policies: {
        cancellation: 'Free cancellation up to 1 hour before trip',
        waiting: 'First 15 minutes free, then $8 per 15 mins',
        luggage: 'Up to 3 large bags included'
      }
    }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, sortBy]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Price filter
    filtered = filtered.filter(vehicle => 
      vehicle.price >= filters.priceRange[0] && vehicle.price <= filters.priceRange[1]
    );

    // Vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(vehicle => vehicle.category === filters.vehicleType);
    }

    // Seating capacity filter
    if (filters.seatingCapacity) {
      filtered = filtered.filter(vehicle => vehicle.seatingCapacity >= parseInt(filters.seatingCapacity));
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(vehicle => vehicle.rating >= filters.rating);
    }

    // Sort vehicles
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'capacity':
          return b.seatingCapacity - a.seatingCapacity;
        default:
          return 0;
      }
    });

    setFilteredVehicles(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 500],
      vehicleType: '',
      seatingCapacity: '',
      rating: 0,
      features: []
    });
  };

  const handleBookVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    // Handle booking logic here
    console.log('Booking vehicle:', selectedVehicle);
    setBookingDialogOpen(false);
    // Navigate to booking confirmation or payment page
  };

  const getVehicleIcon = (category) => {
    switch (category) {
      case 'economy': return '🚗';
      case 'luxury': return '🏎️';
      case 'van': return '🚐';
      case 'electric': return '⚡';
      default: return '🚗';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Finding available vehicles...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Trip Summary */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
        <Typography variant="h5" gutterBottom>
          Available Vehicles
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="body2">
                <strong>From:</strong> {pickupLocation || 'Not selected'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="body2">
                <strong>To:</strong> {dropoffLocation || 'Not selected'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">
                <strong>When:</strong> {tripDate || 'Today'} at {tripTime || 'Now'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <People sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="body2">
                <strong>Passengers:</strong> {passengers || 1}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters
              </Typography>
              <Button size="small" onClick={clearFilters}>Clear All</Button>
            </Box>

            {/* Sort By */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="price">Price (Low to High)</MenuItem>
                <MenuItem value="rating">Rating (High to Low)</MenuItem>
                <MenuItem value="capacity">Capacity (High to Low)</MenuItem>
              </Select>
            </FormControl>

            {/* Price Range */}
            <Typography variant="subtitle2" gutterBottom>
              Price Range (${filters.priceRange[0]} - ${filters.priceRange[1]})
            </Typography>
            <Slider
              value={filters.priceRange}
              onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              sx={{ mb: 3 }}
            />

            {/* Vehicle Type */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={filters.vehicleType}
                label="Vehicle Type"
                onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="economy">Economy</MenuItem>
                <MenuItem value="luxury">Luxury</MenuItem>
                <MenuItem value="van">Van</MenuItem>
                <MenuItem value="electric">Electric</MenuItem>
              </Select>
            </FormControl>

            {/* Minimum Seating */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Minimum Seating</InputLabel>
              <Select
                value={filters.seatingCapacity}
                label="Minimum Seating"
                onChange={(e) => handleFilterChange('seatingCapacity', e.target.value)}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="4">4+ Seats</MenuItem>
                <MenuItem value="7">7+ Seats</MenuItem>
                <MenuItem value="12">12+ Seats</MenuItem>
              </Select>
            </FormControl>

            {/* Minimum Rating */}
            <Typography variant="subtitle2" gutterBottom>
              Minimum Rating
            </Typography>
            <Rating
              value={filters.rating}
              onChange={(e, newValue) => handleFilterChange('rating', newValue || 0)}
              sx={{ mb: 2 }}
            />
          </Paper>
        </Grid>

        {/* Vehicle List */}
        <Grid item xs={12} md={9}>
          {filteredVehicles.length === 0 ? (
            <Alert severity="info">
              No vehicles match your criteria. Try adjusting your filters.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredVehicles.map((vehicle) => (
                <Grid item xs={12} key={vehicle.id}>
                  <Card sx={{ '&:hover': { boxShadow: 4 } }}>
                    <Grid container>
                      {/* Vehicle Image */}
                      <Grid item xs={12} md={4}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={vehicle.image}
                          alt={vehicle.name}
                          sx={{ objectFit: 'cover' }}
                        />
                      </Grid>

                      {/* Vehicle Details */}
                      <Grid item xs={12} md={5}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ mr: 1 }}>
                              {vehicle.name}
                            </Typography>
                            <Chip 
                              label={vehicle.type} 
                              size="small" 
                              color="primary"
                              icon={<span>{getVehicleIcon(vehicle.category)}</span>}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Rating value={vehicle.rating} readOnly size="small" />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {vehicle.rating} ({vehicle.reviewCount} reviews)
                            </Typography>
                          </Box>

                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <People sx={{ mr: 0.5, fontSize: 16 }} />
                                <Typography variant="body2">{vehicle.seatingCapacity} seats</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocalGasStation sx={{ mr: 0.5, fontSize: 16 }} />
                                <Typography variant="body2">{vehicle.fuelType}</Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Box sx={{ mb: 2 }}>
                            {vehicle.features.map((feature, index) => (
                              <Chip
                                key={index}
                                label={feature}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>

                          {/* Driver Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                            <Avatar src={vehicle.driver.photo} sx={{ width: 32, height: 32, mr: 1 }} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {vehicle.driver.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ⭐ {vehicle.driver.rating} • {vehicle.driver.experience}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Grid>

                      {/* Price and Book */}
                      <Grid item xs={12} md={3}>
                        <CardContent sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h4" color="primary" gutterBottom>
                            ${vehicle.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {vehicle.priceUnit}
                          </Typography>

                          <Chip
                            label={vehicle.availability}
                            color="success"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
                            ETA: {vehicle.estimatedArrival}
                          </Typography>

                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => handleBookVehicle(vehicle)}
                            sx={{
                              bgcolor: '#FDCB42',
                              '&:hover': { bgcolor: '#fbbf24' }
                            }}
                          >
                            Book Now
                          </Button>

                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            sx={{ mt: 1 }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Confirm Your Booking</DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>{selectedVehicle.name}</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedVehicle.description}
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon><People /></ListItemIcon>
                    <ListItemText primary={`${selectedVehicle.seatingCapacity} passengers`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText primary={`Driver: ${selectedVehicle.driver.name}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Phone /></ListItemIcon>
                    <ListItemText primary={selectedVehicle.driver.phone} />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h5" color="primary" gutterBottom>
                  ${selectedVehicle.price}
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Booking Policies</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Cancellation" 
                          secondary={selectedVehicle.policies.cancellation} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Waiting Time" 
                          secondary={selectedVehicle.policies.waiting} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Luggage" 
                          secondary={selectedVehicle.policies.luggage} 
                        />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmBooking} 
            variant="contained"
            sx={{ bgcolor: '#FDCB42', '&:hover': { bgcolor: '#fbbf24' } }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailableVehicles;