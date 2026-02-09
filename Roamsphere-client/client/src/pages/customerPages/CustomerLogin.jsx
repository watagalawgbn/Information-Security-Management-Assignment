import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  Facebook
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CustomerService from '../../services/CustomerServices';
import logo from '../../assets/Logo.png'; 

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // API call to login customer
      const response = await CustomerService.loginCustomer({
        email: formData.email,
        password: formData.password
      });

      if (response.success) {
        // Store auth token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('customerData', JSON.stringify(response.data.user));
        
        // Redirect to customer dashboard
        navigate('/customer-dashboard');
      } else {
        setErrors({ submit: response.message || 'Invalid email or password' });
      }
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implement social login
  };

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
      <Paper sx={{ p: 4, maxWidth: 450, width: '100%', borderRadius: 3, boxShadow: 3 }}>
        {/* Logo and Brand Name Section */}
        <Box sx={{ textAlign: 'center', mb: 0 }}>
          {/* Logo Image */}
          <Box
            component="img"
            src={logo}
            alt="RoamSphere Logo"
            sx={{
              height: 60,
              width: 'auto',
              mb: 4,
              objectFit: 'contain'
            }}
          />
        </Box>

        {/* Welcome Message */}
        <Typography variant="h5" align="center" gutterBottom sx={{ color: '#1a1a1a', mb: 1 }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to your RoamSphere account
        </Typography>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#FDCB42' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#FDCB42' }} />
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  sx={{
                    color: '#FDCB42',
                    '&.Mui-checked': {
                      color: '#FDCB42',
                    },
                  }}
                />
              }
              label="Remember me"
            />
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate('/forgot-password')}
              sx={{ color: '#FDCB42', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              mb: 3,
              bgcolor: '#FDCB42',
              color: 'black',
              '&:hover': { bgcolor: '#fbbf24' },
              '&:disabled': { bgcolor: '#ccc' },
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Signing In...' : 'Log in'}
          </Button>
        </form>

        {/* <Divider sx={{ my: 3 }}>OR</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={() => handleSocialLogin('Google')}
          sx={{ 
            mb: 2,
            borderColor: '#FDCB42',
            color: '#1a1a1a',
            '&:hover': { 
              bgcolor: 'rgba(253, 203, 66, 0.1)',
              borderColor: '#FDCB42'
            }
          }}
        >
          Continue with Google
        </Button> */}

        {/* <Button
          fullWidth
          variant="outlined"
          startIcon={<Facebook />}
          onClick={() => handleSocialLogin('Facebook')}
          sx={{
            borderColor: '#FDCB42',
            color: '#1a1a1a',
            '&:hover': { 
              bgcolor: 'rgba(253, 203, 66, 0.1)',
              borderColor: '#FDCB42'
            }
          }}
        >
          Continue with Facebook
        </Button> */}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate('/customer-register')}
              sx={{ color: '#FDCB42', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CustomerLogin;