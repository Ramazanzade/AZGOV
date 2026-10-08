import axios from 'axios';
import { User } from '../types/auth';

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true  // ← httpOnly cookie üçün VACİB
});

export const sendOtp = async (email: string): Promise<void> => {
  await api.post('/send-otp', { email });
};

export const verifyOtp = async (email: string, code: string): Promise<User> => {
  const res = await api.post('/verify-otp', { email, code });
  return res.data.user;
};

export const getMe = async (): Promise<User | null> => {
  try {
    const res = await api.get('/me');
    return res.data.user;
  } catch {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await api.post('/logout');
};