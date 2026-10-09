import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: any | null;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo> => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error('Google token etibarsızdır');

  if (!payload.email) throw new Error('Google hesabında email yoxdur');

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || null
  };
};