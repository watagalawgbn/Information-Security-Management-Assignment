import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Button,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search,
  DirectionsCar,
  CalendarToday,
  Person,
  Phone,
  LocationOn,
  Speed,
  Palette,
  Category,
  Visibility,
  Home,
  NavigateNext,
  Hotel,
  Terrain,
  Explore,
  LocalActivity,
  DirectionsRun,
} from '@mui/icons-material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import UserService from '../../services/UserService';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const navigate = useNavigate();

  // Define vehicle categories for tabs with colors and icons
  const vehicleCategories = [
    { 
      label: 'All Categories', 
      value: 'all', 
      color: '#000000',
      icon: <Category sx={{ fontSize: 16 }} />
    },
    { 
      label: 'Luxury', 
      value: 'Luxury', 
      color: '#FDCB42',
      icon: <Hotel sx={{ fontSize: 16 }} />
    },
    { 
      label: 'Safari', 
      value: 'Safari', 
      color: '#000000',
      icon: <Terrain sx={{ fontSize: 16 }} />
    },
    { 
      label: 'Tour', 
      value: 'Tour', 
      color: '#FDCB42',
      icon: <Explore sx={{ fontSize: 16 }} />
    },
    { 
      label: 'Adventure', 
      value: 'Adventure', 
      color: '#000000',
      icon: <LocalActivity sx={{ fontSize: 16 }} />
    },
    { 
      label: 'Casual', 
      value: 'Casual', 
      color: '#FDCB42',
      icon: <DirectionsRun sx={{ fontSize: 16 }} />
    }
  ];

  // Breadcrumb Navigation Component
  const BreadcrumbNavigation = () => (
    <Breadcrumbs 
      separator={<NavigateNext fontSize="small" />} 
      sx={{ mb: 3 }}
      aria-label="breadcrumb"
    >
      <Link
        color="inherit"
        href="/dashboard"
        onClick={(e) => {
          e.preventDefault();
          navigate('/dashboard');
        }}
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        <Home sx={{ mr: 0.5 }} fontSize="inherit" />
        Dashboard
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
        <DirectionsCar sx={{ mr: 0.5 }} fontSize="inherit" />
        Vehicle Fleet
      </Typography>
    </Breadcrumbs>
  );

  // Fetch all vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filter vehicles when tab, search term, or vehicle type changes
  useEffect(() => {
    filterVehicles();
  }, [vehicles, selectedTab, searchTerm, vehicleTypeFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await UserService.getAllVehicles();
      console.log('Vehicles data:', response);
      
      setVehicles(response);
      
      // Extract unique vehicle types for the vehicle type filter
      const uniqueTypes = [...new Set(response.map(vehicle => vehicle.vehicle_type).filter(Boolean))];
      setVehicleTypes(uniqueTypes);
      
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to fetch vehicle data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    // Filter by selected tab (category)
    const selectedCategory = vehicleCategories[selectedTab];
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.category === selectedCategory.value
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle => {
        const driverName = `${vehicle.first_name || ''} ${vehicle.last_name || ''}`.toLowerCase();
        const vehicleType = vehicle.vehicle_type?.toLowerCase() || '';
        const model = vehicle.model?.toLowerCase() || '';
        const licensePlate = vehicle.license_plate?.toLowerCase() || '';
        const email = vehicle.email?.toLowerCase() || '';
        
        return (
          driverName.includes(searchTerm.toLowerCase()) ||
          vehicleType.includes(searchTerm.toLowerCase()) ||
          model.includes(searchTerm.toLowerCase()) ||
          licensePlate.includes(searchTerm.toLowerCase()) ||
          email.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Vehicle type filter
    if (vehicleTypeFilter) {
      filtered = filtered.filter(vehicle => vehicle.vehicle_type === vehicleTypeFilter);
    }

    setFilteredVehicles(filtered);
  };

  const handleAvailabilityChange = (vehicleId, newStatus) => {
  setVehicles(prev =>
    prev.map(v =>
      v.vehicle_id === vehicleId ? { ...v, availability: newStatus } : v
    )
    );
  };

  const handleUpdateAvailability = async (vehicleId, newStatus) => {
    try {
      await UserService.updateVehicleAvailability(vehicleId, newStatus);
      setError('');
      // Optionally, refetch vehicles or show a success message
    } catch (err) {
      setError('Failed to update vehicle status.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleVehicleTypeChange = (event) => {
    setVehicleTypeFilter(event.target.value);
  };

  const handleViewVehicle = (vehicleId) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (expiryDate) => {
    if (!expiryDate) return 'default';
    const expiry = new Date(expiryDate);
    const now = new Date();
    const monthsToExpiry = (expiry - now) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsToExpiry < 0) return 'error';
    if (monthsToExpiry < 3) return 'warning';
    return 'success';
  };

  const getVehicleCount = (categoryValue) => {
    if (categoryValue === 'all') return vehicles.length;
    return vehicles.filter(v => v.category === categoryValue).length;
  };

  if (loading) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading vehicles...</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh" >
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header />
        <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation />
          <Paper sx={{ p: 3 }}>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

      {/* Search and Filter Controls */}
      <Box sx={{ mb: 6, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search vehicles"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 500 }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          placeholder="Search by driver, model, license plate..."
        />
        
        <FormControl sx={{ minWidth: 500 }} size="small">
          <InputLabel>Vehicle Type</InputLabel>
          <Select
            value={vehicleTypeFilter}
            onChange={handleVehicleTypeChange}
            label="Vehicle Type"
          >
            <MenuItem value="">All Vehicle Types</MenuItem>
            {vehicleTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {(searchTerm || vehicleTypeFilter) && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', color: 'primary.main' }}
              onClick={() => {
                setSearchTerm('');
                setVehicleTypeFilter('');
              }}
            >
              Clear Filters
            </Typography>
          </Box>
        )}
      </Box>

          {/* Vehicle Category Tabs with Yellow and Black Colors */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minWidth: 120,
                  color: '#000000',
                  transition: 'all 0.3s ease',
                  borderRadius: '8px 8px 0 0',
                  margin: '0 8px',
                  fontWeight: '500',
                  '&.Mui-selected': {
                    color: '#000000',
                    backgroundColor: '#FDCB42',
                    fontWeight: 'bold',
                  },
                  '&:hover': {
                    backgroundColor: '#00000015',
                    color: '#000000',
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#FDCB42',
                    color: '#000000',
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none', // Hide default indicator since we're using background colors
                },
                '& .MuiTabs-flexContainer': {
                  gap: '16px', // Add space between tabs
                  justifyContent: 'space-evenly', // Distribute tabs evenly
                }
              }}
            >
              {vehicleCategories.map((category, index) => (
                <Tab
                  key={category.value}
                  icon={category.icon}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>{category.label}</span>
                      <Badge 
                        badgeContent={getVehicleCount(category.value)} 
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            backgroundColor: selectedTab === index ? '#000000' : '#FDCB42',
                            color: selectedTab === index ? '#FDCB42' : '#000000',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            border: selectedTab === index ? '1px solid #FDCB42' : '1px solid #000000'
                          } 
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    backgroundColor: selectedTab === index ? '#FDCB42' : 'transparent',
                    border: selectedTab === index ? 'none' : '1px solid #00000020',
                    '& .MuiSvgIcon-root': {
                      color: '#000000',
                    },
                    boxShadow: selectedTab === index ? '0 2px 8px rgba(253, 203, 66, 0.3)' : 'none',
                    minHeight: '64px',
                    padding: '12px 24px',
                  }}
                />
              ))}
            </Tabs>
          </Box>

            {/* Results Count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredVehicles.length} vehicles
            </Typography>

          {/* Vehicle Cards Grid - Horizontal Layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredVehicles.map((vehicle, index) => (
              <Card 
                key={vehicle.vehicle_id || index}
                sx={{ 
                  display: 'flex',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                  minHeight: '200px'
                }}
              >
                {/* Vehicle Image */}
                <CardMedia
                  component="img"
                  sx={{ 
                    width: 250, 
                    height: 200,
                    objectFit: 'cover', 
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  image={vehicle.image_url || '/placeholder-vehicle.jpg'}
                  alt={`${vehicle.vehicle_type} ${vehicle.model}`}
                  onClick={() => handleViewVehicle(vehicle.vehicle_id)}
                />
                
                <CardContent sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 2
                }}>
                  {/* Header Section */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
                        {vehicle.vehicle_type} {vehicle.model}
                      </Typography>
                    </Box>
                    <Chip
                      label={vehicle.availability || 'Unavailable'}
                      size="small"
                      sx={{
                        backgroundColor: vehicle.availability === 'Available' ? '#4caf50' : 
                                        vehicle.availability === 'Unavailable' ? '#c9190cff' : 
                                        vehicle.availability === 'Maintenance' ? '#ff9800' : 
                                        vehicle.availability === 'Booked' ? '#2196f3' : '#757575',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 160, ml: 2 }}>
                    <InputLabel>Availability</InputLabel>
                    <Select
                      value={vehicle.availability}
                      label="Availability"
                      onChange={e => handleAvailabilityChange(vehicle.vehicle_id, e.target.value)}
                    >
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Unavailable">Unavailable</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Booked">Booked</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ ml: 2, bgcolor: '#FDCB42', color: 'black' }}
                    onClick={() => handleUpdateAvailability(vehicle.vehicle_id, vehicle.availability)}
                  >
                    Update Status
                  </Button>
                  </Box>

                  {/* Main Content Area */}
                  <Box sx={{ display: 'flex', flex: 1, gap: 4 }}>
                    {/* Vehicle Details Column */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Vehicle Details
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <DirectionsCar sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.license_plate} • {vehicle.year}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Speed sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.seating_capacity} seats
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Palette sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.color}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Expires: {formatDate(vehicle.expiry_date)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Driver Information Column */}
                    {/* <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Driver Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          sx={{ width: 32, height: 32, mr: 1 }}
                          src={vehicle.driver_image}
                        >
                          {`${vehicle.first_name?.[0] || ''}${vehicle.last_name?.[0] || ''}`}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {`${vehicle.first_name || ''} ${vehicle.last_name || ''}`.trim() || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Driver
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Phone sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.mobile || 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.registration_province || 'N/A'}
                        </Typography>
                      </Box>
                    </Box> */}

                    {/* Action Column */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 120 }}>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<Visibility />}
                        onClick={() => handleViewVehicle(vehicle.vehicle_id)}
                        sx={{
                          borderColor: '#FDCB42',
                          color: '#FDCB42',
                          minWidth: 120,
                          '&:hover': {
                            backgroundColor: '#FDCB42',
                            color: 'white'
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

            {filteredVehicles.length === 0 && !loading && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <DirectionsCar sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No vehicles found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || vehicleTypeFilter 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'No vehicles have been registered yet.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default VehicleList;