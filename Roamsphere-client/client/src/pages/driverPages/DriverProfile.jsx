import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fab,
  Container,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  DriveEta,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  Badge,
  PhotoCamera,
  Verified,
  Warning,
  Info,
  KeyboardArrowUp,
  CloudUpload,
  Delete,
  Explore,
  Route
} from '@mui/icons-material';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseconfig";
import { jwtDecode } from 'jwt-decode';
import Navbar from '../../components/common/Navbar';
import Header from '../../components/common/Header';
import DriverServices from '../../services/DriverServices';

function DriverProfile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [driverData, setDriverData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    license_no: '',
    issuing_date: '',
    expiry_date: '',
    license_type: '',
    experience_years: '',
    image_url: '',
    address: '',
    age: '',
    preferred_trip_types: ['Casual'], 
    availability: 'offline', 
    created_at: ''
  });

  const [originalData, setOriginalData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

 
  const licenseTypes = [
    { value: 'Class A', label: 'Motorcycle' },
    { value: 'Class B', label: 'Three Wheeler' },
    { value: 'Class C', label: 'Light Vehicle' },
    { value: 'Class D', label: 'Heavy Vehicle' },
    { value: 'Class G', label: 'Goods Vehicle' },
    { value: 'Class J', label: 'Dual Purpose' }
  ];


  const tripTypeOptions = [
    { value: 'Casual', label: 'Casual Trip' },
    { value: 'Safari', label: 'Safari Trip' },
    { value: 'Adventure', label: 'Adventure Trip' },
    { value: 'Cultural', label: 'Cultural Trip' },
    { value: 'Business', label: 'Business Trip' },
    { value: 'Airport', label: 'Airport Transfer'}
  ];


  useEffect(() => {
    initializeProfile();
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const initializeProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user email from token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found. Please log in.');
        return;
      }

      try {
        const tokenData = jwtDecode(token);
        const email = tokenData.email;
        setCurrentUserEmail(email);

        // First check if user exists in system
        await checkUserExists(email);
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
        setError('Invalid authentication token. Please log in again.');
      }
    } catch (err) {
      console.error('Error initializing profile:', err);
      setError('Error loading profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserExists = async (email) => {
    try {
      console.log('Checking if user exists with email:', email);
      
      const userData = await DriverServices.findUserByEmail(email);
      console.log('User data received:', userData);
      
      if (userData && userData.exists !== false) {
       
        setUserExists(true);
        setCurrentUserData(userData);
        
      
        setDriverData(prev => ({
          ...prev,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || email,
        }));

        // Now fetch driver profile if it exists
        await fetchDriverProfile(email, userData);
        setError(''); 
      } else {
        setUserExists(false);
        setError('User not found in system. Please register as a user first.');
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setUserExists(false);
      setError('Error checking user. Please try again.');
    }
  };

  const fetchDriverProfile = async (email, userData = null) => {
    try {
      console.log('Fetching driver profile for:', email);
      const response = await DriverServices.getDriverProfileByEmail(email);
      console.log('Driver profile response:', response);
      
      if (response && response.mobile) {
        // Driver profile exists - populate all data including trip types
        const profileData = {
          first_name: userData?.first_name || response.first_name || '',
          last_name: userData?.last_name || response.last_name || '',
          email: response.email || email,
          mobile: response.mobile || '',
          license_no: response.license_no || '',
          issuing_date: response.issuing_date ? response.issuing_date.split('T')[0] : '',
          expiry_date: response.expiry_date ? response.expiry_date.split('T')[0] : '',
          license_type: response.license_type || '',
          experience_years: response.experience_years || '',
          image_url: response.image_url || '',
          address: response.address || '',
          age: response.age || '',
          preferred_trip_types: response.preferred_trip_types || ['Casual'], 
          availability: response.availability || 'offline', 
          created_at: response.created_at || ''
        };
        
        console.log('Processed profile data:', profileData);
        
        setDriverData(profileData);
        setOriginalData(profileData);
        setPreviewUrl(response.image_url || '');
        setProfileExists(true);
        setIsEditing(false); 
        console.log('Driver profile loaded successfully');
      } else {
        throw new Error('No driver profile found');
      }
    } catch (err) {
      console.error('Driver profile not found or error:', err);
      
      // No driver profile exists - keep user data and set editing mode
      if (userData) {
        const initialData = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || email,
          mobile: '',
          license_no: '',
          issuing_date: '',
          expiry_date: '',
          license_type: '',
          experience_years: '',
          image_url: '',
          address: '',
          age: '',
          preferred_trip_types: ['Casual'], 
          availability: 'offline', 
          created_at: ''
        };
        
        setDriverData(initialData);
        setOriginalData(initialData);
      }
      
      setProfileExists(false);
      setIsEditing(true); 
      setPreviewUrl('');
      
      if (err.response?.status === 404) {
        console.log('No driver profile found - user can create one');
      } else {
        setError('Error loading driver profile. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent changing name and email (they're read-only from registration)
    if (name === 'first_name' || name === 'last_name' || name === 'email') {
      return;
    }
    
    setDriverData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // Handle trip type checkbox changes
  const handleTripTypeChange = (tripType, checked) => {
    setDriverData(prev => {
      let newTripTypes;
      if (checked) {
        // Add trip type if not already present
        newTripTypes = prev.preferred_trip_types.includes(tripType) 
          ? prev.preferred_trip_types 
          : [...prev.preferred_trip_types, tripType];
      } else {
        // Remove trip type
        newTripTypes = prev.preferred_trip_types.filter(type => type !== tripType);
        // Ensure at least one trip type is selected
        if (newTripTypes.length === 0) {
          newTripTypes = ['Casual'];
        }
      }
      
      return {
        ...prev,
        preferred_trip_types: newTripTypes
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setImageDialogOpen(false);
    }
  };

  const uploadImageToFirebase = async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `DriverProfiles/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress can be tracked here if needed
        },
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const validateForm = () => {
    if (!userExists) {
      setError("User not found. Cannot create driver profile.");
      return false;
    }

    const requiredFields = [
      'mobile', 'license_no', 'issuing_date', 'expiry_date', 
      'license_type', 'experience_years', 'address', 'age'
    ];

    for (let field of requiredFields) {
      if (!driverData[field] || driverData[field].toString().trim() === '') {
        setError(`Please fill in ${field.replace(/_/g, ' ').toLowerCase()}`);
        return false;
      }
    }

    // Email validation (though it should be pre-filled)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driverData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Mobile validation
    if (driverData.mobile.length < 10) {
      setError('Please enter a valid mobile number (at least 10 digits)');
      return false;
    }

    // Validate age
    const age = parseInt(driverData.age);
    if (age < 18 || age > 80) {
      setError('Age must be between 18 and 80 years');
      return false;
    }

    // Validate experience years
    const experience = parseInt(driverData.experience_years);
    if (experience < 0 || experience > 50) {
      setError('Experience years must be between 0 and 50');
      return false;
    }

    // Validate license expiry date
    const expiryDate = new Date(driverData.expiry_date);
    const today = new Date();
    if (expiryDate <= today) {
      setError('License expiry date must be in the future');
      return false;
    }

    // Validate issuing date is not in the future
    const issuingDate = new Date(driverData.issuing_date);
    if (issuingDate > today) {
      setError('License issuing date cannot be in the future');
      return false;
    }

    // Validate trip types
    if (!driverData.preferred_trip_types || driverData.preferred_trip_types.length === 0) {
      setError('Please select at least one preferred trip type');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let imageUrl = driverData.image_url;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToFirebase(imageFile);
        setUploading(false);
      }

      // Prepare data for backend (matching the database structure)
      const updateData = {
        email: currentUserEmail,
        mobile: driverData.mobile,
        license_no: driverData.license_no,
        issuing_date: driverData.issuing_date,
        expiry_date: driverData.expiry_date,
        license_type: driverData.license_type,
        experience_years: parseInt(driverData.experience_years),
        image_url: imageUrl,
        address: driverData.address,
        age: parseInt(driverData.age),
        preferred_trip_types: driverData.preferred_trip_types 
      };

      console.log('Submitting driver data:', updateData);

      let response;
      if (profileExists) {
        response = await DriverServices.updateDriver(updateData);
        setSuccess('Driver profile updated successfully!');
      } else {
        response = await DriverServices.addDriver(updateData);
        setSuccess('Driver profile created successfully!');
        setProfileExists(true);
      }

      console.log('Service response:', response);

      const updatedData = { 
        ...driverData, 
        image_url: imageUrl,
        preferred_trip_types: driverData.preferred_trip_types,
        created_at: response.created_at || driverData.created_at
      };
      setDriverData(updatedData);
      setOriginalData(updatedData);
      setPreviewUrl(imageUrl);
      setImageFile(null);
      setIsEditing(false);

    } catch (err) {
      console.error('Error saving driver profile:', err);
      
      // Handle the structured error response
      const errorData = err.response?.data || {};
      const errorMessage = errorData.message || "Error saving driver profile. Please try again.";
      
      if (err.response?.status === 404) {
        setError("User not found. Please register as a user first.");
      } else if (err.response?.status === 409) {
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (profileExists && originalData) {
      // Restore original data for existing profile
      setDriverData(originalData);
      setPreviewUrl(originalData.image_url || '');
      setIsEditing(false);
    } else {
      // Reset form for new driver profile but keep user data
      if (currentUserData) {
        const resetData = {
          first_name: currentUserData.first_name || '',
          last_name: currentUserData.last_name || '',
          email: currentUserData.email || currentUserEmail,
          mobile: '',
          license_no: '',
          issuing_date: '',
          expiry_date: '',
          license_type: '',
          experience_years: '',
          image_url: '',
          address: '',
          age: '',
          preferred_trip_types: ['Casual'],
          availability: 'offline',
          created_at: ''
        };
        setDriverData(resetData);
      }
      setPreviewUrl('');
    }
    
    setImageFile(null);
    setError('');
    setSuccess('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  // ... (keep all the license validation functions unchanged)
  const isLicenseExpiringSoon = () => {
    if (!driverData.expiry_date) return false;
    const expiryDate = new Date(driverData.expiry_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiryDate <= thirtyDaysFromNow;
  };

  const isLicenseExpired = () => {
    if (!driverData.expiry_date) return false;
    const expiryDate = new Date(driverData.expiry_date);
    const today = new Date();
    return expiryDate <= today;
  };

  const getLicenseStatusColor = () => {
    if (isLicenseExpired()) return 'error';
    if (isLicenseExpiringSoon()) return 'warning';
    return 'success';
  };

  const getLicenseStatusText = () => {
    if (isLicenseExpired()) return 'Expired';
    if (isLicenseExpiringSoon()) return 'Expiring Soon';
    return 'Valid';
  };

  const getFullName = () => {
    return `${driverData.first_name} ${driverData.last_name}`.trim();
  };


  if (loading) {
    return (
      <Box display="flex" sx={{ minHeight: '100vh' }}>
        {!isMobile && <Navbar />}
        <Box flexGrow={1}>
          {!isMobile && <Header />}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress sx={{ color: '#FDCB42' }} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Show error if user not found
  if (!userExists && error) {
    return (
      <Box display="flex" sx={{ minHeight: '100vh' }}>
        {!isMobile && <Navbar />}
        <Box flexGrow={1}>
          {!isMobile && <Header />}
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Alert severity="error">
                {error}
              </Alert>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/login'}
                  sx={{ backgroundColor: '#FDCB42', mr: 2 }}
                >
                  Go to Login
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.href = '/register'}
                  sx={{ borderColor: '#FDCB42', color: '#FDCB42' }}
                >
                  Register as User
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" sx={{ minHeight: '100vh' }}>
      {!isMobile && <Navbar />}
      <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {!isMobile && <Header />}
        
        {/* Main Content with Scroll Container */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 64px)',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#FDCB42',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#fbbf24',
            },
          },
        }}>
          <Container 
            maxWidth="xl" 
            sx={{ 
              p: isMobile ? 1 : 3,
              pb: isMobile ? 10 : 3 
            }}
          >
            {/* Header Section */}
            <Box sx={{ 
              mb: isMobile ? 2 : 3, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: isMobile ? 1 : 0
                }}
              >
                <Person sx={{ mr: isMobile ? 1 : 2, color: '#FDCB42' }} />
                {isMobile ? 'Profile' : (profileExists ? 'Driver Profile' : 'Create Driver Profile')}
              </Typography>
              
              {profileExists && !isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    borderColor: '#FDCB42',
                    color: '#FDCB42',
                    '&:hover': {
                      backgroundColor: '#FDCB42',
                      color: 'white'
                    }
                  }}
                >
                  {isMobile ? 'Edit' : 'Edit Profile'}
                </Button>
              )}
            </Box>

            {/* Status Messages */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }} 
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }} 
                onClose={() => setSuccess('')}
              >
                {success}
              </Alert>
            )}

            {!profileExists && !error && userExists && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {isMobile 
                  ? 'Create your driver profile to access driver features.' 
                  : 'No driver profile found. Please fill in your driver details to access driver features.'
                }
              </Alert>
            )}

            {profileExists && !isEditing && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Driver profile is active. You can edit your information anytime.
              </Alert>
            )}

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Profile Image and Basic Info */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: isMobile ? 2 : 3, 
                  textAlign: 'center', 
                  height: 'fit-content',
                  position: isMobile ? 'relative' : 'sticky',
                  top: isMobile ? 'auto' : 20
                }}>
                  {/* Image Upload Section */}
                  <Box sx={{ 
                    position: 'relative', 
                    display: 'inline-block', 
                    mb: 2,
                    border: !previewUrl && isEditing ? '2px dashed #ccc' : 'none',
                    borderRadius: '50%',
                    padding: !previewUrl && isEditing ? 2 : 0
                  }}>
                    {previewUrl ? (
                      <Avatar
                        src={previewUrl}
                        sx={{
                          width: isMobile ? 120 : 150,
                          height: isMobile ? 120 : 150,
                          mx: 'auto',
                          border: '4px solid #FDCB42'
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: isMobile ? 120 : 150,
                          height: isMobile ? 120 : 150,
                          mx: 'auto',
                          border: '4px solid #FDCB42',
                          bgcolor: '#FDCB42',
                          fontSize: isMobile ? '2rem' : '3rem'
                        }}
                      >
                        {driverData.first_name?.charAt(0)}{driverData.last_name?.charAt(0)}
                      </Avatar>
                    )}
                    
                    {isEditing && (
                      <Box sx={{ mt: 1 }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                          id="profile-image-upload"
                        />
                        <label htmlFor="profile-image-upload">
                          <IconButton
                            component="span"
                            sx={{
                              backgroundColor: '#FDCB42',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: '#fbbf24'
                              },
                              width: isMobile ? 35 : 40,
                              height: isMobile ? 35 : 40
                            }}
                          >
                            <PhotoCamera sx={{ fontSize: isMobile ? 18 : 20 }} />
                          </IconButton>
                        </label>
                        {previewUrl && (
                          <IconButton
                            onClick={() => {
                              setImageFile(null);
                              setPreviewUrl(profileExists ? originalData.image_url || '' : '');
                            }}
                            sx={{
                              backgroundColor: 'red',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'darkred'
                              },
                              width: isMobile ? 35 : 40,
                              height: isMobile ? 35 : 40,
                              ml: 1
                            }}
                          >
                            <Delete sx={{ fontSize: isMobile ? 18 : 20 }} />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>

                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  >
                    {getFullName() || 'Driver Name'}
                  </Typography>
                  
                  <Typography 
                    variant={isMobile ? "caption" : "body2"} 
                    color="text.secondary" 
                    sx={{ mb: 2, wordBreak: 'break-all' }}
                  >
                    {driverData.email}
                  </Typography>

                  {profileExists && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        icon={<Badge />}
                        label={`License: ${driverData.license_type}`}
                        color={getLicenseStatusColor()}
                        sx={{ mb: 1 }}
                        size={isMobile ? "small" : "medium"}
                      />
                      
                      <Chip
                        icon={<Verified />}
                        label={getLicenseStatusText()}
                        color={getLicenseStatusColor()}
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                      />

                      {/* Display Trip Types */}
                      <Box sx={{ mt: 1 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'block', mb: 1 }}
                        >
                          Preferred Trip Types:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {driverData.preferred_trip_types.map((tripType) => (
                            <Chip
                              key={tripType}
                              icon={<Route />}
                              label={tripType}
                              size="small"
                              sx={{ 
                                bgcolor: '#FDCB42', 
                                color: 'black',
                                fontSize: '0.7rem'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ mt: 2 }}
                      >
                        Driver since: {driverData.created_at ? new Date(driverData.created_at).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  )}

                  {imageFile && (
                    <Typography variant="body2" sx={{ mt: 1, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                      Selected: {imageFile.name}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Profile Details */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    sx={{ 
                      mb: isMobile ? 2 : 3, 
                      display: 'flex', 
                      alignItems: 'center' 
                    }}
                  >
                    <DriveEta sx={{ mr: 1, color: '#FDCB42' }} />
                    Driver Information
                  </Typography>

                  <Grid container spacing={isMobile ? 2 : 3}>
                    {/* Personal Information */}
                    <Grid item xs={12}>
                      <Typography 
                        variant={isMobile ? "body2" : "subtitle1"} 
                        sx={{ 
                          fontWeight: 'bold', 
                          mb: 2, 
                          color: '#FDCB42' 
                        }}
                      >
                        Personal Information
                      </Typography>
                    </Grid>

                    {/* Read-only Name and Email fields */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="first_name"
                        value={driverData.first_name}
                        disabled
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: true
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: '#f5f5f5'
                          },
                        }}
                        helperText="From your user registration"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="last_name"
                        value={driverData.last_name}
                        disabled
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: true
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: '#f5f5f5'
                          },
                        }}
                        helperText="From your user registration"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={driverData.email}
                        disabled
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: true
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: '#f5f5f5'
                          },
                        }}
                        helperText="From your user registration"
                      />
                    </Grid>

                    {/* Editable fields */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Mobile Number *"
                        name="mobile"
                        value={driverData.mobile}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Age *"
                        name="age"
                        type="number"
                        value={driverData.age}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                        inputProps={{ min: 18, max: 80 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address *"
                        name="address"
                        multiline
                        rows={isMobile ? 2 : 3}
                        value={driverData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                      />
                    </Grid>

                    {/* License Information */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography 
                        variant={isMobile ? "body2" : "subtitle1"} 
                        sx={{ 
                          fontWeight: 'bold', 
                          mb: 2, 
                          color: '#FDCB42' 
                        }}
                      >
                        License Information
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Number *"
                        name="license_no"
                        value={driverData.license_no}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!isEditing} size={isMobile ? "small" : "medium"}>
                        <InputLabel>License Type *</InputLabel>
                        <Select
                          name="license_type"
                          value={driverData.license_type}
                          onChange={handleInputChange}
                          label="License Type *"
                          required
                          sx={{
                            '& .MuiInputBase-input': {
                              backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                            },
                          }}
                        >
                          {licenseTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Issuing Date *"
                        name="issuing_date"
                        type="date"
                        value={driverData.issuing_date}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                        inputProps={{ max: new Date().toISOString().split('T')[0] }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Expiry Date *"
                        name="expiry_date"
                        type="date"
                        value={driverData.expiry_date}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday sx={{ fontSize: isMobile ? 18 : 20 }} />
                            </InputAdornment>
                          ),
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                        error={isLicenseExpired() || isLicenseExpiringSoon()}
                        helperText={
                          isLicenseExpired() ? 'License has expired' :
                          isLicenseExpiringSoon() ? 'License expires soon' : ''
                        }
                        inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Years of Experience *"
                        name="experience_years"
                        type="number"
                        value={driverData.experience_years}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          readOnly: !isEditing
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                          },
                        }}
                        inputProps={{ min: 0, max: 50 }}
                      />
                    </Grid>

                    {/* Trip Preferences Section */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography 
                        variant={isMobile ? "body2" : "subtitle1"} 
                        sx={{ 
                          fontWeight: 'bold', 
                          mb: 2, 
                          color: '#FDCB42',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Explore sx={{ mr: 1, fontSize: isMobile ? 18 : 20 }} />
                        Trip Preferences
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl component="fieldset" disabled={!isEditing}>
                        <FormLabel 
                          component="legend" 
                          sx={{ 
                            color: '#FDCB42', 
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.875rem' : '1rem'
                          }}
                        >
                          Preferred Trip Types * (Select at least one)
                        </FormLabel>
                        <FormGroup sx={{ mt: 1 }}>
                          <Grid container spacing={1}>
                            {tripTypeOptions.map((option) => (
                              <Grid item xs={12} sm={6} md={4} key={option.value}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={driverData.preferred_trip_types.includes(option.value)}
                                      onChange={(e) => handleTripTypeChange(option.value, e.target.checked)}
                                      sx={{
                                        color: '#FDCB42',
                                        '&.Mui-checked': {
                                          color: '#FDCB42',
                                        },
                                      }}
                                      size={isMobile ? "small" : "medium"}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <span style={{ marginRight: 8, fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                        {option.icon}
                                      </span>
                                      <Typography 
                                        variant={isMobile ? "body2" : "body1"}
                                        sx={{ color: !isEditing ? '#999' : 'inherit' }}
                                      >
                                        {option.label}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{
                                    width: '100%',
                                    margin: 0,
                                    padding: 1,
                                    border: driverData.preferred_trip_types.includes(option.value) 
                                      ? '2px solid #FDCB42' 
                                      : '2px solid transparent',
                                    borderRadius: 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: isEditing ? 'rgba(253, 203, 66, 0.1)' : 'inherit'
                                    }
                                  }}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </FormGroup>
                      </FormControl>
                    </Grid>

                    {/* Action Buttons */}
                    {isEditing && (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          gap: isMobile ? 1 : 2, 
                          mt: 3,
                          flexDirection: isMobile ? 'column' : 'row'
                        }}>
                          <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                            disabled={saving || uploading}
                            fullWidth={isMobile}
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              borderColor: 'gray',
                              color: 'gray',
                              '&:hover': {
                                backgroundColor: 'gray',
                                color: 'white'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          
                          <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving || uploading || !userExists}
                            fullWidth={isMobile}
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              backgroundColor: '#FDCB42',
                              color: 'black',
                              '&:hover': {
                                backgroundColor: '#fbbf24'
                              },
                              px: isMobile ? 2 : 4
                            }}
                          >
                            {uploading ? 'Uploading Image...' : saving ? 'Saving...' : profileExists ? 'Update Profile' : 'Create Profile'}
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Scroll to Top Button */}
            {showScrollTop && (
              <Fab
                size={isMobile ? "medium" : "large"}
                sx={{
                  position: 'fixed',
                  bottom: isMobile ? 80 : 20,
                  right: 20,
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': {
                    bgcolor: '#fbbf24'
                  },
                  zIndex: 1000
                }}
                onClick={scrollToTop}
              >
                <KeyboardArrowUp />
              </Fab>
            )}

            {/* Mobile Edit FAB */}
            {isMobile && profileExists && !isEditing && (
              <Fab
                color="primary"
                sx={{
                  position: 'fixed',
                  bottom: 16,
                  right: 16,
                  bgcolor: '#FDCB42',
                  color: 'black',
                  '&:hover': {
                    bgcolor: '#fbbf24'
                  },
                  zIndex: 999
                }}
                onClick={handleEdit}
              >
                <Edit />
              </Fab>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default DriverProfile;