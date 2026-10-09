import axios from 'axios';
import { User } from '../types/auth';

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true  // ← httpOnly cookie üçün VACİB
});
export interface RegisterResponse {
  needsVerification: boolean;
  email: string;
  message: string;
}
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<RegisterResponse> => {
  const res = await api.post('/register', { email, password, name });
  return res.data;
};
export const verifySignup = async (email: string, code: string): Promise<User> => {
  const res = await api.post('/verify-signup', { email, code });
  return res.data.user;
};
export const loginWithPassword = async (email: string, password: string): Promise<User> => {
  const res = await api.post('/login', { email, password });
  return res.data.user;
};
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
export const googleAuth = async (idToken: string): Promise<User> => {
  const res = await api.post('/google', { idToken });
  return res.data.user;
};
export const logout = async (): Promise<void> => {
  await api.post('/logout');
};