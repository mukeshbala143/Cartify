import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('cartify_user');
    const token = localStorage.getItem('cartify_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('cartify_token', data.token);
    const profile = await API.get('/auth/profile');
    localStorage.setItem('cartify_user', JSON.stringify(profile.data.user));
    setUser(profile.data.user);
    return profile.data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    return data;
  };

  const googleAuth = async (credential) => {
    const { data } = await API.post('/auth/google', { credential });
    localStorage.setItem('cartify_token', data.token);
    localStorage.setItem('cartify_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('cartify_token');
    localStorage.removeItem('cartify_user');
    localStorage.removeItem('cartify_wishlist');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const phoneLogin = (token, userData) => {
    localStorage.setItem('cartify_token', token);
    localStorage.setItem('cartify_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, login, register, googleAuth, phoneLogin, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);