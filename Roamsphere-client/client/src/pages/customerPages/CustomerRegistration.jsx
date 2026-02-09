import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Link,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CustomerService from '../../services/CustomerServices';
import logo from '../../assets/Logo.png'; // Updated to use Logo.png

const CustomerRegistration = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Account Info
    password: '',
    confirmPassword: '',
    
    // Preferences
    preferredLanguage: 'en',
    marketingEmails: false,
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = ['Personal Information', 'Account Setup', 'Preferences'];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) newErrors.phone = 'Phone number is invalid';
        break;
        
      case 1: // Account Setup
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2: // Preferences
        if (!formData.termsAccepted) {
          newErrors.termsAccepted = 'You must accept the terms and conditions';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      setLoading(true);
      
      // API call to register customer
      const response = await CustomerService.registerCustomer({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        preferredLanguage: formData.preferredLanguage,
        marketingEmails: formData.marketingEmails
      });

      if (response.success) {
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        setSuccess(true);
        
        // Redirect after success
        setTimeout(() => {
          navigate('/customer-login');
        }, 2000);
      } else {
        setErrors({ submit: response.message || 'Registration failed' });
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+1 (555) 123-4567"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password || 'Minimum 8 characters'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.marketingEmails}
                    onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
                  />
                }
                label="I would like to receive marketing emails and promotional offers"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  />
                }
                label={
                  <span>
                    I agree to the{' '}
                    <Link href="#" color="primary">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" color="primary">
                      Privacy Policy
                    </Link>
                  </span>
                }
              />
              {errors.termsAccepted && (
                <Typography variant="caption" color="error" display="block">
                  {errors.termsAccepted}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400, borderRadius: 3, boxShadow: 3 }}>
          {/* Logo in Success Page */}
          <Box
            component="img"
            src={logo}
            alt="RoamSphere Logo"
            sx={{
              height: 60,
              width: 'auto',
              mb: 2,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              objectFit: 'contain'
            }}
          />
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: '#FDCB42', width: 80, height: 80 }}>
            <CheckCircle sx={{ fontSize: 50, color: 'white' }} />
          </Avatar>
          <Typography variant="h4" gutterBottom sx={{ color: '#1a1a1a' }}>
            Welcome Aboard!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your account has been created successfully. You can now start booking trips with us.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to login page...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 2
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, width: '100%', borderRadius: 3, boxShadow: 3 }}>
        {/* Logo and Brand Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {/* Logo Image */}
          <Box
            component="img"
            src={logo}
            alt="RoamSphere Logo"
            sx={{
              height: 60,
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Box>

        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1a1a1a' }}>
          Create Your Account
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Join RoamSphere for seamless travel experiences
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepIcon-root': {
                    color: 'rgba(253, 203, 66, 0.3)',
                    '&.Mui-active': {
                      color: '#FDCB42'
                    },
                    '&.Mui-completed': {
                      color: '#FDCB42'
                    }
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
            sx={{
              borderColor: '#FDCB42',
              color: '#1a1a1a',
              '&:hover': { bgcolor: 'rgba(253, 203, 66, 0.1)' },
              '&:disabled': { borderColor: '#ccc', color: '#ccc' }
            }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              sx={{ 
                bgcolor: '#FDCB42', 
                color: 'black',
                '&:hover': { bgcolor: '#fbbf24' },
                '&:disabled': { bgcolor: '#ccc' }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              sx={{ 
                bgcolor: '#FDCB42', 
                color: 'black',
                '&:hover': { bgcolor: '#fbbf24' }
              }}
            >
              Next
            </Button>
          )}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/customer-login')}
              sx={{ color: '#FDCB42', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CustomerRegistration;