// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Grid,
//   Button,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Chip,
//   Alert,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   Card,
//   CardContent,
//   useTheme,
//   useMediaQuery,
//   CircularProgress,
//   Avatar,
//   Rating,
//   Divider,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableRow
// } from '@mui/material';
// import {
//   LocationOn,
//   DirectionsCar,
//   Person,
//   AttachMoney,
//   Close as CloseIcon,
//   Assignment,
//   CheckCircle,
//   CalendarToday,
//   PersonAdd,
//   Star,
//   Terrain,
//   Map,
//   Explore,
//   DriveEta,
//   Route,
//   Calculate
// } from '@mui/icons-material';
// import UserService from '../../services/UserService';

// const TripScheduler = ({
//   open,
//   onClose,
//   onSave,
//   requestData = null,
//   isMobile = false
// }) => {
//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

//   const [assignmentData, setAssignmentData] = useState({
//     driverId: '',
//     vehicleId: '',
//     estimatedCost: ''
//   });

//   const [availableDrivers, setAvailableDrivers] = useState([]);
//   const [availableVehicles, setAvailableVehicles] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [resourcesLoading, setResourcesLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [distance, setDistance] = useState(0);

//   useEffect(() => {
//     if (open && requestData) {
//       setDistance(requestData.estimated_distance_km || estimateDistance());
//       fetchAvailableResources();
//       setAssignmentData({
//         driverId: '',
//         vehicleId: '',
//         estimatedCost: ''
//       });
//     }
//   }, [open, requestData]);

//   useEffect(() => {
//     if (assignmentData.driverId && assignmentData.vehicleId && distance) {
//       const calculatedCost = calculateBasicCost();
//       setAssignmentData(prev => ({
//         ...prev,
//         estimatedCost: calculatedCost.totalCost.toString()
//       }));
//     }
//   }, [assignmentData.driverId, assignmentData.vehicleId, distance, requestData]);

//   const estimateDistance = () => Math.floor(Math.random() * 150) + 30;

//   const fetchAvailableResources = async () => {
//     try {
//       setResourcesLoading(true);

//       const [usersResponse, vehiclesResponse] = await Promise.all([
//         UserService.getAllUsers().catch(() => []),
//         UserService.getAvailableVehicles().catch(() => [])
//       ]);

    
//       let driversData = [];
//       if (usersResponse && Array.isArray(usersResponse)) {
//         const driverUsers = usersResponse.filter(
//           user => user.role_name === 'driver' && user.status !== 'inactive'
//         );

//         const driversWithProfiles = await Promise.all(
//           driverUsers.map(async (user) => {
//             try {
//               const driverProfile = await UserService.getDriverProfileByEmail(user.email);
//               return {
//                 user_id: user.id,
//                 driver_id: user.id,
//                 name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
//                 email: user.email,
//                 profile_image: driverProfile?.image_url || user.image_url || '',
//                 phone: driverProfile?.mobile || 'N/A',
//                 license_type: driverProfile?.license_type || 'Standard License',
//                 experience_years: driverProfile?.experience_years || 0,
//                 rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
//                 availability: driverProfile?.availability || 'Available'
//               };
//             } catch {
//               return {
//                 user_id: user.id,
//                 driver_id: user.id,
//                 name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
//                 email: user.email,
//                 profile_image: user.image_url || '',
//                 phone: 'Profile not created',
//                 license_type: 'N/A',
//                 experience_years: 0,
//                 rating: 0,
//                 availability: 'Available'
//               };
//             }
//           })
//         );

//         driversData = driversWithProfiles.filter(
//           driver => driver.availability?.toLowerCase() === 'available'
//         );
//       }

//       // Vehicle fetching
//       let vehiclesData = [];
//       if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
//         vehiclesData = vehiclesResponse
//           .filter(vehicle =>
//             vehicle.availability?.toLowerCase() === 'available' &&
//             vehicle.seating_capacity >= (requestData?.passenger_count || 1)
//           )
//           .map(vehicle => ({
//             vehicle_id: vehicle.vehicle_id || vehicle.id,
//             vehicle_type: vehicle.vehicle_type,
//             model: vehicle.model,
//             seating_capacity: vehicle.seating_capacity,
//             license_plate: vehicle.license_plate,
//             category: vehicle.category,
//             availability: vehicle.availability,
//             color: vehicle.color,
//             year: vehicle.year,
//             fuel_type: vehicle.fuel_type,
//             transmission: vehicle.transmission
//           }));

//         // if (requestData?.category) {
//         //   const filteredByCategory = vehiclesData.filter(vehicle =>
//         //     vehicle.category === requestData.category
//         //   );
//         //   if (filteredByCategory.length > 0) {
//         //     vehiclesData = filteredByCategory;
//         //   }
//         // }
//       }

//       setAvailableDrivers(driversData);
//       setAvailableVehicles(vehiclesData);

//       if (driversData.length === 0) {
//         setErrors(prev => ({
//           ...prev,
//           drivers: `No drivers available at the moment.`
//         }));
//       }

//       if (vehiclesData.length === 0) {
//         setErrors(prev => ({
//           ...prev,
//           vehicles: `No vehicles available${requestData?.category ? ` in ${requestData.category} category` : ''}.`
//         }));
//       }
//     } catch (error) {
//       setErrors(prev => ({
//         ...prev,
//         fetch: 'Failed to load available drivers and vehicles. Please try again.'
//       }));
//       setAvailableDrivers([]);
//       setAvailableVehicles([]);
//     } finally {
//       setResourcesLoading(false);
//     }
//   };

//   const calculateBasicCost = () => {
//     const pricingConfig = {
//       fixedRate: 500,
//       perKmRate: 80,
//       categoryRates: {
//         'Luxury': 3500,
//         'Safari': 2800,
//         'Tour': 2000,
//         'Adventure': 2200,
//         'Casual': 1500,
//         'Cultural': 1800,
//         'Business': 2500,
//         'Airport': 1200
//       }
//     };
//     const tripCategory = requestData?.category || 'Casual';
//     const fixedRate = pricingConfig.fixedRate;
//     const distanceCost = distance * pricingConfig.perKmRate;
//     const categoryAmount = pricingConfig.categoryRates[tripCategory] || pricingConfig.categoryRates['Casual'];
//     const totalCost = fixedRate + distanceCost + categoryAmount;
//     return {
//       fixedRate,
//       distanceCost,
//       categoryAmount,
//       categoryName: tripCategory,
//       totalCost: Math.ceil(totalCost)
//     };
//   };

//   const handleDriverAssign = (driverId) => {
//     setAssignmentData(prev => ({
//       ...prev,
//       driverId: driverId
//     }));
//     if (errors.driverId) {
//       setErrors(prev => ({
//         ...prev,
//         driverId: undefined
//       }));
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setAssignmentData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: undefined
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!assignmentData.driverId) newErrors.driverId = 'Driver selection is required';
//     if (!assignmentData.vehicleId) newErrors.vehicleId = 'Vehicle selection is required';
//     if (!assignmentData.estimatedCost) newErrors.estimatedCost = 'Estimated cost is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleAssign = async () => {
//     if (!validateForm()) return;
//     try {
//       setLoading(true);
//       const tripToSave = {
//         ...requestData,
//         assigned_driver_id: assignmentData.driverId,
//         assigned_vehicle_id: assignmentData.vehicleId,
//         estimated_cost: assignmentData.estimatedCost,
//         estimated_distance_km: distance,
//         status: 'confirmed'
//       };
//       await onSave(tripToSave);
//       onClose();
//     } catch (error) {
//       setErrors({ submit: 'Failed to assign trip. Please try again.' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

//   const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', {
//     style: 'currency',
//     currency: 'LKR',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0
//   }).format(amount);

//   const formatDateTime = (date, time) => {
//     if (!date || !time) return 'Not specified';
//     try {
//       const dateObj = new Date(date);
//       const formattedDate = dateObj.toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//       return `${formattedDate} at ${time}`;
//     } catch {
//       return `${date} at ${time}`;
//     }
//   };

//   const formatLocation = (location) => {
//     if (!location) return 'Not specified';
//     return location.length > 30 ? `${location.substring(0, 30)}...` : location;
//   };

//   // Get selected driver and vehicle for summary
//   const selectedDriver = availableDrivers.find(d => d.user_id === assignmentData.driverId);
//   const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

//   if (!requestData) return null;

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth="lg"
//       fullWidth
//       fullScreen={isSmallScreen}
//       PaperProps={{
//         sx: {
//           minHeight: isSmallScreen ? '100vh' : '80vh',
//           m: isSmallScreen ? 0 : 2
//         }
//       }}
//     >
//       <DialogTitle sx={{
//         bgcolor: '#FDCB42',
//         color: 'black',
//         fontWeight: 'bold',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center'
//       }}>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Assignment sx={{ mr: 1 }} />
//           Assign Trip to Driver & Vehicle
//         </Box>
//         {isSmallScreen && (
//           <IconButton onClick={onClose} sx={{ color: 'black' }}>
//             <CloseIcon />
//           </IconButton>
//         )}
//       </DialogTitle>

//       <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
//         {errors.submit && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {errors.submit}
//           </Alert>
//         )}
//         {errors.fetch && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {errors.fetch}
//           </Alert>
//         )}

//         <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
//           <CardContent sx={{ py: 2 }}>
//             <Typography variant="h6" gutterBottom sx={{ color: '#FDCB42', fontWeight: 'bold', mb: 2 }}>
//               Trip Overview - {requestData?.category || 'Standard'} Trip
//             </Typography>
//             <Grid container spacing={1}>
//               <Grid item xs={12} md={6}>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
//                   <strong>{formatDateTime(requestData.preferred_date, requestData.preferred_time)}</strong>
//                 </Typography>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <Person sx={{ mr: 1, color: 'info.main', fontSize: 16 }} />
//                   <strong>{requestData.passenger_count || 1} passengers</strong> • {requestData.contact_name}
//                 </Typography>
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <LocationOn sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
//                   <strong>From:</strong> {formatLocation(requestData.origin)}
//                 </Typography>
//                 <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
//                   <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
//                   <strong>To:</strong> {formatLocation(requestData.destination)}
//                 </Typography>
//               </Grid>
//             </Grid>
//           </CardContent>
//         </Card>

//         <Grid container spacing={3}>
//           <Grid item xs={12} md={7}>
//             {resourcesLoading ? (
//               <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
//                 <CircularProgress size={20} />
//                 <Typography variant="body2">Loading available resources...</Typography>
//               </Box>
//             ) : (
//               <Grid container spacing={2}>
//                 <Grid item xs={12}>
//                   <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Person sx={{ mr: 1, color: '#FDCB42' }} />
//                     Available Drivers ({availableDrivers.length})
//                   </Typography>
//                   {errors.drivers && (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       {errors.drivers}
//                     </Alert>
//                   )}
//                   {availableDrivers.length === 0 ? (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       No drivers available at the moment.
//                       <br />
//                       <Typography variant="body2" sx={{ mt: 1 }}>
//                         • Ensure drivers are marked as available
//                         • Consider expanding search criteria
//                       </Typography>
//                     </Alert>
//                   ) : (
//                     <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
//                       <Box>
//                         {availableDrivers.map((driver, index) => (
//                           <Box
//                             key={driver.user_id || driver.driver_id}
//                             sx={{
//                               display: 'flex',
//                               alignItems: 'center',
//                               bgcolor: assignmentData.driverId === driver.user_id ? 'rgba(253, 203, 66, 0.1)' : 'transparent',
//                               border: assignmentData.driverId === driver.user_id ? '2px solid #FDCB42' : 'none',
//                               borderRadius: 1,
//                               mb: 1,
//                               p: 1
//                             }}
//                           >
//                             <Avatar
//                               src={driver.profile_image}
//                               sx={{ width: 48, height: 48, bgcolor: '#FDCB42', mr: 2 }}
//                             >
//                               {!driver.profile_image && getInitials(driver.name)}
//                             </Avatar>
//                             <Box sx={{ flexGrow: 1 }}>
//                               <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
//                                 {driver.name}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary">
//                                 {driver.license_type} • {driver.experience_years} years • ⭐ {driver.rating}
//                               </Typography>
//                               <Typography variant="body2" color="text.secondary">
//                                 📱 {driver.phone}
//                               </Typography>
//                             </Box>
//                             <Chip
//                               label={driver.availability}
//                               size="small"
//                               color={driver.availability?.toLowerCase() === 'available' ? 'success' : 'default'}
//                               sx={{ ml: 1 }}
//                             />
//                             <Button
//                               variant={assignmentData.driverId === driver.user_id ? "contained" : "outlined"}
//                               size="small"
//                               startIcon={<PersonAdd />}
//                               onClick={() => handleDriverAssign(driver.user_id)}
//                               disabled={driver.availability?.toLowerCase() !== 'available'}
//                               sx={{
//                                 bgcolor: assignmentData.driverId === driver.user_id ? '#FDCB42' : 'transparent',
//                                 borderColor: '#FDCB42',
//                                 color: assignmentData.driverId === driver.user_id ? 'black' : '#FDCB42',
//                                 ml: 2,
//                                 '&:hover': {
//                                   bgcolor: assignmentData.driverId === driver.user_id ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)'
//                                 }
//                               }}
//                             >
//                               {assignmentData.driverId === driver.user_id ? 'Selected' : 'Assign'}
//                             </Button>
//                           </Box>
//                         ))}
//                       </Box>
//                     </Paper>
//                   )}
//                 </Grid>

//                 <Grid item xs={12}>
//                   <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
//                     <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
//                     Select Vehicle ({availableVehicles.length} available)
//                   </Typography>
//                   {errors.vehicles && (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       {errors.vehicles}
//                     </Alert>
//                   )}
//                   {availableVehicles.length === 0 ? (
//                     <Alert severity="warning" sx={{ mb: 2 }}>
//                       No vehicles available for {requestData?.passenger_count || 1} passengers{requestData?.category ? ` in ${requestData.category} category` : ''}.
//                       <br />
//                       <Typography variant="body2" sx={{ mt: 1 }}>
//                         • Check vehicle availability status
//                         • Verify seating capacity requirements
//                         • Ensure vehicles are properly categorized
//                       </Typography>
//                     </Alert>
//                   ) : (
//                     <FormControl fullWidth error={!!errors.vehicleId}>
//                       <InputLabel>Available Vehicles</InputLabel>
//                       <Select
//                         value={assignmentData.vehicleId}
//                         label="Available Vehicles"
//                         onChange={(e) => handleInputChange('vehicleId', e.target.value)}
//                       >
//                         <MenuItem value="">
//                           <em>Select a vehicle</em>
//                         </MenuItem>
//                         {availableVehicles.map((vehicle, index) => (
//                           <MenuItem
//                             key={vehicle.vehicle_id}
//                             value={vehicle.vehicle_id}
//                             sx={{ py: 1 }}
//                           >
//                             <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//                               <Avatar
//                                 variant="rounded"
//                                 sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
//                               >
//                                 <DirectionsCar fontSize="small" />
//                               </Avatar>
//                               <Box sx={{ flexGrow: 1 }}>
//                                 <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                                   {vehicle.model || vehicle.vehicle_type}
//                                 </Typography>
//                                 <Typography variant="caption" color="text.secondary">
//                                   {vehicle.license_plate} • Capacity: {vehicle.seating_capacity} • {vehicle.category}
//                                 </Typography>
//                               </Box>
//                             </Box>
//                           </MenuItem>
//                         ))}
//                       </Select>
//                       {errors.vehicleId && (
//                         <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
//                           {errors.vehicleId}
//                         </Typography>
//                       )}
//                     </FormControl>
//                   )}
//                 </Grid>
//               </Grid>
//             )}
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
//               <AttachMoney sx={{ mr: 1, color: '#FDCB42' }} />
//               Cost Breakdown
//             </Typography>
//             <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid #FDCB42' }}>
//               <CardContent>
//                 <TableContainer>
//                   <Table size="small">
//                     <TableBody>
//                       <TableRow>
//                         <TableCell sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2">Fixed Rate:</Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2" fontWeight="bold">
//                             {formatCurrency(500)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                       <TableRow>
//                         <TableCell sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2">
//                             Distance ({distance} km × {formatCurrency(80)}/km):
//                           </Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                           <Typography variant="body2" fontWeight="bold">
//                             {formatCurrency(distance * 80)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                       {requestData?.category && (
//                         <TableRow>
//                           <TableCell sx={{ border: 'none', py: 0.5 }}>
//                             <Typography variant="body2">
//                               {requestData.category} Category:
//                             </Typography>
//                           </TableCell>
//                           <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
//                             <Typography variant="body2" fontWeight="bold">
//                               {formatCurrency(
//                                 {
//                                   'Luxury': 3500,
//                                   'Safari': 2800,
//                                   'Tour': 2000,
//                                   'Adventure': 2200,
//                                   'Casual': 1500,
//                                   'Cultural': 1800,
//                                   'Business': 2500,
//                                   'Airport': 1200
//                                 }[requestData.category] || 1500
//                               )}
//                             </Typography>
//                           </TableCell>
//                         </TableRow>
//                       )}
//                       <TableRow>
//                         <TableCell sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
//                           <Typography variant="h6" fontWeight="bold" color="#FDCB42">
//                             Total Cost:
//                           </Typography>
//                         </TableCell>
//                         <TableCell align="right" sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
//                           <Typography variant="h6" fontWeight="bold" color="#FDCB42">
//                             {assignmentData.estimatedCost
//                               ? formatCurrency(assignmentData.estimatedCost)
//                               : formatCurrency(0)}
//                           </Typography>
//                         </TableCell>
//                       </TableRow>
//                     </TableBody>
//                   </Table>
//                 </TableContainer>
//               </CardContent>
//             </Card>
//           </Grid>

//           {assignmentData.driverId && assignmentData.vehicleId && assignmentData.estimatedCost && (
//             <Grid item xs={12}>
//               <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', mt: 2 }}>
//                 <CardContent>
//                   <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
//                     <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
//                     Ready to Assign
//                   </Typography>
//                   <Grid container spacing={2}>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Selected Driver</Typography>
//                       {selectedDriver && (
//                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                           <Avatar
//                             src={selectedDriver.profile_image}
//                             sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#FDCB42' }}
//                           >
//                             {!selectedDriver.profile_image && getInitials(selectedDriver.name)}
//                           </Avatar>
//                           <Box>
//                             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                               {selectedDriver.name}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               {selectedDriver.license_type} • ⭐ {selectedDriver.rating}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       )}
//                     </Grid>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Selected Vehicle</Typography>
//                       {selectedVehicle && (
//                         <Box>
//                           <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
//                             {selectedVehicle.model || selectedVehicle.vehicle_type}
//                           </Typography>
//                           <Typography variant="caption" color="text.secondary">
//                             {selectedVehicle.license_plate} • {selectedVehicle.category}
//                           </Typography>
//                         </Box>
//                       )}
//                     </Grid>
//                     <Grid item xs={12} md={4}>
//                       <Typography variant="subtitle2" gutterBottom>Total Cost</Typography>
//                       <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
//                         {formatCurrency(assignmentData.estimatedCost)}
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         {distance} km • {requestData?.category || 'Standard'} category
//                       </Typography>
//                     </Grid>
//                   </Grid>
//                 </CardContent>
//               </Card>
//             </Grid>
//           )}
//         </Grid>
//       </DialogContent>

//       <DialogActions sx={{ p: 3, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
//         <Button
//           onClick={onClose}
//           variant="outlined"
//           fullWidth={isMobile}
//         >
//           Cancel
//         </Button>
//         <Button
//           onClick={handleAssign}
//           variant="contained"
//           sx={{
//             bgcolor: '#FDCB42',
//             '&:hover': { bgcolor: '#fbbf24' },
//             fontWeight: 'bold'
//           }}
//           disabled={loading || !assignmentData.driverId || !assignmentData.vehicleId || !assignmentData.estimatedCost}
//           fullWidth={isMobile}
//         >
//           {loading ? 'Assigning...' : `Assign Trip - ${assignmentData.estimatedCost ? formatCurrency(assignmentData.estimatedCost) : 'LKR 0'}`}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default TripScheduler;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  Person,
  AttachMoney,
  Close as CloseIcon,
  Assignment,
  CheckCircle,
  CalendarToday,
  PersonAdd
} from '@mui/icons-material';
import UserService from '../../services/UserService';

const TripScheduler = ({
  open,
  onClose,
  onSave,
  requestData = null,
  isMobile = false
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [assignmentData, setAssignmentData] = useState({
    driverId: '',
    vehicleId: '',
    estimatedCost: ''
  });

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (open && requestData) {
      setDistance(requestData.estimated_distance_km || estimateDistance());
      fetchAvailableResources();
      setAssignmentData({
        driverId: '',
        vehicleId: '',
        estimatedCost: '8248'
      });
    }
  }, [open, requestData]);

  useEffect(() => {
    if (assignmentData.driverId && assignmentData.vehicleId && distance) {
      const calculatedCost = calculateBasicCost();
      setAssignmentData(prev => ({
        ...prev,
        estimatedCost: calculatedCost.totalCost.toString()
      }));
    }
  }, [assignmentData.driverId, assignmentData.vehicleId, distance, requestData]);

  const estimateDistance = () => Math.floor(Math.random() * 150) + 30;


  const DUMMY_VEHICLES = [
  {
    vehicle_id: '0ddf30ab-9eba-4bfb-9d34-afe4f0e6c426',
    vehicle_type: 'Hilux',
    model: 'Toyota',
    year: '2005',
    seating_capacity: 3,
    color: 'Red',
    ownership: 'Nimnadi',
    registration_province: 'Banadarwela',
    license_plate: 'Rc4456y',
    chassis_no: 'vc-556',
    registration_date: '2022-02-14',
    expiry_date: '2029-10-31',
    insurance: 'Complete',
    category: 'Adventure',
    image_url: 'https://firebasestorage.googleapis.com/v0/b/imsystem-78316.appspot.com/o/VehicleProfile%2F1756718434306_hilux.jpg?alt=media&token=aa6f9808-48f0-4d27-9dbe-7b46fe5fffc7',
    created_at: '2025-08-19 21:58:23',
    availability: 'Available'
  },

];
  
  const fetchAvailableResources = async () => {
    try {
      setResourcesLoading(true);

      // Fetch drivers
      const usersResponse = await UserService.getAllUsers().catch(() => []);
      let driversData = [];
      if (usersResponse && Array.isArray(usersResponse)) {
        const driverUsers = usersResponse.filter(
          user => user.role_name === 'driver' && user.status !== 'inactive'
        );

        const driversWithProfiles = await Promise.all(
          driverUsers.map(async (user) => {
            try {
              const driverProfile = await UserService.getDriverProfileByEmail(user.email);
              return {
                user_id: user.id,
                driver_id: user.id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
                email: user.email,
                profile_image: driverProfile?.image_url || user.image_url || '',
                phone: driverProfile?.mobile || 'N/A',
                license_type: driverProfile?.license_type || 'Standard License',
                experience_years: driverProfile?.experience_years || 0,
                rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                availability: driverProfile?.availability || 'Available'
              };
            } catch {
              return {
                user_id: user.id,
                driver_id: user.id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown Driver',
                email: user.email,
                profile_image: user.image_url || '',
                phone: 'Profile not created',
                license_type: 'N/A',
                experience_years: 0,
                rating: 0,
                availability: 'Available'
              };
            }
          })
        );

        driversData = driversWithProfiles.filter(
          driver => driver.availability?.toLowerCase() === 'available'
        );
      }

      // // Fetch vehicles from DB
      // const vehiclesResponse = await UserService.getAllVehicles().catch(() => []);
      // let vehiclesData = [];
      // if (vehiclesResponse && Array.isArray(vehiclesResponse)) {
      //   vehiclesData = vehiclesResponse
      //     .filter(vehicle =>
      //       vehicle.seating_capacity >= (requestData?.passenger_count || 1)
      //     );
      // }

       let vehiclesData = DUMMY_VEHICLES.filter(
      vehicle => vehicle.seating_capacity >= (requestData?.passenger_count || 1)
    );

      setAvailableDrivers(driversData);
      setAvailableVehicles(vehiclesData);

      if (driversData.length === 0) {
        setErrors(prev => ({
          ...prev,
          drivers: `No drivers available at the moment.`
        }));
      }

      if (vehiclesData.length === 1) {
        setErrors(prev => ({
          ...prev,
          vehicles: `.`
        }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        fetch: 'Failed to load available drivers and vehicles. Please try again.'
      }));
      setAvailableDrivers([]);
      setAvailableVehicles([]);
    } finally {
      setResourcesLoading(false);
    }
  };

  // Cost calculation: fixedRate + (distance * perKmRate) + categoryAmount
  const calculateBasicCost = () => {
    const pricingConfig = {
      fixedRate: 500,
      perKmRate: 80,
      categoryRates: {
        'Luxury': 3500,
        'Safari': 2800,
        'Tour': 2000,
        'Adventure': 2200,
        'Casual': 1500,
        'Cultural': 1800,
        'Business': 2500,
        'Airport': 1200
      }
    };
    const tripCategory = requestData?.category || 'Casual';
    const fixedRate = pricingConfig.fixedRate;
    const distanceCost = distance * pricingConfig.perKmRate;
    const categoryAmount = pricingConfig.categoryRates[tripCategory] || pricingConfig.categoryRates['Casual'];
    const totalCost = fixedRate + distanceCost + categoryAmount;
    return {
      fixedRate,
      distanceCost,
      categoryAmount,
      categoryName: tripCategory,
      totalCost: Math.ceil(totalCost)
    };
  };

  const handleDriverAssign = (driverId) => {
    setAssignmentData(prev => ({
      ...prev,
      driverId: driverId
    }));
    if (errors.driverId) {
      setErrors(prev => ({
        ...prev,
        driverId: undefined
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!assignmentData.driverId) newErrors.driverId = 'Driver selection is required';
    if (!assignmentData.vehicleId) newErrors.vehicleId = 'Vehicle selection is required';
    if (!assignmentData.estimatedCost) newErrors.estimatedCost = 'Estimated cost is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssign = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const tripToSave = {
        ...requestData,
        assigned_driver_id: assignmentData.driverId,
        assigned_vehicle_id: assignmentData.vehicleId,
        estimated_cost: assignmentData.estimatedCost,
        estimated_distance_km: distance,
        status: 'confirmed'
      };
      await onSave(tripToSave);
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to assign trip. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const formatCurrency = (amount) => new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount));

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      return `${formattedDate} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    return location.length > 30 ? `${location.substring(0, 30)}...` : location;
  };

  // Get selected driver and vehicle for summary
  const selectedDriver = availableDrivers.find(d => d.user_id === assignmentData.driverId);
  const selectedVehicle = availableVehicles.find(v => v.vehicle_id === assignmentData.vehicleId);

  if (!requestData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isSmallScreen}
      PaperProps={{
        sx: {
          minHeight: isSmallScreen ? '100vh' : '80vh',
          m: isSmallScreen ? 0 : 2
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#FDCB42',
        color: 'black',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 1 }} />
          Assign Trip to Driver & Vehicle
        </Box>
        {isSmallScreen && (
          <IconButton onClick={onClose} sx={{ color: 'black' }}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        {errors.fetch && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.fetch}
          </Alert>
        )}

        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FDCB42', fontWeight: 'bold', mb: 2 }}>
              Trip Overview - {requestData?.category || 'Standard'} Trip
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                  <strong>{formatDateTime(requestData.preferred_date, requestData.preferred_time)}</strong>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'info.main', fontSize: 16 }} />
                  <strong>{requestData.passenger_count || 1} passengers</strong> • {requestData.contact_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                  <strong>From:</strong> {formatLocation(requestData.origin)}
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
                  <strong>To:</strong> {formatLocation(requestData.destination)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {resourcesLoading ? (
            <Box display="flex" alignItems="center" gap={2} justifyContent="center" py={4}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading available resources...</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: '#FDCB42' }} />
                  Available Drivers ({availableDrivers.length})
                </Typography>
                {errors.drivers && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {errors.drivers}
                  </Alert>
                )}
                {availableDrivers.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No drivers available at the moment.
                    <br />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      • Ensure drivers are marked as available
                      • Consider expanding search criteria
                    </Typography>
                  </Alert>
                ) : (
                  <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Box>
                      {availableDrivers.map((driver, index) => (
                        <Box
                          key={driver.user_id || driver.driver_id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: assignmentData.driverId === driver.user_id ? '#FDCB42' : 'transparent',
                            border: assignmentData.driverId === driver.user_id ? '2px solid #FDCB42' : 'none',
                            borderRadius: 1,
                            mb: 1,
                            p: 1
                          }}
                        >
                          <Avatar
                            src={driver.profile_image}
                            sx={{ width: 48, height: 48, bgcolor: '#FDCB42', mr: 2 }}
                          >
                            {!driver.profile_image && getInitials(driver.name)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {driver.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.license_type} • {driver.experience_years} years • ⭐ {driver.rating}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.phone}
                            </Typography>
                          </Box>
                          <Chip
                            label={driver.availability}
                            size="small"
                            color={driver.availability?.toLowerCase() === 'available' ? 'success' : 'default'}
                            sx={{ ml: 1 }}
                          />
                          <Button
                            variant={assignmentData.driverId === driver.user_id ? "contained" : "outlined"}
                            size="small"
                            startIcon={<PersonAdd />}
                            onClick={() => handleDriverAssign(driver.user_id)}
                            disabled={driver.availability?.toLowerCase() !== 'available'}
                            sx={{
                              bgcolor: assignmentData.driverId === driver.user_id ? '#FDCB42' : 'transparent',
                              borderColor: '#FDCB42',
                              color: assignmentData.driverId === driver.user_id ? 'black' : '#FDCB42',
                              ml: 2,
                              fontWeight: assignmentData.driverId === driver.user_id ? 'bold' : 'normal',
                              '&:hover': {
                                bgcolor: assignmentData.driverId === driver.user_id ? '#fbbf24' : 'rgba(253, 203, 66, 0.1)'
                              }
                            }}
                          >
                            {assignmentData.driverId === driver.user_id ? 'Selected' : 'Assign'}
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <DirectionsCar sx={{ mr: 1, color: '#FDCB42' }} />
                  Select Vehicle ({DUMMY_VEHICLES.length} available)
                </Typography>
                {DUMMY_VEHICLES.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No vehicles available.
                  </Alert>
                ) : (
                  <FormControl fullWidth error={!!errors.vehicleId}>
                    <InputLabel>Available Vehicles</InputLabel>
                    <Select
                      value={assignmentData.vehicleId}
                      label="Available Vehicles"
                      onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a vehicle</em>
                      </MenuItem>
                      {DUMMY_VEHICLES.map((vehicle, index) => (
                        <MenuItem
                          key={vehicle.vehicle_id}
                          value={vehicle.vehicle_id}
                          sx={{
                            py: 1,
                            bgcolor: assignmentData.vehicleId === vehicle.vehicle_id ? '#FDCB42' : 'transparent',
                            fontWeight: assignmentData.vehicleId === vehicle.vehicle_id ? 'bold' : 'normal'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Avatar
                              variant="rounded"
                              src={vehicle.image_url}
                              sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}
                            >
                              <DirectionsCar fontSize="small" />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {vehicle.model || vehicle.vehicle_type}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vehicle.license_plate} • Capacity: {vehicle.seating_capacity} • {vehicle.category}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.vehicleId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.vehicleId}
                      </Typography>
                    )}
                  </FormControl>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney sx={{ mr: 1, color: '#FDCB42' }} />
            Cost Breakdown
          </Typography>
          <Card sx={{ bgcolor: 'rgba(253, 203, 66, 0.05)', border: '1px solid #FDCB42' }}>
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">Fixed Rate:</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(500)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">
                          Distance ({distance} km × {formatCurrency(80)}/km):
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(distance * 80)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                      {requestData?.category && (
                        <TableRow>
                          <TableCell sx={{ border: 'none', py: 0.5 }}>
                            <Typography variant="body2">
                              {requestData.category} Category:
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(1500)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="#FDCB42">
                            Total Cost: 
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderTop: '2px solid #FDCB42', py: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="#FDCB42">
                            {/* {assignmentData.driverId && assignmentData.vehicleId
                              ? formatCurrency(500 + distance * 80 + 1500)
                              : formatCurrency(0)} */}
                              LKR 8248
                          </Typography>
                        </TableCell>
                      </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {assignmentData.driverId && assignmentData.vehicleId && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ready to Assign
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Selected Driver</Typography>
                    {selectedDriver && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={selectedDriver.profile_image}
                          sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#FDCB42' }}
                        >
                          {!selectedDriver.profile_image && getInitials(selectedDriver.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {selectedDriver.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedDriver.license_type} • ⭐ {selectedDriver.rating}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Selected Vehicle</Typography>
                    {selectedVehicle && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {selectedVehicle.model || selectedVehicle.vehicle_type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedVehicle.license_plate} • {selectedVehicle.category}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>Total Cost</Typography>
                    {/* <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {formatCurrency(
                        500 +
                        distance * 80 +
                        ({
                          'Luxury': 3500,
                          'Safari': 2800,
                          'Tour': 2000,
                          'Adventure': 2200,
                          'Casual': 1500,
                          'Cultural': 1800,
                          'Business': 2500,
                          'Airport': 1200
                        }[requestData.category] || 1500)
                      )}
                    </Typography> */}
                    <Typography variant="caption" color="text.secondary">
                      {distance} km • {requestData?.category || 'Standard'} category
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
        <Button
          onClick={handleAssign}
          variant="outlined"
          fullWidth={isMobile}
        >
          Cancel
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#FDCB42',
            '&:hover': { bgcolor: '#fbbf24' },
            fontWeight: 'bold'
          }}
          disabled={loading }
          fullWidth={isMobile}
        >
          {loading ? 'Assigning...' : `Assign Trip - ${assignmentData.estimatedCost ? formatCurrency(assignmentData.estimatedCost) : 'LKR 8248'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripScheduler;