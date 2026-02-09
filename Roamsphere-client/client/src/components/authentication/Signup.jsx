import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Paper, Box, CircularProgress, Divider, IconButton, InputAdornment } from '@mui/material';
import MainLogo from '../../assets/MainLogo.jpg';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AuthService from '../../services/AuthServices';

const Signup = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    if (!formData.fullName || !formData.email || !formData.password ) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await AuthService.signup(formData);
      navigate(`/verifyotp?email=${formData.email}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Left Side - Image */}
      <Box
        flex={3}
        sx={{
          backgroundColor: '#000000',
          backgroundImage: `url(${MainLogo})`,
          backgroundSize: '50%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      />

      {/* Right Side - Form */}
      <Paper 
        elevation={6} 
        sx={{ 
          flex: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 4 
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#072227', fontWeight: 'bold' }}>
          Welcome
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
          onChange={handleChange} 
          placeholder="John Doe" 
          sx={{ width: '80%' }}
        />
        
        <TextField 
          fullWidth 
          margin="normal" 
          label="Email" 
          name="email" 
          type="email" 
          onChange={handleChange} 
          placeholder="Enter your Email here"
          sx={{ width: '80%' }} 
        />
        
        <TextField 
          fullWidth 
          margin="normal" 
          label="Password" 
          name="password" 
          type={showPassword ? 'text' : 'password'} 
          onChange={handleChange} 
          placeholder="Enter your Password" 
          sx={{ width: '80%' }}
          InputProps={{
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

        <Button 
          variant="contained" 
          fullWidth 
          onClick={handleSignup} 
          sx={{ 
            mt: 2, 
            backgroundColor: '#fbc02d',
            fontWeight: 'bold',
            width: '80%', 
            color: '#fff', 
            borderRadius: '10px', 
            '&:hover': { backgroundColor: '#e6ac00' } 
          }} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign Up'}
        </Button>

        <Typography align="center" sx={{ mt: 4 }}>
          <span style={{ color: 'gray' }}>Already have an account? </span>
          <a href="/login" style={{ color: '#1E90FF', textDecoration: 'none' }}>Log in</a>
        </Typography>
        
        <Divider sx={{ my: 3, fontWeight: 'bold'}}>OR</Divider>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<GoogleIcon />} 
            sx={{ color: '#4285F4', borderColor: '#4285F4', textTransform: 'none' }}
          >
            Sign up with Google
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<FacebookIcon />} 
            sx={{ color: '#1877F2', borderColor: '#1877F2', textTransform: 'none' }}
          >
            Sign up with Facebook
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;