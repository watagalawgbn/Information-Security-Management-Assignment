import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Grid,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Alert,
  Rating,
  Paper,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Visibility,
  DirectionsCar,
  Schedule,
  LocationOn,
  Phone,
  Email,
  NavigateNext,
  DirectionsRun,
  Home,
  CalendarToday,
  Star,
  StarBorder,
  Search,
  FilterList
} from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import UserService from '../../services/UserService';

function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const itemsPerPage = 5;

  useEffect(() => {
    checkUserRoleAndFetchDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchQuery, statusFilter]);

  const checkUserRoleAndFetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Get JWT token and decode to check user role
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found. Please log in.');
        return;
      }

      const tokenData = jwtDecode(token);
      setUserRole(tokenData.role || '');

      // Check if user has permission to view drivers
      if (!['admin', 'superadmin', 'tour-operator'].includes(tokenData.role)) {
        setError('You do not have permission to view driver list.');
        return;
      }

      await fetchDrivers();
    } catch (err) {
      console.error('Error checking user role:', err);
      setError('Error checking permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      // Get all users first
      const allUsers = await UserService.getAllUsers();
      console.log('All users:', allUsers);

      if (!allUsers || !Array.isArray(allUsers)) {
        setError('No users found.');
        return;
      }

      // Filter users with role 'driver'
      const driverUsers = allUsers.filter(user => user.role_name === 'driver');
      console.log('Driver users:', driverUsers);

      if (driverUsers.length === 0) {
        setError('No drivers found in the system.');
        return;
      }

      // Fetch detailed profile for each driver
      const driversWithProfiles = await Promise.all(
        driverUsers.map(async (user) => {
          try {
            // Get driver profile details
            const driverProfile = await UserService.getDriverProfileByEmail(user.email);
            
            return {
              id: user.id,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
              email: user.email,
              image_url: driverProfile?.image_url || user.image_url || '',
              mobile: driverProfile?.mobile || 'N/A',
              license_no: driverProfile?.license_no || 'N/A',
              license_type: driverProfile?.license_type || 'N/A',
              experience_years: driverProfile?.experience_years || 0,
              address: driverProfile?.address || 'N/A',
              age: driverProfile?.age || 'N/A',
              issuing_date: driverProfile?.issuing_date ? new Date(driverProfile.issuing_date).toLocaleDateString() : 'N/A',
              expiry_date: driverProfile?.expiry_date ? new Date(driverProfile.expiry_date).toLocaleDateString() : 'N/A',
              join_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
              // Mock data for features not yet implemented
              availability: getRandomAvailability(),
              last_trip: getRandomLastTrip(),
              total_trips: Math.floor(Math.random() * 200) + 50,
              rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Random rating between 3.0-5.0
              vehicle: 'Assigned Vehicle - TBD'
            };
          } catch (profileError) {
            console.error(`Error fetching profile for ${user.email}:`, profileError);
            // Return driver with basic info if profile fetch fails
            return {
              id: user.id,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
              email: user.email,
              image_url: user.image_url || '',
              mobile: 'Profile not created',
              license_no: 'Profile not created',
              license_type: 'N/A',
              experience_years: 0,
              address: 'N/A',
              age: 'N/A',
              issuing_date: 'N/A',
              expiry_date: 'N/A',
              join_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
              availability: 'Available',
              last_trip: { destination: 'No trips yet', date: 'N/A', duration: 'N/A' },
              total_trips: 0,
              rating: 0,
              vehicle: 'Not assigned'
            };
          }
        })
      );

      setDrivers(driversWithProfiles);
      setError('');
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Error fetching drivers. Please check your permissions and try again.');
    }
  };

  // Filter drivers based on search query and status filter
  const filterDrivers = () => {
    let filtered = drivers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(driver =>
        driver.name.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.mobile.toLowerCase().includes(query) ||
        driver.license_no.toLowerCase().includes(query) ||
        driver.address.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(driver => driver.availability === statusFilter);
    }

    setFilteredDrivers(filtered);
    setCurrentPage(1); 
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

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
        <DirectionsRun sx={{ mr: 0.5 }} fontSize="inherit" />
        Driver List
      </Typography>
    </Breadcrumbs>
  );

  // Helper functions for mock data
  const getRandomAvailability = () => {
    const statuses = ['Available', 'On Trip', 'Unavailable'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomLastTrip = () => {
    const destinations = [
      'Colombo to Galle',
      'Bandarwela to Matara',
    ];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const duration = `${Math.floor(Math.random() * 6) + 2} hours`;
    
    return { destination, date, duration };
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'Available':
        return 'success';
      case 'On Trip':
        return 'warning';
      case 'Unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDriver(null);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Calculate pagination for filtered drivers
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <Box display="flex">
        <Navbar />
        <Box flexGrow={1}>
          <Header />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex">
        <Navbar />
        <Box flexGrow={1}>
          <Header />
          <Box sx={{ p: 3 }}>
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation />
            <Paper sx={{ p: 3 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button 
                variant="contained" 
                onClick={checkUserRoleAndFetchDrivers}
                sx={{ backgroundColor: '#FDCB42' }}
              >
                Retry
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
        <Box sx={{ p: 3 }}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation />
          <Paper sx={{ p: 3 }}>
            {/* Header with Search and Filters */}
            <Box sx={{ mb: 3 }}>
              {/* <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                Driver List ({filteredDrivers.length} of {drivers.length} drivers)
              </Typography> */}
              
              {/* Search and Filter Section */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={9}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, email, phone, license, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Filter by Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <FilterList />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="On Trip">On Trip</MenuItem>
                      <MenuItem value="Unavailable">Unavailable</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{
                      height: '56px',
                      borderColor: '#FDCB42',
                      color: '#FDCB42',
                      '&:hover': {
                        backgroundColor: '#FDCB42',
                        color: 'white'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid> */}
              </Grid>

              {/* Show active filters */}
              {(searchQuery || statusFilter) && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1, mt: 0.5 }}>
                    Active filters:
                  </Typography>
                  {searchQuery && (
                    <Chip
                      label={`Search: "${searchQuery}"`}
                      onDelete={() => setSearchQuery('')}
                      size="small"
                      color="primary"
                    />
                  )}
                  {statusFilter && (
                    <Chip
                      label={`Status: ${statusFilter}`}
                      onDelete={() => setStatusFilter('')}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              )}
            </Box>

            {filteredDrivers.length === 0 ? (
              <Alert severity="info">
                {drivers.length === 0 
                  ? "No drivers found in the system."
                  : "No drivers match your search criteria. Try adjusting your filters."
                }
              </Alert>
            ) : (
              <>
                {/* Driver Cards */}
                <Grid container spacing={3}>
                  {currentDrivers.map((driver) => (
                    <Grid item xs={12} key={driver.id}>
                      <Card sx={{ 
                        display: 'flex',
                        p: 2,
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease'
                        }
                      }}>
                        {/* Driver Avatar */}
                        <Avatar
                          src={driver.image_url}
                          sx={{
                            width: 80,
                            height: 80,
                            mr: 3,
                            bgcolor: '#FDCB42',
                            fontSize: '1.5rem'
                          }}
                        >
                          {!driver.image_url && getInitials(driver.name)}
                        </Avatar>

                        {/* Driver Info */}
                        <Box sx={{ flex: 1 }}>
                          <Grid container spacing={2}>
                            {/* Basic Info */}
                            <Grid item xs={12} md={4}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {driver.name}
                              </Typography>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Email size="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {driver.email}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Phone size="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {driver.mobile}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <DirectionsCar size="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    License: {driver.license_no}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>

                            {/* Trip Info */}
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Last Trip
                              </Typography>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LocationOn size="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {driver.last_trip.destination}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Schedule size="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {driver.last_trip.date} ({driver.last_trip.duration})
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Rating
                                    value={driver.rating}
                                    readOnly
                                    precision={0.1}
                                    size="small"
                                    sx={{
                                      color: '#FFD700', // Gold/Yellow color
                                      '& .MuiRating-iconFilled': {
                                        color: '#FFD700',
                                      },
                                      '& .MuiRating-iconEmpty': {
                                        color: '#E0E0E0',
                                      },
                                    }}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    ({driver.rating})
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>

                            {/* Status & Actions */}
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                <Chip
                                  label={driver.availability}
                                  color={getAvailabilityColor(driver.availability)}
                                  size="small"
                                />
                                <Typography variant="body2" color="text.secondary">
                                  Total Trips: {driver.total_trips}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Visibility />}
                                  onClick={() => handleViewDetails(driver)}
                                  sx={{
                                    borderColor: '#FDCB42',
                                    color: '#FDCB42',
                                    '&:hover': {
                                      backgroundColor: '#FDCB42',
                                      color: 'white'
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root.Mui-selected': {
                          backgroundColor: '#FDCB42',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#fbbf24'
                          }
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Driver Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#FDCB42', color: 'black' }}>
          {selectedDriver?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedDriver && (
            <Grid container spacing={3}>
              {/* Driver Photo */}
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Avatar
                  src={selectedDriver.image_url}
                  sx={{
                    width: 150,
                    height: 150,
                    margin: 'auto',
                    bgcolor: '#FDCB42',
                    fontSize: '3rem'
                  }}
                >
                  {!selectedDriver.image_url && getInitials(selectedDriver.name)}
                </Avatar>
                <Chip
                  label={selectedDriver.availability}
                  color={getAvailabilityColor(selectedDriver.availability)}
                  sx={{ mt: 2 }}
                />
                {/* Rating in Dialog */}
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Driver Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating
                      value={selectedDriver.rating}
                      readOnly
                      precision={0.1}
                      size="medium"
                      sx={{
                        color: '#FFD700',
                        '& .MuiRating-iconFilled': {
                          color: '#FFD700',
                        },
                        '& .MuiRating-iconEmpty': {
                          color: '#E0E0E0',
                        },
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                      {selectedDriver.rating}/5.0
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Driver Information */}
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{selectedDriver.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                    <Typography variant="body1">{selectedDriver.mobile}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Age:</Typography>
                    <Typography variant="body1">{selectedDriver.age}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Join Date:</Typography>
                    <Typography variant="body1">{selectedDriver.join_date}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Address:</Typography>
                    <Typography variant="body1">{selectedDriver.address}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Professional Information</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">License Number:</Typography>
                    <Typography variant="body1">{selectedDriver.license_no}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">License Type:</Typography>
                    <Typography variant="body1">{selectedDriver.license_type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">License Issued:</Typography>
                    <Typography variant="body1">{selectedDriver.issuing_date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">License Expires:</Typography>
                    <Typography variant="body1">{selectedDriver.expiry_date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Experience:</Typography>
                    <Typography variant="body1">{selectedDriver.experience_years} years</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Trips:</Typography>
                    <Typography variant="body1">{selectedDriver.total_trips}</Typography>
                  </Grid>
                </Grid>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Recent Activity</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Last Trip:</Typography>
                    <Typography variant="body1">{selectedDriver.last_trip.destination}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDriver.last_trip.date} - Duration: {selectedDriver.last_trip.duration}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                    <Typography variant="body1">{selectedDriver.vehicle}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ color: '#FDCB42' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DriverList;