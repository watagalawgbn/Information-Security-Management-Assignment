import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Paper, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import MainLogo from "../../assets/MainLogo.jpg";
import AuthService from '../../services/AuthServices'; 

const SetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError("Email not provided.");
    }
  }, [location]);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      setError("Password must contain at least one number and one special character.");
      return;
    }
    setError("");

    try {
      // Update password
      const response = await AuthService.updatePassword(email, password);

      const token = response?.token;
      if (token) {
        localStorage.setItem('authToken', token);

        // Decode JWT to get role
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const decodedToken = JSON.parse(atob(tokenParts[1]));
          const userRole = decodedToken.role;

          // Redirect based on role
          switch (userRole) {
            case 'super-admin':
              navigate('/');
              return;
            case 'admin':
              navigate('/users');
              return;
            case 'tour-operator':
              navigate('/tour-operator-dashboard');
              return;
            case 'driver':
              navigate('/driver-dashboard');
              return;
            default:
              setError('Unauthorized role. Access denied.');
              return;
          }
        } else {
          setError('Invalid authentication token.');
        }
      } else {
        // No token: fallback to login
        setSuccessMessage("Password set successfully! Please log in.");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      setError(error.message || "Failed to set password.");
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Left Side - Logo Section */}
      <Box
        flex={3}
        sx={{
          backgroundColor: "#000000",
          backgroundImage: `url(${MainLogo})`,
          backgroundSize: "50%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Right Section - Form */}
      <Paper
        elevation={6}
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          width: '80%'
        }}
      >
        <Typography variant="h4" sx={{ color: "#072227", fontWeight: "bold" }}>
          Set password
        </Typography>
        <Typography sx={{ mt: 4, mb: 2, color: "lightgray" }}>
          Set your password
        </Typography>

        <TextField
          label="Enter Your Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mt: 4, width: '80%' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm Password"
          variant="outlined"
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mt: 2, width: '80%' }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="At least 1 number or a special character"
        />

        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
        {successMessage && <Typography color="success" sx={{ mt: 1 }}>{successMessage}</Typography>}

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 7, backgroundColor: "#fbc02d", fontWeight: "bold", width: '80%' }}
          onClick={handleSubmit}
        >
          Register
        </Button>
      </Paper>
    </Box>
  );
};

export default SetPassword;