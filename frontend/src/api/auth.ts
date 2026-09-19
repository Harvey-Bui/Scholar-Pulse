import { apiFetch } from './client';
import type { User } from './types';

export const authApi = {
  me: () => apiFetch<User>('/auth/me'),
  login: (email: string, password: string) => apiFetch<User>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, password: string, name: string) =>
    apiFetch<User>('/auth/register', { method: 'POST', body: { email, password, name } }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
};
