// services/userApi.ts

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  position?: string;
  bio?: string;
  avatarUrl?: string;             // ← any yox, string
  language: 'az' | 'ru' | 'en';
  createdAt: string;
  updatedAt?: string;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/me', {
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch profile');
  }
  return json.data;
}

export async function updateProfile(
  patch: Partial<UserProfile>
): Promise<UserProfile> {
  const res = await fetch('/api/user/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update profile');
  }
  return json.data;
}

// ← YENİ
export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);

  const res = await fetch('/api/user/me/avatar', {
    method: 'POST',
    credentials: 'include',
    body: form,   // ⚠️ Content-Type set etmə — brauzer özü boundary ilə qoyur
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Avatar yüklənmədi');
  }
  return json.data.avatarUrl;
}