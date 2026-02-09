import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './assets/styles/leaflet-custom.css'
import Home from './pages/Home'
import Login from './components/authentication/Login'
import Signup from './components/authentication/Signup'
import OTPVerification from './components/authentication/otpVerification'
import SetPassword from './components/authentication/SetPassword'
import Dashboard from './pages/Dashboard'
import AddVehicle from './pages/vehiclePages/AddVehicle'
import AddDriver from './pages/driverPages/AddDriver'

import VehicleList from './pages/vehiclePages/VehicleList'
import ViewVehicle from './pages/vehiclePages/ViewVehicle'
import DriverLeaderboard from './pages/driverPages/DriverLeaderboard'
import TripSchedule from './pages/tripPages/TripSchedule'
import TripScheduler from './pages/tripPages/TripScheduler'
import TrackLocation from './pages/tripPages/TripTracker'
import MenuSettings from './pages/settingsPages/MenuSettings'
import TourOperatorDashboard from './pages/Dashboard/TODashboard'
import DriverDashboard from './pages/driverPages/DriverDashboard'
import DriverProfile from './pages/driverPages/DriverProfile'
import DriverPerformance from './pages/driverPages/DriverPerformance'
import DriverList from './pages/driverPages/DriverList'
import TripRequest from './pages/customerPages/TripRequest'

import CustomerDashboard from './pages/customerPages/CustomerDashboard'
import CustomerRegistration from './pages/customerPages/CustomerRegistration'
import CustomerLogin from './pages/customerPages/CustomerLogin'
import CustomerTripTracker from './pages/customerPages/CustomerTripTracker'
import LocationPicker from './components/location/LocationPicker'
import AvailableVehicles from './pages/customerPages/AvailableVehicle'

function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/users' element={<Dashboard />} />
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/verifyotp' element={<OTPVerification />} />
        <Route path='/setpassword' element={<SetPassword />} />
        <Route path='/addvehicle' element={<AddVehicle/>} />
        <Route path='/adddriver' element={<AddDriver/>} />

        <Route path='/vehiclelist' element={<VehicleList/>} />
        <Route path='/vehicle/:vehicleId' element={<ViewVehicle/>} />
        <Route path='/driver-leaderboard' element={<DriverLeaderboard/>} />
        <Route path='/trip-schedule' element={<TripSchedule/>} />
        <Route path='/trip-scheduler' element={<TripScheduler />} />
        <Route path='/track-location' element={<TrackLocation />} />
        <Route path='/menu-settings' element={<MenuSettings/>} />
        <Route path='/tour-operator-dashboard' element={<TourOperatorDashboard/>} />
        
        <Route path='/driver-dashboard' element={<DriverDashboard/>} />
        <Route path='/driver-list' element={<DriverList />} />
        <Route path='/driver-profile' element={<DriverProfile />} />
        <Route path='/my-performance' element={<DriverPerformance />} />
        <Route path='/my-trips' element={<TripSchedule />} />

        <Route path='/request-trip' element={<TripRequest />} />

        <Route path='/customer-dashboard' element={<CustomerDashboard />} />
        <Route path='/customer-register' element={<CustomerRegistration />} />
        <Route path='/customer-login' element={<CustomerLogin />} />
        <Route path='/select-location' element={<LocationPicker />} />
        <Route path='/available-vehicles' element={<AvailableVehicles />} />
        <Route path='/customer-trip-tracker' element={<CustomerTripTracker />} />

      </Routes>
    </div>
  )
}

export default App