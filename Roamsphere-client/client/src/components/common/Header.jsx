// import React, { useEffect, useState } from 'react';
// import { Box, Typography, Avatar } from '@mui/material';
// import UserService from '../../services/UserService'; 


// const Header = () => {
//   const [userInfo, setUserInfo] = useState({ 
//     first_name: "", 
//     last_name: "", 
//     role_name: "",
//     image_url: "" 
//   });

//   useEffect(() => {
//     const fetchUserInfo = async () => {
//       try {
//         // Get user info from JWT token
//         const tokenData = getUserFromToken();
        
//         if (!tokenData || !tokenData.email) {
//           console.error('No valid token or email found');
//           return;
//         }

//         console.log('Token data:', tokenData);

//         // Get detailed user info from API
//         const userData = await UserService.findUserByEmail(tokenData.email);
        
//         console.log('User data from API:', userData);
        
//         if (userData && userData.exists) {
//           setUserInfo({
//             first_name: userData.first_name || "",
//             last_name: userData.last_name || "",
//             role_name: userData.role_name || tokenData.role || "",
//             image_url: userData.image_url || ""
//           });

//           // If user is a driver, try to get driver profile for image
//           // if (userData.role_name === 'driver') {
//           //   try {
//           //     const driverProfile = await UserService.getDriverProfileByEmail(email);
//           //     if (driverProfile && driverProfile.image_url) {
//           //       setUserInfo(prev => ({
//           //         ...prev,
//           //         image_url: driverProfile.image_url
//           //       }));
//           //     }
//           //   } catch (driverError) {
//           //     console.log('No driver profile found or error fetching driver image');
//           //   }
//           // }
//         }
//       } catch (error) {
//         console.error('Error fetching user info:', error);
//       }
//     };

//     fetchUserInfo(); 
//   }, []);

//   const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim();
//   const displayName = fullName || 'Guest';
//   const avatarLetter = userInfo.first_name ? userInfo.first_name[0].toUpperCase() : 'G';

//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         height: 64,
//         backgroundColor: '#fff',
//         paddingX: 2,
//         borderBottom: '1px solid #E0E0E0',
//       }}
//     >
//       {/* Left side: path */}
//       <Typography variant="h6" sx={{ fontWeight: 'bold' }}></Typography>

//       {/* Right side: User Profile */}
//       <Box sx={{ display: 'flex', alignItems: 'center' }}> 
//         <Box sx={{ textAlign: 'right' }}>
//           <Typography variant="body2" sx={{ fontWeight: '600' }}>
//             {displayName}
//           </Typography>
//           <Typography variant="caption" color="gray">
//             {userInfo.role_name || 'Role'}
//           </Typography>
//         </Box>
//         <Avatar 
//           sx={{ bgcolor: '#FFC107', marginLeft: 1, width: 40, height: 40 }}
//           src={userInfo.image_url || undefined}
//         >
//           {!userInfo.image_url && avatarLetter}
//         </Avatar>
//       </Box>
//     </Box>
//   );
// };

// export default Header;

import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import UserService from '../../services/UserService'; 

const Header = () => {
  const [userInfo, setUserInfo] = useState({ 
    first_name: "", 
    last_name: "", 
    role_name: "",
    image_url: "" 
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('No auth token found');
          return;
        }

        // Decode JWT token to get user info
        const tokenData = jwtDecode(token);
        
        if (!tokenData || !tokenData.email) {
          console.error('No valid token or email found');
          return;
        }

        console.log('Token data:', tokenData);

        // Get detailed user info from API
        const userData = await UserService.findUserByEmail(tokenData.email);
        
        console.log('User data from API:', userData);
        
        if (userData && userData.exists) {
          setUserInfo({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            role_name: userData.role_name || tokenData.role || "",
            image_url: userData.image_url || ""
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        // Handle invalid token
        if (error.name === 'InvalidTokenError') {
          localStorage.removeItem('authToken');
          // Optionally redirect to login
        }
      }
    };

    fetchUserInfo(); 
  }, []);

  const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim();
  const displayName = fullName || 'Guest';
  const avatarLetter = userInfo.first_name ? userInfo.first_name[0].toUpperCase() : 'G';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        backgroundColor: '#fff',
        paddingX: 2,
        borderBottom: '1px solid #E0E0E0',
      }}
    >
      {/* Left side: path */}
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}></Typography>

      {/* Right side: User Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}> 
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: '600' }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="gray">
            {userInfo.role_name || 'Role'}
          </Typography>
        </Box>
        <Avatar 
          sx={{ bgcolor: '#FFC107', marginLeft: 1, width: 40, height: 40 }}
          src={userInfo.image_url || undefined}
        >
          {!userInfo.image_url && avatarLetter}
        </Avatar>
      </Box>
    </Box>
  );
};

export default Header;