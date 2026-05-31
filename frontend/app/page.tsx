'use client';

import React from 'react';
import { useAuth } from '../lib/AuthContext';
import LandingPage from '../components/LandingPage';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  // Show nothing while checking auth status to avoid flashes
  if (loading) {
    return null;
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

