import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";

import UserService from "../services/UserService";
import AuthService from "../services/AuthServices";
import Navbar from "../components/common/Navbar";
import Header from "../components/common/Header";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false); 
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const token = AuthService.getToken?.() || null;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UserService.getAllUsers();
        setUsers(response);
      } catch (err) {
        console.error(err);
        setError("Failed to load users.");
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleOpen = () => {
    setError("");
    setMessage("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewUser({ first_name: "", last_name: "", email: "", role_name: "" });
  };

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const findUserByEmail = async (email) => {
    try {
      const res = await UserService.findUserByEmail(email);
      return res.exists === true;
    } catch (error) {
      console.error("Email check failed:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.role_name) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const exists = await findUserByEmail(newUser.email);
    if (exists) {
      setError("A user with this email already exists.");
      setLoading(false);
      return;
    }

    try {
      const tempPassword = Math.random().toString(36).slice(-8);

      const response = await AuthService.createProfile(
        {
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          role: newUser.role_name,
        },
        token
      );

      try {
        await AuthService.sendInvitationEmail(
          newUser.email,
          `Your temporary password is: ${tempPassword}`
        );
      } catch (emailError) {
        console.warn("Email sending failed:", emailError.message);
      }
      setUsers([...users, { ...newUser, id: users.length + 1 }]);
      handleClose();
      setSuccessOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error creating user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex">
      <Navbar />
      <Box flexGrow={1}>
        <Header />
        <Container sx={{ mt: 4 }}>
          <Typography variant="h5" mb={2}>System Users</Typography>

          <Box mb={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{
                backgroundColor: "#FDCB42", 
                color: "white",
                '&:hover': { backgroundColor: "#fbbf24" },
                px: 8
              }}
            >
              Register
            </Button>
          </Box>

          {/* Registration dialog */}
          <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>Add new user</DialogTitle>
            <DialogContent>
              <TextField
                label="First Name"
                name="firstName"
                fullWidth
                margin="normal"
                value={newUser.first_name}
                onChange={handleChange}
              />
              <TextField
                label="Last Name"
                name="last_name"
                fullWidth
                margin="normal"
                value={newUser.last_name}
                onChange={handleChange}
              />
              <TextField
                label="Email"
                name="email"
                fullWidth
                margin="normal"
                value={newUser.email}
                onChange={handleChange}
              />
              <TextField
                select
                label="Role"
                name="role"
                fullWidth
                margin="normal"
                value={newUser.role_name}
                onChange={handleChange}
                SelectProps={{ native: true }}
              >
                <option value="">Select Role</option>
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="tour-operator">Tour Operator</option>
                <option value="driver">Driver</option>
              </TextField>
              {error && <Typography color="error">{error}</Typography>}
            </DialogContent>
            <DialogActions sx={{ px: 6, pb: 2 }}>
              <Button onClick={handleClose} sx={{
                backgroundColor: "Gray", 
                color: "white",
                '&:hover': { backgroundColor: "black" },
                px: 8
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{
                backgroundColor: "#FDCB42", 
                color: "white",
                '&:hover': { backgroundColor: "#fbbf30" },
                px: 8
              }}>
                {loading ? <CircularProgress size={20} /> : "Register"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Success dialog */}
          <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth>
            <DialogContent sx={{ textAlign: "center", py: 4 }}>
              <Box
                sx={{
                  backgroundColor: "green",
                  color: "white",
                  borderRadius: "50%",
                  width: 60,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  fontSize: 30,
                }}
              >
                ✓
              </Box>
              <Typography variant="h6" gutterBottom>Success</Typography>
              <Typography variant="body2" mb={2}>
                New user created! Login details have been shared via email.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSuccessOpen(false)}
                sx={{
                  backgroundColor: "#FDCB42",
                  color: "white",
                  '&:hover': { backgroundColor: "#fbbf24" },
                  px: 6
                }}
              >
                OK
              </Button>
            </DialogContent>
          </Dialog>

          {fetchingUsers ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;