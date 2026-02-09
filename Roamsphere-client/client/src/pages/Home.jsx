import React, { useEffect, useState } from 'react';
import AuthService from '../services/AuthServices'; 

const Home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    if (token) {
      AuthService.getUser(token)
        .then((data) => setUser(data))
        .catch((error) => console.error('Error fetching user:', error));
    }
  }, []);

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {user ? (
        <div>
          <p>Welcome back, {user.name}!</p>
        </div>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};

export default Home;
