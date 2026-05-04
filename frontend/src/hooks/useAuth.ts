'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // We could verify token or fetch user profile here
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    setUser({ token });
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return { user, loading, login, logout };
}
