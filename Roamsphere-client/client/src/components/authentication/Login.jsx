import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Paper, Box, CircularProgress, Divider, IconButton } from '@mui/material';
import AuthService from '../../services/AuthServices';
import MainLogo from '../../assets/MainLogo.jpg';

const Login = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });	
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignin = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(formData);
      const token = response.token;
      
      if (!token) throw new Error('Invalid token received.');
      localStorage.setItem('authToken', token);
      console.log('JWT Token:', token);

      // Decode JWT to get role
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) throw new Error('Malformed token');
        const decodedToken = JSON.parse(atob(tokenParts[1]));
        const userRole = decodedToken.role;

        // Redirect based on role
        switch (userRole) {
          case 'super-admin':
            navigate('/');
            break;
          case 'admin':
            navigate('/users');
            break;
          case 'tour-operator':
            navigate('/tour-operator-dashboard');
            break;
          case 'driver':
            navigate('/driver-dashboard');
          default:
            setError('Unauthorized role. Access denied.');
        }
      } catch (decodeError) {
        setError('Failed to decode authentication token.');
      }
    } catch (error) {
      setError(error.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" height="100vh">
      <Box
        flex={3}
        sx={{
          backgroundColor: '#000',
          backgroundImage: `url(${MainLogo})`,
          backgroundSize: '50%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />

      <Paper
        elevation={6}
        sx={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#072227', fontWeight: 'bold' }}>
          Welcome Back
        </Typography>

        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Full Name"
          name="fullName"
          type="text"
          onChange={handleChange}
          value={formData.fullName}
          placeholder="Enter your Full Name"
          sx={{ width: '80%', mt: 6 }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          type="email"
          onChange={handleChange}
          value={formData.email}
          placeholder="Enter your Email"
          sx={{ width: '80%' }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          onChange={handleChange}
          value={formData.password}
          placeholder="Enter your Password"
          sx={{ width: '80%' }}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSignin}
          sx={{
            mt: 6,
            backgroundColor: '#fbc02d',
            fontWeight: 'bold',
            width: '80%',
            color: '#fff',
            borderRadius: '10px',
            '&:hover': { backgroundColor: '#e6ac00' },
          }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Log In'}
        </Button>

        <Typography align="center" sx={{ mt: 4 }}>
          <span style={{ color: 'gray' }}>Don't have an account? </span>
          <a href="/signup" style={{ color: '#1E90FF', textDecoration: 'none' }}>
            Sign up
          </a>
        </Typography>

        <Divider sx={{ my: 3, fontWeight: 'bold' }}>OR</Divider>
      </Paper>
    </Box>
  );
};

export default Login;