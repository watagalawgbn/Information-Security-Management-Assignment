import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  IconButton,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { CloudUpload, Delete, Edit, Search } from "@mui/icons-material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseconfig";
import { jwtDecode } from 'jwt-decode';
import Navbar from "../../components/common/Navbar";
import Header from "../../components/common/Header";
import UserService from "../../services/UserService";

const AddDriver = () => {
  const [driver, setDriver] = useState({
    full_name: "",
    email: "",
    mobile: "",
    license_no: "",
    issuing_date: "",
    expiry_date: "",
    license_type: "",
    experience_years: "",
    image_url: "",
    address: "",
    age: "",
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [driverExists, setDriverExists] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [originalDriverData, setOriginalDriverData] = useState(null);
  
  // Admin-specific states
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState("");

  useEffect(() => {
  const initializeComponent = async () => {
    try {
      setInitialLoading(true);
      
      // Get user info from JWT token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("No authentication token found. Please log in first.");
        return;
      }

      // Decode JWT to get user info and role
      const tokenData = jwtDecode(token);
      const userRole = tokenData.role;
      const currentUserEmail = tokenData.email;
      
      console.log("User role:", userRole);
      console.log("Current user email:", currentUserEmail);
      
      if (userRole === "admin" || userRole === "superadmin" || userRole === "tour-operator") {
        console.log("User is admin, loading admin interface");
        setIsAdmin(true);
        // For admins, load all users to select from
        await loadAllUsers();
        // Don't initialize with admin's own profile
      } else {
        console.log("User is not admin, loading driver interface");
        // For regular users (drivers), initialize with their own email
        setIsAdmin(false);
        if (!currentUserEmail) {
          setError("No user email found in token. Please log in again.");
          return;
        }
        await initializeDriverProfile(currentUserEmail, false); // Pass isAdmin as false
      }
    } catch (err) {
      console.error("Error initializing component:", err);
      setError("Error loading component. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  initializeComponent();
}, []);

  const loadAllUsers = async () => {
    try {
      console.log("Loading all users for admin...");
      const response = await UserService.getAllUsers();
      console.log("All users response:", response);
      
      if (response && response.success && response.data) {
        setAllUsers(response.data);
        console.log("Loaded users count:", response.data.length);
      } else {
        console.log("No users data received");
        setAllUsers([]);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setUserSearchError("Failed to load users. Please check your permissions.");
      setAllUsers([]);
    }
  };

  // Updated function to accept isAdminUser parameter
  const initializeDriverProfile = async (email, isAdminUser = isAdmin) => {
    try {
      setSearchingUser(true);
      
      console.log("Checking user with email:", email, "isAdminUser:", isAdminUser);

      // Check if user exists and get their information
      const userData = await UserService.findUserByEmail(email);
      console.log("User data received:", userData);
      
      if (userData && userData.exists !== false) {
        // User exists - pre-fill data
        setUserExists(true);
        setSelectedUser(userData);
        const fullName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
        
        setDriver((prev) => ({
          ...prev,
          full_name: fullName,
          email: userData.email || email,
        }));

        // Check if driver profile already exists
        try {
          console.log("Checking for existing driver profile...");
          const driverProfile = await UserService.getDriverProfileByEmail(userData.email || email);
          console.log("Driver profile data:", driverProfile);
          
          if (driverProfile && driverProfile.mobile) {
            // Driver profile exists - display it
            setDriverExists(true);
            setIsEditing(false);
            
            const existingDriver = {
              full_name: fullName,
              email: driverProfile.email || userData.email || email,
              mobile: driverProfile.mobile || "",
              license_no: driverProfile.license_no || "",
              issuing_date: driverProfile.issuing_date ? driverProfile.issuing_date.split('T')[0] : "",
              expiry_date: driverProfile.expiry_date ? driverProfile.expiry_date.split('T')[0] : "",
              license_type: driverProfile.license_type || "",
              experience_years: driverProfile.experience_years || "",
              image_url: driverProfile.image_url || "",
              address: driverProfile.address || "",
              age: driverProfile.age || "",
            };
            
            setDriver(existingDriver);
            setOriginalDriverData(existingDriver);
            setPreviewUrl(driverProfile.image_url || "");
          } else {
            // No driver profile - show add form
            setDriverExists(false);
            setIsEditing(true);
          }
        } catch (driverErr) {
          console.log("No existing driver profile found, showing add form");
          setDriverExists(false);
          setIsEditing(true);
        }
        
        setError(""); // Clear any previous errors
        setUserSearchError("");
      } else {
        if (isAdminUser) {
          setError("Selected user not found in the system.");
        } else {
          setError("User not found. Please register as a user first.");
        }
        setUserExists(false);
      }
    } catch (err) {
      console.error("Error checking user:", err);
      if (isAdminUser) {
        setError("Error checking selected user. Please try again.");
      } else {
        setError("Error checking user. Please try again.");
      }
      setUserExists(false);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleUserSelection = async (event, newValue) => {
    setSelectedUser(newValue);
    setUserSearchError("");
    setError("");
    setMessage("");
    
    if (newValue) {
      console.log("Selected user:", newValue);
      // Reset driver form
      setDriver({
        full_name: "",
        email: "",
        mobile: "",
        license_no: "",
        issuing_date: "",
        expiry_date: "",
        license_type: "",
        experience_years: "",
        image_url: "",
        address: "",
        age: "",
      });
      setDriverExists(false);
      setUserExists(false);
      setPreviewUrl("");
      setImageFile(null);
      setIsEditing(true);
      
      // Initialize with selected user and pass true for isAdminUser
      await initializeDriverProfile(newValue.email, true);
    } else {
      // Clear everything if no user selected
      console.log("No user selected, clearing form");
      setUserExists(false);
      setDriverExists(false);
      setDriver({
        full_name: "",
        email: "",
        mobile: "",
        license_no: "",
        issuing_date: "",
        expiry_date: "",
        license_type: "",
        experience_years: "",
        image_url: "",
        address: "",
        age: "",
      });
      setPreviewUrl("");
      setImageFile(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent changing name and email (they're read-only)
    if (name === 'full_name' || name === 'email') {
      return;
    }
    
    setDriver({ ...driver, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    } else {
      setPreviewUrl(driver.image_url || "");
    }
  };

  const uploadImageToFirebase = async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `DriverProfile/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress tracking can be added here
        },
        (error) => {
          console.error("Upload failed", error);
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
    if (isAdmin && !selectedUser) {
      setError("Please select a user first");
      return false;
    }

    const requiredFields = [
      'email', 'mobile', 'license_no', 'issuing_date', 'expiry_date', 
      'license_type', 'experience_years', 'address', 'age'
    ];

    for (let field of requiredFields) {
      if (!driver[field] || driver[field].toString().trim() === '') {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(driver.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Mobile validation
    if (driver.mobile.length < 10) {
      setError('Please enter a valid mobile number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!userExists) {
      setError("User not found. Cannot add driver profile.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      let imageUrl = driver.image_url; // Keep existing image if no new one

      // Upload new image to Firebase if selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToFirebase(imageFile);
        setUploading(false);
      }

      // Prepare data for backend
      const driverData = {
        email: driver.email,
        mobile: driver.mobile,
        license_no: driver.license_no,
        issuing_date: driver.issuing_date,
        expiry_date: driver.expiry_date,
        license_type: driver.license_type,
        experience_years: parseInt(driver.experience_years),
        image_url: imageUrl,
        address: driver.address,
        age: parseInt(driver.age),
      };

      console.log("Submitting driver data:", driverData);

      let response;
      
      // Send to your MySQL backend
      if (driverExists) {
        // Update existing driver
        response = await UserService.updateDriver(driverData);
        setMessage(`Driver profile updated successfully for ${driver.email}!`);
      } else {
        // Add new driver
        response = await UserService.addDriver(driverData);
        setMessage(`Driver profile added successfully for ${driver.email}!`);
        setDriverExists(true);
      }
      
      console.log("Service response:", response);
      
      // Update the driver state with new data including image URL
      const updatedDriver = { ...driver, image_url: imageUrl };
      setDriver(updatedDriver);
      setOriginalDriverData(updatedDriver);
      setPreviewUrl(imageUrl);
      setImageFile(null);
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error saving driver", err);
      
      // Handle the structured error response
      const errorData = err.response?.data || {};
      const errorMessage = errorData.message || "Error saving driver. Please try again.";
      
      if (err.response?.status === 404) {
        setError("User not found. Please register as a user first.");
      } else if (err.response?.status === 409) {
        setError(errorMessage); // This will show the specific conflict message
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setMessage("");
  };

  const handleCancel = () => {
    if (driverExists && originalDriverData) {
      // Restore original data
      setDriver(originalDriverData);
      setPreviewUrl(originalDriverData.image_url || "");
      setIsEditing(false);
    } else {
      // Reset form for new driver
      if (selectedUser) {
        const fullName = `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim();
        setDriver((prev) => ({
          ...prev,
          full_name: fullName,
          email: selectedUser.email,
          mobile: "",
          license_no: "",
          issuing_date: "",
          expiry_date: "",
          license_type: "",
          experience_years: "",
          image_url: "",
          address: "",
          age: "",
        }));
      }
      setPreviewUrl("");
    }
    setImageFile(null);
    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setSelectedUser(null);
    setUserExists(false);
    setDriverExists(false);
    setDriver({
      full_name: "",
      email: "",
      mobile: "",
      license_no: "",
      issuing_date: "",
      expiry_date: "",
      license_type: "",
      experience_years: "",
      image_url: "",
      address: "",
      age: "",
    });
    setPreviewUrl("");
    setImageFile(null);
    setError("");
    setMessage("");
    setIsEditing(true);
  };

  // Show loading while checking user
  if (initialLoading) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // Show error if user not found (ONLY for non-admin users)
  if (!isAdmin && !userExists && error) {
    return (
      <Box display="flex" height="100vh">
        <Navbar />
        <Box flexGrow={1} display="flex" flexDirection="column">
          <Header />
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Alert severity="error">
                {error}
              </Alert>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.href = '/login'}
                  sx={{ backgroundColor: '#FDCB42' }}
                >
                  Go to Login
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100vh">
      <Navbar />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Header />
        <Box sx={{ p: 1, overflow: "auto", flexGrow: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {isAdmin ? 'Manage Driver Profiles' : (driverExists ? 'Driver Profile' : 'Add Driver Details')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isAdmin && selectedUser && (
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    sx={{ 
                      borderColor: 'gray',
                      color: 'gray',
                      '&:hover': {
                        backgroundColor: 'gray',
                        color: 'white'
                      }
                    }}
                  >
                    New Driver
                  </Button>
                )}
                {driverExists && !isEditing && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    sx={{ 
                      borderColor: '#FDCB42',
                      color: '#FDCB42',
                      '&:hover': {
                        backgroundColor: '#FDCB42',
                        color: 'white'
                      }
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Box>

            {/* Admin User Selection */}
            {isAdmin && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select User to Manage Driver Profile
                  </Typography>
                  <Autocomplete
                    options={allUsers}
                    getOptionLabel={(option) => 
                      `${option.first_name || ''} ${option.last_name || ''} (${option.email})`.trim()
                    }
                    value={selectedUser}
                    onChange={handleUserSelection}
                    loading={searchingUser}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and select user"
                        placeholder="Type to search by name or email"
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                          endAdornment: (
                            <>
                              {searchingUser ? <Typography variant="caption">Loading...</Typography> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter((option) =>
                        `${option.first_name} ${option.last_name} ${option.email}`
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      );
                    }}
                    noOptionsText="No users found"
                  />
                  {userSearchError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {userSearchError}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            )}

            {/* Status Messages - Only show relevant ones */}
            {!isAdmin && selectedUser && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Managing driver profile for your account ({driver.email})
              </Alert>
            )}

            {isAdmin && selectedUser && driverExists && !isEditing && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Driver profile exists for {driver.email}. Click "Edit Profile" to make changes.
              </Alert>
            )}

            {isAdmin && selectedUser && !driverExists && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Adding driver profile for {selectedUser.email}
              </Alert>
            )}

            {/* Success/Error Messages */}
            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            {error && !(!isAdmin && !userExists) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Driver Form - Show only when user is selected (for admin) or user exists (for driver) */}
            {((isAdmin && (selectedUser || !selectedUser)) || (!isAdmin && userExists)) && (
              <Grid container spacing={2}>
                {/* Image Display/Upload Section */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    gap: 5,
                  }}
                >
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      width: 150,
                      height: 110,
                      mt: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Driver profile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      isEditing && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                            id="driver-image"
                          />
                          <label htmlFor="driver-image">
                            <IconButton component="span">
                              <CloudUpload />
                            </IconButton>
                          </label>
                        </>
                      )
                    )}
                    {isEditing && (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {previewUrl && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setImageFile(null);
                              setPreviewUrl(driverExists ? driver.image_url : "");
                            }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                        {previewUrl && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              style={{ display: "none" }}
                              id="driver-image-change"
                            />
                            <label htmlFor="driver-image-change">
                              <IconButton component="span" size="small">
                                <Edit />
                              </IconButton>
                            </label>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>

                  {imageFile && (
                    <Typography variant="body2">{imageFile.name}</Typography>
                  )}
                </Grid>

                {/* Personal Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Personal Details
                  </Typography>
                  {[
                    { name: "full_name", label: "Full Name" },
                    { name: "email", label: "Email", type: "email" },
                    { name: "mobile", label: "Mobile Number*" },
                    { name: "address", label: "Address*" },
                    { name: "age", label: "Age*", type: "number" },
                  ].map((field) => (
                    <TextField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      type={field.type || "text"}
                      value={driver[field.name]}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      margin="normal"
                      required={field.label.includes('*')}
                      disabled={!isEditing || field.name === 'full_name' || field.name === 'email'}
                      InputProps={{
                        readOnly: !isEditing || field.name === 'full_name' || field.name === 'email',
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          backgroundColor: (!isEditing || field.name === 'full_name' || field.name === 'email') ? '#f5f5f5' : 'inherit',
                        },
                      }}
                    />
                  ))}
                </Grid>

                {/* Professional Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Professional Details
                  </Typography>
                  <FormControl fullWidth size="small" margin="normal" disabled={!isEditing}>
                    <InputLabel>License Type*</InputLabel>
                    <Select
                      name="license_type"
                      value={driver.license_type}
                      label="License Type*"
                      onChange={handleChange}
                      required
                      sx={{
                        backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                      }}
                    >
                      <MenuItem value="Class A">Class A (Commercial - Heavy trucks, buses)</MenuItem>
                      <MenuItem value="Class B">Class B (Commercial - Large trucks, buses)</MenuItem>
                      <MenuItem value="Class C">Class C (Regular driver's license)</MenuItem>
                      <MenuItem value="CDL">CDL (Commercial Driver's License)</MenuItem>
                      <MenuItem value="Motorcycle">Motorcycle License</MenuItem>
                      <MenuItem value="Chauffeur">Chauffeur License</MenuItem>
                    </Select>
                  </FormControl>

                  {[
                    { name: "license_no", label: "License Number*" },
                    { name: "issuing_date", label: "License Issuing Date*", type: "date" },
                    { name: "expiry_date", label: "License Expiry Date*", type: "date" },
                    { name: "experience_years", label: "Years of Experience*", type: "number" },
                  ].map((field) => (
                    <TextField
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      type={field.type || "text"}
                      value={driver[field.name]}
                      onChange={handleChange}
                      InputLabelProps={
                        field.type === "date" ? { shrink: true } : undefined
                      }
                      fullWidth
                      size="small"
                      margin="normal"
                      required
                      disabled={!isEditing}
                      InputProps={{
                        readOnly: !isEditing,
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          backgroundColor: !isEditing ? '#f5f5f5' : 'inherit',
                        },
                      }}
                    />
                  ))}
                </Grid>

                {/* Buttons - Only show when editing */}
                {isEditing && (
                  <Grid
                    item
                    xs={12}
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="inherit"
                      onClick={handleCancel}
                      disabled={loading || uploading}
                      sx={{
                        mr: 2,
                        backgroundColor: "gray",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "black",
                        },
                        px: 8,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={loading || uploading || !userExists}
                      variant="contained"
                      sx={{
                        backgroundColor: "#FDCB42",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#fbbf24",
                        },
                        px: 8,
                      }}
                      onClick={handleSubmit}
                    >
                      {uploading ? "Uploading Image..." : loading ? "Saving..." : driverExists ? "Update Driver Profile" : "Save Driver Profile"}
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Instructions for admin when no user selected */}
            {isAdmin && !selectedUser && (
              <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                <Typography variant="h6" gutterBottom>
                  Select a User to Manage Driver Profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the search box above to find and select a user, then you can add or edit their driver profile.
                </Typography>
              </Paper>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AddDriver;