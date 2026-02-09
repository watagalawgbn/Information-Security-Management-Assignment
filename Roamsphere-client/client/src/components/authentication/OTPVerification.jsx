import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import MainLogo from "../../assets/MainLogo.jpg";
import AuthService from '../../services/AuthServices';

const OTPVerification = () => {
  const [otp, setOtp] = useState(Array(4).fill(""));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError("Email not provided.");
    }
  }, [location]);

  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      let newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    if (otp.some((digit) => digit === "")) {
      setError("Please enter all OTP digits.");
      return;
    }
    setError("");
    try {
      const otpCode = otp.join("");
      await AuthService.verifyOTP({ email, otp: otpCode });
      setSuccessMessage("OTP verified successfully.");
      navigate(`/setpassword?email=${email}`);
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed.');
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await AuthService.sendOTP({ email });
      setSuccessMessage("OTP has been resent.");
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP.');
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

      {/* Right Side - OTP Verification Form */}
      <Paper
        elevation={6}
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
        }}
      >
        <Typography variant="h4" sx={{ color: "#072227", fontWeight: "bold" }}>
          Verification
        </Typography>
        <Typography sx={{ mt: 10, mb: 3, color: "gray" }}>
          Enter your OTP code
        </Typography>

        <Box display="flex" gap={1}>
          {otp.map((digit, index) => (
            <TextField
              key={index}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              variant="outlined"
              inputProps={{ maxLength: 1, style: { textAlign: "center" } }}
              sx={{ width: 50, height: 50 }}
            />
          ))}
        </Box>

        {error && <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>}
        {successMessage && <Typography color="success" sx={{ mt: 1 }}>{successMessage}</Typography>}

        <Button
          variant="contained"
          sx={{ mt: 8, backgroundColor: "#fbc02d", fontWeight: "bold" }}
          onClick={handleVerify}
        >
          Verify OTP
        </Button>

        <Typography sx={{ mt: 3 }}>
          Didn’t receive code? <span style={{ color: "#fbc02d", cursor: "pointer" }} onClick={handleResend}>Resend again</span>
        </Typography>
      </Paper>
    </Box>
  );
};

export default OTPVerification;