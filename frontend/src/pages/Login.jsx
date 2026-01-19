import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';
import api from '../config/api';
import AuthLayout from '../components/layouts/AuthLayout';
import { TextField, Button, ToggleButtonGroup, ToggleButton, CircularProgress, Box } from '@mui/material';
import { Person, Business } from '@mui/icons-material';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('manager');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();
      
      const response = await api.post('/api/auth/login', { idToken });
      
      if (response.data.user.role === selectedRole) {
        toast.success('Login successful!');
        navigate(selectedRole === 'manager' ? '/manager' : '/employee');
      } else {
        toast.error('Invalid role selected');
        await auth.signOut();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={selectedRole}
          exclusive
          onChange={(e, value) => value && setSelectedRole(value)}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.9375rem',
              fontWeight: 600,
              border: 'none',
              bgcolor: '#f1f5f9',
              '&.Mui-selected': {
                bgcolor: 'white',
                color: '#1e40af',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  bgcolor: 'white',
                }
              }
            }
          }}
        >
          <ToggleButton value="manager">
            <Business sx={{ mr: 1, fontSize: 20 }} /> Manager
          </ToggleButton>
          <ToggleButton value="employee">
            <Person sx={{ mr: 1, fontSize: 20 }} /> Employee
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <form onSubmit={handleSubmit} className="auth-form">
        <TextField
          fullWidth
          label="Email address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="name@company.com"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '&:hover fieldset': {
                borderColor: '#3b82f6',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
              }
            }
          }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          placeholder="Enter your password"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              '&:hover fieldset': {
                borderColor: '#3b82f6',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
              }
            }
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            mt: 1,
            py: 1.5,
            borderRadius: '10px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 20px rgba(30, 64, 175, 0.3)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              opacity: 0.6,
            }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: 'white' }} />
              Signing in...
            </Box>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button onClick={() => navigate('/')} className="link-btn">
            Sign up
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
