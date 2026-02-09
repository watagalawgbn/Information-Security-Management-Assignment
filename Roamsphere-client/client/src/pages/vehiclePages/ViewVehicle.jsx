import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  DirectionsCar,
  Speed,
  Palette,
  CalendarToday,
  LocationOn,
  Person,
  Phone,
  Description,
  Build,
  Warning,
  History,
  LocalGasStation,
  Assessment,
  Edit,
  Add,
  NavigateNext,
  Home,
} from '@mui/icons-material';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import UserService from '../../services/UserService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function ViewVehicle() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Mock data for demonstration - replace with actual API calls
  const [maintenanceRecords] = useState([
    {
      id: 1,
      date: '2024-01-15',
      type: 'Oil Change',
      provider: 'AutoCare Service Center',
      cost: 5000,
      nextDue: '2024-04-15'
    },
    {
      id: 2,
      date: '2024-02-20',
      type: 'Tire Replacement',
      provider: 'Tire Pro',
      cost: 25000,
      nextDue: '2025-02-20'
    }
  ]);

  const [serviceHistory] = useState([
    {
      id: 1,
      date: '2024-01-10',
      service: 'Regular Maintenance',
      mileage: 45000,
      cost: 8000,
      provider: 'AutoCare Service Center'
    },
    {
      id: 2,
      date: '2023-12-05',
      service: 'Brake Service',
      mileage: 44500,
      cost: 12000,
      provider: 'Brake Specialists'
    }
  ]);

  const [issues] = useState([
    {
      id: 1,
      date: '2024-01-25',
      issue: 'Air conditioning not cooling properly',
      status: 'Resolved',
      notes: 'Refrigerant refilled and system checked'
    },
    {
      id: 2,
      date: '2024-02-10',
      issue: 'Minor scratches on rear bumper',
      status: 'Pending',
      notes: 'Cosmetic damage, scheduled for repair next week'
    }
  ]);

  const [fuelEfficiency] = useState({
    averageKmPerLiter: 12.5,
    lastMonthUsage: 180,
    totalFuelCost: 45000,
    lastRefill: '2024-02-28'
  });

  useEffect(() => {
    fetchVehicleDetails();
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For now, fetch from the general vehicles list and find by ID
      const allVehicles = await UserService.getAllVehicles();
      const vehicleData = allVehicles.find(v => v.vehicle_id === vehicleId);
      
      if (!vehicleData) {
        setError('Vehicle not found');
        return;
      }

      setVehicle(vehicleData);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError('Failed to fetch vehicle details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const getVehicleStatus = () => {
    // Mock status logic - replace with actual status from backend
    const statuses = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'On Trip': return 'primary';
      case 'Under Maintenance': return 'warning';
      case 'Out of Service': return 'error';
      default: return 'default';
    }
  };

  // Breadcrumb component
  const BreadcrumbNavigation = () => {
    if (!vehicle) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: '#FDCB42',
            },
          }}
        >
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: '#FDCB42' }
            }}
          >
            <Home sx={{ mr: 0.5, fontSize: 16 }} />
            Dashboard
          </Link>
          
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/vehiclelist');
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              '&:hover': { color: '#FDCB42' }
            }}
          >
            <DirectionsCar sx={{ mr: 0.5, fontSize: 16 }} />
            Vehicle List
          </Link>
          
          <Typography 
            color="text.primary" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 'bold',
              color: '#FDCB42'
            }}
          >
            <Speed sx={{ mr: 0.5, fontSize: 16 }} />
            {vehicle.vehicle_type} {vehicle.model}
          </Typography>
        </Breadcrumbs>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading vehicle details...</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || 'Vehicle not found'}
            </Alert>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/vehiclelist')}
              sx={{ backgroundColor: '#FDCB42' }}
            >
              Back to Vehicle List
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const vehicleStatus = getVehicleStatus();

  return (
    <Box display="flex" height="100vh">
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header />
        <Box sx={{ p: 2, overflow: 'auto', flexGrow: 1 }}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation />

          {/* Vehicle Header - Compact */}
          <Paper sx={{ p: 2, mb: 0 }}>
            <Grid container spacing={2}>
              {/* Vehicle Image - Smaller */}
              <Grid item xs={12} md={3}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={vehicle.image_url || '/placeholder-vehicle.jpg'}
                    alt={`${vehicle.vehicle_type} ${vehicle.model}`}
                    sx={{ objectFit: 'cover' }}
                  />
                </Card>
              </Grid>

              {/* Vehicle Info - More compact */}
            {/* Vehicle Info - More compact */}
            <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                <Typography variant="h5" gutterBottom>
                    {vehicle.vehicle_type} {vehicle.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    License Plate: {vehicle.license_plate} • Year: {vehicle.year}
                </Typography>
                </Box>
                <Chip
                label={vehicleStatus}
                color={getStatusChipColor(vehicleStatus)}
                size="medium"
                />
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={3}>
                <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #FDCB42 0%, #FFE082 100%)',
                    color: 'white',
                    boxShadow: '0 4px 8px rgba(253, 203, 66, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(253, 203, 66, 0.4)',
                    }
                }}>
                    <Speed sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">{vehicle.seating_capacity}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Seats</Typography>
                </Box>
                </Grid>
                <Grid item xs={3}>
                <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #42A5F5 0%, #90CAF9 100%)',
                    color: 'white',
                    boxShadow: '0 4px 8px rgba(66, 165, 245, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(66, 165, 245, 0.4)',
                    }
                }}>
                    <DirectionsCar sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">{vehicle.year}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Year</Typography>
                </Box>
                </Grid>
                <Grid item xs={3}>
                <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #66BB6A 0%, #A5D6A7 100%)',
                    color: 'white',
                    boxShadow: '0 4px 8px rgba(102, 187, 106, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(102, 187, 106, 0.4)',
                    }
                }}>
                    <Palette sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">{vehicle.color}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Color</Typography>
                </Box>
                </Grid>
                <Grid item xs={3}>
                <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    borderRadius: 2,
                    background: getStatusColor(vehicle.expiry_date) === 'error' 
                    ? 'linear-gradient(135deg, #EF5350 0%, #FFAB91 100%)'
                    : getStatusColor(vehicle.expiry_date) === 'warning'
                    ? 'linear-gradient(135deg, #FF9800 0%, #FFCC02 100%)'
                    : 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                    color: 'white',
                    boxShadow: getStatusColor(vehicle.expiry_date) === 'error' 
                    ? '0 4px 8px rgba(239, 83, 80, 0.3)'
                    : getStatusColor(vehicle.expiry_date) === 'warning'
                    ? '0 4px 8px rgba(255, 152, 0, 0.3)'
                    : '0 4px 8px rgba(76, 175, 80, 0.3)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: getStatusColor(vehicle.expiry_date) === 'error' 
                        ? '0 6px 12px rgba(239, 83, 80, 0.4)'
                        : getStatusColor(vehicle.expiry_date) === 'warning'
                        ? '0 6px 12px rgba(255, 152, 0, 0.4)'
                        : '0 6px 12px rgba(76, 175, 80, 0.4)',
                    }
                }}>
                    <CalendarToday sx={{ fontSize: 24, mb: 1 }} />
                    <Chip
                    label={
                        getStatusColor(vehicle.expiry_date) === 'error' ? 'Expired' :
                        getStatusColor(vehicle.expiry_date) === 'warning' ? 'Expiring' :
                        'Valid'
                    }
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold',
                        mb: 0.5
                    }}
                    />
                    <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Registration</Typography>
                </Box>
                </Grid>
            </Grid>
            </Grid>
            </Grid>
          

          {/* Tabs Section - Compact */}
   
            <Box sx={{ borderTop: 19, borderColor: 'white' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="vehicle details tabs"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ px: 2,
                    '& .MuiTab-root': {
                    mx: 6, 
                    minWidth: 120, 
                    color: 'text.secondary',
                    '&.Mui-selected': {
                        color: '#FDCB42',
                    },
                    '&:hover': {
                        color: '#FDCB42',
                    }
                    },
                    '& .MuiTabs-indicator': {
                    backgroundColor: '#ffe91fff',
                    }
                }}
              >
                <Tab icon={<Description sx={{ fontSize: 16 }} />} label="Details" sx={{ minHeight: 56 }} />
                <Tab icon={<Description sx={{ fontSize: 16 }} />} label="Documents" sx={{ minHeight: 56 }} />
                <Tab icon={<Build sx={{ fontSize: 16 }} />} label="Maintenance" sx={{ minHeight: 56 }} />
                <Tab icon={<Warning sx={{ fontSize: 16 }} />} label="Issues" sx={{ minHeight: 56 }} />
                <Tab icon={<History sx={{ fontSize: 16 }} />} label="Service History" sx={{ minHeight: 56 }} />
              </Tabs>
            </Box>

            {/* Details Tab */}
            <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">Vehicle Information</Typography>
                <List dense>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Vehicle Type:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.vehicle_type}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Model:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.model}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Year:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.year}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Color:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.color}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Seating Capacity:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.seating_capacity} passengers
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Category:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.category}
                        </Box>
                    </Typography>
                    </ListItem>
                </List>
                </Grid>
                <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">Registration Details</Typography>
                <List dense>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        License Plate:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.license_plate}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Chassis Number:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.chassis_no}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Registration Province:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.registration_province}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Registration Date:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {formatDate(vehicle.registration_date)}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Expiry Date:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {formatDate(vehicle.expiry_date)}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Ownership:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.ownership}
                        </Box>
                    </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.5, px: 5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', width: '100%' }}>
                        <Box component="span" sx={{ fontWeight: 'bold', minWidth: '140px', mr: 1 }}>
                        Insurance:
                        </Box>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                        {vehicle.insurance}
                        </Box>
                    </Typography>
                    </ListItem>
                </List>
                </Grid>
            </Grid>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">License & Registration</Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Registration Certificate" 
                        secondary={`Valid until ${formatDate(vehicle.expiry_date)}`}
                      />
                      <Button size="small" variant="outlined">View</Button>
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Insurance Certificate" 
                        secondary={vehicle.insurance}
                      />
                      <Button size="small" variant="outlined">View</Button>
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Vehicle Permit" 
                        secondary="Tourism Board Permit"
                      />
                      <Button size="small" variant="outlined">View</Button>
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">Fuel Efficiency</Typography>
                  <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderRadius: 1, mb: 1 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <LocalGasStation sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                          <Typography variant="subtitle1">{fuelEfficiency.averageKmPerLiter} km/L</Typography>
                          <Typography variant="caption" color="text.secondary">Average Efficiency</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Assessment sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
                          <Typography variant="subtitle1">{fuelEfficiency.lastMonthUsage}L</Typography>
                          <Typography variant="caption" color="text.secondary">Last Month Usage</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Total Fuel Cost (This Year)" 
                        secondary={`Rs. ${fuelEfficiency.totalFuelCost.toLocaleString()}`}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary="Last Refill" 
                        secondary={formatDate(fuelEfficiency.lastRefill)}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Maintenance Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Maintenance Records</Typography>
                <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} sx={{ backgroundColor: '#FDCB42' }} size="small">
                  Add Maintenance
                </Button>
              </Box>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Maintenance Type</TableCell>
                      <TableCell>Service Provider</TableCell>
                      <TableCell>Cost (Rs.)</TableCell>
                      <TableCell>Next Due</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>{record.provider}</TableCell>
                        <TableCell>{record.cost.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(record.nextDue)}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <Edit sx={{ fontSize: 14 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Issues Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Vehicle Issues & Notes</Typography>
                <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} sx={{ backgroundColor: '#FDCB42' }} size="small">
                  Report Issue
                </Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {issues.map((issue) => (
                  <Card key={issue.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2">{issue.issue}</Typography>
                        <Chip 
                          label={issue.status} 
                          color={issue.status === 'Resolved' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Reported on {formatDate(issue.date)}
                      </Typography>
                      <Typography variant="body2">
                        {issue.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </TabPanel>

            {/* Service History Tab */}
            <TabPanel value={tabValue} index={4}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">Service History</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Mileage</TableCell>
                      <TableCell>Cost (Rs.)</TableCell>
                      <TableCell>Service Provider</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceHistory.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{formatDate(service.date)}</TableCell>
                        <TableCell>{service.service}</TableCell>
                        <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                        <TableCell>{service.cost.toLocaleString()}</TableCell>
                        <TableCell>{service.provider}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

export default ViewVehicle;