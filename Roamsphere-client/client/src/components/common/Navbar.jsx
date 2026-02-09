import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  DirectionsCar,
  EmojiEvents,
  AddCircle,
  Schedule,
  LocationOn,
  Settings,
  ChevronRight,
  ChevronLeft,
  Person,
  PersonAdd,
  Group,
  Assessment,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { jwtDecode } from 'jwt-decode';
import MainLogo from "../../assets/logo2.png";
import UserService from "../../services/UserService";

const drawerWidth = 280;

const Navbar = styled(Drawer, { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    width: open ? drawerWidth : 72,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    "& .MuiDrawer-paper": {
      width: open ? drawerWidth : 72,
      height: "100vh",
      backgroundColor: "#111",
      color: "white",
      borderRadius: "0px 10px 10px 0px",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "hidden",
      overflowY: "hidden",
      position: "relative",
      zIndex: 1201,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 20,
    },
  })
);

const SidebarMenu = ({ defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    first_name: "",
    last_name: "",
    role_name: "",
    image_url: "",
    email: ""
  });
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        
        // Get JWT token from localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('No auth token found');
          setLoading(false);
          return;
        }

        // Decode JWT token to get user info
        const tokenData = jwtDecode(token);
        
        if (!tokenData || !tokenData.email) {
          console.error('No valid token or email found');
          setLoading(false);
          return;
        }

        console.log('Token data:', tokenData);

        // Get detailed user info from API
        const userData = await UserService.findUserByEmail(tokenData.email);
        
        console.log('User data from API:', userData);
        
        if (userData && userData.exists) {
          const userInfoData = {
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            role_name: userData.role_name || tokenData.role || "",
            email: tokenData.email,
            image_url: userData.image_url || ""
          };

          console.log('Setting user info:', userInfoData);
          setUserInfo(userInfoData);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle invalid token
        if (error.name === 'InvalidTokenError') {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const getMenuItems = (roleName) => {
    console.log('Getting menu items for role:', roleName);
    
    const baseItems = [
      { text: "Settings", icon: <Settings />, path: "/menu-settings" },
    ];

    // Admin/Superadmin menu items
    const adminItems = [
      { text: "Dashboard", icon: <Dashboard />, path: "/users" },
      { text: "Add Vehicle", icon: <AddCircle />, path: "/addvehicle" },
      { text: "Vehicle List", icon: <DirectionsCar />, path: "/vehiclelist" },
      // { text: "Driver Leaderboard", icon: <EmojiEvents />, path: "/driver-leaderboard" },
      { text: "Driver List", icon: <Group />, path: "/driver-list" },

      // { text: "Add Driver", icon: <PersonAdd />, path: "/adddriver" },
      { text: "Trip Schedule", icon: <Schedule />, path: "/trip-schedule" },
      { text: "Track Location", icon: <LocationOn />, path: "/track-location" },
      // { text: "Reports", icon: <Assessment />, path: "/reports" },
    ];

    // Tour Operator menu items
    const tourOperatorItems = [
      { text : "Dashboard", icon: <Dashboard />, path: "/tour-operator-dashboard" },
      { text: "Trip Schedules", icon: <Schedule />, path: "/trip-schedule" },
      { text: "Vehicle List", icon: <DirectionsCar />, path: "/vehiclelist" },
      { text: "Driver List", icon: <Group />, path: "/driver-list" },   
      { text: "Track Location", icon: <LocationOn />, path: "/track-location" },
      // { text: "Reports", icon: <Assessment />, path: "/reports" },
    ];

    // Driver menu items
    const driverItems = [
      { text: "Dashboard", icon: <Dashboard />, path: "/driver-dashboard" },
      { text: "My Profile", icon: <Person />, path: "/driver-profile" },
      { text: "My Trips", icon: <Schedule />, path: "/my-trips" },
      { text: "Track Location", icon: <LocationOn />, path: "/track-location" },
      // { text: "My Performance", icon: <Assessment />, path: "/my-performance" },
    ];

    // User/Customer menu items
    const userItems = [
      { text: "My Bookings", icon: <Schedule />, path: "/customer-dashboard" },
      { text: "Track Trip", icon: <LocationOn />, path: "/customer-trip-tracker" },
    ];

    switch (roleName) {
      case 'admin':
      case 'superadmin':
        return [...adminItems, ...baseItems];
      case 'tour-operator':
        return [...tourOperatorItems, ...baseItems];
      case 'driver':
        return [...driverItems, ...baseItems];
      case 'user':
      case 'customer':
        return [...userItems, ...baseItems];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems(userInfo.role_name);

  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Get user initials for avatar
  const getUserInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName[0].toUpperCase() : '';
    const lastInitial = lastName ? lastName[0].toUpperCase() : '';
    return firstInitial + lastInitial || 'U';
  };

  // Show loading state
  if (loading) {
    return (
      <Navbar variant="permanent" open={open}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: 'white' }}>Loading...</Typography>
        </Box>
      </Navbar>
    );
  }

  const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim();
  const displayName = fullName || 'User';

  return (
    <Navbar variant="permanent" open={open}>
      {/* Logo and Toggle Button */}
      <Box sx={{ position: "relative", width: "100%", mb: 2 }}>
        {open && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5 }}>
            <img
              src={MainLogo}
              alt="RoamSphere Logo"
              style={{ width: 180, height: 70 }}
            />
          </Box>
        )}

        {/* Floating Toggle Button */}
        <Box
          onClick={toggleDrawer}
          sx={{
            position: "fixed",
            top: 45,
            left: open ? drawerWidth - 17 : 55,
            width: 35,
            height: 35,
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          {open ? (
            <ChevronLeft sx={{ color: "#000", fontSize: 20 }} />
          ) : (
            <ChevronRight sx={{ color: "#000", fontSize: 20 }} />
          )}
        </Box>
      </Box>

      <Divider sx={{ flexShrink: 0 }} />

      {/* Navigation Items */}
      <Box sx={{ 
        mt: 2, 
        flex: 1, 
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <List sx={{ 
          flex: 1,
          py: 0,
          overflow: 'hidden'
        }}>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ mb: 0.3, flexShrink: 0 }}>
              <ListItemButton 
                onClick={() => handleMenuClick(item.path)}
                sx={{ 
                  justifyContent: open ? "initial" : "center", 
                  px: 2.5,
                  py: 1.2,
                  mx: open ? 1 : 0,
                  borderRadius: open ? "25px" : "50%",
                  minHeight: 45,
                  "&:hover": {
                    backgroundColor: "#FDCB42",
                    color: "#000",
                    "& .MuiListItemIcon-root": {
                      color: "#000",
                    },
                    "& .MuiListItemText-root": {
                      color: "#000",
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 0, 
                    mr: open ? 2 : "auto", 
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    display: open ? 'block' : 'none'
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ 
        marginTop: "auto", 
        paddingBottom: 2, 
        textAlign: "center",
        width: '100%',
        px: 2,
        flexShrink: 0
      }}>
        <Divider sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        {/* User Avatar and Info */}
        <Box sx={{ mb: 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: "#FDCB42", 
              margin: "auto",
              width: open ? 42 : 35,
              height: open ? 42 : 35,
              fontSize: open ? '1rem' : '0.9rem'
            }}
            src={userInfo.image_url || undefined}
          >
            {!userInfo.image_url && getUserInitials(userInfo.first_name, userInfo.last_name)}
          </Avatar>
          
          {open && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                {userInfo.role_name ? userInfo.role_name.charAt(0).toUpperCase() + userInfo.role_name.slice(1) : 'User'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Logout Button */}
        <Box 
          onClick={handleLogout}
          sx={{ 
            cursor: "pointer",
            p: 0.8,
            borderRadius: '20px',
            transition: 'all 0.3s ease',
            "&:hover": { 
              backgroundColor: 'rgba(253,203,66,0.1)',
              color: "#FDCB42"
            }
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
            {open ? 'Log out' : '•••'}
          </Typography>
        </Box>
      </Box>
    </Navbar>
  );
};

export default SidebarMenu;